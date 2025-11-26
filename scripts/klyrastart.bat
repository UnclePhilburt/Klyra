@echo off
cd /d C:\klyra
echo Starting Klyra server on port 3001...
start "Klyra Server" cmd /k "node server.js 3001"
echo.
echo Server started! Check the new window for output.
echo Access the game at http://localhost:3001
