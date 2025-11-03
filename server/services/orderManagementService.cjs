const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService.cjs');
const inventoryService = require('./inventoryService.cjs');
const logger = require('../../config/logger.cjs');

class OrderManagementService {
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
      console.log('✅ Order Management Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Order Management Service: Erro na inicialização:', error.message);
    }
  }

  // Atualizar status do pedido
  async updateOrderStatus(orderId, newStatus, notes = null, changedBy = null) {
    try {
      // Obter status atual
      const [currentOrder] = await this.db.execute(`
        SELECT status FROM orders WHERE id = ?
      `, [orderId]);

      if (currentOrder.length === 0) {
        return {
          success: false,
          error: 'Pedido não encontrado'
        };
      }

      const currentStatus = currentOrder[0].status;

      // Atualizar status do pedido
      await this.db.execute(`
        UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?
      `, [newStatus, orderId]);

      // Registrar histórico
      const historyId = uuidv4();
      await this.db.execute(`
        INSERT INTO order_status_history (
          id, order_id, status, previous_status, notes, changed_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [historyId, orderId, newStatus, currentStatus, notes, changedBy]);

      // Processar ações automáticas baseadas no status
      await this.processOrderStatusActions(orderId, newStatus, currentStatus);

      return {
        success: true,
        data: {
          orderId,
          previousStatus: currentStatus,
          newStatus,
          historyId
        }
      };
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar ações automáticas baseadas no status
  async processOrderStatusActions(orderId, newStatus, previousStatus) {
    try {
      switch (newStatus) {
        case 'confirmed':
          await this.processOrderConfirmation(orderId);
          break;
        case 'processing':
          await this.processOrderProcessing(orderId);
          break;
        case 'shipped':
          await this.processOrderShipped(orderId);
          break;
        case 'delivered':
          await this.processOrderDelivered(orderId);
          break;
        case 'cancelled':
          await this.processOrderCancellation(orderId);
          break;
        case 'returned':
          await this.processOrderReturn(orderId);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar ações do status:', error);
    }
  }

  // Processar confirmação do pedido
  async processOrderConfirmation(orderId) {
    try {
      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, u.email, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (order.length === 0) return;

      const orderData = order[0];

      // Enviar email de confirmação
      await notificationService.createNotification({
        user_id: orderData.user_id,
        title: 'Pedido Confirmado',
        message: `Seu pedido #${orderData.id} foi confirmado e está sendo processado.`,
        type: 'success',
        channel: 'email',
        metadata: {
          order_id: orderId,
          order_number: orderData.id
        }
      });

      // Criar tarefa de processamento
      await this.createOrderTask(orderId, 'process_order', 'Processar pedido confirmado', 'high');
    } catch (error) {
      console.error('Erro ao processar confirmação:', error);
    }
  }

  // Processar pedido em processamento
  async processOrderProcessing(orderId) {
    try {
      // Verificar estoque e reservar produtos
      const [orderItems] = await this.db.execute(`
        SELECT oi.*, p.nome as product_name, p.estoque
        FROM order_items oi
        LEFT JOIN produtos p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderId]);

      for (const item of orderItems) {
        if (item.estoque < item.quantity) {
          // Estoque insuficiente - cancelar pedido
          await this.updateOrderStatus(orderId, 'cancelled', 'Estoque insuficiente', 'system');
          return;
        }
      }

      // Reduzir estoque
      const inventoryResult = await inventoryService.processSale(orderId, orderItems);
      if (!inventoryResult.success) {
        await this.updateOrderStatus(orderId, 'cancelled', 'Erro no processamento de estoque', 'system');
        return;
      }

      // Criar tarefa de preparação
      await this.createOrderTask(orderId, 'prepare_order', 'Preparar pedido para envio', 'high');
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
    }
  }

  // Processar pedido enviado
  async processOrderShipped(orderId) {
    try {
      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, u.email, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (order.length === 0) return;

      const orderData = order[0];

      // Enviar notificação de envio
      await notificationService.createNotification({
        user_id: orderData.user_id,
        title: 'Pedido Enviado',
        message: `Seu pedido #${orderData.id} foi enviado e está a caminho.`,
        type: 'info',
        channel: 'email',
        metadata: {
          order_id: orderId,
          order_number: orderData.id
        }
      });

      // Criar tarefa de acompanhamento
      await this.createOrderTask(orderId, 'track_delivery', 'Acompanhar entrega', 'medium');
    } catch (error) {
      console.error('Erro ao processar envio:', error);
    }
  }

  // Processar pedido entregue
  async processOrderDelivered(orderId) {
    try {
      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, u.email, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (order.length === 0) return;

      const orderData = order[0];

      // Enviar notificação de entrega
      await notificationService.createNotification({
        user_id: orderData.user_id,
        title: 'Pedido Entregue',
        message: `Seu pedido #${orderData.id} foi entregue com sucesso!`,
        type: 'success',
        channel: 'email',
        metadata: {
          order_id: orderId,
          order_number: orderData.id
        }
      });

      // Atualizar pontos de fidelidade
      const loyaltyService = require('./loyaltyService.cjs');
      await loyaltyService.addPoints(orderData.user_id, Math.floor(orderData.total * 0.01), 'order_delivery', orderId);

      // Criar tarefa de follow-up
      await this.createOrderTask(orderId, 'follow_up', 'Follow-up pós-entrega', 'low');
    } catch (error) {
      console.error('Erro ao processar entrega:', error);
    }
  }

  // Processar cancelamento do pedido
  async processOrderCancellation(orderId) {
    try {
      // Restaurar estoque
      const [orderItems] = await this.db.execute(`
        SELECT * FROM order_items WHERE order_id = ?
      `, [orderId]);

      await inventoryService.processReturn(orderId, orderItems);

      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, u.email, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (order.length === 0) return;

      const orderData = order[0];

      // Enviar notificação de cancelamento
      await notificationService.createNotification({
        user_id: orderData.user_id,
        title: 'Pedido Cancelado',
        message: `Seu pedido #${orderData.id} foi cancelado.`,
        type: 'warning',
        channel: 'email',
        metadata: {
          order_id: orderId,
          order_number: orderData.id
        }
      });
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
    }
  }

  // Processar devolução do pedido
  async processOrderReturn(orderId) {
    try {
      // Restaurar estoque
      const [orderItems] = await this.db.execute(`
        SELECT * FROM order_items WHERE order_id = ?
      `, [orderId]);

      await inventoryService.processReturn(orderId, orderItems);

      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, u.email, u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      if (order.length === 0) return;

      const orderData = order[0];

      // Enviar notificação de devolução
      await notificationService.createNotification({
        user_id: orderData.user_id,
        title: 'Pedido Devolvido',
        message: `Seu pedido #${orderData.id} foi devolvido.`,
        type: 'info',
        channel: 'email',
        metadata: {
          order_id: orderId,
          order_number: orderData.id
        }
      });
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
    }
  }

  // Criar tarefa do pedido
  async createOrderTask(orderId, taskType, description, priority = 'medium') {
    try {
      const taskId = uuidv4();
      await this.db.execute(`
        INSERT INTO order_tasks (
          id, order_id, task_type, description, priority, status, created_by
        ) VALUES (?, ?, ?, ?, ?, 'pending', 'system')
      `, [taskId, orderId, taskType, description, priority]);

      return { success: true, data: { taskId } };
    } catch (error) {
      console.error('Erro ao criar tarefa do pedido:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter histórico de status do pedido
  async getOrderStatusHistory(orderId) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          osh.*,
          u.name as changed_by_name
        FROM order_status_history osh
        LEFT JOIN users u ON osh.changed_by = u.id
        WHERE osh.order_id = ?
        ORDER BY osh.changed_at DESC
      `, [orderId]);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter histórico de status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar método de envio
  async createShippingMethod(methodData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        carrier,
        service_code,
        estimated_days,
        base_cost,
        cost_per_kg = 0,
        free_shipping_threshold
      } = methodData;

      const [result] = await this.db.execute(`
        INSERT INTO shipping_methods (
          id, name, description, carrier, service_code, estimated_days,
          base_cost, cost_per_kg, free_shipping_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, carrier, service_code, estimated_days,
        base_cost, cost_per_kg, free_shipping_threshold
      ]);

      return {
        success: true,
        data: { id, ...methodData }
      };
    } catch (error) {
      console.error('Erro ao criar método de envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar métodos de envio
  async getShippingMethods() {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM shipping_methods 
        WHERE is_active = TRUE 
        ORDER BY name ASC
      `);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar métodos de envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular custo de envio
  async calculateShippingCost(orderId, shippingMethodId) {
    try {
      // Obter dados do pedido
      const [order] = await this.db.execute(`
        SELECT o.*, SUM(oi.quantity * p.peso) as total_weight
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN produtos p ON oi.product_id = p.id
        WHERE o.id = ?
        GROUP BY o.id
      `, [orderId]);

      if (order.length === 0) {
        return {
          success: false,
          error: 'Pedido não encontrado'
        };
      }

      // Obter método de envio
      const [method] = await this.db.execute(`
        SELECT * FROM shipping_methods WHERE id = ?
      `, [shippingMethodId]);

      if (method.length === 0) {
        return {
          success: false,
          error: 'Método de envio não encontrado'
        };
      }

      const orderData = order[0];
      const methodData = method[0];

      // Verificar frete grátis
      if (methodData.free_shipping_threshold && orderData.total >= methodData.free_shipping_threshold) {
        return {
          success: true,
          data: {
            cost: 0,
            free_shipping: true,
            method: methodData
          }
        };
      }

      // Calcular custo
      const weight = orderData.total_weight || 1; // Peso mínimo de 1kg
      const cost = methodData.base_cost + (weight * methodData.cost_per_kg);

      return {
        success: true,
        data: {
          cost: cost,
          free_shipping: false,
          method: methodData,
          weight: weight
        }
      };
    } catch (error) {
      console.error('Erro ao calcular custo de envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar envio
  async createShipment(shipmentData) {
    try {
      const id = uuidv4();
      const {
        order_id,
        shipping_method_id,
        tracking_number,
        carrier,
        service_code,
        shipping_cost,
        weight,
        dimensions,
        estimated_delivery_date,
        notes
      } = shipmentData;

      const [result] = await this.db.execute(`
        INSERT INTO order_shipments (
          id, order_id, shipping_method_id, tracking_number, carrier, service_code,
          shipping_cost, weight, dimensions, estimated_delivery_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, order_id, shipping_method_id, tracking_number, carrier, service_code,
        shipping_cost, weight, dimensions, estimated_delivery_date, notes
      ]);

      // Atualizar status do pedido para "shipped"
      await this.updateOrderStatus(order_id, 'shipped', 'Pedido enviado', 'system');

      return {
        success: true,
        data: { id, ...shipmentData }
      };
    } catch (error) {
      console.error('Erro ao criar envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar status do envio
  async updateShipmentStatus(shipmentId, status, location = null, description = null) {
    try {
      // Atualizar status do envio
      await this.db.execute(`
        UPDATE order_shipments 
        SET status = ?, updated_at = NOW() 
        WHERE id = ?
      `, [status, shipmentId]);

      // Registrar tracking
      const trackingId = uuidv4();
      await this.db.execute(`
        INSERT INTO shipment_tracking (
          id, shipment_id, status, location, description
        ) VALUES (?, ?, ?, ?, ?)
      `, [trackingId, shipmentId, status, location, description]);

      // Atualizar status do pedido se necessário
      if (status === 'delivered') {
        const [shipment] = await this.db.execute(`
          SELECT order_id FROM order_shipments WHERE id = ?
        `, [shipmentId]);

        if (shipment.length > 0) {
          await this.updateOrderStatus(shipment[0].order_id, 'delivered', 'Pedido entregue', 'system');
        }
      }

      return {
        success: true,
        data: { trackingId, status }
      };
    } catch (error) {
      console.error('Erro ao atualizar status do envio:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter rastreamento do envio
  async getShipmentTracking(shipmentId) {
    try {
      const [shipment] = await this.db.execute(`
        SELECT 
          os.*,
          sm.name as method_name,
          o.id as order_number
        FROM order_shipments os
        LEFT JOIN shipping_methods sm ON os.shipping_method_id = sm.id
        LEFT JOIN orders o ON os.order_id = o.id
        WHERE os.id = ?
      `, [shipmentId]);

      if (shipment.length === 0) {
        return {
          success: false,
          error: 'Envio não encontrado'
        };
      }

      const [tracking] = await this.db.execute(`
        SELECT * FROM shipment_tracking 
        WHERE shipment_id = ? 
        ORDER BY timestamp DESC
      `, [shipmentId]);

      return {
        success: true,
        data: {
          shipment: shipment[0],
          tracking: tracking
        }
      };
    } catch (error) {
      console.error('Erro ao obter rastreamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter estatísticas de pedidos
  async getOrderStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          SUM(total) as total_revenue,
          AVG(total) as avg_order_value
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      const [statusDistribution] = await this.db.execute(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY status
        ORDER BY count DESC
      `);

      const [recentOrders] = await this.db.execute(`
        SELECT 
          o.*,
          u.name as customer_name,
          u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          statusDistribution,
          recentOrders
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de pedidos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter relatório de pedidos
  async getOrderReport(filters = {}) {
    try {
      let query = `
        SELECT 
          o.*,
          u.name as customer_name,
          u.email as customer_email,
          os.tracking_number,
          os.status as shipment_status
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_shipments os ON o.id = os.order_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += ' AND o.status = ?';
        params.push(filters.status);
      }

      if (filters.date_from) {
        query += ' AND o.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND o.created_at <= ?';
        params.push(filters.date_to);
      }

      if (filters.customer_id) {
        query += ' AND o.user_id = ?';
        params.push(filters.customer_id);
      }

      query += ' ORDER BY o.created_at DESC';

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
      console.error('Erro ao obter relatório de pedidos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new OrderManagementService();
