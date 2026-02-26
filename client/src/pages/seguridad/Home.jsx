import Carousel from '../../components/components-seguridad/Carousel';
import BotSaludoAnimado from '../../components/components-seguridad/BotSaludoAnimado';
import { useNavigate, Link } from 'react-router-dom';
import { FaUsers, FaMapMarkedAlt, FaBuilding, FaHeadset, FaArrowRight } from 'react-icons/fa';
import { useState } from 'react';
import carrusel1 from '../../assets/assets-seguridad/carrusel_1.webp';
import carrusel2 from '../../assets/assets-seguridad/carrusel_2.webp';
import carrusel3 from '../../assets/assets-seguridad/carrusel_3.webp';
import carrusel4 from '../../assets/assets-seguridad/carrusel_4.webp';
import VideoButton from '../../components/components-seguridad/VideoButton';
import PersonalModal from '../../components/PersonalModal';

function Home() {
  const carouselImages = [
    carrusel1,
    carrusel2,
    carrusel3,
    carrusel4
  ];

  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const navigate = useNavigate();

  const handleVideoClick = () => {
    navigate('/seguridad/video-seguridad');
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
          {/* Header azul con título grande */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 sm:py-8 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Bienvenido a Envases CMF   
              </h1>
              <p className="text-blue-100 text-sm sm:text-lg md:text-xl mt-3 sm:mt-4 max-w-2xl mx-auto">
                ¿En qué te podemos ayudar hoy?
              </p>
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="space-y-12">
              {/* Carrusel más pequeño */}
              <div className="animate-fade-in">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 mb-6">
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-800">Conoce nuestras instalaciones</h3>
                  </div>
                  <div className="bg-gray-900 rounded-md overflow-hidden w-full">
                    <div className="w-full h-full">
                      <Carousel images={carouselImages} />
                    </div>
                  </div>
                </div>
              </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-200">
              <div className="flex items-center justify-between gap-8">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 mb-2">
                    ¿Visitarás nuestra planta?
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Descubre cómo mantenemos un ambiente seguro y productivo
                  </p>
                </div>
                <div className="animate-fade-in-delay">
                  <VideoButton onClick={handleVideoClick} />
                </div>
              </div>
            </div>
          </div>

              {/* Grid de acciones principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
                <Link
                  to="/mapa"
                  className="group bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-blue-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 transition-colors">
                    <FaMapMarkedAlt className="text-white text-lg sm:text-xl" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Mapa de Envases CMF S.A.</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3">Ubicaciones, distribución de zonas y departamentos de la empresa</p>
                  <div className="flex justify-center">
                    <div className="bg-blue-500 rounded-full p-2 group-hover:bg-blue-600 transition-colors">
                      <FaArrowRight className="text-white text-xs" />
                    </div>
                  </div>
                </Link>

                <div
                  onClick={() => setShowPersonalModal(true)}
                  className="group bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div className="bg-purple-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition-colors">
                    <FaBuilding className="text-white text-lg sm:text-xl" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Buscar por Departamento</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3">Búsqueda de departamentos de la empresa</p>
                  <div className="flex justify-center">
                    <div className="bg-purple-500 rounded-full p-2 group-hover:bg-purple-600 transition-colors">
                      <FaArrowRight className="text-white text-xs" />
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setShowPersonalModal(true)}
                  className="group bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                >
                  <div className="bg-green-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
                    <FaUsers className="text-white text-lg sm:text-xl" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Buscar por Trabajador</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3">Búsqueda de trabajadores de la empresa</p>
                  <div className="flex justify-center">
                    <div className="bg-green-500 rounded-full p-2 group-hover:bg-green-600 transition-colors">
                      <FaArrowRight className="text-white text-xs" />
                    </div>
                  </div>
                </div>

                <Link
                  to="/informaciones"
                  className="group bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-yellow-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="bg-yellow-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-yellow-600 transition-colors">
                    <FaHeadset className="text-white text-lg sm:text-xl" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Contacto</h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3">Datos de contacto e informaciones generales de la empresa</p>
                  <div className="flex justify-center">
                    <div className="bg-yellow-500 rounded-full p-2 group-hover:bg-yellow-600 transition-colors">
                      <FaArrowRight className="text-white text-xs" />
                    </div>
                  </div>
                </Link>
              </div>

              <BotSaludoAnimado />
            </div>
            
            {/* Modal de Personal */}
            <PersonalModal 
              isOpen={showPersonalModal} 
              onClose={() => setShowPersonalModal(false)} 
            />
          </div>
        </div>     
      </div>
    </div>
  );
}

export default Home;
