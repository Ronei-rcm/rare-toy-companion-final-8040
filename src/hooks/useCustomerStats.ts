import { useState, useEffect, useCallback } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { toast } from 'sonner';

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

/**
 * Hook centralizado para buscar e gerenciar estatísticas do cliente
 * Garante dados sincronizados e validados em todos os componentes
 */
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

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Validar estatísticas
  const validateStats = useCallback((data: Partial<CustomerStats>): StatsValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações de consistência
    if (data.totalPedidos !== undefined && data.totalPedidos < 0) {
      errors.push('Total de pedidos não pode ser negativo');
    }

    if (data.pedidosPendentes !== undefined && data.pedidosPendentes < 0) {
      errors.push('Pedidos pendentes não pode ser negativo');
    }

    if (data.totalPedidos !== undefined && data.pedidosPendentes !== undefined) {
      if (data.pedidosPendentes > data.totalPedidos) {
        errors.push('Pedidos pendentes não pode ser maior que total de pedidos');
      }
    }

    if (data.totalGasto !== undefined && data.totalGasto < 0) {
      errors.push('Total gasto não pode ser negativo');
    }

    if (data.totalPedidos !== undefined && data.totalGasto !== undefined && data.totalPedidos > 0) {
      const calculatedTicketMedio = data.totalGasto / data.totalPedidos;
      if (data.ticketMedio !== undefined && Math.abs(data.ticketMedio - calculatedTicketMedio) > 0.01) {
        warnings.push('Ticket médio calculado não corresponde ao valor informado');
      }
    }

    // Avisos (não bloqueiam)
    if (data.totalPedidos === 0 && data.totalGasto === 0) {
      warnings.push('Nenhum pedido encontrado. Comece a comprar para ver suas estatísticas!');
    }

    if (data.favoritos === 0) {
      warnings.push('Você ainda não adicionou produtos aos favoritos');
    }

    if (data.enderecos === 0) {
      warnings.push('Adicione um endereço para facilitar suas compras');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);

  // Calcular nível do usuário baseado no total gasto
  const calculateUserLevel = useCallback((totalGasto: number): string => {
    if (totalGasto >= 5000) return 'Diamante';
    if (totalGasto >= 2000) return 'Ouro';
    if (totalGasto >= 500) return 'Prata';
    return 'Bronze';
  }, []);

  // Calcular pontos de fidelidade
  const calculateLoyaltyPoints = useCallback((totalGasto: number): number => {
    return Math.floor(totalGasto / 10); // 1 ponto a cada R$ 10
  }, []);

  // Buscar estatísticas do servidor
  const fetchStats = useCallback(async (forceRefresh = false): Promise<CustomerStats | null> => {
    if (!user?.id && !user?.email) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Tentar múltiplos endpoints
      const endpoints = [
        `${API_BASE_URL}/customers/current/stats`,
        `${API_BASE_URL}/customers/${user.id}/stats`,
        user.email ? `${API_BASE_URL}/customers/by-email/${encodeURIComponent(user.email)}/stats` : null
      ].filter(Boolean) as string[];

      let statsData: any = null;
      let lastSuccessfulResponse = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            credentials: 'include',
            headers: {
              'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=60'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data && (data.totalPedidos !== undefined || data.totalGasto !== undefined)) {
              statsData = data;
              lastSuccessfulResponse = response;
              break;
            }
          }
        } catch (e) {
          console.log(`Erro ao buscar em ${endpoint}:`, e);
          continue;
        }
      }

      // Se não encontrou dados, buscar dados básicos e calcular
      if (!statsData) {
        // Buscar pedidos diretamente
        try {
          const ordersResponse = await fetch(`${API_BASE_URL}/orders?customer_id=${user.id}`, {
            credentials: 'include'
          });
          
          if (ordersResponse.ok) {
            const orders = await ordersResponse.json();
            const totalPedidos = Array.isArray(orders) ? orders.length : 0;
            const pedidosPendentes = Array.isArray(orders) 
              ? orders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length 
              : 0;
            const totalGasto = Array.isArray(orders)
              ? orders.reduce((sum: number, o: any) => sum + (parseFloat(o.total) || 0), 0)
              : 0;

            statsData = {
              totalPedidos,
              pedidosPendentes,
              totalGasto,
              favoritos: 0,
              enderecos: 0,
              cupons: 0
            };
          }
        } catch (e) {
          console.error('Erro ao buscar pedidos:', e);
        }
      }

      // Se ainda não tem dados, usar zeros (não mockar)
      if (!statsData) {
        statsData = {
          totalPedidos: 0,
          pedidosPendentes: 0,
          totalGasto: 0,
          favoritos: 0,
          enderecos: 0,
          cupons: 0
        };
      }

      // Calcular valores derivados
      const processedStats: CustomerStats = {
        totalPedidos: statsData.totalPedidos || statsData.total_orders || 0,
        pedidosPendentes: statsData.pedidosPendentes || statsData.pending_orders || 0,
        totalGasto: statsData.totalGasto || statsData.total_spent || 0,
        favoritos: statsData.favoritos || statsData.favorites || 0,
        enderecos: statsData.enderecos || statsData.addresses || 0,
        cupons: statsData.cupons || statsData.coupons || 0,
        nivelUsuario: statsData.nivelUsuario || statsData.customer_level || calculateUserLevel(statsData.totalGasto || statsData.total_spent || 0),
        pontosFidelidade: statsData.pontosFidelidade || statsData.loyalty_points || calculateLoyaltyPoints(statsData.totalGasto || statsData.total_spent || 0),
        ticketMedio: statsData.ticketMedio || statsData.average_ticket || 
          ((statsData.totalPedidos || statsData.total_orders || 0) > 0 
            ? (statsData.totalGasto || statsData.total_spent || 0) / (statsData.totalPedidos || statsData.total_orders || 0)
            : 0),
        ultimoPedido: statsData.ultimoPedido || statsData.last_order || null,
        pedidosMesAtual: statsData.pedidosMesAtual || statsData.orders_this_month || 0,
        economiaTotal: statsData.economiaTotal || statsData.total_savings || 0,
        lastUpdated: new Date()
      };

      // Validar dados
      const validationResult = validateStats(processedStats);
      setValidation(validationResult);

      if (!validationResult.isValid) {
        console.error('Dados de estatísticas inválidos:', validationResult.errors);
        setError('Dados inválidos recebidos do servidor');
        // Não bloquear, mas usar dados mesmo assim (com aviso)
      }

      // Mostrar avisos apenas na primeira carga ou se forçado
      if (validationResult.warnings.length > 0 && (forceRefresh || !lastFetch)) {
        validationResult.warnings.forEach(warning => {
          toast.info(warning, { duration: 5000 });
        });
      }

      setStats(processedStats);
      setLastFetch(new Date());
      return processedStats;

    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      setError(error.message || 'Erro ao carregar estatísticas');
      toast.error('Erro ao carregar estatísticas do dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, API_BASE_URL, validateStats, calculateUserLevel, calculateLoyaltyPoints, lastFetch]);

  // Carregar estatísticas inicialmente
  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Sincronizar periodicamente (a cada 2 minutos se página visível)
  useEffect(() => {
    if (!user) return;

    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchStats(true);
      }
    }, 2 * 60 * 1000); // 2 minutos

    // Sincronizar quando voltar online
    const handleOnline = () => {
      fetchStats(true);
    };

    window.addEventListener('online', handleOnline);

    // Sincronizar quando página voltar a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchStats(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchStats]);

  // Escutar atualizações de outros componentes
  useEffect(() => {
    const handleDataUpdate = () => {
      fetchStats(true);
    };

    window.addEventListener('user-data-updated', handleDataUpdate);
    window.addEventListener('order-updated', handleDataUpdate);
    window.addEventListener('favorites-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('user-data-updated', handleDataUpdate);
      window.removeEventListener('order-updated', handleDataUpdate);
      window.removeEventListener('favorites-updated', handleDataUpdate);
    };
  }, [fetchStats]);

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

