from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.apps import apps
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Limpia completamente las tablas Trabajador y Departamento antiguas para migración LDAP'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Ejecutar sin confirmación interactiva',
        )
        parser.add_argument(
            '--preserve-ubicaciones',
            action='store_true',
            help='Preservar las ubicaciones relacionadas con departamentos',
        )

    def handle(self, *args, **options):
        force = options['force']
        preserve_ubicaciones = options['preserve_ubicaciones']
        
        self.stdout.write(self.style.WARNING('🚨 LIMPIEZA DE TABLAS ANTIGUAS 🚨'))
        self.stdout.write('=' * 60)
        self.stdout.write('ESTE COMANDO ELIMINARÁ:')
        self.stdout.write('  • Todos los Trabajadores')
        self.stdout.write('  • Todos los Departamentos')
        self.stdout.write('=' * 60)
        
        # Mostrar información de lo que se va a limpiar
        self.mostrar_estadisticas()
        
        if not force:
            confirm = input(
                self.style.WARNING(
                    '\n⚠️  ¿Estás ABSOLUTAMENTE seguro de que quieres ELIMINAR TODOS los datos? '
                    'Esta acción NO se puede deshacer. \n'
                    'Escribe "ELIMINAR" para confirmar: '
                )
            )
            if confirm != 'ELIMINAR':
                self.stdout.write(self.style.WARNING('❌ Operación cancelada.'))
                return
        
        try:
            with transaction.atomic():
                self.limpiar_tablas(preserve_ubicaciones)
                self.reiniciar_secuencias()
                
            self.stdout.write(self.style.SUCCESS('✅ Limpieza completada exitosamente!'))
            self.mostrar_recomendaciones()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error durante la limpieza: {e}'))
            logger.error(f"Error en limpieza de tablas: {e}", exc_info=True)

    def mostrar_estadisticas(self):
        """Mostrar estadísticas antes de la limpieza"""
        try:
            Trabajador = apps.get_model('app_touch', 'Trabajador')
            Departamento = apps.get_model('app_touch', 'Departamento')
            Ubicacion = apps.get_model('app_touch', 'Ubicacion')
            
            trabajadores_count = Trabajador.objects.count()
            departamentos_count = Departamento.objects.count()
            ubicaciones_count = Ubicacion.objects.count()
            ubicaciones_con_depto = Ubicacion.objects.filter(departamento__isnull=False).count()
            
            self.stdout.write(f'\n📊 ESTADÍSTICAS ACTUALES:')
            self.stdout.write(f'   • Trabajadores: {trabajadores_count}')
            self.stdout.write(f'   • Departamentos: {departamentos_count}')
            self.stdout.write(f'   • Ubicaciones totales: {ubicaciones_count}')
            self.stdout.write(f'   • Ubicaciones con departamento: {ubicaciones_con_depto}')
            
            # Mostrar algunos ejemplos de trabajadores
            if trabajadores_count > 0:
                self.stdout.write(f'\n   👥 Ejemplos de trabajadores:')
                for trab in Trabajador.objects.all()[:5]:
                    depto = trab.departamento.nombre if trab.departamento else "Sin depto"
                    self.stdout.write(f'     - {trab.nombre} {trab.apellido} ({trab.email}) - {depto}')
            
            # Mostrar algunos ejemplos de departamentos
            if departamentos_count > 0:
                self.stdout.write(f'\n   🏢 Ejemplos de departamentos:')
                for depto in Departamento.objects.all()[:5]:
                    jefe = f"{depto.jefe.nombre} {depto.jefe.apellido}" if depto.jefe else "Sin jefe"
                    self.stdout.write(f'     - {depto.nombre} (Jefe: {jefe})')
                    
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  No se pudieron obtener estadísticas: {e}'))

    def limpiar_tablas(self, preserve_ubicaciones):
        """Eliminar datos de las tablas Trabajador y Departamento"""
        Trabajador = apps.get_model('app_touch', 'Trabajador')
        Departamento = apps.get_model('app_touch', 'Departamento')
        Ubicacion = apps.get_model('app_touch', 'Ubicacion')
        
        self.stdout.write('\n🗑️  Iniciando limpieza...')
        
        # 1. Primero desconectar las relaciones ManyToMany de Trabajador
        try:
            trabajadores_con_supervisados = Trabajador.objects.filter(supervisa_a__isnull=False).distinct()
            if trabajadores_con_supervisados.exists():
                self.stdout.write('   🔄 Limpiando relaciones de supervisión...')
                for trabajador in trabajadores_con_supervisados:
                    trabajador.supervisa_a.clear()
                self.stdout.write('   ✅ Relaciones de supervisión limpiadas')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   ⚠️  No se pudieron limpiar relaciones M2M: {e}'))

        # 2. Manejar ubicaciones si se solicita preservarlas
        if preserve_ubicaciones:
            self.stdout.write('   🔄 Desconectando ubicaciones de departamentos...')
            ubicaciones_actualizadas = Ubicacion.objects.filter(departamento__isnull=False).update(departamento=None)
            self.stdout.write(f'   ✅ {ubicaciones_actualizadas} ubicaciones desconectadas de departamentos')
        
        # 3. Eliminar trabajadores (primero por las FK)
        trabajadores_count = Trabajador.objects.count()
        if trabajadores_count > 0:
            # Mostrar progreso para grandes volúmenes
            if trabajadores_count > 100:
                self.stdout.write(f'   🗑️  Eliminando {trabajadores_count} trabajadores...')
            
            Trabajador.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'   ✅ Eliminados {trabajadores_count} trabajadores'))
        else:
            self.stdout.write('   ℹ️  No hay trabajadores para eliminar')

        # 4. Eliminar departamentos
        departamentos_count = Departamento.objects.count()
        if departamentos_count > 0:
            if departamentos_count > 50:
                self.stdout.write(f'   🗑️  Eliminando {departamentos_count} departamentos...')
            
            Departamento.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'   ✅ Eliminados {departamentos_count} departamentos'))
        else:
            self.stdout.write('   ℹ️  No hay departamentos para eliminar')

    def reiniciar_secuencias(self):
        """Reiniciar secuencias auto-incrementales"""
        self.stdout.write('\n🔄 Reiniciando secuencias de base de datos...')
        
        try:
            with connection.cursor() as cursor:
                # Para SQLite
                if 'sqlite3' in connection.settings_dict['ENGINE']:
                    cursor.execute("DELETE FROM sqlite_sequence WHERE name IN ('app_touch_trabajador', 'app_touch_departamento');")
                    self.stdout.write('   ✅ Secuencias SQLite reiniciadas')
                
                # Para PostgreSQL
                elif 'postgresql' in connection.settings_dict['ENGINE']:
                    cursor.execute("SELECT setval(pg_get_serial_sequence('app_touch_trabajador', 'id'), 1, false);")
                    cursor.execute("SELECT setval(pg_get_serial_sequence('app_touch_departamento', 'id'), 1, false);")
                    self.stdout.write('   ✅ Secuencias PostgreSQL reiniciadas')
                
                # Para MySQL
                elif 'mysql' in connection.settings_dict['ENGINE']:
                    cursor.execute("ALTER TABLE app_touch_trabajador AUTO_INCREMENT = 1;")
                    cursor.execute("ALTER TABLE app_touch_departamento AUTO_INCREMENT = 1;")
                    self.stdout.write('   ✅ Secuencias MySQL reiniciadas')
                
                else:
                    self.stdout.write('   ℹ️  No se pudo reiniciar secuencias (motor de BD no soportado)')
                    
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   ⚠️  No se pudieron reiniciar secuencias: {e}'))

    def mostrar_recomendaciones(self):
        """Mostrar recomendaciones después de la limpieza"""
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('🎉 LIMPIEZA COMPLETADA'))
        self.stdout.write('=' * 60)
        self.stdout.write('\n📝 PRÓXIMOS PASOS RECOMENDADOS:')
        self.stdout.write('  1. ✅ Ejecutar migraciones: python manage.py migrate')
        self.stdout.write('  2. 🔄 Sincronizar datos LDAP: python manage.py sincronizar_ldap')
        self.stdout.write('  3. 🧪 Verificar datos: python manage.py shell')
        self.stdout.write('\n💡 En el shell de Django puedes verificar:')
        self.stdout.write('  from app_touch.models import Trabajador, Departamento')
        self.stdout.write('  print(f"Trabajadores: {Trabajador.objects.count()}")')
        self.stdout.write('  print(f"Departamentos: {Departamento.objects.count()}")')
        self.stdout.write('\n⚠️  Si tienes ubicaciones, verifica que sigan funcionando correctamente.')