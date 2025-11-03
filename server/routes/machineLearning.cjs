const express = require('express');
const router = express.Router();
const machineLearningService = require('../services/machineLearningService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== GESTÃO DE MODELOS =====

// Criar modelo de ML
router.post('/models', authenticateToken, async (req, res) => {
  try {
    const result = await machineLearningService.createModel(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar modelo ML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar modelos
router.get('/models', authenticateToken, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      limit: req.query.limit
    };

    const result = await machineLearningService.getModels(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar modelos ML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== SISTEMA DE RECOMENDAÇÕES =====

// Recomendações colaborativas
router.get('/recommendations/collaborative/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const result = await machineLearningService.getCollaborativeRecommendations(userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar recomendações colaborativas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Recomendações baseadas em conteúdo
router.get('/recommendations/content-based/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const result = await machineLearningService.getContentBasedRecommendations(userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar recomendações baseadas em conteúdo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Recomendações híbridas
router.get('/recommendations/hybrid/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const result = await machineLearningService.getHybridRecommendations(userId, parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar recomendações híbridas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Recomendações populares
router.get('/recommendations/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await machineLearningService.getPopularRecommendations(parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar recomendações populares:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Recomendações inteligentes (auto-detecta melhor algoritmo)
router.get('/recommendations/smart/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    // Tentar híbrido primeiro, depois colaborativo, depois conteúdo, depois popular
    let result = await machineLearningService.getHybridRecommendations(userId, parseInt(limit));
    
    if (!result.success || result.data.length === 0) {
      result = await machineLearningService.getCollaborativeRecommendations(userId, parseInt(limit));
    }
    
    if (!result.success || result.data.length === 0) {
      result = await machineLearningService.getContentBasedRecommendations(userId, parseInt(limit));
    }
    
    if (!result.success || result.data.length === 0) {
      result = await machineLearningService.getPopularRecommendations(parseInt(limit));
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar recomendações inteligentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ANÁLISE PREDITIVA =====

// Prever demanda de produto
router.get('/predictions/demand/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const result = await machineLearningService.predictProductDemand(productId, parseInt(days));
    res.json(result);
  } catch (error) {
    console.error('Erro ao prever demanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Prever churn de cliente
router.get('/predictions/churn/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await machineLearningService.predictCustomerChurn(userId);
    res.json(result);
  } catch (error) {
    console.error('Erro ao prever churn:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Análise de sentimento
router.post('/analyze/sentiment', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Texto é obrigatório'
      });
    }

    const result = await machineLearningService.analyzeSentiment(text);
    res.json(result);
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== CHATBOT COM IA =====

// Processar mensagem do chatbot
router.post('/chatbot/message', async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    const result = await machineLearningService.processChatbotMessage(
      message, 
      userId, 
      sessionId || 'anonymous'
    );
    res.json(result);
  } catch (error) {
    console.error('Erro ao processar mensagem do chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter histórico de conversas
router.get('/chatbot/conversations', authenticateToken, async (req, res) => {
  try {
    const { userId, sessionId, limit = 50 } = req.query;

    let query = 'SELECT * FROM chatbot_conversations WHERE 1=1';
    const params = [];

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await machineLearningService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter conversas do chatbot:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== TRACKING DE INTERAÇÕES =====

// Registrar interação do usuário
router.post('/interactions/track', async (req, res) => {
  try {
    const {
      user_id,
      session_id,
      interaction_type,
      entity_type,
      entity_id,
      metadata = {}
    } = req.body;

    if (!session_id || !interaction_type || !entity_type || !entity_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: session_id, interaction_type, entity_type, entity_id'
      });
    }

    const result = await machineLearningService.trackUserInteraction({
      user_id,
      session_id,
      interaction_type,
      entity_type,
      entity_id,
      metadata
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter interações do usuário
router.get('/interactions/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, type } = req.query;

    let query = 'SELECT * FROM user_interactions WHERE user_id = ?';
    const params = [userId];

    if (type) {
      query += ' AND interaction_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await machineLearningService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter interações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== MÉTRICAS E ANALYTICS =====

// Obter métricas de ML
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const result = await machineLearningService.getMLMetrics();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter métricas ML:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter estatísticas de recomendações
router.get('/metrics/recommendations', authenticateToken, async (req, res) => {
  try {
    const { algorithm, days = 30 } = req.query;

    let query = `
      SELECT 
        algorithm,
        COUNT(*) as total_recommendations,
        SUM(CASE WHEN is_clicked = 1 THEN 1 ELSE 0 END) as clicks,
        SUM(CASE WHEN is_purchased = 1 THEN 1 ELSE 0 END) as purchases,
        AVG(confidence) as avg_confidence,
        (SUM(CASE WHEN is_clicked = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as click_rate,
        (SUM(CASE WHEN is_purchased = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as conversion_rate
      FROM ai_recommendations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    const params = [parseInt(days)];

    if (algorithm) {
      query += ' AND algorithm = ?';
      params.push(algorithm);
    }

    query += ' GROUP BY algorithm ORDER BY total_recommendations DESC';

    const [rows] = await machineLearningService.db.execute(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de recomendações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter estatísticas de interações
router.get('/metrics/interactions', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const [rows] = await machineLearningService.db.execute(`
      SELECT 
        interaction_type,
        COUNT(*) as count,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM user_interactions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY interaction_type
      ORDER BY count DESC
    `, [parseInt(days)]);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas de interações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== UTILITÁRIOS =====

// Testar conectividade do serviço
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Machine Learning Service está funcionando',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no serviço',
      error: error.message
    });
  }
});

// Obter informações do sistema
router.get('/info', authenticateToken, async (req, res) => {
  try {
    const [modelCount] = await machineLearningService.db.execute('SELECT COUNT(*) as count FROM ml_models');
    const [recommendationCount] = await machineLearningService.db.execute('SELECT COUNT(*) as count FROM ai_recommendations');
    const [interactionCount] = await machineLearningService.db.execute('SELECT COUNT(*) as count FROM user_interactions');
    const [conversationCount] = await machineLearningService.db.execute('SELECT COUNT(*) as count FROM chatbot_conversations');

    res.json({
      success: true,
      data: {
        models: modelCount[0].count,
        recommendations: recommendationCount[0].count,
        interactions: interactionCount[0].count,
        conversations: conversationCount[0].count,
        version: '1.0.0',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
