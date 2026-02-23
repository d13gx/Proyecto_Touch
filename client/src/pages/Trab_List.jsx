import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TouchKeyboard from "../components/Keyboard";
import { FaSearch, FaUser, FaBuilding, FaBriefcase, FaKeyboard, FaTimes, FaUsers, FaArrowLeft, FaArrowRight, FaLightbulb } from "react-icons/fa";
import TimeoutRedirect from "../components/TimeoutRedirect"; // 
import api, { API_BASE_URL } from '../config';

export function Trab_List() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({ hits: 0, misses: 0 });
  const [currentPage, setCurrentPage] = useState(0);

  // REFS para prevenir duplicados y debounce
  const requestInProgress = useRef(false);
  const searchTimeoutRef = useRef(null);
  const lastSearchRef = useRef("");

  const navigate = useNavigate();
  // API_BASE_URL is already imported from config

  // Cache en memoria para búsquedas
  const searchCache = useRef(new Map());

  const handleKeyboardInput = (input) => {
    setSearch(input);
    if (input.trim() !== "") {
      setHasSearched(true);
    }
    setCurrentPage(0);
  };

  // Función optimizada para búsqueda con CACHE
  const searchWorkers = useCallback(async (query) => {
    if (query.trim() === "") {
      setResults([]);
      setHasSearched(false);
      setCurrentPage(0);
      return;
    }

    if (requestInProgress.current) {
      console.log(' Búsqueda ya en progreso, ignorando...');
      return;
    }

    const cacheKey = `search_${query.toLowerCase().trim()}`;
    const cachedResult = searchCache.current.get(cacheKey);
    
    if (cachedResult) {
      console.log(' CACHE HIT búsqueda:', query);
      setCacheInfo(prev => ({ ...prev, hits: prev.hits + 1 }));
      setResults(cachedResult);
      setHasSearched(true);
      setLoading(false);
      setCurrentPage(0);
      return;
    }

    setLoading(true);
    requestInProgress.current = true;
    
    try {
      console.log(' CACHE MISS búsqueda:', query);
      setCacheInfo(prev => ({ ...prev, misses: prev.misses + 1 }));

      const response = await fetch(`${API_BASE_URL}/api/ldap/search/?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (Array.isArray(data)) {
        const trabajadoresFiltrados = data.filter((t) => {
          const cuentaActiva = t.userAccountControl_enabled === true;
          const compañiaCorrecta = t.company === "Envases CMF S.A.";
          const tieneCargo = t.title && t.title.trim() !== "";
          const tieneDepartamento = t.department && t.department.trim() !== "";

          return cuentaActiva && compañiaCorrecta && tieneCargo && tieneDepartamento;
        });
        
        searchCache.current.set(cacheKey, trabajadoresFiltrados);
        
        if (searchCache.current.size > 50) {
          const firstKey = searchCache.current.keys().next().value;
          searchCache.current.delete(firstKey);
        }
        
        setResults(trabajadoresFiltrados);
        setHasSearched(true);
        setCurrentPage(0);
      } else if (data.error) {
        console.error("Error LDAP:", data.error);
        setResults([]);
        setHasSearched(true);
        setCurrentPage(0);
      }
    } catch (err) {
      console.error("Error fetch LDAP:", err);
      setResults([]);
      setHasSearched(true);
      setCurrentPage(0);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, []);

  // ✅ Debounce optimizado con cache
  useEffect(() => {
    const query = search.trim();
    
    if (query === "") {
      setResults([]);
      setHasSearched(false);
      setCurrentPage(0);
      return;
    }

    if (query === lastSearchRef.current) {
      return;
    }
    
    lastSearchRef.current = query;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const minLength = 2;
    const delay = query.length >= 3 ? 300 : 500;

    searchTimeoutRef.current = setTimeout(() => {
      if (query.length >= minLength) {
        searchWorkers(query);
      } else if (query.length > 0) {
        setResults([]);
        setHasSearched(true);
        setCurrentPage(0);
      }
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, searchWorkers]);

  const generateAvatarColor = (name) => {
    if (!name) return "#4F46E5";
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  const handleClearSearch = () => {
    setSearch("");
    setHasSearched(false);
    setResults([]);
    lastSearchRef.current = "";
    setCurrentPage(0);
  };

  const handleInputClick = () => {
    setShowKeyboard(true);
  };

  // Configuración de paginación
  const CARDS_PER_PAGE = 4;
  const totalPages = Math.ceil(results.length / CARDS_PER_PAGE);
  const startIndex = currentPage * CARDS_PER_PAGE;
  const endIndex = startIndex + CARDS_PER_PAGE;
  const currentResults = results.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Componente de input con cursor personalizado - VERSIÓN CORREGIDA
  const SearchInputWithCursor = () => {
    return (
      <div className="relative">
        {/* Input real pero invisible */}
        <input
          type="text"
          inputMode="none"
          onFocus={(e) => e.target.blur()}
          readOnly
          onClick={handleInputClick}
          placeholder=""
          value={search}
          className="w-full p-4 pl-12 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none text-lg bg-white transition-all duration-200 min-h-[60px] text-transparent caret-transparent"
          style={{ fontSize: '18px' }}
        />
        
        {/* Icono de búsqueda */}
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 text-xl" />
        
        {/* Texto visible con la misma tipografía que el resto de la app */}
        <div 
          className="absolute left-12 top-1/2 transform -translate-y-1/2 text-lg text-gray-900 pointer-events-none flex items-center w-[calc(100%-6rem)] overflow-hidden"
          style={{ fontSize: '18px' }}
        >
          {search || <span className="text-gray-500">Escribe el nombre del trabajador...</span>}
          {showKeyboard && (
            <span className="ml-0.5 w-0.5 h-6 bg-blue-500 animate-pulse"></span>
          )}
        </div>
        
        {/* Botón para limpiar */}
        {search && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <FaTimes className="text-lg" />
          </button>
        )}
      </div>
    );
  };

  // Tarjeta de trabajador
  const WorkerCard = ({ worker, index }) => {
    const avatarColor = generateAvatarColor(`${worker.givenName} ${worker.sn}`);
    const initials = `${worker.givenName?.charAt(0) || ''}${worker.sn?.charAt(0) || ''}`;
    
    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[280px] group">
        <div className="p-4 sm:p-5 flex flex-col h-full">
          {/* Header con avatar y nombre */}
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="h-16 w-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-tight break-words">
                {worker.givenName} {worker.sn}
              </h3>
            </div>
          </div>

          {/* Información del trabajador */}
          <div className="space-y-3 flex-1">
            {worker.title && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border-l-4 border-orange-500">
                <FaBriefcase className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-orange-700 uppercase tracking-wide">Cargo</div>
                  <div className="text-sm font-semibold text-orange-900 break-words">
                    {worker.title}
                  </div>
                </div>
              </div>
            )}
            
            {worker.department && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-500">
                <FaBuilding className="text-green-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Departamento</div>
                  <div className="text-sm font-semibold text-green-900 break-words">
                    {worker.department}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botón Ver Perfil */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
            <Link
              to={`/trabajadores/${encodeURIComponent(worker.mail)}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl active:scale-95 group-hover:shadow-md"
            >
              <FaUser className="text-sm" />
              <span>Ver Perfil Completo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Componente de información de ayuda
  const HelpTips = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <FaLightbulb className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-800 mb-2">Consejos para una búsqueda efectiva:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Escribe al menos <strong>2 letras</strong> para iniciar la búsqueda</li>
            <li>• Puedes buscar por <strong>nombre, apellido o ambos</strong></li>
            <li>• La búsqueda es <strong>flexible</strong> y encuentra coincidencias parciales</li>
            <li>• Usa el <strong>teclado virtual</strong> para una escritura más cómoda</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        {/* 👇 AGREGAR COMPONENTE */}
        <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
            {/* Título e icono en la parte azul */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                <FaUsers className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  Buscador de Trabajadores Envases CMF S.A.
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
            {/* Información de ayuda - Solo se muestra cuando no hay búsqueda activa */}
            {!hasSearched && !loading && results.length === 0 && <HelpTips />}

            {/* Barra de búsqueda mejorada */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 border-2 border-gray-200 mb-6">
              <div className="relative mb-4">
                <SearchInputWithCursor />
              </div>

              {/* Botón para mostrar/ocultar teclado */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowKeyboard(!showKeyboard)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-sm font-medium"
                >
                  <FaKeyboard />
                  {showKeyboard ? "Ocultar Teclado" : "Mostrar Teclado"}
                </button>
              </div>

              {/* Teclado personalizado */}
              {showKeyboard && (
                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                  <TouchKeyboard onChange={handleKeyboardInput} input={search} />
                </div>
              )}
            </div>

            {/* Contenido de resultados con paginación */}
            <div>
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12 px-4 text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-3"></div>
                  <div className="text-base font-medium">Buscando trabajadores...</div>
                  <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
                </div>
              ) : results.length > 0 ? (
                <div>
                  {/* Información de paginación */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                        Resultados de búsqueda ({results.length})
                      </h2>
                      <p className="text-sm text-gray-600">
                        Página {currentPage + 1} de {totalPages} - Mostrando {currentResults.length} de {results.length} trabajadores
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          currentPage === 0 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <FaArrowLeft className="text-sm" />
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages - 1}
                        className={`p-2 rounded-lg transition-colors duration-300 ${
                          currentPage === totalPages - 1 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <FaArrowRight className="text-sm" />
                      </button>
                      <button
                        onClick={handleClearSearch}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                  
                  {/* Grid de tarjetas - Siempre 4 por página */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    {currentResults.map((worker, index) => (
                      <WorkerCard key={`${worker.mail}-${index}`} worker={worker} index={index} />
                    ))}
                  </div>

                  {/* Indicadores de página para móviles */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={`w-3 h-3 rounded-full transition-colors ${
                            i === currentPage ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : hasSearched ? (
                <div className="text-center py-8 px-4">
                  <div className="text-5xl mb-3">🔍</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    No se encontraron trabajadores
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                    No encontramos resultados para "<strong>{search}</strong>"
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={handleClearSearch}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Nueva Búsqueda
                    </button>
                    <button
                      onClick={() => setShowKeyboard(true)}
                      className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      Abrir Teclado
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="text-5xl mb-3">👋</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Bienvenido al Buscador
                  </h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
                    Comienza escribiendo el nombre o apellido del trabajador que buscas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}