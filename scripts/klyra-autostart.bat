@echo off
title Klyra Auto-Deploy Server
cd /d C:\klyra
echo.
echo Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" /min cloudflared tunnel run
timeout /t 3 /nobreak >nul
echo Cloudflare Tunnel started.
echo.
echo Starting Klyra Auto-Deploy Server...
echo.
node deploy-webhook.js
pause
