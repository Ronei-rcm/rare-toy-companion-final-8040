import { useState, useEffect } from 'react';

// Hook para métricas do dashboard
export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/dashboard');
        if (!response.ok) throw new Error('Erro ao carregar métricas');
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
};

// Hook para dados de vendas
export const useVendasData = () => {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/vendas');
        if (!response.ok) throw new Error('Erro ao carregar dados de vendas');
        const data = await response.json();
        // Garantir que sempre seja um array
        setVendas(Array.isArray(data) ? data : (Array.isArray(data.vendas) ? data.vendas : []));
      } catch (err) {
        setError(err.message);
        setVendas([]); // Garantir array vazio em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  return { vendas, loading, error };
};

// Hook para produtos populares
export const useProdutosPopulares = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/produtos-populares');
        if (!response.ok) throw new Error('Erro ao carregar produtos populares');
        const data = await response.json();
        // Garantir que sempre seja um array
        setProdutos(Array.isArray(data) ? data : (Array.isArray(data.produtos) ? data.produtos : []));
      } catch (err) {
        setError(err.message);
        setProdutos([]); // Garantir array vazio em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

  return { produtos, loading, error };
};

// Hook para pedidos recentes
export const usePedidosRecentes = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/analytics/pedidos-recentes');
        if (!response.ok) throw new Error('Erro ao carregar pedidos recentes');
        const data = await response.json();
        // Garantir que sempre seja um array
        setPedidos(Array.isArray(data) ? data : (Array.isArray(data.pedidos) ? data.pedidos : []));
      } catch (err) {
        setError(err.message);
        setPedidos([]); // Garantir array vazio em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  return { pedidos, loading, error };
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
    // Simula um pequeno delay para mostrar o loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    // Recarrega a página para buscar novos dados
    window.location.reload();
  };

  return { refreshing, refreshData };
};