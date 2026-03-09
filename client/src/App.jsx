import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Nav } from "./components/layout/Nav";
import { HomePage } from "./pages/deprecated/HomePage";
import { Trab_List } from "./pages/workers/Trab_List";
import Depto_List from "./pages/departments/Depto_List";
import Info_List from "./pages/home/Info_List";
import Mapa_Cmf from "./pages/home/Mapa_Cmf";
import Depto_Detail from "./pages/departments/Depto_Detail";
import Trab_Detail from "./pages/workers/Trab_Detail";
import Keyboard from "./components/common/Keyboard";
import { useEffect, useState } from "react";
import { ThemeProvider } from './components/common/ThemeContext';
import SeguridadHome from "./pages/security/Home";
import VideoSeguridad from "./pages/security/VideoSeguridad";
import Cuestionario from "./pages/security/Cuestionario";
import ListaVisita from "./pages/security/ListaVisita";
import AuthGuard from "./components/security/AuthGuard";

function VisitorOnlyGuard({ children }) {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const cameFromQr = urlParams.get('qr') === '1';

  // Si viene desde un QR fresco (?qr=1), limpiar tokens antiguos para permitir una nueva sesión
  if (cameFromQr) {
    console.log('🔄 Escaneo de QR detectado - Limpiando sesión anterior...');
    sessionStorage.removeItem('visitor_qr_token');
    localStorage.removeItem('visitor_qr_token');
    sessionStorage.removeItem('visitor_qr_mode');
    localStorage.removeItem('visitor_qr_mode');
    // No retornamos aquí, dejamos que el flujo siga para que se considere un "nuevo visitante"
  }

  const storedToken = sessionStorage.getItem('visitor_qr_token') || localStorage.getItem('visitor_qr_token');

  // Detectar si este dispositivo ya consumeó o expiró su sesión de visita.
  // Cuando Cuestionario.jsx detecta un token inválido marca el modo como 'expired'.
  const qrMode = sessionStorage.getItem('visitor_qr_mode') || localStorage.getItem('visitor_qr_mode');
  const isExpiredSession = qrMode === 'expired';

  const isVisitor = qrMode === '1' || !!storedToken;

  // Si la sesión expiró, dirigir siempre a la pantalla de acceso denegado.
  if (isExpiredSession) {
    if (location.pathname === '/cuestionario') {
      // Dejar que Cuestionario.jsx muestre la pantalla de acceso denegado.
      // Pasamos ?denied=1 para que sepa que no debe intentar generar un token nuevo.
      if (urlParams.get('denied') !== '1') {
        return <Navigate to="/cuestionario?denied=1" replace />;
      }
      return children;
    }
    // Cualquier otra ruta -> redirigir al cuestionario con denied
    return <Navigate to="/cuestionario?denied=1" replace />;
  }

  if (!isVisitor) {
    return children;
  }

  if (location.pathname === '/cuestionario') {
    if (storedToken) {
      const urlToken = urlParams.get('token');
      if (!urlToken) {
        return (
          <Navigate
            to={`/cuestionario?token=${encodeURIComponent(storedToken)}`}
            replace
          />
        );
      }
    }

    return children;
  }

  const to = storedToken ? `/cuestionario?token=${encodeURIComponent(storedToken)}` : '/cuestionario';
  return <Navigate to={to} replace />;
}

