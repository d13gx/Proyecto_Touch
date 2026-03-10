/*
 * TOKEN MANAGER - SISTEMA DE SEGURIDAD PARA CUESTIONARIO
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * - Genera tokens únicos y seguros para acceso al cuestionario vía QR
 * - Valida tokens contra backend Django para verificar autenticidad
 * - Liga el token al fingerprint del dispositivo (seguridad anti-compartir)
 * - Controla el tiempo de vida de los tokens (expiración configurable)
 * - Previene reutilización de tokens (uso único por dispositivo)
 * - Gestiona almacenamiento local de información de tokens
 * 
 * FLUJO DE TRABAJO:
 * 1. Usuario escanea QR → Sistema genera token único
 * 2. Token se envía a backend para validación y registro
 * 3. El primer dispositivo que valida "reclama" el token con su fingerprint
 * 4. Cualquier otro dispositivo que intente usar el mismo token → DENEGADO
 * 5. Token válido permite acceso al cuestionario
 * 6. Token se marca como usado al comenzar el cuestionario
 * 7. Token expira después del tiempo configurado (5 minutos)
 * 
 * SEGURIDAD:
 * - Tokens UUID únicos
 * - Validación en servidor central
 * - Device fingerprint ligado al token (anti-compartir URL)
 * - Control de expiración automática
 * - Prevención de acceso duplicado
 */

import { getBrowserMetrics } from './browserMetrics.js';

class TokenManager {
  constructor() {
    this.STORAGE_KEY = 'qr_tokens';
    this.TOKEN_EXPIRY_MINUTES = 3; // Tokens expiran en 3 minutos

    // Detectar si estamos en localhost o en red, y configurar backend apropiadamente
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (this.isLocalhost) {
      // Si estamos en localhost, usar backend local
      this.backendUrl = 'http://localhost:8000';
    } else {
      // Si estamos en un dominio externo, intentar backend público
      // Primero intentar con el dominio, luego con IPs conocidas
      this.backendUrl = this.detectBackendUrl();
    }

    console.log('🌐 Configuración TokenManager:', {
      hostname: window.location.hostname,
      backendUrl: this.backendUrl,
      isLocalhost: this.isLocalhost
    });
  }

  // Detectar automáticamente la URL del backend (dominio o IP)
  detectBackendUrl() {
    // Lista de URLs posibles para el backend, en orden de preferencia
    const backendUrls = [
      'http://totem.cmf.cl/app_touch',  // Dominio público con proxy
      'http://totem.cmf.cl:8000',      // Dominio público directo
      'http://172.18.8.94:8000',       // IP known totem
      'http://172.18.7.150:8000',
      'http://172.19.7.96:8000',       // diego
      // Usar el mismo hostname del frontend pero con puerto 8000
      `http://${window.location.hostname}:8000`
    ];

    console.log('🔍 Buscando backend, intentando en orden:', backendUrls);
    
    // Devolver la primera opción que funcione
    return backendUrls[0];
  }

  // Detectar automáticamente la URL del backend del tótem (método antiguo)
  detectTotemBackendUrl() {
    // Lista de IPs conocidas donde podría estar corriendo el backend
    const knownTotemIPs = [
      'http://172.18.8.94:8000', // totem
      'http://172.18.7.150:8000',
      'http://172.19.7.96:8000', // diego
      'http://192.168.1.100:8000',
      'http://192.168.0.100:8000',
      'http://10.0.0.100:8000'
    ];

    // Primero intentar usar el mismo hostname pero con puerto 8000
    const currentHost = window.location.hostname;
    const sameHostBackend = `http://${currentHost}:8000`;
    knownTotemIPs.unshift(sameHostBackend);

    console.log('🔍 Buscando backend del tótem, intentando:', knownTotemIPs);
    
    // Devolver la primera opción (el navegador probará conectividad)
    return knownTotemIPs[0];
  }

  // Generar un token único para el dispositivo
  generateToken() {
    const token = this.createUUID();
    const deviceInfo = this.getDeviceInfo();

    const tokenData = {
      token,
      deviceInfo,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      used: false
    };

    // Guardar token en localStorage
    this.saveToken(tokenData);

    return token;
  }

  // Crear UUID único
  createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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

