import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TimeoutRedirect = ({ timeout = 60000, redirectTo = "/", resetOnActivity = false }) => {
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
        console.log(`⏰ Timeout: Redirigiendo a ${redirectTo} por inactividad`);

        if (redirectTo.startsWith('http')) {
          window.location.href = redirectTo;
        } else {
          navigate(redirectTo);
        }
      }, timeout);
    };

    // Solo agregar event listeners si resetOnActivity es true
    if (resetOnActivity) {
      // Eventos que resetearán el timer
      const events = [
        'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
      ];

      // Agregar event listeners
      events.forEach(event => {
        document.addEventListener(event, resetTimer, true);
      });
    }

    // Iniciar el timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      if (resetOnActivity) {
        const events = [
          'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
        ];
        events.forEach(event => {
          document.removeEventListener(event, resetTimer, true);
        });
      }
    };
  }, [navigate, timeout, redirectTo, resetOnActivity]);

  return null; // Este componente no renderiza nada
};

export default TimeoutRedirect;