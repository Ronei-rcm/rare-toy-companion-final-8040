import { request, API_BASE_URL } from './api-config';
import { useState, useCallback, useEffect } from 'react';

/**
 * Sistema Avançado de Lista de Desejos e Favoritos
 * Gestão completa de produtos favoritos e alertas
 */

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  category: string;
  brand?: string;
  sku?: string;
  addedAt: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  notifyOnSale: boolean;
  notifyOnStock: boolean;
  notifyOnPriceDrop: boolean;
  targetPrice?: number;
  quantity: number;
  metadata?: Record<string, any>;
}

interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  items: WishlistItem[];
  createdAt: string;
  updatedAt: string;
  sharedWith: string[];
  viewCount: number;
  likeCount: number;
}

interface PriceAlert {
  id: string;
  productId: string;
  userId: string;
  currentPrice: number;
  targetPrice: number;
  alertType: 'price_drop' | 'price_increase' | 'sale_start' | 'sale_end';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  metadata?: Record<string, any>;
}

interface StockAlert {
  id: string;
  productId: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  metadata?: Record<string, any>;
}

interface WishlistShare {
  id: string;
  wishlistId: string;
  shareCode: string;
  expiresAt: string;
  isActive: boolean;
  viewCount: number;
  createdAt: string;
}

interface WishlistStats {
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  categories: Array<{
    category: string;
    count: number;
    value: number;
  }>;
  brands: Array<{
    brand: string;
    count: number;
    value: number;
  }>;
  priceRanges: Array<{
    range: string;
    count: number;
  }>;
  oldestItem: WishlistItem | null;
  newestItem: WishlistItem | null;
  mostExpensive: WishlistItem | null;
  leastExpensive: WishlistItem | null;
}

