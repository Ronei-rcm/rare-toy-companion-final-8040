const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService.cjs');
const whatsappService = require('../services/whatsappService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== NOTIFICAÇÕES =====

// Criar notificação
router.post('/', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.createNotification(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar notificação
router.post('/:id/send', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await notificationService.sendNotification(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar notificações do usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await notificationService.getUserNotifications(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar notificações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Marcar notificação como lida
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const result = await notificationService.markAsRead(id, userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== TEMPLATES =====

// Criar template
router.post('/templates', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.createTemplate(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar notificação com template
router.post('/templates/:templateId/send', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { userId, variables = {} } = req.body;
    
    const result = await notificationService.sendTemplateNotification(
      templateId, 
      userId, 
      variables
    );
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar notificação com template:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== PREFERÊNCIAS =====

// Atualizar preferências de notificação
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await notificationService.updateNotificationPreferences(
      userId, 
      req.body
    );
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas de notificações
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.getNotificationStats();
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

// Processar notificações agendadas
router.post('/process-scheduled', authenticateToken, async (req, res) => {
  try {
    const result = await notificationService.processScheduledNotifications();
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar notificações agendadas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== WHATSAPP =====

// Enviar mensagem WhatsApp
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { phone, message, type = 'text' } = req.body;
    
    let result;
    switch (type) {
      case 'text':
        result = await whatsappService.sendTextMessage(phone, message);
        break;
      case 'template':
        result = await whatsappService.sendTemplateMessage(phone, message.template, message.variables);
        break;
      case 'media':
        result = await whatsappService.sendMediaMessage(phone, message.url, message.mediaType, message.caption);
        break;
      case 'interactive':
        result = await whatsappService.sendInteractiveMessage(phone, message.text, message.buttons);
        break;
      case 'list':
        result = await whatsappService.sendListMessage(phone, message.text, message.sections);
        break;
      default:
        result = { success: false, error: 'Tipo de mensagem não suportado' };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Webhook do WhatsApp
router.post('/whatsapp/webhook', async (req, res) => {
  try {
    const result = await whatsappService.processWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar webhook WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Estatísticas do WhatsApp
router.get('/whatsapp/stats', authenticateToken, async (req, res) => {
  try {
    const result = await whatsappService.getWhatsAppStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas do WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== NOTIFICAÇÕES AUTOMÁTICAS =====

// Enviar notificação de boas-vindas
router.post('/welcome/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;
    
    const result = await notificationService.sendTemplateNotification(
      'welcome_template_id', // ID do template de boas-vindas
      userId,
      { customerName: name, email, phone }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar notificação de boas-vindas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar notificação de confirmação de pedido
router.post('/order-confirmation/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, orderNumber, totalAmount, items } = req.body;
    
    const result = await notificationService.sendTemplateNotification(
      'order_confirmation_template_id', // ID do template de confirmação
      userId,
      { orderNumber, totalAmount, items }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar notificação de confirmação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar notificação de carrinho abandonado
router.post('/cart-abandoned/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { customerName, cartValue, items } = req.body;
    
    const result = await notificationService.sendTemplateNotification(
      'cart_abandoned_template_id', // ID do template de carrinho abandonado
      userId,
      { customerName, cartValue, items }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar notificação de carrinho abandonado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar notificação de promoção
router.post('/promotion', authenticateToken, async (req, res) => {
  try {
    const { userIds, promotionName, discountValue, validUntil } = req.body;
    
    const results = [];
    for (const userId of userIds) {
      const result = await notificationService.sendTemplateNotification(
        'promotion_template_id', // ID do template de promoção
        userId,
        { promotionName, discountValue, validUntil }
      );
      results.push({ userId, result });
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de promoção:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
