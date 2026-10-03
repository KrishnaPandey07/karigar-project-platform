@echo off
TITLE 🛑 कारीगर (Karigar) Services Stopper
chcp 65001 >nul
color 0C

echo ===================================================================
echo     🛑 कारीगर (Karigar) - सेवाएँ बंद की जा रही हैं...
echo ===================================================================
echo.

echo [*] Cloudflare टनल बंद की जा रही है...
taskkill /f /im cloudflared.exe >nul 2>nul

echo [*] पोर्ट्स (5173, 5000, 5432) मुक्त किए जा रहे हैं...
powershell -NoProfile -Command "$ports = @(5173, 5000, 5432); foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; if ($conns) { foreach ($c in $conns) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; } } }" >nul 2>nul

echo.
echo [✓] कारीगर की सभी सेवाएँ (Database, Backend, Frontend, Tunnel) सफलतापूर्वक बंद कर दी गई हैं।
echo.
pause
