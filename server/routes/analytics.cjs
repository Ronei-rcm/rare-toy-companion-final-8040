const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  // Implementar validação real do token aqui
  next();
};

// Dashboard principal
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsService.getDashboardMetrics(period);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Analytics de clientes
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsService.getCustomerAnalytics(period);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar analytics de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Analytics de produtos
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const result = await analyticsService.getProductAnalytics(period);
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar analytics de produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de vendas
router.get('/sales', authenticateToken, async (req, res) => {
  try {
    const { period = '30d', format = 'json' } = req.query;
    const result = await analyticsService.getDashboardMetrics(period);
    
    if (format === 'csv') {
      // Implementar exportação CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      // Implementar conversão para CSV
      res.send('Data,Receita,Pedidos\n');
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('Erro ao gerar relatório de vendas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Métricas em tempo real
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const result = await analyticsService.getDashboardMetrics('7d');
    
    // Adicionar métricas em tempo real simuladas
    const realtimeData = {
      ...result.data,
      realtime: {
        onlineUsers: Math.floor(Math.random() * 50) + 10,
        currentHourOrders: Math.floor(Math.random() * 10) + 1,
        currentHourRevenue: Math.floor(Math.random() * 1000) + 100,
        lastUpdated: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: realtimeData
    });
  } catch (error) {
    console.error('Erro ao buscar métricas em tempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Comparação de períodos
router.get('/compare', authenticateToken, async (req, res) => {
  try {
    const { current = '30d', previous = '60d' } = req.query;
    
    const [currentData, previousData] = await Promise.all([
      analyticsService.getDashboardMetrics(current),
      analyticsService.getDashboardMetrics(previous)
    ]);

    if (!currentData.success || !previousData.success) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados de comparação'
      });
    }

    const comparison = {
      revenue: {
        current: currentData.data.overview.totalRevenue,
        previous: previousData.data.overview.totalRevenue,
        change: calculatePercentageChange(
          previousData.data.overview.totalRevenue,
          currentData.data.overview.totalRevenue
        )
      },
      orders: {
        current: currentData.data.overview.totalOrders,
        previous: previousData.data.overview.totalOrders,
        change: calculatePercentageChange(
          previousData.data.overview.totalOrders,
          currentData.data.overview.totalOrders
        )
      },
      customers: {
        current: currentData.data.overview.totalCustomers,
        previous: previousData.data.overview.totalCustomers,
        change: calculatePercentageChange(
          previousData.data.overview.totalCustomers,
          currentData.data.overview.totalCustomers
        )
      }
    };

    res.json({
      success: true,
      data: {
        comparison,
        currentPeriod: current,
        previousPeriod: previous,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao comparar períodos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Função auxiliar para calcular mudança percentual
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
}

module.exports = router;
