import { request } from './api-config';
import { useState, useCallback, useEffect } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

/**
 * Sistema Avançado de Carrinho de Compras
 * Funcionalidades inteligentes, sincronização e persistência
 */

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  quantity: number;
  maxQuantity?: number;
  category: string;
  brand?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  addedAt: string;
  lastModified: string;
  notes?: string;
  giftWrap?: boolean;
  giftMessage?: string;
  customizations?: Array<{
    type: string;
    name: string;
    value: string;
    price?: number;
  }>;
  metadata?: Record<string, any>;
}

interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  discounts: Array<{
    id: string;
    type: 'coupon' | 'promotion' | 'loyalty' | 'bulk';
    code?: string;
    name: string;
    description: string;
    value: number;
    percentage?: number;
    appliedAt: string;
    expiresAt?: string;
  }>;
  shipping: {
    method?: string;
    cost: number;
    estimatedDays?: number;
    freeShippingThreshold?: number;
    address?: any;
  };
  taxes: {
    total: number;
    breakdown: Array<{
      type: string;
      name: string;
      rate: number;
      amount: number;
    }>;
  };
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  abandonedAt?: string;
  metadata?: Record<string, any>;
}

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  brand?: string;
  addedAt: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  notifyOnSale: boolean;
  notifyOnStock: boolean;
  metadata?: Record<string, any>;
}

