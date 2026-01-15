# FastAPI RAG Backend

> Multi-collection RAG system for admin-managed knowledge bases with streaming responses.

---

## Overview

The FastAPI backend provides the AI/RAG layer for MedBax. It handles PDF processing, vector storage (ChromaDB), and AI-powered Q&A with citation support.

### Key Capabilities

- Multi-collection support (one ChromaDB collection per Knowledge Base)
- PDF upload with automatic chunking and embedding
- Streaming chat responses with source metadata
- Conversation history support
- General AI chat (no RAG) for when no KB is selected

---

## Documentation

| Document | Description |
|----------|-------------|
| [FastAPI Implementation](./fastapi_implementation_v1.md) | Complete technical docs including architecture, modules, endpoints |

---

## Quick Reference

### Files Overview

| File | Lines | Purpose |
|------|-------|---------|
| `main.py` | 568 | FastAPI app, all HTTP endpoints |
| `retriever.py` | 215 | ChromaDB operations (CRUD, search) |
| `rag_pipeline.py` | 78 | RAG Q&A with OpenAI |
| `prompt.py` | 40 | System prompt and prompt builder |
| `embeddings.py` | 33 | OpenAI embeddings wrapper |
| `config.py` | 19 | Configuration constants |
| `requirements.txt` | 25 | Python dependencies |

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /` | GET | Health check |
| `POST /collections/{id}` | POST | Create collection |
| `DELETE /collections/{id}` | DELETE | Delete collection |
| `POST /upload/{collection_id}` | POST | Upload PDF |
| `DELETE /embeddings/{col}/{doc}` | DELETE | Delete document |
| `POST /chat/stream` | POST | RAG query (streaming) |
| `POST /chat/general/stream` | POST | General AI (no RAG) |

### Running Locally

```bash
cd fast
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Requires `OPENAI_API_KEY` in `.env` file.
