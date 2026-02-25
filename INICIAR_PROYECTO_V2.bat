@echo off
title Proyecto Touch - Inicio Automatico
color 0A
cls
 
echo ========================================
echo     PROYECTO TOUCH - INICIO COMPLETO
echo ========================================
echo.
echo Este script iniciara automaticamente:
echo   1. Backend Django (API de Datos)
echo   2. Backend Node.js (API Server)  
echo   3. Frontend React (Aplicación)
echo.
echo ========================================
echo.
 
:: Cambiar al directorio principal
cd /d "%~dp0"
 
:: Verificar entorno virtual
echo [1/3] Verificando entorno virtual...
if exist "venv\Scripts\activate.bat" (
    echo [OK] Entorno virtual encontrado
) else (
    echo [!] Creando entorno virtual...
    python -m venv venv
    echo [OK] Entorno virtual creado
)
 
:: Activar entorno virtual y verificar Django
echo [2/3] Verificando Django...
call venv\Scripts\activate.bat
 
python -c "import django" 2>nul
if %errorlevel% neq 0 (
    echo [!] Instalando Django y dependencias...
    pip install django djangorestframework django-cors-headers
    echo [OK] Django instalado
) else (
    echo [OK] Django ya está instalado
)
 
:: Ejecutar migraciones
echo [OK] Ejecutando migraciones...
python manage.py migrate --noinput
 
:: Iniciar servidores
echo.
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
echo     PROYECTO INICIADO CORRECTAMENTE!
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