import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../assets/assets-seguridad/logo-cmf-azul.svg';
import { useState, useEffect, useRef } from 'react';
import tokenManager from '../../utils/tokenManager';
import BotSaludoAnimado from '../../components/components-seguridad/BotSaludoAnimado';

export default function VideoSeguridad() {
    const [showQR, setShowQR] = useState(false);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [generatingQR, setGeneratingQR] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [baseUrlForQR, setBaseUrlForQR] = useState('');
    const navigate = useNavigate();
    
    // Estados para controles personalizados
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showCustomControls, setShowCustomControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoRef = useRef(null);
    
    // Limpiar tokens expirados al cargar
    useEffect(() => {
        tokenManager.cleanExpiredTokens();
    }, []);
    
    // Generar QR cuando el video termina
    const handleVideoEnd = async () => {
        try {
            console.log('🎬 Video terminado, iniciando transición...');
            
            // Primero ocultar el video completamente
            setShowQR(true);
            setGeneratingQR(true);
            
            // Esperar un momento para que el video desaparezca visualmente
            await new Promise(resolve => setTimeout(resolve, 800));
            
            console.log('🔄 Generando QR después de la transición...');
            
            const baseUrl = tokenManager.getBaseUrlForToken();
            setBaseUrlForQR(baseUrl);

            const cuestionarioUrl = `${baseUrl}/cuestionario`;
            const tokenizedUrl = await tokenManager.getTokenizedUrl(cuestionarioUrl);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(tokenizedUrl)}`;

            console.log('🔗 URL del cuestionario:', cuestionarioUrl);
            console.log('� URL tokenizada:', tokenizedUrl);
            console.log('📱 URL del QR:', qrUrl);

            setQrUrl(qrUrl);
            setGeneratingQR(false);
            
            console.log('✅ QR generado exitosamente');
        } catch (error) {
            console.error('❌ Error generando QR:', error);
            setGeneratingQR(false);
            setShowQR(true); // Mostrar sección de QR aunque haya error
            alert('Error generando el código QR. Por favor intente nuevamente.');
        }
    };

    useEffect(() => {
        if (showQR) {
            // Temporizador de 30 segundos para redirigir al HomePage
            const timer = setTimeout(() => {
                navigate('/seguridad/home');
            }, 30000); // 30 segundos

            return () => clearTimeout(timer);
        }
    }, [showQR, navigate]);

    const handleVideoReplay = () => {
        setShowQR(false);
    };

    // Funciones para controles personalizados
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (!isFullscreen) {
                // Entrar en pantalla completa con el contenedor personalizado
                const container = videoRef.current.parentElement;
                if (container.requestFullscreen) {
                    container.requestFullscreen();
                } else if (container.webkitRequestFullscreen) {
                    container.webkitRequestFullscreen();
                } else if (container.mozRequestFullScreen) {
                    container.mozRequestFullScreen();
                } else if (container.msRequestFullscreen) {
                    container.msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                // Salir de pantalla completa
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        }
    };

    // Escuchar cambios de pantalla completa
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const handleSeek = (e) => {
        if (videoRef.current) {
            const newTime = (e.target.value / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            setProgress(e.target.value);
        }
    };

    const handleVideoPlay = () => {
        setIsPlaying(true);
    };

    const handleVideoPause = () => {
        setIsPlaying(false);
    };

    // Forzar estado inicial del video
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Escuchar eventos del video para sincronizar estado
            const syncPlayState = () => {
                setIsPlaying(!video.paused);
            };
            
            video.addEventListener('play', syncPlayState);
            video.addEventListener('pause', syncPlayState);
            
            return () => {
                video.removeEventListener('play', syncPlayState);
                video.removeEventListener('pause', syncPlayState);
            };
        }
    }, []);

    // Actualizar progreso y bloquear controles nativos
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateProgress = () => {
            const progress = (video.currentTime / video.duration) * 100;
            setProgress(progress);
        };

        // Bloquear controles nativos agresivamente
        const blockNativeControls = () => {
            // Eliminar atributos de controles
            video.removeAttribute('controls');
            video.controls = false;
            
            // Prevenir eventos de controles
            const events = ['play', 'pause', 'seeking', 'seeked', 'volumechange'];
            events.forEach(event => {
                video.addEventListener(event, (e) => {
                    if (e.target === video && !e.customTriggered) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }, true);
            });
        };

        // CSS para ocultar controles nativos
        const hideNativeControls = () => {
            const style = document.createElement('style');
            style.textContent = `
                video::-webkit-media-controls-panel {
                    display: none !important;
                }
                video::-webkit-media-controls-play-button {
                    display: none !important;
                }
                video::-webkit-media-controls-timeline {
                    display: none !important;
                }
                video::-webkit-media-controls-current-time-display {
                    display: none !important;
                }
                video::-webkit-media-controls-time-remaining-display {
                    display: none !important;
                }
                video::-webkit-media-controls-mute-button {
                    display: none !important;
                }
                video::-webkit-media-controls-toggle-closed-captions-button {
                    display: none !important;
                }
                video::-webkit-media-controls-fullscreen-button {
                    display: none !important;
                }
                video::-moz-media-controls-panel {
                    display: none !important;
                }
                video::-ms-media-controls-panel {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            
            return () => {
                document.head.removeChild(style);
            };
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('loadedmetadata', blockNativeControls);
        video.addEventListener('canplay', blockNativeControls);
        
        // Aplicar bloqueo de controles
        blockNativeControls();
        const cleanupStyle = hideNativeControls();
        
        // Deshabilitar controles nativos con CSS
        video.style.pointerEvents = 'none';
        
        return () => {
            video.removeEventListener('timeupdate', updateProgress);
            video.removeEventListener('loadedmetadata', blockNativeControls);
            video.removeEventListener('canplay', blockNativeControls);
            cleanupStyle();
        };
    }, []);

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
            <main className="max-w-7xl mx-auto px-8 py-12">
                {/* Video Player - solo se muestra cuando el video no ha terminado */}
                {!showQR ? (
                    <div className="bg-white rounded-lg shadow h-full overflow-hidden">
                        <div className="flex flex-col h-full">
                            <div className="bg-gray-900 rounded-md overflow-hidden w-full flex-1 relative">
                                <video
                                    ref={videoRef}
                                    controls={false}
                                    controlsList="nodownload nofullscreen noremoteplayback"
                                    className="w-full h-full rounded-md"
                                    style={{ 
                                        objectFit: 'contain',
                                        maxHeight: 'calc(90vh - 200px)',
                                        pointerEvents: 'none'
                                    }}
                                    onEnded={handleVideoEnd}
                                    onPlay={handleVideoPlay}
                                    onPause={handleVideoPause}
                                    disablePictureInPicture
                                    onContextMenu={(e) => e.preventDefault()}
                                >
                                    <source src="/visitas_1.mp4" type="video/mp4" />
                                    Tu navegador no soporta el elemento de video.
                                </video>
                                
                                {/* Overlay para capturar clicks */}
                                <div 
                                    className="absolute inset-0 z-10"
                                    onClick={togglePlayPause}
                                    style={{ pointerEvents: 'auto' }}
                                />
                                
                                {/* Controles personalizados para tótem - siempre visibles */}
                                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 ${isFullscreen ? 'fixed bottom-195' : ''}`} style={{ zIndex: 9999 }}>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={togglePlayPause}
                                            className="text-white hover:text-blue-400 transition-colors bg-black/50 rounded-full p-2"
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            {isPlaying ? 
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                                </svg> :
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8 5v14l11-7z"/>
                                                </svg>
                                            }
                                        </button>
                                        
                                        <div className="flex-1" style={{ pointerEvents: 'auto' }}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={progress}
                                                onChange={handleSeek}
                                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                        
                                        <button
                                            onClick={toggleMute}
                                            className="text-white hover:text-blue-400 transition-colors bg-black/50 rounded-full p-2"
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            {isMuted ? 
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                                                </svg> :
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                </svg>
                                            }
                                        </button>
                                        
                                        <button
                                            onClick={toggleFullscreen}
                                            className="text-white hover:text-blue-400 transition-colors bg-black/50 rounded-full p-2"
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            {isFullscreen ? 
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                                                </svg> :
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                                                </svg>
                                            }
                                        </button>
                                    </div>
                                </div>
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
                                        onClick={() => navigate('/seguridad/mapa')}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                                    >
                                        Ver mapa
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* QR Code Section - versión simplificada */
                    <div style={{ minHeight: '100vh', padding: '20px', paddingTop: '60px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                                ¡Video completado!
                            </h2>
                            <p style={{ fontSize: '18px', color: '#6b7280' }}>
                                Escanea este código QR para continuar
                            </p>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: 'white', 
                            padding: '40px', 
                            borderRadius: '16px', 
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                            maxWidth: '400px',
                            margin: '0 auto 40px'
                        }}>
                            {generatingQR ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <div style={{ 
                                        width: '40px', 
                                        height: '40px', 
                                        border: '4px solid #e5e7eb',
                                        borderTop: '4px solid #3b82f6',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 20px'
                                    }}></div>
                                    <p style={{ color: '#6b7280', fontWeight: '500' }}>Generando código QR...</p>
                                </div>
                            ) : qrUrl ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img 
                                        src={qrUrl} 
                                        alt="Código QR" 
                                        style={{ 
                                            width: '256px', 
                                            height: '256px',
                                            marginBottom: '20px',
                                            display: 'block',
                                            margin: '0 auto 20px'
                                        }}
                                    />
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                                        Escanea para continuar
                                    </p>
                                    <p style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {baseUrlForQR}/cuestionario
                                    </p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '20px' }}>
                                        Error al generar código QR
                                    </p>
                                    <button 
                                        onClick={handleVideoReplay}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => navigate('/seguridad/home')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Volver al inicio
                            </button>
                            <button
                                onClick={() => navigate('/seguridad/mapa')}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Ver mapa
                            </button>
                            <button
                                onClick={handleVideoReplay}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Ver video nuevamente
                            </button>
                        </div>
                        
                        <BotSaludoAnimado />
                        
                        <style jsx>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}
            </main>
        </div>
    );
}
