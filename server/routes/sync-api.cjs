const express = require('express');
const router = express.Router();

// Configuração do pool de conexão MySQL
const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// ==================== ESTATÍSTICAS DE SINCRONIZAÇÃO ====================

// GET /api/admin/sync/stats - Estatísticas gerais de sincronização
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/admin/sync/stats - Buscando estatísticas de sincronização');

    // Estatísticas de clientes
    const [clientesStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_clientes,
        SUM(CASE WHEN sync_status = 'sincronizado' THEN 1 ELSE 0 END) as clientes_sincronizados,
        SUM(CASE WHEN sync_status = 'pendente' THEN 1 ELSE 0 END) as clientes_pendentes,
        SUM(CASE WHEN sync_status = 'erro' THEN 1 ELSE 0 END) as clientes_com_erro,
        SUM(CASE WHEN sync_status IS NULL THEN 1 ELSE 0 END) as clientes_nunca_sincronizados
      FROM users
    `);

    // Estatísticas de pedidos
    const [pedidosStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(CASE WHEN sync_status = 'sincronizado' THEN 1 ELSE 0 END) as pedidos_sincronizados,
        SUM(CASE WHEN sync_status = 'pendente' THEN 1 ELSE 0 END) as pedidos_pendentes,
        SUM(CASE WHEN sync_status = 'erro' THEN 1 ELSE 0 END) as pedidos_com_erro,
        SUM(CASE WHEN sync_status IS NULL THEN 1 ELSE 0 END) as pedidos_nunca_sincronizados
      FROM orders
    `);

    // Última sincronização
    const [lastSync] = await pool.execute(`
      SELECT MAX(created_at) as ultima_sincronizacao
      FROM sync_logs
      WHERE status = 'sucesso'
    `);

    // Calcular taxa de sucesso
    const clientes = clientesStats[0];
    const pedidos = pedidosStats[0];
    const totalSincronizados = clientes.clientes_sincronizados + pedidos.pedidos_sincronizados;
    const total = clientes.total_clientes + pedidos.total_pedidos;
    const taxaSucesso = total > 0 ? (totalSincronizados / total) * 100 : 0;

    const stats = {
      total_clientes: clientes.total_clientes,
      clientes_sincronizados: clientes.clientes_sincronizados,
      clientes_pendentes: clientes.clientes_pendentes,
      clientes_com_erro: clientes.clientes_com_erro,
      total_pedidos: pedidos.total_pedidos,
      pedidos_sincronizados: pedidos.pedidos_sincronizados,
      pedidos_pendentes: pedidos.pedidos_pendentes,
      pedidos_com_erro: pedidos.pedidos_com_erro,
      ultima_sincronizacao: lastSync[0]?.ultima_sincronizacao || new Date().toISOString(),
      proxima_sincronizacao: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
      taxa_sucesso: taxaSucesso
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== STATUS DE SINCRONIZAÇÃO DE CLIENTES ====================

// GET /api/admin/clients/sync-status - Clientes com status de sincronização
router.get('/clients/sync-status', async (req, res) => {
  try {
    console.log('👥 GET /api/admin/clients/sync-status - Buscando clientes com status de sincronização');

    const [clientes] = await pool.execute(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.created_at,
        u.updated_at,
        u.last_login,
        COALESCE(c.total_pedidos, 0) as total_pedidos,
        COALESCE(c.total_gasto, 0) as total_gasto,
        'ativo' as status,
        CASE 
          WHEN c.total_pedidos >= 10 THEN 'vip'
          WHEN c.total_pedidos >= 3 THEN 'frequente'
          WHEN c.total_pedidos > 0 THEN 'novo'
          ELSE 'inativo'
        END as segmento,
        COALESCE(u.sync_status, 'nunca_sincronizado') as sync_status,
        u.last_sync,
        u.sync_errors
      FROM users u
      LEFT JOIN (
        SELECT 
          customer_id,
          COUNT(*) as total_pedidos,
          SUM(total) as total_gasto
        FROM orders 
        WHERE customer_id IS NOT NULL
        GROUP BY customer_id
      ) c ON u.id = c.customer_id
      ORDER BY u.created_at DESC
    `);

    res.json({ clientes });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes com status de sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== STATUS DE SINCRONIZAÇÃO DE PEDIDOS ====================

// GET /api/admin/orders/sync-status - Pedidos com status de sincronização
router.get('/orders/sync-status', async (req, res) => {
  try {
    console.log('📦 GET /api/admin/orders/sync-status - Buscando pedidos com status de sincronização');

    const [pedidos] = await pool.execute(`
      SELECT 
        o.id,
        o.customer_id,
        o.user_id,
        o.status,
        o.total,
        o.created_at,
        o.updated_at,
        o.payment_method,
        o.payment_status,
        o.tracking_code,
        o.shipping_address,
        COALESCE(o.sync_status, 'nunca_sincronizado') as sync_status,
        o.last_sync,
        o.sync_errors,
        u.nome as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id OR o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json({ pedidos });
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos com status de sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== LOGS DE SINCRONIZAÇÃO ====================

// GET /api/admin/sync/logs - Logs de sincronização
router.get('/logs', async (req, res) => {
  try {
    console.log('📝 GET /api/admin/sync/logs - Buscando logs de sincronização');

    const { limit = 100, offset = 0, tipo, status } = req.query;

    let whereClause = '';
    const queryParams = [];

    if (tipo) {
      whereClause += ' AND tipo = ?';
      queryParams.push(tipo);
    }

    if (status) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    const [logs] = await pool.execute(`
      SELECT 
        id,
        tipo,
        acao,
        entidade_id,
        entidade_nome,
        detalhes,
        status,
        timestamp,
        duracao_ms,
        erro
      FROM sync_logs
      WHERE 1=1 ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    res.json({ logs });
  } catch (error) {
    console.error('❌ Erro ao buscar logs de sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== EXECUÇÃO DE SINCRONIZAÇÃO ====================

// POST /api/admin/sync/execute - Executar sincronização
router.post('/execute', async (req, res) => {
  try {
    const { tipo, ids = [] } = req.body;
    console.log(`🔄 POST /api/admin/sync/execute - Executando sincronização ${tipo}`, ids);

    const startTime = Date.now();
    let sincronizados = 0;
    let erros = 0;
    const errors = [];

    // Registrar início da sincronização
    const syncId = require('crypto').randomUUID();
    await pool.execute(`
      INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp)
      VALUES (?, 'sistema', 'iniciado', ?, 'Sistema', 'Início da sincronização', 'pendente', NOW())
    `, [syncId, syncId]);

    if (tipo === 'clientes' || tipo === 'todos') {
      // Sincronizar clientes
      const clientesToSync = ids.length > 0 ? ids : await getClientesToSync();
      
      for (const clienteId of clientesToSync) {
        try {
          await syncCliente(clienteId);
          sincronizados++;
        } catch (error) {
          erros++;
          errors.push(`Cliente ${clienteId}: ${error.message}`);
          console.error(`❌ Erro ao sincronizar cliente ${clienteId}:`, error);
        }
      }
    }

    if (tipo === 'pedidos' || tipo === 'todos') {
      // Sincronizar pedidos
      const pedidosToSync = ids.length > 0 ? ids : await getPedidosToSync();
      
      for (const pedidoId of pedidosToSync) {
        try {
          await syncPedido(pedidoId);
          sincronizados++;
        } catch (error) {
          erros++;
          errors.push(`Pedido ${pedidoId}: ${error.message}`);
          console.error(`❌ Erro ao sincronizar pedido ${pedidoId}:`, error);
        }
      }
    }

    const duracao = Date.now() - startTime;

    // Registrar fim da sincronização
    await pool.execute(`
      UPDATE sync_logs 
      SET 
        acao = 'finalizado',
        detalhes = ?,
        status = ?,
        duracao_ms = ?
      WHERE id = ?
    `, [
      `${sincronizados} sincronizados, ${erros} erros`,
      erros === 0 ? 'sucesso' : 'erro',
      duracao,
      syncId
    ]);

    res.json({
      success: true,
      sincronizados,
      erros,
      duracao_ms: duracao,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Erro na execução de sincronização:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// ==================== FUNÇÕES AUXILIARES ====================

// Buscar clientes que precisam ser sincronizados
async function getClientesToSync() {
  const [clientes] = await pool.execute(`
    SELECT id FROM users 
    WHERE sync_status IS NULL 
       OR sync_status = 'pendente' 
       OR sync_status = 'erro'
       OR last_sync < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return clientes.map(c => c.id);
}

// Buscar pedidos que precisam ser sincronizados
async function getPedidosToSync() {
  const [pedidos] = await pool.execute(`
    SELECT id FROM orders 
    WHERE sync_status IS NULL 
       OR sync_status = 'pendente' 
       OR sync_status = 'erro'
       OR last_sync < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return pedidos.map(p => p.id);
}

// Sincronizar um cliente específico
async function syncCliente(clienteId) {
  const startTime = Date.now();
  
  try {
    // Buscar dados do cliente
    const [clientes] = await pool.execute(`
      SELECT u.*, 
        COUNT(o.id) as total_pedidos,
        COALESCE(SUM(o.total), 0) as total_gasto,
        MAX(o.created_at) as ultimo_pedido
      FROM users u
      LEFT JOIN orders o ON u.id = o.customer_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [clienteId]);

    if (clientes.length === 0) {
      throw new Error('Cliente não encontrado');
    }

    const cliente = clientes[0];

    // Atualizar estatísticas do cliente
    await pool.execute(`
      UPDATE users 
      SET 
        total_pedidos = ?,
        total_gasto = ?,
        ultimo_pedido = ?,
        sync_status = 'sincronizado',
        last_sync = NOW(),
        sync_errors = NULL
      WHERE id = ?
    `, [
      cliente.total_pedidos,
      cliente.total_gasto,
      cliente.ultimo_pedido,
      clienteId
    ]);

    // Registrar log de sucesso
    const duracao = Date.now() - startTime;
    await pool.execute(`
      INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp, duracao_ms)
      VALUES (?, 'cliente', 'sincronizado', ?, ?, 'Cliente sincronizado com sucesso', 'sucesso', NOW(), ?)
    `, [require('crypto').randomUUID(), clienteId, cliente.nome, duracao]);

    console.log(`✅ Cliente ${clienteId} sincronizado com sucesso`);
  } catch (error) {
    // Registrar log de erro
    await pool.execute(`
      INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp, erro)
      VALUES (?, 'cliente', 'erro', ?, ?, 'Erro na sincronização', 'erro', NOW(), ?)
    `, [require('crypto').randomUUID(), clienteId, 'Cliente', error.message]);

    // Atualizar status de erro
    await pool.execute(`
      UPDATE users 
      SET 
        sync_status = 'erro',
        last_sync = NOW(),
        sync_errors = ?
      WHERE id = ?
    `, [error.message, clienteId]);

    throw error;
  }
}

// Sincronizar um pedido específico
async function syncPedido(pedidoId) {
  const startTime = Date.now();
  
  try {
    // Buscar dados do pedido
    const [pedidos] = await pool.execute(`
      SELECT o.*, u.nome as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [pedidoId]);

    if (pedidos.length === 0) {
      throw new Error('Pedido não encontrado');
    }

    const pedido = pedidos[0];

    // Verificar se o pedido tem cliente associado
    if (pedido.customer_id) {
      // Atualizar estatísticas do cliente
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_pedidos,
          SUM(total) as total_gasto,
          MAX(created_at) as ultimo_pedido
        FROM orders 
        WHERE customer_id = ?
      `, [pedido.customer_id]);

      const stat = stats[0];
      await pool.execute(`
        UPDATE users 
        SET 
          total_pedidos = ?,
          total_gasto = ?,
          ultimo_pedido = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [stat.total_pedidos, stat.total_gasto, stat.ultimo_pedido, pedido.customer_id]);
    }

    // Atualizar status de sincronização do pedido
    await pool.execute(`
      UPDATE orders 
      SET 
        sync_status = 'sincronizado',
        last_sync = NOW(),
        sync_errors = NULL,
        updated_at = NOW()
      WHERE id = ?
    `, [pedidoId]);

    // Registrar log de sucesso
    const duracao = Date.now() - startTime;
    await pool.execute(`
      INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp, duracao_ms)
      VALUES (?, 'pedido', 'sincronizado', ?, ?, 'Pedido sincronizado com sucesso', 'sucesso', NOW(), ?)
    `, [require('crypto').randomUUID(), pedidoId, `Pedido ${pedidoId}`, duracao]);

    console.log(`✅ Pedido ${pedidoId} sincronizado com sucesso`);
  } catch (error) {
    // Registrar log de erro
    await pool.execute(`
      INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp, erro)
      VALUES (?, 'pedido', 'erro', ?, ?, 'Erro na sincronização', 'erro', NOW(), ?)
    `, [require('crypto').randomUUID(), pedidoId, `Pedido ${pedidoId}`, error.message]);

    // Atualizar status de erro
    await pool.execute(`
      UPDATE orders 
      SET 
        sync_status = 'erro',
        last_sync = NOW(),
        sync_errors = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [error.message, pedidoId]);

    throw error;
  }
}

module.exports = router;
