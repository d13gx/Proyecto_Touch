import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/apiService';

// Import dinámico de XLSX con manejo de errores
let XLSX = null;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.warn('XLSX no está disponible. La función de exportación a Excel estará deshabilitada.');
}

const PanelAdminContent = ({
  onBack,
  shuffledQuestions
}) => {
  const [allVisitantes, setAllVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visitorToDelete, setVisitorToDelete] = useState(null);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
  const [deletedVisitantes, setDeletedVisitantes] = useState([]);
  const [showTrash, setShowTrash] = useState(false);

  // Filtros de fecha
  const [filterType, setFilterType] = useState('all'); // all, today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const itemsPerPage = 15;

  // Cargar visitantes desde la base de datos
  useEffect(() => {
    const loadVisitantes = async () => {
      try {
        setLoading(true);
        const data = await apiService.getVisitantes();
        const sorted = data.sort((a, b) => b.IDEncuesta - a.IDEncuesta);
        setAllVisitantes(sorted);
        setError(null);
      } catch (err) {
        console.error('Error al cargar visitantes:', err);
        setError('No se pudieron cargar los datos desde la base de datos');
      } finally {
        setLoading(false);
      }
    };
    loadVisitantes();
  }, []);

  // Helpers de fecha
  const parseVisitanteDate = (visitante) => {
    try {
      const raw = visitante.FechaEncuesta;
      if (!raw || typeof raw !== 'string') return null;

      const trimmed = raw.trim();
      if (!trimmed) return null;

      let date = null;

      // Formato DD-MM-YYYY o DD/MM/YYYY
      const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (dmyMatch) {
        date = new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`);
      }

      // Formato YYYY-MM-DD
      const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!date && ymdMatch) {
        date = new Date(`${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`);
      }

      // Fallback genérico
      if (!date) {
        date = new Date(trimmed);
      }

      // Validar que la fecha sea válida
      if (!date || isNaN(date.getTime())) return null;

      return date;
    } catch {
      return null;
    }
  };

  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getWeekStartStr = () => {
    const d = new Date();
    const day = d.getDay(); // 0=Dom
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const getMonthStartStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // Visitantes filtrados por fecha
  const filteredVisitantes = useMemo(() => {
    if (filterType === 'all') return allVisitantes;

    const today = getTodayStr();
    let from = null;
    let to = null;

    if (filterType === 'today') {
      from = today;
      to = today;
    } else if (filterType === 'week') {
      from = getWeekStartStr();
      to = today;
    } else if (filterType === 'month' && selectedMonth) {
      // Usar las fechas del mes seleccionado (ya están en startDate y endDate)
      from = startDate;
      to = endDate;
    } else if (filterType === 'custom') {
      from = startDate;
      to = endDate;
    }

    if (!from && !to) return allVisitantes;

    return allVisitantes.filter((v) => {
      const date = parseVisitanteDate(v);
      if (!date) return false;
      const dateStr = date.toISOString().split('T')[0];
      if (from && dateStr < from) return false;
      if (to && dateStr > to) return false;
      return true;
    });
  }, [allVisitantes, filterType, startDate, endDate, selectedMonth]);

  // Reset página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, startDate, endDate, selectedMonth]);

  // Visitantes de la página actual
  const visitantes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVisitantes.slice(start, start + itemsPerPage);
  }, [filteredVisitantes, currentPage]);

  const totalPages = Math.ceil(filteredVisitantes.length / itemsPerPage);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const loadPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterType = (type) => {
    setFilterType(type);
    if (type !== 'custom' && type !== 'month') {
      setStartDate('');
      setEndDate('');
      setSelectedMonth('');
    }
    setShowMonthDropdown(false);
  };

  const handleMonthSelect = (monthIndex, monthName) => {
    setSelectedMonth(monthName);
    const currentYear = new Date().getFullYear();
    const firstDay = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, monthIndex + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
    setShowMonthDropdown(false);
  };

  const exportToExcel = () => {
    // Verificar si XLSX está disponible
    if (!XLSX) {
      alert('La función de exportación a Excel no está disponible. Por favor, instale las dependencias con "npm install".');
      return;
    }

    const headers = ['Fecha', 'Nombre', 'RUT', 'Teléfono', 'Email', 'Empresa'];

    const rows = filteredVisitantes.map(visitante => [
      visitante.FechaEncuesta,
      visitante.Nombre,
      visitante.RUT,
      visitante.Telefono,
      visitante.Email,
      visitante.Empresa
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Visitantes');

    const fileName = `visitantes_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const deleteSurvey = (id) => {
    const visitante = allVisitantes.find(v => v.IDEncuesta === id);
    if (visitante) {
      setVisitorToDelete(visitante);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (visitorToDelete) {
      // Mover a papelera en lugar de eliminar directamente
      setDeletedVisitantes(prev => [...prev, visitorToDelete]);
      setAllVisitantes(prev => prev.filter(v => v.IDEncuesta !== visitorToDelete.IDEncuesta));
      setShowDeleteModal(false);
      setVisitorToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setVisitorToDelete(null);
  };

  const openPermanentDeleteModal = () => {
    setShowPermanentDeleteModal(true);
  };

  const confirmPermanentDelete = async () => {
    try {
      // Eliminar todos los elementos de la papelera permanentemente de la base de datos
      for (const visitante of deletedVisitantes) {
        await apiService.deleteVisitante(visitante.IDEncuesta);
      }
      // Vaciar papelera local
      setDeletedVisitantes([]);
      setShowPermanentDeleteModal(false);
      setShowTrash(false);
    } catch (error) {
      console.error('Error al vaciar papelera:', error);
      alert('Error al vaciar la papelera');
    }
  };

  const restoreVisitante = (id) => {
    const visitanteToRestore = deletedVisitantes.find(v => v.IDEncuesta === id);
    if (visitanteToRestore) {
      setAllVisitantes(prev => [...prev, visitanteToRestore].sort((a, b) => b.IDEncuesta - a.IDEncuesta));
      setDeletedVisitantes(prev => prev.filter(v => v.IDEncuesta !== id));
    }
  };

  const permanentlyDeleteTrash = async (id) => {
    try {
      // Eliminar permanentemente de la base de datos
      await apiService.deleteVisitante(id);
      // Remover del estado local
      setDeletedVisitantes(prev => prev.filter(v => v.IDEncuesta !== id));
    } catch (error) {
      console.error('Error al eliminar permanentemente:', error);
      alert('Error al eliminar permanentemente el visitante');
    }
  };

  const cancelPermanentDelete = () => {
    setShowPermanentDeleteModal(false);
  };

  const formatHora = (horaEncuesta) => {
    if (!horaEncuesta) return '00:00';
    if (horaEncuesta.includes('T')) {
      const date = new Date(horaEncuesta);
      return date.toLocaleTimeString('es-CL', { hour12: false, hour: '2-digit', minute: '2-digit' });
    }
    return horaEncuesta;
  };

  // Etiqueta del filtro activo
  const filterLabel = {
    all: 'Todos',
    today: 'Hoy',
    week: 'Esta semana',
    month: selectedMonth || 'Mes',
  };

  return (
    <div className="w-full">
      {/* Filtros de fecha */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Filtrar por fecha
        </h2>

        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'today', label: 'Hoy' },
            { key: 'week', label: 'Esta semana' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterType(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                filterType === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
          
          {/* Dropdown de meses */}
          <div className="relative">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1 ${
                filterType === 'month'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {selectedMonth || 'Mes'}
              <svg 
                className={`w-3 h-3 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showMonthDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[150px]">
                <div className="max-h-60 overflow-y-auto">
                  {[
                    { index: 0, name: 'Enero' },
                    { index: 1, name: 'Febrero' },
                    { index: 2, name: 'Marzo' },
                    { index: 3, name: 'Abril' },
                    { index: 4, name: 'Mayo' },
                    { index: 5, name: 'Junio' },
                    { index: 6, name: 'Julio' },
                    { index: 7, name: 'Agosto' },
                    { index: 8, name: 'Septiembre' },
                    { index: 9, name: 'Octubre' },
                    { index: 10, name: 'Noviembre' },
                    { index: 11, name: 'Diciembre' },
                  ].map((month) => (
                    <button
                      key={month.index}
                      onClick={() => {
                        setFilterType('month');
                        handleMonthSelect(month.index, month.name);
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors ${
                        selectedMonth === month.name
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {month.name}
                    </button>
                  ))}
                </div>
                {selectedMonth && (
                  <div className="border-t border-gray-200 p-2">
                    <button
                      onClick={() => {
                        setSelectedMonth('');
                        setStartDate('');
                        setEndDate('');
                        setFilterType('all');
                        setShowMonthDropdown(false);
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Limpiar selección
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-600 text-sm">
          Mostrando: <strong>{filteredVisitantes.length}</strong> de <strong>{allVisitantes.length}</strong> visitas
        </p>

        {/* Rango personalizado */}
        {filterType === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Desde:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">Hasta:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        )}

    
      </div>

      {/* Acciones */}
      {filteredVisitantes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center">
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel {filterType !== 'all' && `(${filteredVisitantes.length})`}
            </button>
            {deletedVisitantes.length > 0 && (
              <button
                onClick={openPermanentDeleteModal}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 flex items-center justify-center relative"
                title="Ver papelera"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {deletedVisitantes.length}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Papelera */}
      {showTrash && deletedVisitantes.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-yellow-800">🗑️ Papelera</h2>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (confirm('¿Está seguro de eliminar permanentemente todos los elementos de la papelera?')) {
                    try {
                      // Eliminar todos los elementos de la papelera permanentemente de la base de datos
                      for (const visitante of deletedVisitantes) {
                        await apiService.deleteVisitante(visitante.IDEncuesta);
                      }
                      // Vaciar papelera local
                      setDeletedVisitantes([]);
                      setShowTrash(false);
                    } catch (error) {
                      console.error('Error al vaciar papelera:', error);
                      alert('Error al vaciar la papelera');
                    }
                  }
                }}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Vaciar papelera
              </button>
              <button
                onClick={() => setShowTrash(false)}
                className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
          <p className="text-yellow-700 mb-4 text-sm">
            Estos visitantes han sido movidos a la papelera. Puedes restaurarlos o eliminarlos permanentemente.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-yellow-100 border-b border-yellow-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">ID Visita</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-yellow-800 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-yellow-200">
                {deletedVisitantes.map((visitante, index) => (
                  <tr key={visitante.IDEncuesta} className={index % 2 === 0 ? 'bg-white' : 'bg-yellow-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{visitante.IDEncuesta}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{visitante.Nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.FechaEncuesta || ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatHora(visitante.HoraEncuesta)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => restoreVisitante(visitante.IDEncuesta)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 text-xs"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={() => permanentlyDeleteTrash(visitante.IDEncuesta)}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla principal */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando visitantes...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      ) : filteredVisitantes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No hay visitantes para este período</p>
          {filterType !== 'all' && (
            <button
              onClick={() => handleFilterType('all')}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >
              Ver todos los visitantes
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitantes.map((visitante, index) => (
                  <tr key={visitante.IDEncuesta} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">{visitante.Nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.RUT}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.Telefono}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.Email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.Empresa}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{visitante.FechaEncuesta || ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatHora(visitante.HoraEncuesta)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteSurvey(visitante.IDEncuesta)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar visitante"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 mb-4 space-x-1">
          <button
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {getVisiblePages().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => loadPage(pageNum)}
              className={`px-3 py-1 rounded font-medium transition-colors text-sm ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal de confirmación */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-8 w-[500px] max-w-[90vw] transform transition-all">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Eliminar visitante</h2>
            <p className="text-gray-600 mb-6 text-base">¿Está seguro de eliminar este visitante?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación permanente */}
      {showPermanentDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-xl p-8 w-[500px] max-w-[90vw] transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-xl font-bold text-red-700">Advertencia</h2>
            </div>
            <p className="text-red-700 mb-6 text-base font-medium">
              Si borras esto se eliminará permanentemente de la base de datos.
            </p>
            <p className="text-gray-600 mb-6 text-sm">
              Esta acción vaciará permanentemente la papelera con {deletedVisitantes.length} elemento{deletedVisitantes.length !== 1 ? 's' : ''} y no se podrá deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelPermanentDelete}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPermanentDelete}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 text-sm transition-colors"
              >
                Eliminar permanentemente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdminContent;