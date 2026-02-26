import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api.js'; 
import Footer from '../../components/components-seguridad/Footer.jsx';
import DatosPersonales from '../../components/components-seguridad/DatosPersonales.jsx';
import PreguntasCuestionario from '../../components/components-seguridad/PreguntasCuestionario.jsx';
import CuestionarioCompletado from '../../components/components-seguridad/CuestionarioCompletado.jsx';
import PanelAdministrativo from '../../components/components-seguridad/PanelAdministrativo.jsx';
import CuestionarioHeader from '../../components/components-seguridad/CuestionarioHeader.jsx';
import TokenDebugDisplay from '../../components/components-seguridad/TokenDebugDisplay.jsx';
import tokenManager from '../../utils/tokenManager';

export default function SurveyApp() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [savedSurveys, setSavedSurveys] = useState([]);
  const [personalData, setPersonalData] = useState(null);
  const [errors, setErrors] = useState({});
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [tokenValid, setTokenValid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState(null);

  // Validar token al cargar el componente
  useEffect(() => {
    // Agregar clase para permitir scroll en móviles
    document.body.classList.add('cuestionario-page');

    const validateAndSetToken = async () => {
      console.log('🚀 Iniciando validación de token...');
      
      // Validar token
      const token = tokenManager.extractTokenFromUrl();
      console.log('🔍 Token extraído de URL:', token);
      setCurrentToken(token); // Guardar token para mostrar
      
      if (token) {
        // Validar con backend
        const validation = await tokenManager.validateToken(token);
        
        if (validation.valid) {
          console.log('✅ Token válido - listo para usar');
          setTokenValid(validation);
          // NO marcar como usado inmediatamente para permitir navegación
        } else {
          // Token inválido - acceso denegado
          console.log('� Token inválido - acceso denegado:', validation.reason);
          setTokenValid(validation);
        }
      } else {
        // Acceso directo sin token - generar uno nuevo automáticamente
        console.log('🔓 Acceso directo sin token - generando token único...');
        try {
          const baseUrl = window.location.origin + '/cuestionario';
          const tokenizedUrl = await tokenManager.getTokenizedUrl(baseUrl);
          
          // Extraer el token de la URL generada
          const urlObj = new URL(tokenizedUrl);
          const newToken = urlObj.searchParams.get('token');
          
          if (newToken) {
            console.log('✅ Nuevo token generado:', newToken);
            setCurrentToken(newToken);
            
            // Validar el nuevo token
            const validation = await tokenManager.validateToken(newToken);
            if (validation.valid) {
              setTokenValid(validation);
              // Actualizar URL en el navegador sin recargar
              window.history.replaceState({}, '', tokenizedUrl);
            } else {
              setTokenValid({ valid: false, reason: 'Error generando token' });
            }
          } else {
            setTokenValid({ valid: false, reason: 'No se pudo generar token' });
          }
        } catch (error) {
          console.error('❌ Error generando token automático:', error);
          setTokenValid({ valid: false, reason: 'Error generando token' });
        }
      }

      setLoading(false);
    };

    validateAndSetToken();

    return () => {
      // Limpiar clase al salir de la página
      document.body.classList.remove('cuestionario-page');
    };
  }, []);

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

  // Marcar token como usado cuando el usuario comience el cuestionario
  const markTokenAsUsed = async () => {
    if (currentToken && tokenValid?.valid && tokenValid?.token) {
      console.log('🔒 Marcando token como usado al comenzar cuestionario...');
      const success = await tokenManager.markTokenAsUsed(tokenValid.token);
      
      if (success) {
        console.log('✅ Token marcado como usado exitosamente');
      } else {
        console.error('❌ Error marcando token como usado');
      }
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acceso...</p>
        </div>
      </div>
    );
  }

  // Pantalla de acceso denegado
  if (tokenValid && !tokenValid.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.242V7.176c0-1.575-1.962-3.242-2.502-3.242H4.938c-1.54 0-2.502 1.667-2.502 3.242v10.582c0 1.575 1.962 3.242 2.502 3.242h13.856c1.54 0 2.502-1.667 2.502-3.242V7.176c0-1.575-1.962-3.242-2.502-3.242z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">
              {tokenValid.reason === 'Token no encontrado o ya usado' 
                ? 'Este enlace ya ha sido utilizado o no es válido.'
                : tokenValid.reason === 'Token expirado'
                ? 'Este enlace ha expirado. Por favor, solicita uno nuevo.'
                : 'No tienes permiso para acceder al cuestionario.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (showAdmin) {
    loadShuffledQuestions();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <CuestionarioHeader />
        <div className="flex-1 w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <PanelAdministrativo
              onBack={() => {
                setShowAdmin(false);
                setStep(1);
                setPersonalData(null);
                setSubmitted(false);
              }}
              shuffledQuestions={shuffledQuestions}
            />
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de éxito
  if (submitted) {
    const lastSurvey = savedSurveys[savedSurveys.length - 1];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <CuestionarioHeader />
        <div className="flex-1 w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <CuestionarioCompletado
              lastSurvey={lastSurvey}
              onNewSurvey={resetForm}
              onViewAllSurveys={() => {
                resetForm(); // Resetear todo primero
                setShowAdmin(true);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header simple sin navegación */}
      <CuestionarioHeader />
      
      <div className="flex-1 w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Debug display para ver el estado del token */}
          <TokenDebugDisplay 
            tokenValid={tokenValid} 
            token={currentToken} 
            loading={loading} 
          />
          
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
              onContinue={async (data) => {
                await markTokenAsUsed(); // Marcar token como usado aquí
                handleContinueToSurvey(data);
              }}
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
