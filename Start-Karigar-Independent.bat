@echo off
TITLE Karigar 24x7 Runner
chcp 65001 >nul
color 0E

set PATH=C:\Program Files\nodejs;C:\Program Files (x86)\cloudflared;%PATH%

if exist "C:\Users\24f20\Desktop\LocalLink" cd /d "C:\Users\24f20\Desktop\LocalLink"
if exist "%~dp0LocalLink" cd /d "%~dp0LocalLink"

node scripts/launch-karigar.js

echo.
pause
