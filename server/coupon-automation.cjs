// ==================== SISTEMA DE GERAÇÃO AUTOMÁTICA DE CUPONS ====================
// Sistema inteligente que gera cupons automaticamente baseado em eventos e comportamento

const crypto = require('crypto');

// Função auxiliar para gerar código de cupom único
function generateCouponCode(prefix = 'AUTO') {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().substring(0, 6);
  return `${prefix}${random}`;
}

// ==================== 1. CUPOM DE ANIVERSÁRIO ====================
async function generateBirthdayCoupons(pool) {
  try {
    console.log('🎂 [CUPONS] Verificando aniversariantes...');
    
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    // Buscar clientes que fazem aniversário hoje
    const [customers] = await pool.execute(`
      SELECT id, email, nome, data_nascimento
      FROM customers
      WHERE MONTH(data_nascimento) = ? AND DAY(data_nascimento) = ?
    `, [month, day]);
    
    console.log(`🎂 [CUPONS] Encontrados ${customers.length} aniversariantes`);
    
    for (const customer of customers) {
      // Verificar se já recebeu cupom de aniversário este ano
      const [existing] = await pool.execute(`
        SELECT uc.id FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? AND c.type = 'birthday' AND YEAR(uc.created_at) = YEAR(NOW())
      `, [customer.id]);
      
      if (existing.length > 0) {
        console.log(`🎂 [CUPONS] Cliente ${customer.email} já recebeu cupom de aniversário este ano`);
        continue;
      }
      
      const couponCode = generateCouponCode('ANIV');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias para usar
      
      // Criar cupom
      await pool.execute(`
        INSERT INTO coupons (code, type, discount_type, discount_value, min_purchase, expires_at, max_uses, status)
        VALUES (?, 'birthday', 'percentage', 15, 0, ?, 1, 'active')
      `, [couponCode, expiresAt]);
      
      // Atribuir ao cliente
      await pool.execute(`
        INSERT INTO user_coupons (user_id, coupon_id, is_used)
        SELECT ?, id, FALSE FROM coupons WHERE code = ?
      `, [customer.id, couponCode]);
      
      // Criar notificação
      await pool.execute(`
        INSERT INTO customer_notifications 
        (customer_id, type, title, message, icon, color, link, \`read\`)
        VALUES (?, 'coupon', ?, ?, 'gift', 'purple', '/minha-conta?tab=cupons', 0)
      `, [
        customer.id,
        '🎂 Feliz Aniversário!',
        `Parabéns ${customer.nome}! Ganhe 15% OFF em qualquer compra. Use: ${couponCode}`
      ]);
      
      console.log(`✅ [CUPONS] Cupom de aniversário ${couponCode} criado para ${customer.email}`);
    }
    
    return { success: true, count: customers.length };
  } catch (error) {
    console.error('❌ [CUPONS] Erro ao gerar cupons de aniversário:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 2. CUPOM DE PRIMEIRA COMPRA ====================
async function generateFirstPurchaseCoupon(pool, customerId) {
  try {
    console.log('🎁 [CUPONS] Gerando cupom de primeira compra...');
    
    // Verificar se é realmente a primeira compra
    const [orders] = await pool.execute(`
      SELECT COUNT(*) as count FROM orders
      WHERE customer_id = ? AND status != 'cancelled'
    `, [customerId]);
    
    if (orders[0].count > 1) {
      console.log('🎁 [CUPONS] Cliente já tem pedidos, não gera cupom de primeira compra');
      return { success: false, reason: 'not_first_purchase' };
    }
    
    // Verificar se já recebeu cupom de primeira compra
    const [existing] = await pool.execute(`
      SELECT uc.id FROM user_coupons uc
      JOIN coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ? AND c.type = 'first_purchase'
    `, [customerId]);
    
    if (existing.length > 0) {
      console.log('🎁 [CUPONS] Cliente já recebeu cupom de primeira compra');
      return { success: false, reason: 'already_received' };
    }
    
    const couponCode = generateCouponCode('PRIM');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // 60 dias para segunda compra
    
    // Criar cupom
    await pool.execute(`
      INSERT INTO coupons (code, type, discount_type, discount_value, min_purchase, expires_at, max_uses, status)
      VALUES (?, 'first_purchase', 'percentage', 10, 50, ?, 1, 'active')
    `, [couponCode, expiresAt]);
    
    // Atribuir ao cliente
    await pool.execute(`
      INSERT INTO user_coupons (user_id, coupon_id, is_used)
      SELECT ?, id, FALSE FROM coupons WHERE code = ?
    `, [customerId, couponCode]);
    
    // Criar notificação
    await pool.execute(`
      INSERT INTO customer_notifications 
      (customer_id, type, title, message, icon, color, link, \`read\`)
      VALUES (?, 'coupon', ?, ?, 'gift', 'green', '/minha-conta?tab=cupons', 0)
    `, [
      customerId,
      '🎁 Obrigado pela sua primeira compra!',
      `Ganhe 10% OFF na próxima compra acima de R$ 50. Use: ${couponCode}`
    ]);
    
    console.log(`✅ [CUPONS] Cupom de primeira compra ${couponCode} criado`);
    return { success: true, couponCode };
  } catch (error) {
    console.error('❌ [CUPONS] Erro ao gerar cupom de primeira compra:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 3. CUPOM POR INATIVIDADE ====================
async function generateInactivityCoupons(pool) {
  try {
    console.log('😴 [CUPONS] Verificando clientes inativos...');
    
    // Buscar clientes inativos (sem pedidos nos últimos 60 dias)
    const [inactiveCustomers] = await pool.execute(`
      SELECT DISTINCT c.id, c.email, c.nome
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id NOT IN (
        SELECT DISTINCT customer_id 
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND customer_id IS NOT NULL
      )
      AND c.created_at < DATE_SUB(NOW(), INTERVAL 60 DAY)
      LIMIT 100
    `);
    
    console.log(`😴 [CUPONS] Encontrados ${inactiveCustomers.length} clientes inativos`);
    
    for (const customer of inactiveCustomers) {
      // Verificar se já recebeu cupom de inatividade recentemente (últimos 90 dias)
      const [existing] = await pool.execute(`
        SELECT uc.id FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? 
        AND c.type = 'inactivity' 
        AND uc.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      `, [customer.id]);
      
      if (existing.length > 0) {
        console.log(`😴 [CUPONS] Cliente ${customer.email} já recebeu cupom de inatividade recentemente`);
        continue;
      }
      
      const couponCode = generateCouponCode('VOLTA');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias para usar
      
      // Criar cupom
      await pool.execute(`
        INSERT INTO coupons (code, type, discount_type, discount_value, min_purchase, expires_at, max_uses, status)
        VALUES (?, 'inactivity', 'percentage', 20, 0, ?, 1, 'active')
      `, [couponCode, expiresAt]);
      
      // Atribuir ao cliente
      await pool.execute(`
        INSERT INTO user_coupons (user_id, coupon_id, is_used)
        SELECT ?, id, FALSE FROM coupons WHERE code = ?
      `, [customer.id, couponCode]);
      
      // Criar notificação
      await pool.execute(`
        INSERT INTO customer_notifications 
        (customer_id, type, title, message, icon, color, link, \`read\`)
        VALUES (?, 'coupon', ?, ?, 'gift', 'blue', '/minha-conta?tab=cupons', 0)
      `, [
        customer.id,
        '😊 Sentimos sua falta!',
        `${customer.nome}, ganhe 20% OFF na próxima compra! Use: ${couponCode}`
      ]);
      
      console.log(`✅ [CUPONS] Cupom de inatividade ${couponCode} criado para ${customer.email}`);
    }
    
    return { success: true, count: inactiveCustomers.length };
  } catch (error) {
    console.error('❌ [CUPONS] Erro ao gerar cupons de inatividade:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 4. CUPOM POR CARRINHO ABANDONADO ====================
async function generateAbandonedCartCoupons(pool) {
  try {
    console.log('🛒 [CUPONS] Verificando carrinhos abandonados...');
    
    // Buscar carrinhos com itens há mais de 24h sem pedido
    const [abandonedCarts] = await pool.execute(`
      SELECT DISTINCT ci.cart_id, c.id as customer_id, c.email, c.nome
      FROM cart_items ci
      LEFT JOIN customers c ON ci.cart_id = c.id
      WHERE ci.updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND ci.cart_id NOT IN (
        SELECT DISTINCT cart_id 
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND cart_id IS NOT NULL
      )
      AND c.id IS NOT NULL
      LIMIT 50
    `);
    
    console.log(`🛒 [CUPONS] Encontrados ${abandonedCarts.length} carrinhos abandonados`);
    
    for (const cart of abandonedCarts) {
      // Verificar se já recebeu cupom de carrinho abandonado recentemente
      const [existing] = await pool.execute(`
        SELECT uc.id FROM user_coupons uc
        JOIN coupons c ON uc.coupon_id = c.id
        WHERE uc.user_id = ? 
        AND c.type = 'abandoned_cart' 
        AND uc.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [cart.customer_id]);
      
      if (existing.length > 0) {
        console.log(`🛒 [CUPONS] Cliente ${cart.email} já recebeu cupom de carrinho abandonado recentemente`);
        continue;
      }
      
      const couponCode = generateCouponCode('CARR');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias para usar
      
      // Criar cupom
      await pool.execute(`
        INSERT INTO coupons (code, type, discount_type, discount_value, min_purchase, expires_at, max_uses, status)
        VALUES (?, 'abandoned_cart', 'percentage', 10, 0, ?, 1, 'active')
      `, [couponCode, expiresAt]);
      
      // Atribuir ao cliente
      await pool.execute(`
        INSERT INTO user_coupons (user_id, coupon_id, is_used)
        SELECT ?, id, FALSE FROM coupons WHERE code = ?
      `, [cart.customer_id, couponCode]);
      
      // Criar notificação
      await pool.execute(`
        INSERT INTO customer_notifications 
        (customer_id, type, title, message, icon, color, link, \`read\`)
        VALUES (?, 'coupon', ?, ?, 'shopping-cart', 'orange', '/carrinho', 0)
      `, [
        cart.customer_id,
        '🛒 Produtos esperando por você!',
        `${cart.nome}, finalize sua compra e ganhe 10% OFF! Use: ${couponCode}`
      ]);
      
      console.log(`✅ [CUPONS] Cupom de carrinho abandonado ${couponCode} criado para ${cart.email}`);
    }
    
    return { success: true, count: abandonedCarts.length };
  } catch (error) {
    console.error('❌ [CUPONS] Erro ao gerar cupons de carrinho abandonado:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 5. NOTIFICAÇÕES DE CUPONS EXPIRANDO ====================
async function notifyExpiringCoupons(pool) {
  try {
    console.log('⏰ [CUPONS] Verificando cupons expirando...');
    
    // Buscar cupons que expiram em 3 dias
    const [expiringCoupons] = await pool.execute(`
      SELECT uc.*, cu.nome as customer_name, cu.email, co.code as coupon_code
      FROM user_coupons uc
      JOIN customers cu ON uc.user_id = cu.id
      JOIN coupons co ON uc.coupon_id = co.id
      WHERE uc.is_used = FALSE
      AND co.expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
    `);
    
    console.log(`⏰ [CUPONS] Encontrados ${expiringCoupons.length} cupons expirando`);
    
    for (const coupon of expiringCoupons) {
      // Criar notificação
      await pool.execute(`
        INSERT INTO customer_notifications 
        (customer_id, type, title, message, icon, color, link, \`read\`)
        VALUES (?, 'coupon_expiring', ?, ?, 'alert-circle', 'red', '/minha-conta?tab=cupons', 0)
      `, [
        coupon.user_id,
        '⏰ Cupom expirando!',
        `${coupon.customer_name}, seu cupom ${coupon.coupon_code} expira em breve! Use agora.`
      ]);
      
      console.log(`✅ [CUPONS] Notificação de expiração enviada para ${coupon.email}`);
    }
    
    return { success: true, count: expiringCoupons.length };
  } catch (error) {
    console.error('❌ [CUPONS] Erro ao notificar cupons expirando:', error);
    return { success: false, error: error.message };
  }
}

// ==================== 6. EXECUTAR TODAS AS VERIFICAÇÕES ====================
async function runAllAutomations(pool) {
  console.log('🤖 [CUPONS] ========== INICIANDO AUTOMAÇÕES ==========');
  const startTime = Date.now();
  
  const results = {
    birthday: await generateBirthdayCoupons(pool),
    inactivity: await generateInactivityCoupons(pool),
    abandonedCart: await generateAbandonedCartCoupons(pool),
    expiring: await notifyExpiringCoupons(pool),
  };
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('🤖 [CUPONS] ========== AUTOMAÇÕES CONCLUÍDAS ==========');
  console.log(`⏱️ Tempo total: ${duration}s`);
  console.log('📊 Resultados:', JSON.stringify(results, null, 2));
  
  return results;
}

module.exports = {
  generateBirthdayCoupons,
  generateFirstPurchaseCoupon,
  generateInactivityCoupons,
  generateAbandonedCartCoupons,
  notifyExpiringCoupons,
  runAllAutomations,
  generateCouponCode
};

