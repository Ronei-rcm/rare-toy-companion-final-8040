const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService.cjs');
const logger = require('../../config/logger.cjs');

class InventoryService {
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
      console.log('✅ Inventory Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Inventory Service: Erro na inicialização:', error.message);
    }
  }

  // Atualizar estoque de um produto
  async updateStock(productId, quantity, movementType, reason = null, referenceId = null, referenceType = null, costPerUnit = null, createdBy = null) {
    try {
      // Obter estoque atual
      const [currentStock] = await this.db.execute(`
        SELECT estoque FROM produtos WHERE id = ?
      `, [productId]);

      if (currentStock.length === 0) {
        return {
          success: false,
          error: 'Produto não encontrado'
        };
      }

      const currentQuantity = currentStock[0].estoque;
      let newQuantity = currentQuantity;

      // Calcular novo estoque baseado no tipo de movimentação
      switch (movementType) {
        case 'in':
          newQuantity = currentQuantity + quantity;
          break;
        case 'out':
          newQuantity = currentQuantity - quantity;
          break;
        case 'adjustment':
          newQuantity = quantity; // Ajuste direto
          break;
        case 'transfer':
          newQuantity = currentQuantity - quantity;
          break;
        case 'return':
          newQuantity = currentQuantity + quantity;
          break;
        default:
          return {
            success: false,
            error: 'Tipo de movimentação inválido'
          };
      }

      // Verificar se não há estoque negativo
      if (newQuantity < 0) {
        return {
          success: false,
          error: 'Estoque insuficiente'
        };
      }

      // Atualizar estoque do produto
      await this.db.execute(`
        UPDATE produtos SET estoque = ? WHERE id = ?
      `, [newQuantity, productId]);

      // Registrar movimentação
      const movementId = uuidv4();
      const totalCost = costPerUnit ? costPerUnit * quantity : null;

      await this.db.execute(`
        INSERT INTO inventory_movements (
          id, product_id, movement_type, quantity, previous_stock, 
          new_stock, reason, reference_id, reference_type, 
          cost_per_unit, total_cost, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        movementId, productId, movementType, quantity, currentQuantity,
        newQuantity, reason, referenceId, referenceType,
        costPerUnit, totalCost, createdBy
      ]);

      // Verificar alertas de estoque
      await this.checkStockAlerts(productId, newQuantity);

      return {
        success: true,
        data: {
          productId,
          previousStock: currentQuantity,
          newStock: newQuantity,
          movementId
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar alertas de estoque
  async checkStockAlerts(productId, currentQuantity) {
    try {
      // Obter configurações de alerta do produto
      const [product] = await this.db.execute(`
        SELECT id, nome, estoque_minimo, estoque_maximo FROM produtos WHERE id = ?
      `, [productId]);

      if (product.length === 0) return;

      const { nome, estoque_minimo, estoque_maximo } = product[0];

      // Verificar estoque baixo
      if (currentQuantity <= estoque_minimo && currentQuantity > 0) {
        await this.createStockAlert(productId, 'low_stock', estoque_minimo, currentQuantity);
      }

      // Verificar estoque zerado
      if (currentQuantity === 0) {
        await this.createStockAlert(productId, 'out_of_stock', 0, currentQuantity);
      }

      // Verificar excesso de estoque
      if (estoque_maximo && currentQuantity > estoque_maximo) {
        await this.createStockAlert(productId, 'overstock', estoque_maximo, currentQuantity);
      }
    } catch (error) {
      console.error('Erro ao verificar alertas de estoque:', error);
    }
  }

  // Criar alerta de estoque
  async createStockAlert(productId, alertType, thresholdQuantity, currentQuantity) {
    try {
      // Verificar se já existe alerta ativo
      const [existing] = await this.db.execute(`
        SELECT id FROM stock_alerts 
        WHERE product_id = ? AND alert_type = ? AND is_active = TRUE
      `, [productId, alertType]);

      if (existing.length > 0) return;

      const alertId = uuidv4();
      await this.db.execute(`
        INSERT INTO stock_alerts (
          id, product_id, alert_type, threshold_quantity, 
          current_quantity, triggered_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [alertId, productId, alertType, thresholdQuantity, currentQuantity]);

      // Enviar notificação
      await this.sendStockAlertNotification(productId, alertType, currentQuantity);

      return {
        success: true,
        data: { alertId }
      };
    } catch (error) {
      console.error('Erro ao criar alerta de estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificação de alerta de estoque
  async sendStockAlertNotification(productId, alertType, currentQuantity) {
    try {
      const [product] = await this.db.execute(`
        SELECT nome FROM produtos WHERE id = ?
      `, [productId]);

      if (product.length === 0) return;

      const productName = product[0].nome;
      let title, message;

      switch (alertType) {
        case 'low_stock':
          title = '⚠️ Estoque Baixo';
          message = `O produto "${productName}" está com estoque baixo (${currentQuantity} unidades restantes).`;
          break;
        case 'out_of_stock':
          title = '🚨 Estoque Zerado';
          message = `O produto "${productName}" está sem estoque!`;
          break;
        case 'overstock':
          title = '📦 Excesso de Estoque';
          message = `O produto "${productName}" está com excesso de estoque (${currentQuantity} unidades).`;
          break;
        default:
          return;
      }

      // Enviar notificação para administradores
      await notificationService.createNotification({
        user_id: null, // Notificação global
        title,
        message,
        type: 'warning',
        channel: 'push',
        metadata: {
          productId,
          alertType,
          currentQuantity
        }
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de alerta:', error);
    }
  }

  // Obter movimentações de estoque
  async getInventoryMovements(filters = {}) {
    try {
      let query = `
        SELECT 
          im.*,
          p.nome as product_name,
          p.sku as product_sku
        FROM inventory_movements im
        LEFT JOIN produtos p ON im.product_id = p.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.productId) {
        query += ' AND im.product_id = ?';
        params.push(filters.productId);
      }

      if (filters.movementType) {
        query += ' AND im.movement_type = ?';
        params.push(filters.movementType);
      }

      if (filters.dateFrom) {
        query += ' AND im.created_at >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        query += ' AND im.created_at <= ?';
        params.push(filters.dateTo);
      }

      query += ' ORDER BY im.created_at DESC';

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
      console.error('Erro ao obter movimentações de estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter alertas de estoque
  async getStockAlerts(filters = {}) {
    try {
      let query = `
        SELECT 
          sa.*,
          p.nome as product_name,
          p.sku as product_sku,
          p.estoque_minimo,
          p.estoque_maximo
        FROM stock_alerts sa
        LEFT JOIN produtos p ON sa.product_id = p.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.isActive !== undefined) {
        query += ' AND sa.is_active = ?';
        params.push(filters.isActive);
      }

      if (filters.alertType) {
        query += ' AND sa.alert_type = ?';
        params.push(filters.alertType);
      }

      query += ' ORDER BY sa.triggered_at DESC';

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
      console.error('Erro ao obter alertas de estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Resolver alerta de estoque
  async resolveStockAlert(alertId) {
    try {
      await this.db.execute(`
        UPDATE stock_alerts 
        SET is_active = FALSE, resolved_at = NOW() 
        WHERE id = ?
      `, [alertId]);

      return {
        success: true,
        message: 'Alerta resolvido com sucesso'
      };
    } catch (error) {
      console.error('Erro ao resolver alerta de estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter relatório de estoque
  async getInventoryReport(filters = {}) {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_products,
          SUM(estoque) as total_stock,
          SUM(estoque * preco) as total_value,
          COUNT(CASE WHEN estoque = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN estoque <= estoque_minimo AND estoque > 0 THEN 1 END) as low_stock,
          COUNT(CASE WHEN estoque > estoque_maximo THEN 1 END) as overstock
        FROM produtos
      `);

      const [movementStats] = await this.db.execute(`
        SELECT 
          movement_type,
          COUNT(*) as count,
          SUM(quantity) as total_quantity,
          SUM(total_cost) as total_cost
        FROM inventory_movements 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY movement_type
      `);

      const [topMovements] = await this.db.execute(`
        SELECT 
          p.nome as product_name,
          p.sku,
          SUM(CASE WHEN im.movement_type = 'in' THEN im.quantity ELSE 0 END) as total_in,
          SUM(CASE WHEN im.movement_type = 'out' THEN im.quantity ELSE 0 END) as total_out,
          p.estoque as current_stock
        FROM inventory_movements im
        LEFT JOIN produtos p ON im.product_id = p.id
        WHERE im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY im.product_id, p.nome, p.sku, p.estoque
        ORDER BY (total_in + total_out) DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          movementStats,
          topMovements
        }
      };
    } catch (error) {
      console.error('Erro ao obter relatório de estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar venda (reduzir estoque)
  async processSale(orderId, orderItems) {
    try {
      const results = [];
      
      for (const item of orderItems) {
        const result = await this.updateStock(
          item.product_id,
          item.quantity,
          'out',
          'Venda',
          orderId,
          'order',
          null,
          'system'
        );
        
        results.push({
          productId: item.product_id,
          quantity: item.quantity,
          result
        });
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao processar venda:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar devolução (aumentar estoque)
  async processReturn(orderId, returnItems) {
    try {
      const results = [];
      
      for (const item of returnItems) {
        const result = await this.updateStock(
          item.product_id,
          item.quantity,
          'return',
          'Devolução',
          orderId,
          'return',
          null,
          'system'
        );
        
        results.push({
          productId: item.product_id,
          quantity: item.quantity,
          result
        });
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ajuste manual de estoque
  async adjustStock(productId, newQuantity, reason, createdBy) {
    try {
      const [currentStock] = await this.db.execute(`
        SELECT estoque FROM produtos WHERE id = ?
      `, [productId]);

      if (currentStock.length === 0) {
        return {
          success: false,
          error: 'Produto não encontrado'
        };
      }

      const currentQuantity = currentStock[0].estoque;
      const adjustmentQuantity = newQuantity - currentQuantity;

      return await this.updateStock(
        productId,
        Math.abs(adjustmentQuantity),
        'adjustment',
        reason,
        null,
        'adjustment',
        null,
        createdBy
      );
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter produtos com estoque baixo
  async getLowStockProducts() {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          id, nome, sku, estoque, estoque_minimo, preco,
          (estoque - estoque_minimo) as stock_difference
        FROM produtos 
        WHERE estoque <= estoque_minimo AND estoque > 0
        ORDER BY stock_difference ASC
      `);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter produtos com estoque baixo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter produtos sem estoque
  async getOutOfStockProducts() {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          id, nome, sku, estoque, estoque_minimo, preco
        FROM produtos 
        WHERE estoque = 0
        ORDER BY nome ASC
      `);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter produtos sem estoque:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new InventoryService();
