"""
Retriever module - supports multiple collections/knowledge bases.
"""

import chromadb
from embeddings import embed_text, embed_texts
from config import CHROMA_PATH

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_PATH)


def get_collection(collection_id: str):
    """Get or create a specific collection by ID."""
    return client.get_or_create_collection(name=collection_id)


def collection_exists(collection_id: str) -> bool:
    """Check if a collection exists."""
    try:
        client.get_collection(name=collection_id)
        return True
    except Exception:
        return False


def create_collection(collection_id: str):
    """Create a new collection."""
    return client.get_or_create_collection(name=collection_id)


def delete_collection(collection_id: str) -> int:
    """Delete an entire collection. Returns chunk count before deletion."""
    try:
        collection = client.get_collection(name=collection_id)
        count = collection.count()
        client.delete_collection(name=collection_id)
        return count
    except Exception:
        return 0


def list_collections() -> list[dict]:
    """List all collections with their stats."""
    collections = client.list_collections()
    result = []
    for c in collections:
        try:
            collection = client.get_collection(name=c.name)
            result.append({
                "collection_id": c.name,
                "chunk_count": collection.count()
            })
        except Exception:
            result.append({
                "collection_id": c.name,
                "chunk_count": 0
            })
    return result


def get_collection_stats(collection_id: str) -> dict:
    """Get stats for a specific collection."""
    try:
        collection = client.get_collection(name=collection_id)
        
        # Get unique document IDs
        results = collection.get(include=["metadatas"])
        document_ids = set()
        for meta in results.get("metadatas", []):
            if meta and "document_id" in meta:
                document_ids.add(meta["document_id"])
        
        return {
            "collection_id": collection_id,
            "chunk_count": collection.count(),
            "document_count": len(document_ids)
        }
    except Exception:
        return {
            "collection_id": collection_id,
            "chunk_count": 0,
            "document_count": 0
        }


def add_documents(collection_id: str, texts: list[str], metadatas: list[dict], ids: list[str]) -> int:
    """
    Add documents to a specific collection.
    
    Args:
        collection_id: The collection to add to
        texts: List of text chunks
        metadatas: List of metadata dicts (should include 'document_id', 'source', 'page_number')
        ids: Unique IDs for each chunk
    
    Returns:
        Number of chunks added
    """
    collection = get_collection(collection_id)
    embeddings = embed_texts(texts)
    
    collection.add(
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    
    return len(texts)


def delete_document(collection_id: str, document_id: str) -> int:
    """Delete all chunks belonging to a document. Returns number of chunks deleted."""
    try:
        collection = client.get_collection(name=collection_id)
        results = collection.get(
            where={"document_id": document_id},
            include=["metadatas"]
        )
        
        if results["ids"]:
            collection.delete(ids=results["ids"])
            return len(results["ids"])
        return 0
    except Exception:
        return 0


def list_documents(collection_id: str) -> list[dict]:
    """List all unique documents in a collection."""
    try:
        collection = client.get_collection(name=collection_id)
        results = collection.get(include=["metadatas"])
        
        # Group by document_id
        documents = {}
        for i, meta in enumerate(results.get("metadatas", [])):
            if not meta:
                continue
            doc_id = meta.get("document_id", "unknown")
            if doc_id not in documents:
                documents[doc_id] = {
                    "document_id": doc_id,
                    "source": meta.get("source", "Unknown"),
                    "chunk_count": 0
                }
            documents[doc_id]["chunk_count"] += 1
        
        return list(documents.values())
    except Exception:
        return []


def retrieve_context(query: str, collection_id: str, k: int = 5) -> tuple[str, list[dict]]:
    """
    Retrieve relevant context for a query from a specific collection.
    
    Args:
        query: The user's question
        collection_id: Which collection to search
        k: Number of results to retrieve
    
    Returns:
        Tuple of (context_text, sources_list):
        - context_text: Formatted context string with source citations
        - sources_list: List of source metadata dicts for structured response
    """
    try:
        collection = client.get_collection(name=collection_id)
    except Exception:
        return "", []
    
    # Check if collection is empty
    if collection.count() == 0:
        return "", []
    
    query_vector = embed_text(query)
    
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=k
    )
    
    # Format context with source citations and collect structured sources
    context = ""
    sources = []
    seen_sources = set()  # Deduplicate sources
    
    for i in range(len(results["documents"][0])):
        text = results["documents"][0][i]
        meta = results["metadatas"][0][i]
        
        source_key = (meta.get("source", "Unknown"), meta.get("page_number", 0))
        
        context += (
            f"--- SOURCE: {meta.get('source', 'Unknown')} | "
            f"Page: {meta.get('page_number', 'N/A')} ---\n"
            f"{text}\n\n"
        )
        
        # Only add unique sources to the list
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            sources.append({
                "title": meta.get("source", "Unknown"),
                "snippet": text[:200] + "..." if len(text) > 200 else text,
                "sourceType": "kb_document",
                "chromaDocumentId": meta.get("document_id"),  # ChromaDB document ID
                "pageNumber": meta.get("page_number", 1),
            })
    
    return context, sources

