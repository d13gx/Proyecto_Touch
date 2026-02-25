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

REM Cambiar al directorio principal del proyecto
cd /d "%~dp0"

REM Configurar entorno automáticamente si es necesario
echo [0/4] Configurando entorno para esta máquina...
if exist "setup_environment.py" (
    python setup_environment.py
) else (
    echo [!] Script de configuración no encontrado, usando configuración existente...
)

REM Mostrar información de red
echo.
echo ===== INFORMACIÓN DE RED =====
echo IP del servidor: %IP_ADDRESS%
echo Red local: 172.18.0.0/16
echo =============================
echo.

REM Verificar entorno virtual
echo [1/4] Verificando entorno virtual...
if exist "venv\Scripts\activate.bat" (
    echo [OK] Entorno virtual encontrado
) else (
    echo [!] Creando entorno virtual...
    python -m venv venv
    echo [OK] Entorno virtual creado
)

REM Activar entorno virtual y verificar Django
echo [2/4] Verificando Django...
call venv\Scripts\activate.bat

python -c "import django" 2>nul
if %errorlevel% neq 0 (
    echo [!] Instalando Django y dependencias...
    pip install django djangorestframework django-cors-headers
    echo [OK] Django instalado
) else (
    echo [OK] Django ya esta instalado
)

REM Ejecutar migraciones
echo [OK] Ejecutando migraciones...
python manage.py migrate --noinput

REM Mostrar la dirección IP para acceso en red
echo.
echo =============================================
echo  Servidor accesible en la red local en:
echo  http://%IP_ADDRESS%:5173/home
echo.
echo  Asegurate de que:
echo  1. Ambos dispositivos esten en la misma red
echo  2. El firewall permite conexiones en los puertos 8000, 3001 y 5173
echo =============================================
echo.

REM Iniciar servidor Django (puerto 8000)
echo [3/4] Iniciando servidor Django en puerto 8000...
start "Backend Django" cmd /k "title Django Backend - Puerto 8000 && cd /d %~dp0 && echo. && echo ======================================== && echo     Django Backend - PUERTO 8000 && echo     http://0.0.0.0:8000 && echo     Accesible desde: http://%IP_ADDRESS%:8000 && echo ======================================== && echo. && python manage.py runserver 0.0.0.0:8000"

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Iniciar servidor Node.js (puerto 3001) - Base de datos
echo [4/4] Iniciando servidor Node.js en puerto 3001...
if exist "client\backend\server.js" (
    start "Node.js API Server" cmd /k "title Node.js API Server - Puerto 3001 && cd /d %~dp0client\backend && echo. && echo ======================================== && echo     Node.js API Server - PUERTO 3001 && echo     http://%IP_ADDRESS%:3001 && echo ======================================== && echo. && node server.js"
) else (
    echo [!] No se ha encontrado server.js, omitiendo Node.js
)

REM Esperar 2 segundos
timeout /t 2 /nobreak >nul

REM Levantar servidor Vite (Frontend)
echo [Frontend] Iniciando servidor React en puerto 5173...
if exist "client\package.json" (
    start "React Frontend" cmd /k "title React Frontend - Puerto 5173 && cd /d %~dp0client && echo. && echo ======================================== && echo     React Frontend - PUERTO 5173 && echo     http://%IP_ADDRESS%:5173 && echo ======================================== && echo. && npm run dev -- --host %IP_ADDRESS%"
) else (
    echo [!] No se ha encontrado package.json, omitiendo React
)

REM Esperar 2 segundos para que los servidores se inicien
timeout /t 2 /nobreak >nul

REM Abrir navegador
echo.
echo [Navegador] Abriendo aplicación...
start http://localhost:5173/home
start http://%IP_ADDRESS%:5173/home

REM Mensaje final
echo.
echo ========================================
echo     PROYECTO INICIADO CORRECTAMENTE!
echo ========================================
echo.
echo SERVIDORES ACTIVOS:
echo    Django API:     http://0.0.0.0:8000 (acceso: http://%IP_ADDRESS%:8000)
echo    Node.js API:    http://%IP_ADDRESS%:3001  
echo    React Frontend: http://%IP_ADDRESS%:5173
echo.
echo ACCESO DESDE OTROS DISPOSITIVOS:
echo    Django: http://%IP_ADDRESS%:8000
echo    Para visitantes: http://%IP_ADDRESS%:3001/Cuestionario
echo    QR generado con: http://%IP_ADDRESS%:3001
echo.
echo ========================================
echo.
echo Las ventanas de los servidores se abrirán
echo automáticamente. NO las cierres.
echo.
echo Presiona cualquier tecla para salir...
pause >nul
