/**
 * API CONFIGURATION - SOURCE OF TRUTH
 * 
 * Este archivo centraliza todas las URLs de los backends y la lógica de detección de red.
 * Resuelve problemas de CORS y conectividad en la red corporativa.
 

const getNetworkConfig = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // IPs y Dominios conocidos
    const TOTEM_IP = '172.18.8.94';
    const DIEGO_IP = '172.19.7.96';
    const TOTEM_DOMAIN = 'totem.cmf.cl';

    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const isTotemDomain = hostname === TOTEM_DOMAIN;

    // Lógica de detección: 
    // Si entramos por el dominio totem.cmf.cl, el backend de Node (3001) y Django (8000)
    // deben ser contactados por IP directamente para saltarse restricciones de puerto del proxy/firewall
    // en los celulares.

    let targetIp = hostname;
    if (isTotemDomain) {
        targetIp = TOTEM_IP;
    } else if (isLocal) {
        targetIp = 'localhost';
    }

    return {
        hostname,
        targetIp,
        isLocal,
        isTotemDomain,
        protocol
    };
};

const config = getNetworkConfig();

// 1. Backend NODE.JS (Puerto 3001) - Gestión de Visitantes y Auth Windows
export const NODE_API_URL = `http://${config.targetIp}:3001`;

// 2. Backend DJANGO (Puerto 8000) - App principal, Cuestionarios y Gestión de QR
// Se mantiene el prefijo /app_touch que es como está configurado en Django
export const DJANGO_API_URL = `http://${config.targetIp}:8000/app_touch`;

// 3. URL Base para el Frontend (Generación de QRs)
// Si es totem.cmf.cl, los QRs deben generarse con ese dominio
export const FRONTEND_URL = window.location.origin;

// Exportación por defecto para compatibilidad
export default {
    NODE: NODE_API_URL,
    DJANGO: DJANGO_API_URL,
    FRONTEND: FRONTEND_URL,
    isLocal: config.isLocal
};

console.log('🌐 API Configuration Loaded:', {
    origin: window.location.origin,
    node: NODE_API_URL,
    django: DJANGO_API_URL,
    isLocal: config.isLocal
});
*/