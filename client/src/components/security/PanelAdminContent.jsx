import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const PanelAdminContent = ({
  onBack,
  shuffledQuestions
}) => {
  const [visitantes, setVisitantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletedVisitantes, setDeletedVisitantes] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  // Cargar visitantes desde la base de datos
  useEffect(() => {
    const loadVisitantes = async () => {
      try {
        setLoading(true);
        const data = await apiService.getVisitantes();
        setVisitantes(data);
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

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Nombre', 'RUT', 'Teléfono', 'Email', 'Empresa'];

    // Agregar headers de preguntas
    shuffledQuestions.forEach(q => {
      headers.push(`Pregunta ${q.id}: ${q.question}`);
    });

    const rows = visitantes.map(visitante => {
      const row = [
        visitante.IDEncuesta,
        visitante.FechaEncuesta,
        visitante.Nombre,
        visitante.RUT,
        visitante.Telefono,
        visitante.Email,
        visitante.Empresa
      ];

      // Agregar espacios para respuestas (ya que no están guardadas en la base de datos actual)
      shuffledQuestions.forEach(() => {
        row.push('No disponible');
      });

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
    if (confirm('¿Está seguro de mover TODOS los visitantes a la papelera?')) {
      setDeletedVisitantes([...deletedVisitantes, ...visitantes]);
      setVisitantes([]);
    }
  };

  const deleteSurvey = (id) => {
    if (confirm('¿Está seguro de mover este visitante a la papelera?')) {
      const visitanteToDelete = visitantes.find(v => v.IDEncuesta === id);
      if (visitanteToDelete) {
        setDeletedVisitantes([...deletedVisitantes, visitanteToDelete]);
        const updated = visitantes.filter(v => v.IDEncuesta !== id);
        setVisitantes(updated);
      }
    }
  };

  const restoreVisitante = (id) => {
    const visitanteToRestore = deletedVisitantes.find(v => v.IDEncuesta === id);
    if (visitanteToRestore) {
      setVisitantes([...visitantes, visitanteToRestore]);
      const updated = deletedVisitantes.filter(v => v.IDEncuesta !== id);
      setDeletedVisitantes(updated);
    }
  };

  const permanentlyDeleteAllTrash = () => {
    if (confirm('¿Está seguro de eliminar PERMANENTEMENTE todos los visitantes de la papelera? Esta acción no se puede deshacer.')) {
      setDeletedVisitantes([]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <button
            onClick={onBack}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Volver a Cuestionario
          </button>
        </div>
        <p className="text-gray-600">Total de visitantes guardados: <strong>{visitantes.length}</strong></p>
        {deletedVisitantes.length > 0 && (
          <button
            onClick={() => setShowTrash(!showTrash)}
            className="ml-4 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 text-sm"
          >
            🗑️ Papelera ({deletedVisitantes.length})
          </button>
        )}
      </div>

      {visitantes.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar a CSV
            </button>
            <button
              onClick={clearAllSurveys}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Todas
            </button>
            {deletedVisitantes.length > 0 && (
              <button
                onClick={() => setShowTrash(!showTrash)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Papelera ({deletedVisitantes.length})
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Cargando datos desde la base de datos...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-500 text-lg mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Reintentar
          </button>
        </div>
      ) : visitantes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No hay visitantes guardados</p>
        </div>
      ) : (
        <div className="space-y-8">
          {visitantes.map((visitante) => (
            <div key={visitante.IDEncuesta} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{visitante.Nombre}</h3>
                  <p className="text-sm text-gray-500">
                    {visitante.FechaEncuesta}
                  </p>
                </div>
                <button
                  onClick={() => deleteSurvey(visitante.IDEncuesta)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600"><strong>RUT:</strong> {visitante.RUT}</p>
                  <p className="text-sm text-gray-600"><strong>Teléfono:</strong> {visitante.Telefono}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600"><strong>Email:</strong> {visitante.Email}</p>
                  <p className="text-sm text-gray-600"><strong>Empresa:</strong> {visitante.Empresa}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-700 mb-3">Información:</h4>
                <p className="text-sm text-gray-600">
                  <strong>ID de Visita:</strong> {visitante.IDEncuesta}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Papelera */}
      {showTrash && deletedVisitantes.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-800">🗑️ Papelera</h2>
            <div className="flex gap-2">
              <button
                onClick={permanentlyDeleteAllTrash}
                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm"
              >
                Vaciar Papelera
              </button>
              <button
                onClick={() => setShowTrash(false)}
                className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
          <p className="text-yellow-700 mb-4">Estos visitantes han sido movidos a la papelera. Puedes restaurarlos o eliminarlos permanentemente.</p>
          
          <div className="space-y-3">
            {deletedVisitantes.map((visitante) => (
              <div key={visitante.IDEncuesta} className="bg-white border border-yellow-300 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{visitante.Nombre}</h4>
                    <p className="text-sm text-gray-600">{visitante.FechaEncuesta}</p>
                    <p className="text-sm text-gray-500">RUT: {visitante.RUT} | Empresa: {visitante.Empresa}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreVisitante(visitante.IDEncuesta)}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm"
                      title="Restaurar"
                    >
                      ↩️ Restaurar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdminContent;
