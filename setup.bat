@echo off
REM SmartCollab Monorepo Setup Script (Windows)

setlocal enabledelayedexpansion

echo.
echo 🚀 SmartCollab Monorepo Setup
echo ==============================

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js ^>= 18
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%

REM Check for pnpm
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm is not installed. Installing...
    call npm install -g pnpm
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo ✓ pnpm %PNPM_VERSION%

REM Setup Java service directories
echo.
echo 📁 Setting up Java service directories...

set NOTIFICATION_SERVICE_DIR=java-service\notification-service

if not exist "%NOTIFICATION_SERVICE_DIR%\src\main\java\com\smartcollab\notification" (
    mkdir "%NOTIFICATION_SERVICE_DIR%\src\main\java\com\smartcollab\notification"
    mkdir "%NOTIFICATION_SERVICE_DIR%\src\main\resources"
    mkdir "%NOTIFICATION_SERVICE_DIR%\src\test\java"
    echo   ✓ Created notification-service directory structure
)

if exist "%NOTIFICATION_SERVICE_DIR%\NotificationServiceApplication.java" (
    move "%NOTIFICATION_SERVICE_DIR%\NotificationServiceApplication.java" ^
         "%NOTIFICATION_SERVICE_DIR%\src\main\java\com\smartcollab\notification\"
    echo   ✓ Moved NotificationServiceApplication.java
)

if exist "%NOTIFICATION_SERVICE_DIR%\application.yml" (
    move "%NOTIFICATION_SERVICE_DIR%\application.yml" ^
         "%NOTIFICATION_SERVICE_DIR%\src\main\resources\"
    echo   ✓ Moved application.yml
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call pnpm install
echo   ✓ Dependencies installed

REM Generate Prisma client
echo.
echo 🔧 Generating Prisma client...
call pnpm prisma generate
echo   ✓ Prisma client generated

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Configure environment variables in .env files
echo 2. Run: pnpm dev:all (to start all services)
echo.
echo 📚 For more info, see SETUP_GUIDE.md
echo.
