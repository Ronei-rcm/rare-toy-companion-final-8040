
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import ProdutoAcoesDropdown from './ProdutoAcoesDropdown';
import ProdutoThumbnail from './ProdutoThumbnail';
import ProdutoCategoria from './ProdutoCategoria';
import ProdutoPreco from './ProdutoPreco';
import ProdutoEstoque from './ProdutoEstoque';
import { Produto } from '@/types/produto';

interface ProdutoItemProps {
  produto: Produto;
  onVisualizar: (id: string) => void;
  onEditar: (id: string) => void;
  onDuplicar: (id: string) => void;
  onExcluir: (id: string) => void;
}

const ProdutoItem = ({ 
  produto, 
  onVisualizar, 
  onEditar, 
  onDuplicar, 
  onExcluir 
}: ProdutoItemProps) => {
  return (
    <TableRow key={produto.id}>
      <TableCell>
        <ProdutoThumbnail produto={produto} />
      </TableCell>
      <TableCell>
        <ProdutoCategoria produto={produto} />
      </TableCell>
      <TableCell>
        <ProdutoPreco produto={produto} />
      </TableCell>
      <TableCell>
        <ProdutoEstoque produto={produto} />
      </TableCell>
      <TableCell className="text-right">
        <ProdutoAcoesDropdown
          produtoId={produto.id}
          onVisualizar={onVisualizar}
          onEditar={onEditar}
          onDuplicar={onDuplicar}
          onExcluir={onExcluir}
        />
      </TableCell>
    </TableRow>
  );
};

export default ProdutoItem;
