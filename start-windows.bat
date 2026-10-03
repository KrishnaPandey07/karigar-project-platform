@echo off
TITLE कारीगर (Karigar) - Local Development Launcher
echo ===================================================================
echo     कारीगर (Karigar) - भारत का विश्वसनीय कारीगर व सेवा मंच
echo ===================================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Checking dependencies...
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend && npm install && cd ..
)
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend && npm install && cd ..
)

echo [3/3] Starting Karigar Services (Database, Backend, Frontend)...
echo.
echo - Frontend will run on: http://localhost:5173
echo - Backend API will run on: http://localhost:5000
echo.
start "Karigar Database" cmd /k "cd backend && node scripts/start-db.js"
timeout /t 3 /nobreak >nul
start "Karigar Backend" cmd /k "cd backend && npm start"
timeout /t 2 /nobreak >nul
start "Karigar Frontend" cmd /k "cd frontend && npm run dev"

echo All services launched! You can now open http://localhost:5173 in your browser.
echo Press any key to close this launcher window (background services remain open)...
pause >nul
