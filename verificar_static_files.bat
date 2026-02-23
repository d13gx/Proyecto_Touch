@echo off
echo 🔍 VERIFICANDO STATIC FILES...

call venv\Scripts\activate.bat

echo 1. Verificando configuración...
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_crud_api.settings')
import django
django.setup()
from django.conf import settings

print('DEBUG:', settings.DEBUG)
print('STATIC_URL:', settings.STATIC_URL)
print('STATIC_ROOT:', settings.STATIC_ROOT)

# Verificar archivos
js_path = settings.STATIC_ROOT / 'assets' / 'index.js'
css_path = settings.STATIC_ROOT / 'assets' / 'index.css'
print('JS existe:', js_path.exists())
print('CSS existe:', css_path.exists())
"

echo.
echo 2. Probando servidor estático...
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_crud_api.settings')
import django
django.setup()
from django.test import Client
from django.conf import settings

client = Client()
response_js = client.get('/static/assets/index.js')
response_css = client.get('/static/assets/index.css')

print('JS status:', response_js.status_code)
print('CSS status:', response_css.status_code)
print('JS content type:', response_js.get('Content-Type', 'No header'))
print('CSS content type:', response_css.get('Content-Type', 'No header'))
"

echo.
echo 3. URLs configuradas...
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_crud_api.settings')
import django
django.setup()
from django.urls import get_resolver

resolver = get_resolver()
url_patterns = []
try:
    for pattern in resolver.url_patterns:
        url_patterns.append(str(pattern))
    print('Primeros 10 patrones de URL:')
    for pattern in url_patterns[:10]:
        print(' ', pattern)
except:
    print('No se pudieron obtener los patrones de URL')
"

pause