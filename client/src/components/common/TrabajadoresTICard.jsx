import React, { useEffect, useState } from 'react';
import { FaUser, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import api, { API_BASE_URL } from '../config';

const TrabajadoresTICard = () => {
  const [trabajadoresTI, setTrabajadoresTI] = useState([]);
  const [jefeTI, setJefeTI] = useState(null);
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

        setJefeTI(jefe || null);
        setTrabajadoresTI(trabajadoresFiltrados);
        
      } catch (err) {
        console.error("❌ Error obteniendo datos del departamento Tecnología y Digitalización:", err);
        setError(err.message);
        setTrabajadoresTI([]);
        setJefeTI(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartamentoTI();
  }, []);

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
    </div>
  );
};

export default TrabajadoresTICard;
