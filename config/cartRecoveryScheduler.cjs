/**
 * Agendador de E-mails de Recuperação de Carrinho Abandonado
 * Envia e-mails automaticamente em 1h, 24h e 72h após abandono
 */

const cron = require('node-cron');
const logger = require('./logger.cjs');
const { sendAbandonedCartEmail } = require('./emailService.cjs');

// Pool de conexão MySQL (será passado na inicialização)
let pool = null;

/**
 * Inicializar agendador com pool do MySQL
 */
function initializeScheduler(mysqlPool) {
  pool = mysqlPool;
  
  // Executar a cada hora para verificar carrinhos abandonados
  cron.schedule('0 * * * *', async () => {
    logger.info('Executando verificação de carrinhos abandonados...');
    await checkAbandonedCarts();
  });

  // Executar a cada 6 horas para e-mails de 24h
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Executando verificação de carrinhos abandonados (24h)...');
    await checkAbandonedCarts24h();
  });

  logger.info('Agendador de recuperação de carrinho inicializado');
}

/**
 * Verificar e enviar e-mails para carrinhos abandonados há ~1 hora
 */
async function checkAbandonedCarts() {
  try {
    // Buscar carrinhos abandonados entre 1h e 2h atrás
    // e que ainda não receberam e-mail de 1h
    const [rows] = await pool.execute(`
      SELECT 
        c.id as cart_id,
        c.user_id,
        c.updated_at,
        cu.nome as user_name,
        cu.email as user_email
      FROM carts c
      LEFT JOIN customers cu ON c.user_id = cu.id
      WHERE c.updated_at BETWEEN DATE_SUB(NOW(), INTERVAL 2 HOUR) AND DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);

    logger.info(`Encontrados ${rows.length} carrinhos para e-mail de 1h`);

    for (const cart of rows) {
      await sendRecoveryEmail(cart, '1h');
    }
  } catch (error) {
    logger.logError(error);
  }
}

/**
 * Verificar e enviar e-mails para carrinhos abandonados há ~24 horas
 */
async function checkAbandonedCarts24h() {
  try {
    // Buscar carrinhos abandonados há 24h que receberam e-mail de 1h
    // mas ainda não receberam e-mail de 24h
    const [rows] = await pool.execute(`
      SELECT 
        c.id as cart_id,
        c.user_id,
        c.updated_at,
        cu.nome as user_name,
        cu.email as user_email
      FROM carts c
      LEFT JOIN customers cu ON c.user_id = cu.id
      WHERE c.updated_at BETWEEN DATE_SUB(NOW(), INTERVAL 25 HOUR) AND DATE_SUB(NOW(), INTERVAL 23 HOUR)
    `);

    logger.info(`Encontrados ${rows.length} carrinhos para e-mail de 24h`);

    for (const cart of rows) {
      await sendRecoveryEmail(cart, '24h');
    }
  } catch (error) {
    logger.logError(error);
  }
}

/**
 * Enviar e-mail de recuperação
 */
async function sendRecoveryEmail(cart, stage) {
  try {
    // Buscar itens do carrinho
    const [items] = await pool.execute(`
      SELECT 
        ci.product_id,
        ci.name,
        ci.price,
        ci.quantity,
        ci.image_url
      FROM cart_items ci
      WHERE ci.cart_id = ?
    `, [cart.cart_id]);

    if (items.length === 0) {
      logger.warn(`Carrinho ${cart.cart_id} sem itens`);
      return;
    }

    // Formatar itens para o template
    const cartItems = items.map(item => ({
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image: item.image_url || 'https://via.placeholder.com/150',
    }));

    // Link de recuperação (com token único)
    const recoveryToken = Buffer.from(`${cart.cart_id}-${Date.now()}`).toString('base64');
    const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:8040'}/carrinho?recovery=${recoveryToken}`;

    // Enviar e-mail
    const result = await sendAbandonedCartEmail({
      email: cart.user_email,
      customerName: cart.user_name || 'Cliente',
      cartItems,
      cartTotal: Number(cart.total),
      recoveryLink,
      stage,
    });

    if (result.success) {
      // Marcar como enviado
      const columnToUpdate = stage === '1h' ? 'email_sent_1h' : 'email_sent_24h';
      await pool.execute(`
        UPDATE carts 
        SET ${columnToUpdate} = 1, 
            last_email_sent = NOW()
        WHERE id = ?
      `, [cart.cart_id]);

      logger.info(`E-mail de recuperação (${stage}) enviado`, {
        cart_id: cart.cart_id,
        email: cart.user_email,
      });
    }
  } catch (error) {
    logger.logError(error);
  }
}

/**
 * Marcar carrinho como recuperado (quando o usuário finaliza a compra)
 */
async function markCartAsRecovered(cartId) {
  try {
    await pool.execute(`
      UPDATE carts 
      SET abandoned = 0,
          recovered = 1,
          recovered_at = NOW()
      WHERE id = ?
    `, [cartId]);

    logger.info('Carrinho marcado como recuperado', { cart_id: cartId });
  } catch (error) {
    logger.logError(error);
  }
}

/**
 * Limpar carrinhos muito antigos (> 30 dias)
 */
async function cleanOldCarts() {
  try {
    const [result] = await pool.execute(`
      DELETE FROM cart_items 
      WHERE cart_id IN (
        SELECT id FROM carts 
        WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      )
    `);

    await pool.execute(`
      DELETE FROM carts 
      WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    logger.info(`Carrinhos antigos limpos: ${result.affectedRows} itens removidos`);
  } catch (error) {
    logger.logError(error);
  }
}

// Agendar limpeza mensal
function scheduleMonthlyCleanup() {
  // Executar todo dia 1 às 3h da manhã
  cron.schedule('0 3 1 * *', async () => {
    logger.info('Executando limpeza mensal de carrinhos...');
    await cleanOldCarts();
  });
}

module.exports = {
  initializeScheduler,
  checkAbandonedCarts,
  checkAbandonedCarts24h,
  markCartAsRecovered,
  cleanOldCarts,
  scheduleMonthlyCleanup,
};
