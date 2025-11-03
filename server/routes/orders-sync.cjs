// Sistema unificado de sincronização de pedidos - Admin ↔ Cliente
const express = require('express');
const mysql = require('mysql2/promise');
// Pool próprio para este router (evita dependência de módulo ausente)
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const router = express.Router();

// Middleware para validação de permissões
const validateAdminAccess = (req, res, next) => {
  // Verificar se é admin (implementar lógica de autenticação)
  const isAdmin = req.headers['x-admin-token'] === process.env.ADMIN_TOKEN || 
                  req.session?.isAdmin;
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Acesso negado - Admin necessário' });
  }
  next();
};

// Middleware para validação de cliente
const validateCustomerAccess = (req, res, next) => {
  const sessionId = req.cookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: 'Sessão necessária' });
  }
  next();
};

// ==================== PEDIDOS UNIFICADOS ====================

// Buscar pedidos com sincronização completa
router.get('/orders/unified', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      search, 
      sort = 'created_at', 
      order = 'DESC',
      customer_id,
      admin_view = false
    } = req.query;
    
    const offset = (page - 1) * limit;
    const isAdmin = admin_view === 'true';
    
    // Construir query base
    let whereClause = '';
    let queryParams = [];
    
    // Filtro por status
    if (status && status !== 'all') {
      whereClause += ' WHERE o.status = ?';
      queryParams.push(status);
    }
    
    // Filtro por busca
    if (search) {
      const searchCondition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${searchCondition} (
        o.id LIKE ? OR 
        o.nome LIKE ? OR 
        o.email LIKE ? OR 
        o.telefone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Filtro por cliente (se não for admin)
    if (!isAdmin && customer_id) {
      let customerFilterId = customer_id;
      // Aceitar email como customer_id
      if (String(customer_id).includes('@')) {
        try {
          const [crows] = await pool.execute('SELECT id FROM customers WHERE email = ? LIMIT 1', [customer_id]);
          if (Array.isArray(crows) && crows[0] && crows[0].id) {
            customerFilterId = crows[0].id;
          } else {
            const [urows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [customer_id]);
            if (Array.isArray(urows) && urows[0] && urows[0].id) {
              customerFilterId = urows[0].id;
            }
          }
        } catch (_) { /* tolerante: mantém valor original */ }
      }
      const customerCondition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${customerCondition} (o.customer_id = ? OR o.user_id = ?)`;
      queryParams.push(customerFilterId, customerFilterId);
    }
    
    // Query principal com dados completos (colunas essenciais)
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.user_id,
        o.customer_id,
        o.status,
        o.total,
        o.nome as customer_name,
        o.email as customer_email,
        o.telefone as customer_phone,
        o.endereco as shipping_address,
        o.metodo_pagamento as payment_method,
        o.created_at,
        o.updated_at,
        c.nome as customer_nome,
        c.email as customer_email_real,
        CASE 
          WHEN c.id IS NOT NULL THEN 'Cliente Sincronizado'
          WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
          ELSE 'Cliente Anônimo'
        END as customer_type,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);
    
    // Buscar itens de cada pedido
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Buscar itens sem depender de tabela 'produtos' (compatibilidade)
        const [items] = await pool.execute(`
          SELECT 
            oi.id,
            oi.product_id,
            oi.name,
            oi.price,
            oi.image_url,
            oi.quantity,
            oi.created_at
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.created_at ASC
        `, [order.id]);
        
        return {
          ...order,
          items: items,
          customer: {
            id: order.customer_id || order.user_id,
            nome: order.customer_nome || order.customer_name || 'Cliente',
            email: order.customer_email_real || order.customer_email || 'Email não informado',
            telefone: order.customer_phone || 'Telefone não informado',
            type: order.customer_type
          }
        };
      })
    );
    
    // Contar total para paginação
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    res.json({
      orders: ordersWithItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      sync_timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedidos unificados:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      orders: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
  }
});

// ==================== ATUALIZAÇÃO DE STATUS SINCRONIZADA ====================

// Atualizar status com notificação em tempo real
router.patch('/orders/:id/status', validateAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, notify_customer = true } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Buscar dados do pedido antes da atualização
    const [orders] = await pool.execute(`
      SELECT o.*, c.email as customer_email, c.nome as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = orders[0];
    const oldStatus = order.status;
    
    // Atualizar status do pedido
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    // Registrar histórico de status
    await pool.execute(`
      INSERT INTO order_status_history (order_id, status, notes, created_at)
      VALUES (?, ?, ?, NOW())
    `, [id, status, notes || null]);
    
    // Preparar dados para notificação
    const statusInfo = {
      order_id: id,
      old_status: oldStatus,
      new_status: status,
      customer_email: order.customer_email,
      customer_name: order.customer_name,
      notes: notes,
      timestamp: new Date().toISOString()
    };
    
    // Emitir evento de atualização via WebSocket (se disponível)
    if (req.app.get('io')) {
      req.app.get('io').emit('order_status_updated', statusInfo);
      
      // Notificar cliente específico se logado
      if (order.customer_email) {
        req.app.get('io').to(`customer_${order.customer_email}`).emit('order_updated', {
          order_id: id,
          status: status,
          message: `Seu pedido #${id.substring(0, 8)} foi atualizado para: ${status}`
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Status atualizado com sucesso',
      status_info: statusInfo,
      notify_customer
    });
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== TIMELINE DE STATUS ====================

// Buscar timeline completa de um pedido
router.get('/orders/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar histórico de status
    const [timeline] = await pool.execute(`
      SELECT 
        status,
        notes,
        created_at,
        updated_at
      FROM order_status_history
      WHERE order_id = ?
      ORDER BY created_at ASC
    `, [id]);
    
    // Se não há histórico, criar entrada baseada no status atual
    if (timeline.length === 0) {
      const [order] = await pool.execute(
        'SELECT status, created_at FROM orders WHERE id = ?',
        [id]
      );
      
      if (order.length > 0) {
        timeline.push({
          status: order[0].status,
          notes: 'Status inicial',
          created_at: order[0].created_at,
          updated_at: order[0].created_at
        });
      }
    }
    
    res.json(timeline);
    
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== COMENTÁRIOS E OBSERVAÇÕES ====================

// Adicionar comentário ao pedido
router.post('/orders/:id/comments', validateAdminAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, is_internal = false } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comentário é obrigatório' });
    }
    
    await pool.execute(`
      INSERT INTO order_comments (order_id, comment, is_internal, created_at)
      VALUES (?, ?, ?, NOW())
    `, [id, comment, is_internal]);
    
    // Emitir evento de novo comentário
    if (req.app.get('io')) {
      req.app.get('io').emit('order_comment_added', {
        order_id: id,
        comment: comment,
        is_internal: is_internal,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Comentário adicionado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar comentários do pedido
router.get('/orders/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_internal = false } = req.query;
    
    let whereClause = 'WHERE order_id = ?';
    let queryParams = [id];
    
    if (!include_internal) {
      whereClause += ' AND is_internal = false';
    }
    
    const [comments] = await pool.execute(`
      SELECT 
        id,
        comment,
        is_internal,
        created_at
      FROM order_comments
      ${whereClause}
      ORDER BY created_at ASC
    `, queryParams);
    
    res.json(comments);
    
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MÉTRICAS E RELATÓRIOS ====================

// Estatísticas unificadas
router.get('/orders/stats/unified', async (req, res) => {
  try {
    const { period = '30d', customer_id } = req.query;
    
    let dateFilter = '';
    let queryParams = [];
    
    // Filtro por período
    switch (period) {
      case '7d':
        dateFilter = 'WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30d':
        dateFilter = 'WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case '90d':
        dateFilter = 'WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        break;
      case '1y':
        dateFilter = 'WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        break;
    }
    
    // Filtro por cliente (aceitar email)
    if (customer_id) {
      let customerFilterId = customer_id;
      if (String(customer_id).includes('@')) {
        try {
          const [crows] = await pool.execute('SELECT id FROM customers WHERE email = ? LIMIT 1', [customer_id]);
          if (Array.isArray(crows) && crows[0] && crows[0].id) {
            customerFilterId = crows[0].id;
          } else {
            const [urows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [customer_id]);
            if (Array.isArray(urows) && urows[0] && urows[0].id) {
              customerFilterId = urows[0].id;
            }
          }
        } catch (_) { /* tolerante */ }
      }
      const customerFilter = dateFilter ? ' AND' : ' WHERE';
      dateFilter += `${customerFilter} (o.customer_id = ? OR o.user_id = ?)`;
      queryParams.push(customerFilterId, customerFilterId);
    }
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END) as average_ticket,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'delivered' THEN total ELSE 0 END) as today_revenue,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() AND customer_id IS NOT NULL THEN 1 END) as new_customers_today,
        AVG(TIMESTAMPDIFF(HOUR, created_at, 
          CASE WHEN status = 'delivered' THEN updated_at ELSE NULL END)) as avg_delivery_time_hours
      FROM orders o
      ${dateFilter}
    `, queryParams);
    
    const result = stats[0];
    
    res.json({
      period: period,
      total: result.total_orders || 0,
      pending: result.pending_orders || 0,
      processing: result.processing_orders || 0,
      shipped: result.shipped_orders || 0,
      delivered: result.delivered_orders || 0,
      cancelled: result.cancelled_orders || 0,
      totalRevenue: result.total_revenue || 0,
      averageTicket: result.average_ticket || 0,
      todayOrders: result.today_orders || 0,
      todayRevenue: result.today_revenue || 0,
      uniqueCustomers: result.unique_customers || 0,
      newCustomersToday: result.new_customers_today || 0,
      avgDeliveryTimeHours: result.avg_delivery_time_hours || 0,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== WEBSOCKET EVENTS ====================

// Configurar eventos WebSocket para sincronização em tempo real
const setupOrderWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Cliente conectado ao sistema de pedidos:', socket.id);
    
    // Cliente se junta à sala do seu email
    socket.on('join_customer_room', (email) => {
      socket.join(`customer_${email}`);
      console.log(`Cliente ${email} entrou na sala`);
    });
    
    // Admin se junta à sala de admin
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log('Admin entrou na sala');
    });
    
    // Escutar atualizações de status
    socket.on('order_status_update', (data) => {
      // Broadcast para todos os admins
      socket.to('admin_room').emit('order_status_updated', data);
    });
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado:', socket.id);
    });
  });
};

module.exports = { router, setupOrderWebSocket };

