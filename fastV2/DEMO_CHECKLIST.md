# Pre-Demo Checklist

## 🎯 Before Running the Demo

### 1. Install Redis
- [ ] Redis downloaded and installed
- [ ] Redis running: `redis-server`
- [ ] Test connection: `redis-cli ping` → Should return "PONG"

### 2. Python Dependencies
- [ ] Navigate to project: `cd "e:\Projects\MEDBOX FINAL\fast"`
- [ ] Install packages: `pip install -r requirements.txt`
- [ ] Verify imports: `python -c "import lancedb, celery, fastapi"`

### 3. Environment Configuration
- [ ] Create `.env` file in `fast/` directory
- [ ] Add OpenAI API key: `OPENAI_API_KEY=sk-...`
- [ ] Verify key works: Test with OpenAI API call

### 4. Directory Structure
- [ ] Temp directory created (auto-created): `./temp_uploads/`
- [ ] LanceDB directory will be created on first run: `./lancedb_storage/`

---

## 🚀 Starting the System

### Option A: Quick Start (Windows)
```bash
# Double-click or run:
start_services.bat
```

### Option B: Manual Start (3 Terminals)

**Terminal 1: Redis**
```bash
redis-server
```

**Terminal 2: Celery Worker**
```bash
cd "e:\Projects\MEDBOX FINAL\fast"
celery -A celery_worker worker --loglevel=info --pool=solo
```

**Terminal 3: FastAPI**
```bash
cd "e:\Projects\MEDBOX FINAL\fast"
uvicorn main:app --reload --port 8000
```

---

## ✅ Verify System Health

### 1. Check API Health
- [ ] Open browser: http://localhost:8000
- [ ] Should see:
```json
{
  "status": "healthy",
  "service": "RAG Backend API - Production Grade",
  "version": "3.0.0",
  "backend": "LanceDB with Hybrid Search"
}
```

### 2. Check API Documentation
- [ ] Open: http://localhost:8000/docs
- [ ] Verify all endpoints visible

### 3. Check Redis Connection
- [ ] Run: `redis-cli ping`
- [ ] Should return: `PONG`

### 4. Check Celery Worker
- [ ] Look for log message: `celery@hostname ready`
- [ ] No error messages in worker terminal

---

## 🧪 Quick Demo Flow

### 1. Create Collection
```bash
POST http://localhost:8000/collections/demo
Body: {"name": "Demo Collection"}
```
- [ ] Returns 200 status
- [ ] Collection created successfully

### 2. Upload PDF
```bash
POST http://localhost:8000/upload/demo
Body: multipart/form-data with PDF file
```
- [ ] Returns task_id
- [ ] Response is immediate (<2 seconds)

### 3. Monitor Task Status
```bash
GET http://localhost:8000/tasks/{task_id}
```
- [ ] State: PENDING → PROCESSING → SUCCESS
- [ ] Check Celery worker logs for progress
- [ ] Final result shows chunks_created

### 4. Query Collection
```bash
POST http://localhost:8000/chat/stream
Body: {
  "query": "Your question here",
  "collection_id": "demo"
}
```
- [ ] Streaming response works
- [ ] Citations include page numbers
- [ ] Answer is relevant

---

## 📊 Demo Scenarios

### Scenario 1: Upload Speed
**Show:** Non-blocking upload
- Upload 100-page PDF
- Response returns in ~2 seconds with task_id
- Processing continues in background
- Poll task status to show progress

### Scenario 2: Hybrid Search
**Show:** Better medical term matching
- Query: "What is MI?" (myocardial infarction)
- Query: "ACE inhibitor side effects"
- Compare results with/without hybrid search

### Scenario 3: Scalability
**Show:** Multi-collection support
- Create 3 collections: cardiology, neurology, oncology
- Upload PDFs to each
- Query each separately
- Show total storage usage

### Scenario 4: Table Handling
**Show:** HTML table preservation
- Upload PDF with tables
- Query about table data
- Show that table structure is preserved
- Highlight cost savings (no LLM for tables)

---

## 🐛 Troubleshooting During Demo

### Issue: Upload fails
**Check:**
1. Celery worker is running
2. Redis connection is active
3. OpenAI API key is valid
4. PDF file is not corrupted

### Issue: Search returns no results
**Check:**
1. Task completed successfully (check task status)
2. Collection name matches upload
3. Documents were embedded correctly

### Issue: Slow response
**Check:**
1. OpenAI API rate limits
2. Large PDF size (>100 pages)
3. Network connectivity

---

## 📝 Demo Script (5 minutes)

**1. Introduction (30 seconds)**
- "We've refactored our RAG system for production scalability"
- "Key improvements: LanceDB, Hybrid Search, Celery background processing"

**2. Upload Demo (1 minute)**
- Show non-blocking upload
- Display task_id returned immediately
- Monitor real-time progress in Celery logs

**3. Search Demo (2 minutes)**
- Query with medical terminology
- Show hybrid search results
- Highlight page citations and source attribution
- Compare with pure vector search

**4. Scalability Demo (1 minute)**
- Show LanceDB storage directory
- Display collection stats
- Explain disk-based vs RAM-based storage

**5. Q&A (30 seconds)**
- Questions about deployment
- Cost savings discussion
- Future enhancements

---

## 🎬 Post-Demo Cleanup (Optional)

### Clear Test Data
```python
# Delete test collections
from retriever import delete_collection
delete_collection("demo")
```

### Reset Database
```bash
# Delete LanceDB storage
rm -rf lancedb_storage/

# Delete temp files
rm -rf temp_uploads/
```

### Stop Services
1. Press Ctrl+C in FastAPI terminal
2. Press Ctrl+C in Celery worker terminal
3. Stop Redis: `redis-cli shutdown`

---

## 📚 Resources for Demo

**Have Ready:**
- [ ] Sample medical PDFs (3-5 documents)
- [ ] Test queries prepared
- [ ] API documentation: http://localhost:8000/docs
- [ ] PRODUCTION_SETUP.md for deployment questions
- [ ] REFACTORING_SUMMARY.md for technical details

**Browser Tabs:**
- [ ] http://localhost:8000 (Health check)
- [ ] http://localhost:8000/docs (API docs)
- [ ] http://localhost:8000/collections (Collections list)

**Terminal Windows:**
- [ ] Redis logs
- [ ] Celery worker logs (important for showing progress)
- [ ] FastAPI logs

---

## ✅ Final Checklist

Before demo starts:
- [ ] All services running
- [ ] Health check returns 200
- [ ] Sample PDFs ready
- [ ] Test queries prepared
- [ ] Demo script reviewed
- [ ] Troubleshooting guide accessible

During demo:
- [ ] Show non-blocking upload
- [ ] Demonstrate task status polling
- [ ] Highlight hybrid search quality
- [ ] Explain cost savings
- [ ] Show scalability features

After demo:
- [ ] Answer technical questions
- [ ] Provide deployment guide
- [ ] Share documentation links
- [ ] Discuss next steps

---

**🎉 You're ready to demo a production-grade RAG system!**

Good luck! 🚀
