# app_touch/middleware.py
import time
import hashlib
from venv import logger
from django.core.cache import cache
from django.http import JsonResponse

class DuplicateRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Solo aplicar a APIs de LDAP
        if request.path.startswith('/app_touch/api/ldap/') and request.method == 'GET':
            # Crear hash único de la request
            request_hash = hashlib.md5(
                f"{request.path}{request.GET.urlencode()}".encode()
            ).hexdigest()
            
            lock_key = f"request_lock_{request_hash}"
            
            # Si ya hay una request idéntica en proceso
            if cache.get(lock_key):
                logger.warning(f"🔄 Request duplicada bloqueada: {request.path}?{request.GET.urlencode()}")
                return JsonResponse({
                    'error': 'Request duplicada',
                    'message': 'Esta búsqueda ya está en proceso'
                }, status=429)
            
            # Bloquear por 3 segundos
            cache.set(lock_key, True, 3)
        
        response = self.get_response(request)
        return response