@echo off
echo 🚀 SOLUCIÓN DEFINITIVA - CONFIGURANDO...
echo.

REM Activar entorno virtual
call venv\Scripts\activate.bat

REM Build de React CON BASE CORRECTA
echo [1/4] Build de React con base /static/...
cd client
call npm run build
cd ..

REM Limpiar directorios
echo [2/4] Limpiando directorios...
if exist django_crud_api\templates rmdir /S /Q django_crud_api\templates
if exist staticfiles rmdir /S /Q staticfiles

REM Copiar archivos CORRECTAMENTE
echo [3/4] Copiando archivos...
mkdir django_crud_api\templates
mkdir staticfiles

REM Copiar SOLO index.html a templates
copy client\dist\index.html django_crud_api\templates\

REM Copiar TODO lo demás a staticfiles
xcopy /E /I client\dist staticfiles

REM Configurar Django
echo [4/4] Configurando Django...
python manage.py migrate
python manage.py collectstatic --noinput

echo.
echo ========================================
echo ✅ APLICACION LISTA EN: http://localhost:8000
echo ========================================
echo.

python manage.py runserver 127.0.0.1:8000
pause