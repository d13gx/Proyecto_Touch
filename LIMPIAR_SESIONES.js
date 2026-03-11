// Script para limpiar todas las sesiones y forzar login
// Ejecutar en la consola del navegador

console.log('🧹 LIMPIANDO TODAS LAS SESIONES...');

// Limpiar localStorage
localStorage.clear();

// Limpiar sessionStorage
sessionStorage.clear();

// Limpiar cookies (si las hay)
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"); 
});

console.log('✅ Sesiones limpiadas');
console.log('🔄 Recargando página para forzar login...');

// Recargar página
setTimeout(() => {
    window.location.reload();
}, 1000);
