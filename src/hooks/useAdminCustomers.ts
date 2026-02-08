import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { adminCustomersApi } from '@/services/admin-customers-api';

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

  const calculateLocalStats = useCallback((customersList: Customer[]): CustomerStats => {
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

    const receitaTotal = customersList.reduce((sum, c) => sum + (Number(c.total_gasto) || 0), 0);
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
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminCustomersApi.getStats();
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
    } catch (error) {
      console.warn('Falha ao carregar estatísticas reais, calculando locais:', error);
      setStats(calculateLocalStats(customers));
    }
  }, [customers, calculateLocalStats]);

  const loadCustomers = useCallback(async (filters: CustomerFilters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      let data;
      try {
        data = await adminCustomersApi.getCustomers(queryParams.toString());
      } catch (e) {
        // Fallback para endpoint público
        data = await adminCustomersApi.getPublicUsers(queryParams.toString());
      }

      const customersData = data.customers || data || [];
      const normalizedCustomers = Array.isArray(customersData) ? customersData.map((c: any) => ({
        ...c,
        total_gasto: Number(c.total_gasto || 0),
        total_pedidos: Number(c.total_pedidos || 0),
        average_ticket: Number(c.average_ticket || 0),
      })) : [];

      setCustomers(normalizedCustomers);
      if (data.pagination) setPagination(data.pagination);
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

  const updateCustomer = useCallback(async (customerId: string | number, data: Partial<Customer>) => {
    try {
      await adminCustomersApi.updateCustomer(customerId, data);
      toast({ title: 'Cliente atualizado', description: 'Cliente atualizado com sucesso' });
      await loadCustomers();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' });
      return false;
    }
  }, [toast, loadCustomers]);

  const deleteCustomer = useCallback(async (customerId: string | number) => {
    try {
      await adminCustomersApi.deleteCustomer(customerId);
      toast({ title: 'Cliente excluído', description: 'Cliente excluído com sucesso' });
      await loadCustomers();
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' });
      return false;
    }
  }, [toast, loadCustomers]);

  const syncUsersToCustomers = useCallback(async () => {
    try {
      const data = await adminCustomersApi.syncUsers();
      toast({ title: 'Sincronização concluída', description: data.message || 'Sucesso' });
      await loadCustomers();
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({ title: 'Erro ao sincronizar', variant: 'destructive' });
      return false;
    }
  }, [toast, loadCustomers]);

  const bulkAction = useCallback(async (customerIds: (string | number)[], action: string, value?: string) => {
    try {
      const data = await adminCustomersApi.bulkAction({ customerIds, action, value });
      toast({ title: 'Ação executada', description: data.message });
      await loadCustomers();
      return true;
    } catch (error: any) {
      toast({ title: 'Erro na ação em lote', description: error.message, variant: 'destructive' });
      return false;
    }
  }, [toast, loadCustomers]);

  const getCustomerOrders = useCallback(async (customerId: string | number) => {
    try {
      return await adminCustomersApi.getCustomerOrders(customerId);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return [];
    }
  }, []);

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

      const response = await adminCustomersApi.exportCustomers(queryParams.toString());
      // Lógica de download simplificada (supondo que a API retorne o Blob ou JSON)
      if (format === 'csv') {
        const blob = response instanceof Blob ? response : new Blob([response], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes.${format}`;
        a.click();
      }
      toast({ title: 'Exportação concluída' });
      return true;
    } catch (error) {
      toast({ title: 'Erro na exportação', variant: 'destructive' });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (customers.length > 0) loadStats();
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
