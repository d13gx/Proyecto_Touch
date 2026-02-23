import { Link } from 'react-router-dom';
import Logo from '../assets/logo-cmf-azul.svg';
import Footer from '../components/Footer';
import { useState } from 'react';

export default function VideoSeguridad() {
    const [showQR, setShowQR] = useState(false);
    
    // URL para generar QR que dirija al cuestionario local
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/cuestionario')}`;

    const handleVideoEnded = () => {
        setShowQR(true);
    };

    const handleVideoReplay = () => {
        setShowQR(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
            <header className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-4">   
                    <div>
                        <img src={Logo} alt="CMF Envases" className="h-28 md:h-36 object-contain" />
                        <p className="text-sm text-gray-600"></p>
                    </div>
                    <nav className="ml-auto">
                        <Link
                            to="/"
                            className="px-11 py-7 bg-blue-600 !text-white text-xl font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200"
                        >
                            Volver al inicio
                        </Link>
                    </nav>
                </div>
            </header>

            {/* modifica el tamaño del video */}
            <main className="flex-1 max-w-7xl mx-auto px-8 py-12">
                <div className="bg-white rounded-lg shadow h-full overflow-hidden">
                    {/* Video Player - solo se muestra cuando el video no ha terminado */}
                    {!showQR ? (
                        <div className="bg-gray-900 rounded-md overflow-hidden w-full h-full">
                            <video
                                controls
                                className="w-full h-full rounded-md"
                                style={{ objectFit: 'contain' }}
                                onEnded={handleVideoEnded}
                            >
                                <source src="/visitas_1.mp4" type="video/mp4" />
                                Tu navegador no soporta el elemento de video.
                            </video>
                        </div>
                    ) : (
                        /* QR Code Section - reemplaza al video cuando termina */
                        <div className="flex flex-col items-center justify-center gap-6 p-12 h-full">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-800 mb-3">¡Video completado!</h2>
                                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                                    Escanea el código QR para responder el cuestionario de seguridad
                                </p>
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
            <Footer />
        </div>
    )
}