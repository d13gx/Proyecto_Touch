import { API_BASE_URL } from '../config/api.js';

class ApiService {
  // Obtener todos los visitantes desde la base de datos
  async getVisitantes() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visitantes`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener visitantes:', error);
      throw error;
    }
  }

  // Eliminar un visitante por ID
  async deleteVisitante(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visitantes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al eliminar visitante:', error);
      throw error;
    }
  }

  // Limpiar todos los visitantes
  async clearAllVisitantes() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/visitantes`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al limpiar todos los visitantes:', error);
      throw error;
    }
  }

  // Verificar salud del servidor
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar salud del servidor:', error);
      throw error;
    }
  }
}

export default new ApiService();
