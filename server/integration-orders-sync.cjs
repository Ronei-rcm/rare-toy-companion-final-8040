// Integração do sistema unificado de pedidos no servidor principal
// Este arquivo deve ser integrado ao server.cjs

const { setupOrderWebSocket, emitOrderUpdate, emitOrderComment } = require('./websocket-orders.cjs');
const { router: ordersSyncRouter } = require('./routes/orders-sync.cjs');

// ==================== INTEGRAÇÃO NO SERVIDOR ====================

// Adicionar estas linhas no server.cjs após as outras rotas:

// 1. Importar as rotas de sincronização
// const ordersSyncRouter = require('./routes/orders-sync.cjs');
// app.use('/api/orders', ordersSyncRouter);

// 2. Configurar WebSocket (após criar o servidor HTTP)
// const http = require('http');
// const server = http.createServer(app);
// const io = setupOrderWebSocket(server);

// 3. Tornar o io disponível para as rotas
// app.set('io', io);

// 4. Substituir app.listen por server.listen
// server.listen(PORT, '0.0.0.0', () => {
//   console.log(`🚀 Servidor rodando na porta ${PORT}`);
//   console.log(`📡 WebSocket disponível em ws://localhost:${PORT}/ws/orders`);
// });

// ==================== ROTAS ADICIONAIS ====================

// Adicionar estas rotas no server.cjs:

// Rota para estatísticas de conexões WebSocket
app.get('/api/ws/stats', (req, res) => {
  try {
    const stats = getConnectionStats();
    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas WebSocket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para testar notificações (apenas para desenvolvimento)
app.post('/api/test/notification', (req, res) => {
  try {
    const { order_id, status, customer_email, message } = req.body;
    
    if (!order_id || !status) {
      return res.status(400).json({ error: 'order_id e status são obrigatórios' });
    }
    
    emitOrderUpdate(order_id, status, customer_email, message);
    
    res.json({
      success: true,
      message: 'Notificação de teste enviada',
      data: { order_id, status, customer_email }
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar timeline de um pedido específico
app.get('/api/orders/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    
    res.json(timeline);
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar comentários de um pedido
app.get('/api/orders/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { include_internal = false } = req.query;
    
    let whereClause = 'WHERE order_id = ?';
    let queryParams = [id];
    
    if (include_internal !== 'true') {
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

// Rota para adicionar comentário (admin)
app.post('/api/orders/:id/comments', async (req, res) => {
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
    
    // Emitir evento WebSocket
    emitOrderComment(id, comment, is_internal);
    
    res.json({ success: true, message: 'Comentário adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== MIDDLEWARE DE LOGGING ====================

// Middleware para logar atualizações de pedidos
const logOrderUpdate = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (req.method === 'PATCH' && req.path.includes('/status')) {
      console.log(`📦 Status do pedido ${req.params.id} atualizado via ${req.method} ${req.path}`);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Aplicar middleware nas rotas de pedidos
// app.use('/api/orders', logOrderUpdate);

// ==================== FUNÇÕES AUXILIARES ====================

// Função para sincronizar dados de pedidos entre admin e cliente
const syncOrderData = async (orderId) => {
  try {
    // Buscar dados atualizados do pedido
    const [orders] = await pool.execute(`
      SELECT o.*, c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);
    
    if (orders.length > 0) {
      const order = orders[0];
      
      // Emitir evento de sincronização
      if (app.get('io')) {
        app.get('io').emit('order_synced', {
          order_id: orderId,
          status: order.status,
          customer_email: order.customer_email,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`🔄 Pedido ${orderId} sincronizado`);
    }
  } catch (error) {
    console.error('Erro ao sincronizar pedido:', error);
  }
};

// Função para limpar cache de métricas expiradas
const cleanupExpiredMetrics = async () => {
  try {
    await pool.execute(`
      DELETE FROM order_metrics_cache 
      WHERE expires_at < NOW()
    `);
    
    console.log('🧹 Cache de métricas limpo');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
};

// Executar limpeza a cada hora
// setInterval(cleanupExpiredMetrics, 60 * 60 * 1000);

module.exports = {
  ordersSyncRouter,
  setupOrderWebSocket,
  emitOrderUpdate,
  emitOrderComment,
  syncOrderData,
  cleanupExpiredMetrics
};

