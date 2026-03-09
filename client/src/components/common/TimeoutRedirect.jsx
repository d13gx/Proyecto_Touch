import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TimeoutRedirect = ({ timeout = 60000, redirectTo = "/" }) => {
  const navigate = useNavigate();
  const startTimeRef = useRef(null);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
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
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      console.log(`⏰ Tiempo transcurrido: ${Math.round(elapsed / 1000)}s / ${Math.round(timeout / 1000)}s`);

      if (elapsed >= timeout) {
        console.log('⏰ Tiempo del token expirado - redirigiendo a acceso denegado');
        
        // Limpiar el tiempo de inicio
        sessionStorage.removeItem('token_start_time');
        
        // Redirigir a acceso denegado
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
  }, [navigate, timeout, redirectTo]);

  return null; // Este componente no renderiza nada
};

export default TimeoutRedirect;