import React, { useState, useEffect } from 'react';
import { getServerInfo } from '../utils/serverInfo.js';

export const ServerInfoDisplay = () => {
  const [serverInfo, setServerInfo] = useState(null);
  
  useEffect(() => {
    const loadServerInfo = async () => {
      const info = await getServerInfo();
      setServerInfo(info);
    };
    
    loadServerInfo();
  }, []);
  
  if (!serverInfo || !serverInfo.isTotem) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>🖥️ Info Servidor (Totem) - Desarrollo</h4>
      <p>🌐 IP: {serverInfo.localIp}</p>
      <p>🔗 QR URL: {serverInfo.fullUrl}</p>
      <p>📱 Modo: Totem</p>
    </div>
  );
};
