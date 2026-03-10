# 🔐 Sistema de Autenticación LDAP Integrado

## 📋 Descripción

El sistema ahora soporta autenticación LDAP (Active Directory) para acceso a `/ListaVisita`, utilizando la misma infraestructura que ya existe en el módulo de trabajadores.

## 🔄 Flujo de Autenticación Mejorado

### 1. **Autenticación Local** (Tótem)
- Detecta usuario de Windows automáticamente
- Solo funciona en el servidor local

### 2. **Detección Automática de Dispositivos** 
- Detecta IP, hostname y patrones del dispositivo
- Si está en la lista blanca, concede acceso automático

### 3. **LDAP (Active Directory)** 🆕
- Usa credenciales del Active Directory de CMF
- Se comunica con el backend Django existente
- Autenticación segura y centralizada

### 4. **Credenciales Manuales** (Fallback)
- Si LDAP falla, ofrece login con credenciales predefinidas
- Como respaldo siempre disponible

## 🌐 Arquitectura del Sistema

```
Frontend (React)
    ↓
Backend Node.js (client/backend)
    ↓
Backend Django (app_touch)
    ↓
Active Directory (cmfad1:389)
```

## 🔧 Configuración LDAP

### Backend Django (ya configurado)
- **Servidor**: `cmfad1:389`
- **Base DN**: `DC=cmf,DC=cl`
- **Usuario**: `totem@cmf.cl`
- **Formatos soportados**:
  - `usuario@cmf.cl`
  - `cmf\usuario`
  - `usuario`

### Backend Node.js (proxy)
- Recibe peticiones del frontend
- Reenvía al backend Django
- Devuelve respuesta procesada

## 🚀 Flujo LDAP

1. **Usuario ingresa credenciales del AD**
2. **Frontend** → Backend Node.js (`/api/auth/ldap-login`)
3. **Node.js** → Backend Django (`/app_touch/api/auth/login/`)
4. **Django** → Active Directory (autenticación)
5. **AD** → Django (respuesta)
6. **Django** → Node.js → Frontend (acceso concedido)

## 📱 Interfaz de Usuario

### Selector de Método de Autenticación
- **LDAP**: Por defecto, usa credenciales del AD
- **Credenciales**: Como respaldo

### Indicadores Visuales
- Icono de red para LDAP
- Icono de usuario para credenciales
- Mensajes contextuales según método

## ✅ Ventajas del Sistema LDAP

### 🔒 **Seguridad**
- Autenticación centralizada en Active Directory
- No hay duplicación de credenciales
- Mismas credenciales que usan los empleados diariamente

### 🎯 **Usabilidad**
- Los usuarios usan sus credenciales conocidas
- No necesitan recordar contraseñas adicionales
- Fallback automático a credenciales locales si falla LDAP

### 🛡️ **Mantenimiento**
- Usa infraestructura LDAP existente
- No requiere configuración adicional
- Gestión centralizada de usuarios

## 🔄 Compatibilidad

### Formatos de Usuario Soportados
- `jmadrid@cmf.cl` (formato UPN)
- `cmf\jmadrid` (formato dominio\usuario)
- `jmadrid` (formato simple)

### Información Obtenida del AD
- Username
- Email
- DisplayName (si está disponible)
- Validación de cuenta activa

## 🚨 Manejo de Errores

### Si LDAP falla:
1. Muestra error específico
2. Cambia automáticamente al modo "Credenciales"
3. Permite reintentar con método alternativo

### Si las credenciales son incorrectas:
- Muestra mensaje de error claro
- Permite reintentar
- Mantiene el método seleccionado

## 📊 Logs y Auditoría

### Backend Django
- Logs de intentos de autenticación
- Registro de éxitos y fracasos
- Información de depuración detallada

### Backend Node.js
- Logs de comunicación con Django
- Errores de conexión
- Tiempos de respuesta

## 🔧 Configuración Adicional

### Para agregar nuevos usuarios autorizados:
1. **LDAP**: Los usuarios ya existen en el AD
2. **Credenciales**: Editar `client/backend/config/auth.js`

```javascript
const credentials = {
  'jmadrid': 'cmf123',
  'umartinez': 'cmf456',
  // Agregar más usuarios aquí
};
```

## 🎉 Resultado Final

Los empleados ahora pueden:
- Acceder con sus credenciales del Active Directory
- Tener una experiencia de login familiar
- Contar con múltiples métodos de autenticación
- Recibir acceso automático desde dispositivos conocidos

El sistema es más seguro, usable y mantiene compatibilidad total con la infraestructura existente.
