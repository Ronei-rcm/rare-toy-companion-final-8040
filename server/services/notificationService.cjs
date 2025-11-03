const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const emailService = require('./emailService.cjs');
const logger = require('../../config/logger.cjs');

class NotificationService {
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
      console.log('✅ Notification Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Notification Service: Erro na inicialização:', error.message);
    }
  }

  // Criar notificação
  async createNotification(notificationData) {
    try {
      const id = uuidv4();
      const {
        user_id,
        title,
        message,
        type = 'info',
        channel = 'push',
        scheduled_at = null,
        metadata = null
      } = notificationData;

      const [result] = await this.db.execute(`
        INSERT INTO notifications (
          id, user_id, title, message, type, channel, scheduled_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, user_id, title, message, type, channel, scheduled_at, JSON.stringify(metadata)]);

      // Enviar imediatamente se não agendada
      if (!scheduled_at) {
        await this.sendNotification(id);
      }

      return {
        success: true,
        data: { id, ...notificationData }
      };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificação
  async sendNotification(notificationId) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM notifications WHERE id = ? AND status = 'pending'
      `, [notificationId]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Notificação não encontrada ou já enviada'
        };
      }

      const notification = rows[0];
      let sent = false;

      // Verificar preferências do usuário
      if (notification.user_id) {
        const [prefs] = await this.db.execute(`
          SELECT * FROM notification_preferences WHERE user_id = ?
        `, [notification.user_id]);

        if (prefs.length > 0) {
          const prefs = prefs[0];
          const channelEnabled = {
            push: prefs.push_notifications,
            email: prefs.email_notifications,
            whatsapp: prefs.whatsapp_notifications,
            sms: prefs.sms_notifications
          };

          if (!channelEnabled[notification.channel]) {
            await this.updateNotificationStatus(notificationId, 'failed', 'Canal desabilitado pelo usuário');
            return {
              success: false,
              error: 'Canal de notificação desabilitado pelo usuário'
            };
          }
        }
      }

      // Enviar baseado no canal
      switch (notification.channel) {
        case 'email':
          sent = await this.sendEmailNotification(notification);
          break;
        case 'whatsapp':
          sent = await this.sendWhatsAppNotification(notification);
          break;
        case 'push':
          sent = await this.sendPushNotification(notification);
          break;
        case 'sms':
          sent = await this.sendSMSNotification(notification);
          break;
        case 'in_app':
          sent = await this.sendInAppNotification(notification);
          break;
        default:
          sent = false;
      }

      if (sent) {
        await this.updateNotificationStatus(notificationId, 'sent');
        return {
          success: true,
          message: 'Notificação enviada com sucesso'
        };
      } else {
        await this.updateNotificationStatus(notificationId, 'failed', 'Erro no envio');
        return {
          success: false,
          error: 'Erro ao enviar notificação'
        };
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      await this.updateNotificationStatus(notificationId, 'failed', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificação por email
  async sendEmailNotification(notification) {
    try {
      const result = await emailService.sendEmail({
        to: notification.metadata?.email || 'user@example.com',
        subject: notification.title,
        template: 'notification',
        data: {
          title: notification.title,
          message: notification.message,
          type: notification.type
        }
      });

      return result.success;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  // Enviar notificação por WhatsApp
  async sendWhatsAppNotification(notification) {
    try {
      // Integração com WhatsApp Business API
      const phone = notification.metadata?.phone;
      if (!phone) {
        console.error('Número de telefone não fornecido para WhatsApp');
        return false;
      }

      // Aqui você integraria com a API do WhatsApp Business
      // Por enquanto, vamos simular o envio
      console.log(`📱 WhatsApp enviado para ${phone}: ${notification.title} - ${notification.message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return false;
    }
  }

  // Enviar notificação push
  async sendPushNotification(notification) {
    try {
      // Aqui você integraria com Firebase Cloud Messaging (FCM)
      // Por enquanto, vamos simular o envio
      console.log(`🔔 Push enviado: ${notification.title} - ${notification.message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      return false;
    }
  }

  // Enviar notificação por SMS
  async sendSMSNotification(notification) {
    try {
      // Aqui você integraria com um provedor de SMS
      // Por enquanto, vamos simular o envio
      console.log(`📱 SMS enviado: ${notification.title} - ${notification.message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return false;
    }
  }

  // Enviar notificação in-app
  async sendInAppNotification(notification) {
    try {
      // Notificação in-app é armazenada no banco e enviada via WebSocket
      console.log(`💬 In-app enviada: ${notification.title} - ${notification.message}`);
      
      // Aqui você emitiria via Socket.IO
      // io.to(notification.user_id).emit('notification', notification);
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar in-app:', error);
      return false;
    }
  }

  // Atualizar status da notificação
  async updateNotificationStatus(notificationId, status, errorMessage = null) {
    try {
      const updateData = { status };
      
      if (status === 'sent') {
        updateData.sent_at = new Date();
      } else if (status === 'read') {
        updateData.read_at = new Date();
      }

      if (errorMessage) {
        updateData.metadata = JSON.stringify({ error: errorMessage });
      }

      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(notificationId);

      await this.db.execute(`
        UPDATE notifications SET ${fields} WHERE id = ?
      `, values);

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar status da notificação:', error);
      return { success: false, error: error.message };
    }
  }

  // Listar notificações do usuário
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar notificações do usuário:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId, userId) {
    try {
      await this.db.execute(`
        UPDATE notifications 
        SET status = 'read', read_at = NOW() 
        WHERE id = ? AND user_id = ?
      `, [notificationId, userId]);

      return { success: true };
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return { success: false, error: error.message };
    }
  }

  // Criar template de notificação
  async createTemplate(templateData) {
    try {
      const id = uuidv4();
      const {
        name,
        type,
        channel,
        subject,
        title,
        message,
        variables = null
      } = templateData;

      const [result] = await this.db.execute(`
        INSERT INTO notification_templates (
          id, name, type, channel, subject, title, message, variables
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, name, type, channel, subject, title, message, JSON.stringify(variables)]);

      return {
        success: true,
        data: { id, ...templateData }
      };
    } catch (error) {
      console.error('Erro ao criar template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar notificação usando template
  async sendTemplateNotification(templateId, userId, variables = {}) {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM notification_templates WHERE id = ? AND is_active = TRUE
      `, [templateId]);

      if (rows.length === 0) {
        return {
          success: false,
          error: 'Template não encontrado ou inativo'
        };
      }

      const template = rows[0];
      let processedTitle = template.title;
      let processedMessage = template.message;
      let processedSubject = template.subject;

      // Substituir variáveis no template
      if (template.variables) {
        const templateVars = JSON.parse(template.variables);
        Object.keys(templateVars).forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = variables[key] || templateVars[key] || '';
          processedTitle = processedTitle.replace(new RegExp(placeholder, 'g'), value);
          processedMessage = processedMessage.replace(new RegExp(placeholder, 'g'), value);
          if (processedSubject) {
            processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
          }
        });
      }

      // Criar notificação
      const notificationData = {
        user_id: userId,
        title: processedTitle,
        message: processedMessage,
        type: template.type,
        channel: template.channel,
        metadata: {
          template_id: templateId,
          variables,
          subject: processedSubject
        }
      };

      return await this.createNotification(notificationData);
    } catch (error) {
      console.error('Erro ao enviar notificação com template:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Configurar preferências de notificação
  async updateNotificationPreferences(userId, preferences) {
    try {
      const [existing] = await this.db.execute(`
        SELECT id FROM notification_preferences WHERE user_id = ?
      `, [userId]);

      if (existing.length > 0) {
        // Atualizar preferências existentes
        const fields = Object.keys(preferences).map(key => `${key} = ?`).join(', ');
        const values = Object.values(preferences);
        values.push(userId);

        await this.db.execute(`
          UPDATE notification_preferences SET ${fields} WHERE user_id = ?
        `, values);
      } else {
        // Criar novas preferências
        const id = uuidv4();
        await this.db.execute(`
          INSERT INTO notification_preferences (
            id, user_id, push_notifications, email_notifications, 
            whatsapp_notifications, sms_notifications, order_updates, 
            promotions, loyalty_updates, marketing_emails
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, userId,
          preferences.push_notifications || true,
          preferences.email_notifications || true,
          preferences.whatsapp_notifications || true,
          preferences.sms_notifications || false,
          preferences.order_updates || true,
          preferences.promotions || true,
          preferences.loyalty_updates || true,
          preferences.marketing_emails || true
        ]);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter estatísticas de notificações
  async getNotificationStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN channel = 'push' THEN 1 END) as push_count,
          COUNT(CASE WHEN channel = 'email' THEN 1 END) as email_count,
          COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END) as whatsapp_count
        FROM notifications
      `);

      const [channelStats] = await this.db.execute(`
        SELECT 
          channel,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'read' THEN 1 END) as read,
          ROUND(COUNT(CASE WHEN status = 'read' THEN 1 END) * 100.0 / COUNT(*), 2) as read_rate
        FROM notifications 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY channel
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          channelStats
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de notificações:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar notificações agendadas
  async processScheduledNotifications() {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM notifications 
        WHERE scheduled_at <= NOW() AND status = 'pending'
        ORDER BY scheduled_at ASC
        LIMIT 100
      `);

      const results = [];
      for (const notification of rows) {
        const result = await this.sendNotification(notification.id);
        results.push({ id: notification.id, result });
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao processar notificações agendadas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NotificationService();
