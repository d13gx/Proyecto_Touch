import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api.js';

const surveyQuestions = [
  {
    id: 1,
    question: "¿Cuantas zonas de seguridad hay en CMF según el video?",
    type: "radio",
    options: ["4", "2", "3", "Ninguno"],
    correctAnswer: "4"
  },
  {
    id: 2,
    question: "¿Que nos indican las flechas en los pasos peatonales?",
    type: "radio",
    options: ["Proponer las vías de evacuación optimas mas cercanas", "Marcan áreas donde no es necesario usar elementos de proteccion personal", "Señalan rutas para visitantes sin normas de transito interno", "Indican zonas donde se permite correr dentro de la planta"],
    correctAnswer: "Proponer las vías de evacuación optimas mas cercanas"
  },
  {
    id: 3,
    question: "¿Qué medida preventiva se debe aplicar ante el transito de vehículos?",
    type: "radio",
    options: ["Ir por los pasos peatonales", "Caminar por cualquier zona", "Usar el celular mientras camina", "Correr para cruzar mas rapido"],
    correctAnswer: "Ir por los pasos peatonales"
  }
];

export default function PreguntasCuestionario({ 
  personalData, 
  onEditData,
  onBack,
  onSurveyComplete
}) {
  const [surveyAnswers, setSurveyAnswers] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Aleatorizar las opciones de las preguntas al montar el componente
  useEffect(() => {
    const shuffled = surveyQuestions.map(question => {
      const options = [...question.options];
      const correctAnswer = question.correctAnswer;

      // Mezclar opciones usando Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      return {
        ...question,
        options,
        correctAnswer
      };
    });

    setShuffledQuestions(shuffled);
  }, []);

  const handleSurveyAnswer = (questionId, value, type) => {
    if (type === 'checkbox') {
      const currentAnswers = surveyAnswers[questionId] || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter(v => v !== value)
        : [...currentAnswers, value];
      setSurveyAnswers(prev => ({ ...prev, [questionId]: newAnswers }));
    } else {
      setSurveyAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    
    // Validar que todas las preguntas estén respondidas
    const unansweredQuestions = shuffledQuestions.filter(question => !surveyAnswers[question.id]);
    
    if (unansweredQuestions.length > 0) {
      alert('Por favor responde todas las preguntas antes de enviar el cuestionario.');
      return;
    }
    
    setLocalLoading(true);

    // Calcular resultados y puntaje
    const results = shuffledQuestions.map(question => {
      const userAnswer = surveyAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      return {
        question: question.question,
        userAnswer: userAnswer || 'Sin respuesta',
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect
      };
    });

    const score = results.filter(result => result.isCorrect).length;

    try {
      // Enviar datos personales al backend
      const response = await fetch(`${API_BASE_URL}/api/visitante`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalData
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar los datos del visitante');
      }

      const data = await response.json();
      console.log('Datos del Visitante guardados:', data);

      const surveyData = {
        personalData,
        surveyAnswers,
        results,
        score,
        totalQuestions: shuffledQuestions.length,
        fechaCuestionario: new Date().toISOString()
      };

      setLocalLoading(false);
      onSurveyComplete(surveyData);

    } catch (error) {
      console.error('Error:', error);
      setLocalLoading(false);

      // Si falla el backend, guardar en localStorage como fallback
      const surveyData = {
        personalData,
        surveyAnswers,
        results,
        score,
        totalQuestions: shuffledQuestions.length,
        fechaCuestionario: new Date().toISOString()
      };

      onSurveyComplete(surveyData);
    }
  };
  return (
    
    <form onSubmit={handleSubmitSurvey} className="bg-white rounded-b-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6 bg-indigo-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700"><strong>Nombre:</strong> {personalData.nombre}</p>
        <p className="text-sm text-gray-700"><strong>Empresa:</strong> {personalData.empresa}</p>
        <button
          type="button"
          onClick={onEditData}
          className="text-indigo-600 text-sm mt-2 hover:underline"
        >
          Editar datos
        </button>
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-6">Preguntas del Cuestionario</h2>

      <div className="space-y-6">
        {shuffledQuestions.map((question, index) => (
          <div key={question.id} className="border-b pb-6 last:border-b-0">
            <p className="font-medium text-gray-800 mb-3">
              {index + 1}. {question.question}
            </p>

            {question.type === 'radio' && (
              <div className="space-y-2">
                {question.options.map(option => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={surveyAnswers[question.id] === option}
                      onChange={(e) => handleSurveyAnswer(question.id, e.target.value, 'radio')}
                      className="w-4 h-4 text-indigo-600 bg-white border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={localLoading || shuffledQuestions.some(q => !surveyAnswers[q.id])}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {localLoading ? 'Guardando...' : 'Enviar Cuestionario'}
        </button>
      </div>
    </form>
  );
}
