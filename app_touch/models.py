from django.db import models

# ---------------------------
# Modelo Departamento
# ---------------------------
class Departamento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    jefe = models.ForeignKey(
        'Trabajador',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='departamentos_jefe'
    )
    contacto_email = models.EmailField(blank=True)
    contacto_telefono = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.nombre


# ---------------------------
# Modelo Trabajador
# ---------------------------
from django.db import models

class Trabajador(models.Model):
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    cargo = models.CharField(max_length=100)
    departamento = models.ForeignKey(
        'Departamento',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trabajadores'
    )
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    foto = models.ImageField(upload_to='trabajadores/', blank=True, null=True)
    ultima_conexion = models.DateTimeField(null=True, blank=True)
    compañia = models.CharField(max_length=255, blank=True, null=True)
    cuenta_activa = models.BooleanField(default=True)
    jefatura_directa = models.CharField(max_length=255, blank=True, null=True)

    # Relación con trabajadores supervisados
    supervisa_a = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='supervisado_por')

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

    def __str__(self):
        return f"{self.nombre} {self.apellido}"



# ---------------------------
# Modelo Ubicacion (unificado)
# ---------------------------
# ---------------------------
# Modelo Ubicacion (actualizado)
# ---------------------------
class Ubicacion(models.Model):
    CATEGORIAS = [
        ('porteria', 'Portería'),              # 🟢 Verde
        ('departamento', 'Departamento'),      # 🔴 Rojo
        ('gerencia', 'Gerencia/Subgerencia'),  # 🔵 Azul
        ('servicio', 'Baño/Camarín'),          # 🟡 Amarillo
        ('jefatura', 'Jefatura'),              # 🟠 Naranjo
        ('bodega', 'Bodega'),                  # 🟣 Morado
        ('via', 'Calle/Pasillo'),              # 🔵 Celeste
        ('estacionamiento', 'Estacionamiento'),# ⚪ Gris
        ('fumadores', 'Zona de Fumadores'),    # 🟤 Café
        ('segura', 'Ubicación Segura'),        # 🟢 Verde claro
        ('inicio', 'Punto de Inicio'),         # 🔴 Rojo intenso (nuevo)
        ('casino', 'Casino'),                  # 🟡 Amarillo dorado (nuevo)
        ('cancha', 'Cancha/Área Deportiva'),   # 🟢 Verde césped (nuevo)
    ]

    TIPO_EMERGENCIA = [
        ('incendio', 'Incendio'),
        ('sismo', 'Sismo'),
    ]

    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    coordenada_x = models.FloatField()
    coordenada_y = models.FloatField()
    categoria = models.CharField(
        max_length=50,
        choices=CATEGORIAS,
        default='departamento'
    )
    tipo_emergencia = models.CharField(
        max_length=50,
        choices=TIPO_EMERGENCIA,
        blank=True,
        null=True,
        help_text="Solo aplica si la categoría es 'segura'"
    )
    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ubicaciones'
    )

    def __str__(self):
        return f"{self.nombre} ({self.categoria})"

    @property
    def es_punto_inicio(self):
        """Indica si esta ubicación es un punto de inicio"""
        return self.categoria == 'inicio'


# ---------------------------
# Modelo Mapa
# ---------------------------
class Mapa(models.Model):
    nombre = models.CharField(max_length=100)
    imagen = models.ImageField(upload_to='mapas/')
    ubicaciones = models.ManyToManyField(Ubicacion, blank=True)

    def __str__(self):
        return self.nombre


# ---------------------------
# Modelo ProcedimientoEmergencia
# ---------------------------
class ProcedimientoEmergencia(models.Model):
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    tipo_emergencia = models.CharField(max_length=50, choices=Ubicacion.TIPO_EMERGENCIA)

    def __str__(self):
        return f"{self.titulo} ({self.tipo_emergencia})"
