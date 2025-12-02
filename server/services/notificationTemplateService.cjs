/**
 * Serviço de Templates de Notificações
 * Gerencia templates de email e notificações para pedidos
 */

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

class NotificationTemplateService {
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Inicializa templates padrão
   */
  initializeTemplates() {
    // Template: Pedido Confirmado
    this.templates.set('order_confirmed', {
      subject: 'Pedido Confirmado - MuhlStore',
      html: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f97316; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Pedido Confirmado!</h1>
            </div>
            <div class="content">
              <p>Olá ${data.customer_name || 'Cliente'},</p>
              <p>Seu pedido <strong>#${data.order_id.substring(0, 8)}</strong> foi confirmado e está sendo preparado!</p>
              
              <div class="order-info">
                <h3>Detalhes do Pedido</h3>
                <p><strong>Número do Pedido:</strong> ${data.order_id}</p>
                <p><strong>Valor Total:</strong> R$ ${data.total?.toFixed(2) || '0.00'}</p>
                <p><strong>Status:</strong> Confirmado</p>
              </div>

              <p>Você receberá uma notificação quando seu pedido for enviado.</p>
              
              <a href="${data.tracking_url || '#'}" class="button">Acompanhar Pedido</a>
            </div>
            <div class="footer">
              <p>MuhlStore - Sua loja de brinquedos raros</p>
              <p>Este é um email automático, por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: (data) => `
        Pedido Confirmado - MuhlStore
        
        Olá ${data.customer_name || 'Cliente'},
        
        Seu pedido #${data.order_id.substring(0, 8)} foi confirmado e está sendo preparado!
        
        Detalhes:
        - Número: ${data.order_id}
        - Valor Total: R$ ${data.total?.toFixed(2) || '0.00'}
        - Status: Confirmado
        
        Acompanhe seu pedido: ${data.tracking_url || '#'}
      `
    });

    // Template: Pedido Enviado
    this.templates.set('order_shipped', {
      subject: 'Pedido Enviado - MuhlStore',
      html: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .tracking-box { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #10b981; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚚 Pedido Enviado!</h1>
            </div>
            <div class="content">
              <p>Olá ${data.customer_name || 'Cliente'},</p>
              <p>Ótimas notícias! Seu pedido <strong>#${data.order_id.substring(0, 8)}</strong> foi enviado!</p>
              
              ${data.tracking_code ? `
              <div class="tracking-box">
                <h3>📦 Código de Rastreamento</h3>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${data.tracking_code}</p>
                <p>Transportadora: ${data.carrier || 'A definir'}</p>
              </div>
              ` : ''}

              <p>Você pode acompanhar seu pedido usando o código de rastreamento acima.</p>
              
              <a href="${data.tracking_url || '#'}" class="button">Rastrear Pedido</a>
            </div>
            <div class="footer">
              <p>MuhlStore - Sua loja de brinquedos raros</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: (data) => `
        Pedido Enviado - MuhlStore
        
        Olá ${data.customer_name || 'Cliente'},
        
        Seu pedido #${data.order_id.substring(0, 8)} foi enviado!
        
        ${data.tracking_code ? `Código de Rastreamento: ${data.tracking_code}` : ''}
        
        Acompanhe seu pedido: ${data.tracking_url || '#'}
      `
    });

    // Template: Pedido Entregue
    this.templates.set('order_delivered', {
      subject: 'Pedido Entregue - MuhlStore',
      html: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Pedido Entregue!</h1>
            </div>
            <div class="content">
              <p>Olá ${data.customer_name || 'Cliente'},</p>
              <p>Seu pedido <strong>#${data.order_id.substring(0, 8)}</strong> foi entregue com sucesso!</p>
              
              <p>Esperamos que você tenha gostado da sua compra. Sua opinião é muito importante para nós!</p>
              
              <a href="${data.review_url || '#'}" class="button">Avaliar Produto</a>
            </div>
            <div class="footer">
              <p>MuhlStore - Sua loja de brinquedos raros</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: (data) => `
        Pedido Entregue - MuhlStore
        
        Olá ${data.customer_name || 'Cliente'},
        
        Seu pedido #${data.order_id.substring(0, 8)} foi entregue!
        
        Avalie sua compra: ${data.review_url || '#'}
      `
    });

    // Template: Pedido Cancelado Automaticamente
    this.templates.set('order_auto_cancelled', {
      subject: 'Pedido Cancelado - MuhlStore',
      html: (data) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Pedido Cancelado</h1>
            </div>
            <div class="content">
              <p>Olá ${data.customer_name || 'Cliente'},</p>
              <p>Infelizmente, seu pedido <strong>#${data.order_id.substring(0, 8)}</strong> foi cancelado automaticamente por falta de pagamento ou confirmação.</p>
              
              <p>Se você ainda deseja realizar esta compra, entre em contato conosco ou faça um novo pedido.</p>
            </div>
            <div class="footer">
              <p>MuhlStore - Sua loja de brinquedos raros</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: (data) => `
        Pedido Cancelado - MuhlStore
        
        Olá ${data.customer_name || 'Cliente'},
        
        Seu pedido #${data.order_id.substring(0, 8)} foi cancelado automaticamente.
        
        Entre em contato conosco se desejar realizar esta compra.
      `
    });

    logger.info(`✅ ${this.templates.size} templates de notificação inicializados`);
  }

  /**
   * Obtém template por nome
   */
  getTemplate(templateName) {
    return this.templates.get(templateName);
  }

  /**
   * Renderiza template com dados
   */
  renderTemplate(templateName, data, format = 'html') {
    const template = this.getTemplate(templateName);
    if (!template) {
      logger.warn(`Template não encontrado: ${templateName}`);
      return null;
    }

    const renderer = format === 'html' ? template.html : template.text;
    return {
      subject: template.subject,
      body: renderer(data)
    };
  }

  /**
   * Adiciona novo template
   */
  addTemplate(name, template) {
    this.templates.set(name, template);
    logger.info(`➕ Novo template adicionado: ${name}`);
  }

  /**
   * Lista todos os templates
   */
  listTemplates() {
    return Array.from(this.templates.keys());
  }
}

module.exports = NotificationTemplateService;

