const express = require('express');
const router = express.Router();
const apiConfigService = require('../services/apiConfigService.cjs');

// GET /api/admin/config - Obter configurações atuais
router.get('/', async (req, res) => {
  try {
    const config = await apiConfigService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('❌ Erro ao obter configurações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/admin/config - Salvar configurações
router.post('/', async (req, res) => {
  try {
    const config = req.body;
    
    // Validar configurações
    const validation = apiConfigService.validateConfig(config);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Configurações inválidas',
        errors: validation.errors
      });
    }

    const result = await apiConfigService.saveConfig(config);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// POST /api/admin/config/test - Testar configurações do Google
router.post('/test', async (req, res) => {
  try {
    const result = await apiConfigService.testGoogleConfig();
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao testar configurações:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PUT /api/admin/config/toggle - Ativar/Desativar integração
router.put('/toggle', async (req, res) => {
  try {
    const { active } = req.body;
    
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        error: 'Parâmetro "active" deve ser boolean'
      });
    }

    const result = await apiConfigService.toggleIntegration(active);
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao alterar status da integração:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// GET /api/admin/config/status - Verificar status da integração
router.get('/status', async (req, res) => {
  try {
    const config = await apiConfigService.getConfig();
    
    res.json({
      isConfigured: !!(config.google_client_id && config.google_client_secret),
      isActive: config.is_active,
      hasRedirectUri: !!config.google_redirect_uri,
      hasFrontendUrl: !!config.frontend_url,
      lastUpdated: config.updated_at
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

module.exports = router;



