import os
import requests
import time
from pathlib import Path

# Configuration
API_URL = "http://127.0.0.1:8000"
COLLECTION_NAME = "medical_library"
LOG_FILE = "ingestion_history.txt"  # Tracks progress

def get_all_pdfs(root_folder):
    """Recursively find all PDFs."""
    pdf_files = []
    for root, dirs, files in os.walk(root_folder):
        for file in files:
            if file.lower().endswith('.pdf'):
                full_path = os.path.join(root, file)
                pdf_files.append(full_path)
    return pdf_files

def load_history():
    """Load list of already processed files."""
    if not os.path.exists(LOG_FILE):
        return set()
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        return set(line.strip() for line in f)

def append_to_history(filename):
    """Log a file as completed."""
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"{filename}\n")

def ingest_library():
    print("\n--- 📚 Resumable Bulk Ingestion ---")
    
    # 1. Get Path
    folder_path = input(">>> Paste the path to your 'Books' folder: ").strip().strip('"').strip("'")
    if not os.path.exists(folder_path):
        print("❌ Folder not found!")
        return

    # 2. Load History
    processed_files = load_history()
    print(f"📂 History loaded: {len(processed_files)} files already done.")

    # 3. Scan Files
    print("🔍 Scanning folders...")
    all_files = get_all_pdfs(folder_path)
    print(f"📚 Found {len(all_files)} total PDFs.")

    # 4. Ensure Collection
    try:
        requests.post(f"{API_URL}/collections/{COLLECTION_NAME}", json={"name": "Medical Library"})
    except:
        pass

    # 5. Start Upload Loop
    success_count = 0
    skipped_count = 0

    for i, file_path in enumerate(all_files):
        filename = Path(file_path).name
        
        # --- THE RESUME CHECK ---
        if filename in processed_files:
            print(f"[{i+1}/{len(all_files)}] ⏭️  Skipping: {filename} (Already done)")
            skipped_count += 1
            continue
        # ------------------------

        print(f"[{i+1}/{len(all_files)}] 📤 Sending: {filename}...", end=" ")
        
        try:
            with open(file_path, "rb") as f:
                files_payload = {"file": (filename, f, "application/pdf")}
                response = requests.post(
                    f"{API_URL}/upload/{COLLECTION_NAME}", 
                    files=files_payload
                )
                
                if response.status_code == 200:
                    print("✅ Queued")
                    append_to_history(filename) # <--- SAVES PROGRESS
                    success_count += 1
                else:
                    print(f"❌ Failed: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
            
        time.sleep(0.5)

    print(f"\n🎉 Batch Complete!")
    print(f"   - New files queued: {success_count}")
    print(f"   - Files skipped: {skipped_count}")

if __name__ == "__main__":
    ingest_library()