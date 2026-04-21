@echo off
echo Starting Backend (FastAPI)...
start cmd /k "cd backend && .\venv2\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting Frontend (Next.js)...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting in new windows!
echo Once they are ready, open http://localhost:3000 or http://127.0.0.1:3000 in your browser.
pause
