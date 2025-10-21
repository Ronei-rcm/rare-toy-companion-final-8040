import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Trash2, Check, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProductDrafts() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos?status=rascunho`);
      const data = await response.json();
      setDrafts(data.produtos || []);
    } catch (error) {
      console.error('Erro ao carregar rascunhos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (productId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ativo' }),
      });

      if (response.ok) {
        toast({
          title: 'Produto publicado! 🎉',
          description: 'O produto está agora visível na loja',
        });
        fetchDrafts();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível publicar o produto',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('Excluir este rascunho?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Rascunho excluído',
        });
        fetchDrafts();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileEdit className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum rascunho</h3>
        <p className="text-muted-foreground">
          Use o cadastro rápido e salve como rascunho para completar depois
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Rascunhos</h3>
          <p className="text-sm text-muted-foreground">
            {drafts.length} {drafts.length === 1 ? 'produto' : 'produtos'} para completar
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Clock className="w-3 h-3 mr-1" />
          Pendentes
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {drafts.map((draft) => (
          <motion.div
            key={draft.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagem ou placeholder */}
              <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                {draft.imagemUrl || draft.imagem_url ? (
                  <img
                    src={draft.imagemUrl || draft.imagem_url}
                    alt={draft.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileEdit className="w-12 h-12 text-purple-400" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold line-clamp-1">{draft.nome}</h4>
                  <p className="text-sm text-muted-foreground">
                    {draft.categoria || 'Sem categoria'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    R$ {Number(draft.preco || 0).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {draft.estoque || 0} un.
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Criado{' '}
                  {formatDistanceToNow(new Date(draft.createdAt || draft.created_at || Date.now()), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handlePublish(draft.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Publicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/admin/produtos/${draft.id}/edit`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(draft.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

