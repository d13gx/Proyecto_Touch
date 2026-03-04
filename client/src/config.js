// Configuración de la aplicación
const API_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
export const API_BASE_URL = `http://${API_HOST}:8000/app_touch`;

// Configuración de Axios (si estás usando axios)
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Importante para mantener las sesiones
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

export default api;
