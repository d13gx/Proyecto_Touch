# Standard library imports
import json
import logging
import smtplib
import time
import threading
import traceback
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from typing import Dict, List, Any, Optional

# Django imports
from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.core.cache import cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.timezone import make_aware

# Django REST Framework imports
from rest_framework import viewsets, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

# LDAP imports
from ldap3 import Server, Connection, ALL, SIMPLE
from ldap3.core.exceptions import LDAPException

# Local imports
from app_touch.models import Mapa, Ubicacion
from app_touch.serializer import MapaSerializer, UbicacionSerializer

# Configurar logger
logger = logging.getLogger(__name__)

# Constantes
CACHE_TIMEOUT = 60 * 60 * 24 * 14  # 2 semanas en segundos
LDAP_CACHE_TIMEOUT =  60 * 60 * 24 # 1 día para datos LDAP

# ========== SISTEMA DE BLOQUEO PARA EVITAR DUPLICADOS ==========

class RequestLockManager:
    """Gestor de bloqueos para prevenir requests duplicadas"""
    
    _locks = {}
    _lock = threading.Lock()
    
    @classmethod
    def acquire_lock(cls, key: str, timeout: int = 10) -> bool:
        """Adquirir bloqueo para una clave específica"""
        with cls._lock:
            if key in cls._locks:
                return False
            cls._locks[key] = {
                'timestamp': time.time(),
                'timeout': timeout
            }
            return True
    
    @classmethod
    def release_lock(cls, key: str):
        """Liberar bloqueo"""
        with cls._lock:
            cls._locks.pop(key, None)
    
    @classmethod
    def is_locked(cls, key: str) -> bool:
        """Verificar si una clave está bloqueada"""
        with cls._lock:
            if key not in cls._locks:
                return False
            
            lock_info = cls._locks[key]
            # Limpiar locks expirados
            if time.time() - lock_info['timestamp'] > lock_info['timeout']:
                cls._locks.pop(key)
                return False
            
            return True
    
    @classmethod
    def wait_for_lock(cls, key: str, max_wait: float = 2.0) -> bool:
        """Esperar a que se libere un bloqueo"""
        start_time = time.time()
        while cls.is_locked(key):
            if time.time() - start_time > max_wait:
                return False
            time.sleep(0.1)  # 100ms entre checks
        return True

# ========== FUNCIONES AUXILIARES MEJORADAS ==========

def add_cache_header(response, cache_hit: bool, cache_key: str = None):
    """Agregar header de cache a la respuesta con información extendida"""
    response['X-Cache'] = 'HIT' if cache_hit else 'MISS'
    
    # Agregar información adicional para debugging
    if cache_key:
        response['X-Cache-Key'] = cache_key[:100]  # Key truncada por seguridad
        
        # Intentar obtener TTL restante si es cache hit
        if cache_hit:
            try:
                # Para Redis y backends que soportan ttl
                if hasattr(cache, 'ttl'):
                    ttl = cache.ttl(cache_key)
                    if ttl is not None:
                        response['X-Cache-Expires-In'] = str(int(ttl))
                        response['X-Cache-Expires-At'] = str(int(time.time() + ttl))
            except Exception as e:
                logger.debug(f"No se pudo obtener TTL para {cache_key}: {e}")
    
    # Timestamp de la respuesta
    response['X-Cache-Timestamp'] = str(int(time.time()))
    
    return response

# Decoradores personalizados MEJORADOS
def handle_ldap_errors(func):
    """Decorador para manejar errores LDAP de forma consistente"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except LDAPException as e:
            logger.error(f"Error LDAP en {func.__name__}: {e}")
            return Response({'error': 'Error de conexión con el directorio activo'}, 
                          status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Error inesperado en {func.__name__}: {e}")
            return Response({'error': 'Error interno del servidor'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper

def cache_response(timeout: int, key_prefix: str = ""):
    """Decorador para cachear respuestas CON HEADERS MEJORADOS Y LOGGING DETALLADO"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Generar clave de cache única basada en parámetros
            cache_key = f"{key_prefix}_{func.__name__}_{request.GET.urlencode()}"
            
            # Verificar cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Obtener información de TTL para logging
                ttl_info = ""
                try:
                    if hasattr(cache, 'ttl'):
                        ttl = cache.ttl(cache_key)
                        if ttl is not None:
                            ttl_info = f" | Expira en: {int(ttl)}s"
                except:
                    pass
                
                # Extraer email para logging más legible
                email = "desconocido"
                if 'correo=' in cache_key:
                    try:
                        import urllib.parse
                        email_part = cache_key.split('correo=')[1].split('&')[0]
                        email = urllib.parse.unquote(email_part)
                    except:
                        pass
                
                logger.info(f"✅ CACHE HIT {key_prefix}: {email}{ttl_info}")
                response = Response(cached_response)
                return add_cache_header(response, True, cache_key)
            
            # Cache MISS - ejecutar función
            start_time = time.time()
            response = func(request, *args, **kwargs)
            execution_time = time.time() - start_time
            
            if response.status_code == status.HTTP_200_OK:
                cache.set(cache_key, response.data, timeout)
                
                # Logging detallado del cache miss
                email = "desconocido"
                if 'correo=' in cache_key:
                    try:
                        import urllib.parse
                        email_part = cache_key.split('correo=')[1].split('&')[0]
                        email = urllib.parse.unquote(email_part)
                    except:
                        pass
                
                logger.info(f"❌ CACHE MISS {key_prefix}: {email} | Timeout: {timeout}s | Ejecución: {execution_time:.2f}s")
                return add_cache_header(response, False, cache_key)
            
            return response
        return wrapper
    return decorator

# Helpers LDAP optimizados
class LDAPConnectionManager:
    """Gestor de conexiones LDAP con pooling básico"""
    
    @staticmethod
    def get_connection() -> Connection:
        """Obtener conexión LDAP configurada"""
        try:
            server = Server(
                settings.LDAP_CONFIG['HOST'],
                port=settings.LDAP_CONFIG['PORT'],
                get_info=ALL,
                connect_timeout=10
            )
            conn = Connection(
                server,
                user=settings.LDAP_CONFIG['USER_DN'],
                password=settings.LDAP_CONFIG['PASSWORD'],
                authentication=SIMPLE,
                auto_bind=True,
                receive_timeout=30
            )
            return conn
        except Exception as e:
            logger.error(f"Error creando conexión LDAP: {e}")
            raise

def procesar_atributos_ldap(attrs: Dict) -> Dict[str, Any]:
    """Procesar y normalizar atributos LDAP de forma segura"""
    resultado = {}
    
    for key, value in attrs.items():
        if isinstance(value, list):
            resultado[key] = value[0] if value and value[0] not in [None, ''] else None
        else:
            resultado[key] = value
    
    return resultado

def is_account_enabled(uac_value: Any) -> bool:
    """Verificar si cuenta está habilitada"""
    try:
        uac = int(uac_value) if uac_value else 0
        return not (uac & 2)  # Verificar bit de cuenta deshabilitada
    except (ValueError, TypeError):
        return True

def procesar_last_logon(raw_logon: Any) -> Optional[str]:
    """Procesar timestamp de último logon de forma segura"""
    if not raw_logon:
        return None
    
    try:
        if isinstance(raw_logon, datetime):
            return raw_logon.isoformat()
        elif str(raw_logon).isdigit():
            windows_epoch = datetime(1601, 1, 1)
            logon_time = windows_epoch + timedelta(microseconds=int(raw_logon) / 10)
            if logon_time.tzinfo is None:
                logon_time = make_aware(logon_time)
            return logon_time.isoformat()
    except Exception as e:
        logger.warning(f"Error procesando lastLogonTimestamp: {e}")
    
    return None

# ========== VISTAS PRINCIPALES ACTUALIZADAS ==========

