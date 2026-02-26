@echo off
title Proyecto Touch - Iniciar Servidores
color 0A
cls
 
echo ========================================
echo     PROYECTO TOUCH - INICIAR SERVIDORES
echo ========================================
echo.
echo Este script iniciara los servidores asumiendo
echo que las dependencias ya estan instaladas.
echo.
echo Si es la primera vez, ejecuta:
echo   1. npm install (en client/)
echo   2. npm install (en client/backend/)
echo   3. pip install -r requirements.txt
echo.
echo ========================================
echo.
 
:: Cambiar al directorio principal
cd /d "%~dp0"
 
:: Activar entorno virtual
echo [1/3] Activando entorno virtual...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo [OK] Entorno virtual activado
) else (
    echo [!] No se encontro entorno virtual, creandolo...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [OK] Entorno virtual creado y activado
)

:: Ejecutar migraciones
echo [2/3] Ejecutando migraciones...
python manage.py migrate --noinput || echo [!] Error en migraciones, pero continuando...
 
:: Iniciar servidores
echo [3/3] Iniciando servidores...
echo.
 
:: Iniciar Django (puerto 8000)
echo [Django] Iniciando servidor Django en puerto 8000...
start "Django API Server" cmd /k "title Django API Server - Puerto 8000 && cd /d %~dp0 && call venv\Scripts\activate.bat && echo. && echo ======================================== && echo     Django API Server - PUERTO 8000 && echo     http://localhost:8000 && echo ======================================== && echo. && python manage.py runserver 0.0.0.0:8000"
 
:: Esperar 3 segundos
timeout /t 3 /nobreak >nul
 
:: Iniciar Node.js (puerto 3001)
echo [Node.js] Iniciando servidor Node.js en puerto 3001...
if exist "client\backend\server.js" (
    start "Node.js API Server" cmd /k "title Node.js API Server - Puerto 3001 && cd /d %~dp0client\backend && echo. && echo ======================================== && echo     Node.js API Server - PUERTO 3001 && echo     http://localhost:3001 && echo ======================================== && echo. && node server.js"
) else (
    echo [!] No se ha encontrado server.js, omitiendo Node.js
)
 
:: Esperar 2 segundos
timeout /t 2 /nobreak >nul
 
:: Iniciar React (puerto 5173)
echo [React] Iniciando aplicación React en puerto 5173...
if exist "client\package.json" (
    start "React Frontend" cmd /k "title React Frontend - Puerto 5173 && cd /d %~dp0client && echo. && echo ======================================== && echo     React Frontend - PUERTO 5173 && echo     http://localhost:5173 && echo ======================================== && echo. && npm run dev -- --host"
) else (
    echo [OK] No se ha encontrado package.json, omitiendo React
)
 
:: Mensaje final
echo.
echo ========================================
echo     SERVIDORES INICIADOS!
echo ========================================
echo.
echo   SERVICIOS ACTIVOS:
echo   Django API:     http://localhost:8000
echo   Node.js API:    http://localhost:3001  
echo   React App:      http://localhost:5173
echo.
echo ACCESO DESDE OTROS DISPOSITIVOS:
echo   1. Ejecuta: ipconfig
echo   2. Busca tu IP (ej: 192.168.1.X)
echo   3. Usa: http://[TU-IP]:5173
echo.
echo ========================================
echo.
echo Las ventanas de los servidores se abriran
echo automaticamente. NO las cierres.
echo.
echo Presiona cualquier tecla para salir...
pause >nul
