from django.core.management.base import BaseCommand
from app_touch.models import Departamento, Trabajador

class Command(BaseCommand):
    help = "Limpia departamentos y desasigna trabajadores"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("Revirtiendo poblado de departamentos..."))

        # Quitar relaciones
        Trabajador.objects.update(departamento=None)
        Departamento.objects.update(jefe=None)

        # Eliminar departamentos
        Departamento.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("✔ Departamentos eliminados y trabajadores desasignados"))