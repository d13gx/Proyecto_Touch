import React from 'react';

export default function CuestionarioCompletado({ 
  lastSurvey, 
  onNewSurvey, 
  onViewAllSurveys 
}) {
  const score = lastSurvey?.score || 0;
  const totalQuestions = lastSurvey?.totalQuestions || 0;
  const results = lastSurvey?.results || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-6 text-center">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Cuestionario Completado!</h2>

        {/* Información del usuario */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-center">Información del Participante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600"><strong>Nombre:</strong> {lastSurvey?.personalData?.nombre || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>RUT:</strong> {lastSurvey?.personalData?.rut || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600"><strong>Teléfono:</strong> {lastSurvey?.personalData?.telefono || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Empresa:</strong> {lastSurvey?.personalData?.empresa || 'N/A'}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600"><strong>Email:</strong> {lastSurvey?.personalData?.email || 'N/A'}</p>
            <p className="text-sm text-gray-600"><strong>Fecha de Cuestionario:</strong> {new Date(lastSurvey?.fechaCuestionario || Date.now()).toLocaleString('es-CL')}</p>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 text-center">Tus Resultados</h3>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-indigo-600">{score}/{totalQuestions}</p>
            <p className="text-gray-600">Respuestas correctas</p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              {Math.round((score / totalQuestions) * 100)}% de acierto
            </p>
          </div>
        </div>

        {/* Detalle de respuestas */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Revisión de Respuestas:</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded-lg ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="font-medium text-gray-800 text-sm mb-2">{result.question}</p>
                <div className="text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Tu respuesta:</span> {result.userAnswer || 'Sin respuesta'}
                  </p>
                  {!result.isCorrect && (
                    <p className="text-green-700 font-medium">
                      <span className="font-medium">Respuesta correcta:</span> {result.correctAnswer}
                    </p>
                  )}
                </div>
                {result.isCorrect && (
                  <div className="mt-1">
                    <span className="text-green-600 text-sm font-medium">✓ Correcto</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onNewSurvey}
            className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Nuevo Cuestionario
          </button>
          <button
            onClick={onViewAllSurveys}
            className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          >
            Ver Todos los Cuestionarios 
          </button>
        </div>
      </div>
    </div>
  );
}
