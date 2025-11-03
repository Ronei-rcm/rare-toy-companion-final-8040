const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

class LoyaltyService {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rare_toy_companion',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Loyalty Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Loyalty Service: Erro na inicialização:', error.message);
    }
  }

  // Configurações do programa de fidelidade
  getLoyaltyConfig() {
    return {
      pointsPerReal: 1, // 1 ponto por R$ 1 gasto
      tierThresholds: {
        bronze: 0,
        silver: 500,
        gold: 1500,
        platinum: 3000,
        diamond: 5000
      },
      tierBenefits: {
        bronze: { discount: 0, freeShipping: false, priority: false },
        silver: { discount: 5, freeShipping: false, priority: false },
        gold: { discount: 10, freeShipping: true, priority: true },
        platinum: { discount: 15, freeShipping: true, priority: true },
        diamond: { discount: 20, freeShipping: true, priority: true }
      },
      pointValues: {
        redeem: 100, // 100 pontos = R$ 10 de desconto
        bonus: 50 // 50 pontos de bônus por compra
      }
    };
  }

  // Inicializar programa de fidelidade para usuário
  async initializeUserLoyalty(userId) {
    try {
      const config = this.getLoyaltyConfig();
      const id = uuidv4();

      await this.db.execute(`
        INSERT INTO loyalty_program (
          id, user_id, points_earned, points_redeemed, current_points,
          tier, total_spent, last_activity_at
        ) VALUES (?, ?, 0, 0, 0, 'bronze', 0, NOW())
      `, [id, userId]);

      // Adicionar pontos de boas-vindas
      await this.addPoints(userId, config.pointValues.bonus, 'bonus', 'Pontos de boas-vindas');

      return {
        success: true,
        data: { id, userId, tier: 'bronze', points: config.pointValues.bonus }
      };
    } catch (error) {
      console.error('Erro ao inicializar programa de fidelidade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Adicionar pontos
  async addPoints(userId, points, type = 'earned', description = '', orderId = null) {
    try {
      const config = this.getLoyaltyConfig();
      const transactionId = uuidv4();

      // Verificar se usuário tem programa de fidelidade
      let [rows] = await this.db.execute(`
        SELECT * FROM loyalty_program WHERE user_id = ?
      `, [userId]);

      if (rows.length === 0) {
        await this.initializeUserLoyalty(userId);
        [rows] = await this.db.execute(`
          SELECT * FROM loyalty_program WHERE user_id = ?
        `, [userId]);
      }

      const loyalty = rows[0];
      const newPoints = loyalty.current_points + points;

      // Atualizar pontos
      await this.db.execute(`
        UPDATE loyalty_program 
        SET current_points = ?, points_earned = points_earned + ?
        WHERE user_id = ?
      `, [newPoints, points, userId]);

      // Registrar transação
      await this.db.execute(`
        INSERT INTO loyalty_transactions (
          id, user_id, order_id, type, points, description
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [transactionId, userId, orderId, type, points, description]);

      // Verificar upgrade de tier
      const newTier = this.calculateTier(newPoints);
      if (newTier !== loyalty.tier) {
        await this.db.execute(`
          UPDATE loyalty_program SET tier = ? WHERE user_id = ?
        `, [newTier, userId]);
      }

      return {
        success: true,
        data: {
          userId,
          pointsAdded: points,
          newTotal: newPoints,
          newTier,
          transactionId
        }
      };
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resgatar pontos
  async redeemPoints(userId, pointsToRedeem, orderId = null) {
    try {
      const config = this.getLoyaltyConfig();
      
      // Verificar se usuário tem pontos suficientes
      const [rows] = await this.db.execute(`
        SELECT * FROM loyalty_program WHERE user_id = ?
      `, [userId]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Usuário não possui programa de fidelidade'
        };
      }

      const loyalty = rows[0];
      
      if (loyalty.current_points < pointsToRedeem) {
        return {
          success: false,
          error: 'Pontos insuficientes para resgate'
        };
      }

      const discountAmount = (pointsToRedeem / config.pointValues.redeem) * 10; // R$ 10 por 100 pontos
      const newPoints = loyalty.current_points - pointsToRedeem;

      // Atualizar pontos
      await this.db.execute(`
        UPDATE loyalty_program 
        SET current_points = ?, points_redeemed = points_redeemed + ?
        WHERE user_id = ?
      `, [newPoints, pointsToRedeem, userId]);

      // Registrar transação
      const transactionId = uuidv4();
      await this.db.execute(`
        INSERT INTO loyalty_transactions (
          id, user_id, order_id, type, points, description
        ) VALUES (?, ?, ?, 'redeemed', ?, ?)
      `, [transactionId, userId, orderId, -pointsToRedeem, `Resgate de ${pointsToRedeem} pontos`]);

      return {
        success: true,
        data: {
          userId,
          pointsRedeemed: pointsToRedeem,
          discountAmount: Math.round(discountAmount * 100) / 100,
          newTotal: newPoints,
          transactionId
        }
      };
    } catch (error) {
      console.error('Erro ao resgatar pontos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular tier baseado nos pontos
  calculateTier(points) {
    const config = this.getLoyaltyConfig();
    const thresholds = config.tierThresholds;

    if (points >= thresholds.diamond) return 'diamond';
    if (points >= thresholds.platinum) return 'platinum';
    if (points >= thresholds.gold) return 'gold';
    if (points >= thresholds.silver) return 'silver';
    return 'bronze';
  }

  // Obter status do programa de fidelidade
  async getLoyaltyStatus(userId) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM loyalty_program WHERE user_id = ?
      `, [userId]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Usuário não possui programa de fidelidade'
        };
      }

      const loyalty = rows[0];
      const config = this.getLoyaltyConfig();
      const benefits = config.tierBenefits[loyalty.tier];
      const nextTier = this.getNextTier(loyalty.tier);
      const pointsToNextTier = this.getPointsToNextTier(loyalty.current_points, loyalty.tier);

      return {
        success: true,
        data: {
          ...loyalty,
          benefits,
          nextTier,
          pointsToNextTier,
          discountValue: benefits.discount
        }
      };
    } catch (error) {
      console.error('Erro ao obter status de fidelidade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter próximo tier
  getNextTier(currentTier) {
    const tiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }

  // Calcular pontos para próximo tier
  getPointsToNextTier(currentPoints, currentTier) {
    const config = this.getLoyaltyConfig();
    const nextTier = this.getNextTier(currentTier);
    
    if (!nextTier) return 0;
    
    return config.tierThresholds[nextTier] - currentPoints;
  }

  // Processar compra e adicionar pontos
  async processPurchase(userId, orderId, orderAmount) {
    try {
      const config = this.getLoyaltyConfig();
      const pointsEarned = Math.floor(orderAmount * config.pointsPerReal);
      const bonusPoints = config.pointValues.bonus;

      // Adicionar pontos da compra
      await this.addPoints(
        userId, 
        pointsEarned, 
        'earned', 
        `Compra de R$ ${orderAmount.toFixed(2)}`, 
        orderId
      );

      // Adicionar pontos bônus
      await this.addPoints(
        userId, 
        bonusPoints, 
        'bonus', 
        'Pontos bônus por compra', 
        orderId
      );

      // Atualizar total gasto
      await this.db.execute(`
        UPDATE loyalty_program 
        SET total_spent = total_spent + ?, last_activity_at = NOW()
        WHERE user_id = ?
      `, [orderAmount, userId]);

      return {
        success: true,
        data: {
          pointsEarned: pointsEarned + bonusPoints,
          orderAmount
        }
      };
    } catch (error) {
      console.error('Erro ao processar compra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter histórico de transações
  async getTransactionHistory(userId, limit = 20) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM loyalty_transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [userId, limit]);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter histórico de transações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter estatísticas do programa
  async getLoyaltyStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN tier = 'bronze' THEN 1 END) as bronze_members,
          COUNT(CASE WHEN tier = 'silver' THEN 1 END) as silver_members,
          COUNT(CASE WHEN tier = 'gold' THEN 1 END) as gold_members,
          COUNT(CASE WHEN tier = 'platinum' THEN 1 END) as platinum_members,
          COUNT(CASE WHEN tier = 'diamond' THEN 1 END) as diamond_members,
          SUM(current_points) as total_points,
          SUM(total_spent) as total_revenue
        FROM loyalty_program
      `);

      const [topMembers] = await this.db.execute(`
        SELECT 
          lp.user_id,
          u.name as user_name,
          u.email,
          lp.current_points,
          lp.tier,
          lp.total_spent
        FROM loyalty_program lp
        LEFT JOIN users u ON lp.user_id = u.id
        ORDER BY lp.current_points DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          topMembers
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de fidelidade:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new LoyaltyService();
