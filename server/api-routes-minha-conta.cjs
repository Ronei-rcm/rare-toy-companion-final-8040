// ==================== ENDPOINTS ADICIONAIS PARA "MINHA CONTA" ====================
// Este arquivo contém endpoints que devem ser adicionados ao server.cjs

// ==================== NOTIFICAÇÕES API ====================

// Listar notificações do cliente
app.get('/api/customers/:userId/notifications', async (req, res) => {
  try {
    let { userId } = req.params;
    
    // Converter email para user_id se necessário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }

    const [notifications] = await pool.execute(`
      SELECT * FROM customer_notifications
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ notifications });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
});

// Marcar notificação como lida
app.patch('/api/customers/:userId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    
    await pool.execute(`
      UPDATE customer_notifications
      SET read = 1
      WHERE id = ? AND customer_id = ?
    `, [notificationId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
});

// Marcar todas como lidas
app.patch('/api/customers/:userId/notifications/read-all', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    await pool.execute(`
      UPDATE customer_notifications
      SET read = 1
      WHERE customer_id = ?
    `, [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
});

// Deletar notificação
app.delete('/api/customers/:userId/notifications/:notificationId', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    
    await pool.execute(`
      DELETE FROM customer_notifications
      WHERE id = ? AND customer_id = ?
    `, [notificationId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    res.status(500).json({ error: 'Erro ao deletar notificação' });
  }
});

// Limpar todas as notificações
app.delete('/api/customers/:userId/notifications/clear', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    await pool.execute(`
      DELETE FROM customer_notifications
      WHERE customer_id = ?
    `, [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    res.status(500).json({ error: 'Erro ao limpar notificações' });
  }
});

// Preferências de notificação
app.get('/api/customers/:userId/notification-preferences', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [prefs] = await pool.execute(`
      SELECT preferences FROM customer_notification_preferences
      WHERE customer_id = ?
    `, [userId]);

    const preferences = prefs[0] ? JSON.parse(prefs[0].preferences) : {
      email: { orders: true, promotions: true, newsletter: true, recommendations: false },
      push: { orders: true, promotions: false, newsletter: false, recommendations: false },
      sms: { orders: true, promotions: false, newsletter: false, recommendations: false },
    };

    res.json({ preferences });
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    res.status(500).json({ error: 'Erro ao buscar preferências' });
  }
});

// Salvar preferências de notificação
app.put('/api/customers/:userId/notification-preferences', async (req, res) => {
  try {
    let { userId } = req.params;
    const { email, push, sms } = req.body;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const preferences = JSON.stringify({ email, push, sms });

    await pool.execute(`
      INSERT INTO customer_notification_preferences (id, customer_id, preferences)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE preferences = ?
    `, [crypto.randomUUID(), userId, preferences, preferences]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências' });
  }
});

// ==================== CUPONS API ====================

// Listar cupons do cliente
app.get('/api/customers/:userId/coupons', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [coupons] = await pool.execute(`
      SELECT * FROM customer_coupons
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.json({ coupons });
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    res.status(500).json({ error: 'Erro ao buscar cupons' });
  }
});

// Informações de fidelidade
app.get('/api/customers/:userId/loyalty', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [orders] = await pool.execute(`
      SELECT COALESCE(SUM(total), 0) as totalSpent
      FROM orders
      WHERE user_id = ? AND status != 'cancelled'
    `, [userId]);

    const totalSpent = Number(orders[0]?.totalSpent || 0);
    const points = Math.floor(totalSpent / 10);
    
    let level = 'Bronze';
    let nextLevelPoints = 100;
    
    if (points >= 500) {
      level = 'Platinum';
      nextLevelPoints = 1000;
    } else if (points >= 250) {
      level = 'Gold';
      nextLevelPoints = 500;
    } else if (points >= 100) {
      level = 'Silver';
      nextLevelPoints = 250;
    }

    const [coupons] = await pool.execute(`
      SELECT COUNT(*) as redeemed FROM customer_coupons
      WHERE customer_id = ? AND used = 1
    `, [userId]);

    res.json({
      points,
      totalPoints: points,
      level,
      nextLevelPoints,
      couponsRedeemed: coupons[0]?.redeemed || 0,
      totalSavings: totalSpent * 0.05,
    });
  } catch (error) {
    console.error('Erro ao buscar fidelidade:', error);
    res.status(500).json({ error: 'Erro ao buscar fidelidade' });
  }
});

