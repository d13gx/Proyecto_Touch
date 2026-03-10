// Ejecutar en la consola del navegador para obtener información del dispositivo
console.log('📱 INFORMACIÓN DEL DISPOSITIVO:');
console.log('================================');

// Información básica
console.log('Hostname:', window.location.hostname);
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);

// Intentar extraer hostname del User Agent (Windows)
const ua = navigator.userAgent;
const windowsMatch = ua.match(/Windows NT.*?([A-Z0-9-]+)/);
if (windowsMatch) {
  console.log('Hostname detectado:', windowsMatch[1]);
}

// Información de red (si está disponible)
if (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection) {
  console.log('Para obtener IP, ejecuta el siguiente comando en CMD:');
  console.log('ipconfig');
  console.log('Y busca tu dirección IPv4 (ej: 192.168.1.XXX)');
}

console.log('================================');
console.log('🔧 CONFIGURACIÓN SUGERIDA:');
console.log('Agregar a AUTHORIZED_DEVICES en client/backend/config/auth.js:');
console.log(`'${window.location.hostname}',`);
if (windowsMatch) {
  console.log(`'${windowsMatch[1]}',`);
}
console.log('TU_IP_AQUI');
