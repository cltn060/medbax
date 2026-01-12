# RAG Backend API Documentation

## Setup

1. **Install dependencies:**
```bash
cd fast
pip install -r requirements.txt
```

2. **Environment:** Uses `../.env` from parent directory with your `OPENAI_API_KEY`

3. **Start server:**
```bash
uvicorn main:app --reload --port 8000
```

---

## Endpoints

### Health Check
```bash
GET http://localhost:8000/
```

**Response:**
```json
{
  "status": "healthy",
  "service": "RAG Backend API",
  "documents_indexed": 0
}
```

---

### Upload PDF
```bash
POST http://localhost:8000/upload
Content-Type: multipart/form-data
```

**cURL:**
```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "message": "PDF processed and stored successfully",
  "filename": "document.pdf",
  "chunks_created": 42
}
```

---

### List Sources
```bash
GET http://localhost:8000/sources
```

**Response:**
```json
{
  "sources": ["immune.pdf", "attention.pdf"],
  "total": 2
}
```

---

### Delete Source
```bash
DELETE http://localhost:8000/sources/{source_name}
```

**cURL:**
```bash
curl -X DELETE http://localhost:8000/sources/immune.pdf
```

**Response:**
```json
{
  "message": "Successfully deleted 'immune.pdf'",
  "chunks_deleted": 156
}
```

---

### Chat (Standard)
```bash
POST http://localhost:8000/chat
Content-Type: application/json
```

**Body:**
```json
{
  "query": "What is the immune system?",
  "source_filter": null
}
```

**Filter to specific PDF:**
```json
{
  "query": "Explain attention mechanisms",
  "source_filter": "attention.pdf"
}
```

**cURL:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the immune system?"}'
```

**Response:**
```json
{
  "answer": "The immune system is...",
  "sources_used": ["immune.pdf", "attention.pdf"]
}
```

---

### Chat (Streaming)
```bash
POST http://localhost:8000/chat/stream
Content-Type: application/json
```

**cURL:**
```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the immune system?"}' \
  --no-buffer
```

**Response:** Plain text stream (real-time typing effect)

---

## JavaScript/Fetch Examples

### Upload PDF
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('http://localhost:8000/upload', {
  method: 'POST',
  body: formData
});
const data = await response.json();
```

### Chat Query
```javascript
const response = await fetch('http://localhost:8000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: 'What is the immune system?',
    source_filter: null  // or 'specific.pdf'
  })
});
const data = await response.json();
console.log(data.answer);
```

### Streaming Chat
```javascript
const response = await fetch('http://localhost:8000/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'What is the immune system?' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value)); // Print chunks as they arrive
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Invalid request (bad PDF, empty query) |
| 404 | Source not found |
| 502 | OpenAI API error |
