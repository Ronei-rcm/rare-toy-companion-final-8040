import { request } from './api-config';
import { useState, useCallback } from 'react';

/**
 * Sistema de Programa de Fidelidade e Pontos
 * Gamificação, recompensas e engajamento de clientes
 */

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  joinDate: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: {
    current: number;
    totalEarned: number;
    totalRedeemed: number;
    pending: number;
  };
  badges: string[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earnedAt: string;
    points: number;
  }>;
  statistics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: string;
    streakDays: number;
    longestStreak: number;
    referrals: number;
    reviews: number;
    shares: number;
  };
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
    pushNotifications: boolean;
  };
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_shipping' | 'free_product' | 'points_multiplier' | 'exclusive_access' | 'cashback';
  value: number;
  pointsCost: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'all';
  category: string;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  image?: string;
  terms: string;
}

interface PointsTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'adjustment';
  amount: number;
  reason: string;
  description: string;
  orderId?: string;
  rewardId?: string;
  multiplier?: number;
  expiresAt?: string;
  createdAt: string;
}

interface Tier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  multipliers: {
    purchase: number;
    review: number;
    referral: number;
    social: number;
  };
  perks: string[];
  color: string;
  icon: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'purchase' | 'review' | 'referral' | 'social' | 'streak' | 'custom';
  goal: number;
  current: number;
  pointsReward: number;
  badgeReward?: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  participants: string[];
  completions: string[];
}

interface ReferralProgram {
  referrerReward: number;
  refereeReward: number;
  minPurchaseAmount: number;
  isActive: boolean;
  terms: string;
}

class LoyaltyProgramManager {
  private customers: Map<string, Customer> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private transactions: Map<string, PointsTransaction> = new Map();
  private tiers: Map<string, Tier> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private referralProgram: ReferralProgram;

  constructor() {
    this.initializeTiers();
    this.initializeRewards();
    this.initializeReferralProgram();
    this.loadCustomers();
  }

  // Inicializar níveis de fidelidade
  private initializeTiers() {
    const tierData: Tier[] = [
      {
        id: 'bronze',
        name: 'Bronze',
        minPoints: 0,
        maxPoints: 999,
        benefits: ['Acesso básico ao programa', '1x pontos em compras'],
        multipliers: { purchase: 1, review: 1, referral: 1, social: 1 },
        perks: ['Desconto de 5% em aniversário'],
        color: '#CD7F32',
        icon: '🥉'
      },
      {
        id: 'silver',
        name: 'Prata',
        minPoints: 1000,
        maxPoints: 4999,
        benefits: ['1.2x pontos em compras', 'Frete grátis em compras acima de R$ 100'],
        multipliers: { purchase: 1.2, review: 1.5, referral: 2, social: 1.5 },
        perks: ['Acesso antecipado a promoções', 'Desconto de 10% em aniversário'],
        color: '#C0C0C0',
        icon: '🥈'
      },
      {
        id: 'gold',
        name: 'Ouro',
        minPoints: 5000,
        maxPoints: 14999,
        benefits: ['1.5x pontos em compras', 'Frete grátis em todas as compras'],
        multipliers: { purchase: 1.5, review: 2, referral: 3, social: 2 },
        perks: ['Suporte prioritário', 'Produtos exclusivos', 'Desconto de 15% em aniversário'],
        color: '#FFD700',
        icon: '🥇'
      },
      {
        id: 'platinum',
        name: 'Platina',
        minPoints: 15000,
        maxPoints: 49999,
        benefits: ['2x pontos em compras', 'Frete grátis expresso'],
        multipliers: { purchase: 2, review: 3, referral: 5, social: 3 },
        perks: ['Consultor pessoal', 'Eventos exclusivos', 'Desconto de 20% em aniversário'],
        color: '#E5E4E2',
        icon: '💎'
      },
      {
        id: 'diamond',
        name: 'Diamante',
        minPoints: 50000,
        benefits: ['3x pontos em compras', 'Frete grátis expresso', 'Garantia estendida'],
        multipliers: { purchase: 3, review: 5, referral: 10, social: 5 },
        perks: ['Acesso VIP', 'Produtos únicos', 'Desconto de 25% em aniversário', 'Presentes exclusivos'],
        color: '#B9F2FF',
        icon: '💠'
      }
    ];

    tierData.forEach(tier => {
      this.tiers.set(tier.id, tier);
    });
  }

