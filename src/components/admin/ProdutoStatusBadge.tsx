
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Star, Tag, AlertTriangle } from 'lucide-react';

// Enum de tipos de status para maior consistência
export enum ProdutoStatus {
  SEM_ESTOQUE = 'sem_estoque',
  BAIXO_ESTOQUE = 'baixo_estoque',
  PROMOCAO = 'promocao',
  LANCAMENTO = 'lancamento',
  PRE_VENDA = 'pre_venda',
  EXCLUSIVO = 'exclusivo',
  ATIVO = 'ativo',
  ULTIMAS_UNIDADES = 'ultimas_unidades',
  IMPORTADO = 'importado'
}

interface ProdutoStatusBadgeProps {
  status: string;
  estoque: number;
}

const ProdutoStatusBadge = ({ status, estoque }: ProdutoStatusBadgeProps) => {
  // Status específico definido diretamente
  if (status === ProdutoStatus.SEM_ESTOQUE || estoque === 0) {
    return (
      <Badge variant="destructive" className="flex gap-1 items-center">
        <AlertTriangle className="h-3 w-3" />
        <span>Sem Estoque</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.BAIXO_ESTOQUE || (estoque > 0 && estoque <= 15)) {
    return (
      <Badge 
        variant="outline" 
        className="text-amber-600 border-amber-600 flex gap-1 items-center"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Baixo Estoque</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.ULTIMAS_UNIDADES || (estoque > 0 && estoque <= 5)) {
    return (
      <Badge 
        className="bg-red-400 hover:bg-red-500 flex gap-1 items-center"
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Últimas Unidades</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.PROMOCAO) {
    return (
      <Badge 
        className="bg-green-500 hover:bg-green-600 flex gap-1 items-center"
      >
        <Tag className="h-3 w-3" />
        <span>Promoção</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.LANCAMENTO) {
    return (
      <Badge 
        className="bg-purple-500 hover:bg-purple-600 flex gap-1 items-center"
      >
        <Zap className="h-3 w-3" />
        <span>Lançamento</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.PRE_VENDA) {
    return (
      <Badge 
        className="bg-blue-500 hover:bg-blue-600 flex gap-1 items-center"
      >
        <Clock className="h-3 w-3" />
        <span>Pré-Venda</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.EXCLUSIVO) {
    return (
      <Badge 
        className="bg-orange-500 hover:bg-orange-600 flex gap-1 items-center"
      >
        <Star className="h-3 w-3" />
        <span>Exclusivo</span>
      </Badge>
    );
  }
  
  if (status === ProdutoStatus.IMPORTADO) {
    return (
      <Badge 
        className="bg-teal-500 hover:bg-teal-600 flex gap-1 items-center"
      >
        <Zap className="h-3 w-3" />
        <span>Importado</span>
      </Badge>
    );
  }
  
  // Padrão para produtos ativos
  return <Badge variant="default">Ativo</Badge>;
};

export default ProdutoStatusBadge;
