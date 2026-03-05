import React from 'react';
import PanelAdminContent from './PanelAdminContent';
import AuthGuard from './AuthGuard';
import { FaInfoCircle } from 'react-icons/fa';

const PanelAdministrativo = ({
  onBack,
  shuffledQuestions
}) => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          {/* Header principal */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mb-4 sm:mb-6">
            {/* Header azul con título */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 sm:h-32 flex items-center justify-between px-6 sm:px-8 lg:px-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 rounded-full border-4 border-white/30 bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
                  <FaInfoCircle className="text-xl sm:text-2xl md:text-3xl" />
                </div>
                <div className="text-white">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Panel Administrativo</h1>
                  <p className="text-blue-100 text-sm sm:text-base">Gestión de Cuestionarios</p>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="px-2 sm:px-3 lg:px-4 py-3 sm:py-4">
              <div className="w-full">
                <PanelAdminContent
                  onBack={onBack}
                  shuffledQuestions={shuffledQuestions}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PanelAdministrativo;