import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Eye, EyeOff, TrendingUp, Package, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileProductCardProps {
  produto: any;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: string) => void;
}

export function MobileProductCard({ 
  produto, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: MobileProductCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'rascunho': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'ativo' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          {/* Imagem */}
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
            {produto.imagemUrl || produto.imagem_url ? (
              <img
                src={produto.imagemUrl || produto.imagem_url}
                alt={produto.nome}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-purple-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold line-clamp-2 text-sm leading-tight">
                {produto.nome}
              </h3>
              <Badge className={`${getStatusColor(produto.status)} text-xs flex items-center gap-1 flex-shrink-0`}>
                {getStatusIcon(produto.status)}
                {produto.status}
              </Badge>
            </div>

            {/* Categoria */}
            {produto.categoria && (
              <p className="text-xs text-muted-foreground mb-2">
                {produto.categoria}
              </p>
            )}

            {/* Preço e Estoque */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600">
                  {Number(produto.preco || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {produto.estoque || 0}
                </span>
              </div>
            </div>

            {/* Badges extras */}
            <div className="flex flex-wrap gap-1">
              {produto.destaque && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Destaque
                </Badge>
              )}
              {produto.promocao && (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  🔥 Promo
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Ações (mobile-optimized) */}
        <div className="border-t bg-gray-50 p-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => onEdit(produto.id)}
            className="flex-1 gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onToggleStatus(produto.id, produto.status)}>
                {produto.status === 'ativo' ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {produto.status === 'ativo' ? 'Desativar' : 'Ativar'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(produto.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    </motion.div>
  );
}

