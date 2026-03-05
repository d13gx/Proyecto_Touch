  import React from 'react';
  import { useNavigate } from 'react-router-dom';
  import { FaArrowLeft, FaBuilding } from 'react-icons/fa';

  const HeaderComponent = ({ 
    title = "Estructura Organizacional",
    subtitle = "Gestión de departamentos y equipos",
    icon = <FaBuilding />,
    showBackButton = true,
    bgGradient = "from-blue-600 to-indigo-700",
    iconBg = "bg-white/20",
    children
  }) => {
    const navigate = useNavigate();

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6 sm:mb-8">
        {/* Sección azul con título e icono */}
        <div className={`bg-gradient-to-r ${bgGradient} h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10`}>
          {/* Título e icono */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 ${iconBg} backdrop-blur-sm flex items-center justify-center text-white shadow-2xl`}>
              {React.cloneElement(icon, { className: "text-xl sm:text-2xl md:text-3xl" })}
            </div>
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                {title}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base opacity-90">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Botón de regreso */}
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
            >
              <FaArrowLeft className="text-sm" />
              <span className="font-medium">Regresar</span>
            </button>
          )}
        </div>
        
        {/* Contenido adicional (tabs, etc.) */}
        {children && (
          <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            {children}
          </div>
        )}
      </div>
    );
  };

  export default HeaderComponent;