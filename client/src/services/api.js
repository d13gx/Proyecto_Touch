const API_BASE_URL = 'http://localhost:3001/api';

export const consultarPorRUT = async (rut) => {
  try {
    const response = await fetch(`${API_BASE_URL}/visitante/rut/${encodeURIComponent(rut)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en la consulta de RUT:', error);
    throw error;
  }
};
