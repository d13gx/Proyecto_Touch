import React from 'react';
import Logo from '../assets/logo-cmf-azul.svg';

export default function HeaderCuestionario({ 
  step, 
  savedSurveysCount, 
  onAdminClick 
}) {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-6 flex items-center gap-4">
        <div>
          <img src={Logo} alt="CMF Envases" className="h-28 md:h-36 object-contain" />
          <p className="text-sm text-gray-600"></p>
        </div>
      </div>
    </header>
  );
}
