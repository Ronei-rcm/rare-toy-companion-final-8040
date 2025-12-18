import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCartToast } from '@/hooks/useCartToast';
import { Produto } from '@/types/produto';
import { getProductImage } from '@/utils/imageUtils';

export interface ItemCarrinho {
  id: string;
  produto: Produto;
  quantidade: number;
  dataAdicionado: Date;
}

export interface CarrinhoState {
  itens: ItemCarrinho[];
  total: number;
  quantidadeTotal: number;
  isOpen: boolean;
  isLoading: boolean;
}

// Ações
type CarrinhoAction =
  | { type: 'ADD_ITEM'; payload: { produto: Produto; quantidade?: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantidade: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CART_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_CART'; payload: ItemCarrinho[] };

// Estado inicial
const initialState: CarrinhoState = {
  itens: [],
  total: 0,
  quantidadeTotal: 0,
  isOpen: false,
  isLoading: false,
};

// Reducer
function carrinhoReducer(state: CarrinhoState, action: CarrinhoAction): CarrinhoState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { produto, quantidade = 1 } = action.payload;
      const itemExistente = state.itens.find(item => item.produto.id === produto.id);
      
      let novosItens: ItemCarrinho[];
      
      if (itemExistente) {
        novosItens = state.itens.map(item =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      } else {
        const novoItem: ItemCarrinho = {
          id: `${produto.id}-${Date.now()}`,
          produto,
          quantidade,
          dataAdicionado: new Date(),
        };
        novosItens = [...state.itens, novoItem];
      }
      
      return {
        ...state,
        itens: novosItens,
        total: calcularTotal(novosItens),
        quantidadeTotal: calcularQuantidadeTotal(novosItens),
      };
    }
    
    case 'REMOVE_ITEM': {
      const novosItens = state.itens.filter(item => item.id !== action.payload.id);
      return {
        ...state,
        itens: novosItens,
        total: calcularTotal(novosItens),
        quantidadeTotal: calcularQuantidadeTotal(novosItens),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantidade } = action.payload;
      if (quantidade <= 0) {
        return carrinhoReducer(state, { type: 'REMOVE_ITEM', payload: { id } });
      }
      
      const novosItens = state.itens.map(item =>
        item.id === id ? { ...item, quantidade } : item
      );
      
      return {
        ...state,
        itens: novosItens,
        total: calcularTotal(novosItens),
        quantidadeTotal: calcularQuantidadeTotal(novosItens),
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        itens: [],
        total: 0,
        quantidadeTotal: 0,
      };
    
    case 'TOGGLE_CART':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    
    case 'SET_CART_OPEN':
      return {
        ...state,
        isOpen: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        itens: action.payload,
        total: calcularTotal(action.payload),
        quantidadeTotal: calcularQuantidadeTotal(action.payload),
      };
    
    default:
      return state;
  }
}

// Funções auxiliares
function calcularTotal(itens: ItemCarrinho[]): number {
  return itens.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
}

function calcularQuantidadeTotal(itens: ItemCarrinho[]): number {
  return itens.reduce((total, item) => total + item.quantidade, 0);
}

// Contexto
const CartContext = createContext<{
  state: CarrinhoState;
  dispatch: React.Dispatch<CarrinhoAction>;
  addItem: (produto: Produto, quantidade?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantidade: number) => void;
  clearCart: () => void;
  clearCorruptedCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  cartToast: ReturnType<typeof useCartToast>;
} | null>(null);

// Provider
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(carrinhoReducer, initialState);
  const { toast } = useToast();
  const cartToast = useCartToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  function mapApiItemToLocal(apiItem: any): ItemCarrinho {
    const produto: Produto = {
      id: apiItem.product_id,
      nome: apiItem.name || 'Produto',
      preco: Number(apiItem.price || 0),
      imagemUrl: apiItem.image_url || null,
      descricao: apiItem.description || '',
      categoria: apiItem.categoria || '',
      estoque: apiItem.estoque !== undefined && apiItem.estoque !== null ? apiItem.estoque : 10, // Default para 10 se não definido
      status: 'ativo',
      destaque: false,
      promocao: false,
      lancamento: false,
      avaliacao: 0,
      totalAvaliacoes: 0,
      faixaEtaria: null,
      peso: null,
      dimensoes: null,
      material: null,
      marca: null,
      origem: null,
      fornecedor: null,
      codigoBarras: null,
      dataLancamento: null,
      createdAt: null,
      updatedAt: null,
    } as any;
    return {
      id: String(apiItem.id),
      produto,
      quantidade: Number(apiItem.quantity || 1),
      dataAdicionado: new Date(apiItem.created_at || Date.now()),
    };
  }

  // Carregar carrinho da API na inicialização
  useEffect(() => {
    (async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Limpar localStorage se houver dados corrompidos
        try {
          const savedCart = localStorage.getItem('muhlstore-cart');
          if (savedCart) {
            const localItems = JSON.parse(savedCart);
            // Verificar se há itens com estoque 0 incorretamente
            const hasInvalidStock = localItems.some((item: any) => 
              item.produto && item.produto.estoque === 0 && item.produto.nome === 'Udy'
            );
            
            if (hasInvalidStock) {
              console.log('🔄 Limpando carrinho com dados corrompidos...');
              localStorage.removeItem('muhlstore-cart');
            } else if (Array.isArray(localItems) && localItems.length > 0) {
              dispatch({ type: 'LOAD_CART', payload: localItems });
            }
          }
        } catch (error) {
          console.error('Erro ao carregar carrinho do localStorage:', error);
          localStorage.removeItem('muhlstore-cart');
        }
        
        // Depois, sincronizar com o servidor
        const res = await fetch(`${API_BASE_URL}/cart`, { credentials: 'include' });
        
        // Tratar erros 502 (Bad Gateway) - servidor não está respondendo
        if (res.status === 502) {
          console.warn('⚠️ Servidor não está respondendo (502). Usando carrinho local.');
          // Manter carrinho do localStorage se existir
          return;
        }
        
        if (!res.ok) {
          // Para outros erros, apenas logar mas não quebrar
          console.warn('⚠️ Erro ao carregar carrinho da API:', res.status);
          return;
        }
        
        const data = await res.json();
        const itens = Array.isArray(data.items) ? data.items.map(mapApiItemToLocal) : [];
        dispatch({ type: 'LOAD_CART', payload: itens });
      } catch (error) {
        // Erros de rede ou outros - não quebrar a aplicação
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.warn('⚠️ Erro de conexão ao carregar carrinho. Usando carrinho local.');
        } else {
        console.error('Erro ao carregar carrinho da API:', error);
        }
        // Se falhar, manter o carrinho do localStorage se existir
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  // Cache local e sincronização
  useEffect(() => {
    try { 
      localStorage.setItem('muhlstore-cart', JSON.stringify(state.itens));
      // Disparar evento customizado para sincronização entre abas
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { itens: state.itens, total: state.total, quantidadeTotal: state.quantidadeTotal }
      }));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [state.itens, state.total, state.quantidadeTotal]);

  // Escutar mudanças do carrinho em outras abas
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent) => {
      const { itens } = event.detail;
      if (JSON.stringify(itens) !== JSON.stringify(state.itens)) {
        dispatch({ type: 'LOAD_CART', payload: itens });
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, [state.itens]);

  // Sincronização periódica com o servidor (a cada 30 segundos)
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/cart`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const serverItems = Array.isArray(data.items) ? data.items.map(mapApiItemToLocal) : [];
          
          // Só atualizar se houver diferenças significativas
          if (JSON.stringify(serverItems) !== JSON.stringify(state.itens)) {
            dispatch({ type: 'LOAD_CART', payload: serverItems });
          }
        }
      } catch (error) {
        console.error('Erro na sincronização automática:', error);
      }
    };

    const interval = setInterval(syncWithServer, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [state.itens]);

  // Funções de conveniência
  const addItem = async (produto: Produto, quantidade = 1) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Feedback imediato para o usuário
      cartToast.showInfo('Adicionando ao carrinho...', `Adicionando ${produto.nome}...`, { duration: 2000 });
      
      const res = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: produto.id,
          name: produto.nome,
          price: Number(produto.preco || 0),
          image_url: (produto as any).imagemUrl || (produto as any).imagem_url || null,
          quantity: quantidade
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao adicionar item');
      }
      
      const data = await res.json();
      const itens = Array.isArray(data.items) ? data.items.map(mapApiItemToLocal) : [];
      dispatch({ type: 'LOAD_CART', payload: itens });
      dispatch({ type: 'SET_CART_OPEN', payload: true });
      
      // Feedback de sucesso com preview de imagem
      const productImage = getProductImage(produto);
      cartToast.showAddToCart(produto.nome, quantidade, productImage);
    } catch (e: any) {
      console.error('Erro ao adicionar item:', e);
      cartToast.showError(
        'Erro ao adicionar', 
        e?.message || 'Não foi possível adicionar o item. Tente novamente.',
        { duration: 5000 }
      );
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = async (id: string) => {
    const item = state.itens.find(i => i.id === id);
    if (!item) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const res = await fetch(`${API_BASE_URL}/cart/items/${id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao remover item');
      }
      
      const data = await res.json();
      const itens = Array.isArray(data.items) ? data.items.map(mapApiItemToLocal) : [];
      dispatch({ type: 'LOAD_CART', payload: itens });
      
      cartToast.showRemoveFromCart(item.produto.nome);
    } catch (e: any) {
      console.error('Erro ao remover item:', e);
      cartToast.showError(
        'Erro ao remover', 
        e?.message || 'Não foi possível remover o item. Tente novamente.',
        { duration: 5000 }
      );
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (id: string, quantidade: number) => {
    const itemAtual = state.itens.find(i => i.id === id);
    if (!itemAtual) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const res = await fetch(`${API_BASE_URL}/cart/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: quantidade })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao atualizar quantidade');
      }
      
      const data = await res.json();
      const itens = Array.isArray(data.items) ? data.items.map(mapApiItemToLocal) : [];
      dispatch({ type: 'LOAD_CART', payload: itens });
      
      // Feedback baseado na ação
      const produtoNome = itemAtual.produto.nome;
      const isIncrease = quantidade > itemAtual.quantidade;
      cartToast.showUpdateQuantity(produtoNome, quantidade, isIncrease);
      
      if (isIncrease) {
        dispatch({ type: 'SET_CART_OPEN', payload: true });
      }
    } catch (e: any) {
      console.error('Erro ao atualizar quantidade:', e);
      cartToast.showError(
        'Erro ao atualizar', 
        e?.message || 'Não foi possível atualizar a quantidade. Tente novamente.',
        { duration: 5000 }
      );
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = () => {
    // Opcional: limpar item a item pela API (não implementado lado servidor)
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem('muhlstore-cart');
    cartToast.showCartCleared();
  };

  // Função de debug para limpar carrinho corrompido
  const clearCorruptedCart = () => {
    localStorage.removeItem('muhlstore-cart');
    dispatch({ type: 'CLEAR_CART' });
    window.location.reload();
  };

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const setCartOpen = (open: boolean) => {
    dispatch({ type: 'SET_CART_OPEN', payload: open });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        clearCorruptedCart,
        toggleCart,
        setCartOpen,
        cartToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Hook personalizado
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
