import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { adminOrdersApi } from '@/services/admin-orders-api';

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

      const data = await adminOrdersApi.getOrders(queryParams.toString());
      setOrders(data.orders || []);
      setPagination(data.pagination || pagination);
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
      const data = await adminOrdersApi.getStats();
      // Garantir que todos os valores numéricos sejam números
      setStats({
        total: Number(data.total || 0),
        pending: Number(data.pending || 0),
        processing: Number(data.processing || 0),
        shipped: Number(data.shipped || 0),
        delivered: Number(data.delivered || 0),
        cancelled: Number(data.cancelled || 0),
        totalRevenue: Number(data.totalRevenue || 0),
        averageTicket: Number(data.averageTicket || 0),
        todayOrders: Number(data.todayOrders || 0),
        todayRevenue: Number(data.todayRevenue || 0),
        totalCustomers: Number(data.totalCustomers || 0),
        newCustomers: Number(data.newCustomers || 0),
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string | number, newStatus: string, notes = '') => {
    try {
      await adminOrdersApi.updateStatus(orderId, newStatus, notes);

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
      await adminOrdersApi.associateCustomer(orderId, customerId);

      toast({
        title: 'Cliente associado',
        description: 'Cliente associado ao pedido com sucesso',
      });

      // Recarregar pedidos
      loadOrders();
      return true;
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

  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) return [];
    try {
      const { adminCustomersApi } = await import('@/services/admin-customers-api');
      return await adminCustomersApi.searchCustomers(query);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  };

  // Ações em lote
  const bulkAction = async (orderIds: (string | number)[], action: string, value?: string) => {
    try {
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        throw new Error('IDs dos pedidos são obrigatórios');
      }

      const data = await adminOrdersApi.bulkAction({ orderIds, action, value });

      toast({
        title: 'Ação em lote executada',
        description: data.message || 'Ação executada com sucesso',
      });

      // Recarregar pedidos
      loadOrders();
      return true;
    } catch (error: any) {
      console.error('[BulkAction] Erro:', error);
      toast({
        title: 'Erro na ação em lote',
        description: error.message || 'Não foi possível executar a ação em lote',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Excluir pedido
  const deleteOrder = async (orderId: string | number) => {
    try {
      await adminOrdersApi.deleteOrder(orderId);

      // Remover pedido da lista local
      setOrders(prev => prev.filter(order => order.id !== orderId));

      toast({
        title: 'Pedido excluído',
        description: `Pedido #${orderId} foi excluído com sucesso`,
      });

      // Recarregar estatísticas
      loadStats();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: 'Erro ao excluir pedido',
        description: error.message || 'Não foi possível excluir o pedido',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Excluir múltiplos pedidos
  const deleteOrders = async (orderIds: (string | number)[]) => {
    try {
      const results = await Promise.all(
        orderIds.map(id => deleteOrder(id))
      );

      const successCount = results.filter(r => r).length;

      if (successCount > 0) {
        loadOrders();
        loadStats();
      }

      return successCount === orderIds.length;
    } catch (error) {
      console.error('Erro ao excluir pedidos em lote:', error);
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

      const blob = await adminOrdersApi.exportOrders(queryParams.toString());
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
    deleteOrder,
    deleteOrders,
  };
};
