const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('./notificationService.cjs');
const loyaltyService = require('./loyaltyService.cjs');
const logger = require('../../config/logger.cjs');

class CRMService {
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
      console.log('✅ CRM Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ CRM Service: Erro na inicialização:', error.message);
    }
  }

  // Criar perfil de cliente
  async createCustomerProfile(profileData) {
    try {
      const id = uuidv4();
      const {
        user_id,
        first_name,
        last_name,
        email,
        phone,
        birth_date,
        gender,
        avatar_url,
        preferences = {},
        notes,
        tags = [],
        source = 'website'
      } = profileData;

      const [result] = await this.db.execute(`
        INSERT INTO customer_profiles (
          id, user_id, first_name, last_name, email, phone, birth_date,
          gender, avatar_url, preferences, notes, tags, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, user_id, first_name, last_name, email, phone, birth_date,
        gender, avatar_url, JSON.stringify(preferences), notes, 
        JSON.stringify(tags), source
      ]);

      // Inicializar programa de fidelidade
      await loyaltyService.initializeUserLoyalty(user_id);

      return {
        success: true,
        data: { id, ...profileData }
      };
    } catch (error) {
      console.error('Erro ao criar perfil de cliente:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter perfil de cliente
  async getCustomerProfile(customerId) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          cp.*,
          u.name as username,
          u.created_at as user_created_at,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM customer_profiles cp
        LEFT JOIN users u ON cp.user_id = u.id
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE cp.id = ?
        GROUP BY cp.id
      `, [customerId]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        };
      }

      const profile = rows[0];
      
      // Obter dados de fidelidade
      const loyaltyData = await loyaltyService.getLoyaltyStatus(profile.user_id);
      if (loyaltyData.success) {
        profile.loyalty = loyaltyData.data;
      }

      // Obter interações recentes
      const interactions = await this.getCustomerInteractions(customerId, 5);
      if (interactions.success) {
        profile.recent_interactions = interactions.data;
      }

      // Obter tarefas pendentes
      const tasks = await this.getCustomerTasks(customerId, { status: 'pending' });
      if (tasks.success) {
        profile.pending_tasks = tasks.data;
      }

      return {
        success: true,
        data: profile
      };
    } catch (error) {
      console.error('Erro ao obter perfil de cliente:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar clientes
  async getCustomers(filters = {}) {
    try {
      let query = `
        SELECT 
          cp.*,
          u.name as username,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.total) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM customer_profiles cp
        LEFT JOIN users u ON cp.user_id = u.id
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE 1=1
      `;
      const params = [];

      if (filters.status) {
        query += ' AND cp.status = ?';
        params.push(filters.status);
      }

      if (filters.segment) {
        query += ' AND JSON_CONTAINS(cp.tags, ?)';
        params.push(JSON.stringify(filters.segment));
      }

      if (filters.search) {
        query += ' AND (cp.first_name LIKE ? OR cp.last_name LIKE ? OR cp.email LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.source) {
        query += ' AND cp.source = ?';
        params.push(filters.source);
      }

      query += ' GROUP BY cp.id ORDER BY cp.created_at DESC';

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
      console.error('Erro ao listar clientes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar perfil de cliente
  async updateCustomerProfile(customerId, updateData) {
    try {
      const fields = [];
      const values = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'preferences' || key === 'tags') {
            fields.push(`${key} = ?`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            fields.push(`${key} = ?`);
            values.push(updateData[key]);
          }
        }
      });

      if (fields.length === 0) {
        return {
          success: false,
          error: 'Nenhum campo para atualizar'
        };
      }

      values.push(customerId);

      await this.db.execute(`
        UPDATE customer_profiles SET ${fields.join(', ')} WHERE id = ?
      `, values);

      return {
        success: true,
        message: 'Perfil atualizado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil de cliente:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar segmento de clientes
  async createCustomerSegment(segmentData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        criteria,
        color = '#3B82F6'
      } = segmentData;

      const [result] = await this.db.execute(`
        INSERT INTO customer_segments (
          id, name, description, criteria, color
        ) VALUES (?, ?, ?, ?, ?)
      `, [id, name, description, JSON.stringify(criteria), color]);

      return {
        success: true,
        data: { id, ...segmentData }
      };
    } catch (error) {
      console.error('Erro ao criar segmento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar segmentos
  async getCustomerSegments() {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          cs.*,
          COUNT(cp.id) as customer_count
        FROM customer_segments cs
        LEFT JOIN customer_profiles cp ON JSON_CONTAINS(cp.tags, JSON_QUOTE(cs.name))
        WHERE cs.is_active = TRUE
        GROUP BY cs.id
        ORDER BY cs.name ASC
      `);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar segmentos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Aplicar segmentação automática
  async applyCustomerSegmentation() {
    try {
      const segments = await this.getCustomerSegments();
      if (!segments.success) return segments;

      const results = [];
      
      for (const segment of segments.data) {
        const criteria = JSON.parse(segment.criteria);
        const customers = await this.getCustomersByCriteria(criteria);
        
        if (customers.success) {
          for (const customer of customers.data) {
            await this.addCustomerToSegment(customer.id, segment.name);
          }
          results.push({
            segment: segment.name,
            customers_updated: customers.data.length
          });
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao aplicar segmentação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter clientes por critérios
  async getCustomersByCriteria(criteria) {
    try {
      let query = 'SELECT * FROM customer_profiles WHERE 1=1';
      const params = [];

      if (criteria.min_orders) {
        query += ` AND user_id IN (
          SELECT user_id FROM orders 
          GROUP BY user_id 
          HAVING COUNT(*) >= ?
        )`;
        params.push(criteria.min_orders);
      }

      if (criteria.min_spent) {
        query += ` AND user_id IN (
          SELECT user_id FROM orders 
          GROUP BY user_id 
          HAVING SUM(total) >= ?
        )`;
        params.push(criteria.min_spent);
      }

      if (criteria.status) {
        query += ' AND status = ?';
        params.push(criteria.status);
      }

      if (criteria.source) {
        query += ' AND source = ?';
        params.push(criteria.source);
      }

      if (criteria.last_order_days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - criteria.last_order_days);
        query += ` AND user_id IN (
          SELECT user_id FROM orders 
          WHERE created_at >= ?
        )`;
        params.push(daysAgo);
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter clientes por critérios:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Adicionar cliente a segmento
  async addCustomerToSegment(customerId, segmentName) {
    try {
      const [customer] = await this.db.execute(`
        SELECT tags FROM customer_profiles WHERE id = ?
      `, [customerId]);

      if (customer.length === 0) return;

      const currentTags = JSON.parse(customer[0].tags || '[]');
      if (!currentTags.includes(segmentName)) {
        currentTags.push(segmentName);
        await this.db.execute(`
          UPDATE customer_profiles SET tags = ? WHERE id = ?
        `, [JSON.stringify(currentTags), customerId]);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar cliente ao segmento:', error);
      return { success: false, error: error.message };
    }
  }

  // Criar interação com cliente
  async createCustomerInteraction(interactionData) {
    try {
      const id = uuidv4();
      const {
        customer_id,
        interaction_type,
        subject,
        description,
        outcome = 'pending',
        priority = 'medium',
        assigned_to,
        created_by
      } = interactionData;

      const [result] = await this.db.execute(`
        INSERT INTO customer_interactions (
          id, customer_id, interaction_type, subject, description,
          outcome, priority, assigned_to, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, customer_id, interaction_type, subject, description,
        outcome, priority, assigned_to, created_by
      ]);

      return {
        success: true,
        data: { id, ...interactionData }
      };
    } catch (error) {
      console.error('Erro ao criar interação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter interações do cliente
  async getCustomerInteractions(customerId, limit = 20) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM customer_interactions 
        WHERE customer_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [customerId, limit]);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter interações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar tarefa para cliente
  async createCustomerTask(taskData) {
    try {
      const id = uuidv4();
      const {
        customer_id,
        title,
        description,
        task_type,
        priority = 'medium',
        due_date,
        assigned_to,
        created_by
      } = taskData;

      const [result] = await this.db.execute(`
        INSERT INTO customer_tasks (
          id, customer_id, title, description, task_type,
          priority, due_date, assigned_to, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, customer_id, title, description, task_type,
        priority, due_date, assigned_to, created_by
      ]);

      return {
        success: true,
        data: { id, ...taskData }
      };
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter tarefas do cliente
  async getCustomerTasks(customerId, filters = {}) {
    try {
      let query = 'SELECT * FROM customer_tasks WHERE customer_id = ?';
      const params = [customerId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.task_type) {
        query += ' AND task_type = ?';
        params.push(filters.task_type);
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
      console.error('Erro ao obter tarefas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Atualizar status da tarefa
  async updateTaskStatus(taskId, status, completedBy = null) {
    try {
      const updateFields = ['status = ?'];
      const values = [status];

      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
        if (completedBy) {
          updateFields.push('assigned_to = ?');
          values.push(completedBy);
        }
      }

      values.push(taskId);

      await this.db.execute(`
        UPDATE customer_tasks 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `, values);

      return {
        success: true,
        message: 'Status da tarefa atualizado'
      };
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Registrar comunicação
  async logCommunication(communicationData) {
    try {
      const id = uuidv4();
      const {
        customer_id,
        channel,
        direction,
        subject,
        content,
        status = 'sent',
        scheduled_at,
        created_by
      } = communicationData;

      const [result] = await this.db.execute(`
        INSERT INTO customer_communications (
          id, customer_id, channel, direction, subject, content,
          status, scheduled_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, customer_id, channel, direction, subject, content,
        status, scheduled_at, created_by
      ]);

      return {
        success: true,
        data: { id, ...communicationData }
      };
    } catch (error) {
      console.error('Erro ao registrar comunicação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter estatísticas de CRM
  async getCRMStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_customers,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
          COUNT(CASE WHEN status = 'vip' THEN 1 END) as vip_customers,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_customers
        FROM customer_profiles
      `);

      const [interactionStats] = await this.db.execute(`
        SELECT 
          interaction_type,
          COUNT(*) as count,
          COUNT(CASE WHEN outcome = 'resolved' THEN 1 END) as resolved
        FROM customer_interactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY interaction_type
      `);

      const [taskStats] = await this.db.execute(`
        SELECT 
          status,
          COUNT(*) as count
        FROM customer_tasks 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY status
      `);

      const [topCustomers] = await this.db.execute(`
        SELECT 
          cp.first_name,
          cp.last_name,
          cp.email,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_spent
        FROM customer_profiles cp
        LEFT JOIN users u ON cp.user_id = u.id
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY cp.id, cp.first_name, cp.last_name, cp.email
        ORDER BY total_spent DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          interactionStats,
          taskStats,
          topCustomers
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de CRM:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter relatório de cliente
  async getCustomerReport(customerId, dateFrom, dateTo) {
    try {
      const [profile] = await this.db.execute(`
        SELECT * FROM customer_profiles WHERE id = ?
      `, [customerId]);

      if (profile.length === 0) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        };
      }

      const [orders] = await this.db.execute(`
        SELECT 
          o.*,
          oi.product_name,
          oi.quantity,
          oi.price
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ? 
        AND o.created_at >= ? 
        AND o.created_at <= ?
        ORDER BY o.created_at DESC
      `, [profile[0].user_id, dateFrom, dateTo]);

      const [interactions] = await this.db.execute(`
        SELECT * FROM customer_interactions 
        WHERE customer_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
        ORDER BY created_at DESC
      `, [customerId, dateFrom, dateTo]);

      const [tasks] = await this.db.execute(`
        SELECT * FROM customer_tasks 
        WHERE customer_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
        ORDER BY created_at DESC
      `, [customerId, dateFrom, dateTo]);

      return {
        success: true,
        data: {
          profile: profile[0],
          orders,
          interactions,
          tasks
        }
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de cliente:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CRMService();
