import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaBuilding, FaUsers, FaMap, FaInfoCircle, FaVideo, FaCog } from "react-icons/fa";
import logo from "../../assets/logo.jpg";
import Footer from "./Footer";

export function Nav({ hideHeader = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/home";
  const isVideoSeguridad = location.pathname === "/seguridad/video-seguridad";

  const quickLinks = [
    { path: "/seguridad/video-seguridad", icon: FaVideo, label: "Seguridad", color: "red" },

    //  { path: "/mapa", icon: FaMap, label: "Mapa", color: "blue" },
    //  { path: "/departamentos", icon: FaBuilding, label: "Departamento", color: "purple" },
    //  { path: "/trabajadores", icon: FaUsers, label: "Buscador", color: "teal" },
    //  { path: "/informaciones", icon: FaInfoCircle, label: "Contacto", color: "yellow" },
    { path: "/home", icon: FaHome, label: "Inicio", color: "green" }
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-500 hover:bg-blue-600 border-blue-400',
      green: 'bg-green-500 hover:bg-green-600 border-green-400',
      purple: 'bg-purple-500 hover:bg-purple-600 border-purple-400',
      orange: 'bg-orange-500 hover:bg-orange-600 border-orange-400',
      teal: 'bg-teal-500 hover:bg-teal-600 border-teal-400',
      red: 'bg-red-500 hover:bg-red-600 border-red-400',
      yellow: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* NAV */}
      {!hideHeader && (
        <nav className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl">
          <div className="max-w-7xl mx-auto">
            {/* Header principal del nav */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="Logo CMF"
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shadow-lg border-2 border-white"
                  />
                  <div className="hidden sm:block">
                    <h1 className="text-lg sm:text-xl font-bold text-white">Envases CMF S.A.</h1>
                  </div>
                </div>
              </div>

              {/* Botones de navegación rápida - arriba en móvil, derecha en desktop */}
              {!isHome && (
                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center sm:justify-end">
                  {quickLinks
                    .filter(link => isVideoSeguridad ? (link.path === "/home" || link.path.includes("admin=1")) : true)
                    .map((link) => {
                      const IconComponent = link.icon;
                      const isActive = location.pathname === link.path;
                      return (
                        <button
                          key={link.path}
                          onClick={() => navigate(link.path)}
                          className={`
                          flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white font-medium
                          transition-all duration-300 border-2
                          ${getColorClasses(link.color)}
                          ${isActive ? 'ring-2 ring-white ring-opacity-50 scale-105' : ''}
                          ${link.path === '/home' ? 'px-4 sm:px-4 py-3 sm:py-3' : 'px-4 sm:px-4 py-3 sm:py-3'}
                        `}
                        >
                          <IconComponent className={link.path === '/home' ? 'text-2xl' : 'text-2xl'} />
                          <span className="hidden xs:inline">{link.label}</span>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6">
        <Outlet />
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
