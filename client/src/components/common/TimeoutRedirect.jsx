import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TimeoutRedirect = ({ timeout = 60000, redirectTo = "/" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const startTimeRef = useRef(null);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    // Solo verificar el tiempo si estamos en la página del cuestionario
    if (!location.pathname.includes('/cuestionario')) {
      console.log('🚫 No estamos en /cuestionario - omitiendo verificación de tiempo');
      return;
    }

    // Obtener el tiempo de inicio del token desde sessionStorage
    const storedStartTime = sessionStorage.getItem('token_start_time');
    
    if (!storedStartTime) {
      // Primera vez que se carga, guardar el tiempo de inicio
      const now = Date.now();
      sessionStorage.setItem('token_start_time', now.toString());
      startTimeRef.current = now;
    } else {
      // Ya existe un tiempo de inicio, usarlo
      startTimeRef.current = parseInt(storedStartTime);
    }

    const checkExpiration = () => {
      // Verificar nuevamente que aún estamos en /cuestionario
      if (!location.pathname.includes('/cuestionario')) {
        console.log('🚫 Cambiamos de página - deteniendo verificación de tiempo');
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        return;
      }

      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      console.log(`⏰ Tiempo transcurrido: ${Math.round(elapsed / 1000)}s / ${Math.round(timeout / 1000)}s`);

      if (elapsed >= timeout) {
        console.log('⏰ Tiempo del token expirado - redirigiendo a acceso denegado');
        
        // Marcar el token como usado en el backend
        const urlParams = new URLSearchParams(window.location.search);
        const currentToken = urlParams.get('token');
        
        if (currentToken) {
          // Importar tokenManager dinámicamente para evitar dependencias circulares
          import('../../utils/tokenManager.js').then(({ default: tokenManager }) => {
            tokenManager.markTokenAsUsed(currentToken).then(success => {
              if (success) {
                console.log('✅ Token marcado como usado al expirar tiempo');
              } else {
                console.log('⚠️ No se pudo marcar token como usado al expirar');
              }
            }).catch(err => {
              console.error('❌ Error marcando token como usado:', err);
            });
          });
        }
        
        // Limpiar el tiempo de inicio
        sessionStorage.removeItem('token_start_time');
        
        // Redirigir a acceso denegado (Tiempo terminado)
        if (redirectTo === "/") {
          window.location.href = '/cuestionario?denied=1';
        } else if (redirectTo.startsWith('http')) {
          window.location.href = redirectTo;
        } else {
          navigate(redirectTo);
        }
        return;
      }

      // Programar siguiente verificación
      timeoutIdRef.current = setTimeout(checkExpiration, 1000); // Verificar cada segundo
    };

    // Iniciar la verificación
    checkExpiration();

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [navigate, timeout, redirectTo, location.pathname]);

  return null; // Este componente no renderiza nada
};

export default TimeoutRedirect;