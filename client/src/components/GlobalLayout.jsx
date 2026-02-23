import { useTheme } from "../contexts/ThemeContext";

export function GlobalLayout({ children, title, icon: Icon, showBackButton = true }) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-full bg-gradient-to-br from-blue-50 to-indigo-100 
                   ${isDark ? 'dark:from-gray-900 dark:to-gray-800' : ''} 
                   py-3 sm:py-6 px-3 sm:px-4 lg:px-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        {/* Header principal - Mismo diseño para todas las páginas */}
        <div className={`bg-white ${isDark ? 'dark:bg-gray-800' : ''} 
                       rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden mb-6 transition-colors duration-300`}>
          
          {/* Parte azul del header */}
          <div className={`bg-gradient-to-r from-blue-600 to-indigo-700 
                         ${isDark ? 'dark:from-gray-800 dark:to-gray-900' : ''}
                         h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10 transition-colors duration-300`}>
            
            {/* Título e icono */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className={`h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 
                             ${isDark ? 'dark:bg-white/10' : 'bg-white/20'} 
                             backdrop-blur-sm flex items-center justify-center text-white shadow-2xl transition-colors duration-300`}>
                {Icon && <Icon className="text-xl sm:text-2xl md:text-3xl" />}
              </div>
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">
                  {title}
                </h1>
              </div>
            </div>

            {/* Botón de regreso */}
            {showBackButton && (
              <button 
                onClick={() => window.history.back()}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/30"
              >
                <FaArrowLeft className="text-sm" />
                <span className="font-medium">Regresar</span>
              </button>
            )}
          </div>
          
          {/* Contenido de la página */}
          <div className={`px-4 sm:px-6 lg:px-8 py-6 sm:py-8 
                         ${isDark ? 'dark:bg-gray-800' : 'bg-white'} transition-colors duration-300`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}