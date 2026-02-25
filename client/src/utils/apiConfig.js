// Configuración automática de API según el entorno
import { getServerIp } from './ipDetector.js';
import { logServerInfo } from './serverInfo.js';

export const getApiBaseUrl = async () => {
  // Priorizar variable de entorno completa
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 Usando variable de entorno VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Detectar si es dispositivo móvil o totem
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTotem = !isMobile; // Desktop = totem en este contexto
  console.log('📱 ¿Es dispositivo móvil?', isMobile);
  console.log('🖥️ ¿Es totem (desktop)?', isTotem);
  console.log('🌐 User Agent:', navigator.userAgent);
  
  let apiUrl;
  
  if (isTotem) {
    // El totem usa localhost (servidor local)
    apiUrl = 'http://localhost:3001';
    console.log('🖥️ Totem usando API local:', apiUrl);
    
    // Mostrar información detallada del servidor
    await logServerInfo();
  } else {
    // Dispositivos móviles necesitan IP del totem
    const serverIp = await getServerIp();
    console.log('🖥️ IP del totem detectada:', serverIp);
    apiUrl = `http://${serverIp}:3001`;
    console.log('📱 Móvil usando API del totem:', apiUrl);
  }
  
  console.log('🎯 API_BASE_URL final:', apiUrl);
  return apiUrl;
};

// Variable estática para cachear la URL
let cachedApiUrl = null;

export const API_BASE_URL = cachedApiUrl || (() => {
  // Para uso síncrono inicial
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTotem = !isMobile;
  
  if (isTotem) {
    // El totem siempre usa localhost
    return 'http://localhost:3001';
  } else {
    // Móviles usan IP por defecto (se actualizará con la real)
    const defaultIp = import.meta.env.VITE_SERVER_IP || 'localhost';
    return `http://${defaultIp}:3001`;
  }
})();

// Función para actualizar la URL cuando se detecte la IP real (solo para móviles)
export const updateApiUrl = async () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!cachedApiUrl && isMobile) {
    cachedApiUrl = await getApiBaseUrl();
    console.log('🔄 URL de API actualizada para móvil:', cachedApiUrl);
  }
  return cachedApiUrl || API_BASE_URL;
};

// Función para obtener la IP actual del totem (para generar QR)
export const getTotemIpForQR = async () => {
  const serverIp = await getServerIp();
  return `http://${serverIp}:3001`;
};
