"""
Configuration for multi-collection RAG backend - Production Grade.
"""

# LanceDB Settings (Disk-based storage for scalability)
LANCEDB_PATH = "./lancedb_storage"
TABLE_NAME = "medical_knowledge_base"  # Single unified table

# Model Settings
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIMENSION = 3072  # Dimension for text-embedding-3-large
CHAT_MODEL = "gpt-4o-mini"

# Semantic Chunking Settings (used by unstructured_processor.py)
# These parameters control intelligent chunking based on document structure
CHUNK_MAX_CHARACTERS = 7500          # Hard limit - forces new chunk
CHUNK_NEW_AFTER_N_CHARS = 4000       # Soft limit - prefers new chunk at boundaries
CHUNK_COMBINE_UNDER_N_CHARS = 1000   # Merges small chunks together

# Hybrid Search Settings
HYBRID_SEARCH_K = 20  # Retrieve top K candidates before reranking
RERANK_TOP_N = 5      # Final number of results after reranking
VECTOR_WEIGHT = 0.7   # Weight for vector similarity in reranking
KEYWORD_WEIGHT = 0.3  # Weight for keyword/FTS in reranking

# Celery Settings (Background Task Processing)
CELERY_BROKER_URL = "redis://localhost:6379/0"
CELERY_RESULT_BACKEND = "redis://localhost:6379/0"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 3600  # 1 hour timeout for large PDFs

# API Settings
RAG_API_URL = "http://localhost:8000"
UPLOAD_TEMP_DIR = "./temp_uploads"  # Temporary storage for uploaded PDFs
