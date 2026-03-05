import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/apiService';

const PanelAdminContent = ({
  onBack,
  shuffledQuestions
}) => {
  const [allVisitantes, setAllVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletedVisitantes, setDeletedVisitantes] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
    if (type === 'month') {
      setShowMonthDropdown(!showMonthDropdown);
    } else {
      setShowMonthDropdown(false);
    }
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

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Nombre', 'RUT', 'Teléfono', 'Email', 'Empresa'];
    shuffledQuestions.forEach(q => {
      headers.push(`Pregunta ${q.id}: ${q.question}`);
    });

    const rows = filteredVisitantes.map(visitante => {
      const row = [
        visitante.IDEncuesta,
        visitante.FechaEncuesta,
        visitante.Nombre,
        visitante.RUT,
        visitante.Telefono,
        visitante.Email,
        visitante.Empresa
      ];
      shuffledQuestions.forEach(() => row.push('No disponible'));
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visitantes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const clearAllSurveys = () => {
    if (confirm('¿Está seguro de mover TODOS los visitantes filtrados a la papelera?')) {
      setDeletedVisitantes(prev => [...prev, ...filteredVisitantes]);
      setAllVisitantes(prev => prev.filter(v => !filteredVisitantes.find(f => f.IDEncuesta === v.IDEncuesta)));
    }
  };

  const deleteSurvey = (id) => {
    if (confirm('¿Está seguro de mover este visitante a la papelera?')) {
      const visitanteToDelete = allVisitantes.find(v => v.IDEncuesta === id);
      if (visitanteToDelete) {
        setDeletedVisitantes(prev => [...prev, visitanteToDelete]);
        setAllVisitantes(prev => prev.filter(v => v.IDEncuesta !== id));
      }
    }
  };

  const restoreVisitante = (id) => {
    const visitanteToRestore = deletedVisitantes.find(v => v.IDEncuesta === id);
    if (visitanteToRestore) {
      setAllVisitantes(prev => [...prev, visitanteToRestore].sort((a, b) => b.IDEncuesta - a.IDEncuesta));
      setDeletedVisitantes(prev => prev.filter(v => v.IDEncuesta !== id));
    }
  };

  const permanentlyDeleteAllTrash = () => {
    if (confirm('¿Está seguro de eliminar PERMANENTEMENTE todos los visitantes de la papelera? Esta acción no se puede deshacer.')) {
      setDeletedVisitantes([]);
    }
  };

  const permanentlyDeleteTrash = (id) => {
    if (confirm('¿Está seguro de eliminar permanentemente este visitante?')) {
      setDeletedVisitantes(prev => prev.filter(v => v.IDEncuesta !== id));
    }
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
    custom: 'Personalizado',
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-gray-600 text-sm">
            Mostrando: <strong>{filteredVisitantes.length}</strong> de <strong>{allVisitantes.length}</strong> visitas
            {filterType !== 'all' && (
              <span className="ml-2 text-blue-600 font-medium">— Filtro: {filterLabel[filterType]}</span>
            )}
          </p>
          {deletedVisitantes.length > 0 && (
            <button
              onClick={() => setShowTrash(!showTrash)}
              className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 text-sm"
            >
              🗑️ Papelera ({deletedVisitantes.length})
            </button>
          )}
        </div>
      </div>

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
            { key: 'month', label: 'Mes' },
            { key: 'custom', label: '📅 Personalizado' },
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

        {/* Dropdown de meses */}
        {showMonthDropdown && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
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
                  onClick={() => handleMonthSelect(month.index, month.name)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMonth === month.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                  }`}
                >
                  {month.name}
                </button>
              ))}
            </div>
            {selectedMonth && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Mes seleccionado: <strong>{selectedMonth}</strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedMonth('');
                    setStartDate('');
                    setEndDate('');
                    setFilterType('all');
                  }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Limpiar selección
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Acciones */}
      {filteredVisitantes.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV {filterType !== 'all' && `(${filteredVisitantes.length})`}
            </button>
            <button
              onClick={clearAllSurveys}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar {filterType !== 'all' ? 'Filtrados' : 'Todas'}
            </button>
            {deletedVisitantes.length > 0 && (
              <button
                onClick={() => setShowTrash(!showTrash)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 text-sm"
              >
                🗑️ Ver Papelera ({deletedVisitantes.length})
              </button>
            )}
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
                        title="Mover a papelera"
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

      {/* Papelera */}
      {showTrash && deletedVisitantes.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-yellow-800">🗑️ Papelera</h2>
            <div className="flex gap-2">
              <button
                onClick={permanentlyDeleteAllTrash}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Eliminar Todos
              </button>
              <button
                onClick={() => setShowTrash(false)}
                className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
          <p className="text-yellow-700 mb-4 text-sm">Estos visitantes han sido movidos a la papelera. Puedes restaurarlos o eliminarlos permanentemente.</p>

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
    </div>
  );
};

export default PanelAdminContent;