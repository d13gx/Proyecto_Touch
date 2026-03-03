import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../assets/assets-seguridad/logo-cmf-azul.svg';
import { useState, useEffect, useRef } from 'react';
import tokenManager from '../../utils/tokenManager';
import BotSaludoAnimado from '../../components/components-seguridad/BotSaludoAnimado';
import { FaVideo } from 'react-icons/fa';

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
    const [showCustomControls, setShowCustomControls] = useState(false);
    const [controlsTimeout, setControlsTimeout] = useState(null);
    const [pauseTimeout, setPauseTimeout] = useState(null);
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

            // IMPORTANTE: el QR NO debe contener un token fijo.
            // El QR apunta a una URL de entrada y cada dispositivo genera su propio token al abrirla.
            const cuestionarioEntryUrl = `${baseUrl}/cuestionario?qr=1`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(cuestionarioEntryUrl)}`;

            console.log('🔗 URL de entrada al cuestionario (sin token):', cuestionarioEntryUrl);
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
            // Temporizador para redirigir al HomePage después de 45 segundos
            const timer = setTimeout(() => {
                navigate('/seguridad/home');
            }, 40000); // 40 segundos

            return () => clearTimeout(timer);
        }
    }, [showQR, navigate]);

    const handleVideoReplay = () => {
        // Refrescar la página completa para reiniciar todo el estado
        window.location.reload();
    };

    // Funciones para controles personalizados
    const togglePlayPause = (e) => {
        if (e) e.stopPropagation();
        handleControlInteraction(e);
        
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

    const toggleMute = (e) => {
        if (e) e.stopPropagation();
        handleControlInteraction(e);
        
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleSeek = (e) => {
        if (videoRef.current) {
            const newTime = (e.target.value / 100) * videoRef.current.duration;
            videoRef.current.currentTime = newTime;
            setProgress(e.target.value);
        }
    };

    const handleVideoPlay = () => {
        console.log('▶️ Video reanudado - Cancelando contador de pausa');
        setIsPlaying(true);
        
        // Limpiar timeout de pausa cuando el video se reanuda
        if (pauseTimeout) {
            clearTimeout(pauseTimeout);
            setPauseTimeout(null);
            console.log('✅ Timeout de pausa cancelado');
        }
    };

    const handleVideoPause = () => {
        console.log('⏸️ Video pausado - Iniciando contador de 10 segundos');
        setIsPlaying(false);
        
        // Limpiar timeout existente
        if (pauseTimeout) {
            clearTimeout(pauseTimeout);
            console.log('🧹 Timeout anterior limpiado');
        }
        
        // Establecer timeout para redirigir después de 10 segundos de pausa
        const timeout = setTimeout(() => {
            console.log('🏠 Video detenido por 10 segundos, redirigiendo al home...');
            navigate('/seguridad/home');
        }, 10000); // 10 segundos
        
        setPauseTimeout(timeout);
        console.log('⏰ Nuevo timeout de 10 segundos establecido');
    };

    // Funciones para manejar la visibilidad de controles
    const showControls = () => {
        setShowCustomControls(true);
        
        // Limpiar timeout existente
        if (controlsTimeout) {
            clearTimeout(controlsTimeout);
            setControlsTimeout(null);
        }
        
        // No establecer timeout automático para que los controles permanezcan visibles
        // hasta que no haya interacción por 2 segundos
    };

    const handleVideoInteraction = () => {
        showControls();
        
        // Detectar si el video está en pausa y activar el contador
        if (videoRef.current && videoRef.current.paused && !pauseTimeout) {
            console.log('⏸️ Video detectado en pausa - Activando contador de 10 segundos');
            handleVideoPause();
        }
        
        // Establecer timeout para ocultar después de 2 segundos de inactividad
        if (controlsTimeout) {
            clearTimeout(controlsTimeout);
        }
        
        const timeout = setTimeout(() => {
            setShowCustomControls(false);
        }, 2000);
        
        setControlsTimeout(timeout);
    };

    const handleControlInteraction = (e) => {
        e.stopPropagation(); // Evitar que se propague al video
        showControls();
    };

    // Forzar estado inicial del video y reproducción automática
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Escuchar eventos del video para sincronizar estado
            const syncPlayState = () => {
                const isCurrentlyPlaying = !video.paused;
                setIsPlaying(isCurrentlyPlaying);
                console.log('🎬 Video state changed:', isCurrentlyPlaying ? 'playing' : 'paused');
            };
            
            video.addEventListener('play', syncPlayState);
            video.addEventListener('pause', syncPlayState);
            video.addEventListener('playing', syncPlayState);
            
            // Eventos para mostrar controles
            video.addEventListener('click', handleVideoInteraction);
            video.addEventListener('touchstart', handleVideoInteraction);
            video.addEventListener('mousemove', handleVideoInteraction);
            
            // Intentar reproducir automáticamente
            const attemptAutoplay = async () => {
                try {
                    await video.play();
                    console.log('🎬 Video iniciado automáticamente');
                    // Forzar sincronización del estado después de reproducir
                    setTimeout(() => {
                        setIsPlaying(true);
                    }, 100);
                } catch (error) {
                    console.log('⚠️ No se pudo reproducir automáticamente:', error);
                    // Si no se puede reproducir automáticamente, mostrar controles
                    setIsPlaying(false);
                }
            };
            
            // Esperar a que el video esté listo para reproducir
            if (video.readyState >= 3) {
                attemptAutoplay();
            } else {
                video.addEventListener('canplay', attemptAutoplay, { once: true });
            }
            
            return () => {
                video.removeEventListener('play', syncPlayState);
                video.removeEventListener('pause', syncPlayState);
                video.removeEventListener('playing', syncPlayState);
                video.removeEventListener('click', handleVideoInteraction);
                video.removeEventListener('touchstart', handleVideoInteraction);
                video.removeEventListener('mousemove', handleVideoInteraction);
            };
        }
    }, []);

    // Cleanup del timeout al desmontar
    useEffect(() => {
        return () => {
            if (controlsTimeout) {
                clearTimeout(controlsTimeout);
            }
            if (pauseTimeout) {
                clearTimeout(pauseTimeout);
            }
        };
    }, [controlsTimeout, pauseTimeout]);

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header principal */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                                <FaVideo className="text-xl sm:text-2xl md:text-3xl" />
                            </div>
                            <div className="text-white">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Video de Seguridad</h1>
                                <p className="text-sm sm:text-base text-blue-100">Información importante para visitas</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                                    onClick={handleVideoInteraction}
                                    onMouseMove={handleVideoInteraction}
                                    style={{ pointerEvents: 'auto' }}
                                />
                                
                                {/* Controles personalizados para tótem - siempre visibles */}
                                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showCustomControls ? 'opacity-100' : 'opacity-0'}`} style={{ zIndex: 9999 }}>
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
                                        
                                        <div className="flex-1" style={{ pointerEvents: 'auto' }} onClick={handleControlInteraction}>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={progress}
                                                onChange={(e) => {
                                                    handleSeek(e);
                                                    handleControlInteraction(e);
                                                }}
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
                                    </div>
                                </div>
                            </div>
                            {/* Botón animado fijo debajo del video */}
                            <div className="mt-38 mb-36 flex justify-center">
                                <div style={{
                                    position: 'relative',
                                    margin: '0 auto',
                                    transform: 'scale(1.2)',
                                    zIndex: 'auto',
                                    animation: 'none',
                                    opacity: '1',
                                    background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
                                    boxShadow: '0 30px 60px rgba(79, 70, 229, 0.25)',
                                    border: '2px solid #e0e7ff',
                                    borderRadius: '30px',
                                    padding: '40px 50px'
                                }}>
                                    <style>
                                        {`
                                            .bot-saludo-avatar {
                                                position: relative !important;
                                                bottom: auto !important;
                                                right: auto !important;
                                                top: auto !important;
                                                left: auto !important;
                                                margin: 0 auto !important;
                                                transform: none !important;
                                                z-index: auto !important;
                                                animation: none !important;
                                                opacity: 1 !important;
                                                background: transparent !important;
                                                box-shadow: none !important;
                                                border: none !important;
                                                padding: 0 !important;
                                            }
                                            .avatar-bot {
                                                border-color: #6366f1 !important;
                                                box-shadow: 0 15px 40px rgba(99, 102, 241, 0.5) !important;
                                            }
                                            .fade {
                                                opacity: 1 !important;
                                                transform: none !important;
                                                transition: none !important;
                                            }
                                            .fade.visible {
                                                opacity: 1 !important;
                                                transform: none !important;
                                            }
                                            .fade.hidden {
                                                opacity: 1 !important;
                                                transform: none !important;
                                            }
                                            .bot-saludo-avatar div {
                                                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) !important;
                                                animation: wordChange 0.8s ease-in-out !important;
                                                color: #4f46e5 !important;
                                            }
                                            @keyframes wordChange {
                                                0% {
                                                    opacity: 0.3;
                                                    transform: translateY(-5px) scale(0.95);
                                                }
                                                50% {
                                                    opacity: 0.8;
                                                    transform: translateY(2px) scale(1.02);
                                                }
                                                100% {
                                                    opacity: 1;
                                                    transform: translateY(0) scale(1);
                                                }
                                            }
                                            .bot-saludo-avatar div:hover {
                                                transform: scale(1.05);
                                                color: #4f46e5;
                                            }
                                        `}
                                    </style>
                                    <BotSaludoAnimado />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* QR Code Section - versión simplificada */
                    <div style={{ minHeight: '100vh', padding: '20px', paddingTop: '60px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-2">
                                ¡Gracias por ver el video!
                            </h2>
                            <h2 style={{ fontSize: '25px', color: '#4f46e5' }}>
                                Te invito a responder un breve cuestionario escaneando el QR.
                            </h2>
                        </div>
                        
                        <div style={{ 
                            backgroundColor: 'white', 
                            padding: '80px', 
                            borderRadius: '24px', 
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            maxWidth: '800px',
                            margin: '0 auto 40px'
                        }}>
                            {generatingQR ? (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <style>
                                        {`
                                            @keyframes spin {
                                                0% { transform: rotate(0deg); }
                                                100% { transform: rotate(360deg); }
                                            }
                                        `}
                                    </style>
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
                                            width: '500px', 
                                            height: '500px',
                                            marginBottom: '20px',
                                            display: 'block',
                                            margin: '0 auto 20px'
                                        }}
                                    />  
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
                                onClick={handleVideoReplay}
                                style={{
                                    padding: '20px 130px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Ver video nuevamente
                            </button>
                        </div>
                        
                        
                    </div>
                )}
                    </div>
                </div>
            </div>
        </div>
    );
}
