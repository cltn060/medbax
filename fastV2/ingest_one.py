import requests
import time
from pathlib import Path

# Configuration
API_URL = "http://127.0.0.1:8000"

def ingest_admin_book():
    print("\n--- 👨‍⚕️ Admin Book Uploader ---")
    
    # 1. Ask for the Collection Name (The Filter ID)
    # Example: Type "Immunology", "Cardiology", or "Pediatrics"
# .lower() forces it to be small letters always
    collection_name = input(">>> Enter Collection Name (ID): ").strip().lower()  
      
    if not collection_name:

        print("❌ Collection name cannot be empty.")
        return

    # 2. Create that Collection if it doesn't exist
    print(f"   Ensuring collection '{collection_name}' exists...")
    try:
        requests.post(f"{API_URL}/collections/{collection_name}", json={"name": collection_name})
    except:
        pass # It exists, moving on...

    # 3. Get the Book
    raw_path = input(f">>> Drag and drop your {collection_name} PDF here: ").strip()
    
    # Clean up PowerShell/Terminal input artifacts
    if raw_path.startswith("& "):
        raw_path = raw_path[2:].strip()
    if (raw_path.startswith("'") and raw_path.endswith("'")) or \
       (raw_path.startswith('"') and raw_path.endswith('"')):
        raw_path = raw_path[1:-1]
        
    file_path = raw_path.replace("''", "'")
    
    if not Path(file_path).exists():
        print("❌ File not found.")
        return

    filename = Path(file_path).name
    print(f"📤 Uploading '{filename}' to collection '{collection_name}'...")

    # 4. Upload with the specific Collection ID
    try:
        with open(file_path, "rb") as f:
            files = {"file": (filename, f, "application/pdf")}
            
            response = requests.post(
                f"{API_URL}/upload/{collection_name}",  # <--- HERE IS THE MAGIC
                files=files
            )
            
            if response.status_code == 200:
                print(f"✅ Success! Added to '{collection_name}'.")
                print(f"   Task ID: {response.json().get('task_id')}")
            else:
                print(f"❌ Failed: {response.text}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    ingest_admin_book()