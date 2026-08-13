@echo off
title Dumarche Paysage - Serveur local
cd /d "%~dp0"
echo.
echo   Demarrage du serveur Dumarche Paysage...
echo.
start "" http://localhost:3000
node server.js
pause
