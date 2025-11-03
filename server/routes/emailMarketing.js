const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Middleware de autenticação simples (implementar conforme necessário)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  // Implementar validação real do token aqui
  next();
};

// Newsletter - Enviar para todos os clientes
router.post('/newsletter/send', authenticateToken, async (req, res) => {
  try {
    const { subject, products, offers } = req.body;
    
    // Buscar todos os clientes ativos (implementar query real)
    const customers = [
      { email: 'cliente1@email.com', name: 'João Silva' },
      { email: 'cliente2@email.com', name: 'Maria Santos' }
    ];
    
    const results = [];
    
    for (const customer of customers) {
      const result = await emailService.sendNewsletter({
        to: customer.email,
        customerName: customer.name,
        products: products || [],
        offers: offers || []
      });
      
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `Newsletter enviada para ${results.length} clientes`,
      results: results.filter(r => r.success).length,
      errors: results.filter(r => !r.success).length
    });
  } catch (error) {
    console.error('Erro ao enviar newsletter:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Recuperação de carrinho abandonado
router.post('/cart-recovery/send', async (req, res) => {
  try {
    const { email, customerName, cartItems, totalValue, discountCode } = req.body;
    
    const result = await emailService.sendCartRecovery({
      to: email,
      customerName,
      cartItems,
      totalValue,
      discountCode
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar recuperação de carrinho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Confirmação de pedido
router.post('/order-confirmation/send', async (req, res) => {
  try {
    const { email, customerName, order, trackingCode } = req.body;
    
    const result = await emailService.sendOrderConfirmation({
      to: email,
      customerName,
      order,
      trackingCode
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar confirmação de pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualização de entrega
router.post('/delivery-update/send', async (req, res) => {
  try {
    const { email, customerName, order, status, trackingCode } = req.body;
    
    const result = await emailService.sendDeliveryUpdate({
      to: email,
      customerName,
      order,
      status,
      trackingCode
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar atualização de entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// E-mail de boas-vindas
router.post('/welcome/send', async (req, res) => {
  try {
    const { email, customerName } = req.body;
    
    const result = await emailService.sendWelcomeEmail({
      to: email,
      customerName
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar e-mail de boas-vindas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// E-mail de promoção
router.post('/promotion/send', authenticateToken, async (req, res) => {
  try {
    const { email, customerName, promotion, products } = req.body;
    
    const result = await emailService.sendPromotionEmail({
      to: email,
      customerName,
      promotion,
      products
    });
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar e-mail de promoção:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar para múltiplos clientes
router.post('/bulk/send', authenticateToken, async (req, res) => {
  try {
    const { emails, subject, template, data } = req.body;
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lista de e-mails é obrigatória'
      });
    }
    
    const results = [];
    
    for (const email of emails) {
      const result = await emailService.sendEmail({
        to: email,
        subject,
        template,
        data: { ...data, customerName: email.split('@')[0] }
      });
      
      results.push(result);
    }
    
    res.json({
      success: true,
      message: `E-mails enviados para ${emails.length} destinatários`,
      results: results.filter(r => r.success).length,
      errors: results.filter(r => !r.success).length,
      details: results
    });
  } catch (error) {
    console.error('Erro ao enviar e-mails em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Testar configuração de e-mail
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const testEmail = req.query.email || 'teste@exemplo.com';
    
    const result = await emailService.sendEmail({
      to: testEmail,
      subject: 'Teste de Configuração - MuhlStore',
      template: 'welcome',
      data: {
        customerName: 'Usuário de Teste',
        currentDate: new Date().toLocaleDateString('pt-BR'),
        shopLink: process.env.FRONTEND_URL || 'http://localhost:8040'
      }
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'E-mail de teste enviado com sucesso' : 'Erro ao enviar e-mail de teste',
      details: result
    });
  } catch (error) {
    console.error('Erro no teste de e-mail:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Estatísticas de e-mail marketing
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Implementar estatísticas reais do banco de dados
    const stats = {
      totalSent: 1250,
      totalOpened: 890,
      totalClicked: 234,
      openRate: 71.2,
      clickRate: 18.7,
      bounceRate: 2.1,
      unsubscribeRate: 0.8,
      topTemplates: [
        { name: 'Newsletter', sent: 450, opened: 320, clicked: 89 },
        { name: 'Cart Recovery', sent: 300, opened: 180, clicked: 45 },
        { name: 'Order Confirmation', sent: 200, opened: 195, clicked: 12 },
        { name: 'Promotion', sent: 300, opened: 195, clicked: 88 }
      ],
      recentCampaigns: [
        { name: 'Black Friday 2025', sent: 500, opened: 380, clicked: 95 },
        { name: 'Novidades de Natal', sent: 300, opened: 210, clicked: 67 },
        { name: 'Promoção de Verão', sent: 450, opened: 300, clicked: 72 }
      ]
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
