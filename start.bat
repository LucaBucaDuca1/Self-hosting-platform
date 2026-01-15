@echo off
setlocal enabledelayedexpansion
title Zeloz Streaming Platform

cls
echo ================================================
echo        🎬 Zeloz Streaming Platform 🎬
echo        Starting your private Netflix...
echo ================================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: 16.x or higher
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected
echo.

REM Check if npm is installed
echo [INFO] Checking npm installation...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    echo Please install npm (comes with Node.js)
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% detected
echo.

REM Check which dependencies need to be installed
set NEED_INSTALL=0

if not exist "node_modules" (
    echo [INFO] Root dependencies not found
    set NEED_INSTALL=1
)

if not exist "backend\node_modules" (
    echo [INFO] Backend dependencies not found
    set NEED_INSTALL=1
)

if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies not found
    set NEED_INSTALL=1
)

if !NEED_INSTALL! EQU 1 (
    echo.
    echo [INSTALLING] Installing dependencies...
    echo This may take 2-5 minutes on first run...
    echo.

    echo [1/3] Installing root dependencies...
    call npm install --silent
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install root dependencies
        echo Try running: npm install
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    echo [OK] Root dependencies installed

    echo [2/3] Installing backend dependencies...
    cd backend
    call npm install --silent
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install backend dependencies
        echo Try running: cd backend ^&^& npm install
        cd ..
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    cd ..
    echo [OK] Backend dependencies installed

    echo [3/3] Installing frontend dependencies...
    cd frontend
    call npm install --silent
    if !ERRORLEVEL! NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies
        echo Try running: cd frontend ^&^& npm install
        cd ..
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed

    echo.
    echo [OK] All dependencies installed successfully!
) else (
    echo [OK] Dependencies already installed
)

echo.

REM Check if .env file exists
if not exist ".env" (
    echo [SETUP] Creating .env file...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] .env file created from example
        echo [WARNING] Remember to update JWT_SECRET in .env for production!
    ) else (
        echo [WARNING] .env.example not found, creating default .env
        (
            echo PORT=5000
            echo JWT_SECRET=change-this-to-a-random-string-in-production
            echo MAX_FILE_SIZE=10737418240
        ) > .env
        echo [OK] Default .env file created
    )
    echo.
)

REM Check if port 5000 is available
echo [INFO] Checking if port 5000 is available...
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>nul
if !ERRORLEVEL! EQU 0 (
    echo [ERROR] Port 5000 is already in use!
    echo.
    echo Please close the application using port 5000
    echo or change PORT in .env file
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [OK] Port 5000 is available
echo.
echo [OK] All checks passed!
echo.
echo ================================================
echo Starting servers...
echo ================================================
echo.
echo Backend will start on: http://localhost:5000
echo Frontend will start on: http://localhost:5173
echo.
echo Press Ctrl+C to stop both servers
echo.
echo ================================================
echo.

REM Open browser after a delay (in background)
start /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173" 2>nul

REM Start the application
call npm run dev

REM This runs when servers stop
echo.
echo ================================================
echo        Servers stopped. Goodbye! 👋
echo ================================================
echo.
echo Press any key to close...
pause >nul
