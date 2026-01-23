"""
Retriever module - LanceDB with Hybrid Search (Vector + FTS) and Reranking.
Production-grade for 1000+ books with disk-based storage.

Following 2026 best practices:
- Auto-vectorization with embeddings.SourceField() and embeddings.VectorField()
- Proper FTS index with wait_for_index
- Hybrid search with LinearCombinationReranker
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import lancedb
from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry
from lancedb.rerankers import LinearCombinationReranker


from config import (
    LANCEDB_PATH,
    TABLE_NAME,
    HYBRID_SEARCH_K,
    RERANK_TOP_N,
    VECTOR_WEIGHT,
)

# ============================================================================
# Embedding Model Setup - Using LanceDB's auto-vectorization
# ============================================================================

# Register OpenAI embeddings for auto-vectorization
openai_embeddings = get_registry().get("openai").create(
    name="text-embedding-3-large",
    dim=3072
)

# Metadata fields to include when sending context to LLM
SOURCE_METADATA_LIMITER = [
    "filename",
    "page_number",
    "title",
    "data_type"
]

# Initialize LanceDB client
db = lancedb.connect(LANCEDB_PATH)

# ============================================================================
# Schema Definition - Using Proper Auto-Vectorization
# ============================================================================

class MedicalDocument(LanceModel):
    """
    Unified schema for all medical documents.
    Uses LanceDB auto-vectorization pattern (2026 best practice).
    """
    # Auto-vectorized fields
    text: str = openai_embeddings.SourceField()  # Source text for embedding
    vector: Vector(3072) = openai_embeddings.VectorField()  # Auto-generated embedding
    
    # Metadata fields
    collection_name: str  # Filter by knowledge base (e.g., "cardiology")
    filename: str  # Source document filename
    page_number: int  # Page number in original PDF (first page of chunk)
    data_type: str  # 'text', 'table_html', 'image_summary'
    document_id: str  # Unique document identifier
    chunk_id: str  # Unique chunk identifier
    chunk_index: int  # Index within document
    
    # Optional metadata
    element_id: Optional[str] = None
    title: Optional[str] = None
    contains: Optional[str] = None


# ============================================================================
# Table Initialization
# ============================================================================

def get_table():
    """
    Get or create the unified medical knowledge base table.
    Creates FTS index for hybrid search.
    """
    if TABLE_NAME not in db.table_names():
        # Create empty table with schema
        table = db.create_table(
            TABLE_NAME,
            schema=MedicalDocument,
            mode="overwrite"
        )
        print(f"✓ Created table '{TABLE_NAME}'")
    else:
        table = db.open_table(TABLE_NAME)
    
    return table


def ensure_fts_index():
    """Create FTS index if it doesn't exist. Call after adding data."""
    try:
        table = db.open_table(TABLE_NAME)
        table.create_fts_index("text", replace=True)
        print(f"✓ FTS index created/updated for '{TABLE_NAME}'")
    except Exception as e:
        print(f"FTS index note: {e}")


# ============================================================================
# Collection Management
# ============================================================================

def collection_exists(collection_name: str) -> bool:
    """Check if a collection has any documents."""
    try:
        table = get_table()
        df = table.to_pandas()
        if df.empty:
            return False
        return collection_name in df['collection_name'].values
    except Exception as e:
        print(f"Error checking collection: {e}")
        return False


def create_collection(collection_name: str):
    """Create a collection (just validates table exists)."""
    get_table()
    return {"collection_name": collection_name, "message": "Collection ready"}


def delete_collection(collection_name: str) -> int:
    """Delete all documents in a collection."""
    try:
        table = get_table()
        df = table.to_pandas()
        count = len(df[df['collection_name'] == collection_name])
        
        if count == 0:
            return 0
        
        table.delete(f"collection_name = '{collection_name}'")
        ensure_fts_index()  # Rebuild FTS after delete
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
        
        collections = []
        for name in df['collection_name'].unique():
            coll_df = df[df['collection_name'] == name]
            collections.append({
                "collection_id": name,
                "collection_name": name,
                "chunk_count": len(coll_df),
                "document_count": coll_df['document_id'].nunique()
            })
        
        return collections
    except Exception as e:
        print(f"Error listing collections: {e}")
        return []


