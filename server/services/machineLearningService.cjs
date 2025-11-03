const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger.cjs');

class MachineLearningService {
  constructor() {
    this.db = null;
    this.models = new Map();
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rare_toy_companion',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Machine Learning Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Machine Learning Service: Erro na inicialização:', error.message);
    }
  }

  // ===== GESTÃO DE MODELOS =====

  // Criar modelo de ML
  async createModel(modelData) {
    try {
      const id = uuidv4();
      const {
        name,
        type,
        version = '1.0.0',
        config = {},
        training_data = null
      } = modelData;

      const [result] = await this.db.execute(`
        INSERT INTO ml_models (id, name, type, version, config, training_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, name, type, version, JSON.stringify(config), JSON.stringify(training_data)]);

      return {
        success: true,
        data: { id, ...modelData }
      };
    } catch (error) {
      console.error('Erro ao criar modelo ML:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar modelos
  async getModels(filters = {}) {
    try {
      let query = 'SELECT * FROM ml_models WHERE 1=1';
      const params = [];

      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar modelos ML:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== SISTEMA DE RECOMENDAÇÕES =====

  // Engine de recomendações colaborativas
  async getCollaborativeRecommendations(userId, limit = 10) {
    try {
      // Buscar usuários similares baseado em compras
      const [similarUsers] = await this.db.execute(`
        SELECT 
          o2.usuario_id,
          COUNT(*) as common_products,
          AVG(o2.quantidade) as avg_quantity
        FROM pedidos_itens o1
        JOIN pedidos_itens o2 ON o1.produto_id = o2.produto_id
        JOIN pedidos p1 ON o1.pedido_id = p1.id
        JOIN pedidos p2 ON o2.pedido_id = p2.id
        WHERE p1.usuario_id = ? 
          AND p2.usuario_id != ?
          AND p1.status = 'entregue'
          AND p2.status = 'entregue'
        GROUP BY o2.usuario_id
        HAVING common_products >= 2
        ORDER BY common_products DESC, avg_quantity DESC
        LIMIT 20
      `, [userId, userId]);

      if (similarUsers.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      // Buscar produtos que usuários similares compraram
      const similarUserIds = similarUsers.map(u => u.usuario_id);
      const placeholders = similarUserIds.map(() => '?').join(',');

      const [recommendations] = await this.db.execute(`
        SELECT 
          p.id,
          p.nome,
          p.preco,
          p.imagem,
          COUNT(*) as purchase_count,
          AVG(pi.quantidade) as avg_quantity,
          SUM(pi.preco * pi.quantidade) as total_revenue
        FROM produtos p
        JOIN pedidos_itens pi ON p.id = pi.produto_id
        JOIN pedidos ped ON pi.pedido_id = ped.id
        WHERE ped.usuario_id IN (${placeholders})
          AND ped.status = 'entregue'
          AND p.id NOT IN (
            SELECT DISTINCT pi2.produto_id 
            FROM pedidos_itens pi2
            JOIN pedidos ped2 ON pi2.pedido_id = ped2.id
            WHERE ped2.usuario_id = ?
          )
        GROUP BY p.id
        ORDER BY purchase_count DESC, total_revenue DESC
        LIMIT ?
      `, [...similarUserIds, userId, limit]);

      return {
        success: true,
        data: recommendations,
        algorithm: 'collaborative_filtering'
      };
    } catch (error) {
      console.error('Erro ao gerar recomendações colaborativas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Engine de recomendações baseada em conteúdo
  async getContentBasedRecommendations(userId, limit = 10) {
    try {
      // Buscar produtos que o usuário já comprou
      const [userProducts] = await this.db.execute(`
        SELECT DISTINCT p.id, p.categoria, p.marca, p.preco
        FROM produtos p
        JOIN pedidos_itens pi ON p.id = pi.produto_id
        JOIN pedidos ped ON pi.pedido_id = ped.id
        WHERE ped.usuario_id = ? AND ped.status = 'entregue'
      `, [userId]);

      if (userProducts.length === 0) {
        return this.getPopularRecommendations(limit);
      }

      // Extrair preferências do usuário
      const categories = [...new Set(userProducts.map(p => p.categoria))];
      const brands = [...new Set(userProducts.map(p => p.marca))];
      const avgPrice = userProducts.reduce((sum, p) => sum + p.preco, 0) / userProducts.length;

      // Buscar produtos similares
      const categoryPlaceholders = categories.map(() => '?').join(',');
      const brandPlaceholders = brands.map(() => '?').join(',');

      const [recommendations] = await this.db.execute(`
        SELECT 
          p.id,
          p.nome,
          p.preco,
          p.imagem,
          p.categoria,
          p.marca,
          CASE 
            WHEN p.categoria IN (${categoryPlaceholders}) THEN 3
            WHEN p.marca IN (${brandPlaceholders}) THEN 2
            ELSE 1
          END as similarity_score,
          ABS(p.preco - ?) as price_difference
        FROM produtos p
        WHERE p.id NOT IN (
          SELECT DISTINCT pi.produto_id 
          FROM pedidos_itens pi
          JOIN pedidos ped ON pi.pedido_id = ped.id
          WHERE ped.usuario_id = ?
        )
        ORDER BY similarity_score DESC, price_difference ASC
        LIMIT ?
      `, [...categories, ...brands, avgPrice, userId, limit]);

      return {
        success: true,
        data: recommendations,
        algorithm: 'content_based'
      };
    } catch (error) {
      console.error('Erro ao gerar recomendações baseadas em conteúdo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Engine de recomendações híbridas
  async getHybridRecommendations(userId, limit = 10) {
    try {
      const [collaborative, contentBased] = await Promise.all([
        this.getCollaborativeRecommendations(userId, Math.ceil(limit / 2)),
        this.getContentBasedRecommendations(userId, Math.ceil(limit / 2))
      ]);

      if (!collaborative.success || !contentBased.success) {
        return this.getPopularRecommendations(limit);
      }

      // Combinar e pontuar recomendações
      const allRecommendations = new Map();

      // Adicionar recomendações colaborativas com peso 0.6
      collaborative.data.forEach(item => {
        allRecommendations.set(item.id, {
          ...item,
          score: (item.purchase_count || 0) * 0.6,
          source: 'collaborative'
        });
      });

      // Adicionar recomendações baseadas em conteúdo com peso 0.4
      contentBased.data.forEach(item => {
        const existing = allRecommendations.get(item.id);
        if (existing) {
          existing.score += (item.similarity_score || 0) * 0.4;
          existing.source = 'hybrid';
        } else {
          allRecommendations.set(item.id, {
            ...item,
            score: (item.similarity_score || 0) * 0.4,
            source: 'content'
          });
        }
      });

      // Ordenar por score e retornar
      const recommendations = Array.from(allRecommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        data: recommendations,
        algorithm: 'hybrid'
      };
    } catch (error) {
      console.error('Erro ao gerar recomendações híbridas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Recomendações populares (fallback)
  async getPopularRecommendations(limit = 10) {
    try {
      const [recommendations] = await this.db.execute(`
        SELECT 
          p.id,
          p.nome,
          p.preco,
          p.imagem,
          COUNT(pi.id) as purchase_count,
          SUM(pi.quantidade) as total_quantity,
          AVG(pi.preco * pi.quantidade) as avg_revenue
        FROM produtos p
        LEFT JOIN pedidos_itens pi ON p.id = pi.produto_id
        LEFT JOIN pedidos ped ON pi.pedido_id = ped.id
        WHERE ped.status = 'entregue' OR ped.status IS NULL
        GROUP BY p.id
        ORDER BY purchase_count DESC, total_quantity DESC, avg_revenue DESC
        LIMIT ?
      `, [limit]);

      return {
        success: true,
        data: recommendations,
        algorithm: 'popular'
      };
    } catch (error) {
      console.error('Erro ao gerar recomendações populares:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== ANÁLISE PREDITIVA =====

  // Prever demanda de produtos
  async predictProductDemand(productId, days = 30) {
    try {
      // Buscar histórico de vendas dos últimos 90 dias
      const [salesHistory] = await this.db.execute(`
        SELECT 
          DATE(created_at) as date,
          SUM(quantidade) as daily_quantity,
          SUM(preco * quantidade) as daily_revenue
        FROM pedidos_itens pi
        JOIN pedidos p ON pi.pedido_id = p.id
        WHERE pi.produto_id = ? 
          AND p.status = 'entregue'
          AND p.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [productId]);

      if (salesHistory.length < 7) {
        return {
          success: false,
          error: 'Dados insuficientes para previsão'
        };
      }

      // Análise de tendência simples
      const quantities = salesHistory.map(s => s.daily_quantity);
      const avgQuantity = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
      
      // Calcular tendência (linear regression simples)
      let trend = 0;
      for (let i = 1; i < quantities.length; i++) {
        trend += quantities[i] - quantities[i - 1];
      }
      trend /= (quantities.length - 1);

      // Previsão para os próximos dias
      const predictions = [];
      for (let i = 1; i <= days; i++) {
        const predictedQuantity = Math.max(0, avgQuantity + (trend * i));
        predictions.push({
          day: i,
          predicted_quantity: Math.round(predictedQuantity),
          confidence: Math.max(0.1, Math.min(0.9, 1 - (i / days)))
        });
      }

      return {
        success: true,
        data: {
          product_id: productId,
          current_avg_daily: Math.round(avgQuantity),
          trend: Math.round(trend * 100) / 100,
          predictions: predictions,
          total_predicted_demand: Math.round(predictions.reduce((sum, p) => sum + p.predicted_quantity, 0))
        }
      };
    } catch (error) {
      console.error('Erro ao prever demanda:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Prever churn de clientes
  async predictCustomerChurn(userId) {
    try {
      // Buscar dados do cliente
      const [customerData] = await this.db.execute(`
        SELECT 
          u.id,
          u.created_at as registration_date,
          COUNT(DISTINCT p.id) as total_orders,
          SUM(p.valor_total) as total_spent,
          AVG(p.valor_total) as avg_order_value,
          DATEDIFF(NOW(), MAX(p.created_at)) as days_since_last_order,
          COUNT(DISTINCT pi.produto_id) as unique_products,
          AVG(DATEDIFF(p.created_at, LAG(p.created_at) OVER (ORDER BY p.created_at))) as avg_days_between_orders
        FROM usuarios u
        LEFT JOIN pedidos p ON u.id = p.usuario_id AND p.status = 'entregue'
        LEFT JOIN pedidos_itens pi ON p.id = pi.pedido_id
        WHERE u.id = ?
        GROUP BY u.id
      `, [userId]);

      if (customerData.length === 0) {
        return {
          success: false,
          error: 'Cliente não encontrado'
        };
      }

      const customer = customerData[0];
      
      // Modelo simples de churn baseado em regras
      let churnScore = 0;
      let riskFactors = [];

      // Fator 1: Dias desde último pedido
      if (customer.days_since_last_order > 90) {
        churnScore += 0.4;
        riskFactors.push('Sem pedidos há mais de 90 dias');
      } else if (customer.days_since_last_order > 60) {
        churnScore += 0.2;
        riskFactors.push('Sem pedidos há mais de 60 dias');
      }

      // Fator 2: Frequência de pedidos
      if (customer.avg_days_between_orders > 45) {
        churnScore += 0.3;
        riskFactors.push('Baixa frequência de pedidos');
      }

      // Fator 3: Valor total gasto
      if (customer.total_spent < 100) {
        churnScore += 0.2;
        riskFactors.push('Baixo valor total gasto');
      }

      // Fator 4: Diversidade de produtos
      if (customer.unique_products < 3) {
        churnScore += 0.1;
        riskFactors.push('Pouca diversidade de produtos');
      }

      const churnRisk = Math.min(1, churnScore);
      const riskLevel = churnRisk > 0.7 ? 'high' : churnRisk > 0.4 ? 'medium' : 'low';

      return {
        success: true,
        data: {
          user_id: userId,
          churn_risk: Math.round(churnRisk * 100) / 100,
          risk_level: riskLevel,
          risk_factors: riskFactors,
          recommendations: this.getChurnPreventionRecommendations(riskLevel, riskFactors)
        }
      };
    } catch (error) {
      console.error('Erro ao prever churn:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Recomendações para prevenir churn
  getChurnPreventionRecommendations(riskLevel, riskFactors) {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('Enviar oferta especial personalizada');
      recommendations.push('Contato direto via WhatsApp');
      recommendations.push('Desconto de 20% no próximo pedido');
    } else if (riskLevel === 'medium') {
      recommendations.push('Enviar newsletter com novos produtos');
      recommendations.push('Cupom de desconto de 10%');
      recommendations.push('Lembrete de carrinho abandonado');
    } else {
      recommendations.push('Manter engajamento regular');
      recommendations.push('Enviar ofertas sazonais');
    }

    return recommendations;
  }

  // ===== CHATBOT COM IA =====

  // Processar mensagem do chatbot
  async processChatbotMessage(message, userId = null, sessionId = null) {
    try {
      const messageLower = message.toLowerCase();
      let response = '';
      let intent = 'unknown';
      let entities = {};
      let confidence = 0.8;

      // Detecção de intenções simples
      if (messageLower.includes('preço') || messageLower.includes('quanto custa')) {
        intent = 'price_inquiry';
        response = 'Posso ajudar você a encontrar o preço de nossos produtos! Qual produto você está interessado?';
        entities = { product_mentioned: this.extractProductFromMessage(message) };
      } else if (messageLower.includes('estoque') || messageLower.includes('disponível')) {
        intent = 'stock_inquiry';
        response = 'Vou verificar a disponibilidade dos produtos para você. Qual produto você gostaria de consultar?';
        entities = { product_mentioned: this.extractProductFromMessage(message) };
      } else if (messageLower.includes('entrega') || messageLower.includes('frete')) {
        intent = 'shipping_inquiry';
        response = 'Nossos prazos de entrega variam de 1 a 3 dias úteis. O frete é grátis para pedidos acima de R$ 100!';
      } else if (messageLower.includes('devolução') || messageLower.includes('troca')) {
        intent = 'return_inquiry';
        response = 'Oferecemos 30 dias para troca ou devolução. Entre em contato conosco para mais detalhes!';
      } else if (messageLower.includes('cupom') || messageLower.includes('desconto')) {
        intent = 'discount_inquiry';
        response = 'Temos várias promoções disponíveis! Confira nossa seção de ofertas ou me diga qual produto você procura.';
      } else if (messageLower.includes('ajuda') || messageLower.includes('suporte')) {
        intent = 'help_request';
        response = 'Estou aqui para ajudar! Posso esclarecer dúvidas sobre produtos, preços, entrega, devoluções e muito mais.';
      } else if (messageLower.includes('obrigado') || messageLower.includes('valeu')) {
        intent = 'gratitude';
        response = 'De nada! Fico feliz em ajudar. Se precisar de mais alguma coisa, é só falar!';
      } else {
        intent = 'general_inquiry';
        response = 'Olá! Sou o assistente virtual da MuhlStore. Como posso ajudar você hoje? Posso falar sobre produtos, preços, entrega, devoluções e muito mais!';
        confidence = 0.6;
      }

      // Salvar conversa
      if (sessionId) {
        await this.saveChatbotConversation({
          user_id: userId,
          session_id: sessionId,
          message: message,
          response: response,
          intent: intent,
          entities: entities,
          confidence: confidence
        });
      }

      return {
        success: true,
        data: {
          response: response,
          intent: intent,
          entities: entities,
          confidence: confidence
        }
      };
    } catch (error) {
      console.error('Erro ao processar mensagem do chatbot:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Extrair produto mencionado na mensagem
  extractProductFromMessage(message) {
    // Buscar produtos no banco que possam estar mencionados
    const words = message.toLowerCase().split(' ');
    // Implementação simples - em produção usaria NLP mais avançado
    return words.find(word => word.length > 3) || null;
  }

  // Salvar conversa do chatbot
  async saveChatbotConversation(conversationData) {
    try {
      const id = uuidv4();
      const {
        user_id,
        session_id,
        message,
        response,
        intent,
        entities,
        confidence
      } = conversationData;

      await this.db.execute(`
        INSERT INTO chatbot_conversations (
          id, user_id, session_id, message, response, 
          intent, entities, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, user_id, session_id, message, response,
        intent, JSON.stringify(entities), confidence
      ]);

      return { success: true, id };
    } catch (error) {
      console.error('Erro ao salvar conversa do chatbot:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== ANÁLISE DE SENTIMENTOS =====

  // Analisar sentimento de uma mensagem
  async analyzeSentiment(text) {
    try {
      const positiveWords = ['bom', 'ótimo', 'excelente', 'perfeito', 'maravilhoso', 'fantástico', 'incrível', 'adorei', 'amei'];
      const negativeWords = ['ruim', 'péssimo', 'terrível', 'horrível', 'odiei', 'detestei', 'problema', 'erro', 'defeito'];
      
      const words = text.toLowerCase().split(/\s+/);
      let positiveCount = 0;
      let negativeCount = 0;

      words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
      });

      const totalSentimentWords = positiveCount + negativeCount;
      let sentiment = 'neutral';
      let score = 0;

      if (totalSentimentWords > 0) {
        score = (positiveCount - negativeCount) / totalSentimentWords;
        if (score > 0.1) sentiment = 'positive';
        else if (score < -0.1) sentiment = 'negative';
      }

      return {
        success: true,
        data: {
          sentiment: sentiment,
          score: Math.round(score * 100) / 100,
          confidence: Math.min(0.9, Math.abs(score) + 0.1),
          positive_words: positiveCount,
          negative_words: negativeCount
        }
      };
    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== TRACKING DE INTERAÇÕES =====

  // Registrar interação do usuário
  async trackUserInteraction(interactionData) {
    try {
      const id = uuidv4();
      const {
        user_id,
        session_id,
        interaction_type,
        entity_type,
        entity_id,
        metadata = {}
      } = interactionData;

      await this.db.execute(`
        INSERT INTO user_interactions (
          id, user_id, session_id, interaction_type, 
          entity_type, entity_id, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, user_id, session_id, interaction_type,
        entity_type, entity_id, JSON.stringify(metadata)
      ]);

      return { success: true, id };
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
      return { success: false, error: error.message };
    }
  }

  // ===== MÉTRICAS E ANALYTICS =====

  // Obter métricas de ML
  async getMLMetrics() {
    try {
      const [modelStats] = await this.db.execute(`
        SELECT 
          type,
          status,
          COUNT(*) as count,
          AVG(accuracy) as avg_accuracy
        FROM ml_models
        GROUP BY type, status
      `);

      const [recommendationStats] = await this.db.execute(`
        SELECT 
          algorithm,
          COUNT(*) as total_recommendations,
          SUM(CASE WHEN is_clicked = 1 THEN 1 ELSE 0 END) as clicks,
          SUM(CASE WHEN is_purchased = 1 THEN 1 ELSE 0 END) as purchases,
          AVG(confidence) as avg_confidence
        FROM ai_recommendations
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY algorithm
      `);

      const [interactionStats] = await this.db.execute(`
        SELECT 
          interaction_type,
          COUNT(*) as count
        FROM user_interactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY interaction_type
      `);

      return {
        success: true,
        data: {
          models: modelStats,
          recommendations: recommendationStats,
          interactions: interactionStats
        }
      };
    } catch (error) {
      console.error('Erro ao obter métricas ML:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MachineLearningService();
