@echo off
cd /d "%~dp0"
echo.
echo === Wonderland fix and run ===
echo Folder: %CD%
echo.

echo [1] Node version:
node -v
if errorlevel 1 (
  echo ERROR: Node.js is not installed. Install from https://nodejs.org  LTS version.
  pause
  exit /b 1
)

echo [2] Checking package.json for eslint conflict...
findstr /C:"@eslint/js" package.json >nul 2>&1
if not errorlevel 1 (
  echo WARNING: package.json still has @eslint/js - install may fail.
  echo Replace package.json with the fixed one first.
)

echo [3] Cleaning old install...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo [4] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo npm install FAILED. Scroll up for the red error.
  pause
  exit /b 1
)

echo [5] Checking vite is installed...
if not exist "node_modules\vite\package.json" (
  echo ERROR: vite was not installed. Trying direct install...
  call npm install vite@5.4.8 @vitejs/plugin-react@4.3.2 --save-dev --legacy-peer-deps
)

echo [6] Starting server with npx vite...
echo Open http://localhost:5173 in your browser when ready.
echo.
call npx vite --host --port 5173
echo.
echo Server stopped. If you saw an error above, copy it fully.
pause
