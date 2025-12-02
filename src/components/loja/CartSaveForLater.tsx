import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bookmark, 
  ShoppingCart, 
  Trash2, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Produto } from '@/types/produto';
import { getProductImage } from '@/utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedItem {
  id: string;
  produto: Produto;
  dataSalvo: Date;
}

const STORAGE_KEY = 'cart_saved_for_later';

export default function CartSaveForLater() {
  const { toast } = useToast();
  const { addItem } = useCart();
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToLocalStorage = (items: SavedItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar itens:', error);
    }
  };

  const handleMoveToCart = (item: SavedItem) => {
    addItem(item.produto, 1);
    const newItems = savedItems.filter(i => i.id !== item.id);
    setSavedItems(newItems);
    saveToLocalStorage(newItems);
    
    toast({
      title: 'Movido para o carrinho',
      description: `${item.produto.nome} foi adicionado ao carrinho`
    });
  };

  const handleRemove = (itemId: string) => {
    const item = savedItems.find(i => i.id === itemId);
    const newItems = savedItems.filter(i => i.id !== itemId);
    setSavedItems(newItems);
    saveToLocalStorage(newItems);
    
    toast({
      title: 'Removido',
      description: item ? `${item.produto.nome} foi removido` : 'Item removido'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
  };

  if (savedItems.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-orange-600" />
          Salvos para Depois ({savedItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {savedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src={getProductImage(item.produto.imagemUrl)}
                  alt={item.produto.nome}
                  className="w-20 h-20 object-contain rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.svg';
                  }}
                />
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.produto.nome}</h4>
                  <p className="text-lg font-bold text-orange-600 mt-1">
                    R$ {Number(item.produto.preco).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Salvo {formatDate(item.dataSalvo)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleMoveToCart(item)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Mover para Carrinho
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// Função helper para salvar item do carrinho
export function saveItemForLater(produto: Produto) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const savedItems: SavedItem[] = stored ? JSON.parse(stored) : [];
    
    // Verificar se já existe
    if (savedItems.some(item => item.produto.id === produto.id)) {
      return false; // Já está salvo
    }
    
    const newItem: SavedItem = {
      id: `${produto.id}-${Date.now()}`,
      produto,
      dataSalvo: new Date().toISOString()
    };
    
    savedItems.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItems));
    return true;
  } catch (error) {
    console.error('Erro ao salvar item:', error);
    return false;
  }
}

