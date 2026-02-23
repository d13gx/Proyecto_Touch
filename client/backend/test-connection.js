const sql = require('mssql');

// Configuración sin encriptación para prueba
const config = {
    user: 'VClientes',
    password: 'Ayamopereichon2026',
    server: '172.18.0.19',
    database: 'VisitaCliente',
    port: 1433,
    options: {
        encrypt: false,          // Desactivar encriptación o no funciona
        trustServerCertificate: false,
        enableArithAbort: true,
        useUTC: false,
        connectTimeout: 30000,
        requestTimeout: 30000
    }
};

async function testConnection() {
    try {
        console.log('=== PRUEBA DE CONEXIÓN SIN ENCRIPTACIÓN ===');
        console.log('Servidor:', config.server);
        console.log('Base de datos:', config.database);
        console.log('Usuario:', config.user);
        console.log('Encriptación:', config.options.encrypt);
        
        const pool = await sql.connect(config);
        console.log('✅ CONEXIÓN EXITOSA');
        
        // Probar consulta simple
        const result = await pool.request().query('SELECT @@VERSION');
        console.log('Versión SQL Server:', result.recordset[0]['']);
        
        await pool.close();
        return true;
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:');
        console.error('Código:', error.code);
        console.error('Mensaje:', error.message);
        return false;
    }
}

// Ejecutar prueba
testConnection().then(success => {
    if (success) {
        console.log('La conexión funciona. Cambia la configuración principal.');
    } else {
        console.log('La conexión falla. Revisa la configuración de SQL Server.');
    }
    process.exit(0);
});
