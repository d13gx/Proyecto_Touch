# Sistema de Autenticación Mejorado - ListaVisita

## 📋 Descripción

El sistema ahora soporta dos métodos de autenticación para acceder a `/ListaVisita`:

1. **Autenticación Local** (Tótem): Basada en usuario de Windows
2. **Autenticación Remota** (Otros dispositivos): Con credenciales predefinidas

## 🔐 Credenciales de Acceso Remoto

| Usuario | Contraseña | Permisos |
|---------|------------|----------|
| jmadrid | cmf123 | Acceso completo |
| umartinez | cmf456 | Acceso completo |

## 🌐 Configuración de Red

### Backend (Node.js)
- **Puerto**: 3001
- **Accesible desde**: `http://totem.cmf.cl:3001` o `http://[IP-LOCAL]:3001`
- **Acepta conexiones**: Remotas (0.0.0.0)

### Frontend
- **Puerto**: 5173
- **URL principal**: `http://totem.cmf.cl:5173`

## 🔄 Flujo de Autenticación

### Para usuarios en el Tótem (Local):
1. Accede a `http://totem.cmf.cl:5173/ListaVisita`
2. El sistema detecta automáticamente el usuario de Windows
3. Si está autorizado en `AUTHORIZED_USERS`, concede acceso
4. Si no está autorizado, muestra opción de login remoto

### Para usuarios externos (Remoto):
1. Accede a `http://totem.cmf.cl:5173/ListaVisita`
2. El sistema detecta que no es acceso local
3. Muestra formulario de login
4. Ingresa credenciales de la tabla above
5. El sistema guarda sesión por 24 horas

## 🛠️ Endpoints API

### Login Remoto
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "jmadrid",
  "password": "cmf123"
}
```

### Verificación Local
```
GET /api/auth/current-user
```

## 📱 Características

- **Sesión persistente**: 24 horas para acceso remoto
- **Detección automática**: Local vs Remoto
- **Fallback inteligente**: Si falla local, ofrece login remoto
- **Seguridad**: Credenciales predefinidas y usuarios autorizados
- **Responsive**: Interfaz adaptada para móviles y desktop

## 🚀 Iniciar Servicios

```bash
# Backend (desde client/backend)
node server.js

# Frontend (desde client)
npm run dev
```

## 🔧 Configuración

### Usuarios autorizados (local)
Editar `client/backend/config/auth.js`:
```javascript
const AUTHORIZED_USERS = [
  'jmadrid',
  'umartinez',
  // Agregar más usuarios aquí
];
```

### Credenciales (remoto)
Editar `client/backend/server.js`:
```javascript
const credentials = {
  'jmadrid': 'cmf123',
  'umartinez': 'cmf456',
  // Agregar más usuarios aquí
};
```

## 📝 Notas Importantes

- El backend ahora acepta conexiones desde cualquier IP
- Las sesiones remotas expiran en 24 horas
- El sistema prioriza autenticación local cuando es posible
- Los usuarios externos siempre usarán login con credenciales
