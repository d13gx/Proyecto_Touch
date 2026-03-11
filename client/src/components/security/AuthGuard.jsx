import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import LoginForm from './LoginForm';

const AuthGuard = ({ children, fallback = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // 'local' o 'remote'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 🔥 FORZAR LOGIN SIEMPRE - Comentar para producción
        console.log('🔥 Forzando login siempre - Modo desarrollo');
        setShowLogin(true);
        setAuthMethod('ldap');
        setIsLoading(false);
        return;
        
        // Código original (comentado para desarrollo)
        /*
        // Primero verificar si hay sesión guardada
        const savedSession = authService.checkSavedSession();
        if (savedSession) {
          setIsAuthorized(true);
          setCurrentUser(savedSession.username);
          setAuthMethod(savedSession.loginMethod || 'remote');
          setIsLoading(false);
          return;
        }
        
        // Intentar autenticación local (tótem)
        try {
          const authData = await authService.checkCurrentUser();
          
          setIsAuthorized(authData.isAuthorized);
          setCurrentUser(authData.username);
          setAuthMethod('local');
          setIsLoading(false);
          return;
          
        } catch (localError) {
          console.log('Autenticación local no disponible, intentando detección automática...');
        }
        
        // Intentar detección automática de dispositivo
        try {
          const deviceResult = await authService.detectDevice();
          
          if (deviceResult.success && deviceResult.authorized) {
            setIsAuthorized(true);
            setCurrentUser(deviceResult.username);
            setAuthMethod('device_auto');
            setIsLoading(false);
            return;
          }
          
          console.log('Dispositivo no reconocido, mostrando login manual');
          
        } catch (deviceError) {
          console.log('Error en detección automática, mostrando login manual');
        }
        
        // Si todo falla, mostrar login para acceso remoto
        setShowLogin(true);
        setAuthMethod('ldap');
        */
        
      } catch (err) {
        console.error('Error en verificación de autenticación:', err);
        setError('Error al verificar la autenticación. Por favor, recargue la página.');
        setShowLogin(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (loginResult) => {
    setIsAuthorized(true);
    setCurrentUser(loginResult.username);
    setShowLogin(false);
    setAuthMethod('remote');
  };

  const handleBackToHome = () => {
    window.location.href = '/home';
  };

  // Mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando Acceso</h2>
            <p className="text-gray-600">Validando permisos de acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar formulario de login para acceso remoto
  if (showLogin) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} onBack={handleBackToHome} />;
  }

  // Mostrar error de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Ups! No tienes permiso</h2>
            <p className="text-gray-600 mb-4">
              El usuario <span className="font-medium">{currentUser || 'Desconocido'}</span> no tiene permiso para ver la lista de visitas.
              {authMethod === 'local' && ' Si estás accediendo desde otro dispositivo, intenta con el login remoto.'}
            </p>
            {authMethod === 'local' && (
              <button
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-3"
              >
                Intentar Login Remoto
              </button>
            )}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700">{error}</p>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/home'}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error general
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error de Verificación</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => setShowLogin(true)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Usar Login Remoto
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar los children
  return children;
};

export default AuthGuard;