  // Inicializar recompensas
  private initializeRewards() {
    const rewardData: Reward[] = [
      {
        id: 'discount_5',
        name: 'Desconto de 5%',
        description: 'Desconto de 5% na próxima compra',
        type: 'discount',
        value: 5,
        pointsCost: 100,
        tier: 'all',
        category: 'discount',
        isActive: true,
        validFrom: new Date().toISOString(),
        usageLimit: 1,
        usageCount: 0,
        terms: 'Válido por 30 dias'
      },
      {
        id: 'free_shipping',
        name: 'Frete Grátis',
        description: 'Frete grátis na próxima compra',
        type: 'free_shipping',
        value: 0,
        pointsCost: 200,
        tier: 'all',
        category: 'shipping',
        isActive: true,
        validFrom: new Date().toISOString(),
        usageLimit: 1,
        usageCount: 0,
        terms: 'Válido por 7 dias'
      },
      {
        id: 'points_2x',
        name: 'Multiplicador 2x',
        description: 'Ganhe 2x pontos na próxima compra',
        type: 'points_multiplier',
        value: 2,
        pointsCost: 300,
        tier: 'silver',
        category: 'multiplier',
        isActive: true,
        validFrom: new Date().toISOString(),
        usageLimit: 1,
        usageCount: 0,
        terms: 'Válido por 24 horas'
      },
      {
        id: 'exclusive_access',
        name: 'Acesso Exclusivo',
        description: 'Acesso antecipado a novos produtos',
        type: 'exclusive_access',
        value: 0,
        pointsCost: 500,
        tier: 'gold',
        category: 'exclusive',
        isActive: true,
        validFrom: new Date().toISOString(),
        usageLimit: 1,
        usageCount: 0,
        terms: 'Válido por 7 dias'
      }
    ];

    rewardData.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  // Inicializar programa de indicação
  private initializeReferralProgram() {
    this.referralProgram = {
      referrerReward: 100,
      refereeReward: 50,
      minPurchaseAmount: 50,
      isActive: true,
      terms: 'Programa válido para novos clientes'
    };
  }

  // Carregar clientes
  private async loadCustomers() {
    try {
      const data = await request<any>('/customers');
      const customers = this.normalizeArray<Customer>(data, 'customers');

      customers.forEach((customer: Customer) => {
        this.customers.set(customer.id, customer);
      });
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  }

  // Utilitário para normalizar respostas de array da API
  private normalizeArray<T>(data: any, context: string): T[] {
    if (Array.isArray(data)) return data;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    if (data && data.items && Array.isArray(data.items)) return data.items;
    if (data && data[context] && Array.isArray(data[context])) return data[context];

    console.warn(`⚠️ [LoyaltyProgram] Resposta de ${context} não é um array:`, data);
    return [];
  }

  // Adicionar pontos
  async addPoints(
    customerId: string,
    amount: number,
    reason: string,
    description: string,
    orderId?: string,
    multiplier: number = 1
  ): Promise<boolean> {
    const customer = this.customers.get(customerId);
    if (!customer) return false;

    const finalAmount = Math.floor(amount * multiplier);
    const tier = this.getCustomerTier(customer);
    const tierMultiplier = tier.multipliers.purchase;

    const totalPoints = Math.floor(finalAmount * tierMultiplier);

    // Criar transação
    const transaction: PointsTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      type: 'earned',
      amount: totalPoints,
      reason,
      description,
      orderId,
      multiplier: tierMultiplier,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      createdAt: new Date().toISOString()
    };

    // Atualizar pontos do cliente
    customer.points.current += totalPoints;
    customer.points.totalEarned += totalPoints;
    customer.points.pending += totalPoints;

    // Verificar se subiu de nível
    const newTier = this.calculateTier(customer.points.current);
    if (newTier !== customer.tier) {
      customer.tier = newTier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
      await this.notifyTierUpgrade(customer, newTier);
    }

    // Salvar transação
    this.transactions.set(transaction.id, transaction);

    // Verificar conquistas
    await this.checkAchievements(customer);

    return true;
  }

  // Resgatar pontos
  async redeemPoints(customerId: string, rewardId: string): Promise<boolean> {
    const customer = this.customers.get(customerId);
    const reward = this.rewards.get(rewardId);

    if (!customer || !reward) return false;

    // Verificar se tem pontos suficientes
    if (customer.points.current < reward.pointsCost) {
      return false;
    }

    // Verificar se a recompensa está ativa
    if (!reward.isActive) {
      return false;
    }

    // Verificar se não excedeu o limite de uso
    if (reward.usageLimit && reward.usageCount >= reward.usageLimit) {
      return false;
    }

    // Verificar se o cliente tem o nível necessário
    if (reward.tier !== 'all' && !this.hasRequiredTier(customer.tier, reward.tier)) {
      return false;
    }

    // Criar transação de resgate
    const transaction: PointsTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      type: 'redeemed',
      amount: -reward.pointsCost,
      reason: 'reward_redemption',
      description: `Resgatado: ${reward.name}`,
      rewardId,
      createdAt: new Date().toISOString()
    };

    // Atualizar pontos do cliente
    customer.points.current -= reward.pointsCost;
    customer.points.totalRedeemed += reward.pointsCost;

    // Atualizar contador de uso da recompensa
    reward.usageCount++;

    // Salvar transação
    this.transactions.set(transaction.id, transaction);

    // Aplicar recompensa
    await this.applyReward(customer, reward);

    return true;
  }