  // Validar si un token es válido (incluye device fingerprint)
  async validateToken(token) {
    console.log('🔍 Validando token con backend:', token);
    
    // Probar múltiples URLs de backend en orden de preferencia
    const backendUrls = [
      'http://totem.cmf.cl/app_touch',
      'http://totem.cmf.cl:8000',
      'http://172.18.8.94:8000',
      'http://172.18.7.150:8000',
      'http://172.19.7.96:8000',
      `http://${window.location.hostname}:8000`
    ];

    // Obtener fingerprint del dispositivo actual
    const deviceFingerprint = getBrowserMetrics();
    console.log('🔒 Device fingerprint:', deviceFingerprint.substring(0, 8) + '...');

    for (const backendUrl of backendUrls) {
      try {
        console.log('📡 Intentando backend:', backendUrl);
        // Evitar duplicar /app_touch si ya está en la URL base
        const apiPath = backendUrl.includes('/app_touch') ? '/api/qr/validate/' : '/app_touch/api/qr/validate/';
        const fullBackendUrl = `${backendUrl}${apiPath}`;
        console.log('🌐 URL completa:', fullBackendUrl);

        const response = await fetch(fullBackendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, device_fingerprint: deviceFingerprint }),
          // Timeout de 5 segundos por cada intento
          signal: AbortSignal.timeout(5000)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('📝 Resultado validación backend:', result);

          if (result.valid) {
            console.log('✅ Token válido con backend:', backendUrl);
            return {
              valid: true,
              token: result.token_data.token,
              deviceInfo: result.token_data.device_info,
              createdAt: result.token_data.created_at
            };
          } else {
            console.log('❌ Token inválido con backend:', backendUrl, result.reason);
            
            // Debug detallado para acceso denegado
            if (result.debug_info) {
              console.error('🚫 DEBUG ACCESO DENEGADO:', {
                backend: backendUrl,
                token_short: result.debug_info.token_short,
                client_ip: result.debug_info.client_ip,
                stored_fingerprint: result.debug_info.stored_fingerprint_short,
                received_fingerprint: result.debug_info.received_fingerprint_short,
                mismatch_reason: result.debug_info.mismatch_reason,
                timestamp: new Date().toISOString()
              });
            }
            
            return {
              valid: false,
              reason: result.reason || 'Token inválido',
              debug_info: result.debug_info || null
            };
          }
        } else {
          console.log('❌ Error HTTP con backend:', backendUrl, response.status);
        }
      } catch (error) {
        console.log('❌ Error con backend:', backendUrl, error.message);
        // Continuar con el siguiente backend
        continue;
      }
    }

    // Si todos los backends fallaron
    console.error('❌ Todos los backends fallaron para validar token');
    return {
      valid: false,
      reason: 'No se pudo conectar con ningún servidor backend'
    };
  }

  // Marcar token como usado (ahora usa backend)
  async markTokenAsUsed(token) {
    console.log('🔒 Marcando token como usado en backend:', token);

    // Probar múltiples URLs de backend en orden de preferencia
    const backendUrls = [
      'http://totem.cmf.cl/app_touch',
      'http://totem.cmf.cl:8000',
      'http://172.18.8.94:8000',
      'http://172.18.7.150:8000',
      'http://172.19.7.96:8000',
      `http://${window.location.hostname}:8000`
    ];

    for (const backendUrl of backendUrls) {
      try {
        console.log('📡 Intentando marcar token usado con backend:', backendUrl);
        // Evitar duplicar /app_touch si ya está en la URL base
        const apiPath = backendUrl.includes('/app_touch') ? '/api/qr/mark-used/' : '/app_touch/api/qr/mark-used/';
        const response = await fetch(`${backendUrl}${apiPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log('✅ Token marcado como usado en backend:', backendUrl);
            return true;
          }
        }
      } catch (error) {
        console.log('❌ Error con backend:', backendUrl, error.message);
        continue;
      }
    }

    console.error('❌ Todos los backends fallaron para marcar token');
    return false;
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
    const commonIPs = [
      '192.168.1.100', '192.168.0.100', '192.168.1.50',
      '10.0.0.100', '172.19.7.96'
    ];

    // Intentar con la IP actual primero
    const currentPort = window.location.port || '5173';
    for (const ip of commonIPs) {
      try {
        const testUrl = `http://${ip}:${currentPort}`;
        return testUrl;
      } catch (e) {
        // Continuar intentando
      }
    }

    // Último fallback: usar origin actual
    return window.location.origin;
  }

  // Obtener URL con token (crea token en backend con fingerprint)
  async getTokenizedUrl(baseUrl) {
    console.log('🆕 Creando token QR en backend...');

    // Si no se proporciona baseUrl, usar la detectada automáticamente
    if (!baseUrl) {
      baseUrl = this.getBaseUrlForToken();
    }

    // Obtener fingerprint del dispositivo actual
    const deviceFingerprint = getBrowserMetrics();

    // Probar múltiples URLs de backend en orden de preferencia
    const backendUrls = [
      'http://totem.cmf.cl/app_touch',
      'http://totem.cmf.cl:8000',
      'http://172.18.8.94:8000',
      'http://172.18.7.150:8000',
      'http://172.19.7.96:8000',
      `http://${window.location.hostname}:8000`
    ];

    for (const backendUrl of backendUrls) {
      try {
        console.log('📡 Intentando crear token con backend:', backendUrl);
        // Evitar duplicar /app_touch si ya está en la URL base
        const apiPath = backendUrl.includes('/app_touch') ? '/api/qr/create/' : '/app_touch/api/qr/create/';
        const response = await fetch(`${backendUrl}${apiPath}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base_url: baseUrl,
            device_info: this.getDeviceInfo(),
            device_fingerprint: deviceFingerprint
          }),
          signal: AbortSignal.timeout(5000)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (response.ok) {
          const result = await response.json();
          console.log('📝 Resultado creación token:', result);

          if (result.token) {
            console.log('✅ Token QR creado en backend:', backendUrl, result.token);
            if (result.qr_url) {
              return result.qr_url;
            }
            return `${baseUrl}?token=${encodeURIComponent(result.token)}`;
          }
        }
      } catch (error) {
        console.log('❌ Error con backend:', backendUrl, error.message);
        continue;
      }
    }

    // Si todos los backends fallaron, usar fallback local
    console.error('❌ Todos los backends fallaron, usando fallback local');
    const token = this.createUUID();
    return `${baseUrl}?token=${encodeURIComponent(token)}`;
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
