from django.contrib import admin
from .models import Departamento, Trabajador, Ubicacion, Mapa, ProcedimientoEmergencia

# Registro de modelos
@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'jefe', 'contacto_email', 'contacto_telefono')
    search_fields = ('nombre', 'jefe__nombre', 'jefe__apellido')

@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'apellido', 'cargo', 'departamento', 'email', 'telefono',
        'compañia', 'cuenta_activa', 'ultima_conexion'
    )
    search_fields = (
        'nombre', 'apellido', 'cargo', 'departamento__nombre',
        'email', 'compañia', 'jefatura_directa'
    )
    list_filter = ('departamento', 'cuenta_activa', 'compañia')
    filter_horizontal = ('supervisa_a',)  # Para facilitar selección en el admin


@admin.register(Ubicacion)
class UbicacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'categoria', 'departamento', 'coordenada_x', 'coordenada_y', 'tipo_emergencia')
    list_filter = ('categoria', 'tipo_emergencia')
    search_fields = ('nombre', 'departamento__nombre', 'categoria')

@admin.register(Mapa)
class MapaAdmin(admin.ModelAdmin):
    list_display = ('nombre',)
    filter_horizontal = ('ubicaciones',)

@admin.register(ProcedimientoEmergencia)
class ProcedimientoEmergenciaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo_emergencia')
    list_filter = ('tipo_emergencia',)
    search_fields = ('titulo',)
