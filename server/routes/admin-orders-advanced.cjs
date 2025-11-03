// API Avançada para Gestão de Pedidos - Sistema Completo de Gerenciamento
const express = require('express');
const mysql = require('mysql2/promise');
// const { authenticateAdmin } = require('./middleware/auth.cjs');

// Configuração do banco de dados
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4'
});

const router = express.Router();

// Middleware de autenticação para todas as rotas (temporariamente desabilitado para teste)
// router.use(authenticateAdmin);

// GET /api/admin/orders-advanced - Lista pedidos com dados completos
router.get('/orders-advanced', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      customer_id,
      search, 
      sort = 'created_at', 
      order = 'DESC',
      priority,
      payment_method,
      date_from,
      date_to
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Construir query base com JOINs para dados completos
    let whereClause = '';
    let queryParams = [];
    
    // Filtro por status
    if (status && status !== 'all') {
      whereClause += ' WHERE o.status = ?';
      queryParams.push(status);
    }
    
    // Filtro por cliente
    if (customer_id && customer_id !== 'all') {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} o.customer_id = ?`;
      queryParams.push(customer_id);
    }
    
    // Filtro por prioridade (comentado - coluna não existe)
    // if (priority && priority !== 'all') {
    //   const condition = whereClause ? ' AND' : ' WHERE';
    //   whereClause += `${condition} o.priority = ?`;
    //   queryParams.push(priority);
    // }
    
    // Filtro por método de pagamento
    if (payment_method && payment_method !== 'all') {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} o.metodo_pagamento = ?`;
      queryParams.push(payment_method);
    }
    
    // Filtro por data
    if (date_from) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} DATE(o.created_at) >= ?`;
      queryParams.push(date_from);
    }
    
    if (date_to) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} DATE(o.created_at) <= ?`;
      queryParams.push(date_to);
    }
    
    // Filtro por busca (nome, email, ID do pedido)
    if (search) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} (
        o.id LIKE ? OR 
        o.nome LIKE ? OR 
        o.email LIKE ? OR 
        o.telefone LIKE ? OR
        c.nome LIKE ? OR
        c.email LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Query principal com dados completos do cliente
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.customer_id,
        o.user_id,
        o.status,
        o.total,
        o.nome as customer_name,
        o.email as customer_email,
        o.telefone as customer_phone,
        o.metodo_pagamento as payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        o.endereco as shipping_address,
        c.nome as customer_nome,
        c.email as customer_email_real,
        c.telefone as customer_telefone_real,
        c.created_at as customer_registration,
        c.status as customer_status,
        COALESCE(customer_stats.total_orders, 0) as customer_total_orders,
        COALESCE(customer_stats.total_spent, 0) as customer_total_spent,
        COALESCE(customer_stats.last_order, o.created_at) as customer_last_order,
        COALESCE(customer_stats.average_ticket, o.total) as customer_average_ticket,
        CASE 
          WHEN COALESCE(customer_stats.total_orders, 0) = 0 THEN 'new'
          WHEN COALESCE(customer_stats.total_orders, 0) BETWEEN 1 AND 5 THEN 'regular'
          WHEN COALESCE(customer_stats.total_orders, 0) BETWEEN 6 AND 20 THEN 'vip'
          ELSE 'premium'
        END as customer_type
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN (
        SELECT 
          customer_id,
          COUNT(*) as total_orders,
          SUM(total) as total_spent,
          MAX(created_at) as last_order,
          AVG(total) as average_ticket
        FROM orders 
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ) customer_stats ON o.customer_id = customer_stats.customer_id
      ${whereClause}
      ORDER BY o.${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
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
            p.categoria as category,
            p.marca as brand,
            p.codigo_barras as sku,
            p.estoque as product_stock
          FROM order_items oi
          LEFT JOIN produtos p ON CAST(oi.product_id AS CHAR) = CAST(p.id AS CHAR) COLLATE utf8mb4_general_ci
          WHERE oi.order_id = ?
          ORDER BY oi.created_at ASC
        `, [order.id]);
        
        return {
          ...order,
          items: items,
          customer_history: {
            total_orders: order.customer_total_orders || 0,
            total_spent: order.customer_total_spent || 0,
            last_order: order.customer_last_order || order.created_at,
            average_ticket: order.customer_average_ticket || order.total,
            customer_type: order.customer_type || 'new'
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
    console.error('Erro ao buscar pedidos avançados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/customers-advanced - Lista clientes com dados completos
router.get('/customers-advanced', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      customer_type,
      status,
      sort = 'created_at', 
      order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    
    // Filtro por tipo de cliente
    if (customer_type && customer_type !== 'all') {
      whereClause += ' WHERE c.customer_type = ?';
      queryParams.push(customer_type);
    }
    
    // Filtro por status
    if (status && status !== 'all') {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} c.status = ?`;
      queryParams.push(status);
    }
    
    // Filtro por busca
    if (search) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} (
        c.nome LIKE ? OR 
        c.email LIKE ? OR 
        c.telefone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const [customers] = await pool.execute(`
      SELECT 
        c.id,
        c.nome as name,
        c.email,
        c.telefone as phone,
        c.created_at as registration_date,
        c.status,
        COALESCE(customer_stats.total_orders, 0) as total_orders,
        COALESCE(customer_stats.total_spent, 0) as total_spent,
        COALESCE(customer_stats.last_order, c.created_at) as last_order,
        COALESCE(customer_stats.average_ticket, 0) as average_ticket,
        CASE 
          WHEN COALESCE(customer_stats.total_orders, 0) = 0 THEN 'new'
          WHEN COALESCE(customer_stats.total_orders, 0) BETWEEN 1 AND 5 THEN 'regular'
          WHEN COALESCE(customer_stats.total_orders, 0) BETWEEN 6 AND 20 THEN 'vip'
          ELSE 'premium'
        END as customer_type
      FROM customers c
      LEFT JOIN (
        SELECT 
          customer_id,
          COUNT(*) as total_orders,
          SUM(total) as total_spent,
          MAX(created_at) as last_order,
          AVG(total) as average_ticket
        FROM orders 
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ) customer_stats ON c.id = customer_stats.customer_id
      ${whereClause}
      ORDER BY c.${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);
    
    // Contar total de clientes
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `, queryParams);
    
    const total = countResult[0].total;
    
    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar clientes avançados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/orders-stats-advanced - Estatísticas avançadas
router.get('/orders-stats-advanced', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let dateFilter = '';
    let queryParams = [];
    
    if (date_from) {
      dateFilter += ' WHERE DATE(created_at) >= ?';
      queryParams.push(date_from);
    }
    
    if (date_to) {
      const condition = dateFilter ? ' AND' : ' WHERE';
      dateFilter += `${condition} DATE(created_at) <= ?`;
      queryParams.push(date_to);
    }
    
    // Estatísticas básicas
    const [basicStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        AVG(total) as average_ticket,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) as today_revenue
      FROM orders
      ${dateFilter}
    `, queryParams);
    
    // Estatísticas de clientes
    const [customerStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() AND customer_id NOT IN (
          SELECT DISTINCT customer_id FROM orders WHERE DATE(created_at) < CURDATE()
        ) THEN 1 END) as new_customers_today
      FROM orders
      WHERE customer_id IS NOT NULL
      ${dateFilter}
    `, queryParams);
    
    // Top clientes
    const [topCustomers] = await pool.execute(`
      SELECT 
        c.id,
        c.nome as name,
        c.email,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_spent,
        AVG(o.total) as average_ticket
      FROM customers c
      JOIN orders o ON c.id = o.customer_id
      ${dateFilter}
      GROUP BY c.id, c.nome, c.email
      ORDER BY total_spent DESC
      LIMIT 10
    `, queryParams);
    
    // Pedidos recentes
    const [recentOrders] = await pool.execute(`
      SELECT 
        o.id,
        o.customer_id,
        o.total,
        o.status,
        o.created_at,
        c.nome as customer_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${dateFilter}
      ORDER BY o.created_at DESC
      LIMIT 10
    `, queryParams);
    
    // Taxa de conversão (simulada)
    const conversion_rate = 0.15; // 15% - seria calculado com dados reais de visitantes
    
    const stats = {
      ...basicStats[0],
      ...customerStats[0],
      conversion_rate,
      top_customers: topCustomers,
      recent_orders: recentOrders
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas avançadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/orders/:id/status - Atualizar status do pedido
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    res.json({ success: true, message: 'Status atualizado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/orders/:id/tracking - Atualizar código de rastreamento
router.patch('/orders/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_code } = req.body;
    
    await pool.execute(
      'UPDATE orders SET tracking_code = ?, updated_at = NOW() WHERE id = ?',
      [tracking_code, id]
    );
    
    res.json({ success: true, message: 'Código de rastreamento atualizado' });
    
  } catch (error) {
    console.error('Erro ao atualizar código de rastreamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/orders/:id/notes - Adicionar nota ao pedido
router.post('/orders/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note) {
      return res.status(400).json({ error: 'Nota é obrigatória' });
    }
    
    // Buscar nota atual
    const [currentOrder] = await pool.execute(
      'SELECT notes FROM orders WHERE id = ?',
      [id]
    );
    
    const currentNotes = currentOrder[0]?.notes || '';
    const newNotes = currentNotes ? `${currentNotes}\n${new Date().toISOString()}: ${note}` : `${new Date().toISOString()}: ${note}`;
    
    await pool.execute(
      'UPDATE orders SET notes = ?, updated_at = NOW() WHERE id = ?',
      [newNotes, id]
    );
    
    res.json({ success: true, message: 'Nota adicionada com sucesso' });
    
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/orders/export - Exportar pedidos
router.post('/orders/export', async (req, res) => {
  try {
    const { filters } = req.body;
    
    // Construir query baseada nos filtros
    let whereClause = '';
    let queryParams = [];
    
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      whereClause += ' WHERE o.status = ?';
      queryParams.push(filters.statusFilter);
    }
    
    if (filters.customerFilter && filters.customerFilter !== 'all') {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} o.customer_id = ?`;
      queryParams.push(filters.customerFilter);
    }
    
    if (filters.searchTerm) {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} (
        o.id LIKE ? OR 
        o.nome LIKE ? OR 
        o.email LIKE ? OR 
        o.telefone LIKE ?
      )`;
      const searchTerm = `%${filters.searchTerm}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.status,
        o.total,
        o.payment_method,
        o.created_at,
        o.nome as customer_name,
        o.email as customer_email,
        o.telefone as customer_phone,
        c.nome as customer_nome,
        c.email as customer_email_real
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `, queryParams);
    
    // Gerar CSV
    const csvHeader = 'ID,Status,Total,Método de Pagamento,Data,Cliente,Email,Telefone\n';
    const csvRows = orders.map(order => 
      `${order.id},${order.status},${order.total},${order.payment_method},${order.created_at},${order.customer_name || order.customer_nome},${order.customer_email || order.customer_email_real},${order.customer_phone}\n`
    ).join('');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pedidos.csv');
    res.send(csv);
    
  } catch (error) {
    console.error('Erro ao exportar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/orders/:id - Buscar pedido específico
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        c.nome as customer_nome,
        c.email as customer_email,
        c.telefone as customer_telefone
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
        oi.*,
        p.nome as product_name,
        p.imagem_url as product_image,
        p.categoria as category,
        p.marca as brand,
        p.sku
      FROM order_items oi
      LEFT JOIN produtos p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.created_at ASC
    `, [id]);
    
    order.items = items;
    
    res.json(order);
    
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/customers/:id/orders - Buscar pedidos de um cliente específico
router.get('/customers/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [orders] = await pool.execute(`
      SELECT 
        o.id,
        o.status,
        o.total,
        o.payment_method,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), offset]);
    
    // Contar total de pedidos do cliente
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = ?',
      [id]
    );
    
    const total = countResult[0].total;
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
