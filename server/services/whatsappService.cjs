const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger.cjs');

class WhatsAppService {
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
      console.log('✅ WhatsApp Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ WhatsApp Service: Erro na inicialização:', error.message);
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(phone, message) {
    try {
      // Aqui você integraria com a API do WhatsApp Business
      // Por enquanto, vamos simular o envio
      console.log(`📱 WhatsApp enviado para ${phone}: ${message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        messageId: uuidv4(),
        status: 'sent'
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem com template
  async sendTemplateMessage(phone, templateName, variables = {}) {
    try {
      const templates = {
        'welcome': {
          name: 'welcome',
          language: 'pt_BR',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: variables.customerName || 'Cliente' }
              ]
            }
          ]
        },
        'order_confirmation': {
          name: 'order_confirmation',
          language: 'pt_BR',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: variables.orderNumber || 'N/A' },
                { type: 'text', text: variables.totalAmount || 'R$ 0,00' }
              ]
            }
          ]
        },
        'order_shipped': {
          name: 'order_shipped',
          language: 'pt_BR',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: variables.orderNumber || 'N/A' },
                { type: 'text', text: variables.trackingCode || 'N/A' }
              ]
            }
          ]
        },
        'cart_abandoned': {
          name: 'cart_abandoned',
          language: 'pt_BR',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: variables.customerName || 'Cliente' },
                { type: 'text', text: variables.cartValue || 'R$ 0,00' }
              ]
            }
          ]
        },
        'promotion': {
          name: 'promotion',
          language: 'pt_BR',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: variables.promotionName || 'Promoção' },
                { type: 'text', text: variables.discountValue || '10%' }
              ]
            }
          ]
        }
      };

      const template = templates[templateName];
      if (!template) {
        return {
          success: false,
          error: 'Template não encontrado'
        };
      }

      console.log(`📱 WhatsApp Template enviado para ${phone}:`, template);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        messageId: uuidv4(),
        status: 'sent',
        template: templateName
      };
    } catch (error) {
      console.error('Erro ao enviar template WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem com mídia
  async sendMediaMessage(phone, mediaUrl, mediaType, caption = '') {
    try {
      const mediaTypes = {
        'image': 'image',
        'video': 'video',
        'document': 'document',
        'audio': 'audio'
      };

      const type = mediaTypes[mediaType] || 'image';
      
      console.log(`📱 WhatsApp Mídia enviada para ${phone}:`, {
        type,
        url: mediaUrl,
        caption
      });
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        messageId: uuidv4(),
        status: 'sent',
        mediaType: type
      };
    } catch (error) {
      console.error('Erro ao enviar mídia WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem interativa (botões)
  async sendInteractiveMessage(phone, message, buttons) {
    try {
      const interactiveMessage = {
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: message
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: `btn_${index}`,
                title: button.title
              }
            }))
          }
        }
      };

      console.log(`📱 WhatsApp Interativo enviado para ${phone}:`, interactiveMessage);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return {
        success: true,
        messageId: uuidv4(),
        status: 'sent',
        interactive: true
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem interativa WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar mensagem de lista
  async sendListMessage(phone, message, sections) {
    try {
      const listMessage = {
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: message
          },
          action: {
            button: 'Ver opções',
            sections: sections
          }
        }
      };

      console.log(`📱 WhatsApp Lista enviada para ${phone}:`, listMessage);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        messageId: uuidv4(),
        status: 'sent',
        list: true
      };
    } catch (error) {
      console.error('Erro ao enviar lista WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar webhook do WhatsApp
  async processWebhook(webhookData) {
    try {
      const { entry } = webhookData;
      
      for (const change of entry) {
        if (change.changes) {
          for (const webhookChange of change.changes) {
            if (webhookChange.value && webhookChange.value.messages) {
              for (const message of webhookChange.value.messages) {
                await this.handleIncomingMessage(message);
              }
            }
          }
        }
      }

      return {
        success: true,
        message: 'Webhook processado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao processar webhook WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar mensagem recebida
  async handleIncomingMessage(message) {
    try {
      const { from, text, type, interactive } = message;
      
      console.log(`📱 Mensagem recebida de ${from}:`, {
        type,
        text: text?.body,
        interactive: interactive?.type
      });

      // Processar diferentes tipos de mensagem
      if (type === 'text') {
        await this.handleTextMessage(from, text.body);
      } else if (type === 'interactive') {
        await this.handleInteractiveMessage(from, interactive);
      } else if (type === 'button') {
        await this.handleButtonMessage(from, interactive);
      }

      return {
        success: true,
        message: 'Mensagem processada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar mensagem de texto
  async handleTextMessage(phone, text) {
    try {
      const lowerText = text.toLowerCase();
      
      // Comandos básicos
      if (lowerText.includes('menu') || lowerText.includes('ajuda')) {
        await this.sendMenuMessage(phone);
      } else if (lowerText.includes('pedido') || lowerText.includes('status')) {
        await this.sendOrderStatusMessage(phone);
      } else if (lowerText.includes('promo') || lowerText.includes('desconto')) {
        await this.sendPromotionMessage(phone);
      } else if (lowerText.includes('contato') || lowerText.includes('suporte')) {
        await this.sendContactMessage(phone);
      } else {
        await this.sendDefaultMessage(phone);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem de texto:', error);
    }
  }

  // Processar mensagem interativa
  async handleInteractiveMessage(phone, interactive) {
    try {
      if (interactive.type === 'button') {
        const buttonId = interactive.button_reply?.id;
        await this.handleButtonClick(phone, buttonId);
      } else if (interactive.type === 'list') {
        const listId = interactive.list_reply?.id;
        await this.handleListSelection(phone, listId);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem interativa:', error);
    }
  }

  // Enviar mensagem de menu
  async sendMenuMessage(phone) {
    const message = `🛍️ *Bem-vindo à MuhlStore!*

Escolha uma opção:`;
    
    const buttons = [
      { title: '🛒 Meus Pedidos' },
      { title: '🎟️ Cupons' },
      { title: '⭐ Fidelidade' },
      { title: '📞 Suporte' }
    ];

    await this.sendInteractiveMessage(phone, message, buttons);
  }

  // Enviar status do pedido
  async sendOrderStatusMessage(phone) {
    const message = `📦 *Status do Pedido*

Para consultar o status do seu pedido, acesse nosso site ou digite o número do pedido.

Exemplo: *Pedido #12345*`;
    
    await this.sendTextMessage(phone, message);
  }

  // Enviar mensagem de promoção
  async sendPromotionMessage(phone) {
    const message = `🎟️ *Promoções Especiais*

Confira nossas ofertas exclusivas:
• 10% OFF em toda a loja
• Frete grátis acima de R$ 100
• Produtos com até 50% de desconto

Acesse: muhlstore.com.br`;
    
    await this.sendTextMessage(phone, message);
  }

  // Enviar mensagem de contato
  async sendContactMessage(phone) {
    const message = `📞 *Contato e Suporte*

🕒 *Horário de Atendimento:*
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h

📧 *Email:* contato@muhlstore.com.br
🌐 *Site:* muhlstore.com.br
📱 *WhatsApp:* (11) 99999-9999`;
    
    await this.sendTextMessage(phone, message);
  }

  // Enviar mensagem padrão
  async sendDefaultMessage(phone) {
    const message = `Olá! 👋

Obrigado por entrar em contato com a MuhlStore!

Para melhor atendimento, digite *menu* para ver as opções disponíveis.

Ou acesse nosso site: muhlstore.com.br`;
    
    await this.sendTextMessage(phone, message);
  }

  // Processar clique em botão
  async handleButtonClick(phone, buttonId) {
    try {
      switch (buttonId) {
        case 'btn_0': // Meus Pedidos
          await this.sendOrderStatusMessage(phone);
          break;
        case 'btn_1': // Cupons
          await this.sendPromotionMessage(phone);
          break;
        case 'btn_2': // Fidelidade
          await this.sendLoyaltyMessage(phone);
          break;
        case 'btn_3': // Suporte
          await this.sendContactMessage(phone);
          break;
        default:
          await this.sendDefaultMessage(phone);
      }
    } catch (error) {
      console.error('Erro ao processar clique em botão:', error);
    }
  }

  // Enviar mensagem de fidelidade
  async sendLoyaltyMessage(phone) {
    const message = `⭐ *Programa de Fidelidade*

🎯 *Como funciona:*
• Ganhe 1 ponto a cada R$ 1 gasto
• 100 pontos = R$ 10 de desconto
• Frete grátis a partir do nível Ouro

🏆 *Seus benefícios:*
• Descontos exclusivos
• Acesso antecipado a promoções
• Atendimento prioritário

Acesse sua conta para ver seus pontos!`;
    
    await this.sendTextMessage(phone, message);
  }

  // Obter estatísticas do WhatsApp
  async getWhatsAppStats() {
    try {
      // Aqui você consultaria a API do WhatsApp para estatísticas reais
      // Por enquanto, vamos retornar dados simulados
      return {
        success: true,
        data: {
          totalMessages: 1250,
          sentMessages: 1100,
          receivedMessages: 150,
          deliveryRate: 98.5,
          readRate: 85.2,
          responseTime: '2.5 min',
          activeUsers: 450
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WhatsAppService();
