// Configuración de API para desarrollo y producción
const API_CONFIG = {
  // Para desarrollo local
  development: {
    baseURL: 'http://localhost:3001'
  },
  // Para producción (cuando se accede desde otra PC)
  production: {
    baseURL: 'http://172.19.7.96:3001' // Reemplaza con tu IP real
  }
};

// Detectar automáticamente si estamos en producción o desarrollo
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const config = isProduction ? API_CONFIG.production : API_CONFIG.development;

export const API_BASE_URL = config.baseURL;

// Para facilitar el cambio de IP manualmente si es necesario
export function setAPIBaseURL(url) {
  API_CONFIG.production.baseURL = url;
  console.log('API URL actualizada a:', url);
}
