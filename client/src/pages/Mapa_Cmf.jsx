import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import TimeoutRedirect from "../components/TimeoutRedirect";
import { 
  FaMapMarkerAlt, 
  FaCrosshairs, 
  FaBars, 
  FaArrowLeft
} from "react-icons/fa";

// Íconos personalizados base - SIMPLIFICADO (sin jefatura)
const baseIconos = {
  porteria: "🚪",
  departamento: "🏢",
  gerencia: "💼",
  servicio: "🚻",
  bodega: "📦",
  via: "🛣️",
  estacionamiento: "🅿️",
  fumadores: "🚬",
  segura: "✅",
  inicio: "📍",
  casino: "🍽️",
  cancha: "⚽"
};

// Función helper para obtener texto del filtro
const getFiltroTexto = (filtro) => {
  if (filtro === null) return 'Todas las ubicaciones';
  if (filtro === 'inicio') return 'Punto de inicio';
  return filtro;
};

// Crear ícono mejorado para mejor visualización
const getEmojiIcon = (emoji, zoom, categoria) => {
  const size = Math.max(24, Math.min(40, zoom * 5));
  const isInicio = categoria === 'inicio';
  
  return L.divIcon({
    html: `
      <div style="
        font-size: ${size}px; 
        filter: drop-shadow(2px 2px 6px rgba(0,0,0,0.4));
        ${isInicio ? 'animation: pulse 2s infinite;' : ''}
        position: relative;
      ">
        ${emoji}
        ${isInicio ? `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size * 1.5}px;
            height: ${size * 1.5}px;
            border: 2px solid #ff4444;
            border-radius: 50%;
            animation: ripple 2s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes ripple {
          0% { 
            width: ${size * 1.5}px; 
            height: ${size * 1.5}px;
            opacity: 1;
          }
          100% { 
            width: ${size * 2.5}px; 
            height: ${size * 2.5}px;
            opacity: 0;
          }
        }
      </style>
    `,
    className: "emoji-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size / 2],
  });
};

// Componente Marker SIMPLIFICADO - solo visualización
const SimpleMarker = ({ ubicacion, zoom }) => {
  const [position] = useState([ubicacion.coordenada_y, ubicacion.coordenada_x]);

  return (
    <Marker
      position={position}
      icon={getEmojiIcon(baseIconos[ubicacion.categoria] || baseIconos.departamento, zoom, ubicacion.categoria)}
    >
      <Popup className="custom-popup">
        <div className="p-3 min-w-[200px]">
          <h3 className="font-bold text-lg text-gray-900 mb-2 border-b pb-2">
            {ubicacion.nombre}
          </h3>
          {ubicacion.descripcion && (
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              {ubicacion.descripcion}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              ubicacion.categoria === 'inicio' ? 'bg-red-100 text-red-700 border border-red-300' :
              ubicacion.categoria === 'casino' ? 'bg-pink-100 text-pink-700 border border-pink-300' :
              ubicacion.categoria === 'cancha' ? 'bg-lime-100 text-lime-700 border border-lime-300' :
              'bg-blue-100 text-blue-700 border border-blue-300'
            }`}>
              {ubicacion.categoria}
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

// SidebarCategorias SIMPLIFICADO (sin jefatura)
const SidebarCategorias = ({ 
  isMobileOpen, 
  onToggleMobile, 
  onFiltrarCategoria,
  categoriaActiva
}) => {
  
  // CATEGORÍAS ACTUALIZADAS (sin jefatura)
  const categorias = [
    { key: "inicio", nombre: "Punto de Inicio", icono: "📍", color: "red" },
    { key: "porteria", nombre: "Portería", icono: "🚪", color: "blue" },
    { key: "departamento", nombre: "Departamento", icono: "🏢", color: "green" },
    { key: "gerencia", nombre: "Gerencia", icono: "💼", color: "purple" },
    { key: "servicio", nombre: "Servicio", icono: "🚻", color: "orange" },
    { key: "bodega", nombre: "Bodega", icono: "📦", color: "yellow" },
    { key: "estacionamiento", nombre: "Estacionamiento", icono: "🅿️", color: "indigo" },
    { key: "segura", nombre: "Zona Segura", icono: "✅", color: "emerald" },
    { key: "casino", nombre: "Casino", icono: "🍽️", color: "pink" },
    { key: "cancha", nombre: "Cancha Deportiva", icono: "⚽", color: "lime" },
    { key: "via", nombre: "Vía", icono: "🛣️", color: "gray" },
    { key: "fumadores", nombre: "Área Fumadores", icono: "🚬", color: "brown" }
  ];

  const getColorClass = (color) => {
    const colorMap = {
      red: 'bg-red-100 text-red-700 border-red-300',
      blue: 'bg-blue-100 text-blue-700 border-blue-300',
      green: 'bg-green-100 text-green-700 border-green-300',
      purple: 'bg-purple-100 text-purple-700 border-purple-300',
      orange: 'bg-orange-100 text-orange-700 border-orange-300',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      pink: 'bg-pink-100 text-pink-700 border-pink-300',
      lime: 'bg-lime-100 text-lime-700 border-lime-300',
      gray: 'bg-gray-100 text-gray-700 border-gray-300',
      brown: 'bg-amber-100 text-amber-700 border-amber-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  const handleFiltrar = (categoriaKey) => {
    onFiltrarCategoria(categoriaKey);
  };

  const mostrarTodas = () => {
    onFiltrarCategoria(null);
  };

  return (
    <>
      {/* Botón móvil para mostrar/ocultar sidebar */}
      <button
        onClick={onToggleMobile}
        className="lg:hidden fixed top-24 left-4 z-50 bg-white p-3 rounded-xl shadow-lg border border-gray-200"
      >
        <FaBars className="text-blue-600 text-lg" />
      </button>

      {/* Sidebar */}
      <div className={`
        bg-white rounded-xl shadow-sm p-4 border border-gray-200
        lg:block lg:relative lg:h-full lg:flex lg:flex-col
        ${isMobileOpen ? 'block fixed top-24 left-4 right-4 z-40 h-auto max-h-[70vh] overflow-hidden' : 'hidden'}
      `}>
        {/* Header de la leyenda */}
        <div className="mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Filtros del Mapa</h3>
          <p className="text-sm text-gray-600">Haz clic para filtrar ubicaciones</p>
        </div>

        {/* Botón para mostrar todas las ubicaciones */}
        <button
          onClick={mostrarTodas}
          className={`w-full mb-4 p-3 rounded-lg border-2 text-sm font-medium transition-all flex-shrink-0 ${
            !categoriaActiva 
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {!categoriaActiva ? '✅ Mostrando Todas' : '📋 Mostrar Todas las Ubicaciones'}
        </button>

        {/* Lista de categorías */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="space-y-2">
              {categorias.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => handleFiltrar(cat.key)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                    categoriaActiva === cat.key 
                      ? 'bg-blue-50 border-blue-500 shadow-sm' 
                      : getColorClass(cat.color)
                  } hover:shadow-sm`}
                >
                  <span className="text-lg flex-shrink-0">{cat.icono}</span>
                  <span className="text-sm font-medium flex-1">{cat.nombre}</span>
                  {categoriaActiva === cat.key && (
                    <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full flex-shrink-0">
                      Activo
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para móviles */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onToggleMobile}
        />
      )}
    </>
  );
};

// Componente CenterButton CORREGIDO
const CenterButton = ({ bounds }) => {
  const map = useMap();
  
  const handleCenter = () => {
    if (bounds && bounds[1][0] !== 1000 && bounds[1][1] !== 1000) {
      map.invalidateSize();
      map.fitBounds(bounds, { 
        padding: [10, 10],
        animate: true
      });
    }
  };

  return (
    <button
      className="center-button bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-white z-[1000]"
      onClick={handleCenter}
      style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}
    >
      <FaCrosshairs className="text-lg" />
    </button>
  );
};

