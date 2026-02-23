from django.core.management.base import BaseCommand
from app_touch.models import Trabajador, Departamento

class Command(BaseCommand):
    help = "Crea y asigna departamentos automáticamente a partir de los trabajadores y sus cargos, y asigna jefes según jerarquía"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE("🔄 Iniciando proceso de creación/asignación de departamentos y jefes..."))

        # 1. Crear departamentos desde trabajadores con cargos que contienen 'jefe'
        jefes = Trabajador.objects.filter(cargo__icontains="jefe", cuenta_activa=True)

        for jefe in jefes:
            nombre_dep = (
                jefe.cargo.replace("Jefe", "")
                .replace("del área", "")
                .replace("de", "")
                .strip()
                .capitalize()
            )

            dep, creado = Departamento.objects.get_or_create(
                nombre=nombre_dep,
                defaults={
                    "descripcion": f"Departamento de {nombre_dep}",
                    "jefe": jefe
                }
            )

            if not creado and not dep.jefe:
                dep.jefe = jefe
                dep.save()

            jefe.departamento = dep
            jefe.save()

            self.stdout.write(self.style.SUCCESS(f"✔ Departamento '{dep.nombre}' creado/asignado con jefe {jefe}"))

        # 2. Asignar trabajadores a departamentos según cargo
        for t in Trabajador.objects.filter(departamento__isnull=True, cuenta_activa=True):
            cargo_lower = t.cargo.lower()
            dep = None

            if "ti" in cargo_lower or "informática" in cargo_lower:
                dep = Departamento.objects.filter(nombre__icontains="ti").first() or Departamento.objects.filter(nombre__icontains="informática").first()
            elif "producción" in cargo_lower:
                dep = Departamento.objects.filter(nombre__icontains="producción").first()
            elif "finanzas" in cargo_lower:
                dep = Departamento.objects.filter(nombre__icontains="finanzas").first()
            elif "recursos humanos" in cargo_lower or "rrhh" in cargo_lower:
                dep = Departamento.objects.filter(nombre__icontains="recursos humanos").first()

            if dep:
                t.departamento = dep
                t.save()
                self.stdout.write(self.style.WARNING(f"→ {t} asignado a {dep.nombre}"))

        # 3. Asignar jefes por jerarquía: gerencia > subgerencia > jefe
        prioridad = ['gerencia', 'subgerencia', 'jefe']
        for dep in Departamento.objects.all():
            trabajadores = dep.trabajadores.filter(cuenta_activa=True)
            for cargo in prioridad:
                candidato = trabajadores.filter(cargo__icontains=cargo).first()
                if candidato:
                    dep.jefe = candidato
                    dep.save()
                    self.stdout.write(self.style.SUCCESS(f"👤 Jefe asignado: {candidato} al departamento {dep.nombre}"))
                    break

        self.stdout.write(self.style.SUCCESS("🎉 Proceso completado correctamente"))
