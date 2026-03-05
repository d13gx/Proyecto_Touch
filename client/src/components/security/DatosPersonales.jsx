import React, { useState } from 'react';
import { consultarPorRUT } from '../../services/api';

export default function DatosPersonales({ 
  onContinue,
  onReset
}) {
  const [personalData, setPersonalData] = useState({
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    empresa: ''
  });
  const [errors, setErrors] = useState({});
  const [loadingRUT, setLoadingRUT] = useState(false);

  const resetForm = () => {
    setPersonalData({ nombre: '', rut: '', telefono: '', email: '', empresa: '' });
    setErrors({});
  };
  const validateRut = (rut) => {
    const cleanRut = rut.replace(/[.-]/g, '');
    if (cleanRut.length < 2) return false;

    const body = cleanRut.slice(0, -1);
    const digit = cleanRut.slice(-1).toUpperCase();

    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDigit = 11 - (sum % 11);
    const finalDigit = expectedDigit === 11 ? '0' : expectedDigit === 10 ? 'K' : expectedDigit.toString();

    return digit === finalDigit;
  };

  const formatRut = (value) => {
    const cleaned = value.replace(/[^0-9kK]/g, '');
    if (cleaned.length <= 1) return cleaned;

    const body = cleaned.slice(0, -1);
    const digit = cleaned.slice(-1);

    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${digit}`;
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned;
  };

  const handlePersonalDataChange = (e) => {
    const { name, value } = e.target;

    if (name === 'rut') {
      const formatted = formatRut(value);
      setPersonalData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'telefono') {
      const formatted = formatPhone(value);
      setPersonalData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setPersonalData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRutBlur = async () => {
    const rut = personalData.rut;
    
    // Consultar nombre si el RUT es válido y está completo
    if (validateRut(rut) && rut.length >= 9 && rut.match(/^\d{1,2}\.\d{3}\.\d{3}-[0-9K]$/)) {
      setLoadingRUT(true);
      try {
        const response = await consultarPorRUT(rut);
        if (response.success && response.nombre) {
          setPersonalData(prev => ({ 
            ...prev, 
            nombre: response.nombre
          }));
        }
      } catch (error) {
        console.error('Error al consultar RUT:', error);
      } finally {
        setLoadingRUT(false);
      }
    }
  };

  const validatePersonalData = (data) => {
    const newErrors = {};

    if (!data.nombre.trim()) {
      newErrors.nombre = 'El Nombre es requerido';
    } else if (data.nombre.trim().length > 50) {
      newErrors.nombre = 'El Nombre no puede exceder 50 caracteres';
    } else if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/.test(data.nombre.trim())) {
      newErrors.nombre = 'El Nombre solo puede contener letras y tildes';
    } else if (data.nombre.startsWith(' ')) {
      newErrors.nombre = 'El Nombre no puede empezar con espacio';
    }

    if (!data.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    } else if (!validateRut(data.rut)) {
      newErrors.rut = 'RUT inválido';
    }

    if (!data.telefono.trim()) {
      newErrors.telefono = 'El Teléfono es requerido';
    } else if (!/^[0-9]+$/.test(data.telefono.replace(/\s/g, ''))) {
      newErrors.telefono = 'El Teléfono solo puede contener números';
    } else if (data.telefono.replace(/\s/g, '').length < 8) {
      newErrors.telefono = 'El Teléfono debe tener al menos 8 dígitos';
    }

    if (!data.email.trim()) {
      newErrors.email = 'El Email es requerido';
    } else if (data.email.trim().length > 200) {
      newErrors.email = 'El Email no puede exceder 200 caracteres';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!data.empresa.trim()) {
      newErrors.empresa = 'La Empresa es requerida';
    } else if (data.empresa.trim().length > 100) {
      newErrors.empresa = 'La Empresa no puede exceder 100 caracteres';
    } else if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ.\s]+$/.test(data.empresa.trim())) {
      newErrors.empresa = 'La Empresa solo puede contener letras y tildes';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validatePersonalData(personalData);
    
    if (Object.keys(validationErrors).length === 0) {
      onContinue(personalData);
    } else {
      setErrors(validationErrors);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg p-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Información Personal</h2>

      <div className="space-y-4">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RUT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="rut"
            value={personalData.rut}
            onChange={handlePersonalDataChange}
            onBlur={handleRutBlur}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cuestionario-input ${errors.rut ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Ej: 12.345.678-9"
            maxLength="12"
            disabled={loadingRUT}
          />
          {loadingRUT && <p className="text-blue-500 text-sm mt-1">Consultando RUT...</p>}
          {errors.rut && <p className="text-red-500 text-sm mt-1">{errors.rut}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nombre"
            value={personalData.nombre}
            onChange={handlePersonalDataChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cuestionario-input ${errors.nombre ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Ej: Juan Pérez"
            maxLength="100"
            readOnly={loadingRUT}
          />
          {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono <span className="text-red-500">*</span>
          </label>

          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-600">
              +56
            </span>

            <input
              type="tel"
              name="telefono"
              value={personalData.telefono}
              onChange={handlePersonalDataChange}
              className={`w-full px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cuestionario-input ${errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Ej: 9 1234 5678"
              maxLength="9"
            />
          </div>

          {errors.telefono && (
            <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={personalData.email}
            onChange={handlePersonalDataChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cuestionario-input ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Ej: juan@ejemplo.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="empresa"
            value={personalData.empresa}
            onChange={handlePersonalDataChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none cuestionario-input ${errors.empresa ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Ej: Empresa S.A."
            maxLength="100"
          />
          {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        Continuar a las Preguntas
      </button>
    </form>
  );
}
