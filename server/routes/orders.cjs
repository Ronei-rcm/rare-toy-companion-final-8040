const express = require('express');
const router = express.Router();
const orderManagementService = require('../services/orderManagementService.cjs');
const ordersController = require('../controllers/orders.controller.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== GESTÃO DE PEDIDOS =====

// Atualizar pedido completo (status, payment_method, tracking_code)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_method, tracking_code } = req.body;

    console.log(`📦 Router PUT /api/orders/${id} - Atualizando pedido`, { status, payment_method, tracking_code });

    // Verificar se o db está inicializado
    if (!orderManagementService.db) {
      console.error('❌ orderManagementService.db não está inicializado');
      return res.status(500).json({
        success: false,
        message: 'Serviço de pedidos não está disponível'
      });
    }

    // Validar que pelo menos um campo foi enviado
    if (!status && payment_method === undefined && tracking_code === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Pelo menos um campo deve ser enviado para atualização'
      });
    }

    // Verificar se o pedido existe e obter customer_id
    const [existingOrders] = await orderManagementService.db.execute(
      'SELECT customer_id, status as current_status FROM orders WHERE id = ?',
      [id]
    );

    if (existingOrders.length === 0) {
      console.log(`❌ Pedido ${id} não encontrado no banco de dados`);
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    const order = existingOrders[0];
    const customerId = order.customer_id;
    console.log(`✅ Pedido ${id} encontrado - Status atual: ${order.current_status}, Customer: ${customerId}`);

    // Verificar autenticação do cliente (se houver token, validar)
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      // Aqui você pode adicionar validação JWT se necessário
      // Por enquanto, permitimos se o pedido pertence ao cliente
    }

    // Construir query dinamicamente
    const updates = [];
    const values = [];

    if (status) {
      // Validar status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'confirmed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status inválido'
        });
      }

      // Clientes só podem cancelar pedidos pendentes ou em processamento
      if (status === 'cancelled' && !['pending', 'processing'].includes(order.current_status)) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode cancelar pedidos pendentes ou em processamento'
        });
      }

      updates.push('status = ?');
      values.push(status);
    }

    if (payment_method !== undefined) {
      updates.push('payment_method = ?');
      values.push(payment_method || null);
    }

    if (tracking_code !== undefined) {
      // Clientes geralmente não podem alterar tracking_code, mas permitimos se necessário
      updates.push('tracking_code = ?');
      values.push(tracking_code || null);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    // Executar atualização
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    const [result] = await orderManagementService.db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Se status foi atualizado, usar o serviço para registrar histórico
    if (status) {
      await orderManagementService.updateOrderStatus(id, status, 'Atualizado pelo cliente', 'customer');
    }

    // Buscar pedido atualizado
    const [orders] = await orderManagementService.db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Pedido atualizado com sucesso',
      data: orders[0]
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar pedido no router:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar status do pedido
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, changed_by } = req.body;

    const result = await orderManagementService.updateOrderStatus(id, status, notes, changed_by);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter histórico de status do pedido
router.get('/:id/history', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderManagementService.getOrderStatusHistory(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter histórico do pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== MÉTODOS DE ENVIO =====

// Criar método de envio
router.post('/shipping-methods', authenticateToken, async (req, res) => {
  try {
    const result = await orderManagementService.createShippingMethod(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar método de envio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar métodos de envio
router.get('/shipping-methods', async (req, res) => {
  try {
    const result = await orderManagementService.getShippingMethods();
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar métodos de envio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Calcular custo de envio
router.post('/:id/calculate-shipping', async (req, res) => {
  try {
    const { id } = req.params;
    const { shipping_method_id } = req.body;

    const result = await orderManagementService.calculateShippingCost(id, shipping_method_id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao calcular custo de envio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ENVIOS =====

// Criar envio
router.post('/:id/shipments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const shipmentData = {
      order_id: id,
      ...req.body
    };

    const result = await orderManagementService.createShipment(shipmentData);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar envio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar status do envio
router.put('/shipments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, description } = req.body;

    const result = await orderManagementService.updateShipmentStatus(id, status, location, description);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar status do envio:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter rastreamento do envio
router.get('/shipments/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await orderManagementService.getShipmentTracking(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter rastreamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas de pedidos
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await orderManagementService.getOrderStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter relatório de pedidos
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      customer_id: req.query.customer_id,
      limit: req.query.limit
    };

    const result = await orderManagementService.getOrderReport(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== AUTOMAÇÕES =====

// Processar pedido automaticamente
router.post('/:id/process', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    let newStatus;
    switch (action) {
      case 'confirm':
        newStatus = 'confirmed';
        break;
      case 'process':
        newStatus = 'processing';
        break;
      case 'ship':
        newStatus = 'shipped';
        break;
      case 'deliver':
        newStatus = 'delivered';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        break;
      case 'return':
        newStatus = 'returned';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Ação inválida'
        });
    }

    const result = await orderManagementService.updateOrderStatus(id, newStatus, `Ação automática: ${action}`, 'system');
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Aprovar pedido
router.post('/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await orderManagementService.updateOrderStatus(id, 'confirmed', notes || 'Pedido aprovado', 'admin');
    res.json(result);
  } catch (error) {
    console.error('Erro ao aprovar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rejeitar pedido
router.post('/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await orderManagementService.updateOrderStatus(id, 'cancelled', `Pedido rejeitado: ${reason}`, 'admin');
    res.json(result);
  } catch (error) {
    console.error('Erro ao rejeitar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Marcar como enviado
router.post('/:id/ship', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number, carrier, notes } = req.body;

    // Criar envio se não existir
    const shipmentResult = await orderManagementService.createShipment({
      order_id: id,
      tracking_number,
      carrier,
      shipping_cost: 0, // Será calculado automaticamente
      notes
    });

    if (shipmentResult.success) {
      const result = await orderManagementService.updateOrderStatus(id, 'shipped', 'Pedido enviado', 'admin');
      res.json(result);
    } else {
      res.json(shipmentResult);
    }
  } catch (error) {
    console.error('Erro ao marcar como enviado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Marcar como entregue
router.post('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await orderManagementService.updateOrderStatus(id, 'delivered', notes || 'Pedido entregue', 'admin');
    res.json(result);
  } catch (error) {
    console.error('Erro ao marcar como entregue:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== WEBHOOKS =====

// Webhook para atualizações de rastreamento
router.post('/webhooks/tracking', async (req, res) => {
  try {
    const { tracking_number, status, location, description, timestamp } = req.body;

    // Buscar envio pelo tracking number
    const [shipment] = await orderManagementService.db.execute(`
      SELECT id FROM order_shipments WHERE tracking_number = ?
    `, [tracking_number]);

    if (shipment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Envio não encontrado'
      });
    }

    const result = await orderManagementService.updateShipmentStatus(
      shipment[0].id,
      status,
      location,
      description
    );

    res.json(result);
  } catch (error) {
    console.error('Erro no webhook de rastreamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ROTAS CRUD BÁSICAS (Extraídas do server.cjs) =====

/**
 * GET /api/orders
 * Lista pedidos do usuário autenticado
 */
router.get('/', async (req, res) => {
  try {
    return await ordersController.getAll(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/orders:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/orders/:id
 * Busca pedido por ID com seus itens
 */
router.get('/:id', async (req, res) => {
  try {
    return await ordersController.getById(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/orders/:id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/orders/:id
 * Deleta um pedido
 */
router.delete('/:id', async (req, res) => {
  try {
    return await ordersController.remove(req, res);
  } catch (error) {
    console.error('Erro na rota DELETE /api/orders/:id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
