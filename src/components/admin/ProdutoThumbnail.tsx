
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Produto } from '@/types/produto';

interface ProdutoThumbnailProps {
  produto: Produto;
}

const ProdutoThumbnail = ({ produto }: ProdutoThumbnailProps) => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
        <img
          src={produto.imagemUrl}
          alt={produto.nome}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <div className="font-medium">{produto.nome}</div>
        {produto.fornecedor && (
          <div className="text-xs text-muted-foreground">
            Fornecedor: {produto.fornecedor}
          </div>
        )}
      </div>
      {produto.destaque && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          Destaque
        </Badge>
      )}
    </div>
  );
};

export default ProdutoThumbnail;
