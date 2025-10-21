import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export interface Order {
  id: string | number;
  user_id?: string | number;
  customer_id?: string | number;
  cart_id?: string | number;
  status: string;
  total: number;
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  metodo_pagamento?: string;
  payment_status?: string;
  created_at: string;
  updated_at: string;
  items_count: number;
  items?: any[];
  customer?: {
    id: string | number;
    nome: string;
    email: string;
    telefone: string;
    total_pedidos: number;
    total_gasto: number;
    ultimo_pedido: string;
    type: string;
  };
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageTicket: number;
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  newCustomers: number;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}

export const useAdminOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageTicket: 0,
    todayOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    newCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Carregar pedidos
  const loadOrders = async (filters: OrderFilters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/admin/orders?${queryParams}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || pagination);
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: 'Não foi possível carregar os pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/stats`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string | number, newStatus: string, notes = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (response.ok) {
        // Atualizar pedido local
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        ));
        
        toast({
          title: 'Status atualizado',
          description: `Pedido #${orderId} atualizado para ${newStatus}`,
        });
        
        // Recarregar estatísticas
        loadStats();
        return true;
      } else {
        throw new Error('Falha ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do pedido',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Associar cliente ao pedido
  const associateCustomer = async (orderId: string | number, customerId: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/associate-customer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ customer_id: customerId }),
      });

      if (response.ok) {
        toast({
          title: 'Cliente associado',
          description: 'Cliente associado ao pedido com sucesso',
        });
        
        // Recarregar pedidos
        loadOrders();
        return true;
      } else {
        throw new Error('Falha ao associar cliente');
      }
    } catch (error) {
      console.error('Erro ao associar cliente:', error);
      toast({
        title: 'Erro ao associar cliente',
        description: 'Não foi possível associar o cliente ao pedido',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Buscar clientes para associação
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  };

  // Ações em lote
  const bulkAction = async (orderIds: (string | number)[], action: string, value?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderIds, action, value }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Ação em lote executada',
          description: data.message,
        });
        
        // Recarregar pedidos
        loadOrders();
        return true;
      } else {
        throw new Error('Falha na ação em lote');
      }
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast({
        title: 'Erro na ação em lote',
        description: 'Não foi possível executar a ação em lote',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Exportar pedidos
  const exportOrders = async (format: string = 'csv', filters: OrderFilters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${API_BASE_URL}/admin/orders/export?${queryParams}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Exportação concluída',
          description: `Arquivo ${format.toUpperCase()} baixado com sucesso`,
        });
        return true;
      } else {
        throw new Error('Falha na exportação');
      }
    } catch (error) {
      console.error('Erro ao exportar pedidos:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os pedidos',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  return {
    orders,
    stats,
    loading,
    pagination,
    loadOrders,
    loadStats,
    updateOrderStatus,
    associateCustomer,
    searchCustomers,
    bulkAction,
    exportOrders,
  };
};
