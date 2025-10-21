
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, Package, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import CartLoadingOverlay from './CartLoadingOverlay';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';

const CarrinhoItems = () => {
  const { state, removeItem, updateQuantity, clearCorruptedCart } = useCart();
  const { toast } = useToast();

  const handleRemoverItem = (id: string) => {
    removeItem(id);
  };

  const handleAtualizarQuantidade = (id: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoverItem(id);
      return;
    }
    updateQuantity(id, novaQuantidade);
  };


  // Se o carrinho estiver vazio
  if (state.itens.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-muted-foreground text-center p-6">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium mb-2">Seu carrinho está vazio</p>
          <p className="text-sm">Adicione alguns produtos incríveis para começar sua compra!</p>
        </div>
      </Card>
    );
  }

  // Verificar se há itens com estoque incorreto
  const hasCorruptedItems = state.itens.some(item => 
    item.produto.estoque === 0 && item.produto.nome === 'Udy'
  );

  return (
    <div className="space-y-4 relative">
      <CartLoadingOverlay 
        isLoading={state.isLoading} 
        message="Atualizando carrinho..." 
      />
      
      {/* Botão de correção temporário */}
      {hasCorruptedItems && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-800 font-medium">⚠️ Dados corrompidos detectados</p>
              <p className="text-red-600 text-sm">O produto Udy está mostrando estoque incorreto</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearCorruptedCart}
            >
              Corrigir Carrinho
            </Button>
          </div>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Itens do Carrinho ({state.quantidadeTotal} item{state.quantidadeTotal !== 1 ? 's' : ''})</h2>
          
          <div className="space-y-6">
            {state.itens.map((item, index) => {
              const produto = item.produto;
              const isLastItem = index === state.itens.length - 1;
              
              return (
                <div key={item.id}>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Imagem do produto */}
                    <div className="w-full sm:w-24 h-24 flex-shrink-0">
                      <OptimizedProductImage
                        produto={produto}
                        alt={produto.nome}
                        className="rounded-md border"
                        aspectRatio={1}
                        showSkeleton={true}
                      />
                    </div>
                    
                    {/* Informações do produto */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-medium text-base leading-tight">{produto.nome}</h3>
                        
                        {/* Informações adicionais do produto */}
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                          {produto.categoria && (
                            <Badge variant="outline" className="text-xs">
                              {produto.categoria}
                            </Badge>
                          )}
                          {produto.marca && (
                            <span className="text-xs">• {produto.marca}</span>
                          )}
                          {produto.cor && (
                            <span className="text-xs">• Cor: {produto.cor}</span>
                          )}
                        </div>

                        {/* Status do estoque */}
                        {produto.estoque !== undefined && produto.estoque !== null && produto.estoque <= 5 && produto.estoque > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            Apenas {produto.estoque} em estoque!
                          </div>
                        )}
                        
                        {produto.estoque !== undefined && produto.estoque !== null && produto.estoque <= 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Fora de estoque
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-3">
                        {/* Controles de quantidade */}
                        <div className="flex items-center border rounded-md">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted" 
                            onClick={() => handleAtualizarQuantidade(item.id, item.quantidade - 1)}
                            disabled={item.quantidade <= 1 || state.isLoading}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="mx-3 w-8 text-center font-medium">{item.quantidade}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleAtualizarQuantidade(item.id, item.quantidade + 1)}
                            disabled={state.isLoading}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Preço */}
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            R$ {(produto.preco * item.quantidade).toFixed(2)}
                          </div>
                          {item.quantidade > 1 && (
                            <div className="text-sm text-muted-foreground">
                              R$ {produto.preco.toFixed(2)} cada
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botão remover */}
                    <div className="flex flex-col justify-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoverItem(item.id)}
                        disabled={state.isLoading}
                        className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                        title="Remover item do carrinho"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {!isLastItem && <Separator className="my-4" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarrinhoItems;
