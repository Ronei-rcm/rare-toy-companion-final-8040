import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export interface Customer {
  id: string | number;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  total_pedidos?: number;
  total_gasto?: number;
  ultimo_pedido?: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  tags?: string[];
  notas?: string;
  customer_type?: 'new' | 'regular' | 'vip' | 'premium';
  average_ticket?: number;
  last_login?: string;
}

export interface CustomerStats {
  total: number;
  ativos: number;
  inativos: number;
  bloqueados: number;
  novos: number;
  vip: number;
  receita_total: number;
  ticket_medio: number;
  crescimento_mensal: number;
  clientes_hoje: number;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customer_type?: string;
  cidade?: string;
  estado?: string;
  sort?: string;
  order?: string;
  date_from?: string;
  date_to?: string;
  min_orders?: number;
  min_spent?: number;
}

export const useAdminCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    ativos: 0,
    inativos: 0,
    bloqueados: 0,
    novos: 0,
    vip: 0,
    receita_total: 0,
    ticket_medio: 0,
    crescimento_mensal: 0,
    clientes_hoje: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  // Carregar clientes
  const loadCustomers = useCallback(async (filters: CustomerFilters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers?${queryParams}`, {
        credentials: 'include',
        headers: {
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        const customersData = data.customers || data || [];
        // Garantir que total_gasto e total_pedidos sejam números
        const normalizedCustomers = Array.isArray(customersData) ? customersData.map((c: any) => ({
          ...c,
          total_gasto: c.total_gasto !== null && c.total_gasto !== undefined ? Number(c.total_gasto) : 0,
          total_pedidos: c.total_pedidos !== null && c.total_pedidos !== undefined ? Number(c.total_pedidos) : 0,
          average_ticket: c.average_ticket !== null && c.average_ticket !== undefined ? Number(c.average_ticket) : 0,
        })) : [];
        setCustomers(normalizedCustomers);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else if (response.status === 401) {
        // Se não autenticado, tentar usar endpoint público
        const publicResponse = await fetch(`${API_BASE_URL}/users?${queryParams}`, {
          credentials: 'include',
        });
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          const customersData = Array.isArray(publicData) ? publicData : [];
          // Garantir que total_gasto e total_pedidos sejam números
          const normalizedCustomers = customersData.map((c: any) => ({
            ...c,
            total_gasto: c.total_gasto !== null && c.total_gasto !== undefined ? Number(c.total_gasto) : 0,
            total_pedidos: c.total_pedidos !== null && c.total_pedidos !== undefined ? Number(c.total_pedidos) : 0,
            average_ticket: c.average_ticket !== null && c.average_ticket !== undefined ? Number(c.average_ticket) : 0,
          }));
          setCustomers(normalizedCustomers);
        } else {
          throw new Error('Erro ao carregar clientes');
        }
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro ao carregar clientes',
        description: 'Não foi possível carregar os clientes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/stats`, {
        credentials: 'include',
        headers: {
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          total: Number(data.total || 0),
          ativos: Number(data.ativos || 0),
          inativos: Number(data.inativos || 0),
          bloqueados: Number(data.bloqueados || 0),
          novos: Number(data.novos || 0),
          vip: Number(data.vip || 0),
          receita_total: Number(data.receita_total || 0),
          ticket_medio: Number(data.ticket_medio || 0),
          crescimento_mensal: Number(data.crescimento_mensal || 0),
          clientes_hoje: Number(data.clientes_hoje || 0),
        });
      } else {
        // Calcular stats localmente se endpoint não existir
        const localStats = calculateLocalStats(customers);
        setStats(localStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      const localStats = calculateLocalStats(customers);
      setStats(localStats);
    }
  }, [customers]);

  // Calcular estatísticas localmente
  const calculateLocalStats = (customersList: Customer[]): CustomerStats => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const novos = customersList.filter(c => {
      const created = new Date(c.created_at);
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }).length;

    const clientesHoje = customersList.filter(c => {
      const created = new Date(c.created_at);
      return created >= today;
    }).length;

    const clientesMesPassado = customersList.filter(c => {
      const created = new Date(c.created_at);
      return created >= lastMonth && created < new Date(now.getFullYear(), now.getMonth(), 1);
    }).length;

    const crescimentoMensal = clientesMesPassado > 0
      ? ((novos - clientesMesPassado) / clientesMesPassado) * 100
      : 0;

    const receitaTotal = customersList.reduce((sum, c) => {
      const gasto = c.total_gasto !== null && c.total_gasto !== undefined ? Number(c.total_gasto) : 0;
      return sum + gasto;
    }, 0);
    const ticketMedio = customersList.length > 0 ? receitaTotal / customersList.length : 0;

    return {
      total: customersList.length,
      ativos: customersList.filter(c => c.status === 'ativo').length,
      inativos: customersList.filter(c => c.status === 'inativo').length,
      bloqueados: customersList.filter(c => c.status === 'bloqueado').length,
      novos,
      vip: customersList.filter(c => c.customer_type === 'vip' || c.customer_type === 'premium').length,
      receita_total: receitaTotal,
      ticket_medio: ticketMedio,
      crescimento_mensal: crescimentoMensal,
      clientes_hoje: clientesHoje,
    };
  };

  // Atualizar cliente
  const updateCustomer = useCallback(async (customerId: string | number, data: Partial<Customer>) => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Cliente atualizado',
          description: 'Cliente atualizado com sucesso',
        });
        await loadCustomers();
        await loadStats();
        return true;
      } else {
        throw new Error('Falha ao atualizar cliente');
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Não foi possível atualizar o cliente',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadCustomers, loadStats]);

  // Deletar cliente
  const deleteCustomer = useCallback(async (customerId: string | number) => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Cliente excluído',
          description: 'Cliente excluído com sucesso',
        });
        await loadCustomers();
        await loadStats();
        return true;
      } else {
        throw new Error('Falha ao excluir cliente');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: 'Erro ao excluir cliente',
        description: 'Não foi possível excluir o cliente',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadCustomers, loadStats]);

  // Sincronizar users -> customers (admin)
  const syncUsersToCustomers = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/sync-users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      toast({
        title: data.success ? 'Sincronização concluída' : 'Sincronização',
        description: data.message || 'Sincronização executada com sucesso',
      });

      // Recarregar lista e estatísticas após sincronizar
      await loadCustomers();
      await loadStats();

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar clientes:', error);
      toast({
        title: 'Erro ao sincronizar clientes',
        description: 'Não foi possível sincronizar users com customers',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadCustomers, loadStats]);

  // Ações em lote
  const bulkAction = useCallback(async (customerIds: (string | number)[], action: string, value?: string) => {
    try {
      if (!Array.isArray(customerIds) || customerIds.length === 0) {
        throw new Error('IDs dos clientes são obrigatórios');
      }

      const validCustomerIds = customerIds.filter(id => id !== null && id !== undefined && id !== '');

      if (validCustomerIds.length === 0) {
        throw new Error('Nenhum ID de cliente válido encontrado');
      }

      console.log('[BulkAction Customers] Enviando requisição:', {
        customerIds: validCustomerIds,
        action,
        value,
      });

      const adminToken = localStorage.getItem('admin_token');
      const requestBody = {
        customerIds: validCustomerIds,
        action,
        ...(value && { value }),
      };

      const response = await fetch(`${API_BASE_URL}/admin/customers/bulk-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Ação em lote executada',
          description: data.message,
        });
        await loadCustomers();
        await loadStats();
        return true;
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erro ${response.status}: ${response.statusText}` };
        }
        console.error('[BulkAction Customers] Erro na resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('[BulkAction Customers] Erro completo:', error);
      const errorMessage = error?.message || 'Não foi possível executar a ação em lote';
      toast({
        title: 'Erro na ação em lote',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, loadCustomers, loadStats]);

  // Buscar pedidos do cliente
  const getCustomerOrders = useCallback(async (customerId: string | number) => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}/orders`, {
        credentials: 'include',
        headers: {
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar pedidos do cliente:', error);
      return [];
    }
  }, []);

  // Exportar clientes
  const exportCustomers = useCallback(async (format: 'csv' | 'json' = 'csv', filters?: CustomerFilters) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      queryParams.append('format', format);

      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/customers/export?${queryParams}`, {
        credentials: 'include',
        headers: {
          ...(adminToken && { 'X-Admin-Token': adminToken }),
        },
      });

      if (response.ok) {
        if (format === 'csv') {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `clientes_export_${new Date().toISOString().slice(0, 10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `clientes_export_${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        toast({
          title: 'Exportação concluída',
          description: `Clientes exportados em formato ${format.toUpperCase()}`,
        });
        return true;
      } else {
        throw new Error('Falha na exportação');
      }
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os clientes',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Carregar dados iniciais
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (customers.length > 0) {
      loadStats();
    }
  }, [customers, loadStats]);

  return {
    customers,
    stats,
    loading,
    pagination,
    loadCustomers,
    loadStats,
    updateCustomer,
    deleteCustomer,
    bulkAction,
    getCustomerOrders,
    exportCustomers,
    syncUsersToCustomers,
  };
};

