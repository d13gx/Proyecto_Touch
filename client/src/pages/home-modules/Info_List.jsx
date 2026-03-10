import { useNavigate } from 'react-router-dom';
import { FaClock, FaPhone, FaMapMarkerAlt, FaInfoCircle } from "react-icons/fa";
import './info_list.css'; // Ajusta la ruta según tu estructur
import TimeoutRedirect from "../../components/common/TimeoutRedirect"; //

export function Info_List() {
  const navigate = useNavigate();

  // Componente del Mapa con toda la información integrada
  const MapCard = () => {
    // URL del mapa con parámetros para deshabilitar controles específicos
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.987722356774!2d-70.79420392426912!3d-33.38385179259315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662e9b5c4b4b5a5%3A0x5c5c5c5c5c5c5c5c!2sLa%20Martina%200390%2C%20Pudahuel%2C%20Santiago%2C%20Chile!5e0!3m2!1ses!2scl!4v1690000000000!5m2!1ses!2scl&ui=controls`;

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 overflow-hidden flex flex-col h-full min-h-[700px] group">
        {/* 👇 AGREGAR COMPONENTE */}
        <TimeoutRedirect timeout={60000} redirectTo="/" />
        <div className="p-4 sm:p-5 flex flex-col h-full">
          {/* Header con icono y título */}
          <div className="flex items-center gap-4 mb-6">
          </div>

          {/* Contenedor del mapa - interactivo pero sin controles de navegación */}
          <div className="flex-1 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 mb-6 relative">
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Envases CMF S.A."
              className="min-h-[650px]"
              // Configuración para deshabilitar controles específicos
              sandbox="allow-scripts allow-same-origin"
            />
            {/* Overlay para interceptar clics en los controles no deseados */}
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Información de contacto integrada */}
          <div className="space-y-6">
            {/* Dirección */}
            <div className="flex items-start gap-4 p-6 rounded-xl bg-blue-50 border-l-4 border-blue-500">
              <FaMapMarkerAlt className="text-blue-600 mt-2 flex-shrink-0 text-2xl" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-blue-700 uppercase tracking-wide mb-2">
                  Donde nos encontramos
                </div>
                <div className="text-lg font-semibold text-blue-900 break-words">
                  La Martina 0390, Pudahuel, Santiago de Chile
                </div>
              </div>
            </div>

            {/* Horario */}
            <div className="flex items-start gap-4 p-6 rounded-xl bg-green-50 border-l-4 border-green-500">
              <FaClock className="text-green-600 mt-2 flex-shrink-0 text-2xl" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-green-700 uppercase tracking-wide mb-2">
                  Horario de Atención Comercial
                </div>
                <div className="text-lg font-semibold text-green-900 break-words">
                  Lunes a Viernes, 08:15 - 17:30
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex items-start gap-4 p-6 rounded-xl bg-purple-50 border-l-4 border-purple-500">
              <FaPhone className="text-purple-600 mt-2 flex-shrink-0 text-2xl" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-purple-700 uppercase tracking-wide mb-2">
                  Teléfono de atención Comercial
                </div>
                <div className="text-lg font-semibold text-purple-900 break-words">
                  (562) 2544 8222
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
            {/* Título e icono en la parte azul */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                <FaInfoCircle className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  Información de Contacto
                </h1>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Grid con mapa e información integrada */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Mapa con toda la información - ocupa todo el ancho */}
              <MapCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Info_List;