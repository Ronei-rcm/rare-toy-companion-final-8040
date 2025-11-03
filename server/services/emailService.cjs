const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Configuração para Gmail (pode ser alterada para outros provedores)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'seu-email@gmail.com',
          pass: process.env.EMAIL_PASS || 'sua-senha-app'
        }
      });

      // Verificar conexão
      await this.transporter.verify();
      console.log('✅ Email Service: Conectado com sucesso');
    } catch (error) {
      console.error('❌ Email Service: Erro na configuração:', error.message);
      // Fallback para modo de desenvolvimento
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'verysecret'
        }
      });
    }
  }

  async loadTemplate(templateName) {
    try {
      if (this.templates.has(templateName)) {
        return this.templates.get(templateName);
      }

      const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      
      this.templates.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`❌ Erro ao carregar template ${templateName}:`, error.message);
      return null;
    }
  }

  async sendEmail({ to, subject, template, data = {} }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter não inicializado');
      }

      const templateCompiled = await this.loadTemplate(template);
      if (!templateCompiled) {
        throw new Error(`Template ${template} não encontrado`);
      }

      const html = templateCompiled(data);

      const mailOptions = {
        from: `"MuhlStore" <${process.env.EMAIL_USER || 'noreply@muhlstore.com'}>`,
        to,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ E-mail enviado para ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        to,
        subject
      };
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error.message);
      return {
        success: false,
        error: error.message,
        to,
        subject
      };
    }
  }

  // Newsletter automática
  async sendNewsletter({ to, customerName, products = [], offers = [] }) {
    return await this.sendEmail({
      to,
      subject: '🎉 Novidades e Ofertas Especiais - MuhlStore',
      template: 'newsletter',
      data: {
        customerName,
        products,
        offers,
        currentDate: new Date().toLocaleDateString('pt-BR'),
        unsubscribeLink: `${process.env.FRONTEND_URL}/unsubscribe?email=${encodeURIComponent(to)}`
      }
    });
  }

  // Recuperação de carrinho abandonado
  async sendCartRecovery({ to, customerName, cartItems = [], totalValue, discountCode }) {
    return await this.sendEmail({
      to,
      subject: '🛒 Você esqueceu itens no seu carrinho!',
      template: 'cart-recovery',
      data: {
        customerName,
        cartItems,
        totalValue,
        discountCode,
        cartLink: `${process.env.FRONTEND_URL}/carrinho`,
        currentDate: new Date().toLocaleDateString('pt-BR')
      }
    });
  }

  // Confirmação de pedido
  async sendOrderConfirmation({ to, customerName, order, trackingCode }) {
    return await this.sendEmail({
      to,
      subject: `📦 Pedido Confirmado #${order.id}`,
      template: 'order-confirmation',
      data: {
        customerName,
        order,
        trackingCode,
        orderLink: `${process.env.FRONTEND_URL}/pedido/${order.id}`,
        currentDate: new Date().toLocaleDateString('pt-BR')
      }
    });
  }

  // Status de entrega
  async sendDeliveryUpdate({ to, customerName, order, status, trackingCode }) {
    return await this.sendEmail({
      to,
      subject: `🚚 Atualização de Entrega - Pedido #${order.id}`,
      template: 'delivery-update',
      data: {
        customerName,
        order,
        status,
        trackingCode,
        orderLink: `${process.env.FRONTEND_URL}/pedido/${order.id}`,
        currentDate: new Date().toLocaleDateString('pt-BR')
      }
    });
  }

  // E-mail de boas-vindas
  async sendWelcomeEmail({ to, customerName }) {
    return await this.sendEmail({
      to,
      subject: '🎉 Bem-vindo à MuhlStore!',
      template: 'welcome',
      data: {
        customerName,
        currentDate: new Date().toLocaleDateString('pt-BR'),
        shopLink: `${process.env.FRONTEND_URL}/loja`
      }
    });
  }

  // E-mail de promoção
  async sendPromotionEmail({ to, customerName, promotion, products = [] }) {
    return await this.sendEmail({
      to,
      subject: `🎟️ ${promotion.title} - Aproveite!`,
      template: 'promotion',
      data: {
        customerName,
        promotion,
        products,
        currentDate: new Date().toLocaleDateString('pt-BR'),
        shopLink: `${process.env.FRONTEND_URL}/loja`
      }
    });
  }
}

module.exports = new EmailService();