@api_view(['GET'])
@handle_ldap_errors
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="ldap_search")
def search_ldap(request):
    """Búsqueda optimizada en LDAP con cache - MEJORADA"""
    query = request.GET.get('q', '').strip()
    if not query or len(query) < 2:
        logger.info(f"🔍 Búsqueda muy corta o vacía: '{query}'")
        return Response([])

    try:
        conn = LDAPConnectionManager.get_connection()
        
        # Construir filtro optimizado
        query_parts = query.split()
        subfilters = [f"(|(givenName=*{part}*)(sn=*{part}*)(mail=*{part}*))" for part in query_parts]
        search_filter = f"(&(objectClass=person)(company=Envases CMF S.A.){''.join(subfilters)})"

        # Atributos necesarios
        attributes = [
            'givenName', 'sn', 'mail', 'title', 'department',
            'lastLogonTimestamp', 'telephoneNumber', 'company', 
            'userAccountControl', 'distinguishedName','DisplayName'
        ]

        # Ejecutar búsqueda
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=attributes,
            size_limit=50
        )

        results = []
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            # Verificar compañía y cuenta habilitada
            if (attrs.get('company') != 'Envases CMF S.A.' or 
                not is_account_enabled(attrs.get('userAccountControl'))):
                continue

            # Procesar datos
            attrs['lastLogonTimestamp'] = procesar_last_logon(attrs.get('lastLogonTimestamp'))
            attrs['userAccountControl_enabled'] = True
            
            # Limpiar datos innecesarios
            attrs.pop('userAccountControl', None)
            
            results.append(attrs)

        conn.unbind()
        
        # ✅ LOG MEJORADO con emoji según resultados
        emoji = "✅" if results else "🔍"
        logger.info(f"{emoji} Búsqueda LDAP: '{query}' -> {len(results)} resultados")
        return Response(results)

    except Exception as e:
        logger.error(f"🚨 Error en búsqueda LDAP '{query}': {e}")
        return Response({'error': 'Error en la búsqueda'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@handle_ldap_errors
def trabajador_detail_ldap(request):
    """Detalle de trabajador con cache y sistema anti-duplicados MEJORADO"""
    correo = request.GET.get('correo', '').strip().lower()
    
    if not correo:
        return Response({'error': 'Correo requerido'}, status=400)
    
    # Clave de cache
    cache_key = f"trabajador_detail_{correo}"
    lock_key = f"lock_{cache_key}"
    
    # 1. VERIFICAR CACHE PRIMERO (MUY RÁPIDO)
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        logger.info(f"✅ CACHE HIT trabajador: {correo}")
        response = Response(cached_result)
        response['X-Cache'] = 'HIT'
        return response
    
    # 2. VERIFICAR SI YA HAY UNA REQUEST EN PROCESO PARA ESTE CORREO
    if RequestLockManager.is_locked(lock_key):
        logger.info(f"⏳ Request duplicada detectada para: {correo}, esperando...")
        # Esperar máximo 2 segundos por la respuesta cacheada
        if RequestLockManager.wait_for_lock(lock_key, max_wait=2.0):
            # Verificar cache nuevamente después de la espera
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.info(f"✅ CACHE HIT después de espera: {correo}")
                response = Response(cached_result)
                response['X-Cache'] = 'HIT'
                return response
    
    # 3. ADQUIRIR BLOQUEO PARA EVITAR DUPLICADOS
    if not RequestLockManager.acquire_lock(lock_key, timeout=10):
        logger.warning(f"🚨 No se pudo adquirir lock para: {correo}")
        return Response({'error': 'Demasiadas solicitudes simultáneas'}, status=429)
    
    try:
        logger.info(f"🔍 CACHE MISS trabajador: {correo} - Buscando en LDAP")
        
        # BUSCAR EN LDAP
        conn = LDAPConnectionManager.get_connection()
        
        search_filter = f"(&(objectClass=person)(mail={correo})(company=Envases CMF S.A.))"
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=[
                'givenName', 'sn', 'mail', 'title', 'department',
                'lastLogonTimestamp', 'telephoneNumber', 'company',
                'userAccountControl', 'manager', 'distinguishedName','DisplayName'
            ]
        )

        if not conn.entries:
            # Cachear también los "no encontrados" por 5 minutos
            cache.set(cache_key, {'error': 'Trabajador no encontrado'}, 300)
            logger.warning(f"❌ Trabajador no encontrado: {correo}")
            return Response({'error': 'Trabajador no encontrado'}, status=404)

        entry = conn.entries[0]
        persona = procesar_atributos_ldap(entry.entry_attributes_as_dict)
        
        if not is_account_enabled(persona.get('userAccountControl')):
            # Cachear cuentas deshabilitadas por 1 hora
            cache.set(cache_key, {'error': 'Cuenta deshabilitada'}, 3600)
            logger.warning(f"🚫 Cuenta deshabilitada: {correo}")
            return Response({'error': 'Cuenta deshabilitada'}, status=404)

        # Procesar datos
        persona['lastLogonTimestamp'] = procesar_last_logon(persona.get('lastLogonTimestamp'))
        persona['userAccountControl_enabled'] = True
        persona['supervisa_a'] = obtener_supervisados_optimizado(conn, persona)
        
        # Asegurar que DisplayName esté presente
        if 'DisplayName' not in persona or not persona['DisplayName']:
            persona['DisplayName'] = f"{persona.get('givenName', '')} {persona.get('sn', '')}".strip()
        
        persona.pop('userAccountControl', None)
        
        conn.unbind()
        
        # 4. GUARDAR EN CACHE (24 horas para detalles de trabajador)
        cache.set(cache_key, persona, 3600)
        logger.info(f"💾 CACHE SET trabajador: {correo} -> {len(persona.get('supervisa_a', []))} supervisados")
        
        response = Response(persona)
        response['X-Cache'] = 'MISS'
        return response

    except Exception as e:
        logger.error(f"🚨 Error en detalle trabajador {correo}: {e}")
        # En caso de error, limpiar cache para permitir reintento
        cache.delete(cache_key)
        return Response({'error': 'Error obteniendo detalles'}, status=500)
    
    finally:
        # SIEMPRE liberar el lock
        RequestLockManager.release_lock(lock_key)

def obtener_supervisados_optimizado(conn: Connection, persona: Dict) -> List[Dict]:
    """Obtener supervisados de forma optimizada - MEJORADA"""
    supervisados = []
    dn_actual = persona.get('distinguishedName')
    
    if not dn_actual:
        return supervisados

    try:
        # Escapar DN para búsqueda segura
        dn_escaped = dn_actual.replace('(', '\\28').replace(')', '\\29')
        search_filter = f"(&(objectClass=person)(manager={dn_escaped})(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=['givenName', 'sn', 'mail', 'title', 'department', 'userAccountControl','DisplayName']
        )
        
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            # Solo incluir cuentas habilitadas
            if not is_account_enabled(attrs.get('userAccountControl')):
                continue
            
            supervisado = {
                'givenName': attrs.get('givenName', ''),
                'sn': attrs.get('sn', ''),
                'mail': attrs.get('mail', ''),
                'title': attrs.get('title', ''),
                'department': attrs.get('department', ''),
                'userAccountControl_enabled': True
            }
            
            if supervisado['givenName'] and supervisado['sn']:
                supervisados.append(supervisado)
                
    except Exception as e:
        logger.warning(f"Error obteniendo supervisados para {persona.get('mail')}: {e}")
    
    return supervisados


# ========== VISTAS DE AUTENTICACIÓN MEJORADAS ==========

@api_view(['GET'])
def get_csrf_token(request):
    """Token CSRF optimizado"""
    return add_cache_header(JsonResponse({'csrfToken': get_token(request)}), False)

@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def login_ad(request):
    """Autenticación con Active Directory - MEJORADA CON LOGS"""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'error': 'Usuario y contraseña son requeridos'}, status=400)

    try:
        # Configuración del servidor LDAP
        server = Server(
            settings.LDAP_CONFIG['HOST'],
            port=settings.LDAP_CONFIG['PORT'],
            get_info=ALL
        )

        # Intentar autenticación con AD - FORMATOS DIFERENTES
        auth_success = False
        user_dn_formats = [
            f"{username}@cmf.cl",           # Formato user@domain
            f"cmf\\{username}",             # Formato domain\user
            username,                       # Solo usuario
        ]

        for user_dn in user_dn_formats:
            try:
                logger.debug(f"Intentando autenticar con: {user_dn}")
                
                conn = Connection(
                    server,
                    user=user_dn,
                    password=password,
                    authentication=SIMPLE,
                    auto_bind=True
                )
                
                # Si llegamos aquí, la autenticación fue exitosa
                # Buscar el usuario para obtener el displayName
                try:
                    # Primera búsqueda: solo los atributos básicos para autenticación
                    conn.search(
                        search_base=settings.LDAP_CONFIG['BASE_DN'],
                        search_filter=f"(sAMAccountName={username})",
                        attributes=['displayName', 'givenName', 'sn', 'mail', 'userPrincipalName']
                    )
                    
                    if conn.entries:
                        entry = conn.entries[0]
                        # Log detallado de los atributos encontrados
                        logger.info(f"Atributos encontrados para {username}:")
                        for attr in entry.entry_attributes:
                            logger.info(f"  {attr}: {getattr(entry, attr, 'No disponible')}")
                        
                        display_name = str(entry.displayName.value) if entry.displayName else username
                        first_name = str(entry.givenName.value) if entry.givenName else username
                        last_name = str(entry.sn.value) if entry.sn else ''
                        email = str(entry.mail.value) if entry.mail else f'{username}@cmf.cl'
                    else:
                        display_name = username
                        first_name = username
                        last_name = ''
                        email = f'{username}@cmf.cl'
                        
                except Exception as e:
                    logger.warning(f"Error obteniendo datos del usuario desde AD: {e}")
                    display_name = username
                    first_name = username
                    last_name = ''
                    email = f'{username}@cmf.cl'
                
                conn.unbind()
                logger.info(f"Autenticación exitosa con: {user_dn}")
                auth_success = True
                break
                
            except LDAPException as e:
                logger.debug(f"Falló autenticación con {user_dn}: {e}")
                continue

        if not auth_success:
            logger.warning(f"Intento de login fallido para usuario: {username}")
            return Response({
                'error': 'Credenciales inválidas. Verifica tu usuario y contraseña.'
            }, status=401)

        # Crear o actualizar usuario de Django con los datos del AD
        user, created = User.objects.update_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name
                # No guardamos DisplayName ya que no existe en el modelo estándar
                # Usamos first_name y last_name en su lugar
            }
        )
        
        # Hacer login en Django
        login(request, user)
        logger.info(f"Login exitoso para usuario: {username}")
        logger.info(f"Login exitoso para usuario: {display_name}")

        
        return Response({
            'mensaje': 'Login exitoso',
            'usuario': username,
            'email': user.email
        })
        
    except Exception as e:
        logger.error(f"Error inesperado en login para {username}: {e}")
        return Response({
            'error': 'Error interno del servidor. Contacta al administrador.'
        }, status=500)

