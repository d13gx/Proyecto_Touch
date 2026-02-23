import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api.js'; 
import Footer from '../../components/components-seguridad/Footer';
import DatosPersonales from '../../components/components-seguridad/DatosPersonales';
import PreguntasCuestionario from '../../components/components-seguridad/PreguntasCuestionario';
import CuestionarioCompletado from '../../components/components-seguridad/CuestionarioCompletado';
import PanelAdministrativo from '../../components/components-seguridad/PanelAdministrativo';

export default function SurveyApp() {
  
  useEffect(() => {
    // Agregar clase para permitir scroll en móviles
    document.body.classList.add('cuestionario-page');

    return () => {
      // Limpiar clase al salir de la página
      document.body.classList.remove('cuestionario-page');
    };
  }, []);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [savedSurveys, setSavedSurveys] = useState([]);
  const [personalData, setPersonalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Cargar encuestas guardadas al iniciar
  useEffect(() => {
    const surveys = localStorage.getItem('surveys');
    if (surveys) {
      setSavedSurveys(JSON.parse(surveys));
    }
    // Resetear estados al cargar la página
    setShowAdmin(false);
    setSubmitted(false);
    setStep(1);
    setPersonalData(null);
    setErrors({});
  }, []);

  // Cargar preguntas aleatorias cuando se necesita el panel admin
  const loadShuffledQuestions = () => {
    if (shuffledQuestions.length === 0) {
      // Importar y mezclar preguntas aquí
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
    }
  };

  const handleContinueToSurvey = (data) => {
    setPersonalData(data);
    setStep(2);
  };

  const handleSurveyComplete = (surveyData) => {
    const newSurvey = {
      id: Date.now(),
      ...surveyData
    };

    const existingSurveys = [...savedSurveys, newSurvey];
    setSavedSurveys(existingSurveys);
    localStorage.setItem('surveys', JSON.stringify(existingSurveys));
    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setPersonalData(null);
    setErrors({});
  };

  const updateSurveys = (surveys) => {
    setSavedSurveys(surveys);
  };

  // Vista del panel administrativo
  if (showAdmin) {
    loadShuffledQuestions();
    return (
      <PanelAdministrativo
        onBack={() => {
          setShowAdmin(false);
          setStep(1);
          setPersonalData(null);
          setSubmitted(false);
        }}
        shuffledQuestions={shuffledQuestions}
      />
    );
  }

  // Pantalla de éxito
  if (submitted) {
    const lastSurvey = savedSurveys[savedSurveys.length - 1];
    
    return (
      <CuestionarioCompletado
        lastSurvey={lastSurvey}
        onNewSurvey={resetForm}
        onViewAllSurveys={() => {
          resetForm(); // Resetear todo primero
          setShowAdmin(true);
        }}
      />
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      
      
      <div className="flex-1 w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header con botón de admin */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                loadShuffledQuestions();
                setShowAdmin(true);
              }}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg shadow hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Panel de Administración
            </button>
          </div>

          <div className="bg-white rounded-t-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Cuestionario de Seguridad</h1>
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className={step === 1 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Datos Personales</span>
              <span className={step === 2 ? 'text-indigo-600 font-semibold' : 'text-gray-500'}>Preguntas</span>
            </div>
          </div>
          
          {step === 1 && (
            <DatosPersonales
              onContinue={handleContinueToSurvey}
              onReset={resetForm}
            />
          )}

          {step === 2 && personalData && (
            <PreguntasCuestionario
              personalData={personalData}
              onEditData={() => setStep(1)}
              onBack={() => setStep(1)}
              onSurveyComplete={handleSurveyComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
