
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PackageIcon } from 'lucide-react';
import { Produto } from '@/types/produto';

interface ProdutoCategoriaProps {
  produto: Produto;
}

const ProdutoCategoria = ({ produto }: ProdutoCategoriaProps) => {
  return (
    <div className="space-y-1">
      <Badge variant="outline">{produto.categoria}</Badge>
      {produto.colecao && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <PackageIcon className="h-3 w-3" />
          <span>Coleção: {produto.colecao.replace("-", " ")}</span>
        </div>
      )}
    </div>
  );
};

export default ProdutoCategoria;
