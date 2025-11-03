const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../config/logger.cjs');

class BusinessIntelligenceService {
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
        database: process.env.DB_NAME || 'rare_toy_companion',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Business Intelligence Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Business Intelligence Service: Erro na inicialização:', error.message);
    }
  }

  // Executar query personalizada
  async executeCustomQuery(query, parameters = []) {
    try {
      // Validação básica de segurança
      const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE'];
      const upperQuery = query.toUpperCase();
      
      for (const keyword of dangerousKeywords) {
        if (upperQuery.includes(keyword)) {
          return {
            success: false,
            error: 'Query contém operações não permitidas'
          };
        }
      }

      const [rows] = await this.db.execute(query, parameters);
      
      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao executar query personalizada:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar template de relatório
  async createReportTemplate(templateData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        category,
        query_template,
        parameters = [],
        chart_config = {},
        is_public = false,
        created_by
      } = templateData;

      const [result] = await this.db.execute(`
        INSERT INTO report_templates (
          id, name, description, category, query_template, 
          parameters, chart_config, is_public, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, category, query_template,
        JSON.stringify(parameters), JSON.stringify(chart_config), is_public, created_by
      ]);

      return {
        success: true,
        data: { id, ...templateData }
      };
    } catch (error) {
      console.error('Erro ao criar template de relatório:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar templates de relatório
  async getReportTemplates(filters = {}) {
    try {
      let query = 'SELECT * FROM report_templates WHERE 1=1';
      const params = [];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.is_public !== undefined) {
        query += ' AND is_public = ?';
        params.push(filters.is_public);
      }

      if (filters.created_by) {
        query += ' AND created_by = ?';
        params.push(filters.created_by);
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
      console.error('Erro ao listar templates de relatório:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Executar relatório
  async executeReport(templateId, parameters = {}, userId = null) {
    try {
      // Obter template
      const [templates] = await this.db.execute(`
        SELECT * FROM report_templates WHERE id = ?
      `, [templateId]);

      if (templates.length === 0) {
        return {
          success: false,
          error: 'Template de relatório não encontrado'
        };
      }

      const template = templates[0];
      const templateParams = JSON.parse(template.parameters || '[]');
      
      // Substituir parâmetros na query
      let query = template.query_template;
      const queryParams = [];

      for (const param of templateParams) {
        if (parameters[param.name] !== undefined) {
          query = query.replace(new RegExp(`{${param.name}}`, 'g'), '?');
          queryParams.push(parameters[param.name]);
        }
      }

      // Executar query
      const [rows] = await this.db.execute(query, queryParams);

      // Registrar execução
      const executionId = uuidv4();
      await this.db.execute(`
        INSERT INTO report_executions (
          id, template_id, parameters, status, result_data, 
          execution_time_ms, created_by, started_at, completed_at
        ) VALUES (?, ?, ?, 'completed', ?, ?, ?, NOW(), NOW())
      `, [
        executionId, templateId, JSON.stringify(parameters), 
        JSON.stringify(rows), 0, userId
      ]);

      return {
        success: true,
        data: {
          executionId,
          template: template,
          results: rows,
          chartConfig: JSON.parse(template.chart_config || '{}')
        }
      };
    } catch (error) {
      console.error('Erro ao executar relatório:', error);
      
      // Registrar erro
      const executionId = uuidv4();
      await this.db.execute(`
        INSERT INTO report_executions (
          id, template_id, parameters, status, error_message, 
          created_by, started_at
        ) VALUES (?, ?, ?, 'failed', ?, ?, NOW())
      `, [executionId, templateId, JSON.stringify(parameters), error.message, userId]);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar agendamento de relatório
  async createReportSchedule(scheduleData) {
    try {
      const id = uuidv4();
      const {
        template_id,
        name,
        description,
        schedule_type,
        schedule_config,
        recipients,
        is_active = true,
        created_by
      } = scheduleData;

      // Calcular próxima execução
      const nextRun = this.calculateNextRun(schedule_type, schedule_config);

      const [result] = await this.db.execute(`
        INSERT INTO report_schedules (
          id, template_id, name, description, schedule_type, 
          schedule_config, recipients, is_active, next_run, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, template_id, name, description, schedule_type,
        JSON.stringify(schedule_config), JSON.stringify(recipients), 
        is_active, nextRun, created_by
      ]);

      return {
        success: true,
        data: { id, ...scheduleData, next_run: nextRun }
      };
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular próxima execução
  calculateNextRun(scheduleType, scheduleConfig) {
    const now = new Date();
    
    switch (scheduleType) {
      case 'daily':
        const dailyHour = scheduleConfig.hour || 9;
        const nextDaily = new Date(now);
        nextDaily.setHours(dailyHour, 0, 0, 0);
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        return nextDaily;
        
      case 'weekly':
        const weeklyDay = scheduleConfig.day || 1; // Segunda-feira
        const weeklyHour = scheduleConfig.hour || 9;
        const nextWeekly = new Date(now);
        const daysUntilNext = (weeklyDay - now.getDay() + 7) % 7;
        nextWeekly.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        nextWeekly.setHours(weeklyHour, 0, 0, 0);
        return nextWeekly;
        
      case 'monthly':
        const monthlyDay = scheduleConfig.day || 1;
        const monthlyHour = scheduleConfig.hour || 9;
        const nextMonthly = new Date(now.getFullYear(), now.getMonth() + 1, monthlyDay, monthlyHour, 0, 0, 0);
        return nextMonthly;
        
      case 'quarterly':
        const quarterlyMonth = scheduleConfig.month || 0; // Janeiro
        const quarterlyDay = scheduleConfig.day || 1;
        const quarterlyHour = scheduleConfig.hour || 9;
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarter = currentQuarter + 1;
        const nextQuarterly = new Date(now.getFullYear(), nextQuarter * 3, quarterlyDay, quarterlyHour, 0, 0, 0);
        return nextQuarterly;
        
      case 'yearly':
        const yearlyMonth = scheduleConfig.month || 0;
        const yearlyDay = scheduleConfig.day || 1;
        const yearlyHour = scheduleConfig.hour || 9;
        const nextYearly = new Date(now.getFullYear() + 1, yearlyMonth, yearlyDay, yearlyHour, 0, 0, 0);
        return nextYearly;
        
      default:
        return null;
    }
  }

  // Executar relatórios agendados
  async executeScheduledReports() {
    try {
      const now = new Date();
      
      // Buscar relatórios agendados para execução
      const [schedules] = await this.db.execute(`
        SELECT * FROM report_schedules 
        WHERE is_active = TRUE AND next_run <= ?
      `, [now]);

      const results = [];

      for (const schedule of schedules) {
        try {
          // Executar relatório
          const reportResult = await this.executeReport(
            schedule.template_id, 
            {}, 
            schedule.created_by
          );

          if (reportResult.success) {
            // Enviar por email se configurado
            const recipients = JSON.parse(schedule.recipients || '[]');
            if (recipients.length > 0) {
              await this.sendReportEmail(recipients, schedule.name, reportResult.data);
            }

            // Atualizar próxima execução
            const nextRun = this.calculateNextRun(schedule.schedule_type, JSON.parse(schedule.schedule_config));
            await this.db.execute(`
              UPDATE report_schedules 
              SET last_run = NOW(), next_run = ? 
              WHERE id = ?
            `, [nextRun, schedule.id]);

            results.push({
              scheduleId: schedule.id,
              status: 'success',
              nextRun
            });
          } else {
            results.push({
              scheduleId: schedule.id,
              status: 'failed',
              error: reportResult.error
            });
          }
        } catch (error) {
          console.error(`Erro ao executar relatório agendado ${schedule.id}:`, error);
          results.push({
            scheduleId: schedule.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao executar relatórios agendados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar relatório por email
  async sendReportEmail(recipients, reportName, reportData) {
    try {
      // Aqui você integraria com o serviço de email
      console.log(`Enviando relatório "${reportName}" para:`, recipients);
      console.log('Dados do relatório:', reportData);
      
      // Implementação básica - você pode integrar com o emailService
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar relatório por email:', error);
      return { success: false, error: error.message };
    }
  }

  // Criar widget de dashboard
  async createDashboardWidget(widgetData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        widget_type,
        data_source,
        query_template,
        chart_config = {},
        position_x = 0,
        position_y = 0,
        width = 4,
        height = 3,
        is_public = false,
        created_by
      } = widgetData;

      const [result] = await this.db.execute(`
        INSERT INTO dashboard_widgets (
          id, name, description, widget_type, data_source, query_template,
          chart_config, position_x, position_y, width, height, is_public, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, widget_type, data_source, query_template,
        JSON.stringify(chart_config), position_x, position_y, width, height, is_public, created_by
      ]);

      return {
        success: true,
        data: { id, ...widgetData }
      };
    } catch (error) {
      console.error('Erro ao criar widget:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter widgets do dashboard
  async getDashboardWidgets(filters = {}) {
    try {
      let query = 'SELECT * FROM dashboard_widgets WHERE 1=1';
      const params = [];

      if (filters.is_public !== undefined) {
        query += ' AND is_public = ?';
        params.push(filters.is_public);
      }

      if (filters.created_by) {
        query += ' AND created_by = ?';
        params.push(filters.created_by);
      }

      query += ' ORDER BY position_y, position_x';

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter widgets:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Executar widget
  async executeWidget(widgetId, parameters = {}) {
    try {
      const [widgets] = await this.db.execute(`
        SELECT * FROM dashboard_widgets WHERE id = ?
      `, [widgetId]);

      if (widgets.length === 0) {
        return {
          success: false,
          error: 'Widget não encontrado'
        };
      }

      const widget = widgets[0];
      
      // Executar query do widget
      const queryResult = await this.executeCustomQuery(widget.query_template, parameters);
      
      if (!queryResult.success) {
        return queryResult;
      }

      return {
        success: true,
        data: {
          widget: widget,
          results: queryResult.data,
          chartConfig: JSON.parse(widget.chart_config || '{}')
        }
      };
    } catch (error) {
      console.error('Erro ao executar widget:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar métrica KPI
  async createKPIMetric(metricData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        metric_type,
        calculation_formula,
        target_value,
        unit,
        is_active = true,
        created_by
      } = metricData;

      // Calcular valor atual
      const currentValue = await this.calculateMetricValue(calculation_formula);

      const [result] = await this.db.execute(`
        INSERT INTO kpi_metrics (
          id, name, description, metric_type, calculation_formula,
          target_value, current_value, unit, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, metric_type, calculation_formula,
        target_value, currentValue, unit, is_active, created_by
      ]);

      return {
        success: true,
        data: { id, ...metricData, current_value: currentValue }
      };
    } catch (error) {
      console.error('Erro ao criar métrica KPI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular valor da métrica
  async calculateMetricValue(formula) {
    try {
      // Substituir placeholders na fórmula
      let query = formula;
      
      // Placeholders comuns
      const placeholders = {
        '{TODAY}': 'CURDATE()',
        '{YESTERDAY}': 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
        '{THIS_MONTH}': 'DATE_FORMAT(CURDATE(), "%Y-%m-01")',
        '{LAST_MONTH}': 'DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), "%Y-%m-01")',
        '{THIS_YEAR}': 'DATE_FORMAT(CURDATE(), "%Y-01-01")',
        '{LAST_YEAR}': 'DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 YEAR), "%Y-01-01")'
      };

      for (const [placeholder, replacement] of Object.entries(placeholders)) {
        query = query.replace(new RegExp(placeholder, 'g'), replacement);
      }

      const [rows] = await this.db.execute(query);
      
      if (rows.length > 0) {
        const values = Object.values(rows[0]);
        return values[0] || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Erro ao calcular valor da métrica:', error);
      return 0;
    }
  }

  // Atualizar métricas KPI
  async updateKPIMetrics() {
    try {
      const [metrics] = await this.db.execute(`
        SELECT * FROM kpi_metrics WHERE is_active = TRUE
      `);

      const results = [];

      for (const metric of metrics) {
        try {
          const currentValue = await this.calculateMetricValue(metric.calculation_formula);
          
          // Calcular tendência
          const previousValue = metric.current_value || 0;
          const trendPercentage = previousValue > 0 
            ? ((currentValue - previousValue) / previousValue) * 100 
            : 0;
          
          const trendDirection = trendPercentage > 5 ? 'up' : 
                                trendPercentage < -5 ? 'down' : 'stable';

          await this.db.execute(`
            UPDATE kpi_metrics 
            SET current_value = ?, trend_direction = ?, trend_percentage = ?, updated_at = NOW()
            WHERE id = ?
          `, [currentValue, trendDirection, trendPercentage, metric.id]);

          results.push({
            metricId: metric.id,
            name: metric.name,
            currentValue,
            trendDirection,
            trendPercentage
          });
        } catch (error) {
          console.error(`Erro ao atualizar métrica ${metric.id}:`, error);
          results.push({
            metricId: metric.id,
            name: metric.name,
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao atualizar métricas KPI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter métricas KPI
  async getKPIMetrics() {
    try {
      const [rows] = await this.db.execute(`
        SELECT * FROM kpi_metrics 
        WHERE is_active = TRUE 
        ORDER BY created_at DESC
      `);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter métricas KPI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Exportar relatório
  async exportReport(templateId, format = 'csv', parameters = {}) {
    try {
      const reportResult = await this.executeReport(templateId, parameters);
      
      if (!reportResult.success) {
        return reportResult;
      }

      const { template, results } = reportResult.data;
      
      // Criar diretório de exports se não existir
      const exportsDir = path.join(__dirname, '../../exports');
      await fs.mkdir(exportsDir, { recursive: true });

      const fileName = `${template.name}_${Date.now()}.${format}`;
      const filePath = path.join(exportsDir, fileName);

      let content = '';

      switch (format) {
        case 'csv':
          content = this.convertToCSV(results);
          break;
        case 'json':
          content = JSON.stringify(results, null, 2);
          break;
        case 'xlsx':
          // Implementar conversão para Excel
          content = this.convertToExcel(results);
          break;
        default:
          return {
            success: false,
            error: 'Formato não suportado'
          };
      }

      await fs.writeFile(filePath, content);

      return {
        success: true,
        data: {
          fileName,
          filePath,
          downloadUrl: `/exports/${fileName}`
        }
      };
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Converter para CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }

  // Converter para Excel (implementação básica)
  convertToExcel(data) {
    // Implementação básica - você pode usar uma biblioteca como xlsx
    return JSON.stringify(data, null, 2);
  }

  // Obter estatísticas gerais do sistema
  async getSystemStats() {
    try {
      const [overview] = await this.db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COUNT(*) FROM produtos) as total_products,
          (SELECT SUM(total) FROM orders) as total_revenue,
          (SELECT COUNT(*) FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as orders_last_30_days,
          (SELECT SUM(total) FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as revenue_last_30_days
      `);

      const [recentOrders] = await this.db.execute(`
        SELECT 
          o.*,
          u.name as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);

      const [topProducts] = await this.db.execute(`
        SELECT 
          p.nome,
          p.sku,
          SUM(oi.quantity) as total_sold,
          SUM(oi.quantity * oi.price) as total_revenue
        FROM order_items oi
        LEFT JOIN produtos p ON oi.product_id = p.id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.id, p.nome, p.sku
        ORDER BY total_sold DESC
        LIMIT 10
      `);

      return {
        success: true,
        data: {
          overview: overview[0],
          recentOrders,
          topProducts
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do sistema:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BusinessIntelligenceService();
