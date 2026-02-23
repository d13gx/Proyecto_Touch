@echo off
setlocal enabledelayedexpansion

REM Obtener la dirección IP de la interfaz Ethernet
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=*" %%b in ("%%a") do set IP_ADDRESS=%%b
)

REM Limpiar espacios en blanco
echo IP cruda: !IP_ADDRESS!
set IP_ADDRESS=!IP_ADDRESS: =!

REM Si no se pudo obtener la IP, usar un valor por defecto
if "!IP_ADDRESS!"=="" set IP_ADDRESS=172.18.7.150

REM Mostrar información de red
echo.
echo ===== INFORMACIÓN DE RED =====
echo IP del servidor: %IP_ADDRESS%
echo Red local: 172.18.0.0/16
echo =============================
echo.

REM Mostrar la dirección IP para acceso en red
echo =============================================
echo  Servidor accesible en la red local en:
echo  http://%IP_ADDRESS%:5173/home
echo.
echo  Asegurate de que:
echo  1. Ambos dispositivos esten en la misma red
echo  2. El firewall permite conexiones en los puertos 8000 y 5173
echo =============================================
echo.

REM Levantar servidor Django
cd /d "C:\APP Interactiva"
call AppInteractiva\Scripts\activate.bat
start cmd /k python manage.py runserver 0.0.0.0:8000

REM Levantar servidor Vite
cd /d "C:\APP Interactiva\client"
start cmd /k npm run dev -- --host

REM Levantar APP
start http://localhost:5173/home
start http://%IP_ADDRESS%:5173/home
