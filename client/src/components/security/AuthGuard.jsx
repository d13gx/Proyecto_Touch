import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

const AuthGuard = ({ children, fallback = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const authData = await authService.checkCurrentUser();
        
        setIsAuthorized(authData.isAuthorized);
        setCurrentUser(authData.username);
        
        if (!authData.isAuthorized) {
          setError(`Acceso denegado. Usuario actual: ${authData.username}. Usuarios autorizados: ${authData.authorizedUsers.join(', ')}`);
        }
        
      } catch (err) {
        console.error('Error en verificación de autenticación:', err);
        setError('Error al verificar la autenticación. Por favor, recargue la página.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verificando Acceso</h2>
            <p className="text-gray-600">Validando usuario de Windows...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder al Panel Administrativo.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="text-sm text-gray-500">
              <p>Usuario actual detectado: <span className="font-medium">{currentUser || 'Desconocido'}</span></p>
            </div>
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
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está autorizado, mostrar los children
  return children;
};

export default AuthGuard;
