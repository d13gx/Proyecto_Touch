const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db.js');
const os = require('os');
const { isUserAuthorized, getConfig, isDeviceAuthorized } = require('./config/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
let pool;
async function initializeDB() {
    try {
        pool = await connectDB();
        console.log('Base de datos conectada');
        
        // Optimización: Crear índice para la búsqueda de RUT si no existe
        // Esto evita que la base de datos haga un escaneo completo de la tabla
        // y permite que "deje de buscar" inmediatamente si el RUT no existe.
        try {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Visitantes_RUT_Fecha' AND object_id = OBJECT_ID('Visitantes'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Visitantes_RUT_Fecha 
                    ON Visitantes(RUT, FechaEncuesta DESC) 
                    INCLUDE (Nombre);
                END
            `);
            console.log('Índice de optimización para RUT verificado/creado');
        } catch (idxError) {
            console.error('Aviso: No se pudo verificar o crear el índice de RUT (esto puede ser normal por falta de permisos):', idxError.message);
        }
    } catch (error) {
        console.error('Error al conectar la base de datos:', error);
        console.log('Servidor iniciado sin conexión a base de datos. Se reintentará en cada petición.');
        pool = null;
    }
}

// Función para verificar conexión antes de usarla
function checkDBConnection() {
    if (!pool) {
        console.log('Intentando reconectar a la base de datos...');
        return initializeDB();
    }
    return Promise.resolve();
}

// Endpoint para guardar datos del visitante
app.post('/api/visitante', async (req, res) => {
    try {
        await checkDBConnection();
        const { personalData } = req.body;

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        // Insertar NUEVO registro de visitante (cada encuesta completada es una nueva visita)
        const query = `
            INSERT INTO Visitantes (Nombre, RUT, Telefono, Email, Empresa, FechaEncuesta)
            VALUES (@nombre, @rut, @telefono, @email, @empresa, SYSDATETIME())
            SELECT SCOPE_IDENTITY() as IDEncuesta;
        `;

        const request = pool.request();
        request.input('nombre', personalData.nombre);
        request.input('rut', personalData.rut.replace(/\./g, '')); // Limpiar RUT: quitar solo puntos, mantener guión
        request.input('telefono', personalData.telefono.startsWith('+56') ? personalData.telefono : `+56${personalData.telefono}`); // Agregar +56 si no tiene
        request.input('email', personalData.email);
        request.input('empresa', personalData.empresa);

        const result = await request.query(query);
        const visitanteId = result.recordset[0].IDEncuesta;

        res.status(201).json({
            success: true,
            message: 'Visita del visitante registrada exitosamente',
            visitanteId
        });

    } catch (error) {
        console.error('Error al guardar visitante:', error);
        res.status(500).json({
            error: 'Error al registrar la visita del visitante',
            details: error.message
        });
    }
});

// Endpoint para obtener todos los visitantes
app.get('/api/visitantes', async (req, res) => {
    try {
        await checkDBConnection();

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        const query = `
            SELECT 
                IDEncuesta,
                Nombre,
                RUT,
                Telefono,
                Email,
                Empresa,
                FORMAT(FechaEncuesta, 'dd/MM/yyyy') as FechaEncuesta,
                HoraEncuesta
            FROM Visitantes
            ORDER BY FechaEncuesta DESC;
        `;

        const result = await pool.request().query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener visitantes:', error);
        res.status(500).json({
            error: 'Error al obtener los visitantes',
            details: error.message
        });
    }
});

// Endpoint para eliminar un visitante específico
app.delete('/api/visitantes/:id', async (req, res) => {
    try {
        await checkDBConnection();

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        const { id } = req.params;

        const query = `
            DELETE FROM Visitantes 
            WHERE IDEncuesta = @id;
        `;

        const request = pool.request();
        request.input('id', id);

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Visitante no encontrado' });
        }

        res.json({
            success: true,
            message: 'Visitante eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar visitante:', error);
        res.status(500).json({
            error: 'Error al eliminar el visitante',
            details: error.message
        });
    }
});

// Endpoint para limpiar todos los visitantes
app.delete('/api/visitantes', async (req, res) => {
    try {
        await checkDBConnection();

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        const query = `DELETE FROM Visitantes;`;

        const result = await pool.request().query(query);

        res.json({
            success: true,
            message: `Todos los visitantes han sido eliminados (${result.rowsAffected[0]} registros)`
        });

    } catch (error) {
        console.error('Error al limpiar todos los visitantes:', error);
        res.status(500).json({
            error: 'Error al eliminar todos los visitantes',
            details: error.message
        });
    }
});

// Endpoint para consultar nombre por RUT
app.get('/api/visitante/rut/:rut', async (req, res) => {
    try {
        await checkDBConnection();

        if (!pool) {
            return res.status(500).json({ error: 'No hay conexión a la base de datos' });
        }

        const { rut } = req.params;

        const query = `
            SELECT TOP 1 Nombre
            FROM Visitantes
            WHERE RUT = @rut
            ORDER BY FechaEncuesta DESC;
        `;

        const request = pool.request();
        request.input('rut', rut.replace(/\./g, '')); // Limpiar RUT: quitar solo puntos

        const result = await request.query(query);

        if (result.recordset.length === 0) {
            return res.json({
                success: false,
                message: 'RUT no encontrado'
            });
        }

        res.json({
            success: true,
            nombre: result.recordset[0].Nombre
        });

    } catch (error) {
        console.error('Error al consultar RUT:', error);
        res.status(500).json({
            error: 'Error al consultar RUT',
            details: error.message
        });
    }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: pool ? 'connected' : 'disconnected'
    });
});

// Endpoint para detección automática de dispositivos
app.post('/api/auth/detect-device', (req, res) => {
    try {
        const clientInfo = {
            ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
            hostname: req.headers['host'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
            referer: req.headers.referer || 'unknown'
        };

        console.log('🔍 Detectando dispositivo:', clientInfo);

        // Extraer hostname del userAgent si es posible
        let detectedHostname = 'unknown';
        if (clientInfo.userAgent) {
            const windowsMatch = clientInfo.userAgent.match(/Windows NT.*?([A-Z0-9-]+)/);
            if (windowsMatch) {
                detectedHostname = windowsMatch[1];
            }
        }

        const deviceInfo = {
            ...clientInfo,
            detectedHostname,
            timestamp: new Date().toISOString()
        };

        // Verificar si el dispositivo está autorizado
        const authorized = isDeviceAuthorized(deviceInfo);

        res.json({
            success: true,
            authorized,
            deviceInfo,
            message: authorized ? 'Dispositivo autorizado' : 'Dispositivo no reconocido',
            requiresLogin: !authorized
        });

    } catch (error) {
        console.error('Error detectando dispositivo:', error);
        res.status(500).json({
            success: false,
            error: 'Error detectando dispositivo',
            details: error.message
        });
    }
});

// Endpoint para login LDAP (comunicación con Django)
app.post('/api/auth/ldap-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Usuario y contraseña son requeridos'
            });
        }

        // Comunicarse con el backend Django para autenticación LDAP
        const djangoResponse = await fetch('http://localhost:8000/app_touch/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        if (!djangoResponse.ok) {
            const errorData = await djangoResponse.json().catch(() => ({}));
            return res.status(djangoResponse.status).json({
                success: false,
                error: errorData.error || 'Error de autenticación LDAP'
            });
        }

        const ldapResult = await djangoResponse.json();

        if (ldapResult.mensaje === 'Login exitoso') {
            // Verificar si el usuario está en AUTHORIZED_USERS
            const isUserInAuthorizedList = isUserAuthorized(ldapResult.usuario);

            if (!isUserInAuthorizedList) {
                return res.status(403).json({
                    success: false,
                    error: 'Usuario autenticado pero no autorizado para acceder a esta función',
                    requiresAuthorization: true,
                    isAuthorized: false
                });
            }

            res.json({
                success: true,
                username: ldapResult.usuario,
                fullName: ldapResult.usuario, // Django no devuelve displayName, usamos username
                email: ldapResult.email,
                isAuthorized: true,
                message: 'Autenticación LDAP exitosa y usuario autorizado',
                loginMethod: 'ldap'
            });
        } else {
            res.status(401).json({
                success: false,
                error: ldapResult.error || 'Credenciales LDAP incorrectas',
                isAuthorized: false
            });
        }

    } catch (error) {
        console.error('Error en login LDAP:', error);
        res.status(500).json({
            success: false,
            error: 'Error de conexión con servidor LDAP',
            details: error.message
        });
    }
});

// Endpoint para login con credenciales (para acceso remoto)
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;

        // Credenciales predefinidas para usuarios autorizados
        const credentials = {
            'jmadrid': 'cmf123',
            'umartinez': 'cmf456',
        };

        // Validar credenciales
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Usuario y contraseña son requeridos'
            });
        }

        if (credentials[username] && credentials[username] === password) {
            // Verificar si el usuario está en AUTHORIZED_USERS
            const isUserInAuthorizedList = isUserAuthorized(username);

            if (!isUserInAuthorizedList) {
                return res.status(403).json({
                    success: false,
                    error: 'Usuario autenticado pero no autorizado para acceder a esta función',
                    requiresAuthorization: true,
                    isAuthorized: false
                });
            }

            res.json({
                success: true,
                username: username,
                isAuthorized: true,
                message: 'Login exitoso y usuario autorizado',
                loginMethod: 'credentials'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas',
                isAuthorized: false
            });
        }

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor',
            details: error.message
        });
    }
});

// Endpoint para obtener usuario Windows actual y verificar acceso
app.get('/api/auth/current-user', (req, res) => {
    try {
        // Obtener el nombre de usuario del sistema operativo
        const userInfo = os.userInfo();
        const username = userInfo.username;

        // Logging para depuración
        console.log('🔍 Depuración de usuario:');
        console.log('  - os.userInfo():', userInfo);
        console.log('  - username:', username);
        console.log('  - process.env.USERNAME:', process.env.USERNAME);
        console.log('  - process.env.USER:', process.env.USER);

        // Intentar diferentes formas de obtener el usuario
        const alternativeUser = process.env.USERNAME || process.env.USER || username;

        console.log('  - Usuario final a usar:', alternativeUser);

        // Obtener configuración y verificar autorización
        const config = getConfig();
        const hasAccess = isUserAuthorized(alternativeUser);

        res.json({
            username: alternativeUser,  // Usar el usuario alternativo detectado
            isAuthorized: hasAccess,
            authorizedUsers: config.authorizedUsers,
            isDevelopment: config.isDevelopment,
            showDebugInfo: config.showDebugInfo,
            message: hasAccess ? 'Acceso concedido' : 'Acceso denegado'
        });

    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        res.status(500).json({
            error: 'Error al verificar usuario',
            details: error.message
        });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Servidor corriendo en puerto ${PORT} (accesible desde cualquier IP)`);
    await initializeDB();
});

module.exports = app;
