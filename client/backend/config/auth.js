// Configuración de usuarios autorizados para el Panel Administrativo

// Usuarios autorizados para acceder al panel administrativo
const AUTHORIZED_USERS = [
  'jmadrid',  // Usuario principal autorizado
  // Agregar aquí otros usuarios autorizados
  'umartinez',
  'dreyes',
  // 'otro_usuario',
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

module.exports = {
  getConfig,
  isUserAuthorized,
  AUTHORIZED_USERS,
  DEVELOPMENT_CONFIG,
  PRODUCTION_CONFIG,
};
