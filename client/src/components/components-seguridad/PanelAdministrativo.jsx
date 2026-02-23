import React from 'react';
import PanelAdminContent from './PanelAdminContent';

const PanelAdministrativo = ({
  onBack,
  shuffledQuestions
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <header className="bg-white shadow-md w-full">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-4">
          <div>
            <img src="/src/assets/logo-cmf-azul.svg" alt="CMF Envases" className="h-28 md:h-36 object-contain" />
            <p className="text-sm text-gray-600"></p>
          </div>
        </div>
      </header>
      <div className="py-8">
        <PanelAdminContent
          onBack={onBack}
          shuffledQuestions={shuffledQuestions}
        />
      </div>
    </div>
  );
};

export default PanelAdministrativo;
