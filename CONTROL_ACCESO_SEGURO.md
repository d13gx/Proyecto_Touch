# 🔒 Control de Acceso Seguro - ListaVisita

## ✅ **Sistema de Autorización Implementado**

El sistema ahora verifica **dos niveles de seguridad** para acceder a `/ListaVisita`:

### 🔐 **Nivel 1: Autenticación**
- **Local**: Usuario de Windows del tótem
- **LDAP**: Credenciales del Active Directory
- **Credenciales**: Login manual predefinido

### 🛡️ **Nivel 2: Autorización (OBLIGATORIO)**
- **Solo usuarios en `AUTHORIZED_USERS` pueden acceder**
- **Verificación adicional después de autenticación exitosa**
- **Aplica a TODOS los métodos de autenticación**

## 📋 **Usuarios Autorizados Actuales**

```javascript
const AUTHORIZED_USERS = [
  'jmadrid',  // Usuario principal autorizado
  'umartinez', // Usuario secundario autorizado
  // Agregar aquí otros usuarios autorizados para /ListaVisita
];
```

## 🚫 **Casos de Acceso Denegado**

### **Ejemplo 1: Usuario no autorizado con credenciales correctas**
```
Usuario: dreyes
Contraseña: test123 (correcta)
Resultado: ❌ "Usuario autenticado pero no autorizado para acceder a esta función"
Código: 403 Forbidden
```

### **Ejemplo 2: Usuario no autorizado con LDAP**
```
Usuario: dreyes@cmf.cl
Contraseña: [contraseña del AD correcta]
Resultado: ❌ "Usuario autenticado pero no autorizado para acceder a esta función"
Código: 403 Forbidden
```

## ✅ **Casos de Acceso Permitido**

### **Ejemplo 1: Usuario autorizado con credenciales**
```
Usuario: jmadrid
Contraseña: cmf123
Resultado: ✅ "Login exitoso y usuario autorizado"
Código: 200 OK
```

### **Ejemplo 2: Usuario autorizado con LDAP**
```
Usuario: jmadrid@cmf.cl
Contraseña: [contraseña del AD]
Resultado: ✅ "Autenticación LDAP exitosa y usuario autorizado"
Código: 200 OK
```

## 🔄 **Flujo Completo de Verificación**

```
Intento de Acceso a /ListaVisita
    ↓
1. Verificar método de autenticación
    ↓
2. Autenticar usuario (LDAP/Credenciales/Local)
    ↓
3. ✅ Si autenticación exitosa → Verificar AUTHORIZED_USERS
    ↓
4. ✅ Si está en lista → Acceso concedido
    ❌ Si NO está en lista → Acceso denegado (403)
```

## 🛠️ **Configuración de Nuevos Usuarios**

### **Para agregar un nuevo usuario autorizado:**

1. **Editar** `client/backend/config/auth.js`:
```javascript
const AUTHORIZED_USERS = [
  'jmadrid',
  'umartinez',
  'nuevo_usuario',  // ← Agregar aquí
];
```

2. **Reiniciar el backend Node.js**

### **Para usuarios LDAP:**
- No necesitan credenciales adicionales
- Solo deben estar en `AUTHORIZED_USERS`
- Usan sus credenciales del Active Directory

## 🚨 **Mensajes de Error**

### **403 Forbidden (No autorizado)**
```
"Usuario autenticado pero no autorizado para acceder a esta función. Contacte al administrador del sistema."
```

### **401 Unauthorized (Credenciales incorrectas)**
```
"Credenciales incorrectas" (para login manual)
"Credenciales LDAP incorrectas" (para LDAP)
```

## 🔧 **Verificación del Sistema**

### **Para probar el sistema:**
```bash
# Usuario no autorizado (debe fallar)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "usuario_no_autorizado", "password": "password"}'

# Usuario autorizado (debe funcionar)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "jmadrid", "password": "cmf123"}'
```

## 📊 **Logs de Auditoría**

El sistema registra:
- ✅ Intentos de autenticación exitosos
- ❌ Intentos de acceso no autorizados (403)
- ❌ Credenciales incorrectas (401)
- 📍 Método de autenticación utilizado

## 🎯 **Resultado Final**

**Solo los usuarios específicamente autorizados en `AUTHORIZED_USERS` pueden acceder a `/ListaVisita`, independientemente del método de autenticación utilizado.**

Esto proporciona:
- **Seguridad de dos factores** (autenticación + autorización)
- **Control granular de acceso**
- **Auditoría completa**
- **Flexibilidad de métodos de login**
