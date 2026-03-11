import React from 'react';
import PanelAdminContent from '../../components/security/PanelAdminContent';
import { FaArrowLeft, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import logo from "../../assets/logo.jpg";
import Footer from "../../components/layout/Footer";

const ListaVisita = () => {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 py-3 sm:py-6 px-3 sm:px-4 lg:px-6 pt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header principal */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
            {/* Header azul con título y navegación */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-3 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-xl">
                      <FaUsers className="text-lg sm:text-xl" />
                    </div>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-white text-xl sm:text-2xl" />
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        Lista de Visitas
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Logo CMF a la derecha */}
                <div className="flex items-center">
                  <img
                    src={logo}
                    alt="Logo CMF"
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shadow-lg border-2 border-white"
                  />
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4 overflow-visible">
              <div className="w-full">
                <PanelAdminContent onBack={handleBack} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
3

export default ListaVisita;