def get_collection_stats(collection_name: str) -> dict:
    """Get stats for a specific collection."""
    try:
        table = get_table()
        df = table.to_pandas()
        coll_df = df[df['collection_name'] == collection_name]
        
        return {
            "collection_id": collection_name,
            "chunk_count": len(coll_df),
            "document_count": coll_df['document_id'].nunique() if not coll_df.empty else 0
        }
    except Exception as e:
        print(f"Error getting stats: {e}")
        return {"collection_id": collection_name, "chunk_count": 0, "document_count": 0}


# ============================================================================
# Document Management - NO MANUAL EMBEDDING (LanceDB auto-embeds!)
# ============================================================================

def add_documents(
    collection_name: str,
    texts: List[str],
    metadatas: List[dict],
    ids: List[str]
) -> int:
    """
    Add documents to a collection.
    NOTE: No need to embed manually - LanceDB auto-embeds via schema!
    """
    if not texts:
        return 0
    
    # Prepare records WITHOUT embeddings (LanceDB will auto-generate)
    records = []
    
    # DEBUG: Log first metadata to see what we're receiving
    if metadatas:
        print(f"\n[DEBUG INGESTION] First chunk metadata keys: {list(metadatas[0].keys())}")
        print(f"[DEBUG INGESTION] page_numbers value: {metadatas[0].get('page_numbers')}")
        print(f"[DEBUG INGESTION] source value: {metadatas[0].get('source')}")
    
    for i, (text, metadata, chunk_id) in enumerate(zip(texts, metadatas, ids)):
        # Handle page_numbers (plural, comma-separated string) vs page_number (singular)
        page_num = 0
        if "page_numbers" in metadata and metadata["page_numbers"]:
            # e.g. "1, 2, 3" -> take first page
            try:
                raw_pages = str(metadata["page_numbers"])
                page_num = int(raw_pages.split(",")[0].strip())
                if i == 0:
                    print(f"[DEBUG INGESTION] Parsed page_numbers '{raw_pages}' -> page_num={page_num}")
            except Exception as e:
                print(f"[DEBUG INGESTION] Failed to parse page_numbers: {e}")
                page_num = 0
        elif "page_number" in metadata:
            try:
                page_num = int(metadata["page_number"])
            except:
                page_num = 0
        
        record = {
            "text": text,  # LanceDB will auto-embed this!
            # "vector": ... NOT NEEDED - auto-generated
            "collection_name": collection_name,
            "filename": metadata.get("source", "unknown"),
            "page_number": page_num,
            "data_type": metadata.get("data_type", "text"),
            "document_id": metadata.get("document_id", "unknown"),
            "chunk_id": chunk_id,
            "chunk_index": int(metadata.get("chunk_index", i)),
            "element_id": metadata.get("element_id"),
            "title": metadata.get("title"),
            "contains": metadata.get("contains", "")
        }
        records.append(record)
    
    # Add to table (LanceDB auto-embeds via openai_embeddings)
    table = get_table()
    table.add(records)
    
    # Rebuild FTS index after adding data
    ensure_fts_index()
    
    print(f"✓ Added {len(records)} chunks to '{collection_name}' (auto-embedded)")
    return len(records)


def delete_document(collection_name: str, document_id: str) -> int:
    """Delete all chunks belonging to a document."""
    try:
        table = get_table()
        df = table.to_pandas()
        count = len(df[(df['collection_name'] == collection_name) & 
                       (df['document_id'] == document_id)])
        
        if count == 0:
            return 0
        
        table.delete(f"collection_name = '{collection_name}' AND document_id = '{document_id}'")
        ensure_fts_index()
        return count
    except Exception as e:
        print(f"Error deleting document: {e}")
        return 0


def list_documents(collection_name: str) -> List[dict]:
    """List all unique documents in a collection."""
    try:
        table = get_table()
        df = table.to_pandas()
        coll_df = df[df['collection_name'] == collection_name]
        
        if coll_df.empty:
            return []
        
        documents = {}
        for _, row in coll_df.iterrows():
            doc_id = row['document_id']
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "source": row['filename'],
                    "chunk_count": 0
                }
            documents[doc_id]['chunk_count'] += 1
        
        return list(documents.values())
    except Exception as e:
        print(f"Error listing documents: {e}")
        return []


