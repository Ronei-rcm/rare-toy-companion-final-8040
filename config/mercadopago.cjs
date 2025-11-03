/**
 * Configuração e integração com Mercado Pago
 */

const mercadopago = require('mercadopago');
const logger = require('./logger.cjs');

// Configurar Mercado Pago com token de acesso
const initializeMercadoPago = () => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (!accessToken) {
    logger.warn('MERCADOPAGO_ACCESS_TOKEN não configurado. Funcionalidade de pagamento limitada.');
    return false;
  }

  try {
    mercadopago.configure({
      access_token: accessToken,
    });

    logger.info('Mercado Pago inicializado com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao inicializar Mercado Pago', { error: error.message });
    return false;
  }
};

/**
 * Criar preferência de pagamento
 */
async function createPaymentPreference(orderData) {
  try {
    const {
      items,
      payer,
      back_urls,
      auto_return = 'approved',
      external_reference,
      notification_url,
    } = orderData;

    const preference = {
      items: items.map(item => ({
        title: item.title || item.nome,
        unit_price: Number(item.unit_price || item.preco),
        quantity: Number(item.quantity || item.quantidade || 1),
        currency_id: 'BRL',
        description: item.description || item.descricao || '',
      })),
      payer: {
        name: payer?.name,
        surname: payer?.surname,
        email: payer?.email,
        phone: payer?.phone ? {
          area_code: payer.phone.area_code || '',
          number: payer.phone.number || '',
        } : undefined,
        address: payer?.address ? {
          zip_code: payer.address.zip_code || payer.address.cep,
          street_name: payer.address.street_name || payer.address.endereco,
          street_number: payer.address.street_number || '',
        } : undefined,
      },
      back_urls: back_urls || {
        success: `${process.env.FRONTEND_URL || 'http://localhost:8040'}/checkout/success`,
        failure: `${process.env.FRONTEND_URL || 'http://localhost:8040'}/checkout/failure`,
        pending: `${process.env.FRONTEND_URL || 'http://localhost:8040'}/checkout/pending`,
      },
      auto_return,
      external_reference: external_reference || `order-${Date.now()}`,
      notification_url: notification_url || `${process.env.API_URL || 'http://localhost:3001'}/api/payments/mercadopago/webhook`,
      statement_descriptor: 'MUHLSTORE',
      payment_methods: {
        excluded_payment_types: [],
        installments: 12, // Permitir até 12 parcelas
      },
    };

    const response = await mercadopago.preferences.create(preference);
    
    logger.info('Preferência de pagamento criada', {
      preference_id: response.body.id,
      init_point: response.body.init_point,
    });

    return {
      success: true,
      preference_id: response.body.id,
      init_point: response.body.init_point, // URL para redirecionar o usuário
      sandbox_init_point: response.body.sandbox_init_point,
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
 * Obter informações de pagamento
 */
async function getPaymentInfo(paymentId) {
  try {
    const payment = await mercadopago.payment.get(paymentId);
    
    return {
      success: true,
      payment: {
        id: payment.body.id,
        status: payment.body.status,
        status_detail: payment.body.status_detail,
        transaction_amount: payment.body.transaction_amount,
        currency_id: payment.body.currency_id,
        date_approved: payment.body.date_approved,
        date_created: payment.body.date_created,
        payer: payment.body.payer,
        external_reference: payment.body.external_reference,
      },
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
 * Processar notificação de webhook
 */
async function processWebhookNotification(notificationData) {
  try {
    const { type, data } = notificationData;

    // Tipo de notificação: payment, plan, subscription, etc
    if (type === 'payment') {
      const paymentId = data.id;
      const paymentInfo = await getPaymentInfo(paymentId);

      if (paymentInfo.success) {
        logger.info('Webhook processado', {
          payment_id: paymentId,
          status: paymentInfo.payment.status,
          external_reference: paymentInfo.payment.external_reference,
        });

        return {
          success: true,
          payment: paymentInfo.payment,
          action_needed: paymentInfo.payment.status === 'approved' ? 'confirm_order' : 'update_status',
        };
      }
    }

    return {
      success: false,
      error: 'Tipo de notificação não suportado',
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
 * Criar pagamento PIX
 */
async function createPixPayment(orderData) {
  try {
    const {
      transaction_amount,
      description,
      payer,
      external_reference,
    } = orderData;

    const payment = {
      transaction_amount: Number(transaction_amount),
      description: description || 'Pedido MuhlStore',
      payment_method_id: 'pix',
      payer: {
        email: payer.email,
        first_name: payer.first_name || payer.nome,
        last_name: payer.last_name || '',
        identification: payer.identification ? {
          type: payer.identification.type || 'CPF',
          number: payer.identification.number,
        } : undefined,
      },
      external_reference: external_reference || `order-${Date.now()}`,
      notification_url: `${process.env.API_URL || 'http://localhost:3001'}/api/payments/mercadopago/webhook`,
    };

    const response = await mercadopago.payment.create(payment);

    logger.info('Pagamento PIX criado', {
      payment_id: response.body.id,
      status: response.body.status,
    });

    return {
      success: true,
      payment_id: response.body.id,
      status: response.body.status,
      qr_code: response.body.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: response.body.point_of_interaction?.transaction_data?.ticket_url,
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
  initializeMercadoPago,
  createPaymentPreference,
  getPaymentInfo,
  processWebhookNotification,
  createPixPayment,
};
