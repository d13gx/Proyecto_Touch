// Servicio de autenticación para verificar usuario Windows actual

const API_BASE_URL = window.REACT_APP_API_URL || 'http://localhost:3001';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthorized = false;
  }

  // Verificar usuario actual y autorización
  async checkCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/current-user`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.currentUser = data.username;
      this.isAuthorized = data.isAuthorized;
      
      return {
        username: data.username,
        isAuthorized: data.isAuthorized,
        authorizedUsers: data.authorizedUsers,
        isDevelopment: data.isDevelopment,
        message: data.message
      };
      
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      throw error;
    }
  }

  // Obtener usuario actual (sin verificar)
  getCurrentUser() {
    return this.currentUser;
  }

  // Verificar si está autorizado
  isUserAuthorized() {
    return this.isAuthorized;
  }

  // Limpiar sesión
  clearSession() {
    this.currentUser = null;
    this.isAuthorized = false;
  }
}

// Exportar instancia única
const authService = new AuthService();
export default authService;
