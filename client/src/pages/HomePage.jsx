import { Link } from "react-router-dom";
import { FaUsers, FaMapMarkedAlt, FaBuilding, FaHeadset, FaArrowRight } from "react-icons/fa";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import carrusel_1 from "../assets/Foto_fachada-1.png";
import carrusel_2 from "../assets/foto-lab2.png";
import carrusel_3 from "../assets/equipo-2.png";
import carrusel_4 from "../assets/Inyeccion-Soplado_2-1.png";
import carrusel_5 from "../assets/innovacion-4.png";
import carrusel_6 from "../assets/seguridad.png";
import { useState } from "react";
import BotSaludoAnimado from "../components/BotSaludoAnimado";
import TimeoutRedirect from "../components/TimeoutRedirect"; // 👈 IMPORTAR


export function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slideDescriptions = [
    "Nuestra empresa Envases CMF S.A.",
    "Laboratorio de control de calidad",
    "Nuestros líderes de Envases CMF S.A.",
    "Algunos de nuestros productos",
    "Innovación y Tecnología",
    "Nuestra brigada de emergencias"
  ];

  const handleSlideChange = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
          {/* Header azul con título grande */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-6 sm:py-8 flex items-center justify-center">
            <div className="text-center text-white px-4">
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Bienvenido a nuestra APP Interactiva
              </h1>
              <p className="text-blue-100 text-sm sm:text-lg md:text-xl mt-3 sm:mt-4 max-w-2xl mx-auto">
                ¿En qué te podemos ayudar hoy?
              </p>
            </div>
          </div>
          
          {/* Contenido principal */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Grid de acciones principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8">
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

              <Link
                to="/departamentos"
                className="group bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-green-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="bg-green-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-green-600 transition-colors">
                  <FaBuilding className="text-white text-lg sm:text-xl" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Departamentos de Envases CMF S.A.</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">Estructura organizacional de la empresa</p>
                <div className="flex justify-center">
                  <div className="bg-green-500 rounded-full p-2 group-hover:bg-green-600 transition-colors">
                    <FaArrowRight className="text-white text-xs" />
                  </div>
                </div>
              </Link>

              <Link
                to="/trabajadores"
                state={{ fromHome: true }}
                className="group bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="bg-purple-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-600 transition-colors">
                  <FaUsers className="text-white text-lg sm:text-xl" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Trabajadores de Envases CMF S.A.</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">Búsquedas y detalles del personal de la empresa</p>
                <div className="flex justify-center">
                  <div className="bg-purple-500 rounded-full p-2 group-hover:bg-purple-600 transition-colors">
                    <FaArrowRight className="text-white text-xs" />
                  </div>
                </div>
              </Link>

              <Link
                to="/informaciones"
                className="group bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center border-l-4 border-orange-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="bg-orange-500 rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-600 transition-colors">
                  <FaHeadset className="text-white text-lg sm:text-xl" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Informaciones de Envases CMF S.A.</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-3">Datos de contacto e informaciones generales de la empresa</p>
                <div className="flex justify-center">
                  <div className="bg-orange-500 rounded-full p-2 group-hover:bg-orange-600 transition-colors">
                    <FaArrowRight className="text-white text-xs" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Carrusel compacto debajo de las tarjetas */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              {/* Título responsivo del carrusel */}
              <div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-800 truncate">
                    {slideDescriptions[currentSlide]}
                  </h3>
                </div>
              </div>
              
              <div className="p-2">
                <Carousel
                  autoPlay
                  infiniteLoop
                  showThumbs={false}
                  showStatus={false}
                  interval={5000}
                  transitionTime={800}
                  emulateTouch
                  showArrows={false}
                  className="rounded-lg overflow-hidden"
                  onChange={handleSlideChange}
                  selectedItem={currentSlide}
                >
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_1}
                      alt="Fachada de Envases CMF S.A."
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_2}
                      alt="Laboratorio de calidad"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_3}
                      alt="Equipo de trabajo"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_4}
                      alt="Proceso de inyección"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_5}
                      alt="Innovación tecnológica"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="h-[25vh] sm:h-[30vh] md:h-[35vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={carrusel_6}
                      alt="Seguridad industrial"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                </Carousel>
                
                {/* Bot de saludo animado */}
                <div className="mt-8">
                  <BotSaludoAnimado />
                </div>
              </div>
            </div>
          </div>
        </div>     
      </div>
    </div>
  );
}