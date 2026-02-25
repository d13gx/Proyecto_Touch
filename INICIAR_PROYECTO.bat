@echo off
title INICIAR PROYECTO TOUCH
color 0A
echo.
echo ========================================
echo    INICIAR PROYECTO TOUCH
echo ========================================
echo.
echo Este script iniciara automaticamente:
echo   1. Backend Django (API de Datos)
echo   2. Backend Node.js (API Server)  
echo   3. Frontend React (Aplicacion)
echo.
echo ========================================
echo.

:: Cambiar al directorio principal
cd /d "%~dp0"

:: Configurar entorno automáticamente
echo [0/3] Configurando entorno para esta máquina...
python setup_environment.py
if %errorlevel% neq 0 (
    echo [!] Error en la configuración automática, continuando con configuración manual...
)

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
    echo [OK] Django ya esta instalado
)

:: Ejecutar migraciones
echo [OK] Ejecutando migraciones...
python manage.py migrate --noinput

:: Iniciar servidores
echo.
echo [3/3] Iniciando servidores...
echo.
    
:: Obtener IP local automáticamente
echo [2/5] Detectando IP local...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "ipv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :ip_found
    )
)

:ip_found
if not defined LOCAL_IP (
    set LOCAL_IP=127.0.0.1
)

echo [OK] IP local detectada: %LOCAL_IP%

:: Iniciar servidor Django con 0.0.0.0
echo [3/5] Iniciando servidor Django en puerto 8000...
if exist "manage.py" (
    start "Backend Django" cmd /k "title Django Backend - Puerto 8000 && cd /d %~dp0 && echo. && echo ======================================== && echo     Django Backend - PUERTO 8000 && echo     http://0.0.0.0:8000 && echo     Accesible desde: http://%LOCAL_IP%:8000 && echo ======================================== && echo. && python manage.py runserver 0.0.0.0:8000"
) else (
    echo [!] No se encontró manage.py, omitiendo Django
)

:: Esperar 2 segundos
timeout /t 2 /nobreak >nul

:: Iniciar Node.js con IP detectada
echo [4/5] Iniciando servidor Node.js en puerto 3001...
if exist "client\backend\server.js" (
    start "Node.js API Server" cmd /k "title Node.js API Server - Puerto 3001 && cd /d %~dp0client\backend && echo. && echo ======================================== && echo     Node.js API Server - PUERTO 3001 && echo     http://%LOCAL_IP%:3001 && echo ======================================== && echo. && node server.js"
) else (
    echo [!] No se ha encontrado server.js, omitiendo Node.js
)

:: Esperar 2 segundos
timeout /t 2 /nobreak >nul

:: Iniciar React con IP detectada
echo [5/5] Iniciando aplicacion React en puerto 5173...
if exist "client\package.json" (
    start "React Frontend" cmd /k "title React Frontend - Puerto 5173 && cd /d %~dp0client && echo. && echo ======================================== && echo     React Frontend - PUERTO 5173 && echo     http://%LOCAL_IP%:5173 && echo ======================================== && echo. && npm run dev -- --host %LOCAL_IP%"
) else (
    echo [!] No se ha encontrado package.json, omitiendo React
)

:: Mensaje final
echo.
echo ========================================
echo     PROYECTO INICIADO CORRECTAMENTE!
echo ========================================
echo.
echo SERVIDORES ACTIVOS:
echo    Django API:     http://0.0.0.0:8000
echo    Node.js API:    http://%LOCAL_IP%:3001  
echo    React Frontend: http://%LOCAL_IP%:5173
echo.
echo ACCESO DESDE OTROS DISPOSITIVOS:
echo    Django: http://%LOCAL_IP%:8000
echo Para visitantes: http://%LOCAL_IP%:3001/Cuestionario
echo  QR generado con: http://%LOCAL_IP%:3001
echo.
echo ========================================
echo.
echo Las ventanas de los servidores se abrirán
echo automáticamente. NO las cierres.
echo.
echo Presiona cualquier tecla para salir...
pause >nul
