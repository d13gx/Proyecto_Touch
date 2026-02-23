import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaUsers, FaList, FaChartBar, FaArrowLeft, FaArrowRight, FaUserTie, FaSitemap, FaHome, FaLightbulb, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api, { API_BASE_URL } from '../config';
import TimeoutRedirect from "../components/TimeoutRedirect"; // 👈 IMPORTAR

const Depto_List = () => {
  const [vistaActiva, setVistaActiva] = useState(0);
  const [departamentos, setDepartamentos] = useState([]);
  const [listaDepartamentos, setListaDepartamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [navegacion, setNavegacion] = useState([{ nivel: 'raiz', departamentos: [] }]);
  const [nivelActual, setNivelActual] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);
  
  const navigate = useNavigate();

  // Cache system
  const cacheRef = useRef({
    arbol_jerarquico: { data: null, timestamp: 0, expiry: 15 * 60 * 1000 },
    lista_departamentos: { data: null, timestamp: 0, expiry: 10 * 60 * 1000 }
  });

  // FUNCIONES DE CACHE
  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    let cleaned = false;

    Object.keys(cacheRef.current).forEach(key => {
      if (cacheRef.current[key].data && now - cacheRef.current[key].timestamp > cacheRef.current[key].expiry) {
        cacheRef.current[key].data = null;
        cacheRef.current[key].timestamp = 0;
        cleaned = true;
      }
    });

    return cleaned;
  }, []);

  const cargarDatosVistaActiva = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      cleanupExpiredCache();

      let endpoint = '';
      let cacheKey = '';
      let setDataFunction = null;

      switch (vistaActiva) {
        case 0:
          endpoint = `${API_BASE_URL}/api/arbol-jerarquico/`;
          cacheKey = 'arbol_jerarquico';
          setDataFunction = setDepartamentos;
          break;
        case 1:
          endpoint = `${API_BASE_URL}/api/lista-departamentos/`;
          cacheKey = 'lista_departamentos';
          setDataFunction = setListaDepartamentos;
          break;
        default:
          endpoint = `${API_BASE_URL}/api/arbol-jerarquico/`;
          cacheKey = 'arbol_jerarquico';
          setDataFunction = setDepartamentos;
      }

      const cachedData = cacheRef.current[cacheKey];
      if (cachedData && cachedData.data) {
        if (vistaActiva === 0) {
          const data = cachedData.data.estructura || cachedData.data;
          setDataFunction(Array.isArray(data) ? data : []);
          // Inicializar navegación con los departamentos raíz
          setNavegacion([{ nivel: 'raiz', departamentos: Array.isArray(data) ? data : [] }]);
        } else if (vistaActiva === 1) {
          setDataFunction(cachedData.data.departamentos || []);
        }
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(err => {
        console.error("❌ Error al parsear la respuesta JSON:", err);
        throw new Error("La respuesta del servidor no es un JSON válido");
      });
      cacheRef.current[cacheKey] = {
        data: data,
        timestamp: Date.now(),
        expiry: cacheRef.current[cacheKey].expiry
      };

      if (setDataFunction) {
        if (vistaActiva === 0) {
          const estructura = data.estructura || data || [];
          setDataFunction(Array.isArray(estructura) ? estructura : []);
          // Inicializar navegación con los departamentos raíz
          setNavegacion([{ nivel: 'raiz', departamentos: Array.isArray(estructura) ? estructura : [] }]);
        } else if (vistaActiva === 1) {
          setDataFunction(data.departamentos || []);
        }
      }

    } catch (err) {
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [vistaActiva, cleanupExpiredCache]);

  useEffect(() => {
    cargarDatosVistaActiva();
  }, [cargarDatosVistaActiva]);

  // 🎨 COMPONENTE PARA MANEJAR LA NAVEGACIÓN AL DETALLE
  const handleVerDetalle = (deptoData) => {
    const datosParaDetalle = {
      nombre: deptoData.nombre,
      jefe: deptoData.jefe || null,
      total_personas: deptoData.total_personas || 0,
      ...deptoData
    };

    navigate('/depto-detail', { 
      state: { 
        departamento: datosParaDetalle
      }
    });
  };

  // 🧭 SISTEMA DE NAVEGACIÓN POR TARJETAS
  const navegarHaciaAdelante = (depto) => {
    const subdeptos = depto.subdepartamentos || depto.subordinados || [];
    
    if (subdeptos.length > 0) {
      const nuevaNavegacion = [...navegacion.slice(0, nivelActual + 1)];
      nuevaNavegacion.push({
        nivel: depto.nombre,
        departamentos: subdeptos,
        departamentoPadre: depto
      });
      
      setNavegacion(nuevaNavegacion);
      setNivelActual(nivelActual + 1);
    }
  };

  const navegarHaciaAtras = (nivel) => {
    setNivelActual(nivel);
    setNavegacion(navegacion.slice(0, nivel + 1));
  };

  const volverAlInicio = () => {
    setNivelActual(0);
    setNavegacion([navegacion[0]]);
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

  // Función para normalizar nombres y eliminar duplicados
  const normalizarYFiltrarDepartamentos = (departamentos) => {
    const departamentosUnicos = [];
    const nombresVistos = new Set();

    departamentos.forEach(depto => {
      if (typeof depto === 'string') {
        // Para lista de departamentos (strings)
        const nombreNormalizado = depto.trim().toLowerCase();
        if (!nombresVistos.has(nombreNormalizado)) {
          nombresVistos.add(nombreNormalizado);
          departamentosUnicos.push(depto);
        }
      } else if (depto && depto.nombre) {
        // Para estructura jerárquica (objetos)
        const nombreNormalizado = depto.nombre.trim().toLowerCase();
        if (!nombresVistos.has(nombreNormalizado)) {
          nombresVistos.add(nombreNormalizado);
          departamentosUnicos.push(depto);
        }
      }
    });

    return departamentosUnicos;
  };

  // Componente de información de ayuda
  const HelpTips = () => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <FaLightbulb className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-800 mb-2">Cómo navegar:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Haz clic en una tarjeta</strong> para explorar sus subáreas</li>
            <li>• <strong>Usa el breadcrumb</strong> arriba para volver a niveles anteriores</li>
            <li>• <strong>Tarjetas con flecha</strong> indican que tienen subdepartamentos</li>
            <li>• <strong>Botón "Ver Detalle"</strong> para acceder a información completa</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // 🎴 VISTA DE TARJETAS DE NAVEGACIÓN
  const VistaTarjetasNavegacion = () => {
    const nivelActualData = navegacion[nivelActual];
    const departamentosActuales = nivelActualData?.departamentos || [];
    const departamentosFiltrados = normalizarYFiltrarDepartamentos(departamentosActuales);

    if (!departamentosFiltrados.length) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaBuilding className="text-4xl sm:text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {nivelActual === 0 ? 'No hay departamentos' : 'No hay subáreas'}
          </h3>
          <p className="text-sm text-gray-500">
            {nivelActual === 0 
              ? 'No se encontraron departamentos para mostrar.' 
              : 'Este departamento no tiene subáreas asignadas.'
            }
          </p>
        </div>
      );
    }

    // Tarjeta de departamento compacta
    const DeptoCard = ({ depto }) => {
      const tieneSubdeptos = (depto.subdepartamentos?.length > 0) || (depto.subordinados?.length > 0);
      const subdeptos = depto.subdepartamentos || depto.subordinados || [];
      const jefe = depto.jefe;
      const tieneJefe = jefe?.nombre && !["No identificado", "Jefe por asignar"].includes(jefe.nombre);
      
      const avatarColor = generateAvatarColor(depto.nombre);
      const initials = depto.nombre ? depto.nombre.substring(0, 2).toUpperCase() : "DP";

      return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 group">
                {/* 👇 AGREGAR COMPONENTE */}
      <TimeoutRedirect timeout={60000} redirectTo="/" />
          {/* Header compacto */}
          <div className="flex items-start justify-between mb-3">
            <div 
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => navegarHaciaAdelante(depto)}
            >
              <div 
                className="h-12 w-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base leading-tight break-words group-hover:text-blue-700 transition-colors">
                  {depto.nombre}
                </h3>
                {tieneJefe && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {jefe.nombre}
                  </p>
                )}
              </div>
            </div>
            
            {/* Indicador de navegación */}
            <div className={`flex-shrink-0 transition-transform duration-300 ${
              tieneSubdeptos ? 'group-hover:translate-x-1 text-blue-600' : 'text-gray-400'
            }`}>
              {tieneSubdeptos ? (
                <FaArrowRight className="text-lg" />
              ) : (
                <FaUserTie className="text-lg" />
              )}
            </div>
          </div>

          {/* Información compacta */}
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-1 text-gray-600">
              <FaUsers className="text-blue-500" />
              <span className="font-semibold text-blue-700">{depto.total_personas || 0}</span>
              <span className="text-gray-500 ml-1">personas</span>
            </div>
            
            {tieneSubdeptos && (
              <div className="flex items-center gap-1 text-gray-600">
                <FaSitemap className="text-green-500" />
                <span className="font-semibold text-green-700">{subdeptos.length}</span>
                <span className="text-gray-500 ml-1">subáreas</span>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={() => handleVerDetalle(depto)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium flex-1 justify-center"
            >
              <FaEye className="text-xs" />
              <span>Ver Detalle</span>
            </button>
            
            {tieneSubdeptos && (
              <button
                onClick={() => navegarHaciaAdelante(depto)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-medium flex-1 justify-center"
              >
                <FaSitemap className="text-xs" />
                <span>Explorar</span>
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Breadcrumb de navegación */}
        {nivelActual > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={volverAlInicio}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <FaHome className="text-sm" />
                <span>Inicio</span>
              </button>
              
              {navegacion.slice(1, nivelActual + 1).map((nivel, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => navegarHaciaAtras(index + 1)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors truncate max-w-[200px]"
                  >
                    <FaBuilding className="text-sm flex-shrink-0" />
                    <span className="truncate">{nivel.nivel}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NUEVO HEADER CON INFORMACIÓN DEL DEPARTAMENTO PADRE */}
        {nivelActual > 0 && navegacion[nivelActual].departamentoPadre && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  {navegacion[nivelActual].departamentoPadre.nombre}
                </h2>
                
                <div className="flex flex-wrap gap-4 text-sm">
                  {navegacion[nivelActual].departamentoPadre.jefe?.nombre && 
                    !["No identificado", "Jefe por asignar"].includes(navegacion[nivelActual].departamentoPadre.jefe.nombre) && (
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                      <FaUserTie className="text-blue-200" />
                      <span className="text-blue-100">
                        Jefe: {navegacion[nivelActual].departamentoPadre.jefe.nombre}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                    <FaUsers className="text-blue-200" />
                    <span className="text-blue-100">
                      {navegacion[nivelActual].departamentoPadre.total_personas || 0} personas
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                    <FaSitemap className="text-blue-200" />
                    <span className="text-blue-100">
                      {departamentosFiltrados.length} subáreas
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleVerDetalle(navegacion[nivelActual].departamentoPadre)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                  <FaEye className="text-sm" />
                  <span>Ver Detalle</span>
                </button>
                
                <button
                  onClick={() => navegarHaciaAtras(nivelActual - 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors font-medium text-sm border border-white/30"
                >
                  <FaArrowLeft className="text-sm" />
                  <span>Volver</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Título del nivel actual (solo para nivel raíz) */}
        {nivelActual === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Estructura Organizacional
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {departamentosFiltrados.length} {departamentosFiltrados.length === 1 ? 'departamento' : 'departamentos'} principal{departamentosFiltrados.length === 1 ? '' : 'es'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departamentosFiltrados.map((depto, index) => (
            <DeptoCard key={`${depto.nombre}-${index}`} depto={depto} />
          ))}
        </div>
      </div>
    );
  };

  // 📋 VISTA DE LISTA MEJORADA CON TARJETAS AGRUPADAS Y PAGINACIÓN
  const VistaListaOptimizada = () => {
    const DEPARTAMENTOS_POR_PAGINA = 9;

    if (!listaDepartamentos?.length) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FaList className="text-4xl sm:text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No hay departamentos</h3>
          <p className="text-sm text-gray-500">No se encontraron departamentos en la lista.</p>
        </div>
      );
    }

    // Ordenar y filtrar departamentos
    const departamentosFiltrados = normalizarYFiltrarDepartamentos(listaDepartamentos);
    const departamentosOrdenados = [...departamentosFiltrados].sort((a, b) => 
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    // Calcular paginación
    const totalPaginas = Math.ceil(departamentosOrdenados.length / DEPARTAMENTOS_POR_PAGINA);
    const inicio = paginaActual * DEPARTAMENTOS_POR_PAGINA;
    const fin = inicio + DEPARTAMENTOS_POR_PAGINA;
    const departamentosPagina = departamentosOrdenados.slice(inicio, fin);

    // Navegación de páginas
    const irAPaginaSiguiente = () => {
      if (paginaActual < totalPaginas - 1) {
        setPaginaActual(paginaActual + 1);
      }
    };

    const irAPaginaAnterior = () => {
      if (paginaActual > 0) {
        setPaginaActual(paginaActual - 1);
      }
    };

    const irAPagina = (pagina) => {
      setPaginaActual(pagina);
    };

    // Componente de tarjeta para lista de departamentos (MISMO DISEÑO QUE ESTRUCTURA)
    const DeptoListCard = ({ nombre }) => {
      const avatarColor = generateAvatarColor(nombre);
      const initials = nombre ? nombre.substring(0, 2).toUpperCase() : "DP";

      return (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-4 transition-all duration-300 hover:shadow-lg hover:border-blue-300 group">
          {/* Header compacto - Mismo diseño que estructura */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div 
                className="h-12 w-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base leading-tight break-words group-hover:text-blue-700 transition-colors">
                  {nombre}
                </h3>
              </div>
            </div>
            
            {/* Indicador de acción - Mismo diseño que estructura */}
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1 text-blue-600">
              <FaEye className="text-lg" />
            </div>
          </div>

          {/* Información compacta - Mismo diseño que estructura */}
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-1 text-gray-600">
              <FaUsers className="text-blue-500" />
              <span className="font-semibold text-blue-700">-</span>
              <span className="text-gray-500 ml-1">personas</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-600">
              <FaSitemap className="text-green-500" />
              <span className="font-semibold text-green-700">-</span>
              <span className="text-gray-500 ml-1">subáreas</span>
            </div>
          </div>

          {/* Botón de acción - Mismo diseño que estructura */}
          <div className="flex gap-2">
            <button
              onClick={() => handleVerDetalle({ nombre })}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium flex-1 justify-center"
            >
              <FaEye className="text-xs" />
              <span>Ver Detalle</span>
            </button>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Lista de Departamentos</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                {departamentosOrdenados.length} departamentos únicos • Ordenados alfabéticamente
              </p>
            </div>
            
            {/* Contador de páginas */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-blue-700">
                Página {paginaActual + 1} de {totalPaginas}
              </span>
            </div>
          </div>
        </div>

        {/* Grid de tarjetas - Mismo diseño que estructura */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {departamentosPagina.map((depto, index) => (
            <DeptoListCard key={`${depto}-${inicio + index}`} nombre={depto} />
          ))}
        </div>

        {/* Navegación entre páginas */}
        {totalPaginas > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl p-4 border border-gray-200">
            {/* Información de paginación */}
            <div className="text-sm text-gray-600">
              Mostrando {inicio + 1}-{Math.min(fin, departamentosOrdenados.length)} de {departamentosOrdenados.length} departamentos
            </div>

            {/* Controles de navegación */}
            <div className="flex items-center gap-2">
              {/* Botón anterior */}
              <button
                onClick={irAPaginaAnterior}
                disabled={paginaActual === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  paginaActual === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <FaChevronLeft className="text-sm" />
                <span className="text-sm font-medium">Anterior</span>
              </button>

              {/* Indicadores de página (para pantallas grandes) */}
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                  let pagina;
                  if (totalPaginas <= 5) {
                    pagina = i;
                  } else if (paginaActual <= 2) {
                    pagina = i;
                  } else if (paginaActual >= totalPaginas - 3) {
                    pagina = totalPaginas - 5 + i;
                  } else {
                    pagina = paginaActual - 2 + i;
                  }

                  return (
                    <button
                      key={pagina}
                      onClick={() => irAPagina(pagina)}
                      className={`w-10 h-10 rounded-lg transition-colors text-sm font-medium ${
                        pagina === paginaActual
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pagina + 1}
                    </button>
                  );
                })}
              </div>

              {/* Indicador de página para móviles */}
              <div className="md:hidden bg-gray-100 px-3 py-2 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {paginaActual + 1} / {totalPaginas}
                </span>
              </div>

              {/* Botón siguiente */}
              <button
                onClick={irAPaginaSiguiente}
                disabled={paginaActual === totalPaginas - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  paginaActual === totalPaginas - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <span className="text-sm font-medium">Siguiente</span>
                <FaChevronRight className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 🔄 COMPONENTE PRINCIPAL
  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
    {/* 👇 AQUÍ VA EL TIMEOUTREDIRECT - NIVEL RAÍZ */}
    <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
            {/* Título e icono en la parte azul */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                <FaBuilding className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  Estructura Organizacional Envases CMF S.A.
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
          
          <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            {/* Información de ayuda - Solo se muestra en el nivel raíz sin datos */}
            {!loading && !error && vistaActiva === 0 && nivelActual === 0 && navegacion[0]?.departamentos.length === 0 && <HelpTips />}

            {/* Tabs mejorados - Solo Estructura y Departamentos */}
            <div className="flex flex-col sm:flex-row gap-2 bg-gray-100 p-2 rounded-xl sm:rounded-2xl mb-6">
              {[
                { label: 'Estructura', icon: <FaBuilding className="text-base sm:text-lg" /> },
                { label: 'Departamentos', icon: <FaList className="text-base sm:text-lg" /> }
              ].map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setVistaActiva(index);
                    setPaginaActual(0); // Resetear paginación al cambiar vista
                    // Resetear navegación al cambiar a estructura
                    if (index === 0) {
                      setNivelActual(0);
                      setNavegacion([{ nivel: 'raiz', departamentos: departamentos }]);
                    }
                  }}
                  className={`
                    flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base font-semibold flex-1 justify-center
                    ${vistaActiva === index 
                      ? 'bg-white text-blue-700 shadow-lg' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-white/50'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Contenido de la vista activa */}
            <div className="min-h-[50vh]">
              {loading ? (
                <div className="flex flex-col justify-center items-center py-12 px-4 text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-3"></div>
                  <div className="text-base font-medium">Cargando información...</div>
                  <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 px-4">
                  <div className="text-5xl mb-3">⚠️</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Error del Servidor
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                    {error}
                  </p>
                  <button 
                    onClick={cargarDatosVistaActiva}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div>
                  {vistaActiva === 0 && <VistaTarjetasNavegacion />}
                  {vistaActiva === 1 && <VistaListaOptimizada />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Depto_List;