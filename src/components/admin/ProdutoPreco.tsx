
import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Produto } from '@/types/produto';

interface ProdutoPrecoProps {
  produto: Produto;
}

const ProdutoPreco = ({ produto }: ProdutoPrecoProps) => {
  // Formatar a data de lançamento se existir
  const dataFormatada = produto.dataLancamento 
    ? new Date(produto.dataLancamento).toLocaleDateString('pt-BR')
    : null;
    
  return (
    <div className="space-y-1">
      <div className="font-medium">R$ {produto.preco.toFixed(2)}</div>
      {dataFormatada && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          <span>Lançamento: {dataFormatada}</span>
        </div>
      )}
    </div>
  );
};

export default ProdutoPreco;
