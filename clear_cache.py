import subprocess

def is_real_error(err_text):
    # Lista de textos comunes a ignorar en stderr
    ignorable = [
        "Python 3.",
        "Type \"help\", \"copyright\", \"credits\"",
        "(InteractiveConsole)",
        "now exiting InteractiveConsole",
        ">>>"
    ]
    for item in ignorable:
        if item in err_text:
            return False
    return True

print("Iniciando proceso para limpiar cache...")

try:
    command = 'python manage.py shell'
    script = (
        "from django.core.cache import cache\n"
        "cache.clear()\n"
        "print('Cache limpiado correctamente')\n"
        "exit()\n"
    )

    process = subprocess.Popen(command, shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = process.communicate(script.encode())

    print("Salida del proceso:")
    print(out.decode().strip())

    err_text = err.decode().strip()
    if err_text and is_real_error(err_text):
        print("Errores:")
        print(err_text)

except Exception as e:
    print("Se produjo un error al ejecutar el comando:")
    print(e)

input("Presione enter para cerrar...")
