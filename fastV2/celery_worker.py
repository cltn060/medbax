"""
Celery Worker for Background PDF Ingestion.
Handles heavy processing asynchronously to prevent API blocking.
"""

"""
Celery Worker for Background PDF Ingestion.
Handles heavy processing asynchronously to prevent API blocking.
"""
# --- ADD THESE LINES START ---
from dotenv import load_dotenv
import os
load_dotenv()  # This forces loading the .env file immediately
# --- ADD THESE LINES END ---

import shutil
# ... rest of the file
from pathlib import Path
from typing import Dict, Any
from celery import Celery, states
from celery.exceptions import SoftTimeLimitExceeded

from config import (
    CELERY_BROKER_URL,
    CELERY_RESULT_BACKEND,
    CELERY_TASK_TRACK_STARTED,
    CELERY_TASK_TIME_LIMIT,
    CHUNK_MAX_CHARACTERS,
    CHUNK_NEW_AFTER_N_CHARS,
    CHUNK_COMBINE_UNDER_N_CHARS,
)
from unstructured_processor import process_pdf, chunk_by_title, flatten_metadata
from retriever import add_documents

# ============================================================================
# Celery App Configuration
# ============================================================================

app = Celery('medbox_rag')

app.conf.update(
    broker_url=CELERY_BROKER_URL,
    result_backend=CELERY_RESULT_BACKEND,
    task_track_started=CELERY_TASK_TRACK_STARTED,
    task_time_limit=CELERY_TASK_TIME_LIMIT,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Performance
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# ============================================================================
# Background Ingestion Task
# ============================================================================

@app.task(bind=True, name='medbox_rag.ingest_pdf')
def ingest_pdf_task(
    self,
    temp_file_path: str,
    filename: str,
    collection_name: str,
    document_id: str
) -> Dict[str, Any]:
    """
    Background task for PDF ingestion with advanced extraction.
    
    Args:
        self: Celery task instance (for progress updates)
        temp_file_path: Path to temporarily saved PDF
        filename: Original filename
        collection_name: Target collection
        document_id: Unique document ID
    
    Returns:
        Dict with processing results or error details
    """
    
    try:
        # Update task state to PROCESSING
        self.update_state(
            state='PROCESSING',
            meta={
                'step': 'extracting_content',
                'filename': filename,
                'message': 'Extracting text, images, and tables from PDF...'
            }
        )
        
        # Step 1: Extract content using unstructured.io
        try:
            blocks = process_pdf(temp_file_path, filename)
        except Exception as e:
            return {
                'status': 'FAILURE',
                'error': f"PDF extraction failed: {str(e)}",
                'step': 'extraction'
            }
        
        if not blocks:
            return {
                'status': 'FAILURE',
                'error': "PDF appears to be empty or unreadable",
                'step': 'extraction'
            }
        
        # Calculate page count
        page_numbers = set()
        for block in blocks:
            if "page_number" in block["metadata"]:
                page_numbers.add(block["metadata"]["page_number"])
        page_count = len(page_numbers) if page_numbers else 1
        
        # Update task state
        self.update_state(
            state='PROCESSING',
            meta={
                'step': 'chunking',
                'filename': filename,
                'blocks_extracted': len(blocks),
                'page_count': page_count,
                'message': f'Chunking {len(blocks)} blocks into semantic units...'
            }
        )
        
        # Step 2: Chunk semantically
        chunks = chunk_by_title(
            blocks,
            max_characters=CHUNK_MAX_CHARACTERS,
            new_after_n_chars=CHUNK_NEW_AFTER_N_CHARS,
            combine_text_under_n_chars=CHUNK_COMBINE_UNDER_N_CHARS,
        )
        
        # Step 3: Prepare data for storage
        texts = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            texts.append(chunk["text"])
            
            # Flatten metadata and add required fields
            flat_meta = flatten_metadata(chunk["metadata"])
            flat_meta["document_id"] = document_id
            flat_meta["chunk_index"] = str(i)
            
            # Determine data_type based on content
            contains = chunk["metadata"].get("contains", [])
            if isinstance(contains, (list, set)):
                contains = list(contains)
            else:
                contains = [contains] if contains else []
            
            if "image_summary" in contains:
                flat_meta["data_type"] = "image_summary"
            elif "table_html" in contains:
                flat_meta["data_type"] = "table_html"
            else:
                flat_meta["data_type"] = "text"
            
            metadatas.append(flat_meta)
            ids.append(f"{document_id}_chunk_{i}")
        
        # Update task state
        self.update_state(
            state='PROCESSING',
            meta={
                'step': 'embedding',
                'filename': filename,
                'chunks_created': len(chunks),
                'message': f'Generating embeddings for {len(chunks)} chunks...'
            }
        )
        
        # Step 4: Add to vector store (embeddings generated here)
        try:
            chunks_added = add_documents(collection_name, texts, metadatas, ids)
        except Exception as e:
            return {
                'status': 'FAILURE',
                'error': f"Embedding/storage failed: {str(e)}",
                'step': 'embedding',
                'chunks_created': len(chunks)
            }
        
        # Success!
        return {
            'status': 'SUCCESS',
            'document_id': document_id,
            'filename': filename,
            'collection_name': collection_name,
            'chunks_created': chunks_added,
            'page_count': page_count,
            'message': f'Successfully ingested {filename} ({chunks_added} chunks from {page_count} pages)'
        }
    
    except SoftTimeLimitExceeded:
        return {
            'status': 'FAILURE',
            'error': 'Task timed out - PDF too large or processing too slow',
            'step': 'timeout'
        }
    
    except Exception as e:
        return {
            'status': 'FAILURE',
            'error': f'Unexpected error: {str(e)}',
            'step': 'unknown'
        }
    
    finally:
        # Always clean up temp file
        try:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                print(f"✓ Cleaned up temp file: {temp_file_path}")
        except Exception as e:
            print(f"Warning: Failed to clean up temp file: {e}")


# ============================================================================
# Helper Task for Bulk Ingestion (Optional)
# ============================================================================

@app.task(name='medbox_rag.bulk_ingest')
def bulk_ingest_task(pdf_paths: list, collection_name: str) -> Dict[str, Any]:
    """
    Ingest multiple PDFs in sequence (for admin bulk upload).
    
    Args:
        pdf_paths: List of PDF file paths
        collection_name: Target collection
    
    Returns:
        Summary of bulk ingestion results
    """
    results = {
        'total': len(pdf_paths),
        'successful': 0,
        'failed': 0,
        'details': []
    }
    
    for pdf_path in pdf_paths:
        filename = Path(pdf_path).name
        document_id = f"doc_{os.urandom(5).hex()}"
        
        try:
            result = ingest_pdf_task(pdf_path, filename, collection_name, document_id)
            if result.get('status') == 'SUCCESS':
                results['successful'] += 1
            else:
                results['failed'] += 1
            results['details'].append({
                'filename': filename,
                'result': result
            })
        except Exception as e:
            results['failed'] += 1
            results['details'].append({
                'filename': filename,
                'result': {'status': 'FAILURE', 'error': str(e)}
            })
    
    return results


# ============================================================================
# Run Worker
# ============================================================================

if __name__ == '__main__':
    # Start Celery worker
    # Command: celery -A celery_worker worker --loglevel=info --pool=solo (on Windows)
    # Command: celery -A celery_worker worker --loglevel=info (on Linux/Mac)
    app.start()
