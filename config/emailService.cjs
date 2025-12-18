/**
 * Serviço de E-mail com Nodemailer
 * Sistema de recuperação de carrinho abandonado e outras notificações
 */

const nodemailer = require('nodemailer');
const logger = require('./logger.cjs');

// Configurar transporter
let transporter = null;

const initializeEmailService = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!config.auth.user || !config.auth.pass) {
    logger.warn('SMTP não configurado. E-mails não serão enviados.');
    return false;
  }

  try {
    transporter = nodemailer.createTransport(config);
    logger.info('Serviço de e-mail inicializado');
    return true;
  } catch (error) {
    logger.error('Erro ao inicializar serviço de e-mail', { error: error.message });
    return false;
  }
};

/**
 * Verificar se o serviço de e-mail está disponível
 */
const isEmailServiceAvailable = async () => {
  if (!transporter) return false;
  
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error('Serviço de e-mail indisponível', { error: error.message });
    return false;
  }
};

/**
 * Template HTML para e-mail de carrinho abandonado (1 hora)
 */
const getAbandonedCartEmailTemplate1h = (customerName, cartItems, cartTotal, recoveryLink) => {
  const itemsHtml = cartItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br/>
        <span style="color: #666;">Quantidade: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>R$ ${item.price.toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">😊 Esqueceu algo?</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá ${customerName},</p>
        
        <p>Percebemos que você deixou alguns itens incríveis no carrinho! 🎁</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #667eea;">Seu Carrinho:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 15px 10px; text-align: right;"><strong style="color: #667eea; font-size: 18px;">R$ ${cartTotal.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: white; margin: 0; font-weight: bold;">🎉 OFERTA ESPECIAL: 5% OFF com PIX!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            Finalizar Compra Agora
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          ⏰ Este carrinho expira em 7 dias
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          MuhlStore - Sua loja de brinquedos raros<br/>
          © ${new Date().getFullYear()} Todos os direitos reservados
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template para e-mail de carrinho abandonado (24 horas) - Mais urgente
 */
const getAbandonedCartEmailTemplate24h = (customerName, cartItems, cartTotal, recoveryLink) => {
  const itemsHtml = cartItems.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.name}</strong><br/>
        <span style="color: #666;">Qtd: ${item.quantity}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>R$ ${item.price.toFixed(2)}</strong>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⏰ Última Chance!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá ${customerName},</p>
        
        <p><strong>Seus itens ainda estão esperando por você!</strong> 😍</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>⚠️ ATENÇÃO:</strong> Alguns produtos podem acabar o estoque em breve!
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
            <tr>
              <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 15px 10px; text-align: right;"><strong style="color: #f5576c; font-size: 18px;">R$ ${cartTotal.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>
        
        <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: #333; margin: 0; font-weight: bold; font-size: 18px;">🔥 CUPOM EXCLUSIVO: 10% OFF</p>
          <p style="color: #333; margin: 10px 0 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">VOLTA10</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryLink}" style="background: #f5576c; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
            🛒 Resgatar Meu Carrinho
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          ⏰ Cupom válido por 48 horas
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          MuhlStore - Brinquedos Raros<br/>
          © ${new Date().getFullYear()} Todos os direitos reservados
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Enviar e-mail de carrinho abandonado
 */
async function sendAbandonedCartEmail(emailData) {
  if (!transporter) {
    logger.warn('Transporter não inicializado. E-mail não enviado.');
    return { success: false, error: 'E-mail service not configured' };
  }

  try {
    const { email, customerName, cartItems, cartTotal, recoveryLink, stage = '1h' } = emailData;

    const template = stage === '24h' 
      ? getAbandonedCartEmailTemplate24h(customerName, cartItems, cartTotal, recoveryLink)
      : getAbandonedCartEmailTemplate1h(customerName, cartItems, cartTotal, recoveryLink);

    const subject = stage === '24h'
      ? `⏰ Última Chance! Seu carrinho + Cupom de 10% OFF`
      : `😊 Você esqueceu algo no carrinho - MuhlStore`;

    const mailOptions = {
      from: `"MuhlStore" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: template,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('E-mail de carrinho abandonado enviado', {
      email,
      stage,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.logError(error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enviar e-mail de confirmação de pedido
 */
async function sendOrderConfirmationEmail(orderData) {
  if (!transporter) {
    return { success: false, error: 'E-mail service not configured' };
  }

  try {
    const { email, customerName, orderId, orderTotal, items } = orderData;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.name} (x${item.quantity})
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          R$ ${item.price.toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>✅ Pedido Confirmado!</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Olá ${customerName},</p>
          <p>Seu pedido <strong>#${orderId}</strong> foi confirmado com sucesso!</p>
          
          <table style="width: 100%; margin: 20px 0;">
            ${itemsHtml}
            <tr>
              <td style="padding: 15px 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 15px 10px; text-align: right;"><strong>R$ ${orderTotal.toFixed(2)}</strong></td>
            </tr>
          </table>
          
          <p>Você receberá atualizações sobre o envio em breve.</p>
          
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            MuhlStore © ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"MuhlStore" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `✅ Pedido #${orderId} Confirmado - MuhlStore`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('E-mail de confirmação de pedido enviado', {
      email,
      orderId,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.logError(error);
    return { success: false, error: error.message };
  }
}

/**
 * Template para e-mail de notificação de recorrência próxima
 */
const getRecurringTransactionNotificationTemplate = (transaction) => {
  const tipoLabel = transaction.tipo === 'entrada' ? 'Recebimento' : 'Pagamento';
  const tipoColor = transaction.tipo === 'entrada' ? '#4CAF50' : '#f5576c';
  const tipoIcon = transaction.tipo === 'entrada' ? '💰' : '💸';
  const frequencyLabel = {
    daily: 'Diária',
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    yearly: 'Anual'
  }[transaction.frequency] || transaction.frequency;

  const date = new Date(transaction.next_occurrence);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${tipoColor} 0%, ${tipoColor}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${tipoIcon} Lembrete: ${tipoLabel} Próximo</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá,</p>
        
        <p>Este é um lembrete sobre sua transação recorrente:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${tipoColor};">
          <h2 style="margin-top: 0; color: ${tipoColor};">${transaction.descricao}</h2>
          
          <table style="width: 100%; margin: 15px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Categoria:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${transaction.categoria}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Valor:</strong></td>
              <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: bold; color: ${tipoColor};">
                R$ ${parseFloat(transaction.valor).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Frequência:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${frequencyLabel}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Método de Pagamento:</strong></td>
              <td style="padding: 8px 0; text-align: right;">${transaction.metodo_pagamento || 'Não informado'}</td>
            </tr>
          </table>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px;">
            <strong>⏰ Data do Próximo ${tipoLabel}:</strong><br/>
            <span style="font-size: 18px; font-weight: bold;">${formattedDate}</span>
          </div>
        </div>
        
        ${transaction.observacoes ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>📝 Observações:</strong><br/>
            ${transaction.observacoes}
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">
            Esta é uma transação recorrente configurada no sistema financeiro.
            ${transaction.auto_create ? 'Será processada automaticamente na data indicada.' : 'Requer processamento manual.'}
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          MuhlStore - Sistema Financeiro<br/>
          © ${new Date().getFullYear()} Todos os direitos reservados
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Enviar e-mail de notificação de recorrência próxima
 */
async function sendRecurringTransactionNotification(transactionData) {
  if (!transporter) {
    logger.warn('Transporter não inicializado. E-mail não enviado.');
    return { success: false, error: 'E-mail service not configured' };
  }

  try {
    const { transaction, daysUntil } = transactionData;
    
    if (!transaction.notify_email) {
      return { success: false, error: 'E-mail não configurado para esta transação' };
    }

    const template = getRecurringTransactionNotificationTemplate(transaction);
    
    const subject = transaction.tipo === 'entrada'
      ? `💰 Lembrete: Recebimento de R$ ${parseFloat(transaction.valor).toFixed(2)} em ${daysUntil} dia(s)`
      : `💸 Lembrete: Pagamento de R$ ${parseFloat(transaction.valor).toFixed(2)} em ${daysUntil} dia(s)`;

    const mailOptions = {
      from: `"MuhlStore Financeiro" <${process.env.SMTP_USER}>`,
      to: transaction.notify_email,
      subject,
      html: template,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('E-mail de notificação de recorrência enviado', {
      email: transaction.notify_email,
      transaction_id: transaction.id,
      daysUntil,
      messageId: info.messageId,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.logError(error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  initializeEmailService,
  isEmailServiceAvailable,
  sendAbandonedCartEmail,
  sendOrderConfirmationEmail,
  sendRecurringTransactionNotification,
};
