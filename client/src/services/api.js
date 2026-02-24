import { API_BASE_URL, updateApiUrl } from '../utils/apiConfig.js';

export const consultarPorRUT = async (rut) => {
  try {
    // Asegurarse de tener la URL actualizada con IP real
    const currentApiUrl = await updateApiUrl();
    
    console.log('🔍 Consultando RUT en base de datos:', rut, 'en:', currentApiUrl);
    const response = await fetch(`${currentApiUrl}/api/visitante/rut/${encodeURIComponent(rut)}`);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status} en: ${currentApiUrl}/api/visitante/rut/${rut}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Respuesta base de datos:', data);
    return data;
  } catch (error) {
    console.error(`❌ Error en la consulta de RUT`, error);
    throw error;
  }
};
