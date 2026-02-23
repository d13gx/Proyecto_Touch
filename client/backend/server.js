const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db.js');

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
                FORMAT(FechaEncuesta, 'dd/MM/yyyy HH:mm') as FechaEncuesta
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

// Iniciar servidor
app.listen(PORT, async () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    await initializeDB();
});

module.exports = app;
