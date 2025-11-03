const express = require('express');
const router = express.Router();
const externalApiService = require('../services/externalApiService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== GESTÃO DE APIs EXTERNAS =====

// Criar configuração de API externa
router.post('/apis', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.createExternalApi({
      ...req.body,
      created_by: req.user?.id || 'admin'
    });
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar API externa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar APIs externas
router.get('/apis', authenticateToken, async (req, res) => {
  try {
    const filters = {
      api_type: req.query.api_type,
      provider: req.query.provider,
      is_active: req.query.is_active,
      limit: req.query.limit
    };

    const result = await externalApiService.getExternalApis(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar APIs externas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Fazer requisição para API externa
router.post('/apis/:apiId/request', authenticateToken, async (req, res) => {
  try {
    const { apiId } = req.params;
    const { endpoint, method = 'GET', data, headers } = req.body;

    const result = await externalApiService.makeApiRequest(apiId, endpoint, method, data, headers);
    res.json(result);
  } catch (error) {
    console.error('Erro ao fazer requisição para API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Testar conexão da API
router.post('/apis/:apiId/test', authenticateToken, async (req, res) => {
  try {
    const { apiId } = req.params;
    const result = await externalApiService.testApiConnection(apiId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao testar conexão da API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== INTEGRAÇÕES DE PAGAMENTO =====

// Processar pagamento via Stripe
router.post('/payments/stripe', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.processStripePayment(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar pagamento Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Processar pagamento via PayPal
router.post('/payments/paypal', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.processPayPalPayment(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar pagamento PayPal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Processar pagamento via Mercado Pago
router.post('/payments/mercadopago', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.processMercadoPagoPayment(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar pagamento Mercado Pago:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== INTEGRAÇÕES DE FRETE =====

// Calcular frete via Correios
router.post('/shipping/correios/calculate', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.calculateCorreiosShipping(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao calcular frete Correios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Rastrear encomenda via Correios
router.get('/shipping/correios/track/:trackingCode', authenticateToken, async (req, res) => {
  try {
    const { trackingCode } = req.params;
    const result = await externalApiService.trackCorreiosPackage(trackingCode);
    res.json(result);
  } catch (error) {
    console.error('Erro ao rastrear encomenda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== INTEGRAÇÕES DE REDES SOCIAIS =====

// Postar no Facebook
router.post('/social/facebook/post', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.postToFacebook(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao postar no Facebook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Postar no Instagram
router.post('/social/instagram/post', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.postToInstagram(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao postar no Instagram:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== SISTEMA DE WEBHOOKS =====

// Criar webhook
router.post('/webhooks', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.createWebhook({
      ...req.body,
      created_by: req.user?.id || 'admin'
    });
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar webhooks
router.get('/webhooks', authenticateToken, async (req, res) => {
  try {
    const { is_active, limit } = req.query;
    
    let query = 'SELECT * FROM webhooks WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const [rows] = await externalApiService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao listar webhooks:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Enviar webhook
router.post('/webhooks/:webhookId/send', authenticateToken, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { event_type, payload } = req.body;

    const result = await externalApiService.sendWebhook(webhookId, event_type, payload);
    res.json(result);
  } catch (error) {
    console.error('Erro ao enviar webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Endpoint para receber webhooks
router.post('/webhooks/receive', async (req, res) => {
  try {
    await externalApiService.processIncomingWebhook(req, res);
  } catch (error) {
    console.error('Erro ao processar webhook recebido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== RELATÓRIOS E ESTATÍSTICAS =====

// Obter estatísticas de APIs
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await externalApiService.getApiStats();
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

// Obter histórico de requisições
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { api_id, endpoint, status_code, limit = 100 } = req.query;
    
    let query = `
      SELECT ar.*, ea.name as api_name, ea.provider 
      FROM api_requests ar
      LEFT JOIN external_apis ea ON ar.api_id = ea.id
      WHERE 1=1
    `;
    const params = [];

    if (api_id) {
      query += ' AND ar.api_id = ?';
      params.push(api_id);
    }

    if (endpoint) {
      query += ' AND ar.endpoint LIKE ?';
      params.push(`%${endpoint}%`);
    }

    if (status_code) {
      query += ' AND ar.status_code = ?';
      params.push(parseInt(status_code));
    }

    query += ' ORDER BY ar.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await externalApiService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter histórico de requisições:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter entregas de webhooks
router.get('/webhook-deliveries', authenticateToken, async (req, res) => {
  try {
    const { webhook_id, status, event_type, limit = 100 } = req.query;
    
    let query = `
      SELECT wd.*, w.name as webhook_name 
      FROM webhook_deliveries wd
      LEFT JOIN webhooks w ON wd.webhook_id = w.id
      WHERE 1=1
    `;
    const params = [];

    if (webhook_id) {
      query += ' AND wd.webhook_id = ?';
      params.push(webhook_id);
    }

    if (status) {
      query += ' AND wd.status = ?';
      params.push(status);
    }

    if (event_type) {
      query += ' AND wd.event_type = ?';
      params.push(event_type);
    }

    query += ' ORDER BY wd.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await externalApiService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter entregas de webhooks:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== INTEGRAÇÕES ESPECÍFICAS =====

// Sincronizar produtos com marketplace
router.post('/marketplace/sync-products', authenticateToken, async (req, res) => {
  try {
    const { marketplace, products } = req.body;
    
    // Implementar lógica de sincronização baseada no marketplace
    let result;
    switch (marketplace.toLowerCase()) {
      case 'mercadolivre':
        result = await syncWithMercadoLivre(products);
        break;
      case 'magazineluiza':
        result = await syncWithMagazineLuiza(products);
        break;
      case 'americanas':
        result = await syncWithAmericanas(products);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Marketplace não suportado'
        });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Funções auxiliares para sincronização
async function syncWithMercadoLivre(products) {
  // Implementar sincronização com Mercado Livre
  return { success: true, message: 'Sincronização com Mercado Livre em desenvolvimento' };
}

async function syncWithMagazineLuiza(products) {
  // Implementar sincronização com Magazine Luiza
  return { success: true, message: 'Sincronização com Magazine Luiza em desenvolvimento' };
}

async function syncWithAmericanas(products) {
  // Implementar sincronização com Americanas
  return { success: true, message: 'Sincronização com Americanas em desenvolvimento' };
}

// ===== UTILITÁRIOS =====

// Validar configuração de API
router.post('/validate-config', authenticateToken, async (req, res) => {
  try {
    const { provider, api_type, config } = req.body;
    
    // Validar configuração baseada no provedor e tipo
    const validation = validateApiConfig(provider, api_type, config);
    
    res.json({
      success: validation.isValid,
      data: validation
    });
  } catch (error) {
    console.error('Erro ao validar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Função auxiliar para validar configuração
function validateApiConfig(provider, apiType, config) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validações específicas por provedor
  switch (provider.toLowerCase()) {
    case 'stripe':
      if (!config.secret_key) {
        validation.errors.push('Secret key é obrigatória para Stripe');
        validation.isValid = false;
      }
      break;
    case 'paypal':
      if (!config.client_id || !config.client_secret) {
        validation.errors.push('Client ID e Client Secret são obrigatórios para PayPal');
        validation.isValid = false;
      }
      break;
    case 'mercadopago':
      if (!config.access_token) {
        validation.errors.push('Access token é obrigatório para Mercado Pago');
        validation.isValid = false;
      }
      break;
    case 'correios':
      if (!config.empresa || !config.senha) {
        validation.warnings.push('Empresa e senha são recomendados para Correios');
      }
      break;
  }

  return validation;
}

module.exports = router;
