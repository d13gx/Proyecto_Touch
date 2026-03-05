# Sistema de Autenticación por Usuario Windows

## Descripción

El sistema de autenticación restringe el acceso al Panel Administrativo basándose en la cuenta de Windows que está actualmente logueada en el sistema.

## Funcionamiento

### Backend
- **Endpoint**: `/api/auth/current-user`
- **Detección**: Usa `os.userInfo().username` para obtener el usuario actual de Windows
- **Validación**: Compara el usuario detectado con una lista de usuarios autorizados

### Frontend
- **AuthGuard**: Componente que protege el Panel Administrativo
- **AuthService**: Servicio que maneja la comunicación con el backend
- **Redirección**: Muestra pantalla de acceso denegado si el usuario no está autorizado

## Configuración

### Usuarios Autorizados

Editar el archivo `client/backend/config/auth.js`:

```javascript
const AUTHORIZED_USERS = [
  'jmadrid@cmf.cl',  // Usuario principal autorizado
  // Agregar aquí otros usuarios autorizados
  // 'otro_usuario@cmf.cl',
];
```

### Modo Desarrollo

En modo desarrollo (`NODE_ENV !== 'production'`):
- Se permite acceso al usuario de prueba `dreyes@cmf.cl`
- Se muestra información adicional de depuración

### Modo Producción

En modo producción:
- Solo los usuarios en la lista `AUTHORIZED_USERS` tienen acceso
- No se permite el usuario de prueba
- No se muestra información de depuración

## Flujo de Autenticación

1. El usuario intenta acceder al Panel Administrativo
2. `AuthGuard` se activa y muestra pantalla de carga
3. `AuthService` llama al endpoint `/api/auth/current-user`
4. El backend detecta el usuario de Windows actual
5. El backend verifica si el usuario está en la lista de autorizados
6. Si está autorizado: se muestra el Panel Administrativo
7. Si no está autorizado: se muestra pantalla de acceso denegado

## Mensajes de Error

### Acceso Denegado
- Muestra el usuario actual detectado
- Muestra la lista de usuarios autorizados
- Indica claramente que no se tienen permisos

### Error de Verificación
- Muestra mensaje de error técnico
- Permite reintentar la verificación

## Pruebas

### Para probar con usuario autorizado:
```bash
# Asegurarse que el usuario actual está en la lista
# En Windows, verificar con:
whoami
```

### Para probar acceso denegado:
1. Agregar un usuario no autorizado a la lista de prueba
2. O eliminar el usuario actual de la lista de autorizados

## Consideraciones de Seguridad

- La autenticación se basa en el usuario del sistema operativo
- No requiere contraseñas adicionales
- Es efectivo para entornos controlados donde cada usuario tiene su propia cuenta
- Para mayor seguridad, considerar implementar autenticación adicional (LDAP, OAuth, etc.)

## Archivos Modificados

- `client/backend/server.js`: Endpoint de autenticación
- `client/backend/config/auth.js`: Configuración de usuarios autorizados
- `client/src/services/authService.js`: Servicio de autenticación
- `client/src/components/security/AuthGuard.jsx`: Componente de protección
- `client/src/components/security/PanelAdministrativo.jsx`: Panel protegido

## Notas Importantes

- El sistema funciona correctamente en Windows
- Para producción, asegurarse de configurar correctamente la variable `NODE_ENV=production`
- Los usuarios deben tener cuentas de Windows únicas y seguras
