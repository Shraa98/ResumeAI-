@echo off
title ResumeAI Launcher
echo ===================================================
echo             ResumeAI - Server Launcher            
echo ===================================================
echo.

:: 1. Launch Backend
echo [1/2] Starting Python FastAPI Backend on http://localhost:8000...
start "ResumeAI Backend" cmd /k "cd backend && echo Activating virtual environment... && call venv\Scripts\activate && echo Installing dependencies... && pip install -r requirements.txt && echo Starting FastAPI server... && uvicorn app.main:app --reload --port 8000"

:: 2. Launch Frontend
echo [2/2] Starting React Vite Frontend on http://localhost:5173...
start "ResumeAI Frontend" cmd /k "cd frontend && echo Installing npm packages... && npm install && echo Starting Vite development server... && npm run dev"

echo.
echo ===================================================
echo  Both services have been launched in separate windows!
echo.
echo  - Frontend Dev Server: http://localhost:5173
echo  - Backend API Server:  http://localhost:8000
echo  - API Health Check:    http://localhost:8000/api/health
echo ===================================================
echo.
pause
