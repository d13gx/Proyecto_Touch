// Detector automático de IP de la máquina
export const getLocalIpAddress = async () => {
  try {
    // Método 1: Usar WebRTC para obtener la IP local
    const pc = new RTCPeerConnection({
      iceServers: [],
      iceCandidatePoolSize: 0
    });
    
    pc.createDataChannel('');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const candidates = pc.localDescription.sdp.split('\n');
        
        for (const line of candidates) {
          if (line.includes('a=candidate:') && line.includes('host')) {
            const parts = line.split(' ');
            const ip = parts[4];
            
            // Filtrar IPs válidas y reales
            if (ip && 
                !ip.startsWith('127.') && // No localhost
                !ip.startsWith('169.254.') && // No link-local
                !ip.startsWith('fe80:') && // No IPv6 link-local
                !ip.includes('.local') && // No hostname local
                ip.includes('.') && // Debe ser IPv4
                /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) { // Formato IP válido
              clearInterval(checkInterval);
              pc.close();
              console.log('🌐 IP detectada automáticamente:', ip);
              resolve(ip);
              return;
            }
          }
        }
      }, 100);
      
      // Timeout después de 3 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        pc.close();
        console.log('⚠️ No se pudo detectar IP real automáticamente, usando fallback');
        resolve(null);
      }, 3000);
    });
  } catch (error) {
    console.error('❌ Error detectando IP:', error);
    return null;
  }
};

// Método alternativo: Usar fetch a un servicio de IP externo
export const getPublicIp = async () => {
  try {
    console.log('🌐 Intentando obtener IP pública...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('🌐 IP pública detectada:', data.ip);
    return data.ip;
  } catch (error) {
    console.error('❌ Error obteniendo IP pública:', error);
    return null;
  }
};

// Método para obtener IP local usando WebRTC mejorado
export const getLocalIpImproved = async () => {
  return new Promise((resolve) => {
    const rtc = new RTCPeerConnection({iceServers: []});
    rtc.createDataChannel('');
    
    rtc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const match = candidate.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
        
        if (match) {
          const ip = match[1];
          // Validar que sea una IP de red local válida
          if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
            console.log('🌐 IP local encontrada:', ip);
            rtc.close();
            resolve(ip);
            return;
          }
        }
      }
    };
    
    rtc.createOffer()
      .then(offer => rtc.setLocalDescription(offer))
      .catch(() => resolve(null));
    
    // Timeout
    setTimeout(() => {
      rtc.close();
      resolve(null);
    }, 2000);
  });
};

// Obtener IP desde variables de entorno o detección automática
export const getServerIp = async () => {
  // Priorizar variable de entorno si existe
  if (import.meta.env.VITE_SERVER_IP) {
    console.log('🔧 Usando IP de entorno:', import.meta.env.VITE_SERVER_IP);
    return import.meta.env.VITE_SERVER_IP;
  }
  
  // Intentar detección automática mejorada
  console.log('🔍 Iniciando detección de IP real...');
  
  // Método 1: WebRTC mejorado
  const autoIp = await getLocalIpAddress();
  if (autoIp && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(autoIp)) {
    console.log('✅ IP real detectada con WebRTC:', autoIp);
    return autoIp;
  }
  
  // Método 2: WebRTC alternativo
  const altIp = await getLocalIpImproved();
  if (altIp && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(altIp)) {
    console.log('✅ IP real detectada con método alternativo:', altIp);
    return altIp;
  }
  
  // Método 3: IP pública (solo como último recurso)
  const publicIp = await getPublicIp();
  if (publicIp && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(publicIp)) {
    console.log('⚠️ Usando IP pública (puede no funcionar en red local):', publicIp);
    return publicIp;
  }
    
  // Fallback a IPs comunes
  const fallbackIps = [
    '172.19.7.96', // IP actual de Diego
    '172.18.7.150', // IP del TOTEM
    '192.168.1.100', // IP común
    '192.168.0.100'  // IP común
  ];
  
  console.log('🔄 Usando IP de fallback:', fallbackIps[0]);
  return fallbackIps[0];
};
