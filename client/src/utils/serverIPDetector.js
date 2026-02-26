// Detector automático de IP del servidor
export class ServerIPDetector {
    static async getServerIP() {
        try {
            // Método 1: Intentar obtener la IP desde una API externa
            const response = await fetch('http://api.ipify.org?format=json', {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                const data = await response.json();
                const publicIP = data.ip;
                console.log('🌍 IP pública detectada:', publicIP);
                return publicIP;
            }
        } catch (error) {
            console.warn('No se pudo obtener IP pública:', error);
        }

        try {
            // Método 2: Obtener IP local desde el backend
            const response = await fetch('/api/server-ip', {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                const data = await response.json();
                const localIP = data.ip;
                console.log('🏠 IP local del servidor:', localIP);
                return localIP;
            }
        } catch (error) {
            console.warn('No se pudo obtener IP del servidor:', error);
        }

        // Método 3: Usar el hostname actual
        const hostname = window.location.hostname;
        console.log('🔧 Usando hostname actual:', hostname);
        
        // Si es localhost, intentar detectar IP local
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return await this.getLocalIP();
        }
        
        return hostname;
    }

    static async getLocalIP() {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({ 
                iceServers: [] 
            });
            pc.createDataChannel('');
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    const lines = pc.localDescription.sdp.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('a=candidate:')) {
                            const parts = line.split(' ');
                            if (parts[4] && parts[4].includes('.')) {
                                const ip = parts[4];
                                if (!ip.startsWith('127.') && !ip.startsWith('169.254.') && ip !== '0.0.0.0') {
                                    resolve(ip);
                                    return;
                                }
                            }
                        }
                    }
                    resolve('localhost');
                })
                .catch(() => resolve('localhost'));
            
            setTimeout(() => {
                pc.close();
                resolve('localhost');
            }, 2000);
        });
    }

    static async getBaseURL() {
        const serverIP = await this.getServerIP();
        const protocol = window.location.protocol;
        const port = window.location.port || '5173';
        
        // Si ya es una IP o dominio completo, usar el origin actual
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return window.location.origin;
        }
        
        // Para localhost, construir URL con IP detectada
        return `${protocol}//${serverIP}:${port}`;
    }
}

export default ServerIPDetector;
