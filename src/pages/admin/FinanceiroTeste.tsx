import React from 'react';

export default function FinanceiroTeste() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        💰 Sistema Financeiro - Teste
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
        <div className="space-y-2">
          <p className="text-green-600">✅ Frontend carregando</p>
          <p className="text-green-600">✅ React funcionando</p>
          <p className="text-green-600">✅ Componente renderizando</p>
        </div>
        
        <div className="mt-6">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => {
              console.log('Teste de JavaScript funcionando!');
              alert('JavaScript funcionando perfeitamente!');
            }}
          >
            Testar JavaScript
          </button>
        </div>
      </div>
    </div>
  );
}
