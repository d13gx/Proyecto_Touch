@echo off
echo 🔧 REPARANDO URLs...

call venv\Scripts\activate.bat

REM Crear urls.py corregido
echo Creando urls.py corregido...
python -c "
urls_content = '''\"\"\"
URL configuration for django_crud_api project.
\"\"\"
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.urls import re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('app_touch/', include('app_touch.urls')),
]

# PRIMERO - Archivos estáticos (DEBEN IR ANTES)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ÚLTIMO - Catch-all para React (DEBE IR AL FINAL)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
'''

with open('django_crud_api/urls.py', 'w', encoding='utf-8') as f:
    f.write(urls_content)

print('✅ URLs reparadas correctamente')
"

echo Verificando que DEBUG=True...
python -c "
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_crud_api.settings')
import django
django.setup()
from django.conf import settings
print('DEBUG:', settings.DEBUG)
if not settings.DEBUG:
    print('❌ ERROR: DEBUG debe ser True')
else:
    print('✅ DEBUG está correcto')
"

echo.
echo ✅ REPARACIÓN COMPLETADA
echo 🌐 Iniciando servidor: http://localhost:8000
echo.

python manage.py runserver 127.0.0.1:8000
pause