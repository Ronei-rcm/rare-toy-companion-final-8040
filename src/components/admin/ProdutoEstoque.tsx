
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProdutoStatusBadge from './ProdutoStatusBadge';
import { Produto } from '@/types/produto';

interface ProdutoEstoqueProps {
  produto: Produto;
}

const ProdutoEstoque = ({ produto }: ProdutoEstoqueProps) => {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`${produto.estoque === 0 ? 'text-red-500' : produto.estoque <= 15 ? 'text-amber-500' : ''}`}>
              {produto.estoque}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quantidade em estoque</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <ProdutoStatusBadge status={produto.status} estoque={produto.estoque} />
      {produto.origem && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
          {produto.origem}
        </Badge>
      )}
    </div>
  );
};

export default ProdutoEstoque;
