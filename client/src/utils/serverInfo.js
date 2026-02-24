// Utilidades para obtener información del servidor local
import { getServerIp } from './ipDetector.js';

export const getServerInfo = async () => {
  try {
    // Obtener IP local
    const localIp = await getServerIp();
    
    // Obtener información de red
    const networkInterfaces = await getNetworkInterfaces();
    
    // Obtener hostname
    const hostname = window.location.hostname;
    
    return {
      localIp,
      hostname,
      port: window.location.port || '3000',
      fullUrl: `http://${localIp}:3001`, // URL para QR
      networkInterfaces,
      isTotem: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  } catch (error) {
    console.error('❌ Error obteniendo información del servidor:', error);
    return null;
  }
};

// Obtener interfaces de red (si está disponible)
const getNetworkInterfaces = async () => {
  try {
    // En navegador, no podemos acceder directamente a interfaces de red
    // Pero podemos obtener información de conexión
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error obteniendo interfaces de red:', error);
    return null;
  }
};

// Mostrar información del servidor en consola
export const logServerInfo = async () => {
  const info = await getServerInfo();
  
  if (info) {
    console.group('🖥️ INFORMACIÓN DEL SERVIDOR (TOTEM)');
    console.log('🌐 IP Local:', info.localIp);
    console.log('🏷️ Hostname:', info.hostname);
    console.log('🔌 Puerto:', info.port);
    console.log('📱 ¿Es Totem?:', info.isTotem);
    console.log('🔗 URL para QR:', info.fullUrl);
    console.log('📶 Info de red:', info.networkInterfaces);
    console.groupEnd();
    
    return info;
  }
  
  return null;
};
