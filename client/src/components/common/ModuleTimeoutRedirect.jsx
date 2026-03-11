import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ModuleTimeoutRedirect = ({ timeout = 60000 }) => {
  const navigate = useNavigate();
  const timeoutIdRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const checkTimeout = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      
      console.log(`⏰ Módulo - Tiempo transcurrido: ${Math.round(elapsed / 1000)}s / ${Math.round(timeout / 1000)}s`);

      if (elapsed >= timeout) {
        console.log('⏰ Tiempo del módulo expirado - redirigiendo a /home');
        navigate('/home');
        return;
      }

      // Programar siguiente verificación
      timeoutIdRef.current = setTimeout(checkTimeout, 1000);
    };

    // Iniciar la verificación
    checkTimeout();

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [navigate, timeout]);

  return null; // Este componente no renderiza nada
};

export default ModuleTimeoutRedirect;
