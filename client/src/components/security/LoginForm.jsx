import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { FaKey, FaSignInAlt, FaTimes, FaEye, FaEyeSlash, FaCheckCircle, FaUser, FaLightbulb } from 'react-icons/fa';

const LoginForm = ({ onLoginSuccess, onBack }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState('ldap'); // Solo LDAP
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Por favor, complete todos los campos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Solo login LDAP
      const result = await authService.loginLDAP(credentials.username, credentials.password);
      
      if (result.success || result.mensaje === 'Login exitoso') {
        onLoginSuccess(result);
      } else {
        setError(result.error || 'Error en el login');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Error de autorización - usuario no está en AUTHORIZED_USERS
        setError('Usuario autenticado pero no autorizado para acceder. Contacte al administrador del sistema.');
      } else {  
        setError(error.message || 'Error de conexión LDAP. Intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Componente de información de ayuda (igual que Trab_Detail)
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

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                <FaKey className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  Acceso a Lista de Visitas
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Autenticación requerida para acceder al sistema
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-2xl mx-auto">
              <HelpTips
                title="Información de autenticación LDAP:"
                tips={[
                  "• Usa tu usuario corporativo (sin @cmf.cl)",
                  "• Tu contraseña es la misma que usas para Outlook",
                  "• Solo usuarios autorizados pueden acceder",
                  "• Tus credenciales no se almacenan en el sistema"
                ]}
              />

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Usuario corporativo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full p-4 pl-12 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none text-lg bg-white transition-all duration-200"
                      style={{ fontSize: '18px' }}
                      placeholder="ejemplo: jperez"
                      autoComplete="username"
                    />
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Contraseña corporativa
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full p-4 pl-12 pr-12 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none text-lg bg-white transition-all duration-200"
                      style={{ fontSize: '18px' }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <FaKey className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl text-blue-500" />
                    
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2"
                    >
                      {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className={`rounded-xl p-4 ${error.includes('conexión') || error.includes('TI') || error.includes('autorizado')
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-red-50 border border-red-200'
                    }`}>
                    <p className={`text-sm flex items-center gap-2 ${error.includes('conexión') || error.includes('TI') || error.includes('autorizado')
                      ? 'text-yellow-700'
                      : 'text-red-700'
                      }`}>
                      <span>{error.includes('conexión') || error.includes('TI') || error.includes('autorizado') ? '🔌' : '❌'}</span>
                      <span>{error}</span>
                    </p>
                    {(error.includes('conexión') || error.includes('TI')) && (
                      <div className="mt-2 text-xs text-yellow-600">
                        • Podras contactarte cuando vuelva la conexión
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-base font-medium shadow-sm"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-base font-medium shadow-sm flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Verificando...
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="text-base" />
                        Iniciar Sesión
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
