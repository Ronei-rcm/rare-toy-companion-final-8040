const express = require('express');
const router = express.Router();
const couponService = require('../services/couponService.cjs');
const loyaltyService = require('../services/loyaltyService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== CUPONS =====

// Criar cupom
router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await couponService.createCoupon(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar cupons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_active, type, search, limit } = req.query;
    const filters = { is_active, type, search, limit };
    
    const result = await couponService.getCoupons(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Buscar cupom por código
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount } = req.query;
    
    const result = await couponService.validateCoupon(code, parseFloat(orderAmount) || 0);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Aplicar cupom
router.post('/apply', async (req, res) => {
  try {
    const { code, orderId, userId, orderAmount } = req.body;
    
    const result = await couponService.applyCoupon(code, orderId, userId, orderAmount);
    res.json(result);
  } catch (error) {
    console.error('Erro ao aplicar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar cupom
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await couponService.updateCoupon(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Deletar cupom
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await couponService.deleteCoupon(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Estatísticas de cupons
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await couponService.getCouponStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de cupons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar cupons automáticos
router.post('/create-automatic', authenticateToken, async (req, res) => {
  try {
    const result = await couponService.createAutomaticCoupons();
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar cupons automáticos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== PROGRAMA DE FIDELIDADE =====

// Inicializar programa de fidelidade
router.post('/loyalty/initialize', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await loyaltyService.initializeUserLoyalty(userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao inicializar programa de fidelidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter status de fidelidade
router.get('/loyalty/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await loyaltyService.getLoyaltyStatus(userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter status de fidelidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Adicionar pontos
router.post('/loyalty/add-points', async (req, res) => {
  try {
    const { userId, points, type, description, orderId } = req.body;
    const result = await loyaltyService.addPoints(userId, points, type, description, orderId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Resgatar pontos
router.post('/loyalty/redeem', async (req, res) => {
  try {
    const { userId, points, orderId } = req.body;
    const result = await loyaltyService.redeemPoints(userId, points, orderId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao resgatar pontos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Processar compra
router.post('/loyalty/process-purchase', async (req, res) => {
  try {
    const { userId, orderId, orderAmount } = req.body;
    const result = await loyaltyService.processPurchase(userId, orderId, orderAmount);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar compra:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Histórico de transações
router.get('/loyalty/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    const result = await loyaltyService.getTransactionHistory(userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter histórico de transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Estatísticas de fidelidade
router.get('/loyalty/stats', authenticateToken, async (req, res) => {
  try {
    const result = await loyaltyService.getLoyaltyStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas de fidelidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
