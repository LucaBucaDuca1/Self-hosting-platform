@echo off
title Zeloz Streaming Platform

echo ================================================
echo        🎬 Zeloz Streaming Platform 🎬
echo        Starting your private Netflix...
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo Recommended version: 16.x or higher
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    echo.
    echo Please install npm (comes with Node.js)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% detected
echo.

REM Check if dependencies are installed
if not exist "node_modules" goto :install_deps
if not exist "backend\node_modules" goto :install_deps
if not exist "frontend\node_modules" goto :install_deps
goto :deps_ok

:install_deps
echo [INSTALLING] Installing dependencies...
echo This may take a few minutes on first run...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install root dependencies
    pause
    exit /b 1
)

cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

echo [OK] Dependencies installed successfully
echo.
goto :deps_ok

:deps_ok
echo [OK] Dependencies already installed
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [SETUP] Creating .env file from example...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] .env file created
        echo [WARNING] Please update JWT_SECRET in .env for production!
        echo.
    ) else (
        echo [ERROR] .env.example not found
    )
)

REM Check if port 5000 is available
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] Port 5000 is already in use!
    echo.
    echo Please close the application using port 5000 or change PORT in .env
    echo.
    pause
    exit /b 1
)

echo [OK] All checks passed!
echo.
echo Starting servers...
echo ================================================
echo.

REM Open browser after a delay (in background)
start /B cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173"

REM Start the application
call npm run dev

echo.
echo ================================================
echo        Servers stopped. Goodbye! 👋
echo ================================================
pause
