# Configuración para Producción (Tótem Digital)

## 🚀 Despliegue en Tótem Digital

Este documento explica cómo configurar el sistema de QR para que funcione correctamente en el tótem digital en producción.

### 📋 Pasos para Configurar

#### 1. Determinar la IP del Tótem

Primero, obtén la dirección IP del tótem en la red local:

```bash
# En Windows
ipconfig
# Busca la dirección IPv4 (ej: 192.168.1.100)

# En Linux/Mac
ip addr show
# o
ifconfig
```

#### 2. Configurar Variables de Entorno

Edita el archivo `.env.production` en la carpeta `client/`:

```bash
# IP del tótem - CAMBIA ESTO por la IP real
VITE_TOTEM_IP=192.168.1.100

# Puerto del frontend (usualmente 5173)
VITE_FRONTEND_PORT=5173

# URL completa del tótem (se construye automáticamente)
VITE_TOTEM_URL=http://$VITE_TOTEM_IP:$VITE_FRONTEND_PORT
```

#### 3. Construir para Producción

```bash
# En la carpeta client/
npm run build
```

#### 4. Desplegar en el Tótem

Copia la carpeta `dist/` generada al tótem y sirve los archivos con un servidor web.

### 🔧 Configuración del Servidor

Asegúrate de que el servidor web esté configurado para:

1. **Escuchar en todas las interfaces** (`0.0.0.0`)
2. **Permitir CORS** para el backend
3. **Servir archivos estáticos** desde la carpeta `dist/`

Ejemplo con servidor HTTP simple:

```bash
# En la carpeta dist/
npx serve -s . -l 5173 --host 0.0.0.0
```

### 📱 Verificación del Funcionamiento

1. **Accede desde el tótem**: `http://localhost:5173/video-seguridad`
2. **Verifica la URL del QR**: Debe mostrar la IP del tótem
3. **Escanea con un móvil**: Debe redirigir correctamente al cuestionario

### 🌐 Configuración de Red

Asegúrate de que:

- ✅ El tótem esté conectado a la red local
- ✅ Los dispositivos móviles estén en la misma red
- ✅ No haya firewall bloqueando el puerto 5173
- ✅ El backend Django sea accesible desde el tótem

### 🐛 Solución de Problemas

#### El QR no funciona desde móviles:
1. Verifica que la IP en `.env.production` sea correcta
2. Confirma que el servidor esté escuchando en `0.0.0.0`
3. Revisa que no haya firewall bloqueando el puerto

#### Los tokens se comparten:
1. Verifica que el backend esté corriendo
2. Confirma la URL del backend en `tokenManager.js`
3. Revisa los logs del servidor Django

### 📝 Variables de Entorno Adicionales

Opcionalmente, puedes configurar:

```bash
# URL del backend (si está en otro servidor)
VITE_BACKEND_URL=http://192.168.1.100:8000

# Tiempo de expiración de tokens (minutos)
VITE_TOKEN_EXPIRY_MINUTES=2

# Ambiente (development/production)
NODE_ENV=production
```

### 🔒 Consideraciones de Seguridad

1. **HTTPS**: En producción, considera usar HTTPS
2. **Red aislada**: Mantén el tótem en una red controlada
3. **Tokens cortos**: Mantén la expiración corta (2 minutos)
4. **Logs**: Monitorea los accesos y errores

---

📞 **Soporte**: Si tienes problemas, revisa la consola del navegador y los logs del servidor.
