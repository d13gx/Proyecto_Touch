import React, { useState, useEffect } from 'react';
import DatosPersonales from '../../components/security/DatosPersonales.jsx';
import PreguntasCuestionario from '../../components/security/PreguntasCuestionario.jsx';
import CuestionarioCompletado from '../../components/security/CuestionarioCompletado.jsx';
import PanelAdministrativo from '../../components/security/PanelAdministrativo.jsx';
import CuestionarioHeader from '../../components/security/CuestionarioHeader.jsx';
import TokenDebugDisplay from '../../components/security/TokenDebugDisplay.jsx';
import tokenManager from '../../utils/tokenManager';
import TimeoutRedirect from '../../components/common/TimeoutRedirect';

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
  const [debugInfo, setDebugInfo] = useState(null);
  const VISITOR_SESSION_KEY = 'visitor_qr_mode';
  const VISITOR_TOKEN_SESSION_KEY = 'visitor_qr_token';
  const VISITOR_DEBUG_SESSION_KEY = 'visitor_qr_debug';

  useEffect(() => {
    document.body.classList.add('cuestionario-page');
    const validateAndSetToken = async () => {
      console.log('🚀 Iniciando validación de token...');

      // Detectar si se solicita acceso al panel administrativo
      const urlParams = new URLSearchParams(window.location.search);
      const isAdminMode = urlParams.get('admin') === '1';
      
      if (isAdminMode) {
        console.log('🔧 Modo administrativo solicitado');
        setShowAdmin(true);
        setLoading(false);
        return;
      }

      const surveysStr = localStorage.getItem('surveys');
      const surveys = JSON.parse(surveysStr || '[]');
      setSavedSurveys(surveys);
      const cameFromQr = urlParams.get('qr') === '1';
      const isDenied = urlParams.get('denied') === '1';

      if (cameFromQr) {
        console.log('🔄 Iniciando nueva sesión desde QR - Limpiando rastros anteriores...');
        sessionStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
        localStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
        sessionStorage.setItem(VISITOR_SESSION_KEY, '1');
        localStorage.setItem(VISITOR_SESSION_KEY, '1');
      }

      const tokenFromUrl = tokenManager.extractTokenFromUrl();
      const savedToken = localStorage.getItem(VISITOR_TOKEN_SESSION_KEY);
      const token = tokenFromUrl || savedToken;

      console.log('🔍 Token para validación:', token);
      if (token) setCurrentToken(token);

      if (cameFromQr && !tokenFromUrl) {
        console.log('🔄 Acceso desde QR sin token - Generando token automáticamente...');
        try {
          const baseUrl = window.location.origin + '/cuestionario';
          const tokenizedUrl = await tokenManager.getTokenizedUrl(baseUrl);
          const urlObj = new URL(tokenizedUrl, window.location.origin);
          const newToken = urlObj.searchParams.get('token');

          if (newToken) {
            console.log('✅ Token generado para QR:', newToken);
            setCurrentToken(newToken);
            sessionStorage.setItem(VISITOR_SESSION_KEY, '1');
            sessionStorage.setItem(VISITOR_TOKEN_SESSION_KEY, newToken);
            localStorage.setItem(VISITOR_SESSION_KEY, '1');
            localStorage.setItem(VISITOR_TOKEN_SESSION_KEY, newToken);

            const validation = await tokenManager.validateToken(newToken);
            if (validation.valid) {
              setTokenValid(validation);
              window.history.replaceState({}, '', tokenizedUrl);
              setLoading(false);
              return;
            } else {
              console.log('🚫 Token generado inválido:', validation);
              setTokenValid({ valid: false, reason: 'Error generando token QR' });
              setLoading(false);
              return;
            }
          } else {
            console.log('❌ No se pudo generar token para QR');
            setTokenValid({ valid: false, reason: 'No se pudo generar token QR' });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('❌ Error generando token QR:', error);
          setTokenValid({ valid: false, reason: 'Error generando token QR' });
          setLoading(false);
          return;
        }
      }

      if (token) {
        // Punto 3: Si no hay token en URL pero hay uno guardado, restaurarlo automáticamente
        if (!tokenFromUrl && savedToken && !cameFromQr) {
          console.log('🔄 Token no encontrado en URL, pero hay uno guardado. Restaurando...');
          window.history.replaceState({}, '', `/cuestionario?token=${encodeURIComponent(savedToken)}`);
          
          // Validar el token restaurado
          const validation = await tokenManager.validateToken(savedToken);
          if (validation.valid) {
            console.log('✅ Token restaurado válido');
            setTokenValid(validation);
            setLoading(false);
            return; // Salir temprano, no continuar con el flujo normal
          } else {
            console.log('⚠️ Token restaurado inválido, limpiando...');
            sessionStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
            localStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
          }
        }

        const surveyForThisToken = surveys.find(s => s.token === token);
        if (surveyForThisToken) {
          console.log('✨ Encuesta encontrada localmente para este token. Mostrando resultados.');
          setTokenValid({ valid: true, reason: 'Already completed' });
          setSubmitted(true);
          setLoading(false);
          return;
        }
      }

      if (isDenied) {
        console.log('🚫 Acceso denegado por sesión expirada (?denied=1)');
        setTokenValid({ valid: false, reason: 'Sesión expirada o acceso denegado' });
        setLoading(false);
        return;
      }

      const baseDebug = {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        cameFromQr,
        backendUrl: tokenManager?.backendUrl || null,
        token
      };

      setDebugInfo(baseDebug);
      sessionStorage.setItem(VISITOR_DEBUG_SESSION_KEY, JSON.stringify(baseDebug));

      if (tokenFromUrl) {
        sessionStorage.setItem(VISITOR_TOKEN_SESSION_KEY, tokenFromUrl);
        localStorage.setItem(VISITOR_TOKEN_SESSION_KEY, tokenFromUrl);

        const validation = await tokenManager.validateToken(tokenFromUrl);

        if (validation.valid) {
          console.log('✅ Token válido - listo para usar');
          setTokenValid(validation);
        } else {
          console.log('🚫 Token inválido - acceso denegado:', validation.reason);
          setTokenValid(validation);
          const invalidDebug = { ...baseDebug, stage: 'validate_existing_token', token, validation };
          setDebugInfo(invalidDebug);
          sessionStorage.setItem(VISITOR_DEBUG_SESSION_KEY, JSON.stringify(invalidDebug));
          sessionStorage.setItem(VISITOR_SESSION_KEY, 'expired');
          localStorage.setItem(VISITOR_SESSION_KEY, 'expired');
          sessionStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
          localStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
        }
      } else {
        // Verificar si el tiempo del token ya expiró
        const tokenStartTime = sessionStorage.getItem('token_start_time');
        if (tokenStartTime) {
          const now = Date.now();
          const elapsed = now - parseInt(tokenStartTime);
          const timeout = tokenManager.TOKEN_EXPIRY_MINUTES * 60 * 1000;
          
          if (elapsed >= timeout) {
            console.log('⏰ El tiempo del token ya expiró - no generar nuevo token');
            setTokenValid({ valid: false, reason: 'Token expirado' });
            setLoading(false);
            return;
          }
        }
        
        console.log('🔓 Acceso sin token - generando token único...');
        try {
          const baseUrl = window.location.origin + '/cuestionario';
          const tokenizedUrl = await tokenManager.getTokenizedUrl(baseUrl);
          const urlObj = new URL(tokenizedUrl, window.location.origin);
          const newToken = urlObj.searchParams.get('token');

          if (newToken) {
            console.log('✅ Nuevo token generado:', newToken);
            setCurrentToken(newToken);

            if (cameFromQr) {
              sessionStorage.setItem(VISITOR_SESSION_KEY, '1');
              sessionStorage.setItem(VISITOR_TOKEN_SESSION_KEY, newToken);
              localStorage.setItem(VISITOR_SESSION_KEY, '1');
              localStorage.setItem(VISITOR_TOKEN_SESSION_KEY, newToken);
            }

            const validation = await tokenManager.validateToken(newToken);
            if (validation.valid) {
              setTokenValid(validation);
              window.history.replaceState({}, '', tokenizedUrl);
            } else {
              setTokenValid({ valid: false, reason: 'Error generando token' });
              const invalidDebug = { ...baseDebug, stage: 'validate_new_token', tokenizedUrl, newToken, validation };
              setDebugInfo(invalidDebug);
              sessionStorage.setItem(VISITOR_DEBUG_SESSION_KEY, JSON.stringify(invalidDebug));
              if (cameFromQr) {
                sessionStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
                localStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
              }
            }
          } else {
            setTokenValid({ valid: false, reason: 'No se pudo generar token' });
            const invalidDebug = { ...baseDebug, stage: 'extract_token_from_tokenized_url', tokenizedUrl };
            setDebugInfo(invalidDebug);
            sessionStorage.setItem(VISITOR_DEBUG_SESSION_KEY, JSON.stringify(invalidDebug));
          }
        } catch (error) {
          console.error('❌ Error generando token automático:', error);
          setTokenValid({ valid: false, reason: 'Error generando token' });
          const invalidDebug = {
            ...baseDebug,
            stage: 'create_token_request',
            error: { message: error?.message, name: error?.name }
          };
          setDebugInfo(invalidDebug);
          sessionStorage.setItem(VISITOR_DEBUG_SESSION_KEY, JSON.stringify(invalidDebug));
          if (cameFromQr) {
            sessionStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
            localStorage.removeItem(VISITOR_TOKEN_SESSION_KEY);
          }
        }
      }

      setLoading(false);
    };

    validateAndSetToken();

    return () => {
      document.body.classList.remove('cuestionario-page');
    };
  }, []);

  useEffect(() => {
    // Solo resetear si no estamos en modo administrativo
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('admin') === '1';
    
    if (!isAdminMode) {
      setShowAdmin(false);
      setStep(1);
      setPersonalData(null);
      setErrors({});
    }
  }, []);

  const loadShuffledQuestions = () => {
    if (shuffledQuestions.length === 0) {
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
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        return { ...question, options, correctAnswer: question.correctAnswer };
      });

      setShuffledQuestions(shuffled);
    }
  };

  const handleContinueToSurvey = (data) => {
    setPersonalData(data);
    setStep(2);
  };

  const handleSurveyComplete = (surveyData) => {
    const newSurvey = { id: Date.now(), token: currentToken, ...surveyData };
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

  if (tokenValid && !tokenValid.valid) {
    let storedDebug = null;
    try {
      const raw = sessionStorage.getItem(VISITOR_DEBUG_SESSION_KEY);
      storedDebug = raw ? JSON.parse(raw) : null;
    } catch (e) {
      storedDebug = null;
    }
    const effectiveDebug = debugInfo || storedDebug;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.242V7.176c0-1.575-1.962-3.242-2.502-3.242H4.938c-1.54 0-2.502 1.667-2.502 3.242v10.582c0 1.575 1.962 3.242 2.502 3.242h13.856c1.54 0 2.502-1.667 2.502-3.242V7.176c0-1.575-1.962-3.242-2.502-3.242z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">
              {tokenValid?.reason?.toLowerCase().includes('expira') ? 'Tiempo Terminado' : 'Acceso Denegado'}
            </h1>
            <p className="text-gray-600 mb-4">
              {tokenValid.reason === 'Token no encontrado o ya usado'
                ? 'Este enlace ya ha sido utilizado o no es válido.'
                : tokenValid.reason === 'Token expirado'
                  ? 'Para volver a contestar el cuestionario tienes que escanear el codigo QR nuevamente'
                  : 'No tienes permiso para acceder al cuestionario.'}
            </p>
            <button
              onClick={() => window.location.href = 'https://www.cmf.cl'}
              className="w-full bg-yellow-600 text-white py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-colors mt-2"
            >
              Visita nuestra página
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showAdmin) {
    loadShuffledQuestions();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
    );
  }

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
                resetForm();
                setShowAdmin(true);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <CuestionarioHeader />
      <TimeoutRedirect
        timeout={tokenManager.TOKEN_EXPIRY_MINUTES * 60 * 1000}
        redirectTo="/"
      />
      <div className="flex-1 w-full px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                await markTokenAsUsed();
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
