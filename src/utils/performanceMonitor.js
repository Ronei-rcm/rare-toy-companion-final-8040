
/**
 * Monitor de Performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      errors: [],
      userInteractions: []
    };
  }

  // Medir tempo de carregamento da página
  measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      
      const metrics = {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
      
      this.metrics.pageLoad.push({
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      console.log('📊 Métricas de carregamento:', metrics);
    }
  }

  // Medir tempo de chamadas da API
  measureApiCall(url, method, duration, status) {
    this.metrics.apiCalls.push({
      url,
      method,
      duration,
      status,
      timestamp: Date.now()
    });
    
    if (duration > 3000) { // Chamadas > 3s
      console.warn('⚠️ API call lenta:', { url, duration });
    }
  }

  // Registrar erros
  recordError(error, context) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href
    });
  }

  // Obter métricas agregadas
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        totalPageLoads: this.metrics.pageLoad.length,
        averagePageLoadTime: this.getAveragePageLoadTime(),
        totalApiCalls: this.metrics.apiCalls.length,
        averageApiResponseTime: this.getAverageApiResponseTime(),
        errorRate: this.getErrorRate()
      }
    };
  }

  getAveragePageLoadTime() {
    if (this.metrics.pageLoad.length === 0) return 0;
    const total = this.metrics.pageLoad.reduce((sum, metric) => sum + metric.loadComplete, 0);
    return total / this.metrics.pageLoad.length;
  }

  getAverageApiResponseTime() {
    if (this.metrics.apiCalls.length === 0) return 0;
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return total / this.metrics.apiCalls.length;
  }

  getErrorRate() {
    const totalEvents = this.metrics.pageLoad.length + this.metrics.apiCalls.length;
    if (totalEvents === 0) return 0;
    return (this.metrics.errors.length / totalEvents) * 100;
  }

  getFirstPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }
}

// Instância global
const performanceMonitor = new PerformanceMonitor();

// Auto-inicializar
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.measurePageLoad();
    }, 0);
  });
  
  // Interceptar erros globais
  window.addEventListener('error', (event) => {
    performanceMonitor.recordError(event.error, 'global');
  });
}

module.exports = performanceMonitor;
