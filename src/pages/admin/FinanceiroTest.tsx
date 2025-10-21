import React from 'react';

const FinanceiroTest = () => {
  console.log('🧪 FinanceiroTest component rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🧪 Teste do Módulo Financeiro</h1>
      <p>Se você está vendo esta mensagem, o componente está renderizando corretamente.</p>
      <p>O problema pode estar nos hooks ou componentes complexos.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e0e0e0', borderRadius: '5px' }}>
        <strong>Status:</strong> Componente funcionando!
      </div>
    </div>
  );
};

export default FinanceiroTest;
