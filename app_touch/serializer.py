from rest_framework import serializers
from .models import Ubicacion, Departamento, Trabajador, Mapa

from rest_framework import serializers
from .models import Trabajador, Departamento

# ---------------------------
# Serializer base para Trabajador
# ---------------------------
class TrabajadorBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajador
        fields = [
            'id', 'nombre', 'apellido', 'cargo', 'email', 'telefono', 'foto',
            'compañia', 'cuenta_activa', 'ultima_conexion'
        ]

# ---------------------------
# Serializer para Departamento
# ---------------------------
class DepartamentoSerializer(serializers.ModelSerializer):
    jefe = TrabajadorBaseSerializer(read_only=True)
    trabajadores = serializers.SerializerMethodField()
    def get_trabajadores(self, obj):
        activos = obj.trabajadores.filter(cuenta_activa=True)
        return TrabajadorBaseSerializer(activos, many=True).data

    class Meta:
        model = Departamento
        fields = [
            'id', 'nombre', 'descripcion', 'contacto_email',
            'contacto_telefono', 'jefe', 'trabajadores'
        ]

# ---------------------------
# Serializer para Trabajador con departamento completo
# ---------------------------
class TrabajadorSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)
    supervisa_a = TrabajadorBaseSerializer(many=True, read_only=True)
    supervisado_por = TrabajadorBaseSerializer(many=True, read_only=True)

    class Meta:
        model = Trabajador
        fields = [
            'id', 'nombre', 'apellido', 'cargo', 'email', 'telefono', 'foto',
            'departamento', 'compañia', 'cuenta_activa', 'ultima_conexion',
            'jefatura_directa', 'supervisa_a', 'supervisado_por'
        ]

# ---------------------------
# Serializer para Ubicacion (unificado)
# ---------------------------
class UbicacionSerializer(serializers.ModelSerializer):
    departamento = DepartamentoSerializer(read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            'id',
            'nombre',
            'descripcion',
            'coordenada_x',
            'coordenada_y',
            'categoria',
            'tipo_emergencia',
            'departamento'
        ]

# ---------------------------
# Serializer para Mapa
# ---------------------------
class MapaSerializer(serializers.ModelSerializer):
    ubicaciones = UbicacionSerializer(many=True)

    class Meta:
        model = Mapa
        fields = ['id', 'nombre', 'imagen', 'ubicaciones']
