@echo off
title Carruthers Family Dashboard
echo ===================================================
echo     Starting Carruthers Family Dashboard...
echo ===================================================
echo.
echo Launching local server at http://localhost:8080
echo Serving static files and local calendar proxy...
echo.

start "" http://localhost:8080
python server.py

pause