@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout optimizado"""
    username = request.user.username
    logout(request)
    logger.info(f"Logout exitoso para usuario: {username}")
    return Response({'mensaje': 'Sesión cerrada exitosamente'})

@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([AllowAny])
def check_auth(request):
    """Verificación de autenticación optimizada"""
    if request.user.is_authenticated:
        return Response({
            'autenticado': True,
            'usuario': request.user.username,
            'email': request.user.email,
            'DisplayName': request.user.DisplayName
        })
    return Response({'autenticado': False})

def obtener_prioridad_jerarquia(titulo: str) -> int:
    """Obtener prioridad numérica para ordenar cargos jerárquicos
    
    Args:
        titulo (str): El título del cargo
        
    Returns:
        int: Prioridad numérica (menor número = mayor jerarquía)
    """
    if not titulo:
        return 999
        
    titulo = titulo.lower()
    
    # Prioridades de más alta a más baja
    if 'gerente general' in titulo:
        return 1
    elif 'gerente' in titulo and 'subgerente' not in titulo:
        return 2
    elif 'subgerente' in titulo:
        return 3
    elif 'jefe' in titulo or 'jefa' in titulo:
        return 4
    elif any(palabra in titulo for palabra in ['coordinador', 'coordinadora', 'encargado', 'encargada']):
        return 5
    else:
        return 6

def autenticar_smtp(server, username, password):
    """Maneja la autenticación SMTP con manejo de errores detallado"""
    try:
        server.login(username, password)
        logger.info(f"✅ Autenticación exitosa con: {username}")
        return True, None
        
    except smtplib.SMTPAuthenticationError as e:
        error_msg = str(e).lower()
        error_code = getattr(e, 'smtp_code', 0)
        smtp_error = getattr(e, 'smtp_error', b'').decode('utf-8', 'ignore')
        
        logger.error(f"❌ Error de autenticación SMTP (Código: {error_code}): {error_msg}")
        logger.error(f"⚠️ Respuesta del servidor: {smtp_error}")
        
        if error_code==535:
            error_code = '2FA_REQUIRED'
            error_msg = 'La autenticación requiere verificación en dos pasos (2FA). Por favor, verifica la configuración de tu cuenta de correo.'
        elif error_code == 535:
            error_code = 'AUTH_FAILED'
            error_msg = 'Error de autenticación: Usuario o contraseña incorrectos'
        else:
            error_code = 'AUTH_ERROR'
            
        return False, {'error': error_msg, 'error_code': error_code}
        
    except Exception as e:
        logger.error(f"❌ Error inesperado durante la autenticación: {str(e)}")
        return False, {
            'error': f'Error inesperado: {str(e)}',
            'error_code': 'AUTH_ERROR'
        }

@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def enviar_correo(request):
    """Enviar correo usando la cuenta de servicio totem@cmf.cl"""
    if request.method != 'POST':
        return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
    
    try:
        # Usar request.data de DRF que maneja automáticamente JSON y form-data
        data = request.data
        
        # Validar que hay datos
        if not data:
            return Response({
                'error': 'Cuerpo de la petición vacío',
                'error_code': 'EMPTY_BODY',
                'content_type': request.content_type,
                'method': request.method
            }, status=400)
            
        # Obtener campos del request
        destinatario = data.get('destinatario')
        asunto = data.get('asunto') #sera personalizado
        mensaje = data.get('mensaje')
        
        # Log de depuración
        logger.debug(f"Tipo de datos recibidos: {type(data)}")
        logger.debug(f"Contenido de data: {data}")
        logger.debug(f"Headers: {request.headers}")
        logger.debug(f"Content-Type: {request.content_type}")
        logger.debug(f"Método: {request.method}")
        logger.debug(f"Usuario autenticado: {request.user}")
        
        # Si es un QueryDict (formulario), convertirlo a diccionario
        if hasattr(data, 'dict'):
            data = data.dict()
        
        # Validar campos requeridos
        if not all([destinatario, asunto, mensaje]):
            campos_faltantes = []
            if not destinatario: campos_faltantes.append('destinatario')
            if not asunto: campos_faltantes.append('asunto')
            if not mensaje: campos_faltantes.append('mensaje')
            
            return Response({
                'error': f'Campos requeridos faltantes: {", ".join(campos_faltantes)}',
                'error_code': 'MISSING_FIELDS'
            }, status=400)

        # Configuración SMTP inicial con credenciales del usuario
        smtp_config = {
            'server': settings.EMAIL_HOST,
            'port': settings.EMAIL_PORT,
            'username': request.user.email or request.user.username,
            'password': request.data.get('password', ''),  # Se asume que la contraseña viene en la petición
            'use_tls': settings.EMAIL_USE_TLS
        }
        
        # Configuración de respaldo con cuenta TOTEM
        fallback_config = {
            'server': settings.EMAIL_HOST,
            'port': settings.EMAIL_PORT,
            'username': settings.EMAIL_HOST_USER,  # Usa las credenciales TOTEM de settings
            'password': settings.EMAIL_HOST_PASSWORD,
            'use_tls': settings.EMAIL_USE_TLS,
            'is_fallback': True  # Bandera para identificar que es el intento de respaldo
        }
        
        # Obtener el display_name del usuario autenticado
        display_name = getattr(request.user, 'DisplayName', '')
        

        # Si no hay display_name, intentar con first_name y last_name
        if not display_name:
            display_name = f"{request.user.first_name} {request.user.last_name}".strip()
            
        # Si aún no hay nombre, usar el nombre de usuario
        if not display_name:
            display_name = request.user.username
            
        remitente_email = request.user.email or f"{request.user.username}@cmf.cl"
        
        # Personalizar el asunto con el display_name
        asunto_personalizado = f"{display_name} te está contactando desde APP Interactiva"
      


        # Log de inicio
        logger.info("=" * 80)
        logger.info("📧 INICIO DE ENVÍO DE CORREO")
        logger.info(f"👤 Usuario: {display_name} <{remitente_email}>")
        logger.info(f"📨 Destinatario: {destinatario}")
        logger.info(f"📝 asunto_personalizado: {asunto_personalizado}")
        logger.info("-" * 40)

        # Configurar mensaje de correo
        msg = MIMEMultipart()
        msg['From'] = f'APPInteractiva <{smtp_config["username"]}>'
        msg['To'] = destinatario
        
          
        msg['Subject'] = asunto_personalizado
        msg['Reply-To'] = remitente_email
        msg['X-Mailer'] = 'AppInteractiva-CMF'
        msg.attach(MIMEText(mensaje, 'plain', 'utf-8'))
        
        logger.info(f"📤 Configuración de envío:")
        logger.info(f"   - Servidor SMTP: {smtp_config['server']}:{smtp_config['port']}")
        logger.info(f"   - Autenticación con: {smtp_config['username']}")

        # Función para intentar enviar el correo con una configuración SMTP dada
        def intentar_enviar_correo(config, es_respuesta=False):
            try:
                with smtplib.SMTP(config['server'], config['port']) as server:
                    server.ehlo()
                    if config['use_tls']:
                        server.starttls()
                        server.ehlo()
                    
                    # Autenticación
                    success, error = autenticar_smtp(
                        server, 
                        config['username'], 
                        config['password']
                    )
                    
                    if not success:
                        if error.get('error_code') == '2FA_REQUIRED' and not es_respuesta:
                            logger.warning("⚠️ Se requiere 2FA. Intentando con cuenta de respaldo...")
                            return None  # Indicar que se debe intentar con el respaldo
                        return error
                    
                    # Configurar remitente basado en la configuración actual
                    remitente_nombre_config = display_name
                    remitente_email_config = remitente_email
                    if es_respuesta:
                        remitente_nombre_config = f"{display_name} (via TOTEM)"
                        remitente_email_config = config['username']
                    
                    # Construir mensaje
                    msg = MIMEMultipart()
                    msg['From'] = f'{remitente_nombre_config} <{config["username"]}>'
                    msg['To'] = destinatario
                    msg['Subject'] = asunto_personalizado
                    
                    # Agregar cuerpo del mensaje
                    msg.attach(MIMEText(mensaje, 'plain'))
                    
                    # Enviar correo
                    server.send_message(msg)
                    logger.info(f"✅ Correo enviado correctamente usando cuenta: {config['username']}")
                    return True
                    
            except Exception as e:
                logger.error(f"❌ Error al enviar correo: {str(e)}")
                return {
                    'error': f'Error al enviar el correo: {str(e)}',
                    'error_code': 'SMTP_ERROR'
                }
            
            return {
                'error': 'Error desconocido al enviar el correo',
                'error_code': 'UNKNOWN_ERROR'
            }
        
        # Primero intentar con la cuenta del usuario
        resultado = intentar_enviar_correo(smtp_config)
        
        # Si falla con 2FA, intentar con la cuenta de respaldo
        if resultado is None:
            logger.info("🔁 Intentando enviar con cuenta de respaldo (TOTEM)...")
            resultado = intentar_enviar_correo(fallback_config, es_respuesta=True)
        
        # Si hay un error, devolverlo
        if resultado is not True:
            return Response(resultado, status=400)
        
        # Log de éxito
        logger.info("✅ Correo enviado exitosamente")
        logger.info(f"   - Remitente: {display_name} <{remitente_email}>")
        logger.info(f"   - Destinatario: {destinatario}")
        logger.info(f"   - Tamaño: {len(mensaje)} caracteres")
        logger.info("=" * 80 + "\n")
        
        return Response({
            'mensaje': 'Correo enviado exitosamente',
            'destinatario': destinatario,
            'asunto': asunto_personalizado
        })
        
    except smtplib.SMTPResponseException as e:
        error_code = e.smtp_code
        error_msg = str(e).strip()
        is_2fa_error = False
        
        # Detectar específicamente errores de 2FA
        if error_code == 535:
            error_lower = error_msg.lower()
            is_2fa_error = any(term in error_lower for term in [
                '2fa', 'two-factor', 'two factor', 'authentication code', 
                'mfa', 'multi-factor', 'multifactor', 'app password',
                'autenticación de dos factores', 'código de autenticación'
            ])
        
        logger.error("=" * 60)
        logger.error(f"❌ {'ERROR 2FA DETECTADO' if is_2fa_error else 'ERROR SMTP'} {error_code}")
        logger.error(f"Mensaje: {error_msg}")
        
        if error_code == 535:
            if is_2fa_error:
                logger.error("🔐 ERROR DE AUTENTICACIÓN DE DOS FACTORES (2FA)")
                logger.error("La cuenta de correo requiere autenticación de dos factores")
                logger.error("Solución: Genere una contraseña de aplicación en la configuración de su cuenta")
            else:
                logger.error("🔒 Error de autenticación SMTP")
            
            logger.error(f"Usuario: {smtp_config['username']}")
            logger.error("Por favor verifique las credenciales en la configuración de Django")
        
        logger.error("=" * 60)
        
        response_data = {
            'error': 'Error de autenticación 2FA' if is_2fa_error else f'Error SMTP {error_code} al enviar el correo',
            'details': error_msg,
            'error_code': 'SMTP_2FA_REQUIRED' if is_2fa_error else f'SMTP_{error_code}',
            'suggestion': 'Se requiere autenticación de dos factores. Genere una contraseña de aplicación en la configuración de su cuenta.' if is_2fa_error 
                        else 'Verifique la configuración del servidor SMTP y las credenciales.'
        }
        
        return Response(response_data, status=400)
        
    except smtplib.SMTPException as e:
        error_msg = str(e).strip()
        logger.error(f"❌ Error SMTP genérico: {error_msg}")
        
        return Response({
            'error': 'Error al enviar el correo',
            'details': error_msg,
            'error_type': 'smtp_error',
            'suggestion': 'Verifica la configuración del servidor SMTP o inténtalo de nuevo más tarde.'
        }, status=500)
                
    except Exception as e:
        error_type = type(e).__name__
        error_msg = f"❌ Error inesperado al enviar correo: {error_type}"
        logger.error(error_msg)
        logger.error("🔍 Detalles completos:")
        logger.error(f"   - Tipo: {error_type}")
        logger.error(f"   - Mensaje: {str(e)}")
        logger.error(f"   - Traceback: {traceback.format_exc()}")
        logger.error("=" * 80 + "\n")
        
        return Response({
            'error': 'Error interno del servidor',
            'details': f"Error inesperado: {error_type} - {str(e)}",
            'error_type': 'internal_server_error',
            'suggestion': 'Por favor, inténtalo de nuevo más tarde o contacta al administrador del sistema.'
        }, status=500)

# ========== VIEWSETS OPTIMIZADOS ==========

class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer
    
    def list(self, request, *args, **kwargs):
        """Lista optimizada con cache"""
        cache_key = 'ubicaciones_list'
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            response = Response(cached_data)
            return add_cache_header(response, True)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return add_cache_header(response, False)

class MapaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Mapa.objects.all()
    serializer_class = MapaSerializer
    
    def list(self, request, *args, **kwargs):
        """Lista optimizada con cache"""
        cache_key = 'mapas_list'
        cached_data = cache.get(cache_key)
        
        if cached_data is not None:
            response = Response(cached_data)
            return add_cache_header(response, True)
        
        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, CACHE_TIMEOUT)
        return add_cache_header(response, False)

# ========== VISTAS ADICIONALES MEJORADAS ==========

@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="departamento_detail")
def departamento_detail_ldap(request):
    """Detalle de departamento optimizado - MEJORADA"""
    nombre_departamento = request.GET.get('nombre', '').strip()
    if not nombre_departamento:
        return Response({'error': 'Nombre de departamento requerido'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        conn = LDAPConnectionManager.get_connection()
        
        search_filter = f"(&(objectClass=person)(department={nombre_departamento})(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=['givenName', 'sn', 'mail', 'title', 'department', 
                       'telephoneNumber', 'lastLogonTimestamp', 'userAccountControl']
        )

        trabajadores = []
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            # Solo cuentas habilitadas
            if not is_account_enabled(attrs.get('userAccountControl')):
                continue
            
            # Procesar datos
            attrs['lastLogonTimestamp'] = procesar_last_logon(attrs.get('lastLogonTimestamp'))
            attrs['userAccountControl_enabled'] = True
            attrs.pop('userAccountControl', None)
            
            trabajadores.append(attrs)

        conn.unbind()
        
        logger.info(f"Detalle departamento: {nombre_departamento} -> {len(trabajadores)} trabajadores")
        
        return Response({
            'departamento': nombre_departamento,
            'total_trabajadores': len(trabajadores),
            'trabajadores': trabajadores,
            'estadisticas': {
                'con_email': len([t for t in trabajadores if t.get('mail')]),
                'con_telefono': len([t for t in trabajadores if t.get('telephoneNumber')]),
                'con_cargo': len([t for t in trabajadores if t.get('title')])
            }
        })

    except Exception as e:
        logger.error(f"Error en detalle departamento {nombre_departamento}: {e}")
        return Response({'error': 'Error obteniendo departamento'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== TAREAS DE MANTENIMIENTO ==========

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def limpiar_cache_ldap(request):
    """Limpiar cache LDAP - CORREGIDA PARA DATABASECACHE"""
    if not settings.DEBUG and not request.user.is_staff:
        return Response({'error': 'Solo disponible en modo desarrollo o para staff'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        from django.db import connection
        entradas_eliminadas = 0
        
        with connection.cursor() as cursor:
            # Para DatabaseCache, necesitamos eliminar por patrones en SQL
            cursor.execute("""
                DELETE FROM django_cache 
                WHERE key LIKE '%ldap_%' 
                   OR key LIKE '%jefes_%' 
                   OR key LIKE '%arbol_%' 
                   OR key LIKE '%departamento_%'
            """)
            entradas_eliminadas = cursor.rowcount
        
        logger.info(f"Cache limpiado por {request.user.username}: {entradas_eliminadas} entradas eliminadas")
        return Response({
            'mensaje': f'Cache LDAP limpiado exitosamente',
            'entradas_eliminadas': entradas_eliminadas,
            'usuario': request.user.username
        })
        
    except Exception as e:
        logger.error(f"Error limpiando cache: {e}")
        return Response({'error': 'Error limpiando cache'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def health_check(request):
    """Endpoint de health check - NUEVA VISTA"""
    try:
        # Verificar conexión LDAP
        conn = LDAPConnectionManager.get_connection()
        ldap_status = conn.bound
        conn.unbind()
        
        # Verificar cache
        cache_status = cache.set('health_check', 'ok', 10)
        cache_works = cache.get('health_check') == 'ok'
        
        # Verificar base de datos
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = cursor.fetchone()[0] == 1
        
        return Response({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'services': {
                'ldap': ldap_status,
                'cache': cache_works,
                'database': db_status
            },
            'version': '1.0.0'
        })
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=503)

@api_view(['GET'])
def get_estadisticas_cache(request):
    """Estadísticas de cache - CORREGIDA PARA DATABASECACHE"""
    if not settings.DEBUG and not request.user.is_staff:
        return Response({'error': 'No autorizado'}, status=403)
    
    try:
        from django.db import connection
        
        # Para DatabaseCache, consultamos directamente la tabla
        cache_stats = {
            'backend': 'DatabaseCache',
            'tabla': 'django_cache'
        }
        
        # Contar entradas en cache desde la base de datos
        cache_patterns = {
            'ldap_': 0,
            'jefes_': 0, 
            'departamento_': 0,
            'arbol_': 0,
            'trabajador_detail_': 0,
            'total': 0
        }
        
        try:
            with connection.cursor() as cursor:
                # Verificar si existe la tabla
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='django_cache'
                """)
                tabla_existe = cursor.fetchone()
                
                if tabla_existe:
                    # Contar total de entradas
                    cursor.execute("SELECT COUNT(*) FROM django_cache")
                    total_entries = cursor.fetchone()[0]
                    cache_patterns['total'] = total_entries
                    
                    # Contar por patrones (aproximado)
                    cursor.execute("SELECT key FROM django_cache")
                    all_keys = [row[0] for row in cursor.fetchall()]
                    
                    for key in all_keys:
                        if 'ldap_' in key: cache_patterns['ldap_'] += 1
                        elif 'jefes_' in key: cache_patterns['jefes_'] += 1
                        elif 'departamento_' in key: cache_patterns['departamento_'] += 1
                        elif 'arbol_' in key: cache_patterns['arbol_'] += 1
                        elif 'trabajador_detail_' in key: cache_patterns['trabajador_detail_'] += 1
                    
                    # Obtener estadísticas de expiración
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total,
                            COUNT(CASE WHEN expires < datetime('now') THEN 1 END) as expiradas,
                            COUNT(CASE WHEN expires >= datetime('now') THEN 1 END) as activas
                        FROM django_cache
                    """)
                    exp_stats = cursor.fetchone()
                    cache_stats.update({
                        'total_entradas': exp_stats[0],
                        'entradas_expiradas': exp_stats[1],
                        'entradas_activas': exp_stats[2]
                    })
                else:
                    cache_stats['error'] = 'Tabla django_cache no existe'
                    
        except Exception as e:
            cache_stats['error_bd'] = str(e)
        
        return Response({
            'estadisticas_cache': cache_stats,
            'keys_por_tipo': cache_patterns,
            'total_keys': cache_patterns['total'],
            'backend': str(type(cache)),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas cache: {e}")
        return Response({'error': 'Error obteniendo estadísticas'}, status=500)

# Decorador de cache personalizado CORREGIDO
def cache_response(timeout: int, key_prefix: str = ""):
    """Decorador para cachear respuestas CON LOGGING COLORIDO"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            # Generar clave de cache única
            cache_key = f"{key_prefix}_{func.__name__}_{request.GET.urlencode()}"
            
            # Extraer término de búsqueda para logging
            search_term = "desconocido"
            if 'q=' in cache_key:
                try:
                    import urllib.parse
                    search_part = cache_key.split('q=')[1].split('&')[0]
                    search_term = urllib.parse.unquote(search_part)
                    if len(search_term) > 25:
                        search_term = search_term[:25] + "..."
                except:
                    pass
            elif 'correo=' in cache_key:
                try:
                    import urllib.parse
                    email_part = cache_key.split('correo=')[1].split('&')[0]
                    search_term = urllib.parse.unquote(email_part)
                except:
                    pass
            
            # Verificar cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Información de TTL
                ttl_info = ""
                try:
                    if hasattr(cache, 'ttl'):
                        ttl = cache.ttl(cache_key)
                        if ttl is not None:
                            hours = int(ttl // 3600)
                            minutes = int((ttl % 3600) // 60)
                            ttl_info = f" | ⏰ {hours}h {minutes}m"
                except:
                    pass
                
                # ✅ LOG CACHE HIT MEJORADO
                logger.info(f"🎯 ✅ CACHE HIT {key_prefix}: '{search_term}'{ttl_info}")
                response = Response(cached_response)
                return add_cache_header(response, True, cache_key)
            
            # Cache MISS
            start_time = time.time()
            response = func(request, *args, **kwargs)
            execution_time = time.time() - start_time
            
            if response.status_code == status.HTTP_200_OK:
                cache.set(cache_key, response.data, timeout)
                
                # Información de resultados
                result_info = ""
                if hasattr(response, 'data'):
                    if isinstance(response.data, list):
                        emoji = "📊" if len(response.data) > 0 else "🔍"
                        result_info = f" | {emoji} {len(response.data)} resultados"
                    elif isinstance(response.data, dict) and 'error' in response.data:
                        result_info = f" | ❌ ERROR"
                    elif isinstance(response.data, dict):
                        result_info = f" | 📁 dict"
                
                # ✅ LOG CACHE MISS MEJORADO
                timeout_hours = timeout // 3600
                logger.info(f"🎯 ❌ CACHE MISS {key_prefix}: '{search_term}' | ⏱️ {execution_time:.3f}s | 💾 {timeout_hours}h{result_info}")
                return add_cache_header(response, False, cache_key)
            
            return response
        return wrapper
    return decorator

# ========== VISTAS PARA DEPARTAMENTOS ==========

def safe_strip(value):
    """Función segura para strip que maneja valores None"""
    if value is None:
        return ''
    return str(value).strip()

# ========== VISTAS MEJORADAS PARA JERARQUÍA REAL ==========

@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="arbol_jerarquico")
def get_arbol_jerarquico(request):
    """Obtener estructura jerárquica REAL basada en relaciones de supervisión"""
    conn = None
    try:
        logger.info("🏢 Iniciando obtención de árbol jerárquico REAL")
        
        # Establecer conexión LDAP
        conn = LDAPConnectionManager.get_connection()
        if not conn.bound:
            logger.error("❌ No se pudo establecer conexión con LDAP")
            return Response(
                {'error': 'Error de conexión con el directorio activo'}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # Buscar TODAS las personas activas con sus managers
        search_filter = "(&(objectClass=person)(company=Envases CMF S.A.))"
        
        logger.info(f"🔍 Buscando personas y sus relaciones en LDAP...")
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=[
                'department', 'title', 'givenName', 'sn', 'mail', 
                'manager', 'userAccountControl', 'distinguishedName'
            ]
        )

        # Recolectar y procesar datos
        todas_las_personas = []
        departamentos_unicos = set()
        
        for entry in conn.entries:
            try:
                attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
                
                if not is_account_enabled(attrs.get('userAccountControl')):
                    continue
                
                persona_data = {
                    'distinguishedName': safe_strip(attrs.get('distinguishedName')),
                    'givenName': safe_strip(attrs.get('givenName')),
                    'sn': safe_strip(attrs.get('sn')),
                    'mail': safe_strip(attrs.get('mail')),
                    'title': safe_strip(attrs.get('title')),
                    'department': safe_strip(attrs.get('department')),
                    'manager': safe_strip(attrs.get('manager'))
                }
                
                # Validar datos mínimos
                if (persona_data['distinguishedName'] and 
                    persona_data['department'] and
                    persona_data['givenName'] and 
                    persona_data['sn']):
                    
                    todas_las_personas.append(persona_data)
                    departamentos_unicos.add(persona_data['department'])
                    
            except Exception as e:
                logger.warning(f"⚠️ Error procesando entrada LDAP: {e}")
                continue

        conn.unbind()

        # Validar que tenemos datos
        if not todas_las_personas:
            return Response({
                "estructura": [],
                "total_personas": 0,
                "total_departamentos": 0,
                "timestamp": datetime.now().isoformat(),
                "warning": "No se encontraron personas activas en la organización"
            })

        logger.info(f"📊 Datos obtenidos: {len(todas_las_personas)} personas, {len(departamentos_unicos)} departamentos")

        # 🎯 NUEVA ESTRATEGIA: Construir jerarquía REAL basada en relaciones de supervisión
        # pero manteniendo la lógica de búsqueda de jefes existente
        estructura = construir_jerarquia_real_con_logica_existente(todas_las_personas)
        
        logger.info(f"🎉 Árbol jerárquico REAL construido: {len(estructura)} nodos raíz")
        
        return Response({
            "estructura": estructura,
            "total_personas": len(todas_las_personas),
            "total_departamentos": len(departamentos_unicos),
            "timestamp": datetime.now().isoformat(),
            "metodo": "jerarquia_real_con_logica_existente"
        })
        
    except Exception as e:
        logger.error(f"🚨 Error en árbol jerárquico: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Error obteniendo estructura organizacional'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def log_departamentos_con_jefes(departamentos_con_jerarquia):
    """Registra en el log la lista de departamentos con sus respectivos jefes"""
    logger.info("\n📋 RESUMEN DE DEPARTAMENTOS Y SUS JEFES:")
    logger.info("=" * 80)
    
    for depto in sorted(departamentos_con_jerarquia, key=lambda x: x['nombre'].lower()):
        jefe = depto.get('jefe', {})
        jefe_nombre = jefe.get('nombre', 'Sin jefe asignado')
        jefe_cargo = jefe.get('titulo', 'Sin cargo')
        es_interno = jefe.get('es_jerarca_interno', False)
        
        logger.info(f"🏢 Departamento: {depto['nombre']}")
        logger.info(f"   👤 Jefe: {jefe_nombre}")
        logger.info(f"   📝 Cargo: {jefe_cargo}")
        logger.info(f"   {'🏠 Interno' if es_interno else '🌍 Externo'}")
        logger.info(f"   👥 Total personal: {depto.get('total_personas', 0)}")
        
        if 'advertencia' in depto and depto['advertencia']:
            logger.warning(f"   ⚠️  {depto['advertencia']}")
            
        logger.info("-" * 50)
    
    logger.info("=" * 80)
    logger.info(f"Total departamentos procesados: {len(departamentos_con_jerarquia)}\n")


def construir_jerarquia_real_con_logica_existente(todas_las_personas):
    """Construir jerarquía REAL pero usando la lógica existente de búsqueda de jefes"""
    
    logger.info("🔨 Construyendo jerarquía real con lógica existente de jefes...")
    
    # 1. Primero usar la lógica EXISTENTE para encontrar jefes de departamento
    # (Esta es la parte que quieres mantener)
    personas_por_depto = {}
    for persona in todas_las_personas:
        depto = persona['department']
        if depto not in personas_por_depto:
            personas_por_depto[depto] = []
        personas_por_depto[depto].append(persona)
    
    # Encontrar jefes usando la lógica EXISTENTE
    departamentos_con_jerarquia = []
    for depto_nombre, personas_depto in personas_por_depto.items():
        # ✅ USAR LA LÓGICA EXISTENTE para encontrar jerarca
        jerarca_depto = encontrar_jerarca_departamento(personas_depto, todas_las_personas)
        
        # Determinar si es gerencia basado en el cargo del jerarca
        es_gerencia_nodo = jerarca_depto and es_cargo_jerarquico_valido(jerarca_depto) and any(
            palabra in jerarca_depto.get('title', '').lower() for palabra in ['gerente', 'subgerente']
        )
        
        # Construir nodo usando la lógica EXISTENTE
        nodo_depto = construir_nodo_departamento_mejorado(
            depto_nombre, 
            personas_depto, 
            jerarca_depto, 
            es_gerencia_nodo
        )
        
        if nodo_depto:
            departamentos_con_jerarquia.append(nodo_depto)
    
    # Registrar departamentos con sus jefes antes de construir la jerarquía
    log_departamentos_con_jefes(departamentos_con_jerarquia)
    
    # 2. Ahora construir la jerarquía REAL basada en relaciones de supervisión
    arbol_departamentos = construir_relaciones_jerarquicas_reales(departamentos_con_jerarquia, todas_las_personas)
    
    return arbol_departamentos

def construir_relaciones_jerarquicas_reales(departamentos_con_jerarquia, todas_las_personas):
    """Construir relaciones jerárquicas reales entre departamentos basadas en supervisión"""
    
    logger.info("🔗 Construyendo relaciones jerárquicas reales...")
    
    # Crear mapeo de departamentos por nombre para acceso rápido
    mapa_departamentos = {depto['nombre']: depto for depto in departamentos_con_jerarquia}
    
    # 1. Identificar relaciones entre departamentos basadas en los jefes
    relaciones = {}
    
    for depto in departamentos_con_jerarquia:
        jefe = depto.get('jefe')
        if not jefe:
            continue
            
        # Buscar si este jefe reporta a alguien (tiene manager)
        jefe_dn = jefe.get('distinguishedName')
        if not jefe_dn:
            continue
            
        # Buscar el manager de este jefe en todas las personas
        manager_jefe = None
        for persona in todas_las_personas:
            if persona['distinguishedName'] == jefe_dn and persona.get('manager'):
                manager_dn = persona['manager']
                # Buscar al manager en todas las personas
                for manager_persona in todas_las_personas:
                    if manager_persona['distinguishedName'] == manager_dn:
                        manager_jefe = manager_persona
                        break
                break
        
        if manager_jefe:
            # El departamento del manager es el departamento padre
            depto_padre = manager_jefe.get('department')
            if depto_padre and depto_padre in mapa_departamentos and depto_padre != depto['nombre']:
                if depto_padre not in relaciones:
                    relaciones[depto_padre] = []
                relaciones[depto_padre].append(depto['nombre'])
    
    # 2. Construir el árbol jerárquico
    # Identificar departamentos raíz (los que no son subordinados de nadie)
    todos_subordinados = set()
    for subordinados in relaciones.values():
        todos_subordinados.update(subordinados)
    
    departamentos_raiz = [depto for depto in departamentos_con_jerarquia 
                         if depto['nombre'] not in todos_subordinados]
    
    logger.info(f"🌳 Departamentos raíz identificados: {len(departamentos_raiz)}")
    
    # 3. Construir árbol recursivamente
    arbol_final = []
    for depto_raiz in departamentos_raiz:
        nodo_raiz = construir_nodo_con_subordinados(depto_raiz, relaciones, mapa_departamentos, set())
        if nodo_raiz:
            arbol_final.append(nodo_raiz)
    
    # Si no se encontraron relaciones claras, devolver la estructura plana
    if not arbol_final:
        logger.info("ℹ️ No se encontraron relaciones jerárquicas claras, retornando estructura plana")
        return departamentos_con_jerarquia
    
    return arbol_final

def construir_nodo_con_subordinados(depto, relaciones, mapa_departamentos, visitados):
    """Construir nodo recursivamente con sus subordinados"""
    
    if depto['nombre'] in visitados:
        return None  # Evitar ciclos
    
    visitados.add(depto['nombre'])
    
    # Crear copia del departamento para no modificar el original
    nodo = depto.copy()
    nodo['subordinados'] = []
    
    # Agregar subordinados si existen
    if depto['nombre'] in relaciones:
        for subordinado_nombre in relaciones[depto['nombre']]:
            if subordinado_nombre in mapa_departamentos:
                subordinado = mapa_departamentos[subordinado_nombre]
                nodo_subordinado = construir_nodo_con_subordinados(
                    subordinado, relaciones, mapa_departamentos, visitados.copy()
                )
                if nodo_subordinado:
                    nodo['subordinados'].append(nodo_subordinado)
    
    return nodo

# ✅ MANTENER TODAS LAS FUNCIONES EXISTENTES SIN CAMBIOS

def es_cargo_jerarquico_valido(persona):
    """Determinar si es un cargo jerárquico válido"""
    if not persona or not persona.get('title'):
        return False
        
    titulo = persona.get('title', '').lower()
    
    # Cargos jerárquicos válidos (todos en minúsculas para comparación)
    cargos_jerarquicos = [
        'gerente general',
        'gerente',
        'subgerente', 
        'jefe',
        'jefa',
        'especialista',  # Convertido a minúsculas
        'encargado',
        'encargada',
        'coordinador',
        'coordinadora'
    ]
    
    return any(cargo in titulo for cargo in cargos_jerarquicos)

def encontrar_jerarca_departamento(personas_departamento, todas_las_personas):
    """Encontrar jerarca del departamento - VERSIÓN CORREGIDA (MANTENER ESTA LÓGICA)"""
    if not personas_departamento:
        return None
    
    logger.info(f"🔍 Buscando jerarca para departamento con {len(personas_departamento)} personas")
    
    # Estrategia 1: Buscar personas con cargo jerárquico DENTRO del departamento
    jefes_internos = [p for p in personas_departamento if es_cargo_jerarquico_valido(p)]
    
    if jefes_internos:
        # Ordenar por prioridad jerárquica
        jefes_ordenados = sorted(jefes_internos, key=lambda x: obtener_prioridad_jerarquia(x.get('title', '')))
        logger.info(f"✅ Jerarca interno encontrado: {jefes_ordenados[0]['givenName']} - {jefes_ordenados[0]['title']}")
        return jefes_ordenados[0]
    
    # Estrategia 2: Buscar el MANAGER de las personas de este departamento que tenga cargo jerárquico
    logger.info("🔍 Buscando managers jerárquicos que supervisen este departamento...")
    
    managers_jerarquicos = {}
    
    for persona in personas_departamento:
        if persona.get('manager'):
            manager_dn = persona['manager']
            
            # Buscar al manager en todas las personas
            for potential_manager in todas_las_personas:
                if potential_manager['distinguishedName'] == manager_dn:
                    # ✅ CRÍTICO: Solo considerar managers con cargo jerárquico válido
                    if es_cargo_jerarquico_valido(potential_manager):
                        managers_jerarquicos[manager_dn] = potential_manager
                        logger.info(f"✅ Manager jerárquico encontrado: {potential_manager['givenName']} - {potential_manager['title']} (Depto: {potential_manager['department']})")
                    break
    
    if managers_jerarquicos:
        # Ordenar managers por prioridad jerárquica y tomar el mejor
        managers_ordenados = sorted(managers_jerarquicos.values(), 
                                  key=lambda x: obtener_prioridad_jerarquia(x.get('title', '')))
        mejor_manager = managers_ordenados[0]
        logger.info(f"🎯 Mejor manager jerárquico seleccionado: {mejor_manager['givenName']} - {mejor_manager['title']}")
        return mejor_manager
    
    # Estrategia 3: Buscar cualquier manager (sin filtro de cargo) que supervise este departamento
    logger.info("🔍 Buscando cualquier manager que supervise este departamento...")
    managers_genericos = {}
    
    for persona in personas_departamento:
        if persona.get('manager'):
            manager_dn = persona['manager']
            
            for potential_manager in todas_las_personas:
                if potential_manager['distinguishedName'] == manager_dn:
                    managers_genericos[manager_dn] = potential_manager
                    logger.info(f"📌 Manager genérico encontrado: {potential_manager['givenName']} - {potential_manager['title']}")
                    break
    
    if managers_genericos:
        # Ordenar por prioridad jerárquica (aunque no tengan cargo específico)
        managers_ordenados = sorted(managers_genericos.values(), 
                                  key=lambda x: obtener_prioridad_jerarquia(x.get('title', '')))
        mejor_manager = managers_ordenados[0]
        logger.info(f"📌 Usando manager genérico: {mejor_manager['givenName']} - {mejor_manager['title']}")
        return mejor_manager
    
    # Estrategia 4: Buscar persona sin manager (posible jefe)
    personas_sin_manager = [p for p in personas_departamento if not p.get('manager')]
    if personas_sin_manager:
        logger.info(f"👤 Usando persona sin manager como representante: {personas_sin_manager[0]['givenName']}")
        return personas_sin_manager[0]
    
    # Estrategia 5: Cualquier persona del departamento (último recurso)
    if personas_departamento:
        logger.info(f"⚠️ Usando primera persona del departamento como representante: {personas_departamento[0]['givenName']}")
        return personas_departamento[0]
    
    logger.warning("❌ No se pudo encontrar ningún jerarca para el departamento")
    return None

    
    titulo_lower = titulo.lower()
    
    prioridades = {
        'gerente general': 1,
        'gerente': 2, 
        'subgerente': 3,
        'jefe': 4,          
        'jefa': 4,          
        'Especialista': 4,
        'coordinador': 5,   
        'coordinadora': 5,  
        'encargado': 5,     
        'encargada': 5
              
    }
    
    for cargo, prioridad in prioridades.items():
        if cargo in titulo_lower:
            return prioridad
    
    return 999

def construir_nodo_departamento_mejorado(nombre_departamento, personas_departamento, jerarca_depto, es_gerencia):
    """Construir nodo de departamento - VERSIÓN MEJORADA (MANTENER ESTA LÓGICA)"""
    
    if not jerarca_depto:
        # Si no hay jerarca, usar la primera persona como representante
        persona_representativa = personas_departamento[0] if personas_departamento else None
        if not persona_representativa:
            return None
            
        return {
            'nombre': nombre_departamento,
            'jefe': {
                'nombre': f"{persona_representativa['givenName']} {persona_representativa['sn']}".strip(),
                'titulo': f"{persona_representativa['title']} (Representante)",
                'mail': persona_representativa['mail'],
                'distinguishedName': persona_representativa['distinguishedName'],
                'departamento_jerarca': persona_representativa['department']
            },
            'tipo_nodo': 'departamento_sin_jerarca_claro',
            'nivel_jerarquico': 2,
            'subordinados': [],
            'total_personas': len(personas_departamento),
            'es_gerencia': es_gerencia,
            'advertencia': 'No se identificó un jerarca claro para este departamento'
        }
    
    # Determinar si el jerarca es interno o externo al departamento
    jerarca_es_interno = any(p['distinguishedName'] == jerarca_depto['distinguishedName'] for p in personas_departamento)
    departamento_jerarca = jerarca_depto['department']
    
    # Construir información del jerarca
    info_jerarca = {
        'nombre': f"{jerarca_depto['givenName']} {jerarca_depto['sn']}".strip(),
        'titulo': jerarca_depto['title'],
        'mail': jerarca_depto['mail'],
        'distinguishedName': jerarca_depto['distinguishedName'],
        'departamento_jerarca': departamento_jerarca,
        'es_jerarca_interno': jerarca_es_interno
    }
    
    # Agregar información sobre el tipo de jerarca
    advertencia = None
    if not jerarca_es_interno:
        if es_cargo_jerarquico_valido(jerarca_depto):
            advertencia = f'👑 Jerarca asignado desde {departamento_jerarca}'
        else:
            advertencia = f'📌 Supervisor asignado desde {departamento_jerarca}'
    
    # Determinar tipo de nodo basado en si es gerencia
    if es_gerencia:
        tipo_nodo = 'gerencia'
        nivel = 1
    else:
        tipo_nodo = 'departamento'
        nivel = 2
    
    return {
        'nombre': nombre_departamento,
        'jefe': info_jerarca,
        'tipo_nodo': tipo_nodo,
        'nivel_jerarquico': nivel,
        'subordinados': [],
        'total_personas': len(personas_departamento),
        'es_gerencia': es_gerencia,
        'advertencia': advertencia,
        'estadisticas': {
            'total_personal': len(personas_departamento),
            'con_cargo_especifico': len([p for p in personas_departamento if p.get('title')]),
            'sin_manager': len([p for p in personas_departamento if not p.get('manager')]),
            'jerarca_interno': jerarca_es_interno,
            'jerarca_tiene_cargo_valido': es_cargo_jerarquico_valido(jerarca_depto)
        }
    }
    
# ========== VISTAS ADICIONALES MEJORADAS ==========

@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="lista_departamentos")
def get_lista_departamentos(request):
    """Obtener lista simple de todos los departamentos"""
    try:
        conn = LDAPConnectionManager.get_connection()
        
        search_filter = "(&(objectClass=person)(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=['department']
        )

        departamentos = set()
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            depto = attrs.get('department')
            if depto and depto.strip():
                # Normalizar el nombre del departamento
                depto_normalizado = normalizar_nombre_departamento(depto.strip())
                departamentos.add(depto_normalizado)
        
        conn.unbind()
        
        departamentos_ordenados = sorted(list(departamentos))
        logger.info(f"📋 Lista departamentos: {len(departamentos_ordenados)} encontrados")
        
        return Response({
            'total_departamentos': len(departamentos_ordenados),
            'departamentos': departamentos_ordenados
        })

    except Exception as e:
        logger.error(f"🚨 Error obteniendo departamentos: {e}")
        return Response({'error': 'Error obteniendo departamentos'}, 
                       status=status.HDTP_500_INTERNAL_SERVER_ERROR)

