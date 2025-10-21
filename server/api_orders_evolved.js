// API simplificada para pedidos evoluído
app.get('/api/admin/orders-evolved', async (req, res) => {
  try {
    // Query simples sem JOIN para evitar erros
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        CASE 
          WHEN o.customer_id IS NOT NULL THEN 'Cliente Associado'
          WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
          ELSE 'Cliente Anônimo'
        END as customer_type
      FROM orders o
      ORDER BY o.created_at DESC
    `);

    // Transformar dados para facilitar o uso no frontend
    const ordersWithCustomer = orders.map(order => ({
      ...order,
      customer: order.customer_id ? {
        id: order.customer_id,
        nome: order.nome || 'Cliente Associado',
        email: order.email || 'Email não informado',
        telefone: order.telefone || 'Telefone não informado',
        total_pedidos: 1,
        total_gasto: order.total || 0,
        ultimo_pedido: order.created_at,
      } : null
    }));

    res.json(ordersWithCustomer);
  } catch (error) {
    console.error('Erro ao buscar pedidos evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas simplificadas
app.get('/api/admin/orders-stats-evolved', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(total) as totalRevenue,
        AVG(total) as averageTicket,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as todayOrders,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) as todayRevenue,
        COUNT(DISTINCT customer_id) as totalCustomers,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND customer_id IS NOT NULL THEN 1 ELSE 0 END) as newCustomers
      FROM orders
    `);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Erro ao buscar estatísticas evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
