// Script para mostrar la IP de la máquina actual
import { getServerIp } from './ipDetector.js';

export const showMyIP = async () => {
  console.log('🔍 Obteniendo IP de esta máquina...');
  
  try {
    const ip = await getServerIp();
    
    console.log('='.repeat(50));
    console.log('🖥️ INFORMACIÓN DE ESTA MÁQUINA (SERVIDOR TOTEM)');
    console.log('='.repeat(50));
    console.log('🌐 IP Local:', ip);
    console.log('🔗 URL para QR:', `http://${ip}:3001`);
    console.log('📱 Los visitantes escanearán:', `http://${ip}:3001/Cuestionario`);
    console.log('🗄️ Base de datos: SQL Server en 172.18.0.19');
    console.log('='.repeat(50));
    console.log('✅ Esta es la IP que deben usar los visitantes');
    console.log('='.repeat(50));
    
    return ip;
  } catch (error) {
    console.error('❌ Error obteniendo IP:', error);
    
    // Mostrar IPs de fallback
    const fallbackIps = ['172.19.7.96', '172.18.7.150', '192.168.1.100'];
    console.log('🔄 Intentando IPs de fallback...');
    fallbackIps.forEach((fallbackIp, index) => {
      console.log(`${index + 1}. ${fallbackIp}`);
    });
    
    return null;
  }
};

// Función para ejecutar inmediatamente
export const initIPDetection = async () => {
  const ip = await showMyIP();
  
  if (ip) {
    // También mostrar en la página si estamos en el totem
    const isTotem = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isTotem) {
      // Crear un elemento visual para mostrar la IP
      const ipDisplay = document.createElement('div');
      ipDisplay.id = 'totem-ip-display';
      ipDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 300px;
        animation: slideIn 0.5s ease-out;
      `;
      
      ipDisplay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 24px;">🖥️</div>
          <div>
            <div style="font-size: 12px; opacity: 0.9;">TOTEM - IP Local</div>
            <div style="font-size: 16px; margin: 2px 0;">${ip}</div>
            <div style="font-size: 11px; opacity: 0.8;">QR: http://${ip}:3001</div>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" style="
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 12px;
        ">×</button>
      `;
      
      // Agregar animación CSS
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      // Solo mostrar si no existe ya
      if (!document.getElementById('totem-ip-display')) {
        document.body.appendChild(ipDisplay);
      }
      
      // Auto-ocultar después de 10 segundos
      setTimeout(() => {
        if (document.getElementById('totem-ip-display')) {
          document.getElementById('totem-ip-display').remove();
        }
      }, 10000);
    }
  }
  
  return ip;
};
