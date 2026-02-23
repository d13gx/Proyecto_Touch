import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaBuilding, FaUsers, FaMap, FaInfoCircle, FaVideo } from "react-icons/fa";
import logo from "../assets/logo.jpg";

export function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/home";

  const quickLinks = [
    { path: "/mapa", icon: FaMap, label: "Mapa", color: "blue" },
    { path: "/departamentos", icon: FaBuilding, label: "Departamento", color: "purple" },
    { path: "/trabajadores", icon: FaUsers, label: "Buscador", color: "teal" },
    { path: "/pages-seguridad/home", icon: FaVideo, label: "Seguridad", color: "red" },
    { path: "/informaciones", icon: FaInfoCircle, label: "Contacto", color: "yellow" }
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
      <nav className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto">
          {/* Header principal del nav */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
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

            
            <div className="flex items-center gap-3">
              
            

              {!isHome && (
                <button
                  onClick={() => navigate("/home")}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 
                           hover:from-green-600 hover:to-green-700
                           px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg text-sm sm:text-base font-semibold text-white
                           transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-green-400"
                >
                  <FaHome className="text-sm sm:text-base" />
                  <span className="hidden sm:inline">Inicio</span>
                </button>
              )}
            </div>
          </div>

          {/* Navegación rápida */}
          {!isHome && (
            <div className="border-t border-blue-400/30">
              <div className="px-4 sm:px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center sm:justify-end">
                    {quickLinks.map((link) => {
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
                          `}
                        >
                          <IconComponent className="text-sm" />
                          <span className="hidden xs:inline text-xs sm:text-sm">{link.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-inner border-t border-blue-400/30">
        <div className="max-w-7xl mx-auto">
          <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6">

            <div className="text-center lg:text-center flex-1">
              <p className="text-blue-200 text-base sm:text-lg lg:text-xl font-semibold mb-2">
                © {new Date().getFullYear()} Todos los derechos reservados
              </p>
              <p className="text-blue-300 text-sm sm:text-base lg:text-lg">
                Departamento de Tecnología y Digitalización
              </p>
            </div>

            <div className="text-center lg:text-right flex-1">
              <div className="flex flex-col items-center lg:items-end gap-2">
                <span className="text-blue-200 text-sm sm:text-base lg:text-lg font-medium">
                  v1.0.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}