"""
Configuration for multi-collection RAG backend.
"""

# ChromaDB Settings
CHROMA_PATH = "./chroma_storage"
# Collections are dynamic: kb_{collection_id}

# Model Settings
EMBEDDING_MODEL = "text-embedding-3-large"
CHAT_MODEL = "gpt-4o-mini"

# Chunking Settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# API Settings
RAG_API_URL = "http://localhost:8000"
