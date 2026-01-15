"""
Retriever module - LanceDB with Hybrid Search (Vector + FTS) and Reranking.
Production-grade for 1000+ books with disk-based storage.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Annotated
import numpy as np
import lancedb
from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry
from lancedb.rerankers import LinearCombinationReranker
import pyarrow as pa

from embeddings import embed_text, embed_texts
from config import (
    LANCEDB_PATH,
    TABLE_NAME,
    EMBEDDING_DIMENSION,
    HYBRID_SEARCH_K,
    RERANK_TOP_N,
    VECTOR_WEIGHT,
    KEYWORD_WEIGHT
)

# Metadata fields to include when sending context to LLM
# Filters out unnecessary metadata to reduce token usage
SOURCE_METADATA_LIMITER = [
    "filename",
    "page_number",
    "title",
    "data_type"  # e.g., 'table_html' or 'image_summary'
]

# Initialize LanceDB client
db = lancedb.connect(LANCEDB_PATH)

# ============================================================================
# Schema Definition
# ============================================================================

class MedicalDocument(LanceModel):
    """
    Unified schema for all medical documents.
    Single table supports multiple collections via collection_name filter.
    """
    text: str  # The actual text content
    vector: Annotated[List[float], EMBEDDING_DIMENSION]  # Embedding vector
    collection_name: str  # Filter by knowledge base (e.g., "cardiology", "neurology")
    filename: str  # Source document filename
    page_number: int  # Page number in original PDF
    data_type: str  # 'text', 'table_html', 'image_summary'
    document_id: str  # Unique document identifier
    chunk_id: str  # Unique chunk identifier
    chunk_index: int  # Index within document
    # Optional metadata fields
    element_id: Optional[str] = None
    title: Optional[str] = None
    contains: Optional[str] = None  # Comma-separated list of content types


# ============================================================================
# Table Initialization
# ============================================================================

def get_table():
    """
    Get or create the unified medical knowledge base table.
    Enables full-text search (FTS) for hybrid search.
    """
    if TABLE_NAME not in db.table_names():
        # Create empty table with schema
        table = db.create_table(
            TABLE_NAME,
            schema=MedicalDocument,
            mode="overwrite"
        )
        # Create FTS index for hybrid search
        table.create_fts_index("text", replace=True)
        print(f"✓ Created table '{TABLE_NAME}' with FTS index")
    else:
        table = db.open_table(TABLE_NAME)
        # Ensure FTS index exists
        try:
            table.create_fts_index("text", replace=False)
        except Exception:
            pass  # Index already exists
    
    return table


def recreate_fts_index():
    """Recreate FTS index (useful after bulk inserts)."""
    table = db.open_table(TABLE_NAME)
    table.create_fts_index("text", replace=True)
    print(f"✓ Recreated FTS index for '{TABLE_NAME}'")


# ============================================================================
# Collection Management
# ============================================================================

def collection_exists(collection_name: str) -> bool:
    """Check if a collection has any documents."""
    try:
        table = get_table()
        results = table.search() \
            .where(f"collection_name = '{collection_name}'") \
            .limit(1) \
            .to_list()
        return len(results) > 0
    except Exception:
        return False


def create_collection(collection_name: str):
    """
    'Create' a collection (just validates table exists).
    Collections are virtual - filtered by collection_name.
    """
    get_table()  # Ensure table exists
    return {
        "collection_name": collection_name,
        "message": "Collection namespace ready (virtual collection in unified table)"
    }


def delete_collection(collection_name: str) -> int:
    """Delete all documents in a collection. Returns count of deleted chunks."""
    try:
        table = get_table()
        
        # Count before deletion
        count_results = table.search() \
            .where(f"collection_name = '{collection_name}'") \
            .limit(100000) \
            .to_list()
        count = len(count_results)
        
        if count == 0:
            return 0
        
        # Delete by filter
        table.delete(f"collection_name = '{collection_name}'")
        
        # Recreate FTS index after bulk delete
        recreate_fts_index()
        
        return count
    except Exception as e:
        print(f"Error deleting collection: {e}")
        return 0


def list_collections() -> List[dict]:
    """List all unique collections with stats."""
    try:
        table = get_table()
        df = table.to_pandas()
        
        if df.empty:
            return []
        
        # Group by collection_name
        collections = []
        for collection_name in df['collection_name'].unique():
            collection_df = df[df['collection_name'] == collection_name]
            collections.append({
                "collection_id": collection_name,
                "collection_name": collection_name,
                "chunk_count": len(collection_df),
                "document_count": collection_df['document_id'].nunique()
            })
        
        return collections
    except Exception as e:
        print(f"Error listing collections: {e}")
        return []

def get_collection_stats(collection_name: str) -> dict:
    """Get stats for a specific collection."""
    try:
        table = get_table()
        results = table.search() \
            .where(f"collection_name = '{collection_name}'") \
            .limit(100000) \
            .to_list()
        
        if not results:
            return {
                "collection_id": collection_name,
                "chunk_count": 0,
                "document_count": 0
            }
        
        # Count unique documents
        document_ids = set(r['document_id'] for r in results)
        
        return {
            "collection_id": collection_name,
            "chunk_count": len(results),
            "document_count": len(document_ids)
        }
    except Exception as e:
        print(f"Error getting collection stats: {e}")
        return {
            "collection_id": collection_name,
            "chunk_count": 0,
            "document_count": 0
        }


# ============================================================================
# Document Management
# ============================================================================

def add_documents(
    collection_name: str,
    texts: List[str],
    metadatas: List[dict],
    ids: List[str]
) -> int:
    """
    Add documents to a collection with embeddings.
    
    Args:
        collection_name: Collection to add to
        texts: List of text chunks
        metadatas: List of metadata dicts (must include required fields)
        ids: Unique chunk IDs
    
    Returns:
        Number of chunks added
    """
    if not texts:
        return 0
    
    # Generate embeddings
    embeddings = embed_texts(texts)
    
    # Prepare records
    records = []
    for i, (text, embedding, metadata, chunk_id) in enumerate(zip(texts, embeddings, metadatas, ids)):
        record = {
            "text": text,
            "vector": embedding,
            "collection_name": collection_name,
            "filename": metadata.get("source", "unknown"),
            "page_number": int(metadata.get("page_number", 0)),
            "data_type": metadata.get("data_type", "text"),
            "document_id": metadata.get("document_id", "unknown"),
            "chunk_id": chunk_id,
            "chunk_index": int(metadata.get("chunk_index", i)),
            "element_id": metadata.get("element_id"),
            "title": metadata.get("title"),
            "contains": metadata.get("contains", "")
        }
        records.append(record)
    
    # Add to table
    table = get_table()
    table.add(records)
    
    print(f"✓ Added {len(records)} chunks to collection '{collection_name}'")
    
    # recreate_fts_index()
    
    return len(records)


def delete_document(collection_name: str, document_id: str) -> int:
    """Delete all chunks belonging to a document. Returns number deleted."""
    try:
        table = get_table()
        
        # Count before deletion
        count_results = table.search() \
            .where(f"collection_name = '{collection_name}' AND document_id = '{document_id}'") \
            .limit(10000) \
            .to_list()
        count = len(count_results)
        
        if count == 0:
            return 0
        
        # Delete by filter
        table.delete(f"collection_name = '{collection_name}' AND document_id = '{document_id}'")
        
        # Recreate FTS index after delete
        recreate_fts_index()
        
        return count
    except Exception as e:
        print(f"Error deleting document: {e}")
        return 0


def list_documents(collection_name: str) -> List[dict]:
    """List all unique documents in a collection."""
    try:
        table = get_table()
        results = table.search() \
            .where(f"collection_name = '{collection_name}'") \
            .limit(100000) \
            .to_list()
        
        if not results:
            return []
        
        # Group by document_id
        documents = {}
        for result in results:
            doc_id = result['document_id']
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "source": result['filename'],
                    "chunk_count": 0
                }
            documents[doc_id]['chunk_count'] += 1
        
        return list(documents.values())
    except Exception as e:
        print(f"Error listing documents: {e}")
        return []


# ============================================================================
# Hybrid Search with Reranking
# ============================================================================

def filter_metadata(metadata: dict) -> dict:
    """
    Filter metadata to only include fields specified in SOURCE_METADATA_LIMITER.
    Reduces token usage when sending context to LLM.
    
    Args:
        metadata: Full metadata dictionary from search results
    
    Returns:
        Filtered metadata dictionary with only allowed fields
    """
    return {key: metadata.get(key) for key in SOURCE_METADATA_LIMITER if key in metadata}


def retrieve_context(
    query: str,
    collection_name: str,
    k: int = RERANK_TOP_N
) -> tuple[str, list]:
    """
    Retrieve relevant context using HYBRID SEARCH (Vector + FTS) with reranking.
    
    Args:
        query: The user's question
        collection_name: Which collection to search
        k: Number of final results after reranking
    
    Returns:
        Tuple of (context_string, sources_list):
        - context_string: Formatted context with source citations for LLM
        - sources_list: List of source metadata dicts for frontend citations
    """
    try:
        table = get_table()
        
        # Check if collection has documents
        if not collection_exists(collection_name):
            return "", []
        
        # Generate query embedding and convert to numpy array for LanceDB
        query_vector = np.array(embed_text(query), dtype=np.float32)
        print(f"   🔍 Generated query embedding (dim: {len(query_vector)}, dtype: {query_vector.dtype})")
        
        # ============================================================
        # HYBRID SEARCH: Vector + Full-Text Search with RRF Fusion
        # ============================================================
        
        # 1. Vector Search (semantic similarity)
        vector_results = table.search(query_vector, vector_column_name="vector") \
            .where(f"collection_name = '{collection_name}'") \
            .limit(HYBRID_SEARCH_K) \
            .to_list()
        print(f"   📊 Vector search: {len(vector_results)} results")
        
        # 2. Full-Text Search (keyword matching)
        try:
            fts_results = table.search(query, query_type="fts") \
                .where(f"collection_name = '{collection_name}'") \
                .limit(HYBRID_SEARCH_K) \
                .to_list()
            print(f"   📊 FTS search: {len(fts_results)} results")
        except Exception as fts_error:
            print(f"   ⚠️ FTS search failed (index may not exist): {fts_error}")
            fts_results = []
        
        # 3. Reciprocal Rank Fusion (RRF) to combine results
        # RRF score = 1 / (k + rank), where k=60 is standard
        rrf_k = 60
        scores = {}  # chunk_id -> score
        chunk_data = {}  # chunk_id -> result data
        
        # Score vector results (weighted by VECTOR_WEIGHT)
        for rank, result in enumerate(vector_results):
            chunk_id = result.get('chunk_id', str(rank))
            rrf_score = VECTOR_WEIGHT / (rrf_k + rank + 1)
            scores[chunk_id] = scores.get(chunk_id, 0) + rrf_score
            chunk_data[chunk_id] = result
        
        # Score FTS results (weighted by KEYWORD_WEIGHT)
        for rank, result in enumerate(fts_results):
            chunk_id = result.get('chunk_id', str(rank + 1000))
            rrf_score = KEYWORD_WEIGHT / (rrf_k + rank + 1)
            scores[chunk_id] = scores.get(chunk_id, 0) + rrf_score
            if chunk_id not in chunk_data:
                chunk_data[chunk_id] = result
        
        # Sort by combined score and get top results
        sorted_chunks = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        results = [chunk_data[chunk_id] for chunk_id, _ in sorted_chunks[:HYBRID_SEARCH_K]]
        
        print(f"   ✓ Hybrid search (RRF fusion): {len(results)} combined results")
        
        # Take top K after reranking
        results = results[:k]
        
        if not results:
            return "", []
        
        # Build sources list for frontend and context string for LLM
        sources = []
        context = ""
        
        for result in results:
            text = result['text']
            
            # Filter metadata to only include allowed fields
            filtered_metadata = filter_metadata(result)
            
            filename = filtered_metadata.get('filename', 'Unknown')
            page_number = filtered_metadata.get('page_number', 'N/A')
            data_type = filtered_metadata.get('data_type', 'text')
            title = filtered_metadata.get('title')
            
            # Add to sources list for frontend
            sources.append({
                "filename": filename,
                "page_number": page_number,
                "title": title,
                "data_type": data_type
            })
            
            # Build citation with filtered metadata for LLM context
            citation = f"--- SOURCE: {filename} | Page: {page_number}"
            if title:
                citation += f" | Title: {title}"
            if data_type != 'text':
                type_label = data_type.replace('_', ' ').title()
                citation += f" ({type_label})"
            citation += " ---\n"
            
            context += citation + f"{text}\n\n"
        
        return context.strip(), sources
    
    except Exception as e:
        print(f"Error retrieving context: {e}")
        return "", []


# ============================================================================
# Utility Functions
# ============================================================================

def get_table_info() -> dict:
    """Get overall table statistics."""
    try:
        table = get_table()
        df = table.to_pandas()
        
        return {
            "table_name": TABLE_NAME,
            "total_chunks": len(df),
            "total_collections": df['collection_name'].nunique() if not df.empty else 0,
            "total_documents": df['document_id'].nunique() if not df.empty else 0,
            "storage_path": LANCEDB_PATH
        }
    except Exception as e:
        print(f"Error getting table info: {e}")
        return {
            "table_name": TABLE_NAME,
            "total_chunks": 0,
            "total_collections": 0,
            "total_documents": 0,
            "storage_path": LANCEDB_PATH
        }


def compact_table():
    """
    Compact table to optimize storage and performance.
    Run this periodically after many deletes/updates.
    """
    try:
        table = get_table()
        table.compact_files()
        print(f"✓ Compacted table '{TABLE_NAME}'")
    except Exception as e:
        print(f"Error compacting table: {e}")