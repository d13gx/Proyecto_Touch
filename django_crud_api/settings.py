"""
Django settings for django_crud_api project.
"""

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
SECRET_KEY = 'django-insecure-w1+=z-%g&&+_+hpv%6x^=4nl9l@bckayr%wgc*kv81ip6q3lnc'

DEBUG = True

# Allow all hosts for development (not recommended for production)
ALLOWED_HOSTS = ['*']

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True  # Solo para desarrollo
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://172.18.7.150:5173",
    "http://172.18.8.94:5173", #totem
    "http://172.19.7.96:5173", #diego
    "http://172.18.0.0/16",  # Rango de red local
    "http://172.19.0.0/16",  # Rango de red local
    "http://192.168.0.0/16", # Rango de red local
    "http://10.0.0.0/8"      # Rango de red local
]

# Configuración de seguridad para desarrollo (ajustar en producción)
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://172.18.8.94:5173', #totem
    'http://172.18.7.150:5173',
    'http://172.19.7.96:5173'  #diego
]

# Configuración de sesión
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True  # Requiere HTTPS en producción
CSRF_COOKIE_SECURE = True  # Requiere HTTPS en producción

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'drf_spectacular',
    'app_touch',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DEBE IR PRIMERO
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',  # MANTENER ACTIVADO
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'app_touch.middleware.DuplicateRequestMiddleware',
]

ROOT_URLCONF = 'django_crud_api.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_crud_api.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# CONFIGURACIÓN CORS - CRÍTICA PARA EL FRONTEND
# =============================================================================

# Configuración CORS para desarrollo
# Configuración CORS para desarrollo
CORS_ALLOW_ALL_ORIGINS = True  # ← CAMBIAR A True temporalmente
CORS_ALLOW_CREDENTIALS = True  # IMPORTANTE: Permitir cookies

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",    
    "http://172.18.7.150:5173",
    "http://172.18.8.94:5173", #totem
]

# Headers permitidos - AGREGAR MÁS HEADERS
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'pragma',  # ← AGREGAR ESTO
    'cache-control',  # ← AGREGAR ESTO
]

# Métodos HTTP permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Configuración de cookies para desarrollo
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1 hora

CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False  # Debe ser False para que JS pueda leerlo
CSRF_USE_SESSIONS = False
CSRF_TRUSTED_ORIGINS = [  # AGREGAR ESTO
    "http://172.18.7.150:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://172.18.8.94:5173", #totem
]

# =============================================================================
# CONFIGURACIÓN REST FRAMEWORK - ACTUALIZADA
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Cambiar a IsAuthenticated si es necesario
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

# =============================================================================
# CONFIGURACIÓN LDAP
# =============================================================================

LDAP_CONFIG = {
    'HOST': 'cmfad1',
    'PORT': 389,
    'BASE_DN': 'DC=cmf,DC=cl',
    'USER_DN': 'totem@cmf.cl',
    'PASSWORD': 'Martina_0390.-',
}

# =============================================================================
# CONFIGURACIÓN EMAIL
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.office365.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = LDAP_CONFIG['USER_DN']
EMAIL_HOST_PASSWORD = LDAP_CONFIG['PASSWORD']
DEFAULT_FROM_EMAIL = LDAP_CONFIG['USER_DN']

# =============================================================================
# CONFIGURACIÓN MEDIA FILES
# =============================================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'trabajadores'

# =============================================================================
# CONFIGURACIÓN LOGGING
# =============================================================================
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'formatter': 'verbose',
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'app_touch': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'app_touch': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =============================================================================
# CONFIGURACIÓN CACHE - NUEVA SECCIÓN (AGREGAR ESTO)
# =============================================================================

# Configuración de cache para desarrollo (usando base de datos)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'django_cache_table',
        'TIMEOUT': 60 * 60 * 24 * 14,  # 2 semanas en segundos
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
            'CULL_FREQUENCY': 3,
        }
    }
}

# Tiempos de cache específicos (para usar en las vistas)
LDAP_CACHE_TIMEOUT = 60 * 60 * 24  # 1 día para datos LDAP
GENERAL_CACHE_TIMEOUT = 60 * 60 * 24 * 14  # 2 semanas para datos generales

# Para producción, usar Redis (recomendado) - OPCIONAL:
"""
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'TIMEOUT': 60 * 60 * 24 * 14,  # 2 semanas
        },
        'KEY_PREFIX': 'touch_app'
    }
}
"""