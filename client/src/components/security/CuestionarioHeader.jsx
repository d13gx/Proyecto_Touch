import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';
import logo from "../../assets/logo.jpg";

const CuestionarioHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl">
              <FaShieldAlt className="text-2xl" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-1 drop-shadow-lg">
                Cuestionario de Seguridad
              </h1>
            </div>
          </div>
          <div className="flex items-center">
            <img
              src={logo}
              alt="Logo CMF"
              className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shadow-lg border-2 border-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CuestionarioHeader;
