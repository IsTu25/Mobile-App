@echo off
echo ========================================
echo Community Safety App - Quick Start
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo [ERROR] Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Step 1: Installing Backend Dependencies...
cd backend
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Backend npm install failed
        pause
        exit /b 1
    )
)
echo [OK] Backend dependencies installed
echo.

echo Step 2: Installing Mobile Dependencies...
cd ..\mobile
if not exist "node_modules" (
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Mobile npm install failed
        pause
        exit /b 1
    )
)
echo [OK] Mobile dependencies installed
echo.

cd ..

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Start MongoDB (if not already running)
echo.
echo 2. Start Backend Server:
echo    Open Terminal 1:
echo    cd backend
echo    npm run seed     (first time only)
echo    npm run dev
echo.
echo 3. Start Mobile App:
echo    Open Terminal 2:
echo    cd mobile
echo    npm start
echo.
echo    Open Terminal 3:
echo    cd mobile
echo    npm run android
echo.
echo See MOBILE_SETUP.md for detailed instructions!
echo.
pause
