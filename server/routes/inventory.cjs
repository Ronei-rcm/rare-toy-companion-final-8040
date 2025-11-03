const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService.cjs');
const supplierService = require('../services/supplierService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== ESTOQUE =====

// Atualizar estoque
router.post('/stock/update', authenticateToken, async (req, res) => {
  try {
    const {
      productId,
      quantity,
      movementType,
      reason,
      referenceId,
      referenceType,
      costPerUnit,
      createdBy
    } = req.body;

    const result = await inventoryService.updateStock(
      productId,
      quantity,
      movementType,
      reason,
      referenceId,
      referenceType,
      costPerUnit,
      createdBy
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Ajustar estoque manualmente
router.post('/stock/adjust', authenticateToken, async (req, res) => {
  try {
    const { productId, newQuantity, reason, createdBy } = req.body;

    const result = await inventoryService.adjustStock(
      productId,
      newQuantity,
      reason,
      createdBy
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao ajustar estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Processar venda
router.post('/stock/sale', async (req, res) => {
  try {
    const { orderId, orderItems } = req.body;

    const result = await inventoryService.processSale(orderId, orderItems);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar venda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Processar devolução
router.post('/stock/return', async (req, res) => {
  try {
    const { orderId, returnItems } = req.body;

    const result = await inventoryService.processReturn(orderId, returnItems);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar devolução:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter movimentações de estoque
router.get('/movements', authenticateToken, async (req, res) => {
  try {
    const filters = {
      productId: req.query.product_id,
      movementType: req.query.movement_type,
      dateFrom: req.query.date_from,
      dateTo: req.query.date_to,
      limit: req.query.limit
    };

    const result = await inventoryService.getInventoryMovements(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter movimentações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter alertas de estoque
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const filters = {
      isActive: req.query.is_active,
      alertType: req.query.alert_type,
      limit: req.query.limit
    };

    const result = await inventoryService.getStockAlerts(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Resolver alerta de estoque
router.put('/alerts/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await inventoryService.resolveStockAlert(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter produtos com estoque baixo
router.get('/low-stock', authenticateToken, async (req, res) => {
  try {
    const result = await inventoryService.getLowStockProducts();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter produtos com estoque baixo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter produtos sem estoque
router.get('/out-of-stock', authenticateToken, async (req, res) => {
  try {
    const result = await inventoryService.getOutOfStockProducts();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter produtos sem estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter relatório de estoque
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const result = await inventoryService.getInventoryReport();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter relatório de estoque:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== FORNECEDORES =====

// Criar fornecedor
router.post('/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await supplierService.createSupplier(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar fornecedores
router.get('/suppliers', authenticateToken, async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      search: req.query.search,
      limit: req.query.limit
    };

    const result = await supplierService.getSuppliers(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter fornecedor por ID
router.get('/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supplierService.getSupplierById(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar fornecedor
router.put('/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supplierService.updateSupplier(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Deletar fornecedor
router.delete('/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supplierService.deleteSupplier(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== PEDIDOS DE COMPRA =====

// Criar pedido de compra
router.post('/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const result = await supplierService.createPurchaseOrder(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar pedido de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar pedidos de compra
router.get('/purchase-orders', authenticateToken, async (req, res) => {
  try {
    const filters = {
      supplier_id: req.query.supplier_id,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const result = await supplierService.getPurchaseOrders(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar pedidos de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter pedido de compra com itens
router.get('/purchase-orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supplierService.getPurchaseOrderWithItems(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter pedido de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar status do pedido de compra
router.put('/purchase-orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await supplierService.updatePurchaseOrderStatus(id, status, notes);
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

// Processar recebimento de mercadoria
router.post('/purchase-orders/:id/receive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;

    const result = await supplierService.processReceipt(id, receivedItems);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar recebimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas de fornecedores
router.get('/suppliers/stats', authenticateToken, async (req, res) => {
  try {
    const result = await supplierService.getSupplierStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas de fornecedores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Gerar relatório de fornecedor
router.get('/suppliers/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await supplierService.generateSupplierReport(id, date_from, date_to);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório de fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