interface CartComparison {
  id: string;
  name: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    imageUrl?: string;
    specifications: Record<string, any>;
    pros: string[];
    cons: string[];
    rating: number;
    reviews: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface CartRecommendation {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  reason: 'frequently_bought_together' | 'similar_products' | 'trending' | 'personalized' | 'complementary';
  confidence: number;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  urgency?: 'low' | 'medium' | 'high';
}

class AdvancedCartManager {
  private carts: Map<string, Cart> = new Map();
  private wishlists: Map<string, WishlistItem[]> = new Map();
  private comparisons: Map<string, CartComparison> = new Map();
  private recommendations: Map<string, CartRecommendation[]> = new Map();
  private isInitialized: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  // Inicializar sistema
  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadCart();
      await this.loadWishlist();
      this.startSync();
      this.isInitialized = true;
      console.log('🛒 Sistema avançado de carrinho inicializado');
    } catch (error) {
      console.error('Erro ao inicializar carrinho:', error);
    }
  }

  // Carregar carrinho
  private async loadCart() {
    try {
      const data = await request<any>('/cart');
      // O carrinho pode vir direto ou dentro de uma propriedade 'cart' ou 'data'
      const cartData = data && !Array.isArray(data) && (data.cart || data.data || data);

      if (cartData && cartData.id) {
        this.carts.set('current', cartData);
      } else if (Array.isArray(cartData)) {
        console.warn('⚠️ [AdvancedCart] Recebeu array em vez de objeto de carrinho único');
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  }

  // Carregar wishlist
  private async loadWishlist() {
    try {
      const data = await request<any>('/wishlist');
      const wishlistData = this.normalizeArray<WishlistItem>(data, 'wishlist');
      this.wishlists.set('current', wishlistData);
    } catch (error) {
      console.error('Erro ao carregar wishlist:', error);
    }
  }

  // Utilitário para normalizar respostas de array da API
  private normalizeArray<T>(data: any, context: string): T[] {
    if (Array.isArray(data)) return data;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    if (data && data.items && Array.isArray(data.items)) return data.items;
    if (data && data[context] && Array.isArray(data[context])) return data[context];

    console.warn(`⚠️ [AdvancedCart] Resposta de ${context} não é um array:`, data);
    return [];
  }

  // Iniciar sincronização
  private startSync() {
    // Sincronizar a cada 30 segundos
    this.syncInterval = setInterval(() => {
      this.syncCart();
    }, 30000);
  }

  // Sincronizar carrinho
  private async syncCart() {
    const cart = this.carts.get('current');
    if (!cart) return;

    try {
      const data = await request<any>('/cart/sync', {
        method: 'POST',
        body: JSON.stringify(cart)
      });

      const updatedCart = data && !Array.isArray(data) && (data.cart || data.data || data);
      if (updatedCart && updatedCart.id) {
        this.carts.set('current', updatedCart);
      }
    } catch (error) {
      console.error('Erro ao sincronizar carrinho:', error);
    }
  }

  // Adicionar item ao carrinho
  async addItem(item: Omit<CartItem, 'id' | 'addedAt' | 'lastModified'>): Promise<boolean> {
    const cart = this.carts.get('current') || this.createEmptyCart();

    const newItem: CartItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Verificar se item já existe
    const existingItemIndex = cart.items.findIndex(
      existingItem => existingItem.productId === newItem.productId
    );

    if (existingItemIndex >= 0) {
      // Atualizar quantidade
      cart.items[existingItemIndex].quantity += newItem.quantity;
      cart.items[existingItemIndex].lastModified = new Date().toISOString();
    } else {
      // Adicionar novo item
      cart.items.push(newItem);
    }

    this.updateCartTotals(cart);
    this.carts.set('current', cart);

    // Sincronizar com servidor
    await this.syncCart();

    return true;
  }

  // Remover item do carrinho
  async removeItem(itemId: string): Promise<boolean> {
    const cart = this.carts.get('current');
    if (!cart) return false;

    cart.items = cart.items.filter(item => item.id !== itemId);
    this.updateCartTotals(cart);
    this.carts.set('current', cart);

    await this.syncCart();
    return true;
  }

  // Atualizar quantidade
  async updateQuantity(itemId: string, quantity: number): Promise<boolean> {
    const cart = this.carts.get('current');
    if (!cart) return false;

    const item = cart.items.find(item => item.id === itemId);
    if (!item) return false;

    if (quantity <= 0) {
      return await this.removeItem(itemId);
    }

    item.quantity = quantity;
    item.lastModified = new Date().toISOString();
    this.updateCartTotals(cart);
    this.carts.set('current', cart);

    await this.syncCart();
    return true;
  }

  // Aplicar cupom de desconto
  async applyCoupon(code: string): Promise<{ success: boolean; message: string; discount?: any }> {
    try {
      const result = await request<any>('/cart/coupon', {
        method: 'POST',
        body: JSON.stringify({ code })
      });

      const cart = this.carts.get('current');
      if (cart && result.discount) {
        cart.discounts.push(result.discount);
        this.updateCartTotals(cart);
        this.carts.set('current', cart);
      }
      return { success: true, message: result.message || 'Cupom aplicado!', discount: result.discount };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao aplicar cupom' };
    }
  }

  // Remover cupom
  async removeCoupon(couponId: string): Promise<boolean> {
    const cart = this.carts.get('current');
    if (!cart) return false;

    cart.discounts = cart.discounts.filter(discount => discount.id !== couponId);
    this.updateCartTotals(cart);
    this.carts.set('current', cart);

    await this.syncCart();
    return true;
  }

  // Adicionar à wishlist
  async addToWishlist(item: Omit<WishlistItem, 'id' | 'addedAt'>): Promise<boolean> {
    const wishlist = this.wishlists.get('current') || [];

    const newItem: WishlistItem = {
      ...item,
      id: `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString()
    };

    // Verificar se já existe
    const exists = wishlist.some(wishItem => wishItem.productId === newItem.productId);
    if (exists) return false;

    wishlist.push(newItem);
    this.wishlists.set('current', wishlist);

    // Sincronizar com servidor
    try {
      await request('/wishlist', {
        method: 'POST',
        body: JSON.stringify(newItem)
      });
    } catch (error) {
      console.error('Erro ao sincronizar wishlist:', error);
    }

    return true;
  }

  // Remover da wishlist
  async removeFromWishlist(itemId: string): Promise<boolean> {
    const wishlist = this.wishlists.get('current') || [];
    const updatedWishlist = wishlist.filter(item => item.id !== itemId);
    this.wishlists.set('current', updatedWishlist);

    try {
      await request(`/wishlist/${itemId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Erro ao remover da wishlist:', error);
    }

    return true;
  }

  // Mover da wishlist para carrinho
  async moveToCart(wishlistItemId: string): Promise<boolean> {
    const wishlist = this.wishlists.get('current') || [];
    const item = wishlist.find(wishItem => wishItem.id === wishlistItemId);

    if (!item) return false;

    const cartItem: Omit<CartItem, 'id' | 'addedAt' | 'lastModified'> = {
      productId: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: 1,
      category: item.category,
      brand: item.brand
    };

    const added = await this.addItem(cartItem);
    if (added) {
      await this.removeFromWishlist(wishlistItemId);
    }

    return added;
  }

  // Criar comparação
  async createComparison(name: string, productIds: string[]): Promise<string | null> {
    try {
      const comparison = await request<CartComparison>('/cart/comparison', {
        method: 'POST',
        body: JSON.stringify({ name, productIds })
      });

      this.comparisons.set(comparison.id, comparison);
      return comparison.id;
    } catch (error) {
      console.error('Erro ao criar comparação:', error);
    }

    return null;
  }

  // Obter recomendações
  async getRecommendations(limit: number = 5): Promise<CartRecommendation[]> {
    const cart = this.carts.get('current');
    if (!cart || cart.items.length === 0) return [];

    try {
      const data = await request<any>(`/cart/recommendations?limit=${limit}`);
      const recommendations = this.normalizeArray<CartRecommendation>(data, 'recommendations');
      this.recommendations.set('current', recommendations);
      return recommendations;
    } catch (error) {
      console.error('Erro ao obter recomendações:', error);
    }

    return this.recommendations.get('current') || [];
  }

  // Salvar carrinho para depois
  async saveForLater(cartId: string, name: string): Promise<boolean> {
    try {
      await request('/cart/save', {
        method: 'POST',
        body: JSON.stringify({ cartId, name })
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
      return false;
    }
  }

  // Restaurar carrinho salvo
  async restoreCart(savedCartId: string): Promise<boolean> {
    try {
      const cart = await request<Cart>(`/cart/restore/${savedCartId}`, {
        method: 'POST'
      });
      this.carts.set('current', cart);
      return true;
    } catch (error) {
      console.error('Erro ao restaurar carrinho:', error);
    }

    return false;
  }

  // Calcular totais do carrinho
  private updateCartTotals(cart: Cart) {
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Calcular descontos
    const totalDiscount = cart.discounts.reduce((sum, discount) => {
      if (discount.percentage) {
        return sum + (cart.subtotal * discount.percentage / 100);
      }
      return sum + discount.value;
    }, 0);

    // Calcular impostos (simplificado)
    const taxRate = 0.1; // 10% de imposto
    cart.taxes.total = (cart.subtotal - totalDiscount) * taxRate;
    cart.taxes.breakdown = [{
      type: 'sales_tax',
      name: 'Imposto sobre Vendas',
      rate: taxRate,
      amount: cart.taxes.total
    }];

    // Calcular frete
    const shippingCost = cart.shipping.cost || 0;
    if (cart.shipping.freeShippingThreshold && cart.subtotal >= cart.shipping.freeShippingThreshold) {
      cart.shipping.cost = 0;
    }

    cart.total = cart.subtotal - totalDiscount + cart.taxes.total + cart.shipping.cost;
    cart.updatedAt = new Date().toISOString();
  }

  // Criar carrinho vazio
  private createEmptyCart(): Cart {
    return {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      items: [],
      subtotal: 0,
      discounts: [],
      shipping: { cost: 0 },
      taxes: { total: 0, breakdown: [] },
      total: 0,
      currency: 'BRL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Obter carrinho atual
  getCurrentCart(): Cart | null {
    return this.carts.get('current') || null;
  }

  // Obter wishlist atual
  getCurrentWishlist(): WishlistItem[] {
    return this.wishlists.get('current') || [];
  }

  // Obter comparações
  getComparisons(): CartComparison[] {
    return Array.from(this.comparisons.values());
  }

  // Limpar carrinho
  async clearCart(): Promise<boolean> {
    const cart = this.createEmptyCart();
    this.carts.set('current', cart);

    try {
      await request('/cart/clear', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }

    return true;
  }

  // Destruir instância
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Instância global
export const advancedCart = new AdvancedCartManager();

// Hook para usar carrinho avançado
export const useAdvancedCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(() => {
    const currentCart = advancedCart.getCurrentCart();
    setCart(currentCart);
  }, []);

  const loadWishlist = useCallback(() => {
    const currentWishlist = advancedCart.getCurrentWishlist();
    setWishlist(currentWishlist);
  }, []);

  const addItem = useCallback(async (item: Omit<CartItem, 'id' | 'addedAt' | 'lastModified'>) => {
    setLoading(true);
    setError(null);

    try {
      const success = await advancedCart.addItem(item);
      if (success) {
        loadCart();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const removeItem = useCallback(async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await advancedCart.removeItem(itemId);
      if (success) {
        loadCart();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover item');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setLoading(true);
    setError(null);

    try {
      const success = await advancedCart.updateQuantity(itemId, quantity);
      if (success) {
        loadCart();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar quantidade');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const addToWishlist = useCallback(async (item: Omit<WishlistItem, 'id' | 'addedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const success = await advancedCart.addToWishlist(item);
      if (success) {
        loadWishlist();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar à wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWishlist]);

  const removeFromWishlist = useCallback(async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await advancedCart.removeFromWishlist(itemId);
      if (success) {
        loadWishlist();
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover da wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadWishlist]);

  const applyCoupon = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await advancedCart.applyCoupon(code);
      if (result.success) {
        loadCart();
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar cupom');
      return { success: false, message: 'Erro ao aplicar cupom' };
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  const getRecommendations = useCallback(async (limit?: number) => {
    try {
      return await advancedCart.getRecommendations(limit || 5);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter recomendações');
      return [];
    }
  }, []);

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, [loadCart, loadWishlist]);

  return {
    cart,
    wishlist,
    loading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    addToWishlist,
    removeFromWishlist,
    applyCoupon,
    getRecommendations,
    clearCart: () => advancedCart.clearCart(),
    getComparisons: () => advancedCart.getComparisons()
  };
};

export default AdvancedCartManager;