  // Aplicar recompensa
  private async applyReward(customer: Customer, reward: Reward): Promise<void> {
    switch (reward.type) {
      case 'discount':
        // Criar cupom de desconto
        await this.createDiscountCoupon(customer.id, reward.value);
        break;
      case 'free_shipping':
        // Aplicar frete grátis
        await this.applyFreeShipping(customer.id);
        break;
      case 'points_multiplier':
        // Aplicar multiplicador de pontos
        await this.applyPointsMultiplier(customer.id, reward.value);
        break;
      case 'exclusive_access':
        // Dar acesso exclusivo
        await this.grantExclusiveAccess(customer.id);
        break;
    }
  }

  // Obter nível do cliente
  private getCustomerTier(customer: Customer): Tier {
    return this.tiers.get(customer.tier) || this.tiers.get('bronze')!;
  }

  // Calcular nível baseado nos pontos
  private calculateTier(points: number): string {
    const tiers = Array.from(this.tiers.values()).sort((a, b) => b.minPoints - a.minPoints);

    for (const tier of tiers) {
      if (points >= tier.minPoints) {
        return tier.id;
      }
    }

    return 'bronze';
  }

  // Verificar se tem nível necessário
  private hasRequiredTier(customerTier: string, requiredTier: string): boolean {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const customerIndex = tierOrder.indexOf(customerTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    return customerIndex >= requiredIndex;
  }

  // Verificar conquistas
  private async checkAchievements(customer: Customer): Promise<void> {
    const achievements = [
      {
        id: 'first_purchase',
        name: 'Primeira Compra',
        description: 'Realizou sua primeira compra',
        condition: () => customer.statistics.totalOrders >= 1,
        points: 50
      },
      {
        id: 'loyal_customer',
        name: 'Cliente Fiel',
        description: 'Realizou 10 compras',
        condition: () => customer.statistics.totalOrders >= 10,
        points: 200
      },
      {
        id: 'big_spender',
        name: 'Grande Comprador',
        description: 'Gastou mais de R$ 1000',
        condition: () => customer.statistics.totalSpent >= 1000,
        points: 300
      },
      {
        id: 'reviewer',
        name: 'Crítico',
        description: 'Escreveu 5 avaliações',
        condition: () => customer.statistics.reviews >= 5,
        points: 100
      },
      {
        id: 'influencer',
        name: 'Influenciador',
        description: 'Compartilhou 10 vezes',
        condition: () => customer.statistics.shares >= 10,
        points: 150
      }
    ];

    for (const achievement of achievements) {
      if (achievement.condition() && !customer.achievements.find(a => a.id === achievement.id)) {
        customer.achievements.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          earnedAt: new Date().toISOString(),
          points: achievement.points
        });

        // Adicionar pontos da conquista
        await this.addPoints(customer.id, achievement.points, 'achievement', achievement.name);
      }
    }
  }

  // Notificar upgrade de nível
  private async notifyTierUpgrade(customer: Customer, newTier: string): Promise<void> {
    const tier = this.tiers.get(newTier);
    if (!tier) return;

    // Enviar notificação
    await this.sendNotification(customer.id, {
      title: `🎉 Parabéns! Você é ${tier.name}!`,
      message: `Você subiu para o nível ${tier.name} e desbloqueou novos benefícios!`,
      type: 'tier_upgrade'
    });
  }

  // Enviar notificação
  private async sendNotification(customerId: string, notification: any): Promise<void> {
    // Implementar envio de notificação
    console.log(`Notificação para ${customerId}:`, notification);
  }

  // Criar cupom de desconto
  private async createDiscountCoupon(customerId: string, discount: number): Promise<void> {
    // Implementar criação de cupom
    console.log(`Cupom de ${discount}% criado para ${customerId}`);
  }

  // Aplicar frete grátis
  private async applyFreeShipping(customerId: string): Promise<void> {
    // Implementar frete grátis
    console.log(`Frete grátis aplicado para ${customerId}`);
  }

  // Aplicar multiplicador de pontos
  private async applyPointsMultiplier(customerId: string, multiplier: number): Promise<void> {
    // Implementar multiplicador
    console.log(`Multiplicador ${multiplier}x aplicado para ${customerId}`);
  }

  // Dar acesso exclusivo
  private async grantExclusiveAccess(customerId: string): Promise<void> {
    // Implementar acesso exclusivo
    console.log(`Acesso exclusivo concedido para ${customerId}`);
  }

  // Obter histórico de pontos
  getPointsHistory(customerId: string, limit: number = 20): PointsTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Obter recompensas disponíveis
  getAvailableRewards(customerId: string): Reward[] {
    const customer = this.customers.get(customerId);
    if (!customer) return [];

    return Array.from(this.rewards.values())
      .filter(reward =>
        reward.isActive &&
        customer.points.current >= reward.pointsCost &&
        (reward.tier === 'all' || this.hasRequiredTier(customer.tier, reward.tier))
      );
  }

  // Obter estatísticas do programa
  getProgramStats(): {
    totalCustomers: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    activeRewards: number;
    tierDistribution: Record<string, number>;
    topRewards: Array<{ reward: string; redemptions: number }>;
  } {
    const customers = Array.from(this.customers.values());
    const transactions = Array.from(this.transactions.values());

    const tierDistribution: Record<string, number> = {};
    customers.forEach(customer => {
      tierDistribution[customer.tier] = (tierDistribution[customer.tier] || 0) + 1;
    });

    const rewardRedemptions: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'redeemed' && t.rewardId)
      .forEach(t => {
        const rewardId = t.rewardId!;
        rewardRedemptions[rewardId] = (rewardRedemptions[rewardId] || 0) + 1;
      });

    const topRewards = Object.entries(rewardRedemptions)
      .map(([rewardId, redemptions]) => ({
        reward: this.rewards.get(rewardId)?.name || rewardId,
        redemptions
      }))
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5);

    return {
      totalCustomers: customers.length,
      totalPointsEarned: transactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.amount, 0),
      totalPointsRedeemed: Math.abs(transactions
        .filter(t => t.type === 'redeemed')
        .reduce((sum, t) => sum + t.amount, 0)),
      activeRewards: Array.from(this.rewards.values()).filter(r => r.isActive).length,
      tierDistribution,
      topRewards
    };
  }
}

// Instância global do programa de fidelidade
export const loyaltyProgram = new LoyaltyProgramManager();

// Hook para usar programa de fidelidade em componentes React
export const useLoyaltyProgram = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPoints = useCallback(async (
    customerId: string,
    amount: number,
    reason: string,
    description: string,
    orderId?: string,
    multiplier: number = 1
  ) => {
    setLoading(true);
    setError(null);

    try {
      const success = await loyaltyProgram.addPoints(customerId, amount, reason, description, orderId, multiplier);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar pontos');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const redeemPoints = useCallback(async (customerId: string, rewardId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await loyaltyProgram.redeemPoints(customerId, rewardId);
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resgatar pontos');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPointsHistory = useCallback((customerId: string, limit: number = 20) => {
    return loyaltyProgram.getPointsHistory(customerId, limit);
  }, []);

  const getAvailableRewards = useCallback((customerId: string) => {
    return loyaltyProgram.getAvailableRewards(customerId);
  }, []);

  const getProgramStats = useCallback(() => {
    return loyaltyProgram.getProgramStats();
  }, []);

  return {
    addPoints,
    redeemPoints,
    getPointsHistory,
    getAvailableRewards,
    getProgramStats,
    loading,
    error
  };
};

export default LoyaltyProgramManager;
