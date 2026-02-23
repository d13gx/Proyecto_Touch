import React from 'react';

export default function Footer() {
  return (
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
        </div>
      </div>
    </footer>
  );
}
