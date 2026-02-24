import React from 'react';
import PanelAdminContent from './PanelAdminContent';

const PanelAdministrativo = ({
  onBack,
  shuffledQuestions
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
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