class WishlistManager {
  private wishlists: Map<string, Wishlist> = new Map();
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private stockAlerts: Map<string, StockAlert> = new Map();
  private shares: Map<string, WishlistShare> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  // Inicializar sistema
  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadWishlists();
      await this.loadAlerts();
      this.isInitialized = true;
      console.log('💝 Sistema de lista de desejos inicializado');
    } catch (error) {
      console.error('Erro ao inicializar wishlist:', error);
    }
  }

  // Carregar listas de desejos
  private async loadWishlists() {
    try {
      const wishlists = await request<Wishlist[]>('/wishlist');
      wishlists.forEach((wishlist: Wishlist) => {
        this.wishlists.set(wishlist.id, wishlist);
      });
    } catch (error) {
      console.error('Erro ao carregar wishlists:', error);
    }
  }

  // Carregar alertas
  private async loadAlerts() {
    try {
      const [priceAlerts, stockAlerts] = await Promise.all([
        request<PriceAlert[]>('/wishlist/alerts/price'),
        request<StockAlert[]>('/wishlist/alerts/stock')
      ]);

      priceAlerts.forEach((alert: PriceAlert) => {
        this.priceAlerts.set(alert.id, alert);
      });

      stockAlerts.forEach((alert: StockAlert) => {
        this.stockAlerts.set(alert.id, alert);
      });
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  }

  // Criar lista de desejos
  async createWishlist(name: string, description?: string, isPublic: boolean = false): Promise<string | null> {
    try {
      const wishlist = await request<Wishlist>('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ name, description, isPublic })
      });

      this.wishlists.set(wishlist.id, wishlist);
      return wishlist.id;
    } catch (error) {
      console.error('Erro ao criar wishlist:', error);
      return null;
    }
  }

  // Adicionar item à wishlist
  async addToWishlist(
    wishlistId: string,
    product: Omit<WishlistItem, 'id' | 'addedAt'>,
    targetPrice?: number
  ): Promise<boolean> {
    try {
      await request(`/wishlist/${wishlistId}/items`, {
        method: 'POST',
        body: JSON.stringify({ ...product, targetPrice })
      });

      const wishlist = this.wishlists.get(wishlistId);
      if (wishlist) {
        const newItem: WishlistItem = {
          ...product,
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString()
        };
        wishlist.items.push(newItem);
        wishlist.updatedAt = new Date().toISOString();
      }

      // Criar alerta de preço se especificado
      if (targetPrice && targetPrice < product.price) {
        await this.createPriceAlert(product.productId, product.price, targetPrice);
      }

      return true;
    } catch (error) {
      console.error('Erro ao adicionar à wishlist:', error);
      return false;
    }
  }

  // Remover item da wishlist
  async removeFromWishlist(wishlistId: string, itemId: string): Promise<boolean> {
    try {
      await request(`/wishlist/${wishlistId}/items/${itemId}`, {
        method: 'DELETE'
      });

      const wishlist = this.wishlists.get(wishlistId);
      if (wishlist) {
        wishlist.items = wishlist.items.filter(item => item.id !== itemId);
        wishlist.updatedAt = new Date().toISOString();
      }
      return true;
    } catch (error) {
      console.error('Erro ao remover da wishlist:', error);
      return false;
    }
  }

  // Atualizar item da wishlist
  async updateWishlistItem(
    wishlistId: string,
    itemId: string,
    updates: Partial<WishlistItem>
  ): Promise<boolean> {
    try {
      await request(`/wishlist/${wishlistId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      const wishlist = this.wishlists.get(wishlistId);
      if (wishlist) {
        const itemIndex = wishlist.items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          wishlist.items[itemIndex] = { ...wishlist.items[itemIndex], ...updates };
          wishlist.updatedAt = new Date().toISOString();
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar item da wishlist:', error);
      return false;
    }
  }

  // Mover item entre wishlists
  async moveItem(
    fromWishlistId: string,
    toWishlistId: string,
    itemId: string
  ): Promise<boolean> {
    try {
      await request('/wishlist/move-item', {
        method: 'POST',
        body: JSON.stringify({ fromWishlistId, toWishlistId, itemId })
      });

      const fromWishlist = this.wishlists.get(fromWishlistId);
      const toWishlist = this.wishlists.get(toWishlistId);

      if (fromWishlist && toWishlist) {
        const item = fromWishlist.items.find(item => item.id === itemId);
        if (item) {
          fromWishlist.items = fromWishlist.items.filter(item => item.id !== itemId);
          toWishlist.items.push(item);
          fromWishlist.updatedAt = new Date().toISOString();
          toWishlist.updatedAt = new Date().toISOString();
        }
      }
      return true;
    } catch (error) {
      console.error('Erro ao mover item:', error);
      return false;
    }
  }

  // Criar alerta de preço
  async createPriceAlert(
    productId: string,
    currentPrice: number,
    targetPrice: number,
    alertType: PriceAlert['alertType'] = 'price_drop'
  ): Promise<string | null> {
    try {
      const alert = await request<PriceAlert>('/wishlist/alerts/price', {
        method: 'POST',
        body: JSON.stringify({ productId, currentPrice, targetPrice, alertType })
      });

      this.priceAlerts.set(alert.id, alert);
      return alert.id;
    } catch (error) {
      console.error('Erro ao criar alerta de preço:', error);
      return null;
    }
  }

  // Criar alerta de estoque
  async createStockAlert(productId: string): Promise<string | null> {
    try {
      const alert = await request<StockAlert>('/wishlist/alerts/stock', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });

      this.stockAlerts.set(alert.id, alert);
      return alert.id;
    } catch (error) {
      console.error('Erro ao criar alerta de estoque:', error);
      return null;
    }
  }

  // Compartilhar wishlist
  async shareWishlist(wishlistId: string, expiresInDays: number = 30): Promise<string | null> {
    try {
      const share = await request<WishlistShare>(`/wishlist/${wishlistId}/share`, {
        method: 'POST',
        body: JSON.stringify({ expiresInDays })
      });

      this.shares.set(share.id, share);
      return share.shareCode;
    } catch (error) {
      console.error('Erro ao compartilhar wishlist:', error);
      return null;
    }
  }

  // Acessar wishlist compartilhada
  async getSharedWishlist(shareCode: string): Promise<Wishlist | null> {
    try {
      return await request<Wishlist>(`/wishlist/shared/${shareCode}`);
    } catch (error) {
      console.error('Erro ao acessar wishlist compartilhada:', error);
      return null;
    }
  }

  // Obter wishlists do usuário
  getUserWishlists(): Wishlist[] {
    return Array.from(this.wishlists.values());
  }

  // Obter wishlist por ID
  getWishlist(wishlistId: string): Wishlist | null {
    return this.wishlists.get(wishlistId) || null;
  }

  // Obter wishlist padrão
  getDefaultWishlist(): Wishlist | null {
    return Array.from(this.wishlists.values()).find(w => w.isDefault) || null;
  }

  // Obter estatísticas da wishlist
  getWishlistStats(wishlistId: string): WishlistStats | null {
    const wishlist = this.wishlists.get(wishlistId);
    if (!wishlist) return null;

    const items = wishlist.items;
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const averagePrice = totalItems > 0 ? totalValue / totalItems : 0;

    // Categorias
    const categories = items.reduce((acc, item) => {
      const existing = acc.find(c => c.category === item.category);
      if (existing) {
        existing.count += item.quantity;
        existing.value += item.price * item.quantity;
      } else {
        acc.push({
          category: item.category,
          count: item.quantity,
          value: item.price * item.quantity
        });
      }
      return acc;
    }, [] as Array<{ category: string; count: number; value: number }>);

    // Marcas
    const brands = items.reduce((acc, item) => {
      if (!item.brand) return acc;
      const existing = acc.find(b => b.brand === item.brand);
      if (existing) {
        existing.count += item.quantity;
        existing.value += item.price * item.quantity;
      } else {
        acc.push({
          brand: item.brand,
          count: item.quantity,
          value: item.price * item.quantity
        });
      }
      return acc;
    }, [] as Array<{ brand: string; count: number; value: number }>);

    // Faixas de preço
    const priceRanges = [
      { range: 'Até R$ 50', count: 0 },
      { range: 'R$ 50 - R$ 100', count: 0 },
      { range: 'R$ 100 - R$ 200', count: 0 },
      { range: 'R$ 200 - R$ 500', count: 0 },
      { range: 'Acima de R$ 500', count: 0 }
    ];

    items.forEach(item => {
      const price = item.price;
      if (price <= 50) priceRanges[0].count += item.quantity;
      else if (price <= 100) priceRanges[1].count += item.quantity;
      else if (price <= 200) priceRanges[2].count += item.quantity;
      else if (price <= 500) priceRanges[3].count += item.quantity;
      else priceRanges[4].count += item.quantity;
    });

    // Itens especiais
    const sortedByDate = [...items].sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    const sortedByPrice = [...items].sort((a, b) => b.price - a.price);

    return {
      totalItems,
      totalValue,
      averagePrice,
      categories: categories.sort((a, b) => b.value - a.value),
      brands: brands.sort((a, b) => b.value - a.value),
      priceRanges,
      oldestItem: sortedByDate[0] || null,
      newestItem: sortedByDate[sortedByDate.length - 1] || null,
      mostExpensive: sortedByPrice[0] || null,
      leastExpensive: sortedByPrice[sortedByPrice.length - 1] || null
    };
  }

  // Obter alertas ativos
  getActiveAlerts(): {
    price: PriceAlert[];
    stock: StockAlert[];
  } {
    return {
      price: Array.from(this.priceAlerts.values()).filter(alert => alert.isActive),
      stock: Array.from(this.stockAlerts.values()).filter(alert => alert.isActive)
    };
  }

  // Exportar wishlist
  async exportWishlist(wishlistId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string | null> {
    try {
      const url = `${API_BASE_URL}/wishlist/${wishlistId}/export?format=${format}`;
      const response = await fetch(url, {
        headers: {
          'Accept': format === 'json' ? 'application/json' : 'application/octet-stream'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return url;
      }
    } catch (error) {
      console.error('Erro ao exportar wishlist:', error);
    }

    return null;
  }

  // Importar wishlist
  async importWishlist(file: File, wishlistId?: string): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (wishlistId) formData.append('wishlistId', wishlistId);

      const url = `${API_BASE_URL}/wishlist/import`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.wishlist) {
          this.wishlists.set(result.wishlist.id, result.wishlist);
        }
        return true;
      }
    } catch (error) {
      console.error('Erro ao importar wishlist:', error);
    }

    return false;
  }

  // Deletar wishlist
  async deleteWishlist(wishlistId: string): Promise<boolean> {
    try {
      await request(`/wishlist/${wishlistId}`, {
        method: 'DELETE'
      });
      this.wishlists.delete(wishlistId);
      return true;
    } catch (error) {
      console.error('Erro ao deletar wishlist:', error);
      return false;
    }
  }
}

// Instância global
export const wishlistManager = new WishlistManager();

// Hook para usar wishlist
export const useWishlist = () => {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWishlists = useCallback(() => {
    const userWishlists = wishlistManager.getUserWishlists();
    setWishlists(userWishlists);
  }, []);

  const createWishlist = useCallback(async (name: string, description?: string, isPublic: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const wishlistId = await wishlistManager.createWishlist(name, description, isPublic);
      if (wishlistId) {
        loadWishlists();
      }
      return wishlistId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar wishlist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadWishlists]);

  const addToWishlist = useCallback(async (
    wishlistId: string,
    product: Omit<WishlistItem, 'id' | 'addedAt'>,
    targetPrice?: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const success = await wishlistManager.addToWishlist(wishlistId, product, targetPrice);
      if (success) {
        loadWishlists();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar à wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWishlists]);

  const removeFromWishlist = useCallback(async (wishlistId: string, itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await wishlistManager.removeFromWishlist(wishlistId, itemId);
      if (success) {
        loadWishlists();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover da wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWishlists]);

  const getWishlistStats = useCallback((wishlistId: string) => {
    return wishlistManager.getWishlistStats(wishlistId);
  }, []);

  const shareWishlist = useCallback(async (wishlistId: string, expiresInDays?: number) => {
    setLoading(true);
    setError(null);

    try {
      const shareCode = await wishlistManager.shareWishlist(wishlistId, expiresInDays);
      return shareCode;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao compartilhar wishlist');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlists();
  }, [loadWishlists]);

  return {
    wishlists,
    loading,
    error,
    createWishlist,
    addToWishlist,
    removeFromWishlist,
    getWishlistStats,
    shareWishlist,
    getWishlist: (id: string) => wishlistManager.getWishlist(id),
    getDefaultWishlist: () => wishlistManager.getDefaultWishlist(),
    getActiveAlerts: () => wishlistManager.getActiveAlerts()
  };
};

export default WishlistManager;
