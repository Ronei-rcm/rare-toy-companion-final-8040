// API completa para gestão de pedidos do admin - dados reais do banco
const express = require('express');
const { pool } = require('../database/mysql');

const router = express.Router();

// Buscar todos os pedidos com dados completos
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    
    // Construir query base
    let whereClause = '';
    let queryParams = [];
    
    // Filtro por status
    if (status && status !== 'all') {
      whereClause += ' WHERE o.status = ?';
      queryParams.push(status);
    }
    
    // Filtro por busca (nome, email, ID do pedido)
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
    
    // Query principal com dados do cliente
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.user_id,
        o.customer_id,
        o.cart_id,
        o.status,
        o.total,
        o.nome as customer_name,
        o.email as customer_email,
        o.telefone as customer_phone,
        o.endereco as shipping_address,
        o.metodo_pagamento as payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        c.nome as customer_nome,
        c.email as customer_email_real,
        c.telefone as customer_telefone_real,
        c.total_pedidos as customer_total_orders,
        c.total_gasto as customer_total_spent,
        c.ultimo_pedido as customer_last_order,
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
        const [items] = await pool.execute(`
          SELECT 
            oi.id,
            oi.product_id,
            oi.name,
            oi.price,
            oi.image_url,
            oi.quantity,
            p.nome as product_name,
            p.imagem_url as product_image,
            p.estoque as product_stock
          FROM order_items oi
          LEFT JOIN produtos p ON oi.product_id = p.id
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
            telefone: order.customer_telefone_real || order.customer_phone || 'Telefone não informado',
            total_pedidos: order.customer_total_orders || 1,
            total_gasto: order.customer_total_spent || order.total || 0,
            ultimo_pedido: order.customer_last_order || order.created_at,
            type: order.customer_type
          }
        };
      })
    );
    
    // Contar total de pedidos para paginação
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
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedidos do admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de pedidos
router.get('/orders/stats', async (req, res) => {
  try {
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
        COUNT(DISTINCT user_id) as total_customers,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() AND user_id IS NOT NULL THEN 1 END) as new_customers
      FROM orders
    `);
    
    const result = stats[0];
    
    res.json({
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
      totalCustomers: result.total_customers || 0,
      newCustomers: result.new_customers || 0
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar pedido específico com detalhes completos
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar dados do pedido
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        c.nome as customer_nome,
        c.email as customer_email,
        c.telefone as customer_telefone,
        c.total_pedidos as customer_total_orders,
        c.total_gasto as customer_total_spent
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = orders[0];
    
    // Buscar itens do pedido
    const [items] = await pool.execute(`
      SELECT 
        oi.id,
        oi.product_id,
        oi.name,
        oi.price,
        oi.image_url,
        oi.quantity,
        p.nome as product_name,
        p.imagem_url as product_image,
        p.estoque as product_stock,
        p.categoria as product_category
      FROM order_items oi
      LEFT JOIN produtos p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `, [id]);
    
    // Buscar histórico de status (se existir tabela)
    let statusHistory = [];
    try {
      const [history] = await pool.execute(`
        SELECT status, created_at, updated_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at ASC
      `, [id]);
      statusHistory = history;
    } catch (e) {
      // Tabela não existe, usar dados do pedido
      statusHistory = [{
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at
      }];
    }
    
    res.json({
      ...order,
      items,
      statusHistory,
      customer: {
        id: order.customer_id || order.user_id,
        nome: order.customer_nome || order.nome || 'Cliente',
        email: order.customer_email || order.email || 'Email não informado',
        telefone: order.customer_telefone || order.telefone || 'Telefone não informado',
        total_pedidos: order.customer_total_orders || 1,
        total_gasto: order.customer_total_spent || order.total || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status do pedido
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    // Atualizar status do pedido
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    // Registrar histórico de status (se tabela existir)
    try {
      await pool.execute(`
        INSERT INTO order_status_history (order_id, status, notes, created_at)
        VALUES (?, ?, ?, NOW())
      `, [id, status, notes || null]);
    } catch (e) {
      // Tabela não existe, continuar sem erro
      console.log('Tabela order_status_history não existe');
    }
    
    res.json({ success: true, message: 'Status atualizado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Associar pedido com cliente
router.patch('/orders/:id/associate-customer', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;
    
    if (!customer_id) {
      return res.status(400).json({ error: 'ID do cliente é obrigatório' });
    }
    
    // Verificar se o pedido existe
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Verificar se o cliente existe
    const [customers] = await pool.execute('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Atualizar pedido
    await pool.execute(
      'UPDATE orders SET customer_id = ?, updated_at = NOW() WHERE id = ?',
      [customer_id, id]
    );
    
    // Atualizar estatísticas do cliente
    const customer = customers[0];
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(total) as total_gasto,
        MAX(created_at) as ultimo_pedido
      FROM orders 
      WHERE customer_id = ?
    `, [customer_id]);
    
    const stats = orderStats[0];
    await pool.execute(`
      UPDATE customers 
      SET 
        total_pedidos = ?,
        total_gasto = ?,
        ultimo_pedido = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [stats.total_pedidos, stats.total_gasto, stats.ultimo_pedido, customer_id]);
    
    res.json({ success: true, message: 'Cliente associado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao associar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar clientes para associação
router.get('/customers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const [customers] = await pool.execute(`
      SELECT 
        id,
        nome,
        email,
        telefone,
        total_pedidos,
        total_gasto,
        ultimo_pedido
      FROM customers
      WHERE nome LIKE ? OR email LIKE ? OR telefone LIKE ?
      ORDER BY nome ASC
      LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`]);
    
    res.json(customers);
    
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ações em lote
router.post('/orders/bulk-action', async (req, res) => {
  try {
    const { orderIds, action, value } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos pedidos são obrigatórios' });
    }
    
    if (!action) {
      return res.status(400).json({ error: 'Ação é obrigatória' });
    }
    
    let updateQuery = '';
    let updateParams = [];
    
    switch (action) {
      case 'update_status':
        if (!value) {
          return res.status(400).json({ error: 'Novo status é obrigatório' });
        }
        updateQuery = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id IN (';
        updateParams = [value, ...orderIds];
        break;
      case 'delete':
        updateQuery = 'DELETE FROM orders WHERE id IN (';
        updateParams = orderIds;
        break;
      default:
        return res.status(400).json({ error: 'Ação inválida' });
    }
    
    const placeholders = orderIds.map(() => '?').join(',');
    const finalQuery = updateQuery + placeholders + ')';
    
    const [result] = await pool.execute(finalQuery, updateParams);
    
    res.json({ 
      success: true, 
      message: `${result.affectedRows} pedidos processados com sucesso` 
    });
    
  } catch (error) {
    console.error('Erro na ação em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Exportar pedidos
router.get('/orders/export', async (req, res) => {
  try {
    const { format = 'csv', status, dateFrom, dateTo } = req.query;
    
    let whereClause = '';
    let queryParams = [];
    
    if (status && status !== 'all') {
      whereClause += ' WHERE o.status = ?';
      queryParams.push(status);
    }
    
    if (dateFrom) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} DATE(o.created_at) >= ?`;
      queryParams.push(dateFrom);
    }
    
    if (dateTo) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} DATE(o.created_at) <= ?`;
      queryParams.push(dateTo);
    }
    
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.status,
        o.total,
        o.nome as customer_name,
        o.email as customer_email,
        o.telefone as customer_phone,
        o.metodo_pagamento as payment_method,
        o.created_at,
        c.nome as customer_nome,
        c.email as customer_email_real
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `, queryParams);
    
    if (format === 'csv') {
      const csv = [
        'ID,Status,Total,Cliente,Email,Telefone,Forma Pagamento,Data',
        ...orders.map(order => [
          order.id,
          order.status,
          order.total,
          order.customer_nome || order.customer_name || 'N/A',
          order.customer_email_real || order.customer_email || 'N/A',
          order.customer_phone || 'N/A',
          order.payment_method || 'N/A',
          order.created_at
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=pedidos.csv');
      res.send(csv);
    } else {
      res.json(orders);
    }
    
  } catch (error) {
    console.error('Erro ao exportar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
