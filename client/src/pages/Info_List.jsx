import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../config';
import { FaClock, FaPhone, FaMapMarkerAlt, FaInfoCircle, FaArrowLeft, FaUser, FaEnvelope, FaCrown } from "react-icons/fa";
import './info_list.css'; // Ajusta la ruta según tu estructur
import TimeoutRedirect from "../components/TimeoutRedirect"; // 

export function Info_List() {
  const navigate = useNavigate();
  const [trabajadoresTI, setTrabajadoresTI] = useState([]);
  const [jefeTI, setJefeTI] = useState(null);
  const [otrosTrabajadores, setOtrosTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener datos reales del departamento de Tecnología y Digitalización desde la API
  useEffect(() => {
    const fetchDepartamentoTI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("🔍 Intentando obtener datos del departamento Tecnología y Digitalización...");
        
        // URL para obtener información del departamento de Informática
        const nombreDepartamento = encodeURIComponent('Tecnología y Digitalización');
        const response = await fetch(`${API_BASE_URL}/api/departamento/${nombreDepartamento}/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        console.log("📡 URL de la API:", response.url);
        console.log("📥 Respuesta recibida:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json().catch(err => {
          console.error("❌ Error al parsear la respuesta JSON:", err);
          throw new Error("La respuesta del servidor no es un JSON válido");
        });
        
        console.log("✅ Datos recibidos:", data);
        
        if (!data || typeof data !== 'object') {
          throw new Error("Formato de respuesta inesperado");
        }
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Filtrar trabajadores - excluir "Asesor TI"
        const trabajadoresFiltrados = (data.trabajadores || []).filter(
          trabajador => !trabajador.title?.toLowerCase().includes('asesor ti')
        );

        // Separar jefe de otros trabajadores
        const jefe = trabajadoresFiltrados.find(trabajador => 
          trabajador.title?.toLowerCase().includes('jefe') ||
          trabajador.title?.toLowerCase().includes('gerente') ||
          trabajador.title?.toLowerCase().includes('director') ||
          trabajador.title?.toLowerCase().includes('head')
        );

        const otros = trabajadoresFiltrados.filter(trabajador => trabajador !== jefe);

        setJefeTI(jefe || null);
        setOtrosTrabajadores(otros);
        setTrabajadoresTI(trabajadoresFiltrados);
        
      } catch (err) {
        console.error("❌ Error obteniendo datos del departamento Tecnología y Digitalización:", err);
        setError(err.message);
        setTrabajadoresTI([]);
        setJefeTI(null);
        setOtrosTrabajadores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartamentoTI();
  }, []);

  // Componente del Mapa con toda la información integrada
  const MapCard = () => {
    // URL del mapa con parámetros para deshabilitar controles específicos
    const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3331.987722356774!2d-70.79420392426912!3d-33.38385179259315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662e9b5c4b4b5a5%3A0x5c5c5c5c5c5c5c5c!2sLa%20Martina%200390%2C%20Pudahuel%2C%20Santiago%2C%20Chile!5e0!3m2!1ses!2scl!4v1690000000000!5m2!1ses!2scl&ui=controls`;

    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 overflow-hidden flex flex-col h-full min-h-[500px] group">
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
              className="min-h-[250px]"
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
          <div className="space-y-4">
            {/* Dirección */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
              <FaMapMarkerAlt className="text-blue-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                  Donde nos encontramos
                </div>
                <div className="text-sm font-semibold text-blue-900 break-words">
                  La Martina 0390, Pudahuel, Santiago de Chile
                </div>
              </div>
            </div>

            {/* Horario */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
              <FaClock className="text-green-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
                  Horario de Atención Comercial
                </div>
                <div className="text-sm font-semibold text-green-900 break-words">
                  Lunes a Viernes, 08:15 - 17:30
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500">
              <FaPhone className="text-purple-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
                  Teléfono de atención Comercial
                </div>
                <div className="text-sm font-semibold text-purple-900 break-words">
                  (562) 2544 8222
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente para mostrar los trabajadores del depto Tecnología y Digitalización
  const TrabajadoresTICard = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 h-full">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-indigo-600 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Cargando información...
            </h3>
            <p className="text-sm text-gray-600">
              Obteniendo datos del departamento de Tecnología y Digitalización
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 h-full">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-red-600 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Error al cargar datos
            </h3>
            <p className="text-sm text-red-600 mb-2">
              {error}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Verifica que la API esté disponible</p>
              <p>• Contacta al administrador del sistema</p>
              <p>• Intenta recargar la página</p>
            </div>
          </div>
        </div>
      );
    }

    if (trabajadoresTI.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 h-full">
          <div className="text-center">
            <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <FaInfoCircle className="text-yellow-600 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No hay datos disponibles
            </h3>
            <p className="text-sm text-gray-600">
              No se encontraron trabajadores en el departamento de Tecnología y Digitalización
            </p>
            <p className="text-xs text-gray-500 mt-2">
              El departamento podría tener otro nombre en el sistema
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 h-full">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Para mayor información o dudas de la APP Interactiva contacta con el Depto de Tecnología y Digitalización
          </h3>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {trabajadoresTI.length} trabajador(es) en el Depto de Tecnología y Digitalización
            </p>
          </div>
        </div>

        {/* Jefe del departamento */}
        {jefeTI && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Jefe del Departamento</h4>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-500">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <FaUser className="text-yellow-600 text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 break-words">
                    {jefeTI.givenName} {jefeTI.sn}
                  </h4>
                </div>
                {jefeTI.title && (
                  <p className="text-xs text-yellow-700 font-medium mb-2 break-words">
                    {jefeTI.title}
                  </p>
                )}
                {jefeTI.mail && (
                  <div className="flex items-center gap-2 text-xs">
                    <FaEnvelope className="flex-shrink-0 text-gray-600" />
                    <span className="text-black break-words">
                      {jefeTI.mail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resto del equipo - SIN SCROLL */}
        {otrosTrabajadores.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Equipo de Tecnología y Digitalización</h4>
            <div className="space-y-3">
              {otrosTrabajadores.map((trabajador, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border-l-4 border-indigo-500"
                >
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FaUser className="text-indigo-600 text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 break-words">
                        {trabajador.givenName} {trabajador.sn}
                      </h4>
                    </div>
                    {trabajador.title && (
                      <p className="text-xs text-gray-600 mb-1 break-words">
                        {trabajador.title}
                      </p>
                    )}
                    {trabajador.mail && (
                      <div className="flex items-center gap-2 text-xs">
                        <FaEnvelope className="flex-shrink-0 text-gray-600" />
                        <span className="text-black break-words">
                          {trabajador.mail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  Información de Contacto Envases CMF S.A.
                </h1>
              </div>
            </div>

            {/* Botón de regreso */}
            <button 
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium">Regresar</span>
            </button>
          </div>
          
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Grid con mapa e información integrada */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Mapa con toda la información - ocupa 2/3 del ancho */}
              <div className="lg:col-span-2">
                <MapCard />
              </div>
              
              {/* Información del departamento de TI - ocupa 1/3 del ancho */}
              <div className="lg:col-span-1">
                <TrabajadoresTICard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Info_List;