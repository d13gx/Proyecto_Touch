# ldap_helpers.py
from contextlib import contextmanager
from ldap3 import Server, Connection, SIMPLE, ALL
from django.conf import settings
from django.core.cache import cache
from datetime import datetime, timedelta
from django.utils.timezone import make_aware

@contextmanager
def get_ldap_connection():
    """Context manager para conexiones LDAP"""
    server = Server(
        settings.LDAP_CONFIG['HOST'],
        port=settings.LDAP_CONFIG['PORT'],
        get_info=ALL
    )
    conn = Connection(
        server,
        user=settings.LDAP_CONFIG['USER_DN'],
        password=settings.LDAP_CONFIG['PASSWORD'],
        authentication=SIMPLE,
        auto_bind=True
    )
    try:
        yield conn
    finally:
        conn.unbind()

def is_enabled(uac):
    """Verificar si cuenta está habilitada"""
    try:
        return not (int(uac) & 2)
    except Exception:
        return True

def safe_get_attr(attrs, key, default=''):
    """Obtener atributo de forma segura - siempre devuelve el valor crudo"""
    value = attrs.get(key, [])
    return value

def es_trabajador_valido(persona):
    """Verificar si el trabajador tiene los campos mínimos requeridos"""
    # Obtener valores crudos
    given_name_value = persona.get('givenName')
    sn_value = persona.get('sn')
    title_value = persona.get('title')
    mail_value = persona.get('mail')
    
    # Convertir listas a valores simples para validación
    given_name = given_name_value[0] if isinstance(given_name_value, list) and given_name_value else given_name_value
    sn = sn_value[0] if isinstance(sn_value, list) and sn_value else sn_value
    title = title_value[0] if isinstance(title_value, list) and title_value else title_value
    mail = mail_value[0] if isinstance(mail_value, list) and mail_value else mail_value
    
    tiene_nombre = given_name and sn
    tiene_cargo = title
    tiene_email = mail
    
    return tiene_nombre and tiene_cargo and tiene_email

def procesar_last_logon(persona):
    """Procesar timestamp de último logon"""
    raw_logon = persona.get('lastLogonTimestamp')
    if not raw_logon:
        return None
    
    # Si es lista, tomar el primer elemento
    if isinstance(raw_logon, list):
        raw_logon = raw_logon[0] if raw_logon else None
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
    except Exception:
        return None
    return None

def obtener_prioridad_jerarquia(titulo):
    """Obtener prioridad jerárquica basada en título"""
    if not titulo:
        return 999
        
    # Si titulo es una lista, tomar el primer elemento
    if isinstance(titulo, list):
        titulo = titulo[0] if titulo else ''
        
    titulo_lower = str(titulo).lower()
    if 'gerente' in titulo_lower and 'subgerente' not in titulo_lower:
        return 1  # Máxima prioridad
    elif 'subgerente' in titulo_lower:
        return 2
    elif 'jefe' in titulo_lower:
        return 3
    return 999

def buscar_personas_ldap(search_filter, attributes_adicionales=None):
    """Búsqueda genérica de personas en LDAP"""
    attributes_base = [
        'givenName', 'sn', 'mail', 'title', 'department',
        'userAccountControl', 'company', 'manager', 'distinguishedName'
    ]
    
    if attributes_adicionales:
        attributes_base.extend(attributes_adicionales)
    
    personas = []
    
    with get_ldap_connection() as conn:
        conn.search(
            search_base=settings.LDAP_CONFIG['BASE_DN'],
            search_filter=search_filter,
            attributes=attributes_base,
            size_limit=1000
        )
        
        for entry in conn.entries:
            attrs = entry.entry_attributes_as_dict
            uac_value = safe_get_attr(attrs, 'userAccountControl', 0)
            
            # Manejar uac que puede ser lista
            if isinstance(uac_value, list):
                uac = uac_value[0] if uac_value else 0
            else:
                uac = uac_value
                
            if not is_enabled(uac):
                continue

            persona = {}
            for key in attrs:
                value = attrs.get(key)
                # Almacenar el valor crudo (puede ser lista)
                persona[key] = value

            if es_trabajador_valido(persona):
                personas.append(persona)
    
    return personas

def obtener_department_seguro(persona):
    """Obtener department de forma segura"""
    department_value = persona.get('department')
    if department_value:
        if isinstance(department_value, list):
            department = department_value[0] if department_value else ''
        else:
            department = department_value
        
        if isinstance(department, str):
            return department.strip()
        else:
            return str(department).strip() if department else ''
    return ''

def obtener_title_seguro(persona):
    """Obtener title de forma segura"""
    title_value = persona.get('title')
    if title_value:
        if isinstance(title_value, list):
            return title_value[0] if title_value else ''
        return title_value
    return ''

def obtener_given_name_seguro(persona):
    """Obtener givenName de forma segura"""
    given_name_value = persona.get('givenName')
    if given_name_value:
        if isinstance(given_name_value, list):
            return given_name_value[0] if given_name_value else ''
        return given_name_value
    return ''

def obtener_sn_seguro(persona):
    """Obtener sn de forma segura"""
    sn_value = persona.get('sn')
    if sn_value:
        if isinstance(sn_value, list):
            return sn_value[0] if sn_value else ''
        return sn_value
    return ''

def obtener_manager_seguro(persona):
    """Obtener manager de forma segura"""
    manager_value = persona.get('manager')
    if manager_value:
        if isinstance(manager_value, list):
            return manager_value[0] if manager_value else None
        return manager_value
    return None

def obtener_email_seguro(persona):
    """Obtener email de forma segura"""
    mail_value = persona.get('mail')
    if mail_value:
        if isinstance(mail_value, list):
            return mail_value[0] if mail_value else ''
        return mail_value
    return ''

def obtener_telefono_seguro(persona):
    """Obtener teléfono de forma segura"""
    telefono_value = persona.get('telephoneNumber')
    if telefono_value:
        if isinstance(telefono_value, list):
            return telefono_value[0] if telefono_value else ''
        return telefono_value
    return ''