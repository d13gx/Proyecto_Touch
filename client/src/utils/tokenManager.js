// Gestor de tokens únicos para acceso al cuestionario
class TokenManager {
  constructor() {
    this.STORAGE_KEY = 'qr_tokens';
    this.TOKEN_EXPIRY_MINUTES = 5; // Tokens expiran en 5 minutos
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

  // Validar si un token es válido
  validateToken(token) {
    console.log('🔍 Validando token:', token);
    
    const tokens = this.getAllTokens();
    console.log('📝 Tokens existentes:', tokens);
    
    const tokenData = tokens.find(t => t.token === token && !t.used);
    console.log('🎯 Token encontrado:', tokenData);
    
    if (!tokenData) {
      console.log('❌ Token no encontrado o ya usado');
      return { valid: false, reason: 'Token no encontrado o ya usado' };
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    
    console.log('⏰ Fechas:', { now: now.toISOString(), expires: expiresAt.toISOString() });
    
    if (now > expiresAt) {
      console.log('⏰ Token expirado');
      return { valid: false, reason: 'Token expirado' };
    }

    // NO marcar como usado aquí - solo validar
    // El marcado como usado debe hacerse explícitamente cuando se accede al cuestionario
    
    console.log('✅ Token válido, devolviendo:', token);
    
    return { 
      valid: true, 
      deviceInfo: tokenData.deviceInfo,
      createdAt: tokenData.createdAt,
      token: token // Devolver el token para poder marcarlo después
    };
  }

  // Marcar token como usado
  markTokenAsUsed(token) {
    console.log('🔒 Marcando token como usado:', token);
    
    const tokens = this.getAllTokens();
    const tokenIndex = tokens.findIndex(t => t.token === token);
    
    console.log('📝 Índice del token:', tokenIndex);
    
    if (tokenIndex !== -1) {
      console.log('📝 Antes de marcar:', tokens[tokenIndex]);
      tokens[tokenIndex].used = true;
      tokens[tokenIndex].usedAt = new Date().toISOString();
      console.log('📝 Después de marcar:', tokens[tokenIndex]);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tokens));
      console.log('✅ Token marcado como usado exitosamente');
    } else {
      console.log('❌ No se encontró el token para marcar como usado');
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

  // Obtener URL con token
  getTokenizedUrl(baseUrl) {
    // Generar token único para esta URL
    const token = this.createUUID();
    return `${baseUrl}?token=${token}`;
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
