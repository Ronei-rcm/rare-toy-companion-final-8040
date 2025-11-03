const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

class CouponService {
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
      console.log('✅ Coupon Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Coupon Service: Erro na inicialização:', error.message);
    }
  }

  // Criar cupom
  async createCoupon(couponData) {
    try {
      const id = uuidv4();
      const {
        code,
        name,
        description,
        type,
        value,
        min_order_amount = 0,
        max_discount_amount = null,
        usage_limit = null,
        starts_at = null,
        expires_at = null,
        created_by = null
      } = couponData;

      const [result] = await this.db.execute(`
        INSERT INTO coupons (
          id, code, name, description, type, value, min_order_amount,
          max_discount_amount, usage_limit, starts_at, expires_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, code, name, description, type, value, min_order_amount,
        max_discount_amount, usage_limit, starts_at, expires_at, created_by
      ]);

      return {
        success: true,
        data: { id, ...couponData }
      };
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Buscar cupom por código
  async getCouponByCode(code) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM coupons 
        WHERE code = ? AND is_active = TRUE
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (expires_at IS NULL OR expires_at >= NOW())
      `, [code]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Cupom não encontrado ou expirado'
        };
      }

      const coupon = rows[0];
      
      // Verificar limite de uso
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return {
          success: false,
          error: 'Cupom esgotado'
        };
      }

      return {
        success: true,
        data: coupon
      };
    } catch (error) {
      console.error('Erro ao buscar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar cupom
  async validateCoupon(code, orderAmount, userId = null) {
    try {
      const couponResult = await this.getCouponByCode(code);
      
      if (!couponResult.success) {
        return couponResult;
      }

      const coupon = couponResult.data;

      // Verificar valor mínimo do pedido
      if (orderAmount < coupon.min_order_amount) {
        return {
          success: false,
          error: `Valor mínimo do pedido: R$ ${coupon.min_order_amount.toFixed(2)}`
        };
      }

      // Calcular desconto
      let discountAmount = 0;
      
      switch (coupon.type) {
        case 'percentage':
          discountAmount = (orderAmount * coupon.value) / 100;
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
          }
          break;
        case 'fixed_amount':
          discountAmount = coupon.value;
          break;
        case 'free_shipping':
          discountAmount = 0; // Será tratado separadamente
          break;
        default:
          discountAmount = 0;
      }

      return {
        success: true,
        data: {
          coupon,
          discountAmount: Math.round(discountAmount * 100) / 100,
          finalAmount: Math.round((orderAmount - discountAmount) * 100) / 100
        }
      };
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Aplicar cupom
  async applyCoupon(code, orderId, userId, orderAmount) {
    try {
      const validation = await this.validateCoupon(code, orderAmount, userId);
      
      if (!validation.success) {
        return validation;
      }

      const { coupon, discountAmount } = validation.data;

      // Registrar uso do cupom
      const usageId = uuidv4();
      await this.db.execute(`
        INSERT INTO coupon_usage (id, coupon_id, user_id, order_id, discount_amount)
        VALUES (?, ?, ?, ?, ?)
      `, [usageId, coupon.id, userId, orderId, discountAmount]);

      // Atualizar contador de uso
      await this.db.execute(`
        UPDATE coupons SET used_count = used_count + 1 WHERE id = ?
      `, [coupon.id]);

      return {
        success: true,
        data: {
          coupon,
          discountAmount,
          usageId
        }
      };
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar cupons
  async getCoupons(filters = {}) {
    try {
      let query = 'SELECT * FROM coupons WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR code LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar cupons:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar cupom
  async updateCoupon(id, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        return {
          success: false,
          error: 'Nenhum campo para atualizar'
        };
      }

      values.push(id);

      await this.db.execute(`
        UPDATE coupons SET ${fields.join(', ')} WHERE id = ?
      `, values);

      return {
        success: true,
        message: 'Cupom atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Deletar cupom
  async deleteCoupon(id) {
    try {
      await this.db.execute('DELETE FROM coupons WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Cupom deletado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Estatísticas de cupons
  async getCouponStats() {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_coupons,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_coupons,
          COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_coupons,
          SUM(used_count) as total_uses,
          AVG(used_count) as avg_uses_per_coupon
        FROM coupons
      `);

      const [usageStats] = await this.db.execute(`
        SELECT 
          DATE(used_at) as date,
          COUNT(*) as uses,
          SUM(discount_amount) as total_discount
        FROM coupon_usage 
        WHERE used_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(used_at)
        ORDER BY date DESC
      `);

      return {
        success: true,
        data: {
          overview: rows[0],
          usageStats
        }
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de cupons:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gerar código de cupom único
  generateCouponCode(prefix = '', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Criar cupons automáticos
  async createAutomaticCoupons() {
    try {
      const coupons = [
        {
          code: this.generateCouponCode('WELCOME', 4),
          name: 'Desconto de Boas-vindas',
          description: '10% de desconto para novos clientes',
          type: 'percentage',
          value: 10,
          min_order_amount: 50,
          usage_limit: 1000,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        },
        {
          code: this.generateCouponCode('FREESHIP', 4),
          name: 'Frete Grátis',
          description: 'Frete grátis em compras acima de R$ 100',
          type: 'free_shipping',
          value: 0,
          min_order_amount: 100,
          usage_limit: 500,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 dias
        }
      ];

      const results = [];
      for (const couponData of coupons) {
        const result = await this.createCoupon(couponData);
        results.push(result);
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao criar cupons automáticos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CouponService();
