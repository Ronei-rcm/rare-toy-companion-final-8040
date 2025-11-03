const mysql = require('mysql2/promise');

class AnalyticsService {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rare_toy_store',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Analytics Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Analytics Service: Erro na inicialização:', error.message);
    }
  }

  // Dashboard principal com métricas gerais
  async getDashboardMetrics(period = '30d') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const [
        totalRevenue,
        totalOrders,
        totalCustomers,
        averageOrderValue,
        conversionRate,
        topProducts,
        recentOrders,
        salesByDay
      ] = await Promise.all([
        this.getTotalRevenue(dateFilter),
        this.getTotalOrders(dateFilter),
        this.getTotalCustomers(dateFilter),
        this.getAverageOrderValue(dateFilter),
        this.getConversionRate(dateFilter),
        this.getTopProducts(dateFilter, 5),
        this.getRecentOrders(10),
        this.getSalesByDay(dateFilter)
      ]);

      return {
        success: true,
        data: {
          overview: {
            totalRevenue,
            totalOrders,
            totalCustomers,
            averageOrderValue,
            conversionRate
          },
          topProducts,
          recentOrders,
          salesByDay,
          period,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao buscar métricas do dashboard:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Receita total
  async getTotalRevenue(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COALESCE(SUM(total_amount), 0) as total_revenue
        FROM orders 
        WHERE status = 'completed' 
        AND created_at >= ?
      `, [dateFilter.start]);

      return parseFloat(rows[0].total_revenue) || 0;
    } catch (error) {
      console.error('Erro ao buscar receita total:', error);
      return 0;
    }
  }

  // Total de pedidos
  async getTotalOrders(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COUNT(*) as total_orders
        FROM orders 
        WHERE created_at >= ?
      `, [dateFilter.start]);

      return rows[0].total_orders || 0;
    } catch (error) {
      console.error('Erro ao buscar total de pedidos:', error);
      return 0;
    }
  }

  // Total de clientes
  async getTotalCustomers(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COUNT(DISTINCT user_id) as total_customers
        FROM orders 
        WHERE created_at >= ?
      `, [dateFilter.start]);

      return rows[0].total_customers || 0;
    } catch (error) {
      console.error('Erro ao buscar total de clientes:', error);
      return 0;
    }
  }

  // Valor médio do pedido
  async getAverageOrderValue(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM orders 
        WHERE status = 'completed' 
        AND created_at >= ?
      `, [dateFilter.start]);

      return parseFloat(rows[0].avg_order_value) || 0;
    } catch (error) {
      console.error('Erro ao buscar valor médio do pedido:', error);
      return 0;
    }
  }

  // Taxa de conversão
  async getConversionRate(dateFilter) {
    try {
      // Simular taxa de conversão baseada em visitas estimadas
      const [orders] = await this.db.execute(`
        SELECT COUNT(*) as orders
        FROM orders 
        WHERE created_at >= ?
      `, [dateFilter.start]);

      // Estimativa de visitas (em produção, isso viria de analytics reais)
      const estimatedVisits = orders[0].orders * 20; // 5% de conversão
      const conversionRate = estimatedVisits > 0 ? (orders[0].orders / estimatedVisits) * 100 : 0;

      return Math.round(conversionRate * 100) / 100;
    } catch (error) {
      console.error('Erro ao calcular taxa de conversão:', error);
      return 0;
    }
  }

  // Produtos mais vendidos
  async getTopProducts(dateFilter, limit = 10) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          p.id,
          p.nome,
          p.preco,
          p.imagemUrl,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN produtos p ON oi.product_id = p.id
        WHERE o.created_at >= ?
        GROUP BY p.id, p.nome, p.preco, p.imagemUrl
        ORDER BY total_sold DESC
        LIMIT ?
      `, [dateFilter.start, limit]);

      return rows.map(row => ({
        id: row.id,
        name: row.nome,
        price: parseFloat(row.preco),
        imageUrl: row.imagemUrl,
        totalSold: parseInt(row.total_sold),
        totalRevenue: parseFloat(row.total_revenue)
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos mais vendidos:', error);
      return [];
    }
  }

  // Pedidos recentes
  async getRecentOrders(limit = 10) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          o.id,
          o.user_id,
          o.total_amount,
          o.status,
          o.created_at,
          u.name as customer_name,
          u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT ?
      `, [limit]);

      return rows.map(row => ({
        id: row.id,
        customerName: row.customer_name || 'Cliente Anônimo',
        customerEmail: row.customer_email,
        totalAmount: parseFloat(row.total_amount),
        status: row.status,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes:', error);
      return [];
    }
  }

  // Vendas por dia
  async getSalesByDay(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders 
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [dateFilter.start]);

      return rows.map(row => ({
        date: row.date,
        orders: parseInt(row.orders),
        revenue: parseFloat(row.revenue)
      }));
    } catch (error) {
      console.error('Erro ao buscar vendas por dia:', error);
      return [];
    }
  }

  // Análise de clientes
  async getCustomerAnalytics(period = '30d') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const [
        newCustomers,
        returningCustomers,
        customerLifetimeValue,
        topCustomers,
        customerSegments
      ] = await Promise.all([
        this.getNewCustomers(dateFilter),
        this.getReturningCustomers(dateFilter),
        this.getCustomerLifetimeValue(dateFilter),
        this.getTopCustomers(dateFilter, 10),
        this.getCustomerSegments(dateFilter)
      ]);

      return {
        success: true,
        data: {
          newCustomers,
          returningCustomers,
          customerLifetimeValue,
          topCustomers,
          customerSegments,
          period,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao buscar analytics de clientes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Novos clientes
  async getNewCustomers(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COUNT(DISTINCT user_id) as new_customers
        FROM orders 
        WHERE created_at >= ?
        AND user_id NOT IN (
          SELECT DISTINCT user_id 
          FROM orders 
          WHERE created_at < ?
        )
      `, [dateFilter.start, dateFilter.start]);

      return rows[0].new_customers || 0;
    } catch (error) {
      console.error('Erro ao buscar novos clientes:', error);
      return 0;
    }
  }

  // Clientes recorrentes
  async getReturningCustomers(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COUNT(DISTINCT user_id) as returning_customers
        FROM orders 
        WHERE created_at >= ?
        AND user_id IN (
          SELECT user_id 
          FROM orders 
          WHERE created_at < ?
          GROUP BY user_id
          HAVING COUNT(*) > 0
        )
      `, [dateFilter.start, dateFilter.start]);

      return rows[0].returning_customers || 0;
    } catch (error) {
      console.error('Erro ao buscar clientes recorrentes:', error);
      return 0;
    }
  }

  // Valor de vida do cliente
  async getCustomerLifetimeValue(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COALESCE(AVG(customer_total), 0) as avg_lifetime_value
        FROM (
          SELECT user_id, SUM(total_amount) as customer_total
          FROM orders 
          WHERE created_at >= ?
          GROUP BY user_id
        ) as customer_totals
      `, [dateFilter.start]);

      return parseFloat(rows[0].avg_lifetime_value) || 0;
    } catch (error) {
      console.error('Erro ao calcular valor de vida do cliente:', error);
      return 0;
    }
  }

  // Top clientes
  async getTopCustomers(dateFilter, limit = 10) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          o.user_id,
          u.name as customer_name,
          u.email as customer_email,
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_spent
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.created_at >= ?
        GROUP BY o.user_id, u.name, u.email
        ORDER BY total_spent DESC
        LIMIT ?
      `, [dateFilter.start, limit]);

      return rows.map(row => ({
        userId: row.user_id,
        name: row.customer_name || 'Cliente Anônimo',
        email: row.customer_email,
        totalOrders: parseInt(row.total_orders),
        totalSpent: parseFloat(row.total_spent)
      }));
    } catch (error) {
      console.error('Erro ao buscar top clientes:', error);
      return [];
    }
  }

  // Segmentos de clientes
  async getCustomerSegments(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          CASE 
            WHEN total_spent >= 500 THEN 'VIP'
            WHEN total_spent >= 200 THEN 'Premium'
            WHEN total_spent >= 100 THEN 'Regular'
            ELSE 'Novo'
          END as segment,
          COUNT(*) as count
        FROM (
          SELECT user_id, SUM(total_amount) as total_spent
          FROM orders 
          WHERE created_at >= ?
          GROUP BY user_id
        ) as customer_totals
        GROUP BY segment
        ORDER BY total_spent DESC
      `, [dateFilter.start]);

      return rows.map(row => ({
        segment: row.segment,
        count: parseInt(row.count)
      }));
    } catch (error) {
      console.error('Erro ao buscar segmentos de clientes:', error);
      return [];
    }
  }

  // Relatórios de produtos
  async getProductAnalytics(period = '30d') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      const [
        topSellingProducts,
        lowStockProducts,
        productCategories,
        productPerformance
      ] = await Promise.all([
        this.getTopProducts(dateFilter, 20),
        this.getLowStockProducts(),
        this.getProductCategories(dateFilter),
        this.getProductPerformance(dateFilter)
      ]);

      return {
        success: true,
        data: {
          topSellingProducts,
          lowStockProducts,
          productCategories,
          productPerformance,
          period,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro ao buscar analytics de produtos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Produtos com estoque baixo
  async getLowStockProducts() {
    try {
      const [rows] = await this.db.execute(`
        SELECT id, nome, preco, estoque, imagemUrl
        FROM produtos 
        WHERE estoque <= 10 AND status = 'ativo'
        ORDER BY estoque ASC
      `);

      return rows.map(row => ({
        id: row.id,
        name: row.nome,
        price: parseFloat(row.preco),
        stock: parseInt(row.estoque),
        imageUrl: row.imagemUrl
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos com estoque baixo:', error);
      return [];
    }
  }

  // Categorias de produtos
  async getProductCategories(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          p.categoria,
          COUNT(DISTINCT oi.order_id) as orders,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN produtos p ON oi.product_id = p.id
        WHERE o.created_at >= ?
        GROUP BY p.categoria
        ORDER BY total_revenue DESC
      `, [dateFilter.start]);

      return rows.map(row => ({
        category: row.categoria,
        orders: parseInt(row.orders),
        totalSold: parseInt(row.total_sold),
        totalRevenue: parseFloat(row.total_revenue)
      }));
    } catch (error) {
      console.error('Erro ao buscar categorias de produtos:', error);
      return [];
    }
  }

  // Performance de produtos
  async getProductPerformance(dateFilter) {
    try {
      const [rows] = await this.db.execute(`
        SELECT 
          p.id,
          p.nome,
          p.preco,
          p.estoque,
          COUNT(oi.id) as times_ordered,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue,
          AVG(oi.quantity) as avg_quantity_per_order
        FROM produtos p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= ?
        WHERE p.status = 'ativo'
        GROUP BY p.id, p.nome, p.preco, p.estoque
        ORDER BY total_revenue DESC
      `, [dateFilter.start]);

      return rows.map(row => ({
        id: row.id,
        name: row.nome,
        price: parseFloat(row.preco),
        stock: parseInt(row.estoque),
        timesOrdered: parseInt(row.times_ordered),
        totalSold: parseInt(row.total_sold),
        totalRevenue: parseFloat(row.total_revenue),
        avgQuantityPerOrder: parseFloat(row.avg_quantity_per_order) || 0
      }));
    } catch (error) {
      console.error('Erro ao buscar performance de produtos:', error);
      return [];
    }
  }

  // Gerar filtro de data
  getDateFilter(period) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(now.getDate() - 7);
        break;
      case '30d':
        start.setDate(now.getDate() - 30);
        break;
      case '90d':
        start.setDate(now.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 30);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  }
}

module.exports = new AnalyticsService();
