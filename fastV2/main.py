"""
FastAPI Backend - Multi-collection RAG system for admin-managed knowledge bases.
"""

import os
import json
import tempfile
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(Path(__file__).parent / ".env")

# Celery integration
from celery.result import AsyncResult
from celery_worker import app as celery_app, ingest_pdf_task

# Import modules
from config import (
    CHUNK_MAX_CHARACTERS,
    CHUNK_NEW_AFTER_N_CHARS,
    CHUNK_COMBINE_UNDER_N_CHARS,
    UPLOAD_TEMP_DIR
)
from retriever import (
    create_collection,
    delete_collection,
    list_collections,
    get_collection_stats,
    add_documents,
    delete_document,
    list_documents,
    retrieve_context,
    collection_exists,
)
from rag_pipeline import answer_question, answer_question_sync

# Special delimiter used to separate streamed content from source metadata
SOURCE_METADATA_DELIMITER = "\n\n<<<SOURCES_JSON>>>"

# ============================================================================
# App Initialization
# ============================================================================

app = FastAPI(
    title="RAG Backend API - Production Grade",
    description="Multi-collection RAG system with LanceDB, Hybrid Search, and Celery",
    version="3.0.0"
)

# Create temp upload directory
Path(UPLOAD_TEMP_DIR).mkdir(parents=True, exist_ok=True)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Pydantic Models
# ============================================================================

class CreateCollectionRequest(BaseModel):
    name: str  # Display name for logging

class CollectionInfo(BaseModel):
    collection_id: str
    chunk_count: int
    document_count: int

class CollectionListResponse(BaseModel):
    collections: list[dict]
    total: int

class UploadResponse(BaseModel):
    message: str
    task_id: str
    filename: str
    collection_id: str

class TaskStatusResponse(BaseModel):
    task_id: str
    state: str
    result: Optional[dict] = None
    progress: Optional[dict] = None

class DocumentInfo(BaseModel):
    document_id: str
    source: str
    chunk_count: int

class DocumentListResponse(BaseModel):
    documents: list[DocumentInfo]
    total: int

class DeleteResponse(BaseModel):
    message: str
    chunks_deleted: int

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    query: str
    collection_id: str
    include_sources: bool = True
    conversation_history: list[ChatMessage] = []  # Previous messages for context

class GeneralChatRequest(BaseModel):
    query: str
    conversation_history: list[ChatMessage] = []  # Previous messages for context

class ChatResponse(BaseModel):
    answer: str
    collection_id: str
    sources: Optional[list] = None

# ============================================================================
# Helper Functions
# ============================================================================

def validate_pdf(file: UploadFile) -> None:
    """Validate that the uploaded file is a PDF."""
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only PDF files are accepted."
        )
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a .pdf extension."
        )

def generate_document_id() -> str:
    """Generate a unique document ID."""
    return f"doc_{uuid.uuid4().hex[:10]}"

# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    collections = list_collections()
    return {
        "status": "healthy",
        "service": "RAG Backend API - Production Grade",
        "version": "3.0.0",
        "backend": "LanceDB with Hybrid Search",
        "total_collections": len(collections)
    }

# ============================================================================
# Collection Endpoints
# ============================================================================

@app.get("/collections", response_model=CollectionListResponse)
async def get_collections():
    """List all collections with stats."""
    collections = list_collections()
    return CollectionListResponse(
        collections=collections,
        total=len(collections)
    )


@app.post("/collections/{collection_id}")
async def create_new_collection(collection_id: str, request: CreateCollectionRequest):
    """Create a new collection."""
    if collection_exists(collection_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Collection '{collection_id}' already exists."
        )
    
    create_collection(collection_id)
    
    return {
        "message": f"Collection '{collection_id}' created successfully",
        "collection_id": collection_id,
        "name": request.name
    }


@app.get("/collections/{collection_id}/stats", response_model=CollectionInfo)
async def get_collection_info(collection_id: str):
    """Get stats for a specific collection."""
    if not collection_exists(collection_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_id}' not found."
        )
    
    stats = get_collection_stats(collection_id)
    return CollectionInfo(**stats)


@app.delete("/collections/{collection_id}")
async def delete_collection_endpoint(collection_id: str):
    """Delete an entire collection and all its documents."""
    if not collection_exists(collection_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_id}' not found."
        )
    
    chunks_deleted = delete_collection(collection_id)
    
    return DeleteResponse(
        message=f"Collection '{collection_id}' deleted successfully",
        chunks_deleted=chunks_deleted
    )

# ============================================================================
# Document Upload Endpoints
# ============================================================================

@app.post("/upload/{collection_id}", response_model=UploadResponse)
async def upload_pdf(collection_id: str, file: UploadFile = File(...), document_id: Optional[str] = None):
    """
    NON-BLOCKING: Upload a PDF file and trigger background processing.
    
    Returns immediately with a task_id for status tracking.
    Actual processing (extraction, embedding, storage) happens in Celery worker.
    
    Args:
        collection_id: The collection to upload to
        file: The PDF file
        document_id: Optional pre-generated document ID
    """
    validate_pdf(file)
    
    # Use provided document_id or generate one
    doc_id = document_id or generate_document_id()
    
    # Save file to temp directory
    temp_filename = f"{doc_id}_{file.filename}"
    temp_path = Path(UPLOAD_TEMP_DIR) / temp_filename
    
    try:
        # Read and validate PDF
        content = await file.read()
        
        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File appears to be corrupt or not a valid PDF."
            )
        
        # Save to temp directory
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Trigger Celery task (non-blocking)
        task = ingest_pdf_task.apply_async(
            args=[str(temp_path), file.filename, collection_id, doc_id]
        )
        
        return UploadResponse(
            message=f"PDF upload accepted. Processing in background...",
            task_id=task.id,
            filename=file.filename,
            collection_id=collection_id
        )
    
    except Exception as e:
        # Clean up temp file if task scheduling fails
        if temp_path.exists():
            os.remove(temp_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate upload: {str(e)}"
        )

