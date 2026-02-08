import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { toast } from 'sonner';
import { userStatsApi } from '@/services/user-stats-api';
import { financialApi } from '@/services/financial-api';

interface CustomerStats {
  totalPedidos: number;
  pedidosPendentes: number;
  totalGasto: number;
  favoritos: number;
  enderecos: number;
  cupons: number;
  nivelUsuario: string;
  pontosFidelidade: number;
  ticketMedio: number;
  ultimoPedido: string | null;
  pedidosMesAtual: number;
  economiaTotal: number;
  lastUpdated?: Date;
}

interface StatsValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useCustomerStats() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<CustomerStats>({
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalGasto: 0,
    favoritos: 0,
    enderecos: 0,
    cupons: 0,
    nivelUsuario: 'Bronze',
    pontosFidelidade: 0,
    ticketMedio: 0,
    ultimoPedido: null,
    pedidosMesAtual: 0,
    economiaTotal: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [validation, setValidation] = useState<StatsValidation>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const validateStats = useCallback((data: Partial<CustomerStats>): StatsValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.totalPedidos !== undefined && data.totalPedidos < 0) errors.push('Total de pedidos não pode ser negativo');
    if (data.pedidosPendentes !== undefined && data.pedidosPendentes < 0) errors.push('Pedidos pendentes não pode ser negativo');
    if (data.totalPedidos !== undefined && data.pedidosPendentes !== undefined && data.pedidosPendentes > data.totalPedidos) {
      errors.push('Pedidos pendentes não pode ser maior que total de pedidos');
    }
    if (data.totalGasto !== undefined && data.totalGasto < 0) errors.push('Total gasto não pode ser negativo');

    if (data.totalPedidos === 0 && data.totalGasto === 0) warnings.push('Nenhum pedido encontrado.');
    if (data.favoritos === 0) warnings.push('Nenhum produto favorito.');

    return { isValid: errors.length === 0, errors, warnings };
  }, []);

  const calculateUserLevel = useCallback((totalGasto: number): string => {
    if (totalGasto >= 5000) return 'Diamante';
    if (totalGasto >= 2000) return 'Ouro';
    if (totalGasto >= 500) return 'Prata';
    return 'Bronze';
  }, []);

  const calculateLoyaltyPoints = useCallback((totalGasto: number): number => {
    return Math.floor(totalGasto / 10);
  }, []);

  const fetchStats = useCallback(async (forceRefresh = false): Promise<CustomerStats | null> => {
    if (!user?.id && !user?.email) {
      setError('Usuário não autenticado');
      setLoading(false);
      return null;
    }

    const now = Date.now();
    const lastFetchTime = lastFetch ? lastFetch.getTime() : 0;
    if (!forceRefresh && (now - lastFetchTime < 5000)) return null;

    try {
      setLoading(true);
      setError(null);

      let statsData: any = null;

      try {
        const data = await userStatsApi.getStats(user.id || user.email || '');
        if (data && (data as any) !== undefined) {
          statsData = data;
        }
      } catch (e) {
        console.log(`Erro ao buscar estatísticas do usuário:`, e);
      }

      if (!statsData && user.id) {
        try {
          const orders = await financialApi.getOrders();
          const userOrders = Array.isArray(orders) ? orders.filter((o: any) => o.customer_id === user.id) : [];
          statsData = {
            totalPedidos: userOrders.length,
            pedidosPendentes: userOrders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length,
            totalGasto: userOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0)
          };
        } catch (e) {
          console.error('Erro ao buscar pedidos para estatísticas:', e);
        }
      }

      const processedStats: CustomerStats = {
        totalPedidos: statsData?.total_orders || statsData?.totalPedidos || 0,
        pedidosPendentes: statsData?.pending_orders || statsData?.pedidosPendentes || 0,
        totalGasto: statsData?.total_spent || statsData?.totalGasto || 0,
        favoritos: statsData?.favorites || statsData?.favoritos || 0,
        enderecos: statsData?.addresses || statsData?.enderecos || 0,
        cupons: statsData?.coupons || statsData?.cupons || 0,
        nivelUsuario: statsData?.customer_level || statsData?.nivelUsuario || calculateUserLevel(statsData?.total_spent || statsData?.totalGasto || 0),
        pontosFidelidade: statsData?.loyalty_points || statsData?.pontosFidelidade || calculateLoyaltyPoints(statsData?.total_spent || statsData?.totalGasto || 0),
        ticketMedio: statsData?.average_ticket || (statsData?.totalPedidos > 0 ? statsData?.totalGasto / statsData?.totalPedidos : 0),
        ultimoPedido: statsData?.last_order || statsData?.ultimoPedido || null,
        pedidosMesAtual: statsData?.orders_this_month || statsData?.pedidosMesAtual || 0,
        economiaTotal: statsData?.total_savings || statsData?.economiaTotal || 0,
        lastUpdated: new Date()
      };

      const validationResult = validateStats(processedStats);
      setValidation(validationResult);

      if (validationResult.warnings.length > 0 && (forceRefresh || !lastFetch)) {
        validationResult.warnings.forEach(w => toast.info(w));
      }

      setStats(processedStats);
      setLastFetch(new Date());
      return processedStats;
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      setError(error.message || 'Erro ao carregar estatísticas');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, lastFetch, calculateUserLevel, calculateLoyaltyPoints, validateStats]);

  useEffect(() => {
    if (user?.id || user?.email) {
      fetchStats();
    }
  }, [user?.id, user?.email, fetchStats]);

  return {
    stats,
    loading,
    error,
    lastFetch,
    validation,
    refetch: () => fetchStats(true),
    isValid: validation.isValid,
    hasWarnings: validation.warnings.length > 0
  };
}
