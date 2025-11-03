import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserStats {
  usuario: {
    id: string;
    nome: string;
    email: string;
    membro_desde: string;
  };
  pedidos: {
    total: number;
    pendentes: number;
    entregues: number;
    total_gasto: number;
    ticket_medio: number;
  };
  carrinho: {
    itens: number;
    valor: number;
  };
  favoritos: {
    total: number;
  };
  fidelidade: {
    nivel: string;
    pontos: number;
    proximo_nivel: number;
    progresso: number;
  };
}

export interface Order {
  id: string;
  status: string;
  total: number;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  metodo_pagamento: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  total_itens: number;
  itens: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  produto_nome: string;
  produto_imagem: string;
}

export interface CartData {
  carrinho: {
    cart_id: string;
    created_at: string;
    updated_at: string;
  } | null;
  itens: CartItem[];
  total: number;
  quantidade: number;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  produto_nome: string;
  produto_imagem: string;
  estoque: number;
  destaque: boolean;
}

export interface FavoriteData {
  favoritos: Favorite[];
  paginacao: {
    total: number;
    pagina: number;
    limite: number;
    total_paginas: number;
  };
}

export interface Favorite {
  favorite_id: string;
  favoritado_em: string;
  product_id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string;
  estoque: number;
  destaque: boolean;
  promocao: boolean;
  lancamento: boolean;
  marca: string;
  avaliacao: number;
  total_avaliacoes: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Hook para buscar estatísticas do usuário
export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async (): Promise<UserStats> => {
      const response = await fetch(`${API_BASE_URL}/user-stats/stats/${userId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas do usuário');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
};

// Hook para buscar pedidos do usuário
export const useUserOrders = (userId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['user-orders', userId, page, limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/user-stats/orders/${userId}?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos do usuário');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para buscar carrinho do usuário
export const useUserCart = (userId: string) => {
  return useQuery({
    queryKey: ['user-cart', userId],
    queryFn: async (): Promise<CartData> => {
      const response = await fetch(`${API_BASE_URL}/user-stats/cart/${userId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar carrinho do usuário');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    refetchOnWindowFocus: true,
  });
};

// Hook para buscar favoritos do usuário
export const useUserFavorites = (userId: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['user-favorites', userId, page, limit],
    queryFn: async (): Promise<FavoriteData> => {
      const response = await fetch(`${API_BASE_URL}/user-stats/favorites/${userId}?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar favoritos do usuário');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para invalidar cache e recarregar dados
export const useRefreshUserData = () => {
  const queryClient = useQueryClient();
  
  const refreshStats = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-stats', userId] });
  };
  
  const refreshOrders = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-orders', userId] });
  };
  
  const refreshCart = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-cart', userId] });
  };
  
  const refreshFavorites = (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['user-favorites', userId] });
  };
  
  const refreshAll = (userId: string) => {
    refreshStats(userId);
    refreshOrders(userId);
    refreshCart(userId);
    refreshFavorites(userId);
  };
  
  return {
    refreshStats,
    refreshOrders,
    refreshCart,
    refreshFavorites,
    refreshAll,
  };
};

// Função auxiliar para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função auxiliar para formatar datas
export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

// Função auxiliar para obter cor do nível de fidelidade
export const getFidelityColor = (nivel: string): string => {
  switch (nivel) {
    case 'Bronze':
      return 'from-amber-500 to-orange-600';
    case 'Prata':
      return 'from-gray-400 to-gray-600';
    case 'Ouro':
      return 'from-yellow-400 to-yellow-600';
    case 'Diamante':
      return 'from-cyan-400 to-blue-600';
    default:
      return 'from-amber-500 to-orange-600';
  }
};

// Função auxiliar para obter ícone do nível de fidelidade
export const getFidelityIcon = (nivel: string): string => {
  switch (nivel) {
    case 'Bronze':
      return '🥉';
    case 'Prata':
      return '🥈';
    case 'Ouro':
      return '🥇';
    case 'Diamante':
      return '💎';
    default:
      return '🥉';
  }
};
