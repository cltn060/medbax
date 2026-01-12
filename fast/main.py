"""
FastAPI Backend - Multi-collection RAG system for admin-managed knowledge bases.
"""

import os
import tempfile
import shutil
import uuid
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter


from dotenv import load_dotenv

# Load .env from parent directory
load_dotenv(Path(__file__).parent / ".env")

# Import modules
from config import CHUNK_SIZE, CHUNK_OVERLAP
from retriever import (
    get_collection,
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

# ============================================================================
# App Initialization
# ============================================================================

app = FastAPI(
    title="RAG Backend API",
    description="Multi-collection RAG system for admin-managed knowledge bases",
    version="2.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://medbax.vercel.app", "http://medbax.vercel.app/"],
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
    document_id: str
    filename: str
    chunks_created: int
    page_count: int

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
        "service": "RAG Backend API",
        "version": "2.0.0",
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
    Upload a PDF file to a specific collection.
    
    Args:
        collection_id: The collection to upload to
        file: The PDF file
        document_id: Optional pre-generated document ID (from Convex)
    """
    validate_pdf(file)
    
    # Use provided document_id or generate one
    doc_id = document_id or generate_document_id()
    
    temp_dir = tempfile.mkdtemp()
    temp_path = Path(temp_dir) / file.filename
    
    try:
        # Save uploaded file temporarily
        content = await file.read()
        
        # Validate PDF magic bytes
        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File appears to be corrupt or not a valid PDF."
            )
        
        with open(temp_path, "wb") as buffer:
            buffer.write(content)
        
        # Parse PDF
        try:
            loader = PyPDFLoader(str(temp_path))
            documents = loader.load()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse PDF: {str(e)}"
            )
        
        if not documents:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF appears to be empty or unreadable."
            )
        
        page_count = len(documents)
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_documents(documents)
        
        # Prepare data for storage
        texts = []
        metadatas = []
        ids = []
        
        for i, chunk in enumerate(chunks):
            texts.append(chunk.page_content)
            metadatas.append({
                "document_id": doc_id,  # Link chunks to document
                "source": file.filename,
                "page_number": chunk.metadata.get("page", 0) + 1,
                "chunk_index": i
            })
            ids.append(f"{doc_id}_chunk_{i}")
        
        # Add to vector store
        try:
            chunks_added = add_documents(collection_id, texts, metadatas, ids)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error during embedding: {str(e)}"
            )
        
        return UploadResponse(
            message="PDF processed and stored successfully",
            document_id=doc_id,
            filename=file.filename,
            chunks_created=chunks_added,
            page_count=page_count
        )
    
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

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

@app.post("/chat")
async def chat(request: ChatRequest):
    """Query the RAG system (non-streaming). Returns answer and structured sources."""
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
        answer, sources = answer_question_sync(
            request.query,
            collection_id=request.collection_id
        )
        
        return {
            "answer": answer,
            "collection_id": request.collection_id,
            "sources": sources
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI API error: {str(e)}"
        )


# Special delimiter used to separate streamed content from source metadata
SOURCE_METADATA_DELIMITER = "\n\n<<<SOURCES_JSON>>>"


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Stream the RAG response (for real-time typing effect).
    
    After the AI response completes, appends structured sources as JSON:
    - Delimiter: '\n\n<<<SOURCES_JSON>>>'
    - Followed by JSON array of source objects
    
    Frontend should split response on delimiter to extract sources.
    """
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
    
    async def generate():
        try:
            # Convert conversation history to dict format
            history = None
            if request.conversation_history:
                history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
            
            response_stream, sources = answer_question(
                request.query,
                collection_id=request.collection_id,
                stream=True,
                conversation_history=history
            )
            
            # Stream the AI response
            for chunk in response_stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
            
            # After streaming, append source metadata as JSON
            if sources:
                yield SOURCE_METADATA_DELIMITER
                yield json.dumps(sources)
                
        except Exception as e:
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
