// Configuración de usuarios autorizados para el Panel Administrativo

// ⚠️ IMPORTANTE: Solo estos usuarios pueden acceder a /ListaVisita
// Tanto para autenticación local (Windows) como remota (LDAP/Credenciales)
const AUTHORIZED_USERS = [
  'jmadrid',  // Usuario principal autorizado
  'umartinez', // Usuario secundario autorizado
  'dreyes',
  'rtorres'
  // Agregar aquí otros usuarios autorizados para /ListaVisita
  // 'otro_usuario',
];

// Dispositivos autorizados para acceso automático (IP/hostname)
const AUTHORIZED_DEVICES = [
  'totem.cmf.cl',
  // Agregar aquí IPs o hostnames de dispositivos autorizados
  'DESKTOP-JMADRID', // Ejemplo: hostname de PC específica
];

// Configuración de desarrollo
const DEVELOPMENT_CONFIG = {
  // En desarrollo, permitir acceso al usuario de prueba
  allowTestUser: true,
  
  // Mostrar información adicional de depuración
  showDebugInfo: true,
};

// Configuración de producción
const PRODUCTION_CONFIG = {
  // En producción, no permitir usuarios de prueba
  allowTestUser: false,
  
  // No mostrar información de depuración
  showDebugInfo: false,
};

// Obtener configuración según entorno
const getConfig = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return {
    authorizedUsers: AUTHORIZED_USERS,
    isDevelopment,
    ... (isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG),
  };
};

// Verificar si un usuario está autorizado
const isUserAuthorized = (username) => {
  const config = getConfig();
  
  // Verificar si está en la lista de autorizados
  if (config.authorizedUsers.includes(username)) {
    return true;
  }
  
  // En desarrollo, permitir al usuario de prueba
  if (config.isDevelopment && config.allowTestUser && username === config.testUser) {
    return true;
  }
  
  return false;
};

// Verificar si un dispositivo está autorizado (acceso automático)
const isDeviceAuthorized = (clientInfo) => {
  const { ip, hostname, userAgent } = clientInfo;
  
  // Verificar IP o hostname
  if (AUTHORIZED_DEVICES.includes(ip) || AUTHORIZED_DEVICES.includes(hostname)) {
    return true;
  }
  
  // Verificar si contiene patrones conocidos
  const devicePatterns = [
    'DESKTOP-JMADRID',
    'NOTEBOOK-UMARTINEZ',
    // Agregar más patrones según sea necesario
  ];
  
  return devicePatterns.some(pattern => 
    hostname.includes(pattern) || userAgent.includes(pattern)
  );
};

module.exports = {
  getConfig,
  isUserAuthorized,
  isDeviceAuthorized,
  AUTHORIZED_USERS,
  AUTHORIZED_DEVICES,
  DEVELOPMENT_CONFIG,
  PRODUCTION_CONFIG,
};
