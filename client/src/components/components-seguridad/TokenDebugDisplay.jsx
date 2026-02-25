import React, { useEffect, useState } from 'react';

const TokenDebugDisplay = ({ tokenValid, token, loading }) => {
  const [localStorageTokens, setLocalStorageTokens] = useState([]);

  useEffect(() => {
    // Mostrar tokens guardados en localStorage
    try {
      const tokens = localStorage.getItem('qr_tokens');
      const parsed = tokens ? JSON.parse(tokens) : [];
      setLocalStorageTokens(parsed);
    } catch (error) {
      setLocalStorageTokens([]);
    }
  }, []);

  if (loading) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
        <p className="text-sm font-medium">⏳ Validando token...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded mb-4">
        <p className="text-sm font-medium">❌ Error: Token inválido</p>
        <p className="text-xs mt-1">Token actual: {token?.substring(0, 8)}...</p>
        <p className="text-xs mt-1">Tokens guardados: {localStorageTokens.length}</p>
      </div>
    );
  }

  if (tokenValid.reason === 'Acceso directo') {
    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded mb-4">
        <p className="text-sm font-medium">🔓 Modo desarrollo - Acceso directo</p>
      </div>
    );
  }

  if (tokenValid.valid) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-4">
        <p className="text-sm font-medium">✅ Token válido</p>
        <p className="text-xs mt-1">Token: {token?.substring(0, 8)}...</p>
        <p className="text-xs">Creado: {new Date(tokenValid.createdAt).toLocaleString()}</p>
        <p className="text-xs mt-1">Tokens en localStorage: {localStorageTokens.length}</p>
        {localStorageTokens.length > 0 && (
          <details className="text-xs mt-1">
            <summary>Ver tokens guardados</summary>
            {localStorageTokens.map((t, i) => (
              <div key={i} className="ml-2 mt-1">
                {t.token?.substring(0, 8)}... - {t.used ? 'USADO' : 'DISPONIBLE'} - {new Date(t.expiresAt).toLocaleTimeString()}
              </div>
            ))}
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded mb-4">
      <p className="text-sm font-medium">❌ Acceso denegado</p>
      <p className="text-xs mt-1">Razón: {tokenValid.reason}</p>
      <p className="text-xs">Token actual: {token?.substring(0, 8)}...</p>
      <p className="text-xs mt-1">Tokens guardados: {localStorageTokens.length}</p>
      {localStorageTokens.length > 0 && (
        <details className="text-xs mt-1">
          <summary>Ver tokens guardados</summary>
          {localStorageTokens.map((t, i) => (
            <div key={i} className="ml-2 mt-1">
              {t.token?.substring(0, 8)}... - {t.used ? 'USADO' : 'DISPONIBLE'} - {new Date(t.expiresAt).toLocaleTimeString()}
            </div>
          ))}
        </details>
      )}
    </div>
  );
};

export default TokenDebugDisplay;
