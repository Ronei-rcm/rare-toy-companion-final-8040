const express = require('express');
const router = express.Router();
const businessIntelligenceService = require('../services/businessIntelligenceService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// ===== QUERIES PERSONALIZADAS =====

// Executar query personalizada
router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { query, parameters = [] } = req.body;

    const result = await businessIntelligenceService.executeCustomQuery(query, parameters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar query personalizada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== TEMPLATES DE RELATÓRIOS =====

// Criar template de relatório
router.post('/report-templates', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.createReportTemplate(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar template de relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar templates de relatório
router.get('/report-templates', authenticateToken, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      is_public: req.query.is_public,
      created_by: req.query.created_by,
      limit: req.query.limit
    };

    const result = await businessIntelligenceService.getReportTemplates(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar templates de relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Executar relatório
router.post('/reports/:templateId/execute', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { parameters = {} } = req.body;

    const result = await businessIntelligenceService.executeReport(templateId, parameters, req.user?.id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Exportar relatório
router.post('/reports/:templateId/export', authenticateToken, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { format = 'csv', parameters = {} } = req.body;

    const result = await businessIntelligenceService.exportReport(templateId, format, parameters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== AGENDAMENTOS =====

// Criar agendamento de relatório
router.post('/schedules', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.createReportSchedule(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Executar relatórios agendados
router.post('/schedules/execute', async (req, res) => {
  try {
    const result = await businessIntelligenceService.executeScheduledReports();
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar relatórios agendados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== WIDGETS DE DASHBOARD =====

// Criar widget de dashboard
router.post('/widgets', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.createDashboardWidget(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar widget:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar widgets de dashboard
router.get('/widgets', authenticateToken, async (req, res) => {
  try {
    const filters = {
      is_public: req.query.is_public,
      created_by: req.query.created_by
    };

    const result = await businessIntelligenceService.getDashboardWidgets(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar widgets:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Executar widget
router.post('/widgets/:widgetId/execute', authenticateToken, async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { parameters = {} } = req.body;

    const result = await businessIntelligenceService.executeWidget(widgetId, parameters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar widget:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== MÉTRICAS KPI =====

// Criar métrica KPI
router.post('/kpi-metrics', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.createKPIMetric(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar métrica KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar métricas KPI
router.get('/kpi-metrics', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.getKPIMetrics();
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar métricas KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Atualizar métricas KPI
router.post('/kpi-metrics/update', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.updateKPIMetrics();
    res.json(result);
  } catch (error) {
    console.error('Erro ao atualizar métricas KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== ESTATÍSTICAS =====

// Obter estatísticas gerais do sistema
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await businessIntelligenceService.getSystemStats();
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

// ===== RELATÓRIOS PRÉ-DEFINIDOS =====

// Relatório de vendas
router.get('/reports/sales', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    let query = `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as total_orders,
        SUM(o.total) as total_revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers
      FROM orders o
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND o.created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND o.created_at <= ?';
      params.push(date_to);
    }
    
    switch (group_by) {
      case 'hour':
        query = query.replace('DATE(o.created_at)', 'DATE_FORMAT(o.created_at, "%Y-%m-%d %H:00:00")');
        break;
      case 'day':
        query = query.replace('DATE(o.created_at)', 'DATE(o.created_at)');
        break;
      case 'week':
        query = query.replace('DATE(o.created_at)', 'YEARWEEK(o.created_at)');
        break;
      case 'month':
        query = query.replace('DATE(o.created_at)', 'DATE_FORMAT(o.created_at, "%Y-%m")');
        break;
      case 'year':
        query = query.replace('DATE(o.created_at)', 'YEAR(o.created_at)');
        break;
    }
    
    query += ' GROUP BY date ORDER BY date DESC';
    
    const result = await businessIntelligenceService.executeCustomQuery(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter relatório de vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de produtos
router.get('/reports/products', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.nome,
        p.sku,
        p.preco,
        SUM(oi.quantity) as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count,
        AVG(oi.price) as avg_price
      FROM produtos p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND o.created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND o.created_at <= ?';
      params.push(date_to);
    }
    
    query += `
      GROUP BY p.id, p.nome, p.sku, p.preco
      ORDER BY total_sold DESC
      LIMIT ?
    `;
    
    params.push(parseInt(limit));
    
    const result = await businessIntelligenceService.executeCustomQuery(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter relatório de produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de clientes
router.get('/reports/customers', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, limit = 20 } = req.query;
    
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_spent,
        AVG(o.total) as avg_order_value,
        MAX(o.created_at) as last_order_date,
        MIN(o.created_at) as first_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND o.created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND o.created_at <= ?';
      params.push(date_to);
    }
    
    query += `
      GROUP BY u.id, u.name, u.email
      HAVING total_orders > 0
      ORDER BY total_spent DESC
      LIMIT ?
    `;
    
    params.push(parseInt(limit));
    
    const result = await businessIntelligenceService.executeCustomQuery(query, params);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter relatório de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de estoque
router.get('/reports/inventory', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.nome,
        p.sku,
        p.estoque,
        p.estoque_minimo,
        p.estoque_maximo,
        p.preco,
        (p.estoque * p.preco) as stock_value,
        CASE 
          WHEN p.estoque = 0 THEN 'Sem estoque'
          WHEN p.estoque <= p.estoque_minimo THEN 'Estoque baixo'
          WHEN p.estoque > p.estoque_maximo THEN 'Excesso de estoque'
          ELSE 'Normal'
        END as stock_status
      FROM produtos p
      ORDER BY stock_value DESC
    `;
    
    const result = await businessIntelligenceService.executeCustomQuery(query);
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

// ===== DASHBOARD EXECUTIVO =====

// Dashboard executivo
router.get('/dashboard/executive', authenticateToken, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // Métricas principais
    const [overview] = await businessIntelligenceService.db.execute(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total) as total_revenue,
        AVG(o.total) as avg_order_value,
        COUNT(DISTINCT o.user_id) as unique_customers,
        COUNT(DISTINCT p.id) as total_products
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN produtos p ON oi.product_id = p.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [parseInt(period)]);
    
    // Vendas por dia
    const [dailySales] = await businessIntelligenceService.db.execute(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(*) as orders,
        SUM(o.total) as revenue
      FROM orders o
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
    `, [parseInt(period)]);
    
    // Top produtos
    const [topProducts] = await businessIntelligenceService.db.execute(`
      SELECT 
        p.nome,
        SUM(oi.quantity) as sold,
        SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      LEFT JOIN produtos p ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id, p.nome
      ORDER BY sold DESC
      LIMIT 10
    `, [parseInt(period)]);
    
    // Top clientes
    const [topCustomers] = await businessIntelligenceService.db.execute(`
      SELECT 
        u.name,
        COUNT(o.id) as orders,
        SUM(o.total) as spent
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY u.id, u.name
      ORDER BY spent DESC
      LIMIT 10
    `, [parseInt(period)]);
    
    res.json({
      success: true,
      data: {
        overview: overview[0],
        dailySales,
        topProducts,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Erro ao obter dashboard executivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
