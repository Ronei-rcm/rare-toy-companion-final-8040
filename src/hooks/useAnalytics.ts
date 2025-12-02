import { useState, useEffect } from 'react';

// Hook para métricas do dashboard
export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados do dashboard
      const response = await fetch('/api/admin/analytics/dashboard', {
        credentials: 'include',
        headers: {
          'X-Admin-Token': localStorage.getItem('admin_token') || ''
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autenticado. Faça login novamente.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Buscar estatísticas adicionais
      const [statsResponse, produtosResponse] = await Promise.all([
        fetch('/api/admin/orders/stats', { credentials: 'include' }).catch(() => null),
        fetch('/api/produtos?limit=1', { credentials: 'include' }).catch(() => null)
      ]);
      
      let totalProducts = 0;
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalCustomers = 0;
      let averageOrderValue = 0;
      let conversionRate = 0;
      
      // Processar estatísticas de pedidos
      if (statsResponse?.ok) {
        try {
          const statsData = await statsResponse.json();
          totalRevenue = parseFloat(statsData.total_revenue || statsData.totalRevenue || 0);
          totalOrders = parseInt(statsData.total || statsData.totalOrders || 0);
          averageOrderValue = parseFloat(statsData.average_ticket || statsData.averageTicket || 0);
          totalCustomers = parseInt(statsData.totalCustomers || statsData.uniqueCustomers || 0);
        } catch (e) {
          console.warn('Erro ao processar stats:', e);
        }
      }
      
      // Processar total de produtos
      if (produtosResponse?.ok) {
        try {
          const produtosData = await produtosResponse.json();
          totalProducts = Array.isArray(produtosData) ? produtosData.length : 
                         (produtosData.total || produtosData.count || 0);
        } catch (e) {
          console.warn('Erro ao processar produtos:', e);
        }
      }
      
      // Combinar dados
      const combinedMetrics = {
        // Dados do endpoint principal
        vendas: data.vendas || { hoje: 0, ontem: 0, variacao: 0 },
        clientes: data.clientes || { hoje: 0, ontem: 0, variacao: 0 },
        pedidos: data.pedidos || { hoje: 0, ontem: 0, variacao: 0 },
        estoque: data.estoque || { baixo: 0 },
        
        // Métricas calculadas
        totalRevenue: totalRevenue || data.vendas?.hoje || 0,
        totalOrders: totalOrders || data.pedidos?.hoje || 0,
        totalCustomers: totalCustomers || data.clientes?.hoje || 0,
        totalProducts: totalProducts,
        averageOrderValue: averageOrderValue,
        conversionRate: conversionRate,
        
        // Variações
        revenueChange: data.vendas?.variacao || 0,
        ordersChange: data.pedidos?.variacao || 0,
        customersChange: data.clientes?.variacao || 0,
        productsChange: 0, // Será calculado se necessário
        aovChange: 0,
        conversionChange: 0
      };
      
      setMetrics(combinedMetrics);
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
      setError(err.message || 'Erro ao carregar métricas');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return { metrics, loading, error, refetch: fetchMetrics };
};

// Hook para dados de vendas
export const useVendasData = () => {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics/vendas', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar dados de vendas');
      
      const data = await response.json();
      
      // Normalizar dados para o formato esperado
      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        date: item.data || item.date,
        sales: parseInt(item.pedidos || item.orders || 0),
        revenue: parseFloat(item.total || item.revenue || 0),
        orders: parseInt(item.pedidos || item.orders || 0)
      })) : [];
      
      setVendas(normalizedData);
    } catch (err: any) {
      console.error('Erro ao buscar vendas:', err);
      setError(err.message);
      setVendas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
  }, []);

  return { vendas, loading, error, refetch: fetchVendas };
};

// Hook para produtos populares
export const useProdutosPopulares = () => {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics/produtos-populares', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar produtos populares');
      
      const data = await response.json();
      
      // Normalizar dados
      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        sales: parseInt(item.vendas || item.sales || 0),
        revenue: parseFloat(item.receita_total || item.revenue || 0),
        growth: 0, // Será calculado se necessário
        quantidade_vendida: parseInt(item.quantidade_vendida || 0)
      })) : [];
      
      setProdutos(normalizedData);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      setError(err.message);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return { produtos, loading, error, refetch: fetchProdutos };
};

// Hook para pedidos recentes
export const usePedidosRecentes = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/analytics/pedidos-recentes', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar pedidos recentes');
      
      const data = await response.json();
      
      // Normalizar dados
      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id || item.order_id,
        customer: item.customer_name || item.customer || item.nome || 'Cliente',
        amount: parseFloat(item.total || item.amount || 0),
        status: item.status || 'pending',
        date: item.created_at || item.date || new Date().toISOString()
      })) : [];
      
      setPedidos(normalizedData);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err.message);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return { pedidos, loading, error, refetch: fetchPedidos };
};

// Hook para estatísticas gerais
export const useEstatisticasGerais = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEstatisticas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/estatisticas-gerais');
        if (!response.ok) throw new Error('Erro ao carregar estatísticas gerais');
        const data = await response.json();
        setEstatisticas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEstatisticas();
  }, []);

  return { estatisticas, loading, error };
};

// Hook para refresh de dados
export const useRefreshData = () => {
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Invalidar cache e recarregar dados
      await Promise.all([
        fetch('/api/admin/analytics/dashboard?refresh=true', { 
          method: 'GET',
          credentials: 'include',
          headers: { 'X-Admin-Token': localStorage.getItem('admin_token') || '' }
        }).catch(() => null),
        fetch('/api/admin/analytics/vendas?refresh=true', { 
          credentials: 'include' 
        }).catch(() => null),
        fetch('/api/admin/analytics/produtos-populares?refresh=true', { 
          credentials: 'include' 
        }).catch(() => null),
        fetch('/api/admin/analytics/pedidos-recentes?refresh=true', { 
          credentials: 'include' 
        }).catch(() => null)
      ]);
      
      // Pequeno delay para mostrar feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar página para atualizar todos os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setRefreshing(false);
    }
  };

  return { refreshing, refreshData };
};