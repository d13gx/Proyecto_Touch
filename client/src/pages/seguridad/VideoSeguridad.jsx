import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../assets/assets-seguridad/logo-cmf-azul.svg';
import { useState, useEffect } from 'react';
import tokenManager from '../../utils/tokenManager';
import ServerIPDetector from '../../utils/serverIPDetector';
import ServerIPDisplay from '../../components/ServerIPDisplay';

export default function VideoSeguridad() {
    const [showQR, setShowQR] = useState(false);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [generatingQR, setGeneratingQR] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [baseUrlForQR, setBaseUrlForQR] = useState('');
    const navigate = useNavigate();
    
    // Limpiar tokens expirados al cargar
    useEffect(() => {
        tokenManager.cleanExpiredTokens();
    }, []);
    
    // Generar QR cuando el video termina
    const handleVideoEnd = async () => {
        try {
            setVideoCompleted(true);
            setGeneratingQR(true);
            
            console.log('🎬 Video terminado, generando QR...');
            
            // Generar URL para el QR usando detección automática de IP del servidor
            let baseUrl;
            try {
                baseUrl = await ServerIPDetector.getBaseURL();
                console.log('🌐 URL base detectada automáticamente:', baseUrl);
            } catch (error) {
                console.warn('⚠️ Error detectando IP automáticamente, usando fallback:', error);
                
                // Fallback: lógica manual
                const hostname = window.location.hostname;
                if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                    baseUrl = window.location.origin;
                } else {
                    baseUrl = 'http://172.19.7.96:5173';  // IP de desarrollo
                    console.log('🔧 Usando IP de desarrollo fallback:', baseUrl);
                }
            }
            
            setBaseUrlForQR(baseUrl);
            const cuestionarioUrl = baseUrl + '/cuestionario';
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cuestionarioUrl)}`;
            
            console.log('🔗 URL del cuestionario:', cuestionarioUrl);
            console.log('📱 URL del QR:', qrUrl);
            
            setQrUrl(qrUrl);
            setShowQR(true);
            setGeneratingQR(false);
            
            console.log('✅ QR generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando QR:', error);
            setGeneratingQR(false);
            alert('Error generando el código QR. Por favor intente nuevamente.');
        }
    };

    useEffect(() => {
        if (showQR) {
            // Temporizador de 30 segundos para redirigir al HomePage
            const timer = setTimeout(() => {
                navigate('/home');
            }, 30000); // 30 segundos

            return () => clearTimeout(timer);
        }
    }, [showQR, navigate]);

    const handleVideoReplay = () => {
        setShowQR(false);
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <main className="max-w-7xl mx-auto px-8 py-12">
                {/* Mostrar información del servidor */}
                <ServerIPDisplay />
                
                <div className="bg-white rounded-lg shadow h-full overflow-hidden">
                    {/* Video Player - solo se muestra cuando el video no ha terminado */}
                    {!showQR ? (
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-900 rounded-md overflow-hidden w-full flex-1">
                                <video
                                    controls
                                    className="w-full h-full rounded-md"
                                    style={{ objectFit: 'contain' }}
                                    onEnded={handleVideoEnd}
                                >
                                    <source src="/visitas_1.mp4" type="video/mp4" />
                                    Tu navegador no soporta el elemento de video.
                                </video>
                            </div>
                            {/* Botón adicional abajo del video */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => navigate('/seguridad/home')}
                                        className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                                    >
                                        Volver al inicio
                                    </button>
                                    <button
                                        onClick={() => navigate('/mapa')}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                                    >
                                        Ver mapa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : generatingQR ? (
                        /* Loading State */
                        <div className="flex flex-col items-center justify-center gap-6 p-12 h-full">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-3">Generando código QR...</h2>
                                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                                    Por favor espera mientras generamos tu código QR único
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* QR Code Section - reemplaza al video cuando termina */
                        <div className="flex flex-col items-center justify-center gap-6 p-12 h-full">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-800 mb-3">¡Video completado!</h2>
                                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                                    Escanea el código QR para responder el cuestionario de seguridad
                                </p>
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600">
                                        📱 URL para escanear: <span className="font-mono text-xs">{baseUrlForQR}/cuestionario</span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-white to-gray-50 p-10 rounded-2xl border-2 border-gray-200 shadow-xl transform hover:scale-105 transition-all duration-300">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">Escanea para comenzar</p>
                                </div>
                                <img 
                                    src={qrUrl} 
                                    alt="Código QR para el cuestionario"
                                    className="w-72 h-72 shadow-lg rounded-lg"   
                                />
                            </div>
                            <div className="flex gap-4">
                                <Link
                                    to="/cuestionario"
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                                >
                                    O accede directamente aquí
                                </Link>
                                <button
                                    onClick={handleVideoReplay}
                                    className="px-8 py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                                >
                                    Ver video nuevamente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
