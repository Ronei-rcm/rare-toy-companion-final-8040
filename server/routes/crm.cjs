const express = require('express');
const router = express.Router();
const crmService = require('../services/crmService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== PERFIS DE CLIENTES =====

// Criar perfil de cliente
router.post('/customers', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.createCustomerProfile(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar perfil de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar clientes
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      segment: req.query.segment,
      search: req.query.search,
      source: req.query.source,
      limit: req.query.limit
    };

    const result = await crmService.getCustomers(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter perfil de cliente
router.get('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await crmService.getCustomerProfile(id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter perfil de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar perfil de cliente
router.put('/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await crmService.updateCustomerProfile(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar perfil de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== SEGMENTAÇÃO =====

// Criar segmento
router.post('/segments', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.createCustomerSegment(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar segmento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar segmentos
router.get('/segments', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.getCustomerSegments();
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar segmentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Aplicar segmentação automática
router.post('/segments/apply', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.applyCustomerSegmentation();
    res.json(result);
  } catch (error) {
    console.error('Erro ao aplicar segmentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== INTERAÇÕES =====

// Criar interação
router.post('/interactions', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.createCustomerInteraction(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar interação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar interações do cliente
router.get('/customers/:id/interactions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    const result = await crmService.getCustomerInteractions(id, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar interações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== TAREFAS =====

// Criar tarefa
router.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.createCustomerTask(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar tarefas do cliente
router.get('/customers/:id/tasks', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      task_type: req.query.task_type,
      limit: req.query.limit
    };
    
    const result = await crmService.getCustomerTasks(id, filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar status da tarefa
router.put('/tasks/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed_by } = req.body;
    
    const result = await crmService.updateTaskStatus(id, status, completed_by);
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== COMUNICAÇÕES =====

// Registrar comunicação
router.post('/communications', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.logCommunication(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao registrar comunicação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas de CRM
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await crmService.getCRMStats();
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

// ===== RELATÓRIOS =====

// Gerar relatório de cliente
router.get('/customers/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await crmService.getCustomerReport(id, date_from, date_to);
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar relatório de cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== AUTOMAÇÕES =====

// Processar novo cliente
router.post('/customers/:id/onboard', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { welcome_email = true, create_tasks = true } = req.body;

    const results = [];

    // Enviar email de boas-vindas
    if (welcome_email) {
      const profile = await crmService.getCustomerProfile(id);
      if (profile.success) {
        const customer = profile.data;
        
        // Enviar notificação de boas-vindas
        await crmService.logCommunication({
          customer_id: id,
          channel: 'email',
          direction: 'outbound',
          subject: 'Bem-vindo à MuhlStore!',
          content: `Olá ${customer.first_name}, seja bem-vindo à nossa loja!`,
          created_by: 'system'
        });

        results.push({ action: 'welcome_email', status: 'sent' });
      }
    }

    // Criar tarefas de acompanhamento
    if (create_tasks) {
      const tasks = [
        {
          customer_id: id,
          title: 'Primeiro contato',
          description: 'Entrar em contato com o novo cliente',
          task_type: 'call',
          priority: 'medium',
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
          created_by: 'system'
        },
        {
          customer_id: id,
          title: 'Envio de catálogo',
          description: 'Enviar catálogo de produtos por email',
          task_type: 'email',
          priority: 'low',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
          created_by: 'system'
        }
      ];

      for (const task of tasks) {
        await crmService.createCustomerTask(task);
      }

      results.push({ action: 'follow_up_tasks', status: 'created', count: tasks.length });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Erro ao processar onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Marcar cliente como VIP
router.post('/customers/:id/vip', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Atualizar status para VIP
    const updateResult = await crmService.updateCustomerProfile(id, {
      status: 'vip',
      notes: `Cliente VIP - ${reason || 'Promovido por alta performance'}`
    });

    if (updateResult.success) {
      // Criar interação
      await crmService.createCustomerInteraction({
        customer_id: id,
        interaction_type: 'compliment',
        subject: 'Promoção a Cliente VIP',
        description: `Cliente promovido a VIP: ${reason || 'Alta performance'}`,
        outcome: 'resolved',
        priority: 'high',
        created_by: 'system'
      });

      // Adicionar tag VIP
      const profile = await crmService.getCustomerProfile(id);
      if (profile.success) {
        const currentTags = JSON.parse(profile.data.tags || '[]');
        if (!currentTags.includes('VIP')) {
          currentTags.push('VIP');
          await crmService.updateCustomerProfile(id, { tags: currentTags });
        }
      }
    }

    res.json(updateResult);
  } catch (error) {
    console.error('Erro ao marcar cliente como VIP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
