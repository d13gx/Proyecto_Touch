// Servicio de autenticación para verificar usuario Windows actual

// Detectar automáticamente la URL del backend según el entorno
const getBackendUrl = () => {
  const hostname = window.location.hostname;
  
  // Si estamos en localhost o 127.0.0.1, usar backend local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // Si estamos en la red del totem, usar la IP del totem
  if (hostname.includes('totem.cmf.cl')) {
    return 'http://totem.cmf.cl:3001';
  }
  
  // Para otros casos, intentar con el mismo hostname
  return `http://${hostname}:3001`;
};

const API_BASE_URL = getBackendUrl();

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

  // Detectar automáticamente dispositivo autorizado
  async detectDevice() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/detect-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.authorized) {
        // Si el dispositivo está autorizado, guardar sesión automática
        this.currentUser = data.deviceInfo.detectedHostname || data.deviceInfo.ip;
        this.isAuthorized = true;
        
        localStorage.setItem('auth_session', JSON.stringify({
          username: this.currentUser,
          isAuthorized: true,
          loginMethod: 'device_auto',
          timestamp: Date.now(),
          deviceInfo: data.deviceInfo
        }));
        
        return {
          success: true,
          authorized: true,
          username: this.currentUser,
          method: 'device_auto',
          deviceInfo: data.deviceInfo
        };
      }
      
      return data;
      
    } catch (error) {
      console.error('Error detectando dispositivo:', error);
      return { success: false, error: error.message };
    }
  }

  // Login LDAP (autenticación con Active Directory)
  async loginLDAP(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/ldap-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.currentUser = data.username;
        this.isAuthorized = data.isAuthorized;
        
        // Guardar sesión en localStorage con información LDAP
        localStorage.setItem('auth_session', JSON.stringify({
          username: data.username,
          fullName: data.fullName,
          email: data.email,
          isAuthorized: data.isAuthorized,
          loginMethod: 'ldap',
          timestamp: Date.now()
        }));
      }
      
      return data;
      
    } catch (error) {
      console.error('Error en login LDAP:', error);
      throw error;
    }
  }

  // Login con credenciales (para acceso remoto)
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.currentUser = data.username;
        this.isAuthorized = data.isAuthorized;
        
        // Guardar sesión en localStorage
        localStorage.setItem('auth_session', JSON.stringify({
          username: data.username,
          isAuthorized: data.isAuthorized,
          loginMethod: 'credentials',
          timestamp: Date.now()
        }));
      }
      
      return data;
      
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Verificar si hay sesión guardada
  checkSavedSession() {
    try {
      const savedSession = localStorage.getItem('auth_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        
        // Verificar si la sesión es válida (24 horas)
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (sessionAge < maxAge && session.isAuthorized) {
          this.currentUser = session.username;
          this.isAuthorized = session.isAuthorized;
          return session;
        } else {
          // Sesión expirada, limpiar
          this.clearSession();
          localStorage.removeItem('auth_session');
        }
      }
    } catch (error) {
      console.error('Error verificando sesión guardada:', error);
      this.clearSession();
      localStorage.removeItem('auth_session');
    }
    return null;
  }

  // Cerrar sesión
  logout() {
    this.clearSession();
    localStorage.removeItem('auth_session');
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
