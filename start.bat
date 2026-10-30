@echo off
echo ==========================================================
echo  Iniciando Supply Chain D-Day & RN Intelligence
echo ==========================================================
echo.
echo 1. Iniciando Backend FastAPI (DuckDB) na porta 8000...
start "Backend - FastAPI" cmd /k "cd backend && uvicorn app.main:app --reload --port 8000"
echo 2. Iniciando Frontend Next.js na porta 3000...
cd frontend && npm run dev

