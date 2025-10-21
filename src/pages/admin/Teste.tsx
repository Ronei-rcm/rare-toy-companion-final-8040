import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Teste = () => {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Página de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta é uma página de teste para verificar se as rotas estão funcionando.</p>
          <p>Se você está vendo esta mensagem, as rotas administrativas estão funcionando corretamente.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Teste;
