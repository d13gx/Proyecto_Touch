#!/usr/bin/env python3
"""
Script para configurar automáticamente el entorno según la máquina actual.
Detecta la IP local y ajusta los archivos de configuración.
"""

import os
import socket
import re
import sys

def get_local_ip():
    """Obtener la IP local automáticamente"""
    try:
        # Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def update_env_file(ip):
    """Actualizar archivo .env.development con la IP local"""
    env_file = "client/.env.development"
    
    if not os.path.exists(env_file):
        print(f"❌ No se encuentra {env_file}")
        return False
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Descomentar y actualizar la línea VITE_SERVER_IP
    content = re.sub(
        r'# VITE_SERVER_IP=.*',
        f'VITE_SERVER_IP={ip}',
        content
    )
    
    with open(env_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Actualizado {env_file} con IP: {ip}")
    return True

def update_django_settings(ip):
    """Actualizar settings.py de Django con la IP local"""
    settings_file = "django_crud_api/settings.py"
    
    if not os.path.exists(settings_file):
        print(f"❌ No se encuentra {settings_file}")
        return False
    
    with open(settings_file, 'r') as f:
        content = f.read()
    
    # Agregar la IP local a CORS_ALLOWED_ORIGINS
    cors_pattern = r'(CORS_ALLOWED_ORIGINS = \[.*?)(\s*# IPs dinámicas.*?\])'
    replacement = f'\\1    "http://{ip}:5173",\\2'
    content = re.sub(cors_pattern, replacement, content, flags=re.DOTALL)
    
    # Agregar la IP local a CSRF_TRUSTED_ORIGINS
    csrf_pattern = r'(CSRF_TRUSTED_ORIGINS = \[.*?)(\s*# IPs dinámicas.*?\])'
    replacement = f'\\1    "http://{ip}:5173",\\2'
    content = re.sub(csrf_pattern, replacement, content, flags=re.DOTALL)
    
    with open(settings_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Actualizado {settings_file} con IP: {ip}")
    return True

def update_db_config(ip):
    """Actualizar configuración de base de datos si es necesario"""
    config_file = "client/backend/config.js"
    
    if not os.path.exists(config_file):
        print(f"❌ No se encuentra {config_file}")
        return False
    
    # Preguntar si se debe actualizar el servidor de BD
    print(f"\n📊 Configuración actual de base de datos:")
    with open(config_file, 'r') as f:
        lines = f.readlines()
        for line in lines:
            if 'server:' in line and not line.strip().startswith('//'):
                print(f"   {line.strip()}")
    
    response = input(f"\n¿Desea cambiar el servidor de BD a localhost/otra IP? (s/n): ")
    if response.lower() == 's':
        new_server = input(f"Ingrese la IP del servidor de BD (default: localhost): ") or "localhost"
        
        with open(config_file, 'r') as f:
            content = f.read()
        
        content = re.sub(
            r"server: '[^']*'",
            f"server: '{new_server}'",
            content
        )
        
        with open(config_file, 'w') as f:
            f.write(content)
        
        print(f"✅ Actualizado servidor de BD a: {new_server}")
    
    return True

def main():
    print("🔧 Configuración automática del entorno Proyecto Touch")
    print("=" * 50)
    
    # Detectar IP local
    local_ip = get_local_ip()
    print(f"🌐 IP local detectada: {local_ip}")
    
    # Confirmar cambios
    print(f"\nSe realizarán los siguientes cambios:")
    print(f"   - Actualizar .env.development con IP: {local_ip}")
    print(f"   - Agregar {local_ip}:5173 a CORS/CSRF de Django")
    print(f"   - Opcional: actualizar servidor de base de datos")
    
    response = input(f"\n¿Continuar con la configuración? (s/n): ")
    if response.lower() != 's':
        print("❌ Configuración cancelada")
        return
    
    # Actualizar archivos
    success = True
    success &= update_env_file(local_ip)
    success &= update_django_settings(local_ip)
    success &= update_db_config(local_ip)
    
    if success:
        print(f"\n✅ Configuración completada exitosamente!")
        print(f"📋 Resumen:")
        print(f"   - IP local: {local_ip}")
        print(f"   - Frontend: http://{local_ip}:5173")
        print(f"   - Django API: http://{local_ip}:8000")
        print(f"   - Node.js API: http://{local_ip}:3001")
        print(f"\n🚀 Ahora puedes ejecutar INICIAR_PROYECTO.bat")
    else:
        print(f"\n❌ Hubo errores durante la configuración")

if __name__ == "__main__":
    main()
