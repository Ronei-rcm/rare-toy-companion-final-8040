/**
 * Serviço de Automações para Pedidos
 * Gerencia workflows automáticos, regras de negócio e ações baseadas em eventos
 */

const { v4: uuidv4 } = require('uuid');

// Logger fallback se não existir
let logger;
try {
  logger = require('../config/logger.cjs');
} catch (e) {
  // Fallback logger simples
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.debug('[DEBUG]', ...args)
  };
}

class OrderAutomationService {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection (pool) é obrigatório para OrderAutomationService');
    }
    this.db = db;
    this.automations = new Map();
    this.rules = [];
    this.initializeDefaultRules();
  }

  /**
   * Inicializa regras padrão de automação
   */
  initializeDefaultRules() {
    // Regra 1: Notificar cliente quando pedido é confirmado
    this.rules.push({
      id: 'auto_notify_confirmed',
      name: 'Notificar Cliente - Pedido Confirmado',
      trigger: 'order_status_changed',
      conditions: {
        new_status: 'confirmed',
        previous_status: 'pending'
      },
      actions: [
        {
          type: 'send_email',
          template: 'order_confirmed',
          to: 'customer_email'
        },
        {
          type: 'create_notification',
          title: 'Pedido Confirmado',
          message: 'Seu pedido foi confirmado e está sendo preparado!'
        }
      ],
      enabled: true
    });

    // Regra 2: Atualizar estoque quando pedido é confirmado
    this.rules.push({
      id: 'auto_update_stock_confirmed',
      name: 'Atualizar Estoque - Pedido Confirmado',
      trigger: 'order_status_changed',
      conditions: {
        new_status: 'confirmed',
        previous_status: 'pending'
      },
      actions: [
        {
          type: 'update_stock',
          operation: 'decrease',
          source: 'order_items'
        }
      ],
      enabled: true
    });

    // Regra 3: Notificar cliente quando pedido é enviado
    this.rules.push({
      id: 'auto_notify_shipped',
      name: 'Notificar Cliente - Pedido Enviado',
      trigger: 'order_status_changed',
      conditions: {
        new_status: 'shipped'
      },
      actions: [
        {
          type: 'send_email',
          template: 'order_shipped',
          to: 'customer_email',
          include_tracking: true
        },
        {
          type: 'create_notification',
          title: 'Pedido Enviado',
          message: 'Seu pedido foi enviado! Código de rastreamento disponível.'
        }
      ],
      enabled: true
    });

    // Regra 4: Marcar como urgente pedidos acima de R$ 500
    this.rules.push({
      id: 'auto_mark_urgent_high_value',
      name: 'Marcar Urgente - Pedidos de Alto Valor',
      trigger: 'order_created',
      conditions: {
        total: { $gte: 500 }
      },
      actions: [
        {
          type: 'update_order',
          field: 'priority',
          value: 'urgent'
        },
        {
          type: 'create_notification',
          title: 'Pedido de Alto Valor',
          message: 'Novo pedido de alto valor requer atenção!',
          target: 'admin'
        }
      ],
      enabled: true
    });

    // Regra 5: Cancelar pedidos pendentes após 7 dias
    this.rules.push({
      id: 'auto_cancel_old_pending',
      name: 'Cancelar Pedidos Antigos Pendentes',
      trigger: 'scheduled',
      schedule: 'daily',
      conditions: {
        status: 'pending',
        days_since_created: { $gte: 7 }
      },
      actions: [
        {
          type: 'update_order',
          field: 'status',
          value: 'cancelled'
        },
        {
          type: 'send_email',
          template: 'order_auto_cancelled',
          to: 'customer_email'
        }
      ],
      enabled: false // Desabilitado por padrão
    });

    // Regra 6: Aplicar desconto automático para clientes VIP
    this.rules.push({
      id: 'auto_apply_vip_discount',
      name: 'Aplicar Desconto VIP',
      trigger: 'order_created',
      conditions: {
        customer_type: 'vip',
        total: { $gte: 200 }
      },
      actions: [
        {
          type: 'apply_discount',
          type: 'percentage',
          value: 10,
          description: 'Desconto VIP Automático'
        }
      ],
      enabled: true
    });

    logger.info(`✅ ${this.rules.length} regras de automação inicializadas`);
  }

  /**
   * Processa um evento e executa regras correspondentes
   */
  async processEvent(eventType, eventData) {
    try {
      const matchingRules = this.rules.filter(rule => {
        if (rule.trigger !== eventType) return false;
        if (!rule.enabled) return false;
        return this.evaluateConditions(rule.conditions, eventData);
      });

      logger.info(`🔍 Processando evento ${eventType}, ${matchingRules.length} regras correspondentes`);

      for (const rule of matchingRules) {
        await this.executeRule(rule, eventData);
      }

      return {
        success: true,
        rules_executed: matchingRules.length
      };
    } catch (error) {
      logger.error('Erro ao processar evento de automação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Avalia condições de uma regra
   */
  evaluateConditions(conditions, eventData) {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'object' && value !== null) {
        // Operadores especiais ($gte, $lte, etc)
        if (value.$gte !== undefined) {
          if (!(eventData[key] >= value.$gte)) return false;
        } else if (value.$lte !== undefined) {
          if (!(eventData[key] <= value.$lte)) return false;
        } else if (value.$gt !== undefined) {
          if (!(eventData[key] > value.$gt)) return false;
        } else if (value.$lt !== undefined) {
          if (!(eventData[key] < value.$lt)) return false;
        } else if (value.$in !== undefined) {
          if (!value.$in.includes(eventData[key])) return false;
        }
      } else {
        // Comparação simples
        if (eventData[key] !== value) return false;
      }
    }
    return true;
  }

  /**
   * Executa ações de uma regra
   */
  async executeRule(rule, eventData) {
    logger.info(`⚙️ Executando regra: ${rule.name}`);

    for (const action of rule.actions) {
      try {
        await this.executeAction(action, eventData, rule);
      } catch (error) {
        logger.error(`Erro ao executar ação ${action.type} da regra ${rule.name}:`, error);
      }
    }
  }

  /**
   * Executa uma ação específica
   */
  async executeAction(action, eventData, rule) {
    switch (action.type) {
      case 'send_email':
        await this.sendEmail(action, eventData);
        break;

      case 'create_notification':
        await this.createNotification(action, eventData);
        break;

      case 'update_order':
        await this.updateOrder(action, eventData);
        break;

      case 'update_stock':
        await this.updateStock(action, eventData);
        break;

      case 'apply_discount':
        await this.applyDiscount(action, eventData);
        break;

      case 'assign_to_user':
        await this.assignToUser(action, eventData);
        break;

      case 'create_task':
        await this.createTask(action, eventData);
        break;

      default:
        logger.warn(`Tipo de ação desconhecido: ${action.type}`);
    }
  }

  /**
   * Envia email usando template
   */
  async sendEmail(action, eventData) {
    // TODO: Integrar com serviço de email real
    logger.info(`📧 Enviando email: ${action.template} para ${eventData[action.to] || 'cliente'}`);
    
    // Simular envio de email
    const emailData = {
      to: eventData[action.to] || eventData.customer_email,
      template: action.template,
      data: {
        order_id: eventData.order_id,
        customer_name: eventData.customer_name,
        order_total: eventData.total,
        tracking_code: action.include_tracking ? eventData.tracking_code : null,
        ...eventData
      }
    };

    // Aqui você integraria com um serviço de email real (SendGrid, AWS SES, etc)
    console.log('📧 Email simulado:', emailData);
  }

  /**
   * Cria notificação no sistema
   */
  async createNotification(action, eventData) {
    try {
      const notificationId = uuidv4();
      const target = action.target || 'customer';
      const userId = target === 'admin' ? null : eventData.customer_id;

      await this.db.execute(`
        INSERT INTO notifications (
          id, user_id, title, message, type, data, read, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
      `, [
        notificationId,
        userId,
        action.title,
        action.message,
        'order_update',
        JSON.stringify({
          order_id: eventData.order_id,
          ...eventData
        })
      ]);

      logger.info(`🔔 Notificação criada: ${action.title}`);
    } catch (error) {
      logger.error('Erro ao criar notificação:', error);
    }
  }

  /**
   * Atualiza campo do pedido
   */
  async updateOrder(action, eventData) {
    try {
      await this.db.execute(
        `UPDATE orders SET ${action.field} = ?, updated_at = NOW() WHERE id = ?`,
        [action.value, eventData.order_id]
      );
      logger.info(`📝 Pedido atualizado: ${action.field} = ${action.value}`);
    } catch (error) {
      logger.error('Erro ao atualizar pedido:', error);
    }
  }

  /**
   * Atualiza estoque
   */
  async updateStock(action, eventData) {
    try {
      if (action.operation === 'decrease' && eventData.items) {
        for (const item of eventData.items) {
          await this.db.execute(
            'UPDATE products SET estoque = estoque - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
        logger.info(`📦 Estoque atualizado para pedido ${eventData.order_id}`);
      }
    } catch (error) {
      logger.error('Erro ao atualizar estoque:', error);
    }
  }

  /**
   * Aplica desconto
   */
  async applyDiscount(action, eventData) {
    try {
      const discountValue = action.type === 'percentage'
        ? (eventData.total * action.value / 100)
        : action.value;

      await this.db.execute(
        'UPDATE orders SET discount = discount + ?, total = total - ? WHERE id = ?',
        [discountValue, discountValue, eventData.order_id]
      );

      logger.info(`💰 Desconto aplicado: R$ ${discountValue.toFixed(2)}`);
    } catch (error) {
      logger.error('Erro ao aplicar desconto:', error);
    }
  }

  /**
   * Atribui pedido a usuário
   */
  async assignToUser(action, eventData) {
    try {
      await this.db.execute(
        'UPDATE orders SET assigned_to = ? WHERE id = ?',
        [action.user_id, eventData.order_id]
      );
      logger.info(`👤 Pedido atribuído a usuário ${action.user_id}`);
    } catch (error) {
      logger.error('Erro ao atribuir pedido:', error);
    }
  }

  /**
   * Cria tarefa
   */
  async createTask(action, eventData) {
    try {
      const taskId = uuidv4();
      await this.db.execute(`
        INSERT INTO tasks (
          id, order_id, title, description, assigned_to, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())
      `, [
        taskId,
        eventData.order_id,
        action.title || 'Tarefa Automática',
        action.description || '',
        action.assigned_to || null
      ]);
      logger.info(`✅ Tarefa criada: ${action.title}`);
    } catch (error) {
      logger.error('Erro ao criar tarefa:', error);
    }
  }

  /**
   * Adiciona nova regra
   */
  addRule(rule) {
    rule.id = rule.id || uuidv4();
    this.rules.push(rule);
    logger.info(`➕ Nova regra adicionada: ${rule.name}`);
    return rule;
  }

  /**
   * Remove regra
   */
  removeRule(ruleId) {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    logger.info(`➖ Regra removida: ${ruleId}`);
  }

  /**
   * Ativa/desativa regra
   */
  toggleRule(ruleId, enabled) {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info(`🔄 Regra ${ruleId} ${enabled ? 'ativada' : 'desativada'}`);
    }
  }

  /**
   * Lista todas as regras
   */
  getRules() {
    return this.rules;
  }

  /**
   * Obtém regra por ID
   */
  getRule(ruleId) {
    return this.rules.find(r => r.id === ruleId);
  }
}

module.exports = OrderAutomationService;

