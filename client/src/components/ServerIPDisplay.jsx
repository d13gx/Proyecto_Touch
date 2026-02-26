import React, { useState, useEffect } from 'react';
import ServerIPDetector from '../utils/serverIPDetector';

const ServerIPDisplay = () => {
    const [serverInfo, setServerInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServerInfo = async () => {
            try {
                setLoading(true);
                const baseURL = await ServerIPDetector.getBaseURL();
                const serverIP = await ServerIPDetector.getServerIP();
                
                setServerInfo({
                    baseURL,
                    serverIP,
                    hostname: window.location.hostname,
                    origin: window.location.origin,
                    userAgent: navigator.userAgent.substring(0, 50) + '...'
                });
                
                console.log('🖥️ Información del servidor:', {
                    baseURL,
                    serverIP,
                    hostname: window.location.hostname
                });
                
            } catch (err) {
                console.error('Error obteniendo información del servidor:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchServerInfo();
        
        // Actualizar cada 30 segundos
        const interval = setInterval(fetchServerInfo, 30000);
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-700 text-sm">Detectando IP del servidor...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-700 text-sm">Error: {error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-green-800 font-semibold text-sm">🖥️ IP del Servidor Detectada:</span>
                    <span className="font-mono text-green-700 text-sm bg-green-100 px-2 py-1 rounded">
                        {serverInfo?.serverIP}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-green-800 font-semibold text-sm">🌐 URL Base para QR:</span>
                    <span className="font-mono text-green-700 text-xs bg-green-100 px-2 py-1 rounded max-w-xs truncate">
                        {serverInfo?.baseURL}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-green-800 font-semibold text-sm">📍 Hostname Actual:</span>
                    <span className="font-mono text-green-700 text-xs bg-green-100 px-2 py-1 rounded">
                        {serverInfo?.hostname}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ServerIPDisplay;
