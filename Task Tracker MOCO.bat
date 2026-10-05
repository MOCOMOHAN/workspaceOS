@echo off
echo ===================================================
echo   WorkspaceOS 30-Day Execution Protocol Startup
echo ===================================================
echo.

echo [1/3] Booting AI Core (Ollama LLaMA 3.1)...
:: Launches Ollama completely invisibly in the background
powershell -Command "Start-Process ollama -ArgumentList 'run llama3.1:8b' -WindowStyle Hidden"

echo [2/3] Booting Voice Engine (Docker)...
:: Force start Docker Desktop in the background (hidden)
echo Booting Docker Desktop (Waiting for engine to start)...
powershell -Command "Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden"

:: Loop to wait until the Docker Daemon is fully online
:DOCKER_WAIT
docker info >nul 2>&1
if errorlevel 1 (
    timeout /t 2 /nobreak >nul
    goto DOCKER_WAIT
)

:: Docker is online! Start Kokoro
docker start kokoro-tts >nul 2>&1
if errorlevel 1 (
    echo Creating new Kokoro TTS container...
    docker run -d --name kokoro-tts -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
) else (
    echo Kokoro TTS container started successfully!
)

echo.
echo [3/3] Booting UI Dashboard (React/Vite)...
:: Changes directory to the project folder and starts Vite in a new window
cd /d "d:\moco workspace\projects\protos\workspaceOS"
start "WorkspaceOS Dashboard" cmd /c "npm run dev"

echo.
echo Waiting for Vite server to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ===================================================
echo ALL SYSTEMS ARE ONLINE.
echo - Your LLM is running in a separate window.
echo - Your Voice Engine is running in the background via Docker.
echo - Your Dashboard is booting up in a separate window.
echo ===================================================
echo.
echo Launcher will now self-destruct...
timeout /t 2 /nobreak >nul
exit
