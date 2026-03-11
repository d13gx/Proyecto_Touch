# 🤖 Detección Automática de Dispositivos

## 📋 ¿Cómo funciona ahora?

El sistema tiene 3 niveles de autenticación automáticos:

### 1. **Autenticación Local** (Tótem)
- Detecta usuario de Windows automáticamente
- Solo funciona en el servidor local

### 2. **Detección Automática de Dispositivos** 🆕
- Detecta IP, hostname y patrones del dispositivo
- Si está en la lista blanca, concede acceso automático
- Sin necesidad de login manual

### 3. **Login Manual** (Fallback)
- Si los métodos automáticos fallan
- Credenciales predefinidas

## 🔧 Configuración de Dispositivos Autorizados

### Paso 1: Obtener información del dispositivo
Ejecuta en la consola del navegador del dispositivo que quieres autorizar:

```javascript
// Copiar y pegar este código en la consola del navegador
fetch('/utils/deviceDetector.js').then(r => r.text()).then(eval);
```

O manualmente:
```javascript
const info = {
  hostname: window.location.hostname,
  userAgent: navigator.userAgent,
  platform: navigator.platform
};
console.log('Hostname:', info.hostname);
console.log('User Agent:', info.userAgent);
```

### Paso 2: Agregar a la lista blanca
Edita `client/backend/config/auth.js`:

```javascript
const AUTHORIZED_DEVICES = [
  'localhost',
  '127.0.0.1',
  'totem.cmf.cl',
  // Agregar aquí tus dispositivos
  '192.168.1.100',        // IP del PC
  'DESKTOP-JMADRID',      // Hostname Windows
  'LAPTOP-UMARTINEZ',      // Laptop del administrador
  'jmadrid-pc',           // Nombre del dispositivo
];
```

### Paso 3: Reiniciar el backend
```bash
# Detener y reiniciar el servidor
node server.js
```

## 🎯 Ejemplos de Configuración

### Para PC de escritorio fijo:
```javascript
const AUTHORIZED_DEVICES = [
  '192.168.1.50',         // IP estática
  'DESKTOP-OFICINA01',    // Hostname
  'jmadrid-workstation', // Nombre personalizado
];
```

### Para Laptop móvil:
```javascript
const AUTHORIZED_DEVICES = [
  '192.168.1.101',        // IP cuando está en la oficina
  'NOTEBOOK-UMARTINEZ',   // Hostname
  'umartinez-laptop',    // Nombre personalizado
];
```

## 🔍 Métodos de Detección

El sistema detecta automáticamente:

1. **IP Address**: Desde headers de la petición
2. **Hostname**: Desde headers `host`
3. **User Agent**: Patrones del navegador y sistema
4. **Hostname Windows**: Extraído del User Agent

## 🚀 Flujo Mejorado

```
Acceso a /ListaVisita
    ↓
¿Hay sesión guardada?
    ↓ NO
¿Es el tótem local?
    ↓ NO
¿Es dispositivo autorizado?
    ↓ NO
Mostrar login manual
```

## ✅ Ventajas

- **Sin login manual** para dispositivos conocidos
- **Seguridad por lista blanca** (solo dispositivos autorizados)
- **Flexibilidad** (IP, hostname, patrones)
- **Fallback seguro** (login manual si todo falla)

## 🔒 Seguridad

- Solo dispositivos configurados manualmente tienen acceso automático
- Las sesiones expiran en 24 horas
- Login manual como respaldo siempre disponible
