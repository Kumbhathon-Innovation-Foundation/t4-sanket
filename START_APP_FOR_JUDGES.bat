@echo off
title ANUBHAV Demo Runner - Kumbhathon SPRINT 2026
echo ===================================================
echo     STARTING ANUBHAV (ZERO GRADLE - ZERO CRASH)
echo ===================================================

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ANUBHAV Backend API" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --port 8000"

timeout /t 2 >nul

echo [2/3] Starting Flutter Web App on http://localhost:3000 ...
start "ANUBHAV Web Server" cmd /k "cd /d %~dp0flutter_app\build\web && python -m http.server 3000"

timeout /t 2 >nul

echo [3/3] Launching Google Chrome ...
start "" "chrome.exe" "http://localhost:3000"

echo.
echo ===================================================
echo  READY FOR JUDGES!
echo.
echo  PRESENTATION TIP:
echo  In Chrome, press F12, then Ctrl+Shift+M to switch
echo  to mobile view (select iPhone 14 Pro or Pixel 7).
echo.
echo  Backend Swagger Docs: http://127.0.0.1:8000/docs
echo ===================================================
pause
