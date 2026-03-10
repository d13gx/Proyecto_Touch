// Herramienta para obtener información del dispositivo actual
// Ejecutar en la consola del navegador para configurar autorización automática

function getDeviceInfo() {
  const info = {
    hostname: window.location.hostname,
    ip: 'Obtener con ipconfig o ifconfig',
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString()
  };
  
  // Intentar extraer hostname del userAgent
  let detectedHostname = 'unknown';
  if (info.userAgent) {
    const windowsMatch = info.userAgent.match(/Windows NT.*?([A-Z0-9-]+)/);
    if (windowsMatch) {
      detectedHostname = windowsMatch[1];
    }
  }
  
  info.detectedHostname = detectedHostname;
  
  console.log('📱 Información del Dispositivo:');
  console.log('===========================');
  console.log('Hostname:', info.hostname);
  console.log('IP:', info.ip);
  console.log('User Agent:', info.userAgent);
  console.log('Hostname Detectado:', detectedHostname);
  console.log('Platform:', info.platform);
  console.log('===========================');
  
  console.log('🔧 Configuración Sugerida:');
  console.log('Agregar al AUTHORIZED_DEVICES en config/auth.js:');
  console.log(`'${info.hostname}',`);
  console.log(`'${detectedHostname}',`);
  console.log(`'${info.ip.replace('Obtener con ipconfig o ifconfig', 'TU_IP_AQUI')}',`);
  
  return info;
}

// Ejecutar automáticamente
getDeviceInfo();