@app.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Check the status of a background ingestion task.
    
    States:
    - PENDING: Task is waiting to start
    - PROCESSING: Task is running (check progress dict for details)
    - SUCCESS: Task completed successfully (check result dict)
    - FAILURE: Task failed (check result dict for error)
    """
    task_result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "state": task_result.state,
        "result": None,
        "progress": None
    }
    
    if task_result.state == 'PENDING':
        response["progress"] = {"message": "Task is queued and waiting to start..."}
    
    elif task_result.state == 'PROCESSING':
        response["progress"] = task_result.info  # Custom progress data
    
    elif task_result.state == 'SUCCESS':
        response["result"] = task_result.result
    
    elif task_result.state == 'FAILURE':
        response["result"] = {
            "status": "FAILURE",
            "error": str(task_result.info) if task_result.info else "Unknown error"
        }
    
    return TaskStatusResponse(**response)


# ============================================================================
# Document Management Endpoints
# ============================================================================

@app.get("/embeddings/{collection_id}", response_model=DocumentListResponse)
async def get_documents(collection_id: str):
    """List all documents in a collection."""
    if not collection_exists(collection_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_id}' not found."
        )
    
    docs = list_documents(collection_id)
    return DocumentListResponse(
        documents=[DocumentInfo(**d) for d in docs],
        total=len(docs)
    )


@app.delete("/embeddings/{collection_id}/{document_id}")
async def delete_document_endpoint(collection_id: str, document_id: str):
    """Delete a specific document from a collection."""
    if not collection_exists(collection_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{collection_id}' not found."
        )
    
    chunks_deleted = delete_document(collection_id, document_id)
    
    if chunks_deleted == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{document_id}' not found in collection."
        )
    
    return DeleteResponse(
        message=f"Document '{document_id}' deleted successfully",
        chunks_deleted=chunks_deleted
    )

# ============================================================================
# Chat Endpoints
# ============================================================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Query the RAG system (non-streaming)."""
    if not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty."
        )
    
    if not collection_exists(request.collection_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{request.collection_id}' not found."
        )
    
    try:
        # Convert conversation history to dict format
        history = None
        if request.conversation_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        
        answer, sources = answer_question_sync(
            request.query,
            collection_id=request.collection_id,
            conversation_history=history
        )
        
        return ChatResponse(
            answer=answer,
            collection_id=request.collection_id,
            sources=sources
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream the RAG response (for real-time typing effect)."""
    print(f"\n{'='*60}")
    print(f"📨 [CHAT/STREAM] Incoming request")
    print(f"   Query: {request.query[:100]}{'...' if len(request.query) > 100 else ''}")
    print(f"   Collection ID: {request.collection_id}")
    print(f"   History messages: {len(request.conversation_history) if request.conversation_history else 0}")
    
    if not request.query.strip():
        print(f"   ❌ Error: Empty query")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty."
        )
    
    if not collection_exists(request.collection_id):
        print(f"   ❌ Error: Collection not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection '{request.collection_id}' not found."
        )
    
    print(f"   ✓ Collection exists, starting RAG pipeline...")
    
    async def generate():
        try:
            # Convert conversation history to dict format
            history = None
            if request.conversation_history:
                history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
            
            print(f"   🔍 Calling answer_question...")
            response_stream, sources = answer_question(
                request.query,
                collection_id=request.collection_id,
                stream=True,
                conversation_history=history
            )
            print(f"   ✓ Got response stream, sources count: {len(sources)}")
            if sources:
                print(f"   📚 Sources: {[s.get('filename', 'N/A') for s in sources]}")
            
            # Stream the AI response
            chunk_count = 0
            for chunk in response_stream:
                content = chunk.choices[0].delta.content
                if content:
                    chunk_count += 1
                    yield content
            
            print(f"   ✓ Streamed {chunk_count} chunks")
            
            # After streaming, append source metadata as JSON
            if sources:
                yield SOURCE_METADATA_DELIMITER
                yield json.dumps(sources)
                print(f"   ✓ Sent sources metadata")
            
            print(f"{'='*60}\n")
                
        except Exception as e:
            print(f"   ❌ Error in generate(): {str(e)}")
            print(f"{'='*60}\n")
            yield f"\n\n[Error: {str(e)}]"
    
    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/chat/general/stream")
async def chat_general_stream(request: GeneralChatRequest):
    """Stream a general AI response (no RAG, for when no KB is selected)."""
    if not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty."
        )
    
    from openai import OpenAI
    client = OpenAI()
    
    async def generate():
        try:
            # Build messages array with conversation history
            messages = [
                {
                    "role": "system", 
                    "content": "You are MedBax AI, a helpful medical assistant. Provide helpful, accurate information but remind users to consult healthcare professionals for medical decisions. Be conversational and friendly. Do not start every message with a greeting - only greet on the first message of a conversation."
                }
            ]
            
            # Add conversation history (last 10 messages to stay within token limits)
            for msg in request.conversation_history[-10:]:
                messages.append({"role": msg.role, "content": msg.content})
            
            # Add the current query
            messages.append({"role": "user", "content": request.query})
            
            response_stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                stream=True
            )
            
            for chunk in response_stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except Exception as e:
            yield f"\n\n[Error: {str(e)}]"
    
    return StreamingResponse(generate(), media_type="text/plain")


# ============================================================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================================================
