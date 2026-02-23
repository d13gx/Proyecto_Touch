import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaBuilding, FaUsers, FaUserTie, FaEnvelope, 
  FaPhone, FaArrowLeft, FaCrown, FaMap,
  FaLayerGroup, FaUser, FaPaperPlane, FaCheckCircle,
  FaTimes, FaLightbulb, FaEye, FaEyeSlash, FaKeyboard,
  FaSignInAlt, FaEnvelopeOpen, FaArrowRight
} from "react-icons/fa";
import { API_BASE_URL } from '../config';
import TimeoutRedirect from "../components/TimeoutRedirect"; // 👈 IMPORTAR

export default function Depto_Detail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [departamento, setDepartamento] = useState(null);
  const [trabajadores, setTrabajadores] = useState([]);
  const [vistaActual, setVistaActual] = useState('detalle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ hits: 0, misses: 0 });

  // ✅ REFS optimizados para cache
  const requestInProgress = useRef(false);
  const cacheData = useRef(new Map()); // Cache local
  const lastRequestTime = useRef(0);
  const requestTimeoutRef = useRef(null);

  // URL base importada desde config.js

  // ✅ Función OPTIMIZADA con cache local y manejo inteligente
  const fetchDepartamentoCompleto = useCallback(async (nombreDepartamento, forceRefresh = false) => {
    if (requestInProgress.current) {
      console.log('⏳ Request ya en progreso, ignorando...');
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime.current < 500 && !forceRefresh) {
      console.log('⏳ Debounce: request demasiado rápida');
      return;
    }

    // ✅ Verificar cache local primero (solo si no es forceRefresh)
    if (!forceRefresh && cacheData.current.has(nombreDepartamento)) {
      console.log('✅ CACHE LOCAL HIT:', nombreDepartamento);
      const cachedData = cacheData.current.get(nombreDepartamento);
      setDepartamento(cachedData);
      setTrabajadores(cachedData.trabajadores || []);
      setCacheInfo(prev => ({ ...prev, hits: prev.hits + 1 }));
      setLoading(false);
      return;
    }

    try {
      requestInProgress.current = true;
      lastRequestTime.current = now;
      
      setLoading(true);
      setError(null);
      
      // ✅ Solo usar timestamp para forzar refresh
      const timestamp = forceRefresh ? `&_t=${Date.now()}` : '';
      
      console.log(`🔍 Solicitando datos del departamento: ${nombreDepartamento}`);
      console.log(`🌐 URL de la API: ${API_BASE_URL}/api/departamento-completo/?nombre=${encodeURIComponent(nombreDepartamento)}${timestamp}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout
      
      let response;
      try {
        const url = `${API_BASE_URL}/api/departamento-completo/?nombre=${encodeURIComponent(nombreDepartamento)}${timestamp}`;
        console.log('🌐 Intentando conectar a:', url);
        
        // Intentar con fetch primero
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            signal: controller.signal
          });
          
          console.log('✅ Respuesta recibida. Estado:', response.status);
        } catch (fetchError) {
          // Si falla con fetch, intentar con XMLHttpRequest para mejor diagnóstico
          console.warn('⚠️ Falló fetch, intentando con XMLHttpRequest para diagnóstico...');
          
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, false); // Sincrónico para mejor manejo de errores
          xhr.withCredentials = true;
          
          try {
            xhr.send();
            console.log('📡 Estado XHR:', xhr.status, xhr.statusText);
            
            if (xhr.status === 0) {
              throw new Error('BLOCKED_BY_EXTENSION');
            }
            
            // Si XHR funciona, crear una respuesta compatible con fetch
            response = {
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'content-type': xhr.getResponseHeader('content-type') || 'application/json'
              }),
              json: () => Promise.resolve(JSON.parse(xhr.responseText))
            };
          } catch (xhrError) {
            console.error('❌ Error en XHR:', xhrError);
            
            if (xhr.status === 0 && !xhr.responseText && !navigator.onLine) {
              throw new Error('NO_INTERNET');
            } else if (xhr.status === 0) {
              throw new Error('BLOCKED_BY_EXTENSION');
            } else {
              throw xhrError;
            }
          }
        }
      } catch (err) {
        console.error('🚨 Error de red al conectar con el servidor:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          apiUrl: API_BASE_URL,
          online: navigator.onLine ? 'Sí' : 'No',
          userAgent: navigator.userAgent,
          errorType: err.message === 'BLOCKED_BY_EXTENSION' ? 'EXTENSION_BLOCK' : 'NETWORK_ERROR'
        });
        
        if (err.message === 'BLOCKED_BY_EXTENSION' || err.message.includes('Failed to fetch')) {
          const error = new Error('Parece que una extensión del navegador (como un bloqueador de anuncios) está bloqueando las solicitudes. Por favor, desactiva temporalmente las extensiones o configura una excepción para localhost:8000');
          error.name = 'ExtensionBlockError';
          throw error;
        } else if (err.message === 'NO_INTERNET') {
          throw new Error('No hay conexión a internet. Por favor, verifica tu conexión.');
        } else {
          throw new Error('CONNECTION_ERROR');
        }
      }
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data = await response.json();

      const isCached = response.headers.get('x-cache') === 'HIT';
      if (isCached) {
        console.log('✅ CACHE SERVER HIT departamento:', nombreDepartamento);
        setCacheInfo(prev => ({ ...prev, hits: prev.hits + 1 }));
      } else {
        console.log('❌ CACHE MISS departamento:', nombreDepartamento);
        setCacheInfo(prev => ({ ...prev, misses: prev.misses + 1 }));
      }

      if (data && data.error) {
        setDepartamento(null);
        setError(data.error);
      } else if (data && Object.keys(data).length > 0) {
        // ✅ Guardar en cache local
        cacheData.current.set(nombreDepartamento, data);
        
        setDepartamento(data);
        setTrabajadores(data.trabajadores || []);
        setError(null);
      } else {
        setDepartamento(null);
        setError("No se encontró información del departamento");
      }
    } catch (err) {
      console.error("🚨 Error cargando departamento:", err);
      setDepartamento(null);
      
      let errorMessage = "Error al cargar la información del departamento";
      
      if (err.message === 'CONNECTION_ERROR') {
        errorMessage = "Error de conexión. Por favor verifica tu conexión a internet o contacta al soporte técnico.";
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = "No se pudo conectar con el servidor. Verifica que la URL de la API sea correcta.";
      } else if (err.name === 'AbortError') {
        errorMessage = "La solicitud tardó demasiado tiempo. Por favor intenta nuevamente.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Detalles del error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [API_BASE_URL]);

  // ✅ useEffect optimizado para cache
  useEffect(() => {
    if (location.state?.departamento) {
      const deptoData = location.state.departamento;
      const nombreDepartamento = deptoData.nombre;

      // ✅ Verificar si ya tenemos los datos (evitar re-carga innecesaria)
      if (departamento?.departamento === nombreDepartamento) {
        console.log('✅ Ya tenemos los datos del departamento, evitando re-carga');
        setLoading(false);
        return;
      }

      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);

      // ✅ NO limpiar el estado si es el mismo departamento
      if (departamento?.departamento !== nombreDepartamento) {
        setLoading(true);
        setError(null);
      }
      
      requestInProgress.current = false;

      requestTimeoutRef.current = setTimeout(() => {
        fetchDepartamentoCompleto(nombreDepartamento);
      }, 100);
    } else {
      navigate('/depto-list');
    }

    return () => {
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    };
  }, [location, navigate, fetchDepartamentoCompleto, departamento]);

  // Función para volver atrás
  const volverAtras = () => {
    if (vistaActual === 'equipo') {
      setVistaActual('detalle');
    } else {
      navigate(-1);
    }
  };

  // Función para ir al perfil del trabajador
  const irAlPerfilTrabajador = (correo) => {
    if (!correo) {
      alert("⚠️ Este trabajador no tiene correo registrado.");
      return;
    }
    navigate(`/trabajadores/${encodeURIComponent(correo)}`);
  };

  // Función para ver equipo completo
  const verEquipoCompleto = () => {
    setVistaActual('equipo');
  };

  // ✅ Función para forzar refresh (útil para botón "reintentar")
  const reintentarCarga = () => {
    if (departamento?.departamento) {
      setLoading(true);
      setError(null);
      fetchDepartamentoCompleto(departamento.departamento, true); // forceRefresh = true
    }
  };

  // ✅ Función para limpiar cache específico
  const clearCacheForDepto = (nombreDepartamento) => {
    cacheData.current.delete(nombreDepartamento);
    console.log('🗑️ Cache limpiado para:', nombreDepartamento);
  };

  // Función segura para extraer valores
  const getSafeValue = (value, defaultValue = "No registrado") => {
    if (value === null || value === undefined || value === "" || 
        value === " " || (Array.isArray(value) && value.length === 0)) {
      return defaultValue;
    }
    
    if (Array.isArray(value) && value.length > 0) {
      const firstValue = value[0];
      return getSafeValue(firstValue, defaultValue);
    }
    
    return value;
  };

  // Función para teléfono
  const getTelefonoValue = (telephoneNumber) => {
    const value = getSafeValue(telephoneNumber, "Sin Anexo registrado");
    
    if (!value || value === " " || value === "" || value === "No registrado") {
      return "Sin Anexo registrado";
    }
    
    return value;
  };

  // Generar color único basado en el nombre
  const generateAvatarColor = (name) => {
    if (!name) return "#4F46E5";
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Componente de información de ayuda - MISMOS ESTILOS QUE TRAB_DETAIL
  const HelpTips = ({ title, tips }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <FaLightbulb className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-800 mb-2">{title}</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // Componente de tarjeta de información - MISMOS ESTILOS QUE TRAB_DETAIL
  const InfoCard = ({ icon, title, value, action, className = "" }) => {
    return (
      <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[120px] group ${className}`}>
        <div className="p-4 sm:p-5 flex flex-col h-full">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">{title}</div>
              <div className="text-sm font-semibold text-gray-900 break-words leading-tight">
                {value}
              </div>
            </div>
          </div>
          {action && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-3"></div>
              <div className="text-base font-medium">Cargando información del departamento...</div>
              <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !departamento) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
            <div className="text-center py-12 px-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {error?.includes("no encontrado") ? "Departamento No Encontrado" : "Error del Servidor"}
              </h3>
              <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                {error || "El departamento solicitado no existe."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button 
                  onClick={volverAtras}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Volver atrás
                </button>
                <button
                  onClick={reintentarCarga}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado condicional basado en la vista actual
  const renderCurrentView = () => {
    switch (vistaActual) {
      case 'equipo':
        return renderEquipoView();
      default:
        return renderDetalleView();
    }
  };

  // Vista de detalle del departamento - MISMOS ESTILOS QUE TRAB_DETAIL
  const renderDetalleView = () => {
    if (!departamento) return null;

    // Estados derivados
    const avatarColor = generateAvatarColor(departamento?.departamento);
    const initials = departamento?.departamento ? departamento.departamento.substring(0, 2).toUpperCase() : "DP";

    // Extraer datos del departamento
    const { 
      departamento: nombre, 
      jefe, 
      jefe_completo,
      total_trabajadores = 0,
      trabajadores: listaTrabajadores = []
    } = departamento;

    // Usar datos completos del jefe si están disponibles
    const jefeData = jefe_completo || jefe || {};
    const jefeNombre = jefeData.nombre || `${jefeData.givenName || ''} ${jefeData.sn || ''}`.trim() || 'No asignado';
    const jefeEmail = jefeData.mail || jefeData.email || 'No disponible';
    const jefeTelefono = jefeData.telephoneNumber || jefeData.telefono || 'No disponible';

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
        {/* Header con gradiente - MISMA ALTURA QUE TRAB_DETAIL */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
              <FaBuilding className="text-xl sm:text-2xl md:text-3xl" />
            </div>
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                Perfil del Departamento
              </h1>
            </div>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
          >
            <FaArrowLeft className="text-sm" />
            <span className="font-medium">Regresar</span>
          </button>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Avatar y botón Ver Equipo - MISMA DISPOSICIÓN QUE TRAB_DETAIL */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 md:gap-6 lg:items-center items-start">
              <div
                className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl mx-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight break-words">
                  {nombre}
                </h2>
                <p className="text-lg sm:text-xl text-gray-600 mt-1 break-words">
                  {total_trabajadores} {total_trabajadores === 1 ? 'trabajador' : 'trabajadores'}
                </p>
              </div>
            </div>

            {/* BOTÓN VER EQUIPO - MISMO ESTILO QUE BOTÓN CONTACTAR */}
            <div className="lg:ml-auto lg:mt-0 mt-4 sm:mt-6">
              <button
                onClick={verEquipoCompleto}
                className="relative overflow-hidden group flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-green-300"
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-inner">
                      <FaUsers className="text-xl" />
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <div className="text-lg font-bold tracking-wide drop-shadow-sm">VER EQUIPO COMPLETO</div>
                    <div className="text-sm opacity-90 font-semibold">Clic aquí para explorar</div>
                  </div>
                </div>

                {/* Indicador de cantidad - MISMO ESTILO QUE TRAB_DETAIL */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-white">{total_trabajadores}</span>
                </div>
              </button>
            </div>
          </div>


          {/* Información de cache (para debugging) 
          <div className="mb-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <strong>Cache Info:</strong> Hits: {cacheInfo.hits} | Misses: {cacheInfo.misses} | 
            <button 
              onClick={() => clearCacheForDepto(nombre)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              Limpiar Cache
            </button>
          </div>
          */}

          {/* Grid de información del departamento - MISMA DISTRIBUCIÓN QUE TRAB_DETAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <InfoCard 
              icon={<FaBuilding className="text-lg" />} 
              title="Departamento" 
              value={nombre} 
            />
            
            <InfoCard 
              icon={<FaUserTie className="text-lg" />} 
              title="Jefe de Departamento" 
              value={jefeNombre} 
            />
            
            <InfoCard 
              icon={<FaUsers className="text-lg" />} 
              title="Total de Trabajadores" 
              value={`${total_trabajadores} ${total_trabajadores === 1 ? 'persona' : 'personas'}`} 
            />
            
            <InfoCard 
              icon={<FaEnvelope className="text-lg" />} 
              title="Email de Contacto" 
              value={jefeEmail} 
            />
            
            <InfoCard 
              icon={<FaPhone className="text-lg" />} 
              title="Anexo Telefónico" 
              value={getTelefonoValue(jefeTelefono)} 
            />
          </div>
        </div>
      </div>
    );
  };

  // Vista de equipo completo - IDÉNTICA A SUPERVISA A EN TRAB_DETAIL
  const renderEquipoView = () => {
    if (!departamento) return null;

    const { 
      departamento: nombre,
      total_trabajadores = 0,
      trabajadores: listaTrabajadores = []
    } = departamento;

    const avatarColor = generateAvatarColor(nombre);
    const initials = nombre.substring(0, 2).toUpperCase();

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
              <FaUsers className="text-xl sm:text-2xl md:text-3xl" />
            </div>
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                Equipo del Departamento
              </h1>
            </div>
          </div>

          <button 
            onClick={volverAtras}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
          >
            <FaArrowLeft className="text-sm" />
            <span className="font-medium">Volver al Departamento</span>
          </button>
        </div>
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Botón de regreso para móviles */}
            <div className="mb-6 sm:hidden">
              <button 
                onClick={volverAtras}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl border-2 border-blue-200 w-full justify-center"
              >
                <FaArrowLeft className="text-sm" />
                <span>Volver al Departamento</span>
              </button>
            </div>

            {listaTrabajadores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                {listaTrabajadores.map((persona, idx) => {
                  const personaAvatarColor = generateAvatarColor(`${persona.givenName} ${persona.sn}`);
                  const personaInitials = getInitials(persona.givenName, persona.sn);
                  
                  // Función para obtener iniciales
                  function getInitials(givenName, sn) {
                    const firstName = getSafeValue(givenName, "").charAt(0).toUpperCase();
                    const lastName = getSafeValue(sn, "").charAt(0).toUpperCase();
                    return firstName + lastName;
                  }
                  
                  return (
                    <div key={idx} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[280px] group">
                      <div className="p-4 sm:p-5 flex flex-col h-full">
                        {/* Header con avatar y nombre */}
                        <div className="flex items-center gap-4 mb-4">
                          <div 
                            className="h-16 w-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                            style={{ backgroundColor: personaAvatarColor }}
                          >
                            {personaInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight break-words">
                              {getSafeValue(`${persona.givenName} ${persona.sn}`)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 break-words">
                              {getSafeValue(persona.title, "Sin cargo")}
                            </p>
                          </div>
                        </div>

                        {/* Información del trabajador */}
                        <div className="space-y-3 flex-1">
                          {persona.department && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500">
                              <FaBuilding className="text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Departamento</div>
                                <div className="text-sm font-semibold text-blue-900 break-words">
                                  {persona.department}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {persona.mail && (
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-500">
                              <FaEnvelope className="text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Email</div>
                                <div className="text-sm font-semibold text-green-900 break-words">
                                  {persona.mail}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón Ver Perfil */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
                          <button
                            onClick={() => irAlPerfilTrabajador(persona.mail)}
                            disabled={!persona.mail}
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl active:scale-95 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FaUser className="text-sm" />
                            <span>Ver Perfil Completo</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  No hay trabajadores en este departamento
                </h3>
                <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                  Este departamento no tiene trabajadores asignados actualmente.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
    {/* 👇 AQUÍ VA EL TIMEOUTREDIRECT - NIVEL RAÍZ */}
    <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Botón de regreso para móviles */}
        <div className="mb-4 sm:mb-6 sm:hidden">
          <button 
            onClick={volverAtras}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl border-2 border-blue-200 w-full justify-center"
          >
            <FaArrowLeft className="text-sm" />
            <span>{vistaActual === 'equipo' ? 'Volver al Departamento' : 'Volver atrás'}</span>
          </button>
        </div>

        {/* Contenido principal */}
        {renderCurrentView()}
      </div>
    </div>
  );
}