# ============================================================================
# Hybrid Search - Following 2026 Best Practices
# ============================================================================

def filter_metadata(metadata: dict) -> dict:
    """Filter metadata to only include allowed fields."""
    return {k: metadata.get(k) for k in SOURCE_METADATA_LIMITER if k in metadata}


def retrieve_context(
    query: str,
    collection_name: str,
    k: int = RERANK_TOP_N
) -> tuple[str, list]:
    """
    Retrieve relevant context using HYBRID SEARCH (Vector + FTS) with reranking.
    
    Following 2026 best practices:
    - Over-fetch + rerank (fetch 50, return top 15)
    - LinearCombinationReranker with tuned weight
    - query_type="hybrid" for combined search
    
    Returns:
        Tuple of (context_string, sources_list):
        - context_string: Formatted context with source citations for LLM
        - sources_list: List of source metadata dicts for frontend citations
    """
    try:
        table = get_table()
        
        if not collection_exists(collection_name):
            return "", []
        
        # Reranker: 0.95 = 95% vector, 5% keyword
        reranker = LinearCombinationReranker(weight=VECTOR_WEIGHT)
        
        # ================================================================
        # HYBRID SEARCH - Correct 2026 Pattern
        # Just pass the query text - LanceDB auto-embeds for vector search
        # ================================================================
        search_method = "hybrid"
        try:
            results = table.search(query, query_type="hybrid") \
                .where(f"collection_name = '{collection_name}'") \
                .rerank(reranker) \
                .limit(HYBRID_SEARCH_K) \
                .to_list()
            
            # Take top K after reranking
            results = results[:k]
            print(f"[SEARCH] ✅ HYBRID SEARCH used ({len(results)} results, weight={VECTOR_WEIGHT})")
            
        except Exception as e:
            print(f"[SEARCH] ⚠️ Hybrid search error: {e}")
            search_method = "fts_fallback"
            # Fallback to FTS only
            try:
                results = table.search(query, query_type="fts") \
                    .where(f"collection_name = '{collection_name}'")\
                    .limit(k) \
                    .to_list()
                print(f"[SEARCH] Using FTS fallback ({len(results)} results)")
            except Exception as e2:
                print(f"[SEARCH] ❌ FTS fallback error: {e2}")
                results = []
        
        if not results:
            return "", []
        
        # DEBUG: Log raw search results
        print(f"\n{'='*80} SEARCH RESULTS {'='*80}")
        print(f"[SEARCH] RAW RESULTS ({len(results)} total):")
        for i, r in enumerate(results[:5]):  # First 5 results
            print(f"   [{i}] {r.get('filename')} | Page: {r.get('page_number')} | Chunk: {r.get('chunk_id')}")
        print(f"{'='*80}\n")
        
        # Build sources list for frontend and context string for LLM
        sources = []
        context = ""
        
        for result in results:
            text = result['text']
            
            # Filter metadata to only include allowed fields
            filtered_metadata = filter_metadata(result)
            
            filename = filtered_metadata.get('filename', 'Unknown')
            page_number = filtered_metadata.get('page_number', 0)
            data_type = filtered_metadata.get('data_type', 'text')
            title = filtered_metadata.get('title')
            
            # Add to sources list for frontend (page_number as integer)
            source_entry = {
                "filename": filename,
                "page_number": page_number if isinstance(page_number, int) else 0,
                "title": title,
                "data_type": data_type
            }
            sources.append(source_entry)
            print(f"   [SOURCE] {filename} -> page_number={source_entry['page_number']} (raw={page_number}, type={type(page_number).__name__})")
            
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
        return {"table_name": TABLE_NAME, "total_chunks": 0}


def compact_table():
    """Compact table to optimize storage."""
    try:
        table = get_table()
        table.compact_files()
        print(f"✓ Compacted table '{TABLE_NAME}'")
    except Exception as e:
        print(f"Error compacting: {e}")