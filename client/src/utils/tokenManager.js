// Gestor de tokens únicos para acceso al cuestionario
class TokenManager {
  constructor() {
    this.STORAGE_KEY = 'qr_tokens';
    this.TOKEN_EXPIRY_MINUTES = 2; // Tokens expiran en 2 minutos
    
    // Detectar si estamos en localhost o en red
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.backendUrl = this.isLocalhost 
      ? 'http://localhost:8000' 
      : `http://${window.location.hostname}:8000`;
    
    console.log('🌐 Configuración TokenManager:', {
      isLocalhost: this.isLocalhost,
      hostname: window.location.hostname,
      backendUrl: this.backendUrl
    });
  }

  // Generar un token único para el dispositivo
  generateToken() {
    const token = this.createUUID();
    const deviceInfo = this.getDeviceInfo();
    
    const tokenData = {
      token,
      deviceInfo,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString(), //  60 * 60 * 1000 (En caso de querer horas en lugar de minutos)
      used: false
    };

    // Guardar token en localStorage
    this.saveToken(tokenData);
    
    return token;
  }

  // Crear UUID único
  createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Obtener información del dispositivo
  getDeviceInfo() {
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    return {
      userAgent: ua.substring(0, 100), // Limitar longitud
      isMobile,
      timestamp: Date.now(),
      screenResolution: `${screen.width}x${screen.height}`,
      platform: navigator.platform || 'Unknown'
    };
  }

  // Guardar token en localStorage
  saveToken(tokenData) {
    const tokens = this.getAllTokens();
    tokens.push(tokenData);
    
    // Limitar a 10 tokens por dispositivo
    if (tokens.length > 10) {
      tokens.shift(); // Eliminar el más antiguo
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
  }

  // Obtener todos los tokens
  getAllTokens() {
    try {
      const tokens = localStorage.getItem(this.STORAGE_KEY);
      return tokens ? JSON.parse(tokens) : [];
    } catch (error) {
      console.error('Error al obtener tokens:', error);
      return [];
    }
  }

  // Validar si un token es válido (ahora usa backend)
  async validateToken(token) {
    console.log('🔍 Validando token con backend:', token);
    const backendUrl = `${this.backendUrl}/app_touch/api/qr/validate/`;
    console.log('🌐 URL completa:', backendUrl);
    
    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      const result = await response.json();
      console.log('📝 Resultado validación backend:', result);
      
      if (response.ok && result.valid) {
        return {
          valid: true,
          token: result.token_data.token,
          deviceInfo: result.token_data.device_info,
          createdAt: result.token_data.created_at
        };
      } else {
        return {
          valid: false,
          reason: result.reason || 'Error en validación'
        };
      }
    } catch (error) {
      console.error('❌ Error validando token con backend:', error);
      console.error('❌ Error completo:', error.message);
      return {
        valid: false,
        reason: 'Error de conexión con servidor: ' + error.message
      };
    }
  }

  // Marcar token como usado (ahora usa backend)
  async markTokenAsUsed(token) {
    console.log('🔒 Marcando token como usado en backend:', token);
    
    try {
      const response = await fetch(`${this.backendUrl}/app_touch/api/qr/mark-used/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Token marcado como usado en backend:', result);
        return true;
      } else {
        console.error('❌ Error marcando token como usado:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error de conexión marcando token:', error);
      return false;
    }
  }

  // Limpiar tokens expirados
  cleanExpiredTokens() {
    const tokens = this.getAllTokens();
    const now = new Date();
    
    const validTokens = tokens.filter(token => {
      const expiresAt = new Date(token.expiresAt);
      return expiresAt > now;
    });
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validTokens));
  }

  // Obtener URL base correcta para tokens (detecta IP local automáticamente)
  getBaseUrlForToken() {
    const hostname = window.location.hostname;
    
    // Si ya es una IP o dominio público, usar el origin actual
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return window.location.origin;
    }
    
    // En producción, usar variable de entorno si está disponible
    if (import.meta.env.VITE_TOTEM_URL) {
      return import.meta.env.VITE_TOTEM_URL;
    }
    
    // Si estamos en localhost, intentar detectar la IP local automáticamente
    // Usar la misma lógica que VideoSeguridad para consistencia
    const commonPorts = ['5173', '3000', '8080'];
    const commonIPs = [
      '192.168.1.100', '192.168.0.100', '192.168.1.50',
      '10.0.0.100', '172.19.7.96'
    ];
    
    // Intentar con la IP actual primero
    const currentPort = window.location.port || '5173';
    for (const ip of commonIPs) {
      try {
        const testUrl = `http://${ip}:${currentPort}`;
        // Simplemente retornar la primera IP común como fallback
        // En producción, esto debería ser configurado por variables de entorno
        return testUrl;
      } catch (e) {
        // Continuar intentando
      }
    }
    
    // Último fallback: usar origin actual
    return window.location.origin;
  }

  // Obtener URL con token (ahora crea token en backend)
  async getTokenizedUrl(baseUrl) {
    console.log('🆕 Creando token QR en backend...');
    
    // Si no se proporciona baseUrl, usar la detectada automáticamente
    if (!baseUrl) {
      baseUrl = this.getBaseUrlForToken();
    }
    
    try {
      const response = await fetch(`${this.backendUrl}/app_touch/api/qr/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          base_url: baseUrl,
          device_info: this.getDeviceInfo()
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.token) {
        console.log('✅ Token QR creado en backend:', result.token);
        if (result.qr_url) {
          return result.qr_url;
        }
        return `${baseUrl}?token=${encodeURIComponent(result.token)}`;
      } else {
        console.error('❌ Error creando token QR:', result.error);
        // Fallback: crear token local si el backend falla
        const token = this.createUUID();
        return `${baseUrl}?token=${encodeURIComponent(token)}`;
      }
    } catch (error) {
      console.error('❌ Error de conexión creando token QR:', error);
      // Fallback: crear token local si no hay conexión
      const token = this.createUUID();
      return `${baseUrl}?token=${encodeURIComponent(token)}`;
    }
  }

  // Generar y guardar token cuando el dispositivo accede
  generateAndSaveToken(token) {
    const tokenData = {
      token,
      deviceInfo: this.getDeviceInfo(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      used: false
    };
    
    // Guardar token en el dispositivo que accede
    this.saveToken(tokenData);
    
    return tokenData;
  }

  // Extraer token de URL
  extractTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }
}

export default new TokenManager();
