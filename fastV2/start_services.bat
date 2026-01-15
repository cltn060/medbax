@echo off
REM Quick Startup Script for Production RAG System
REM Run this in PowerShell or CMD

echo.
echo ===================================================
echo   Medical RAG System - Production Grade v3.0
echo ===================================================
echo.

REM Check if Redis is running
echo [1/4] Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo   X Redis is not running!
    echo   Start Redis manually: redis-server
    echo.
    pause
    exit /b 1
) else (
    echo   √ Redis is running
)

REM Check if Python dependencies are installed
echo [2/4] Checking dependencies...
python -c "import lancedb, celery, fastapi" >nul 2>&1
if %errorlevel% neq 0 (
    echo   X Dependencies not installed!
    echo   Run: pip install -r requirements.txt
    echo.
    pause
    exit /b 1
) else (
    echo   √ Dependencies installed
)

REM Check if .env exists
echo [3/4] Checking environment...
if not exist ".env" (
    echo   X .env file not found!
    echo   Create .env with: OPENAI_API_KEY=your_key_here
    echo.
    pause
    exit /b 1
) else (
    echo   √ .env file found
)

echo [4/4] Ready to start services
echo.
echo ===================================================
echo   Starting services...
echo ===================================================
echo.

REM Start Celery Worker in a new window
echo Starting Celery Worker...
start "Celery Worker" cmd /k "celery -A celery_worker worker --loglevel=info --pool=solo"
timeout /t 3 /nobreak >nul

REM Start FastAPI Server in a new window
echo Starting FastAPI Server...
start "FastAPI Server" cmd /k "uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo   √ All services started!
echo ===================================================
echo.
echo Services running:
echo   - Redis: localhost:6379
echo   - Celery Worker: Check worker window
echo   - FastAPI: http://localhost:8000
echo.
echo Check http://localhost:8000 for health status
echo Check http://localhost:8000/docs for API documentation
echo.
echo Press Ctrl+C in each window to stop services
echo.
pause
