@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Proyecto Touch - Inicio Automatico
color 0A
cls

:: Verificar si se ejecuta con privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Este script necesita privilegios de administrador para configurar el inicio automatico
    echo [!] Por favor, ejecuta como administrador o presiona cualquier tecla para continuar sin configurar inicio automatico
    pause >nul
    goto :normal_start
)

:: Configurar inicio automatico
echo [CONFIG] Configurando inicio automatico del sistema...
set "startup_folder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "shortcut_path=%startup_folder%\Proyecto_Touch.lnk"
set "batch_path=%~dp0%~nx0"

:: Crear acceso directo en la carpeta de inicio
echo [CONFIG] Creando acceso directo en carpeta de inicio...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcut_path%'); $Shortcut.TargetPath = '%batch_path%'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Description = 'Iniciar Proyecto Touch automaticamente'; $Shortcut.Save()"

if exist "%shortcut_path%" (
    echo [OK] Acceso directo creado correctamente en: %startup_folder%
    echo [OK] El proyecto se iniciara automaticamente al encender el PC
) else (
    echo [!] Error al crear acceso directo, el inicio automatico no se configurara
)

:normal_start
 
echo ========================================
echo     PROYECTO TOUCH - INICIO COMPLETO
echo ========================================
echo.
echo Este script iniciara automaticamente:
echo   1. Backend Django (API de Datos)
echo   2. Backend Node.js (API Server)  
echo   3. Frontend React (Aplicacion)
echo.
echo Opciones disponibles:
echo   - Presiona 'Q' para salir sin iniciar
echo   - Presiona 'R' para remover inicio automatico
echo   - Presiona cualquier otra tecla para iniciar normalmente
echo.
choice /c QR /n /m "Presiona una tecla..."
if errorlevel 2 goto :remove_autostart
if errorlevel 1 goto :exit_script
echo ========================================
echo.
 
:: Cambiar al directorio principal
cd /d "%~dp0"

set "IP_172="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /R /C:"IPv4.*172\."') do (
    set "IP_172=%%A"
    goto :got_ip_172
)
:got_ip_172
if defined IP_172 set "IP_172=%IP_172: =%"
if defined IP_172 (
    set "APP_URL=http://%IP_172%:5173"
) else (
    set "APP_URL=http://localhost:5173"
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
    pip install django djangorestframework django-cors-headers || echo [!] Error en Django, continuando...
    echo [OK] Django procesado
) else (
    echo [OK] Django ya esta instalado
)

:: Instalar dependencias de Python desde requirements.txt
echo [Python] Instalando dependencias desde requirements.txt...
if exist "requirements.txt" (
    pip install -r requirements.txt || echo [!] Error en requirements.txt, continuando...
    echo [OK] Dependencias de Python procesadas
) else (
    echo [!] No se encontro requirements.txt, omitiendo instalacion de dependencias
)

:: Ejecutar migraciones
echo [OK] Ejecutando migraciones...
python manage.py migrate --noinput || echo [!] Error en migraciones, continuando...

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
echo [React] Iniciando aplicacion React en puerto 5173...
if exist "client\package.json" (
    start "React Frontend" cmd /k "title React Frontend - Puerto 5173 && cd /d %~dp0client && echo. && echo ======================================== && echo     React Frontend - PUERTO 5173 && echo     http://localhost:5173 && echo ======================================== && echo. && npm run dev -- --host"
) else (    
    echo [OK] No se ha encontrado package.json, omitiendo React
)

timeout /t 2 /nobreak >nul
start "Proyecto Touch" "%APP_URL%"
 
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
echo URL PRINCIPAL (TOTEM):
echo   %APP_URL%
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
goto :end

:remove_autostart
echo.
echo [CONFIG] Removiendo inicio automatico...
set "startup_folder=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "shortcut_path=%startup_folder%\Proyecto_Touch.lnk"

if exist "%shortcut_path%" (
    del "%shortcut_path%"
    echo [OK] Inicio automatico removido correctamente
) else (
    echo [!] No se encontro acceso directo para remover
)
echo.
echo Presiona cualquier tecla para salir...
pause >nul
goto :end

:exit_script
echo.
echo [INFO] Saliendo sin iniciar el proyecto...
echo Presiona cualquier tecla para salir...
pause >nul

:end