def normalizar_nombre_departamento(nombre):
    """Normaliza el nombre del departamento para evitar duplicados por formato"""
    # Convertir a minúsculas y capitalizar (primera letra mayúscula)
    nombre = nombre.strip().lower()
    
    # Lista de palabras que deben mantenerse en mayúsculas si son acrónimos
    acronimos = ['TI', 'IT', 'RH', 'RRHH', 'QA', 'QC', 'R&D', 'CEO', 'CTO', 'CMF']
    
    palabras = nombre.split()
    palabras_normalizadas = []
    
    for palabra in palabras:
        # Si la palabra es un acrónimo conocido, mantener en mayúsculas
        if palabra.upper() in acronimos:
            palabras_normalizadas.append(palabra.upper())
        else:
            # Capitalizar palabras normales
            palabras_normalizadas.append(palabra.capitalize())
    
    return ' '.join(palabras_normalizadas)
        
@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="departamento_detalle")
def get_departamento_detalle(request, nombre_departamento):
    """Obtener detalle completo de un departamento específico"""
    try:
        conn = LDAPConnectionManager.get_connection()
        
        search_filter = f"(&(objectClass=person)(department={nombre_departamento})(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=['givenName', 'sn', 'mail', 'title', 'department', 
                       'telephoneNumber', 'userAccountControl', 'manager']
        )

        trabajadores = []
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            if not is_account_enabled(attrs.get('userAccountControl')):
                continue
            
            trabajador = {
                'givenName': attrs.get('givenName', ''),
                'sn': attrs.get('sn', ''),
                'mail': attrs.get('mail', ''),
                'title': attrs.get('title', ''),
                'telephoneNumber': attrs.get('telephoneNumber', ''),
                'manager': attrs.get('manager', ''),
                'userAccountControl_enabled': True
            }
            
            trabajadores.append(trabajador)
        
        conn.unbind()
        
        # Encontrar jerarca del departamento
        todas_las_personas = trabajadores  # Para este contexto, usamos solo los trabajadores del depto
        jerarca_depto = encontrar_jerarca_departamento(trabajadores, todas_las_personas)
        
        # Contar cargos jerárquicos
        cargos_jerarquicos = [t for t in trabajadores if es_cargo_jerarquico_valido(t)]
        
        logger.info(f"📊 Detalle departamento '{nombre_departamento}': {len(trabajadores)} trabajadores, {len(cargos_jerarquicos)} cargos jerárquicos")
        
        return Response({
            'departamento': nombre_departamento,
            'total_trabajadores': len(trabajadores),
            'jerarca': jerarca_depto,
            'trabajadores': trabajadores,
            'estadisticas': {
                'cargos_jerarquicos': len(cargos_jerarquicos),
                'con_cargo_especifico': len([t for t in trabajadores if t.get('title')]),
                'con_telefono': len([t for t in trabajadores if t.get('telephoneNumber')]),
                'con_email': len([t for t in trabajadores if t.get('mail')])
            }
        })

    except Exception as e:
        logger.error(f"🚨 Error en detalle departamento {nombre_departamento}: {e}")
        return Response({'error': 'Error obteniendo departamento'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="resumen_organizacion")
def get_resumen_organizacion(request):
    """Resumen ejecutivo de toda la organización"""
    try:
        conn = LDAPConnectionManager.get_connection()
        
        search_filter = "(&(objectClass=person)(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=['department', 'title', 'userAccountControl']
        )

        departamentos_todos = set()  # Para todos los departamentos (37)
        departamentos_activos = set()  # Solo departamentos con personal activo
        cargos_jerarquicos = 0
        total_personas_activas = 0
        total_personas_todas = 0
        
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            depto = attrs.get('department')
            titulo = attrs.get('title', '')
            cuenta_activa = is_account_enabled(attrs.get('userAccountControl'))
            
            if depto and depto.strip():
                depto_normalizado = normalizar_nombre_departamento(depto.strip())
                
                # 🔥 SIEMPRE agregar a departamentos_todos (37 deptos)
                departamentos_todos.add(depto_normalizado)
                total_personas_todas += 1
                
                # Solo contar para activos si la cuenta está habilitada
                if cuenta_activa:
                    departamentos_activos.add(depto_normalizado)
                    total_personas_activas += 1
                    
                    if es_cargo_jerarquico_valido({'title': titulo}):
                        cargos_jerarquicos += 1
        
        conn.unbind()
        
        logger.info(f"📈 Resumen organización: {len(departamentos_todos)} deptos totales, {len(departamentos_activos)} deptos activos, {total_personas_activas} personas activas")
        
        return Response({
            'total_departamentos': len(departamentos_todos),  # 🔥 Ahora 37 departamentos
            'total_departamentos_activos': len(departamentos_activos),  # 32 departamentos
            'total_personas': total_personas_activas,  # Solo personas activas
            'total_personas_todas': total_personas_todas,  # Todas las personas
            'total_cargos_jerarquicos': cargos_jerarquicos,
            'promedio_por_departamento': round(total_personas_activas / len(departamentos_activos), 2) if departamentos_activos else 0,
            'timestamp': datetime.now().isoformat(),
            'nota': 'total_departamentos incluye todos los departamentos existentes (activos e inactivos)'
        })
        
    except Exception as e:
        logger.error(f"🚨 Error en resumen organización: {e}")
        return Response({'error': 'Error obteniendo resumen'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ========== FUNCIONES COMPATIBILIDAD ==========

@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="supervisores")
def get_supervisores(request):
    """Obtener lista de supervisores"""
    try:
        return Response({
            "mensaje": "Endpoint de supervisores en desarrollo",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error en get_supervisores: {str(e)}")
        return Response(
            {'error': 'Error obteniendo lista de supervisores'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="resumen_supervision")
def get_resumen_supervision(request):
    """Obtener resumen ejecutivo de supervisión"""
    try:
        return Response({
            "mensaje": "Endpoint de resumen de supervisión en desarrollo",
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error en get_resumen_supervision: {str(e)}")
        return Response(
            {'error': 'Error obteniendo resumen ejecutivo'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['GET'])
@handle_ldap_errors
@cache_response(timeout=LDAP_CACHE_TIMEOUT, key_prefix="departamento_completo")
def departamento_completo(request):
    """Vista consolidada que devuelve TODOS los datos del departamento en una sola respuesta"""
    nombre_departamento = request.GET.get('nombre', '').strip()
    
    if not nombre_departamento:
        return Response({'error': 'Nombre de departamento requerido'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        conn = LDAPConnectionManager.get_connection()
        
        # 1. BUSCAR TODOS LOS TRABAJADORES DEL DEPARTAMENTO
        search_filter = f"(&(objectClass=person)(department={nombre_departamento})(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=[
                'givenName', 'sn', 'mail', 'title', 'department',
                'telephoneNumber', 'userAccountControl', 'manager',
                'distinguishedName'
            ]
        )

        trabajadores_departamento = []
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            # Solo cuentas habilitadas
            if not is_account_enabled(attrs.get('userAccountControl')):
                continue
            
            trabajador = {
                'givenName': attrs.get('givenName', ''),
                'sn': attrs.get('sn', ''),
                'mail': attrs.get('mail', ''),
                'title': attrs.get('title', ''),
                'telephoneNumber': attrs.get('telephoneNumber', ''),
                'manager': attrs.get('manager', ''),
                'distinguishedName': attrs.get('distinguishedName', ''),
                'userAccountControl_enabled': True
            }
            
            trabajadores_departamento.append(trabajador)

        # 2. BUSCAR TODAS LAS PERSONAS DE LA ORGANIZACIÓN para encontrar jefes correctamente
        todas_las_personas = []
        search_filter_todas = "(&(objectClass=person)(company=Envases CMF S.A.))"
        
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter_todas,
            attributes=[
                'givenName', 'sn', 'mail', 'title', 'department',
                'telephoneNumber', 'userAccountControl', 'manager',
                'distinguishedName'
            ]
        )
        
        for entry in conn.entries:
            attrs = procesar_atributos_ldap(entry.entry_attributes_as_dict)
            
            if not is_account_enabled(attrs.get('userAccountControl')):
                continue
            
            persona = {
                'givenName': attrs.get('givenName', ''),
                'sn': attrs.get('sn', ''),
                'mail': attrs.get('mail', ''),
                'title': attrs.get('title', ''),
                'department': attrs.get('department', ''),
                'telephoneNumber': attrs.get('telephoneNumber', ''),
                'manager': attrs.get('manager', ''),
                'distinguishedName': attrs.get('distinguishedName', ''),
                'userAccountControl_enabled': True
            }
            
            todas_las_personas.append(persona)

        # 3. ENCONTRAR JEFE DEL DEPARTAMENTO usando TODAS las personas
        jerarca_depto = encontrar_jerarca_departamento(trabajadores_departamento, todas_las_personas)
        
        # 4. OBTENER DATOS COMPLETOS DEL JEFE (si existe)
        jefe_completo = None
        if jerarca_depto and jerarca_depto.get('distinguishedName'):
            try:
                # Buscar datos completos del jefe por distinguishedName (más preciso)
                jefe_dn = jerarca_depto['distinguishedName']
                jefe_search_filter = f"(distinguishedName={jefe_dn})"
                conn.search(
                    search_base=settings.LDAP_CONFIG['BASE_DN'],
                    search_filter=jefe_search_filter,
                    attributes=[
                        'givenName', 'sn', 'mail', 'title', 'department',
                        'telephoneNumber', 'userAccountControl', 'manager',
                        'distinguishedName'
                    ]
                )
                
                if conn.entries:
                    jefe_entry = conn.entries[0]
                    jefe_completo = procesar_atributos_ldap(jefe_entry.entry_attributes_as_dict)
                    # Solo incluir si la cuenta está habilitada
                    if not is_account_enabled(jefe_completo.get('userAccountControl')):
                        jefe_completo = None
                    else:
                        jefe_completo['userAccountControl_enabled'] = True
                        jefe_completo.pop('userAccountControl', None)
            except Exception as e:
                logger.warning(f"Error obteniendo datos completos del jefe {jerarca_depto.get('mail')}: {e}")

        conn.unbind()

        # 5. CONSTRUIR RESPUESTA CONSOLIDADA
        respuesta = {
            'departamento': nombre_departamento,
            'total_trabajadores': len(trabajadores_departamento),
            'jefe': jerarca_depto,
            'jefe_completo': jefe_completo,
            'trabajadores': trabajadores_departamento,
            'estadisticas': {
                'con_email': len([t for t in trabajadores_departamento if t.get('mail')]),
                'con_telefono': len([t for t in trabajadores_departamento if t.get('telephoneNumber')]),
                'con_cargo': len([t for t in trabajadores_departamento if t.get('title')]),
                'cargos_jerarquicos': len([t for t in trabajadores_departamento if es_cargo_jerarquico_valido(t)]),
                'sin_manager': len([t for t in trabajadores_departamento if not t.get('manager')])
            },
            'timestamp': datetime.now().isoformat(),
            'metadatos': {
                'jerarca_encontrado': jerarca_depto is not None,
                'jerarca_es_interno': jerarca_depto and any(
                    p['distinguishedName'] == jerarca_depto['distinguishedName'] 
                    for p in trabajadores_departamento
                ) if jerarca_depto else False
            }
        }

        logger.info(f"📊 Departamento completo '{nombre_departamento}': {len(trabajadores_departamento)} trabajadores, jefe: {jerarca_depto['givenName'] if jerarca_depto else 'No asignado'}")
        
        return Response(respuesta)

    except Exception as e:
        logger.error(f"🚨 Error en departamento completo {nombre_departamento}: {e}")
        return Response({'error': 'Error obteniendo datos del departamento'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
# ========== VISTAS DE SEGURIDAD BLOQUEO DE INTERACCIONES ==========
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["GET"])
def get_security_config(request):
    """
    Configuración MUY MINIMALISTA - SOLO vista
    """
    config = {
        'security': {
            'block_zoom': True,  # SOLO esto
            'block_refresh': False,
            'block_context_menu': False,
            'prevent_leave': False
        },
        'viewport_config': 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover',
        'blocked_shortcuts': []  # VACÍO - no bloquear shortcuts
    }
    
    return JsonResponse(config)

@csrf_exempt
@require_http_methods(["POST"]) 
def report_zoom_attempt(request):
    """
    SOLO logging - sin bloquear nada
    """
    try:
        data = json.loads(request.body) if request.body else {}
        zoom_type = data.get('type', 'unknown')
        
        logger.info(f"🔍 Intento de zoom detectado: {zoom_type}")
        
        return JsonResponse({
            'status': 'logged',
            'message': 'Intento de zoom registrado (sin bloquear)'
        })
        
    except Exception as e:
        logger.error(f"Error reportando zoom: {e}")
        return JsonResponse({'error': 'Error en el reporte'}, status=400)