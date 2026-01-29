# Deployment Guide: fastV2 Microservice on AWS (Ubuntu)

This guide details how to deploy the `fastV2` FastAPI application and its Celery worker to an AWS EC2 instance (Ubuntu 22.04/24.04).

## 1. Prerequisites

- **AWS EC2 Instance**: Ubuntu Server (t3.medium or larger recommended due to AI/ML libraries).
- **Security Group**: Allow Inbound Traffic on ports:
    - `22` (SSH)
    - `80` (HTTP)
    - `443` (HTTPS) - *optional, for SSL*
    - `8000` (FastAPI) - *only if accessing directly without Nginx (not recommended)*
- **SSH Access**: You should be logged into your VPS terminal.

## 2. System Setup (Run on VPS)

Update the system and install necessary system dependencies, including Redis, Python tools, and PDF processing libraries (Tesseract/Poppler).

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Python and build tools
sudo apt install -y python3-pip python3-venv python3-dev build-essential

# Install Redis (Required for Celery)
sudo apt install -y redis-server
# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PDF & Image Processing Tools (Required for unstructured/img2pdf)
sudo apt install -y poppler-utils tesseract-ocr libmagic1 libgl1
```

## 3. Transfer Project Files

You need to get the `fastV2` folder onto the VPS.

### Option A: From Local Machine (SCP/Rsync)
*Run this from your **LOCAL** PowerShell/Terminal (NOT the VPS terminal)*:

Replace `your-key.pem` with your AWS key and `ubuntu@your-vps-ip` with your instance details.

```powershell
# Copy the fastV2 folder to the VPS home directory
scp -i path\to\your-key.pem -r c:\personalData\devProjects\medbax\fastV2 ubuntu@<YOUR_VPS_IP>:~/fastV2
```

### Option B: Git (If the repo is hosted)
*Run this on the **VPS** terminal*:

```bash
git clone <your-repo-url>
cd medbax/fastV2
```

## 4. Application Setup (Run on VPS)

Navigate to the project directory and set up the Python environment.

```bash
cd ~/fastV2

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Create .env File
You need to create the production `.env` file.

```bash
nano .env
```
Paste your configuration (ensure you add your real `OPENAI_API_KEY`):
```ini
OPENAI_API_KEY=sk-your-actual-api-key-here
# Add any other required env vars from your local .env
```
*(Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit)*

## 5. Configure Systemd Services

We will create system services to keep FastAPI and Celery running in the background and restart them automatically on reboot.

### A. FastAPI Service

```bash
sudo nano /etc/systemd/system/fastapi_app.service
```

Paste the following content:
```ini
[Unit]
Description=Gunicorn instance to serve FastAPI
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/fastV2
Environment="PATH=/home/ubuntu/fastV2/venv/bin"
# Run with uvicorn directly or via gunicorn. Here we use uvicorn for simplicity as per requirements.
ExecStart=/home/ubuntu/fastV2/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

### B. Celery Worker Service

```bash
sudo nano /etc/systemd/system/celery_worker.service
```

Paste the following content:
```ini
[Unit]
Description=Celery Worker for fastV2
After=network.target redis-server.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/fastV2
Environment="PATH=/home/ubuntu/fastV2/venv/bin"
# Command matches your start_services.bat logic but for Linux
ExecStart=/home/ubuntu/fastV2/venv/bin/celery -A celery_worker worker --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

### Start Services

```bash
# Reload systemd to recognize new services
sudo systemctl daemon-reload

# Start and enable FastAPI
sudo systemctl start fastapi_app
sudo systemctl enable fastapi_app

# Start and enable Celery
sudo systemctl start celery_worker
sudo systemctl enable celery_worker
```

### Check Status
```bash
# Check FastAPI
sudo systemctl status fastapi_app

# Check Celery
sudo systemctl status celery_worker
```

## 6. Accessing the Deployment

If you allowed port `8000` in your Security Group, you can now access the API at:
`http://<YOUR_VPS_IP>:8000/docs`

### (Optional) Setup Nginx as Reverse Proxy
For a production URL (port 80), install Nginx:

```bash
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/fastapi
```

Content:
```nginx
server {
    listen 80;
    server_name _;  # Or your domain name (e.g., api.medbax.com)

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/fastapi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

Now you can access it at `http://<YOUR_VPS_IP>/docs`.
