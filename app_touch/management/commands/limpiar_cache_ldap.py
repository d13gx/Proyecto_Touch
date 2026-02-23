from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.core.cache import cache
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Limpiar cache LDAP - Compatible con todos los backends'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            required=True,
            help='Username del staff que ejecuta el comando',
        )
    
    def handle(self, *args, **options):
        username = options.get('username')
        
        try:
            user = User.objects.get(username=username, is_staff=True)
            self.stdout.write(f'👤 Ejecutando como usuario: {user.username}')
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Usuario {username} no existe o no es staff')
            )
            return
        
        try:
            deleted_count = self.limpiar_cache_ldap_compatible()
            
            if deleted_count > 0:
                logger.info(f"Cache LDAP limpiado por {user.username}: {deleted_count} entradas eliminadas")
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Cache LDAP limpiado exitosamente')
                )
                self.stdout.write(
                    f'📊 Entradas eliminadas: {deleted_count}'
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('✅ No se encontraron entradas de cache LDAP para limpiar')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error limpiando cache: {e}')
            )
            import traceback
            traceback.print_exc()
    
    def limpiar_cache_ldap_compatible(self):
        """Método compatible con cualquier backend de cache"""
        prefixes = ['ldap_', 'jefes_', 'arbol_', 'departamento_', 'trabajador_detail_']
        deleted_count = 0
        
        self.stdout.write('🔄 Iniciando limpieza de cache LDAP...')
        
        # Método 1: Intentar con cache.keys() si está disponible
        try:
            if hasattr(cache, 'keys'):
                self.stdout.write('🔍 Usando método keys()...')
                all_keys = cache.keys('*') or []
                self.stdout.write(f'📁 Total de keys en cache: {len(all_keys)}')
                
                keys_to_delete = []
                for key in all_keys:
                    key_str = str(key)
                    if any(prefix in key_str for prefix in prefixes):
                        keys_to_delete.append(key)
                
                if keys_to_delete:
                    self.stdout.write(f'🗑️  Encontradas {len(keys_to_delete)} keys para eliminar')
                    cache.delete_many(keys_to_delete)
                    deleted_count = len(keys_to_delete)
                    
                    # Mostrar resumen por tipo
                    for prefix in prefixes:
                        count = sum(1 for key in keys_to_delete if prefix in str(key))
                        if count > 0:
                            self.stdout.write(f'   • {prefix}*: {count} keys')
                    
                    return deleted_count
                else:
                    self.stdout.write('ℹ️  No se encontraron keys con los patrones LDAP')
                    return 0
                    
        except Exception as e:
            self.stdout.write(f'⚠️  Método keys() no disponible: {e}')
        
        # Método 2: Eliminación directa de patrones conocidos
        self.stdout.write('🔍 Usando método de eliminación directa...')
        
        # Patrones específicos basados en tu código
        patrones_comunes = self.generar_patrones_cache()
        
        for patron in patrones_comunes:
            if cache.delete(patron):
                deleted_count += 1
                self.stdout.write(f'   ✅ Eliminado: {patron}')
            # También intentar con variaciones
            elif cache.delete(f'_{patron}'):
                deleted_count += 1
                self.stdout.write(f'   ✅ Eliminado: _{patron}')
        
        return deleted_count
    
    def generar_patrones_cache(self):
        """Generar lista de patrones de cache basados en tu código"""
        patrones = []
        
        # Patrones basados en las vistas cacheadas
        patrones.extend([
            # Cache de búsqueda LDAP
            'ldap_search_search_ldap',
            'ldap_search_',
            
            # Cache de trabajadores
            'trabajador_detail_',
            
            # Cache de departamentos
            'departamento_info_get_personal_por_departamento',
            'departamento_detail_',
            
            # Cache de jefes
            'jefes_masivos_get_jefes_masivos',
            
            # Cache de árbol jerárquico
            'arbol_jerarquico_get_arbol_jerarquico',
            'arbol_',
            
            # Cache de ubicaciones y mapas
            'ubicaciones_list',
            'mapas_list',
            
            # Cache de supervisores
            'supervisores_get_supervisores',
            'resumen_supervision_get_resumen_supervision',
        ])
        
        # Agregar patrones específicos para cada prefijo
        for prefix in ['ldap_', 'jefes_', 'arbol_', 'departamento_', 'trabajador_detail_']:
            patrones.extend([
                f"{prefix}search",
                f"{prefix}detail", 
                f"{prefix}info",
                f"{prefix}all",
                f"{prefix}tree",
                f"{prefix}users",
                f"{prefix}departments",
                f"{prefix}jefes",
                f"{prefix}complete",
            ])
        
        return patrones