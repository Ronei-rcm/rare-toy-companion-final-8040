import { useState, useEffect } from 'react';
import { analyticsApi } from '@/services/analytics-api';
import { adminOrdersApi } from '@/services/admin-orders-api';
import { productsApi } from '@/services/products-api';

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
      const data = await analyticsApi.getDashboard();

      // Buscar estatísticas adicionais em paralelo
      const [statsData, produtosData] = await Promise.all([
        adminOrdersApi.getStats().catch(() => null),
        productsApi.getProducts({ limit: 1 }).catch(() => null)
      ]);

      let totalProducts = 0;
      let totalRevenue = 0;
      let totalOrders = 0;
      let totalCustomers = 0;
      let averageOrderValue = 0;
      let conversionRate = 0;

      // Processar estatísticas de pedidos
      if (statsData) {
        totalRevenue = parseFloat(statsData.total_revenue || statsData.totalRevenue || 0);
        totalOrders = parseInt(statsData.total || statsData.totalOrders || 0);
        averageOrderValue = parseFloat(statsData.average_ticket || statsData.averageTicket || 0);
        totalCustomers = parseInt(statsData.totalCustomers || statsData.uniqueCustomers || 0);
      }

      // Processar total de produtos
      if (produtosData) {
        totalProducts = Array.isArray(produtosData) ? produtosData.length :
          (produtosData.total || produtosData.count || 0);
      }

      // Combinar dados
      const combinedMetrics = {
        vendas: data.vendas || { hoje: 0, ontem: 0, variacao: 0 },
        clientes: data.clientes || { hoje: 0, ontem: 0, variacao: 0 },
        pedidos: data.pedidos || { hoje: 0, ontem: 0, variacao: 0 },
        estoque: data.estoque || { baixo: 0 },
        totalRevenue: totalRevenue || data.vendas?.hoje || 0,
        totalOrders: totalOrders || data.pedidos?.hoje || 0,
        totalCustomers: totalCustomers || data.clientes?.hoje || 0,
        totalProducts,
        averageOrderValue,
        conversionRate,
        revenueChange: data.vendas?.variacao || 0,
        ordersChange: data.pedidos?.variacao || 0,
        customersChange: data.clientes?.variacao || 0,
        productsChange: 0,
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
      const data = await analyticsApi.getSalesStats();

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
      const data = await analyticsApi.getPopularProducts();

      const normalizedData = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        sales: parseInt(item.vendas || item.sales || 0),
        revenue: parseFloat(item.receita_total || item.revenue || 0),
        growth: 0,
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
      const data = await analyticsApi.getRecentOrders();

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
        const data = await analyticsApi.getGeneralStats();
        setEstatisticas(data);
      } catch (err: any) {
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
      await Promise.all([
        analyticsApi.getDashboard('refresh=true').catch(() => null),
        analyticsApi.getSalesStats('refresh=true').catch(() => null),
        analyticsApi.getPopularProducts('refresh=true').catch(() => null),
        analyticsApi.getRecentOrders('refresh=true').catch(() => null)
      ]);

      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setRefreshing(false);
    }
  };

  return { refreshing, refreshData };
};