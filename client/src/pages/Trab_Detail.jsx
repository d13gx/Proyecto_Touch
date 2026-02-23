import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../config';
import TouchKeyboard from "../components/Keyboard";
import TimeoutRedirect from "../components/TimeoutRedirect";
import {
  FaUser, FaEnvelope, FaPhone, FaLayerGroup,
  FaUserTie, FaUsers, FaArrowLeft, FaCrown,
  FaBuilding, FaMapMarkerAlt, FaMap,
  FaPaperPlane, FaSignInAlt, FaCheckCircle,
  FaKey, FaEnvelopeOpen, FaTimes, FaKeyboard,
  FaArrowRight, FaLightbulb, FaEye, FaEyeSlash
} from "react-icons/fa";

export default function Trab_Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajador, setTrabajador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSupervisados, setShowSupervisados] = useState(false);
  const [error, setError] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({ hits: 0, misses: 0 });
  
  // Estados para el proceso de contacto
  const [contactStep, setContactStep] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Estados para autenticación
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    loading: false,
    error: "",
    showPassword: false
  });

  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    loading: false
  });

  // Estados para el teclado virtual
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState(null);
  const [keyboardValue, setKeyboardValue] = useState("");

  const [emailSummary, setEmailSummary] = useState({
    remitente: "",
    destinatario: "",
    asunto: "",
    mensaje: ""
  });

  // ✅ REFS para prevenir duplicados
  const requestInProgress = useRef(false);
  const lastRequestTime = useRef(0);
  const requestTimeoutRef = useRef(null);

  // ✅ URL base con app_touch
  // API_BASE_URL is already imported from config

  // Función para obtener CSRF token - MEJORADA CON DETECCIÓN DE CONEXIÓN
  const getCsrfToken = useCallback(async () => {
    try {
      // Verificar conexión a internet primero
      if (!navigator.onLine) {
        console.error('Error: No hay conexión a internet');
        throw new Error("CONNECTION_ERROR");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      console.log('Solicitando token CSRF a:', `${API_BASE_URL}/api/auth/csrf/`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Respuesta de CSRF - Estado:', response.status);
      
      if (response.ok) {
        const data = await response.json().catch(err => {
          console.error('Error al parsear respuesta CSRF:', err);
          return {};
        });
        
        if (data && data.csrfToken) {
          console.log('Token CSRF obtenido exitosamente');
          return data.csrfToken;
        } else {
          console.error('La respuesta no contiene un token CSRF válido:', data);
          return null;
        }
      } else {
        console.error("Error obteniendo CSRF token:", response.status, response.statusText);
        // Si el servidor responde pero con error, no es problema de conexión
        return null;
      }
    } catch (error) {
      console.error("Error obteniendo CSRF token:", error);
      
      // Detectar específicamente errores de conexión
      if (error.name === 'AbortError' || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('Network request failed') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message === 'CONNECTION_ERROR' ||
          !navigator.onLine) {
        throw new Error("CONNECTION_ERROR");
      }
    }
    return null;
  }, [API_BASE_URL]);

  // ✅ Función OPTIMIZADA para cargar datos del trabajador con DETECCIÓN DE CONEXIÓN
  const fetchTrabajador = useCallback(async () => {
    if (requestInProgress.current) {
      console.log('⏳ Request ya en progreso, ignorando...');
      return;
    }

    const now = Date.now();
    if (now - lastRequestTime.current < 500) {
      console.log('⏳ Debounce: request demasiado rápida');
      return;
    }

    try {
      requestInProgress.current = true;
      lastRequestTime.current = now;
      
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError("No se proporcionó un correo electrónico");
        setLoading(false);
        requestInProgress.current = false;
        return;
      }

      const correoDecodificado = decodeURIComponent(id);
      console.log('🔍 Buscando trabajador con correo:', correoDecodificado);
      
      const timestamp = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${API_BASE_URL}/api/ldap/trabajador/?correo=${encodeURIComponent(correoDecodificado)}&_t=${timestamp}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Manejar errores de conexión específicos
        if (response.status === 503 || response.status === 0) {
          throw new Error("❌ Error de conexión. Contacta con el departamento de TI.");
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const isCached = response.headers.get('x-cache') === 'HIT';
      if (isCached) {
        console.log('✅ CACHE HIT trabajador:', correoDecodificado);
        setCacheInfo(prev => ({ ...prev, hits: prev.hits + 1 }));
      } else {
        console.log('❌ CACHE MISS trabajador:', correoDecodificado);
        setCacheInfo(prev => ({ ...prev, misses: prev.misses + 1 }));
      }

      if (data && data.error) {
        setTrabajador(null);
        setError(data.error);
      } else if (data && Object.keys(data).length > 0) {
        setTrabajador(data);
        setError(null);
      } else {
        setTrabajador(null);
        setError("No se encontró información del trabajador");
      }
    } catch (err) {
      console.error("🚨 Error cargando trabajador:", err);
      
      // Manejar errores de red
      let errorMessage = err.message;
      if (err.name === 'AbortError' ||
          err.message.includes('Failed to fetch') || 
          err.message.includes('NetworkError') ||
          err.message.includes('Network request failed') ||
          err.message.includes('ERR_INTERNET_DISCONNECTED') ||
          err.message.includes('ERR_CONNECTION_REFUSED') ||
          !navigator.onLine) {
        errorMessage = "❌ Error de conexión. Contacta con el departamento de TI.";
      }
      
      setTrabajador(null);
      setError(errorMessage);
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [id, API_BASE_URL]);

  // ✅ Cargar datos del trabajador con useEffect optimizado
  useEffect(() => {
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }

    setTrabajador(null);
    setLoading(true);
    setError(null);
    requestInProgress.current = false;

    requestTimeoutRef.current = setTimeout(() => {
      fetchTrabajador();
    }, 100);

    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [fetchTrabajador]);

  // ✅ Resetear estado cuando cambia el ID
  useEffect(() => {
    setContactStep('home');
    setKeyboardTarget(null);
    setKeyboardValue("");
    setShowKeyboard(false);
    setLoginData({ username: "", password: "", loading: false, error: "", showPassword: false });
    setEmailData({ subject: "", message: "", loading: false });
    setIsAuthenticated(false);
  }, [id]);

  // ✅ useEffect para manejar el foco automático en el área de mensaje
  useEffect(() => {
    if (contactStep === 'compose') {
      // Configurar valores predeterminados
      // Mensaje predeterminado con cursor al final
      const defaultMessage = `Hola ${trabajador?.givenName || ''} ${trabajador?.apellido || ''},\n\nMe pongo en contacto contigo para: `;
      setEmailData({
        subject: `Contacto desde APP Interactiva`,
        message: defaultMessage,
        loading: false,
        readOnly: true
      });
      
      // Establecer el foco en el mensaje y sincronizar con el teclado
      setKeyboardTarget('message');
      setKeyboardValue(defaultMessage);
      setShowKeyboard(true);
    }
  }, [contactStep, trabajador]);

  // Función para volver atrás
  const volverAtras = () => {
    if (contactStep !== 'home') {
      setContactStep('home');
      setKeyboardTarget(null);
      setShowKeyboard(false);
    } else {
      navigate(-1);
    }
  };

  // Función para iniciar el proceso de contacto
  const iniciarContacto = () => {
    setContactStep('login');
    setKeyboardTarget('username');
    setKeyboardValue("");
    setShowKeyboard(true);
  };

  // Función para actualizar valor del teclado
  const handleKeyboardInput = (input) => {
    switch (keyboardTarget) {
      case 'username':
        setLoginData(prev => ({ ...prev, username: input, error: "" }));
        break;
      case 'password':
        setLoginData(prev => ({ ...prev, password: input, error: "" }));
        break;
      case 'subject':
        setEmailData(prev => ({ ...prev, subject: input }));
        break;
      case 'message':
        setEmailData(prev => ({ ...prev, message: input }));
        break;
      default:
        break;
    }
    
    setKeyboardValue(input);
  };

  // Función para manejar el focus en inputs
  const handleInputFocus = (fieldName, currentValue = "") => {
    setKeyboardTarget(fieldName);
    setKeyboardValue(currentValue || "");
    setShowKeyboard(true);
  };

  // Función para ocultar teclado
  const hideKeyboard = () => {
    setShowKeyboard(false);
    setKeyboardTarget(null);
    setKeyboardValue("");
  };

  // Función para alternar visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setLoginData(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };

  // Función para iniciar sesión - VERSIÓN MEJORADA CON DETECCIÓN DE CONEXIÓN
  const handleLogin = async () => {
    if (!loginData.username || !loginData.password) {
      setLoginData(prev => ({ ...prev, error: "Usuario y contraseña son requeridos" }));
      return;
    }

    setLoginData(prev => ({ ...prev, loading: true, error: "" }));

    try {
      // Primero verificar si hay conexión a internet
      if (!navigator.onLine) {
        console.error('Error: No hay conexión a internet');
        throw new Error("CONNECTION_ERROR");
      }

      // Obtener token CSRF
      console.log('Obteniendo token CSRF para login...');
      const csrfToken = await getCsrfToken();
      
      if (!csrfToken) {
        console.error('Error: No se pudo obtener el token CSRF para login');
        throw new Error("CONNECTION_ERROR");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout

      console.log('Iniciando sesión con usuario:', loginData.username);
      console.log('URL de login:', `${API_BASE_URL}/api/auth/login/`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('Respuesta de login - Estado:', response.status);
      
      // Si la respuesta no es exitosa, manejar el error
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
          console.error('Error en login - Detalles:', errorData);
        } catch (e) {
          console.error('Error al parsear respuesta de error:', e);
        }
        
        let errorMessage = 'Error de autenticación';
        if (response.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
        } else if (response.status === 400) {
          errorMessage = errorData.detail || 'Datos de inicio de sesión inválidos';
        } else if (response.status >= 500) {
          errorMessage = 'Error del servidor. Por favor, intente más tarde.';
        }
        
        throw new Error(errorMessage);
      }
      
      // Si llegamos aquí, el inicio de sesión fue exitoso
      const responseData = await response.json();
      console.log('Inicio de sesión exitoso:', responseData);
      
      // Actualizar el estado para reflejar que el usuario está autenticado
      setLoginData(prev => ({
        ...prev,
        isAuthenticated: true,
        loading: false,
        error: ""
      }));
      
      // Continuar con el flujo de envío de correo si corresponde
      if (contactStep === 'login') {
        setContactStep('compose');
      }
      
    } catch (error) {
      console.error("Error en login:", error);
      
      // Manejar errores de red (fetch falla completamente)
      let errorMessage = error.message;
      
      // Detectar específicamente errores de red
      if (error.message === 'CONNECTION_ERROR' ||
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('Network request failed') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED') ||
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.name === 'TypeError' ||
          error.name === 'AbortError' ||
          !navigator.onLine) {
        
        errorMessage = "❌ Error de conexión. Contacta con el departamento de TI.";
      }
      
      setLoginData(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
    }
  };

  // Función para enviar el correo
  const enviarCorreo = async () => {
    if (!emailData.subject.trim() || !emailData.message.trim()) {
      alert("Por favor, completa el asunto y el mensaje");
      return;
    }

    setEmailData(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('Iniciando envío de correo...');
      
      // Verificar conexión a internet primero
      if (!navigator.onLine) {
        console.error('Error: Sin conexión a internet');
        throw new Error("CONNECTION_ERROR");
      }

      // Obtener token CSRF
      console.log('Obteniendo token CSRF...');
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        console.error('Error: No se pudo obtener el token CSRF');
        throw new Error("CONNECTION_ERROR");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos para envío de correo

      console.log('Enviando solicitud al servidor...');
      console.log('URL:', `${API_BASE_URL}/api/enviar-correo/`);
      
      const response = await fetch(`${API_BASE_URL}/api/enviar-correo/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({
          destinatario: trabajador.mail,
          asunto: emailData.subject,
          mensaje: emailData.message,
          password: loginData.password
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('Respuesta recibida, estado:', response.status);
      
      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = await response.json();
        console.log('Datos de respuesta:', data);
      } catch (jsonError) {
        console.error('Error al analizar la respuesta JSON:', jsonError);
        throw new Error('La respuesta del servidor no es válida');
      }

      if (response.ok) {
        console.log('Correo enviado exitosamente');
        setEmailSummary({
          remitente: data.remitente || `${loginData.username}@cmf.cl`,
          destinatario: data.destinatario || trabajador.mail,
          asunto: data.asunto || emailData.subject,
          mensaje: emailData.message.substring(0, 150) + (emailData.message.length > 150 ? "..." : "")
        });

        await handleLogout();
        
        setContactStep('success');
        hideKeyboard();
        setEmailData({ subject: "", message: "", loading: false });
        setLoginData(prev => ({ ...prev, password: "" }));
        
      } else {
        // Manejar diferentes tipos de errores en el envío de correo
        let errorMessage = data.error || data.detail || `Error al enviar el correo (${response.status})`;
        
        if (response.status === 401) {
          errorMessage = "Credenciales incorrectas. Por favor, verifica tu contraseña.";
        } else if (response.status === 400) {
          errorMessage = data.error || "Datos de correo inválidos";
        } else if (response.status === 403) {
          errorMessage = "No tienes permiso para realizar esta acción";
        } else if (response.status === 503) {
          errorMessage = "CONNECTION_ERROR";
        }
        
        console.error('Error en la respuesta del servidor:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error al enviar correo:", error);
      
      // Manejar errores de red
      let errorMessage = error.message;
      if (error.message === 'CONNECTION_ERROR' ||
          error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.name === 'AbortError' ||
          !navigator.onLine) {
        errorMessage = "❌ Error de conexión. Contacta con el departamento de TI.";
      }
      
      alert(`❌ Error al enviar el correo: ${errorMessage}`);
      setEmailData(prev => ({ ...prev, loading: false }));
    }
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        await fetch(`${API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'include',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
      }
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  // Función para volver al perfil
  const volverAlPerfil = () => {
    setContactStep('home');
    hideKeyboard();
    setLoginData({ username: "", password: "", loading: false, error: "", showPassword: false });
    setEmailData({ subject: "", message: "", loading: false });
  };

  // Función para ir al perfil del jefe
  const irAlPerfilDelJefe = async () => {
    const nombreJefe = obtenerNombreJefe(trabajador?.manager);
    if (!nombreJefe) {
      alert("⚠️ Este trabajador no tiene jefatura directa.");
      return;
    }
    try {
      const timestamp = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(`${API_BASE_URL}/api/ldap/search/?q=${encodeURIComponent(nombreJefe)}&_t=${timestamp}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      const jefeActivo = Array.isArray(data)
        ? data.find((j) => j.userAccountControl_enabled && j.mail)
        : null;
      if (jefeActivo?.mail) {
        navigate(`/trabajadores/${encodeURIComponent(jefeActivo.mail)}`);
      } else {
        alert("⚠️ Jefatura no encontrada o inactiva.");
      }
    } catch (err) {
      console.error("Error al buscar jefatura:", err);
      if (err.name === 'AbortError' || err.message.includes('Failed to fetch') || !navigator.onLine) {
        alert("⚠️ Error de conexión. Contacta con el departamento de TI.");
      } else {
        alert("⚠️ Error al buscar la jefatura.");
      }
    }
  };

  // Función para obtener nombre del jefe
  const obtenerNombreJefe = (manager) => {
    if (!manager) return null;
    
    try {
      if (typeof manager === 'string') {
        return manager.split(",")[0]?.replace("CN=", "")?.trim() || null;
      }
      if (Array.isArray(manager) && manager.length > 0) {
        const managerStr = String(manager[0]);
        return managerStr.split(",")[0]?.replace("CN=", "")?.trim() || null;
      }
      return null;
    } catch (error) {
      console.error("Error al procesar manager:", error);
      return null;
    }
  };

  // Función para ir al perfil de supervisado
  const irAlPerfilSupervisado = (correo) => {
    if (!correo) {
      alert("⚠️ Este supervisado no tiene correo registrado.");
      return;
    }
    setContactStep('home');
    hideKeyboard();
    navigate(`/trabajadores/${encodeURIComponent(correo)}`);
  };

  // Función para mostrar vista de supervisados
  const mostrarSupervisados = () => {
    setContactStep('supervisados');
  };

  // Función para reintentar carga
  const reintentarCarga = () => {
    setLoading(true);
    setError(null);
    fetchTrabajador();
  };

  // Componente de input con cursor personalizado
  const SearchInputWithCursor = ({ 
    field, 
    value, 
    placeholder, 
    onFocus, 
    type = "text", 
    showPasswordToggle = false,
    readOnly = false
  }) => {
    const displayValue = showPasswordToggle && !loginData.showPassword ? 
      value.replace(/./g, '•') : value;

    return (
      <div className="relative">
        <input
          type={showPasswordToggle && !loginData.showPassword ? "password" : "text"}
          inputMode="none"
          onFocus={(e) => {
            e.target.blur();
            if (!readOnly) {
              onFocus();
            }
          }}
          readOnly
          value={value}
          className={`w-full p-4 ${field === 'subject' || field === 'message' ? 'pl-4' : 'pl-12'} border-2 rounded-xl focus:ring-2 focus:outline-none text-lg bg-white transition-all duration-200 min-h-[60px] text-transparent caret-transparent ${
            readOnly 
              ? 'border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed' 
              : 'border-blue-300 focus:ring-blue-400 focus:border-blue-400'
          }`}
          style={{ fontSize: '18px' }}
          placeholder=""
        />
        
        {field === 'username' ? (
          <FaUser className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${
            readOnly ? 'text-gray-500' : 'text-blue-500'
          }`} />
        ) : field === 'password' ? (
          <FaKey className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${
            readOnly ? 'text-gray-500' : 'text-blue-500'
          }`} />
        ) : null}
        
        <div 
          className={`absolute ${field === 'subject' || field === 'message' ? 'left-4' : 'left-12'} top-1/2 transform -translate-y-1/2 text-lg pointer-events-none flex items-center w-[calc(100%-6rem)] overflow-hidden ${
          readOnly ? 'text-gray-600' : 'text-gray-900'
        }`}
          style={{ fontSize: '18px' }}
        >
          <span className="flex items-center">
            {displayValue || <span className="text-gray-500">{placeholder}</span>}
            {showKeyboard && keyboardTarget === field && !readOnly && (
              <span className="ml-0.5 w-0.5 h-6 bg-blue-500 animate-pulse"></span>
            )}
          </span>
        </div>
        
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {showPasswordToggle && value && !readOnly && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              {loginData.showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
            </button>
          )}
          
          {value && !readOnly && (
            <button
              onClick={() => {
                if (field === 'username') setLoginData(prev => ({ ...prev, username: "" }));
                if (field === 'password') setLoginData(prev => ({ ...prev, password: "" }));
                if (field === 'subject') setEmailData(prev => ({ ...prev, subject: "" }));
                if (field === 'message') setEmailData(prev => ({ ...prev, message: "" }));
                setKeyboardValue("");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <FaTimes className="text-lg" />
            </button>
          )}
          
          {readOnly && (
            <div className="text-gray-400 p-2" title="Campo de solo lectura">
              <FaCheckCircle className="text-lg" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente de textarea personalizado con cursor
  const TextareaWithCursor = ({ value, placeholder, onFocus }) => {
    // Sincronizar el valor con el teclado virtual cuando cambia
    useEffect(() => {
      if (keyboardTarget === 'message' && value !== keyboardValue) {
        setKeyboardValue(value);
      }
    }, [value, keyboardTarget]);

    return (
      <div className="relative">
        <div
          onClick={() => onFocus()}
          className="w-full p-4 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none text-lg bg-white transition-all duration-200 min-h-[200px] cursor-text relative"
        >
          <div className="whitespace-pre-wrap break-words">
            {value || <span className="text-gray-500">{placeholder}</span>}
            {showKeyboard && keyboardTarget === 'message' && (
              <span className="inline-block w-0.5 h-6 bg-blue-500 animate-pulse align-middle -mb-1"></span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Estados derivados
  const nombreJefe = obtenerNombreJefe(trabajador?.manager);
  const tieneSupervisados = Array.isArray(trabajador?.supervisa_a) && trabajador.supervisa_a.length > 0;
  const tieneJefe = !!nombreJefe;

  // Función segura para extraer valores
  const getSafeValue = (value, defaultValue = "No registrado") => {
    if (value === null || value === undefined || value === "" || 
        value === " " || (Array.isArray(value) && value.length === 0)) {
      return defaultValue;
    }
    
    if (Array.isArray(value) && value.length > 0) {
      const firstValue = value[0];
      return getSafeValue(firstValue, defaultValue);
    }
    
    return value;
  };

  // Función para teléfono
  const getTelefonoValue = (telephoneNumber) => {
    const value = getSafeValue(telephoneNumber, "Sin Anexo registrado");
    
    if (!value || value === " " || value === "" || value === "No registrado") {
      return "Sin Anexo registrado";
    }
    
    return value;
  };

  // Generar iniciales para el avatar
  const getInitials = (givenName, sn) => {
    const firstName = getSafeValue(givenName, "").charAt(0).toUpperCase();
    const lastName = getSafeValue(sn, "").charAt(0).toUpperCase();
    return firstName + lastName;
  };

  // Generar color único basado en el nombre
  const generateAvatarColor = (name) => {
    if (!name) return "#4F46E5";
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  // Componente de tarjeta de información
  const InfoCard = ({ icon, title, value, action, className = "" }) => {
    return (
      <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[120px] group ${className}`}>
        <div className="p-4 sm:p-5 flex flex-col h-full">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">{title}</div>
              <div className="text-sm font-semibold text-gray-900 break-words leading-tight">
                {value}
              </div>
            </div>
          </div>
          {action && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Componente de información de ayuda
  const HelpTips = ({ title, tips }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <FaLightbulb className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-800 mb-2">{title}</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-3"></div>
              <div className="text-base font-medium">Cargando información del trabajador...</div>
              <p className="text-sm text-gray-500 mt-1">Por favor espera</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !trabajador) {
    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
            <div className="text-center py-12 px-4">
              <div className={`text-5xl mb-3 ${
                error?.includes('conexión') || error?.includes('TI') ? '🔌' : '⚠️'
              }`}></div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {error?.includes('conexión') || error?.includes('TI') 
                  ? "Error de Conexión" 
                  : error?.includes("no encontrado") || error?.includes("inactivo") 
                    ? "Trabajador No Encontrado" 
                    : "Error del Servidor"}
              </h3>
              <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                {error || "El trabajador solicitado no existe o está inactivo."}
              </p>
              {(error?.includes('conexión') || error?.includes('TI')) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                  <p className="text-sm text-yellow-700">
                    • Intenta nuevamente en unos momentos
                  </p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button 
                  onClick={volverAtras}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Volver atrás
                </button>
                <button
                  onClick={reintentarCarga}
                  className="px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatarColor = generateAvatarColor(`${trabajador?.givenName} ${trabajador?.sn}`);
  const initials = getInitials(trabajador?.givenName, trabajador?.sn);

  // Renderizado condicional basado en el paso actual
  const renderCurrentStep = () => {
    switch (contactStep) {
      case 'login':
        return renderLoginStep();
      case 'compose':
        return renderComposeStep();
      case 'success':
        return renderSuccessStep();
      case 'supervisados':
        return renderSupervisadosStep();
      default:
        return renderHomeStep();
    }
  };

  // Paso 1: Página principal del perfil
  const renderHomeStep = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaUser className="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
              Perfil del Trabajador
            </h1>
          </div>
        </div>

        <button 
          onClick={() => navigate(-1)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
        >
          <FaArrowLeft className="text-sm" />
          <span className="font-medium">Regresar</span>
        </button>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Avatar y botón Contactar */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 md:gap-6 lg:items-center items-start">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl mx-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight break-words">
                {getSafeValue(`${trabajador.givenName} ${trabajador.sn}`)}
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mt-1 break-words">
                {getSafeValue(trabajador.title, "Sin cargo")}
              </p>
            </div>
          </div>

          {/* BOTÓN CONTACTAR */}
          <div className="lg:ml-auto lg:mt-0 mt-4 sm:mt-6">
            <button
              onClick={iniciarContacto}
              className="relative overflow-hidden group flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 border-2 border-orange-300"
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 bg-white/25 rounded-xl backdrop-blur-sm transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-inner">
                    <FaPaperPlane className="text-xl" />
                  </div>
                </div>
                
                <div className="text-left">
                  <div className="text-lg font-bold tracking-wide drop-shadow-sm">¡CONTÁCTAME!</div>
                  <div className="text-sm opacity-90 font-semibold">Clic aquí enviar mensaje</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          <InfoCard 
            icon={<FaUserTie className="text-lg" />} 
            title="Cargo" 
            value={getSafeValue(trabajador.title, "Sin cargo")} 
          />
          
          <InfoCard 
            icon={<FaBuilding className="text-lg" />} 
            title="Departamento" 
            value={getSafeValue(trabajador.department, "Sin departamento")} 
          />
          
          <InfoCard 
            icon={<FaEnvelope className="text-lg" />} 
            title="Email" 
            value={getSafeValue(trabajador.mail, "Sin email")} 
          />
          
          <InfoCard 
            icon={<FaPhone className="text-lg" />} 
            title="Anexo" 
            value={getTelefonoValue(trabajador.telephoneNumber)} 
          />

          {tieneJefe && (
            <InfoCard 
              icon={<FaCrown className="text-lg" />} 
              title="Jefatura Directa" 
              value={nombreJefe}
              action={
                <button
                  onClick={irAlPerfilDelJefe}
                  className="w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FaUserTie className="text-sm" />
                  <span>Ver perfil</span>
                </button>
              }
            />
          )}

          {tieneSupervisados && (
            <InfoCard 
              icon={<FaUsers className="text-lg" />} 
              title="Supervisa a" 
              value={`${trabajador.supervisa_a.length} persona(s)`}
              action={
                <button
                  onClick={mostrarSupervisados}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FaUsers className="text-sm" />
                  <span>Ver equipo</span>
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );

  // Paso 2: Autenticación
  const renderLoginStep = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaKey className="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
              Autenticación Requerida
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Para contactar a {trabajador.givenName} {trabajador.sn}
            </p>
          </div>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <HelpTips 
            title="Información de autenticación:"
            tips={[
              "• Usa tu usuario corporativo (sin @cmf.cl)",
              "• Tu contraseña es la misma que usas para Outlook",
              "• La sesión se cerrará automáticamente después del envío",
              "• Tus credenciales no se almacenan en el sistema"
            ]}
          />

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Usuario de cuenta empresarial
              </label>
              <SearchInputWithCursor
                field="username"
                value={loginData.username}
                placeholder="ejemplo: jperez"
                onFocus={() => handleInputFocus('username', loginData.username)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Contraseña de cuenta empresarial
              </label>
              <SearchInputWithCursor
                field="password"
                value={loginData.password}
                placeholder="••••••••"
                type="password"
                onFocus={() => handleInputFocus('password', loginData.password)}
                showPasswordToggle={true}
              />
            </div>

            {/* Botón para mostrar/ocultar teclado */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 text-sm font-medium"
              >
                <FaKeyboard />
                {showKeyboard ? "Ocultar Teclado" : "Mostrar Teclado"}
              </button>
            </div>

            {/* Teclado virtual */}
            {showKeyboard && (
              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                <TouchKeyboard 
                  onChange={handleKeyboardInput}
                  input={keyboardValue}
                />
              </div>
            )}
                    
            {loginData.error && (
              <div className={`rounded-xl p-4 ${
                loginData.error.includes('conexión') || loginData.error.includes('TI') 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm flex items-center gap-2 ${
                  loginData.error.includes('conexión') || loginData.error.includes('TI') 
                    ? 'text-yellow-700' 
                    : 'text-red-700'
                }`}>
                  <span>{loginData.error.includes('conexión') || loginData.error.includes('TI') ? '🔌' : '❌'}</span>
                  <span>{loginData.error}</span>
                </p>
                {(loginData.error.includes('conexión') || loginData.error.includes('TI')) && (
                  <div className="mt-2 text-xs text-yellow-600">
                    • Podras contactarte cuando vuelva la conexión
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={volverAlPerfil}
                className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-base font-medium shadow-sm"
                disabled={loginData.loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleLogin}
                disabled={loginData.loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-medium shadow-sm flex items-center justify-center gap-2"
              >
                {loginData.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <FaSignInAlt className="text-base" />
                    Continuar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 3: Composición del mensaje
  const renderComposeStep = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaEnvelopeOpen className="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
              Redactar Mensaje
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              Para {trabajador.givenName} {trabajador.sn}
            </p>
          </div>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <HelpTips 
            title="Consejos para tu mensaje:"
            tips={[
              "• Sé claro y conciso en tu comunicación",
              "• Incluye toda la información necesaria",
              "• El correo se enviará desde tu cuenta corporativa",
              "• El destinatario recibirá el mensaje en su Outlook"
            ]}
          />

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Mensaje: 
              </label>
              <TextareaWithCursor
                value={emailData.message}
                placeholder="Escribe tu mensaje aquí..."
                onFocus={() => handleInputFocus('message', emailData.message)}
              />
            </div>

            {/* Botón para mostrar/ocultar teclado */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowKeyboard(!showKeyboard)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 text-sm font-medium"
              >
                <FaKeyboard />
                {showKeyboard ? "Ocultar Teclado" : "Mostrar Teclado"}
              </button>
            </div>

            {/* Teclado virtual */}
            {showKeyboard && (
              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                <TouchKeyboard 
                  onChange={handleKeyboardInput}
                  input={keyboardValue}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setContactStep('login')}
                className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-base font-medium shadow-sm"
                disabled={emailData.loading}
              >
                Atrás
              </button>
              <button
                onClick={enviarCorreo}
                disabled={emailData.loading}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-base font-medium shadow-sm flex items-center justify-center gap-2"
              >
                {emailData.loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-base" />
                    Enviar Mensaje
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Paso 4: Vista de Supervisados
  const renderSupervisadosStep = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaUsers className="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
              Equipo Supervisado
            </h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Por {trabajador.givenName}
            </p>
          </div>
        </div>

        {/* Botón de regreso para escritorio */}
        <button 
          onClick={volverAlPerfil}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
        >
          <FaArrowLeft className="text-sm" />
          <span className="font-medium">Volver al Perfil</span>
        </button>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Botón de regreso para móviles */}
          <div className="mb-6 sm:hidden">
            <button 
              onClick={volverAlPerfil}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl border-2 border-blue-200 w-full justify-center"
            >
              <FaArrowLeft className="text-sm" />
              <span>Volver al Perfil</span>
            </button>
          </div>

          {trabajador.supervisa_a.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
              {trabajador.supervisa_a.map((persona, idx) => {
                const personaAvatarColor = generateAvatarColor(`${persona.givenName} ${persona.sn}`);
                const personaInitials = getInitials(persona.givenName, persona.sn);
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[280px] group">
                    <div className="p-4 sm:p-5 flex flex-col h-full">
                      {/* Header con avatar y nombre */}
                      <div className="flex items-center gap-4 mb-4">
                        <div 
                          className="h-16 w-16 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{ backgroundColor: personaAvatarColor }}
                        >
                          {personaInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 leading-tight break-words">
                            {getSafeValue(`${persona.givenName} ${persona.sn}`)}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 break-words">
                            {getSafeValue(persona.title, "Sin cargo")}
                          </p>
                        </div>
                      </div>

                      {/* Información del supervisado */}
                      <div className="space-y-3 flex-1">
                        {persona.department && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border-l-4 border-green-500">
                            <FaBuilding className="text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Departamento</div>
                              <div className="text-sm font-semibold text-green-900 break-words">
                                {persona.department}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Botón Ver Perfil */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
                        <button
                          onClick={() => irAlPerfilSupervisado(persona.mail)}
                          disabled={!persona.mail}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl active:scale-95 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaUser className="text-sm" />
                          <span>Ver Perfil Completo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="text-5xl mb-3">👥</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                No hay personas supervisadas
              </h3>
              <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
                Este trabajador no supervisa a nadie actualmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Paso 5: Confirmación de éxito
  const renderSuccessStep = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaCheckCircle className="text-xl sm:text-2xl md:text-3xl" />
          </div>
          <div className="text-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
              ¡Mensaje Enviado!
            </h1>
            <p className="text-green-100 text-sm sm:text-base">
              Mensaje entregado exitosamente
            </p>
          </div>
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="text-3xl sm:text-4xl text-green-600" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Mensaje entregado exitosamente
          </h2>
          
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Tu mensaje ha sido enviado al correo corporativo de {trabajador.givenName}.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-200">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-500">De:</div>
                <div className="text-sm font-semibold text-gray-800">{emailSummary.remitente}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-500">Para:</div>
                <div className="text-sm font-semibold text-gray-800">{emailSummary.destinatario}</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-500">Asunto:</div>
                <div className="text-sm font-semibold text-gray-800">{emailSummary.asunto}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-700 flex items-center gap-2 justify-center">
              <span>✅</span>
              <span>Tu sesión ha sido cerrada automáticamente por seguridad.</span>
            </p>
          </div>

          <button
            onClick={volverAlPerfil}
            className="w-full max-w-xs py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-base font-medium shadow-sm"
          >
            Volver al Perfil
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      {/* ✅ Timeout Redirect */}
      <TimeoutRedirect timeout={60000} redirectTo="/" />
      <div className="max-w-7xl mx-auto">
        {/* Botón de regreso para móviles */}
        <div className="mb-4 sm:mb-6 sm:hidden">
          <button 
            onClick={volverAtras}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl border-2 border-blue-200 w-full justify-center"
          >
            <FaArrowLeft className="text-sm" />
            <span>{contactStep === 'home' ? 'Volver atrás' : 'Atrás'}</span>
          </button>
        </div>

        {/* Contenido principal */}
        {renderCurrentStep()}
      </div>
    </div>
  );
}