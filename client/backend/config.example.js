// Configuración de base de datos - Copiar a config.js y ajustar según entorno
const config = {
    // Para desarrollo local
    development: {
        user: 'VClientes',
        password: 'Ayamopereichon2026',
        server: '172.18.0.19', // Cambiar a localhost si es necesario
        database: 'VisitaCliente',
        port: 1433, 
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            useUTC: false,
            connectTimeout: 30000,
            requestTimeout: 30000
        }
    },
    
    // Para producción
    production: {
        user: process.env.DB_USER || 'VClientes',
        password: process.env.DB_PASSWORD || 'Ayamopereichon2026',
        server: process.env.DB_SERVER || '172.18.0.19',
        database: process.env.DB_NAME || 'VisitaCliente',
        port: parseInt(process.env.DB_PORT) || 1433,
        options: {
            encrypt: process.env.DB_ENCRYPT === 'true',
            trustServerCertificate: true,
            enableArithAbort: true,
            useUTC: false,
            connectTimeout: 30000,
            requestTimeout: 30000
        }
    }
};

// Usar configuración según entorno
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
