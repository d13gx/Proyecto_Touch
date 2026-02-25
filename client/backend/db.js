const sql = require('mssql');
const config = require('./config.js');

async function connectDB() {
    try {
        console.log('Intentando conectar a SQL Server...');
        console.log('Servidor:', config.server);
        console.log('Base de datos:', config.database);
        console.log('Usuario:', config.user);
        
        const pool = await sql.connect(config);
        console.log('Conectado a SQL Server exitosamente');
        return pool;
    } catch (error) {
        console.error('Error conexión:', error);
        console.error('Código de error:', error.code);
        console.error('Mensaje:', error.message);
        throw error;
    }
}

module.exports = { connectDB, sql };
