// Sistema de Push Notifications
// Usando web-push library

const webpush = require('web-push');
const logger = require('./logger.cjs');

// VAPID keys (gerar com: npx web-push generate-vapid-keys)
// IMPORTANTE: Armazenar em variáveis de ambiente em produção!
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@muhlstore.com.br';

let isInitialized = false;

function initializePushNotifications() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('⚠️  VAPID keys não configuradas. Push notifications desabilitadas.');
    console.warn('💡 Execute: npx web-push generate-vapid-keys');
    return false;
  }

  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    isInitialized = true;
    console.log('✅ Push Notifications inicializadas');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar push notifications:', error);
    return false;
  }
}

async function sendNotification(subscription, payload) {
  if (!isInitialized) {
    console.warn('Push notifications não inicializadas');
    return { success: false, error: 'not_initialized' };
  }

  try {
    const options = {
      TTL: 86400, // 24 horas
      urgency: 'normal',
    };

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      options
    );

    logger.info('Push notification enviada', { 
      endpoint: subscription.endpoint.substring(0, 50) + '...' 
    });

    return { success: true };
  } catch (error) {
    logger.error('Erro ao enviar push notification:', error);

    // Se subscription expirou, remover do banco
    if (error.statusCode === 410) {
      return { success: false, error: 'subscription_expired', shouldDelete: true };
    }

    return { success: false, error: error.message };
  }
}

async function sendToMultiple(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendNotification(sub, payload))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  logger.info('Push notifications enviadas em massa', {
    total: subscriptions.length,
    successful,
    failed,
  });

  return { total: subscriptions.length, successful, failed };
}

// Templates de notificações
const NotificationTemplates = {
  // Carrinho abandonado
  cartAbandoned: (customerName, cartValue) => ({
    title: `${customerName}, seu carrinho está esperando! 🛒`,
    body: `Você tem R$ ${cartValue.toFixed(2)} em produtos. Finalize agora e ganhe 10% OFF!`,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {
      url: '/carrinho',
      type: 'cart_abandoned',
      action: 'view_cart',
    },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Ver Carrinho', icon: '/icon-96x96.png' },
      { action: 'dismiss', title: 'Depois', icon: '/icon-96x96.png' },
    ],
  }),

  // Produto em promoção
  productOnSale: (productName, discount) => ({
    title: `${discount}% OFF em ${productName}! 🎉`,
    body: 'Oferta relâmpago! Corre que está acabando.',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {
      url: '/destaques',
      type: 'product_sale',
    },
    vibrate: [200, 100, 200, 100, 200],
  }),

  // Pedido atualizado
  orderUpdate: (orderId, status) => {
    const statusMessages = {
      processing: 'Seu pedido está sendo preparado! 📦',
      shipped: 'Seu pedido saiu para entrega! 🚚',
      delivered: 'Seu pedido foi entregue! ✅',
    };

    return {
      title: statusMessages[status] || 'Atualização do pedido',
      body: `Pedido #${orderId} - ${status}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: {
        url: `/minha-conta/pedido/${orderId}`,
        type: 'order_update',
        orderId,
      },
      vibrate: [200, 100, 200],
    };
  },

  // Produto voltou ao estoque
  backInStock: (productName) => ({
    title: `${productName} voltou! 🎊`,
    body: 'O produto da sua wishlist está disponível novamente.',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {
      url: '/loja',
      type: 'back_in_stock',
    },
    vibrate: [200, 100, 200],
  }),

  // Promoção personalizada
  personalizedOffer: (discount, minPurchase) => ({
    title: `Cupom de ${discount}% OFF só para você! 🎁`,
    body: `Em compras acima de R$ ${minPurchase.toFixed(2)}. Aproveite!`,
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    data: {
      url: '/loja',
      type: 'personalized_offer',
    },
    vibrate: [200, 100, 200, 100, 200],
  }),
};

function getPublicKey() {
  return VAPID_PUBLIC_KEY;
}

function isAvailable() {
  return isInitialized;
}

module.exports = {
  initializePushNotifications,
  sendNotification,
  sendToMultiple,
  NotificationTemplates,
  getPublicKey,
  isAvailable,
};

