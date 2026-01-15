"""
Demo Script: Test the Production-Grade RAG System
"""
import requests
import json
import time
from pathlib import Path

API_BASE = "http://127.0.0.1:8000"

def test_health():
    print("\n1. Checking Health...")
    try:
        r = requests.get(f"{API_BASE}/")
        print(f"✅ Server is up: {r.json()}")
        return True
    except Exception as e:
        print(f"❌ Server is down: {e}")
        return False

def test_upload():
    print("\n2. Testing Upload...")
    # Get raw input
    raw_path = input(">>> Drag and drop a PDF file here and press Enter: ").strip()
    
    # --- FIX POWERSHELL FORMATTING ---
    # 1. Remove the leading '& ' if it exists
    if raw_path.startswith("& "):
        raw_path = raw_path[2:].strip()
    
    # 2. Remove surrounding quotes (single or double)
    if (raw_path.startswith("'") and raw_path.endswith("'")) or \
       (raw_path.startswith('"') and raw_path.endswith('"')):
        raw_path = raw_path[1:-1]
        
    # 3. Fix PowerShell's escaped single quotes (e.g. "Fawad''s" -> "Fawad's")
    pdf_path = raw_path.replace("''", "'")
    # ---------------------------------
    
    if not Path(pdf_path).exists():
        print(f"❌ File not found at: {pdf_path}")
        return None
    
    collection = "demo_medical"
    # Create collection first
    try:
        requests.post(f"{API_BASE}/collections/{collection}", json={"name": "Demo"})
    except:
        pass # Ignore if already exists
    
    print(f"   Uploading: {Path(pdf_path).name}...")
    with open(pdf_path, "rb") as f:
        # We explicitly tell the server: (Filename, File Object, Content-Type)
        files = {"file": (Path(pdf_path).name, f, "application/pdf")}
        
        r = requests.post(f"{API_BASE}/upload/{collection}", files=files)
        print(f"📤 Upload response: {r.json()}")
        
        task_id = r.json().get("task_id")
        if task_id:
            monitor_task(task_id)
            return collection
    return None

def monitor_task(task_id):
    print("\n3. Monitoring Task (Celery)...")
    while True:
        r = requests.get(f"{API_BASE}/tasks/{task_id}")
        status = r.json().get("state")
        print(f"   Status: {status}")
        
        if status in ["SUCCESS", "FAILURE"]:
            print(f"🏁 Final Result: {r.json()}")
            break
        time.sleep(2)

def test_chat(collection_id):
    print("\n4. Testing Chat...")
    query = input(">>> Ask a question about the book: ")
    payload = {
        "query": query,
        "collection_id": collection_id,
        "conversation_history": []
    }
    
    # Stream response
    print("\n🤖 AI Response:")
    with requests.post(f"{API_BASE}/chat/stream", json=payload, stream=True) as r:
        for chunk in r.iter_content(1024):
            if chunk:
                print(chunk.decode(), end="", flush=True)
    print("\n")

if __name__ == "__main__":
    if test_health():
        collection_id = test_upload()
        if collection_id:
            test_chat(collection_id)