function App() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    console.log('📱 ACTIVANDO MODO APP NATIVA MEJORADO...');

    // Detectar si está en modo standalone (PWA instalada)
    const checkDisplayMode = () => {
      const isInStandaloneMode = () =>
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isInStandaloneMode());

      if (isInStandaloneMode()) {
        console.log('✅ Ejecutando en modo PWA standalone');
        document.body.classList.add('pwa-standalone');
      } else {
        console.log('⚠️ Ejecutando en navegador - Recomendar instalación');
        document.body.classList.add('pwa-browser');
      }
    };

    // 1. CONFIGURACIÓN AVANZADA DE VIEWPORT - BLOQUEO DE ZOOM
    const configureAdvancedViewport = () => {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }

      // CONFIGURACIÓN MÁS ESTRICTA PARA BLOQUEAR ZOOM
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, shrink-to-fit=no, minimum-scale=1.0';

      const advancedMetaTags = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'CMF App' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#1a237e' },
        { name: 'msapplication-TileColor', content: '#1a237e' },
        { name: 'msapplication-tap-highlight', content: 'no' },
        { name: 'application-name', content: 'CMF App' },
        { name: 'format-detection', content: 'telephone=no' }
      ];

      advancedMetaTags.forEach(tag => {
        let meta = document.querySelector(`meta[name="${tag.name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = tag.name;
          document.head.appendChild(meta);
        }
        meta.content = tag.content;
      });

      const linkTags = [
        { rel: 'apple-touch-icon', href: '/icons/icon-152x152.png' },
        { rel: 'apple-touch-startup-image', href: '/splash-screen.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ];

      linkTags.forEach(link => {
        let linkElement = document.querySelector(`link[rel="${link.rel}"]`);
        if (!linkElement) {
          linkElement = document.createElement('link');
          linkElement.rel = link.rel;
          document.head.appendChild(linkElement);
        }
        linkElement.href = link.href;
      });
    };

    // 2. ESTILOS MEJORADOS - BLOQUEO COMPLETO DE ZOOM TÁCTIL
    const applyAdvancedAppStyles = () => {
      const styles = `
        <style id="app-native-styles">
          /* BLOQUEO COMPLETO DE ZOOM TÁCTIL */
          html, body {
            touch-action: pan-x pan-y;
            -ms-touch-action: pan-x pan-y;
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
          }
          
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
            background: #1a237e;
            height: 100vh;
            height: 100dvh;
            touch-action: pan-x pan-y;
            position: fixed;
            width: 100%;
            -webkit-text-size-adjust: 100%;
            text-size-adjust: 100%;
          }
          
          #root {
            height: 100vh;
            height: 100dvh;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
            position: relative;
            background: linear-gradient(to bottom right, #e0f2fe, #ffffff, #e0f7fa);
            touch-action: pan-x pan-y;
          }
          
          /* Scroll suave y ocultar scrollbars */
          * {
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x pan-y;
          }
          
          ::-webkit-scrollbar {
            display: none;
          }
          
          /* Mejorar interacción táctil */
          button, a, [role="button"] {
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
            cursor: pointer;
          }
          
          /* Permitir selección en inputs */
          input, textarea {
            -webkit-user-select: text;
            user-select: text;
            touch-action: auto;
          }
          
          /* EXCEPCIÓN: Permitir zoom solo en mapas */
          .map-container, [data-allow-zoom="true"] {
            touch-action: pan-x pan-y pinch-zoom;
          }
          
          /* BLOQUEO DE GESTOS DE ZOOM */
          * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-user-drag: none;
            -webkit-tap-highlight-color: transparent;
          }
        </style>
      `;

      if (!document.querySelector('#app-native-styles')) {
        document.head.insertAdjacentHTML('beforeend', styles);
      }
    };

    // 3. BLOQUEO DE EVENTOS TÁCTILES PARA ZOOM
    const setupTouchZoomBlocking = () => {
      // Prevenir gestos de zoom con dos dedos
      const preventZoom = (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Prevenir doble toque para zoom
      let lastTouchEnd = 0;
      const preventDoubleTapZoom = (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
          e.stopPropagation();
        }
        lastTouchEnd = now;
      };

      // Bloquear gesto de pellizco
      const preventPinch = (e) => {
        if (e.ctrlKey && e.deltaY !== 0) {
          e.preventDefault();
          return false;
        }

        // Detectar gestos de pellizco en touch
        if (e.touches && e.touches.length > 1) {
          e.preventDefault();
          return false;
        }
      };

      // EVENT LISTENERS PARA BLOQUEO DE ZOOM
      const zoomBlockingEvents = [
        ['touchstart', preventZoom, { passive: false }],
        ['touchend', preventDoubleTapZoom, { passive: false }],
        ['touchmove', preventZoom, { passive: false }],
        ['wheel', preventPinch, { passive: false }],
        ['gesturestart', (e) => e.preventDefault(), { passive: false }],
        ['gesturechange', (e) => e.preventDefault(), { passive: false }],
        ['gestureend', (e) => e.preventDefault(), { passive: false }],
      ];

      zoomBlockingEvents.forEach(([event, handler, options]) => {
        document.addEventListener(event, handler, options);
      });

      return () => {
        zoomBlockingEvents.forEach(([event, handler, options]) => {
          document.removeEventListener(event, handler, options);
        });
      };
    };

    // 4. BLOQUEO MÍNIMO ESENCIAL - NO INTERFERIR CON BOTONES
    const setupEssentialBlocking = () => {
      // SOLO bloquear zoom con Ctrl+rueda en contenido general
      const blockAccidentalZoom = (e) => {
        if ((e.ctrlKey || e.metaKey) &&
          (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
          e.preventDefault();
          return false;
        }
      };

      // BLOQUEO DE TECLAS ESPECÍFICAS
      const blockSpecificKeys = (e) => {
        // Bloquear F5 y Ctrl+R para recargar
        if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key === 'r')) {
          e.preventDefault();
          return false;
        }
      };

      // BLOQUEO DE CLICK DERECHO SUAVE
      const blockContextMenu = (e) => {
        // NO bloquear en inputs, textareas o elementos específicos
        if (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.closest('[data-allow-context-menu="true"]')) {
          return;
        }
        e.preventDefault();
        return false;
      };

      // PREVENIR PULL-TO-REFRESH SUAVE
      let startY = 0;
      const preventPullToRefresh = (e) => {
        if (e.touches.length === 1) {
          startY = e.touches[0].clientY;
        }
      };

      const checkPullToRefresh = (e) => {
        if (e.touches.length === 1) {
          const currentY = e.touches[0].clientY;
          if (currentY - startY > 100 && window.scrollY === 0) {
            e.preventDefault();
            return false;
          }
        }
      };

      // SOLO LOS EVENT LISTENERS ESENCIALES
      const events = [
        ['keydown', blockAccidentalZoom],
        ['keydown', blockSpecificKeys],
        ['contextmenu', blockContextMenu],
        ['touchstart', preventPullToRefresh, { passive: true }],
        ['touchmove', checkPullToRefresh, { passive: false }],
      ];

      events.forEach(([event, handler, options]) => {
        document.addEventListener(event, handler, options);
      });

      // 5. BLOQUEO MEJORADO DEL BOTÓN ATRÁS
      const setupSmartBackButton = () => {
        const originalPushState = history.pushState;
        history.pushState = function (state, title, url) {
          const newState = { ...state, reactRouter: true };
          return originalPushState.call(this, newState, title, url);
        };

        const handlePopState = (event) => {
          if (event.state && event.state.reactRouter) {
            return; // Permitir navegación interna
          }

          event.preventDefault();
          event.stopPropagation();
          window.history.pushState({ reactRouter: true }, '', window.location.href);
        };

        window.history.replaceState({ reactRouter: true }, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
          window.removeEventListener('popstate', handlePopState);
          history.pushState = originalPushState;
        };
      };

      // 6. OCULTAR INTERFAZ DEL NAVEGADOR EN MOBILE
      const hideMobileBrowserUI = () => {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 100);
      };

      // EJECUTAR TODAS LAS CONFIGURACIONES
      checkDisplayMode();
      configureAdvancedViewport();
      applyAdvancedAppStyles();
      const cleanupZoomBlocking = setupTouchZoomBlocking();
      hideMobileBrowserUI();
      const cleanupBackButton = setupSmartBackButton();

      console.log('✅ MODO APP ACTIVADO - ZOOM TÁCTIL BLOQUEADO');

      // CLEANUP FUNCTION
      return () => {
        events.forEach(([event, handler, options]) => {
          document.removeEventListener(event, handler, options);
        });

        if (cleanupZoomBlocking) cleanupZoomBlocking();
        if (cleanupBackButton) cleanupBackButton();

        const injectedStyles = document.querySelector('#app-native-styles');
        if (injectedStyles) {
          injectedStyles.remove();
        }

        document.body.classList.remove('pwa-standalone', 'pwa-browser');
      };
    };

    setupEssentialBlocking();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <VisitorOnlyGuard>
                <Navigate to="/home" replace />
              </VisitorOnlyGuard>
            }
          />
          <Route element={<VisitorOnlyGuard><Nav hideHeader /></VisitorOnlyGuard>}>
            <Route path="/home" element={<SeguridadHome />} />
          </Route>

          <Route element={<VisitorOnlyGuard><Nav /></VisitorOnlyGuard>}>
            <Route path="/home" element={<SeguridadHome />} />
            <Route path="/trabajadores" element={<Trab_List />} />
            <Route path="/departamentos" element={<Depto_List />} />
            <Route path="/informaciones" element={<Info_List />} />
            <Route path="/mapa" element={<Mapa_Cmf />} />
            <Route path="/depto-detail" element={<Depto_Detail />} />
            <Route path="/trabajadores/:id" element={<Trab_Detail />} />
            <Route path="/seguridad/video-seguridad" element={<VideoSeguridad />} />
            <Route path="/seguridad/cuestionario" element={<Cuestionario />} />
            <Route path="/Keyboard" element={<Keyboard />} />
          </Route>
          {/* Rutas sin header/layout principal */}
          <Route path="/cuestionario" element={<Cuestionario />} />
          <Route path="/ListaVisita" element={
            <AuthGuard>
              <ListaVisita />
            </AuthGuard>
          } />

          <Route
            path="*"  
            element={
              <VisitorOnlyGuard>
                <Navigate to="/home" replace />
              </VisitorOnlyGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;