const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger.cjs');

class SupplierService {
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
      console.log('✅ Supplier Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Supplier Service: Erro na inicialização:', error.message);
    }
  }

  // Criar fornecedor
  async createSupplier(supplierData) {
    try {
      const id = uuidv4();
      const {
        name,
        contact_person,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        country = 'Brasil',
        tax_id,
        payment_terms,
        delivery_time_days = 7
      } = supplierData;

      const [result] = await this.db.execute(`
        INSERT INTO suppliers (
          id, name, contact_person, email, phone, address, city, state,
          zip_code, country, tax_id, payment_terms, delivery_time_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, contact_person, email, phone, address, city, state,
        zip_code, country, tax_id, payment_terms, delivery_time_days
      ]);

      return {
        success: true,
        data: { id, ...supplierData }
      };
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar fornecedores
  async getSuppliers(filters = {}) {
    try {
      let query = 'SELECT * FROM suppliers WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY name ASC';

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
      console.error('Erro ao listar fornecedores:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter fornecedor por ID
  async getSupplierById(id) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM suppliers WHERE id = ?
      `, [id]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Fornecedor não encontrado'
        };
      }

      return {
        success: true,
        data: rows[0]
      };
    } catch (error) {
      console.error('Erro ao obter fornecedor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar fornecedor
  async updateSupplier(id, updateData) {
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
        UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?
      `, values);

      return {
        success: true,
        message: 'Fornecedor atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Deletar fornecedor
  async deleteSupplier(id) {
    try {
      await this.db.execute('DELETE FROM suppliers WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Fornecedor deletado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao deletar fornecedor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar pedido de compra
  async createPurchaseOrder(purchaseOrderData) {
    try {
      const id = uuidv4();
      const orderNumber = `PO-${Date.now()}`;
      const {
        supplier_id,
        expected_delivery_date,
        notes,
        items,
        created_by
      } = purchaseOrderData;

      // Calcular total
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_cost;
      }

      // Criar pedido de compra
      await this.db.execute(`
        INSERT INTO purchase_orders (
          id, supplier_id, order_number, expected_delivery_date, 
          notes, total_amount, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, supplier_id, orderNumber, expected_delivery_date, notes, totalAmount, created_by]);

      // Adicionar itens
      for (const item of items) {
        const itemId = uuidv4();
        const totalCost = item.quantity * item.unit_cost;
        
        await this.db.execute(`
          INSERT INTO purchase_order_items (
            id, purchase_order_id, product_id, quantity, 
            unit_cost, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [itemId, id, item.product_id, item.quantity, item.unit_cost, totalCost]);
      }

      return {
        success: true,
        data: {
          id,
          order_number: orderNumber,
          total_amount: totalAmount
        }
      };
    } catch (error) {
      console.error('Erro ao criar pedido de compra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar pedidos de compra
  async getPurchaseOrders(filters = {}) {
    try {
      let query = `
        SELECT 
          po.*,
          s.name as supplier_name,
          s.contact_person,
          s.email as supplier_email
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.supplier_id) {
        query += ' AND po.supplier_id = ?';
        params.push(filters.supplier_id);
      }

      if (filters.status) {
        query += ' AND po.status = ?';
        params.push(filters.status);
      }

      if (filters.date_from) {
        query += ' AND po.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND po.created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' ORDER BY po.created_at DESC';

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
      console.error('Erro ao listar pedidos de compra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter pedido de compra com itens
  async getPurchaseOrderWithItems(id) {
    try {
      const [order] = await this.db.execute(`
        SELECT 
          po.*,
          s.name as supplier_name,
          s.contact_person,
          s.email as supplier_email,
          s.phone as supplier_phone
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
      `, [id]);

      if (order.length === 0) {
        return {
          success: false,
          error: 'Pedido de compra não encontrado'
        };
      }

      const [items] = await this.db.execute(`
        SELECT 
          poi.*,
          p.nome as product_name,
          p.sku as product_sku,
          p.estoque as current_stock
        FROM purchase_order_items poi
        LEFT JOIN produtos p ON poi.product_id = p.id
        WHERE poi.purchase_order_id = ?
      `, [id]);

      return {
        success: true,
        data: {
          ...order[0],
          items
        }
      };
    } catch (error) {
      console.error('Erro ao obter pedido de compra:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar status do pedido de compra
  async updatePurchaseOrderStatus(id, status, notes = null) {
    try {
      const updateFields = ['status = ?'];
      const values = [status];

      if (notes) {
        updateFields.push('notes = ?');
        values.push(notes);
      }

      if (status === 'completed') {
        updateFields.push('actual_delivery_date = CURDATE()');
      }

      values.push(id);

      await this.db.execute(`
        UPDATE purchase_orders 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `, values);

      return {
        success: true,
        message: 'Status atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar recebimento de mercadoria
  async processReceipt(purchaseOrderId, receivedItems) {
    try {
      const inventoryService = require('./inventoryService.cjs');
      
      for (const item of receivedItems) {
        // Atualizar quantidade recebida
        await this.db.execute(`
          UPDATE purchase_order_items 
          SET received_quantity = received_quantity + ? 
          WHERE id = ?
        `, [item.quantity, item.item_id]);

        // Adicionar ao estoque
        await inventoryService.updateStock(
          item.product_id,
          item.quantity,
          'in',
          'Recebimento de mercadoria',
          purchaseOrderId,
          'purchase',
          item.unit_cost,
          'system'
        );
      }

      // Verificar se todos os itens foram recebidos
      const [remainingItems] = await this.db.execute(`
        SELECT COUNT(*) as count FROM purchase_order_items 
        WHERE purchase_order_id = ? AND received_quantity < quantity
      `, [purchaseOrderId]);

      if (remainingItems[0].count === 0) {
        await this.updatePurchaseOrderStatus(purchaseOrderId, 'completed');
      } else {
        await this.updatePurchaseOrderStatus(purchaseOrderId, 'partial');
      }

      return {
        success: true,
        message: 'Recebimento processado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao processar recebimento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter estatísticas de fornecedores
  async getSupplierStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_suppliers,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_suppliers,
          COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_suppliers
        FROM suppliers
      `);

      const [purchaseStats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_value,
          AVG(total_amount) as avg_order_value,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
        FROM purchase_orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      const [topSuppliers] = await this.db.execute(`
        SELECT 
          s.name as supplier_name,
          COUNT(po.id) as order_count,
          SUM(po.total_amount) as total_value,
          AVG(po.total_amount) as avg_order_value
        FROM suppliers s
        LEFT JOIN purchase_orders po ON s.id = po.supplier_id
        WHERE po.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY s.id, s.name
        ORDER BY total_value DESC
        LIMIT 5
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          purchaseStats: purchaseStats[0],
          topSuppliers
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de fornecedores:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gerar relatório de fornecedores
  async generateSupplierReport(supplierId, dateFrom, dateTo) {
    try {
      const [orders] = await this.db.execute(`
        SELECT 
          po.*,
          s.name as supplier_name,
          COUNT(poi.id) as item_count,
          SUM(poi.quantity) as total_quantity
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        WHERE po.supplier_id = ? 
        AND po.created_at >= ? 
        AND po.created_at <= ?
        GROUP BY po.id
        ORDER BY po.created_at DESC
      `, [supplierId, dateFrom, dateTo]);

      const [items] = await this.db.execute(`
        SELECT 
          poi.*,
          p.nome as product_name,
          p.sku as product_sku
        FROM purchase_order_items poi
        LEFT JOIN produtos p ON poi.product_id = p.id
        LEFT JOIN purchase_orders po ON poi.purchase_order_id = po.id
        WHERE po.supplier_id = ? 
        AND po.created_at >= ? 
        AND po.created_at <= ?
        ORDER BY po.created_at DESC
      `, [supplierId, dateFrom, dateTo]);

      return {
        success: true,
        data: {
          orders,
          items
        }
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de fornecedor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new SupplierService();
