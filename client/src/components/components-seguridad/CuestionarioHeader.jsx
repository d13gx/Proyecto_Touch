import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

const CuestionarioHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
            <FaShieldAlt className="text-2xl" />
          </div>
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-1 drop-shadow-lg">
              Cuestionario de Seguridad
            </h1>
            <p className="text-blue-100 opacity-90">
              CMF Envases - Seguridad Industrial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuestionarioHeader;