// Resgatar cupom
app.post('/api/customers/:userId/coupons/redeem', async (req, res) => {
  try {
    let { userId } = req.params;
    const { code } = req.body;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    // Verificar se o cupom existe e é válido
    const [existing] = await pool.execute(`
      SELECT * FROM coupons
      WHERE code = ? AND expires_at > NOW() AND active = 1
    `, [code]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Cupom inválido ou expirado' });
    }

    const coupon = existing[0];
    const id = crypto.randomUUID();

    // Adicionar cupom ao cliente
    await pool.execute(`
      INSERT INTO customer_coupons (id, customer_id, coupon_id, code, type, value, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, coupon.id, code, coupon.type, coupon.value, coupon.expires_at]);

    res.json({ success: true, coupon });
  } catch (error) {
    console.error('Erro ao resgatar cupom:', error);
    res.status(500).json({ error: 'Erro ao resgatar cupom' });
  }
});

// ==================== REVIEWS DO CLIENTE API ====================

// Listar reviews do cliente
app.get('/api/customers/:userId/reviews', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [reviews] = await pool.execute(`
      SELECT 
        r.*,
        p.nome as product_name,
        p.imagem_url as product_image,
        p.categoria as product_category
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({ reviews: reviews.map(r => ({
      ...r,
      product: {
        id: r.product_id,
        nome: r.product_name,
        imagem_url: r.product_image,
        categoria: r.product_category,
      }
    })) });
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Produtos pendentes de avaliação
app.get('/api/customers/:userId/pending-reviews', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [products] = await pool.execute(`
      SELECT DISTINCT
        p.id,
        p.nome,
        p.imagem_url,
        o.created_at as purchaseDate
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_reviews r ON r.product_id = p.id AND r.user_id = o.user_id
      WHERE o.user_id = ? 
        AND o.status = 'delivered'
        AND r.id IS NULL
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({ products });
  } catch (error) {
    console.error('Erro ao buscar produtos pendentes:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos pendentes' });
  }
});

// Estatísticas de reviews do cliente
app.get('/api/customers/:userId/review-stats', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalReviews,
        AVG(rating) as averageRating,
        SUM(helpful_count) as helpfulVotes,
        SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured
      FROM product_reviews
      WHERE user_id = ?
    `, [userId]);

    res.json(stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      helpfulVotes: 0,
      featured: 0,
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de reviews:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Criar review do cliente
app.post('/api/customers/:userId/reviews', async (req, res) => {
  try {
    let { userId } = req.params;
    const { productId, rating, title, comment, images, recommend } = req.body;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const id = crypto.randomUUID();

    await pool.execute(`
      INSERT INTO product_reviews (id, product_id, user_id, rating, title, comment, images, recommend)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, productId, userId, rating, title, comment, JSON.stringify(images || []), recommend ? 1 : 0]);

    // Atualizar média do produto
    const [avgResult] = await pool.execute(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM product_reviews
      WHERE product_id = ?
    `, [productId]);

    await pool.execute(`
      UPDATE products
      SET avaliacao = ?, total_avaliacoes = ?
      WHERE id = ?
    `, [avgResult[0].avg_rating, avgResult[0].total_reviews, productId]);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Atualizar review
app.put('/api/customers/:userId/reviews/:reviewId', async (req, res) => {
  try {
    const { userId, reviewId } = req.params;
    const { rating, title, comment, images, recommend } = req.body;

    await pool.execute(`
      UPDATE product_reviews
      SET rating = ?, title = ?, comment = ?, images = ?, recommend = ?
      WHERE id = ? AND user_id = ?
    `, [rating, title, comment, JSON.stringify(images || []), recommend ? 1 : 0, reviewId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro ao atualizar avaliação' });
  }
});

// Deletar review
app.delete('/api/customers/:userId/reviews/:reviewId', async (req, res) => {
  try {
    const { userId, reviewId } = req.params;

    await pool.execute(`
      DELETE FROM product_reviews
      WHERE id = ? AND user_id = ?
    `, [reviewId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({ error: 'Erro ao deletar avaliação' });
  }
});

// ==================== CONFIGURAÇÕES E PRIVACIDADE API ====================

// Buscar configurações do cliente
app.get('/api/customers/:userId/settings', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [settings] = await pool.execute(`
      SELECT privacy, preferences FROM customer_settings
      WHERE customer_id = ?
    `, [userId]);

    const privacy = settings[0]?.privacy ? JSON.parse(settings[0].privacy) : {
      showProfile: true,
      showPurchaseHistory: false,
      showWishlist: false,
      allowMarketing: true,
      allowAnalytics: true,
      allowCookies: true,
    };

    const preferences = settings[0]?.preferences ? JSON.parse(settings[0].preferences) : {
      language: 'pt-BR',
      currency: 'BRL',
      theme: 'light',
      emailFrequency: 'weekly',
      twoFactorAuth: false,
    };

    res.json({ privacy, preferences });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Salvar configurações de privacidade
app.put('/api/customers/:userId/settings/privacy', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const privacy = JSON.stringify(req.body);

    await pool.execute(`
      INSERT INTO customer_settings (id, customer_id, privacy)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE privacy = ?
    `, [crypto.randomUUID(), userId, privacy, privacy]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar privacidade:', error);
    res.status(500).json({ error: 'Erro ao salvar privacidade' });
  }
});

// Salvar preferências
app.put('/api/customers/:userId/settings/preferences', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const preferences = JSON.stringify(req.body);

    await pool.execute(`
      INSERT INTO customer_settings (id, customer_id, preferences)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE preferences = ?
    `, [crypto.randomUUID(), userId, preferences, preferences]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar preferências:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências' });
  }
});

// Listar sessões ativas
app.get('/api/customers/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [sessions] = await pool.execute(`
      SELECT id, device, location, last_active, created_at
      FROM sessions
      WHERE user_id = ?
      ORDER BY last_active DESC
    `, [userId]);

    res.json({ sessions: sessions.map(s => ({ ...s, current: false })) });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({ error: 'Erro ao buscar sessões', sessions: [] });
  }
});

// Revogar sessão
app.delete('/api/customers/:userId/sessions/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    await pool.execute(`
      DELETE FROM sessions
      WHERE id = ? AND user_id = ?
    `, [sessionId, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao revogar sessão:', error);
    res.status(500).json({ error: 'Erro ao revogar sessão' });
  }
});

// Alterar senha
app.post('/api/customers/:userId/change-password', async (req, res) => {
  try {
    let { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    // Verificar senha atual
    const [users] = await pool.execute(`
      SELECT password FROM users WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Em produção, usar bcrypt.compare
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(currentPassword, users[0].password);

    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(`
      UPDATE users
      SET password = ?
      WHERE id = ?
    `, [hashedPassword, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// Exportar dados do cliente (LGPD)
app.get('/api/customers/:userId/export-data', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    // Buscar todos os dados do cliente
    const [userData] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
    const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ?', [userId]);
    const [addresses] = await pool.execute('SELECT * FROM customer_addresses WHERE customer_id = ?', [userId]);
    const [favorites] = await pool.execute('SELECT * FROM customer_favorites WHERE user_id = ?', [userId]);
    const [reviews] = await pool.execute('SELECT * FROM product_reviews WHERE user_id = ?', [userId]);

    const exportData = {
      user: userData[0],
      orders,
      addresses,
      favorites,
      reviews,
      exportedAt: new Date().toISOString(),
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=meus-dados-${userId}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// Excluir conta
app.delete('/api/customers/:userId/delete-account', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    // Deletar todos os dados relacionados
    await pool.execute('DELETE FROM customer_addresses WHERE customer_id = ?', [userId]);
    await pool.execute('DELETE FROM customer_favorites WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM product_reviews WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM customer_notifications WHERE customer_id = ?', [userId]);
    await pool.execute('DELETE FROM customer_coupons WHERE customer_id = ?', [userId]);
    await pool.execute('DELETE FROM customer_settings WHERE customer_id = ?', [userId]);
    await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM orders WHERE user_id = ?', [userId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ error: 'Erro ao excluir conta' });
  }
});

// ==================== RECOMENDAÇÕES API ====================

// Recomendações para o cliente
app.get('/api/customers/:userId/recommendations', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    // Buscar categorias favoritas do usuário
    const [favCategories] = await pool.execute(`
      SELECT p.categoria, COUNT(*) as count
      FROM customer_favorites cf
      JOIN products p ON cf.product_id = p.id
      WHERE cf.user_id = ?
      GROUP BY p.categoria
      ORDER BY count DESC
      LIMIT 3
    `, [userId]);

    let recommendations = [];

    if (favCategories.length > 0) {
      const categories = favCategories.map(c => c.categoria);
      const placeholders = categories.map(() => '?').join(',');
      
      const [products] = await pool.execute(`
        SELECT DISTINCT p.*
        FROM products p
        LEFT JOIN customer_favorites cf ON p.id = cf.product_id AND cf.user_id = ?
        WHERE p.categoria IN (${placeholders})
          AND cf.id IS NULL
          AND p.ativo = 1
        ORDER BY p.created_at DESC
        LIMIT 10
      `, [userId, ...categories]);

      recommendations = products;
    } else {
      // Se não tem favoritos, recomendar mais vendidos
      const [products] = await pool.execute(`
        SELECT p.*, COUNT(oi.id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN customer_favorites cf ON p.id = cf.product_id AND cf.user_id = ?
        WHERE cf.id IS NULL AND p.ativo = 1
        GROUP BY p.id
        ORDER BY order_count DESC
        LIMIT 10
      `, [userId]);

      recommendations = products;
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Erro ao buscar recomendações:', error);
    res.status(500).json({ error: 'Erro ao buscar recomendações', recommendations: [] });
  }
});

// ==================== INSIGHTS DE PEDIDOS API ====================

// Insights de pedidos do cliente
app.get('/api/customers/:userId/order-insights', async (req, res) => {
  try {
    let { userId } = req.params;
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }

    const [orders] = await pool.execute(`
      SELECT 
        AVG(total) as averageOrderValue,
        COUNT(*) as totalOrders,
        SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as totalSpent,
        MAX(created_at) as lastOrderDate,
        MIN(created_at) as firstOrderDate
      FROM orders
      WHERE user_id = ?
    `, [userId]);

    const stats = orders[0];
    const daysSinceFirst = Math.floor((Date.now() - new Date(stats.firstOrderDate).getTime()) / (1000 * 60 * 60 * 24));
    const orderFrequency = stats.totalOrders > 1 ? Math.floor(daysSinceFirst / stats.totalOrders) : 0;

    const [paymentMethods] = await pool.execute(`
      SELECT payment_method, COUNT(*) as count
      FROM orders
      WHERE user_id = ?
      GROUP BY payment_method
      ORDER BY count DESC
      LIMIT 1
    `, [userId]);

    const [categories] = await pool.execute(`
      SELECT p.categoria, COUNT(*) as count
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY p.categoria
      ORDER BY count DESC
      LIMIT 1
    `, [userId]);

    res.json({
      averageOrderValue: Number(stats.averageOrderValue || 0),
      mostOrderedCategory: categories[0]?.categoria || 'N/A',
      favoritePaymentMethod: paymentMethods[0]?.payment_method || 'PIX',
      orderFrequency,
      totalSavings: Number(stats.totalSpent || 0) * 0.05,
    });
  } catch (error) {
    console.error('Erro ao buscar insights:', error);
    res.status(500).json({ error: 'Erro ao buscar insights' });
  }
});

// ==================== ESTIMATIVA DE ENTREGA API ====================

// Estimar entrega por região
app.post('/api/delivery-estimate', async (req, res) => {
  try {
    const { cidade, estado } = req.body;

    // Simulação de estimativa
    const regions = {
      'SP': { days: '1-2', freight: '8.90', region: 'Sudeste' },
      'RJ': { days: '1-3', freight: '9.90', region: 'Sudeste' },
      'MG': { days: '2-4', freight: '12.90', region: 'Sudeste' },
      'RS': { days: '3-5', freight: '15.90', region: 'Sul' },
      'SC': { days: '3-5', freight: '14.90', region: 'Sul' },
      'PR': { days: '2-4', freight: '13.90', region: 'Sul' },
    };

    const estimate = regions[estado] || { days: '5-7', freight: '19.90', region: 'Outras' };

    res.json(estimate);
  } catch (error) {
    console.error('Erro ao calcular estimativa:', error);
    res.status(500).json({ error: 'Erro ao calcular estimativa' });
  }
});
