/**
 * BROWSER METRICS UTILITY
 *
 * Genera un identificador estable del dispositivo combinando
 * características del browser y hardware disponibles sin librerías externas.
 * Se almacena en localStorage para ser consistente entre sesiones en el mismo
 * dispositivo, pero diferente entre dispositivos distintos.
 *
 * PROPÓSITO: Ligar tokens QR a un dispositivo específico para evitar que
 * una URL compartida pueda ser usada desde otro dispositivo.
 */

const BM_SESSION_ID = 'device_bm';

/**
 * Función de hash simple (djb2) para strings.
 * Rápida, sin dependencias externas.
 */
function fastHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Recolecta características del dispositivo y browser.
 * Usa solo APIs estándar disponibles sin permisos especiales.
 */
function gatherBrowserContext() {
    const nav = navigator;
    const scr = screen;

    const signals = [
        nav.userAgent || '',
        nav.language || nav.userLanguage || '',
        nav.platform || '',
        String(nav.hardwareConcurrency || 0),
        String(nav.deviceMemory || 0),
        String(scr.width || 0),
        String(scr.height || 0),
        String(scr.colorDepth || 0),
        String(scr.pixelDepth || 0),
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        String(new Date().getTimezoneOffset()),
    ];

    // Context check ligero (solo si disponible)
    try {
        const drawingSurface = document.createElement('canvas');
        const context = drawingSurface.getContext('2d');
        if (context) {
            context.textBaseline = 'top';
            context.font = '14px Arial';
            context.fillStyle = '#f60';
            context.fillRect(125, 1, 62, 20);
            context.fillStyle = '#069';
            context.fillText('CMF🔒', 2, 15);
            context.fillStyle = 'rgba(102, 204, 0, 0.7)';
            context.fillText('CMF🔒', 4, 17);
            signals.push(drawingSurface.toDataURL().slice(0, 100));
        }
    } catch (e) {
        signals.push('no-surface');
    }

    return signals.join('|');
}

/**
 * Genera (o recupera del localStorage) un identificador estable para este dispositivo.
 * @returns {string} ID de 16 chars aprox.
 */
export function getBrowserMetrics() {
    // Intentar recuperar ID guardado
    try {
        const stored = localStorage.getItem(BM_SESSION_ID);
        if (stored && stored.length > 4) {
            return stored;
        }
    } catch (e) {
        // localStorage no disponible
    }

    // Generar nuevo ID
    const context = gatherBrowserContext();
    // Doble hash para más entropía
    const id = fastHash(context) + '-' + fastHash(context.split('').reverse().join(''));

    // Persistir para consistencia entre sesiones
    try {
        localStorage.setItem(BM_SESSION_ID, id);
    } catch (e) {
        // No crítico si no se puede guardar
    }

    return id;
}

/**
 * Borra el ID guardado.
 * Solo usar en casos de reset total del dispositivo.
 */
export function resetBrowserMetrics() {
    try {
        localStorage.removeItem(BM_SESSION_ID);
    } catch (e) {
        // Ignorar
    }
}