// Componente MapController
const MapController = ({ bounds, onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds[1][0] !== 1000 && bounds[1][1] !== 1000) {
      setTimeout(() => {
        map.invalidateSize();
        map.fitBounds(bounds, { 
          padding: [10, 10],
          animate: false
        });
        onMapReady();
      }, 100);
    }
  }, [map, bounds, onMapReady]);

  return null;
};

const MapaCmf = () => {
  const [mapa, setMapa] = useState(null);
  const [bounds, setBounds] = useState([[0, 0], [1000, 1000]]);
  const [zoom, setZoom] = useState(1);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  // FILTRO POR DEFECTO: "inicio"
  const [categoriaFiltrada, setCategoriaFiltrada] = useState("inicio");
  const [isMapReady, setIsMapReady] = useState(false);
  const navigate = useNavigate();
  const mapRef = useRef();

  useEffect(() => {
    const requestOptions = {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    fetch(`${API_BASE_URL}/api/mapas/`, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((mapas) => {
        const mapaCmf = Array.isArray(mapas) ? mapas.find(m => m?.nombre === 'Mapa_Cmf') : null;
        if (!mapaCmf?.id) {
          throw new Error('No se encontró el mapa "Mapa_Cmf"');
        }
        return fetch(`${API_BASE_URL}/api/mapas/${mapaCmf.id}/`, requestOptions);
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setMapa(data);
        const img = new Image();
        img.src = data.imagen;
        img.onload = () => {
          const newBounds = [[0, 0], [img.height, img.width]];
          setBounds(newBounds);
        };
      })
      .catch((err) => console.error("Error al cargar mapa:", err));
  }, []);

  // Filtrar ubicaciones según la categoría seleccionada
  const ubicacionesFiltradas = mapa?.ubicaciones?.filter(u => {
    if (categoriaFiltrada === null) return true;
    return u.categoria === categoriaFiltrada;
  }) || [];

  const handleFiltrarCategoria = (categoriaKey) => {
    setCategoriaFiltrada(categoriaKey === categoriaFiltrada ? null : categoriaKey);
  };

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  if (!mapa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
            <div className="flex flex-col justify-center items-center py-12 px-4 text-gray-600">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-3"></div>
              <div className="text-base font-medium">Cargando mapa...</div>
              <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Header principal */}
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                <FaMapMarkerAlt className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  Mapa Interactivo  
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  {categoriaFiltrada === null 
                    ? '📍 Mostrando todas las ubicaciones' 
                    : categoriaFiltrada === 'inicio' 
                      ? '📍 Mostrando punto de inicio' 
                      : `Filtrado: ${getFiltroTexto(categoriaFiltrada)}`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="h-full">
              {/* Encabezado de resultados */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {categoriaFiltrada === null
                      ? `Mostrando todas las ubicaciones (${ubicacionesFiltradas.length})`
                      : `Filtrado por: ${getFiltroTexto(categoriaFiltrada)}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Haz clic en los marcadores para ver más información
                  </p>
                </div>
              </div>

              {/* Contenedor principal del mapa */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden h-[60vh] min-h-[400px]">
                <div className="flex flex-col lg:flex-row h-full">
                  {/* Sidebar */}
                  <div className="lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200">
                    <SidebarCategorias 
                      isMobileOpen={sidebarMobileOpen}
                      onToggleMobile={() => setSidebarMobileOpen(!sidebarMobileOpen)}
                      onFiltrarCategoria={handleFiltrarCategoria}
                      categoriaActiva={categoriaFiltrada}
                    />
                  </div>

                  {/* Mapa */}
                  <div className="flex-1 relative">
                    <MapContainer
                      ref={mapRef}
                      crs={L.CRS.Simple}
                      bounds={bounds}
                      className="w-full h-full rounded-r-xl"
                      scrollWheelZoom={true}
                      zoomControl={false}
                      whenCreated={(map) => {
                        setZoom(map.getZoom());
                        map.on("zoomend", () => setZoom(map.getZoom()));
                      }}
                    >
                      {mapa?.imagen && <ImageOverlay url={mapa.imagen} bounds={bounds} />}
                      
                      <MapController bounds={bounds} onMapReady={handleMapReady} />
                      
                      {/* Botón de centrar CORREGIDO - ahora recibe bounds como prop */}
                      <CenterButton bounds={bounds} />

                      {/* Marcadores de ubicaciones filtradas - SOLO VISUALIZACIÓN */}
                      {ubicacionesFiltradas.map((u) => (
                        <SimpleMarker
                          key={u.id}
                          ubicacion={u}
                          zoom={zoom}
                        />
                      ))}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapaCmf;