import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, Plus, Trash2, Edit, Link, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Wishlist {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  share_token: string;
  icon: string;
  color: string;
  items_count: number;
  total_value: number;
}

interface WishlistManagerProps {
  userId: string;
  onSelectWishlist: (wishlistId: string) => void;
}

export function WishlistManager({ userId, onSelectWishlist }: WishlistManagerProps) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('heart');
  const [newListColor, setNewListColor] = useState('purple');
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchWishlists();
  }, [userId]);

  const fetchWishlists = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/wishlists/user/${userId}`);
      const data = await response.json();
      setWishlists(data.wishlists || []);
    } catch (error) {
      console.error('Erro ao carregar wishlists:', error);
    }
  };

  const createWishlist = async () => {
    if (!newListName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para a lista',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/wishlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newListName,
          icon: newListIcon,
          color: newListColor,
          is_public: isPublic,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Lista criada!',
          description: `"${newListName}" foi criada com sucesso.`,
        });
        setNewListName('');
        setIsCreating(false);
        fetchWishlists();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a lista',
        variant: 'destructive',
      });
    }
  };

  const shareWishlist = async (wishlist: Wishlist) => {
    const shareUrl = `${window.location.origin}/wishlist/${wishlist.share_token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: wishlist.name,
          text: `Confira minha lista de desejos: ${wishlist.name}`,
          url: shareUrl,
        });
        toast({
          title: 'Compartilhado!',
          description: 'Link compartilhado com sucesso',
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copiado!',
        description: 'Cole em qualquer lugar para compartilhar',
      });
    }
  };

  const deleteWishlist = async (wishlistId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/wishlists/${wishlistId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Lista excluída',
          description: 'A lista foi removida',
        });
        fetchWishlists();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a lista',
        variant: 'destructive',
      });
    }
  };

  const iconMap = {
    heart: '❤️',
    gift: '🎁',
    star: '⭐',
    cart: '🛒',
    bookmark: '🔖',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas Listas</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Lista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Lista</DialogTitle>
              <DialogDescription>
                Organize seus produtos favoritos em listas personalizadas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Nome da lista</Label>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Lista de Natal, Aniversário..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ícone</Label>
                  <Select value={newListIcon} onValueChange={setNewListIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(iconMap).map(([key, emoji]) => (
                        <SelectItem key={key} value={key}>
                          {emoji} {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cor</Label>
                  <Select value={newListColor} onValueChange={setNewListColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purple">Roxo</SelectItem>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                      <SelectItem value="yellow">Amarelo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="public">Lista pública (compartilhável)</Label>
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <Button onClick={createWishlist} className="w-full">
                Criar Lista
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de listas */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishlists.map((wishlist) => (
          <motion.div
            key={wishlist.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card
              className={`p-6 cursor-pointer hover:shadow-lg transition-all border-l-4 border-${wishlist.color}-500`}
              onClick={() => onSelectWishlist(wishlist.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{iconMap[wishlist.icon]}</span>
                  <div>
                    <h3 className="font-bold">{wishlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {wishlist.items_count} {wishlist.items_count === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                {wishlist.is_public && (
                  <Badge variant="secondary">Pública</Badge>
                )}
              </div>

              {wishlist.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {wishlist.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-bold text-purple-600">
                  R$ {wishlist.total_value?.toFixed(2) || '0.00'}
                </span>

                <div className="flex gap-2">
                  {wishlist.is_public && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        shareWishlist(wishlist);
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWishlist(wishlist.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {wishlists.length === 0 && (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma lista ainda</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira lista de desejos e organize seus produtos favoritos!
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Lista
          </Button>
        </Card>
      )}
    </div>
  );
}

