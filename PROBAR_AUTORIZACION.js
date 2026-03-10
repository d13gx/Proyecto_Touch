// Script para probar el sistema de autorización
// Ejecutar en la consola del navegador después de limpiar sesiones

console.log('🧪 PRUEBA DEL SISTEMA DE AUTORIZACIÓN');
console.log('=====================================');

// 1. Probar login con usuario NO autorizado (dreyes)
async function testUnauthorizedUser() {
    console.log('🚫 Probando con usuario NO autorizado (dreyes)...');
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: 'dreyes', password: 'test123' })
        });
        
        const result = await response.json();
        
        if (response.status === 403) {
            console.log('✅ Correcto: dreyes fue RECHAZADO (403)');
            console.log('Mensaje:', result.error);
        } else {
            console.log('❌ Error: dreyes fue ACEPTADO (no debería pasar)');
            console.log('Respuesta:', result);
        }
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

// 2. Probar login con usuario autorizado (jmadrid)
async function testAuthorizedUser() {
    console.log('✅ Probando con usuario autorizado (jmadrid)...');
    
    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: 'jmadrid', password: 'cmf123' })
        });
        
        const result = await response.json();
        
        if (response.status === 200 && result.success) {
            console.log('✅ Correcto: jmadrid fue ACEPTADO');
            console.log('Mensaje:', result.message);
        } else {
            console.log('❌ Error: jmadrid fue RECHAZADO');
            console.log('Respuesta:', result);
        }
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
    }
}

// 3. Verificar configuración actual
function checkConfiguration() {
    console.log('⚙️ Verificando configuración actual...');
    
    // Verificar si hay sesión guardada
    const session = localStorage.getItem('auth_session');
    console.log('Sesión guardada:', session ? 'SÍ' : 'NO');
    
    // Verificar usuario recordado
    const rememberedUser = localStorage.getItem('remembered_username');
    console.log('Usuario recordado:', rememberedUser || 'NINGUNO');
    
    // Verificar URL actual
    console.log('URL actual:', window.location.href);
}

// Ejecutar pruebas
async function runTests() {
    checkConfiguration();
    console.log('\n');
    await testUnauthorizedUser();
    console.log('\n');
    await testAuthorizedUser();
    console.log('\n🏁 Pruebas completadas');
}

// Ejecutar
runTests();
