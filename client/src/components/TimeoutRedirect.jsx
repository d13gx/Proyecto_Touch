import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TimeoutRedirect = ({ timeout = 60000, redirectTo = "/" }) => {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;
    
    const resetTimer = () => {
      // Limpiar el timeout anterior
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Establecer nuevo timeout
      timeoutId = setTimeout(() => {
        console.log('⏰ Timeout: Redirigiendo al home por inactividad');
        navigate(redirectTo);
      }, timeout);
    };

    // Eventos que resetearán el timer
    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    // Agregar event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Iniciar el timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [navigate, timeout, redirectTo]);

  return null; // Este componente no renderiza nada
};

export default TimeoutRedirect;