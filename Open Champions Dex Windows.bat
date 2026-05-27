@echo off
setlocal

cd /d "%~dp0"

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  set "PY_CMD=py -3"
) else (
  where python >nul 2>nul
  if %ERRORLEVEL%==0 (
    set "PY_CMD=python"
  ) else (
    echo Python is nodig om deze app lokaal te starten.
    echo Installeer Python vanaf https://www.python.org/downloads/windows/
    echo Vink tijdens installatie "Add python.exe to PATH" aan.
    pause
    exit /b 1
  )
)

for /f %%P in ('%PY_CMD% -c "import socket; s=socket.socket(); s.bind(('127.0.0.1', 0)); print(s.getsockname()[1]); s.close()"') do set "PORT=%%P"

set "URL=http://127.0.0.1:%PORT%"

echo Champions Dex wordt gestart...
echo App-map: %CD%
echo Adres: %URL%
echo.
echo Sluit dit venster om de app te stoppen.

start "" "%URL%"
%PY_CMD% -m http.server %PORT% --bind 127.0.0.1
