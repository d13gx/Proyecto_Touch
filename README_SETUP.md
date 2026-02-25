# Configuración Automática del Entorno

## Problema Resuelto

Antes, cuando hacías `git pull` en otro PC, el proyecto no funcionaba porque las configuraciones de red tenían IPs estáticas hardcodeadas.

## Solución Implementada

Se ha implementado un sistema de configuración automática que:

1. **Detecta automáticamente la IP local** de cada máquina
2. **Actualiza los archivos de configuración** con la IP correcta
3. **Mantiene compatibilidad** con el flujo de trabajo existente

## Uso

### Opción 1: Automática (Recomendada)

Ejecuta el script principal como siempre:

```bash
INICIAR_PROYECTO.bat
```

El script ahora automáticamente:
- Detecta la IP local
- Actualiza `client/.env.development`
- Actualiza `django_crud_api/settings.py`
- Pregunta si quieres actualizar la configuración de BD

### Opción 2: Manual

Ejecuta solo la configuración:

```bash
python setup_environment.py
```

## Archivos Modificados

- ✅ `client/.env.development` - Ahora usa localhost por defecto
- ✅ `django_crud_api/settings.py` - CORS/CSRF configurados para localhost
- ✅ `client/src/utils/apiConfig.js` - IP por defecto cambiada a localhost
- ✅ `client/backend/db.js` - Ahora usa configuración externa
- ✅ `INICIAR_PROYECTO.bat` - Ejecuta configuración automática

## Nuevos Archivos

- 🆕 `setup_environment.py` - Script de configuración automática
- 🆕 `client/backend/config.js` - Configuración de base de datos
- 🆕 `client/backend/config.example.js` - Plantilla de configuración

## Flujo de Trabajo Actualizado

1. **Clonar o hacer pull** del repositorio
2. **Ejecutar** `INICIAR_PROYECTO.bat`
3. **Responder** las preguntas de configuración (opcional)
4. **Listo** - Todos los servicios funcionan con la IP local

## Configuración de Base de Datos

Si necesitas cambiar el servidor de base de datos:

1. Edita `client/backend/config.js`
2. O ejecuta `python setup_environment.py` y responde "s" cuando pregunte por la BD

## Verificación

Después de la configuración, verifica que los servicios funcionen en:

- Frontend: `http://[TU_IP]:5173`
- Django API: `http://[TU_IP]:8000`
- Node.js API: `http://[TU_IP]:3001`

## Troubleshooting

### Si Django no funciona:
- Verifica que `ALLOWED_HOSTS = ['*']` en `settings.py`
- Revisa que CORS esté configurado correctamente

### Si el frontend no se conecta:
- Verifica que `VITE_SERVER_IP` tenga tu IP local en `.env.development`
- Revisa la consola del navegador para errores de CORS

### Si la base de datos no conecta:
- Verifica la configuración en `client/backend/config.js`
- Asegúrate que el servidor SQL sea accesible desde tu red

## Notas Importantes

- El script solo modifica archivos de configuración, no toca tu código
- Los cambios son reversibles con `git checkout`
- Para producción, usa variables de entorno en lugar de archivos de configuración
