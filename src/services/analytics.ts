/**
 * Sistema de Analytics Avançado
 * Integração com Google Analytics 4 e métricas customizadas
 */

// Declaração global do gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface AnalyticsEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface EcommerceEvent {
  event_name: 'purchase' | 'add_to_cart' | 'remove_from_cart' | 'view_item' | 'begin_checkout';
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category: string;
    item_brand?: string;
    price: number;
    quantity: number;
  }>;
}

interface UserProperties {
  user_id?: string;
  user_type?: 'new' | 'returning' | 'vip';
  subscription_status?: 'active' | 'inactive';
  preferred_language?: string;
  preferred_currency?: string;
  customer_lifetime_value?: number;
  last_purchase_date?: string;
  total_orders?: number;
  favorite_category?: string;
}

class AdvancedAnalytics {
  private measurementId: string;
  private isInitialized: boolean = false;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private customEvents: Map<string, number> = new Map();

  constructor(measurementId: string = 'G-XXXXXXXXXX') {
    this.measurementId = measurementId;
    this.initializeAnalytics();
  }

  // Inicializar Google Analytics 4
  private initializeAnalytics() {
    if (typeof window === 'undefined') return;

    // Carregar script do Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Inicializar gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });

    this.isInitialized = true;
    this.sessionId = this.generateSessionId();
    
    console.log('📊 Analytics inicializado com sucesso');
  }

  // Gerar ID de sessão único
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configurar usuário
  setUser(userId: string, properties?: UserProperties) {
    this.userId = userId;
    
    if (this.isInitialized) {
      window.gtag('config', this.measurementId, {
        user_id: userId,
        custom_map: properties
      });
    }
  }

  // Rastrear visualização de página
  trackPageView(pageName: string, pagePath: string, customParameters?: Record<string, any>) {
    if (!this.isInitialized) return;

    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: window.location.href,
      page_path: pagePath,
      ...customParameters
    });
  }

  // Rastrear evento customizado
  trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    window.gtag('event', event.event_name, {
      event_category: event.event_category,
      event_label: event.event_label,
      value: event.value,
      ...event.custom_parameters
    });
  }

  // Rastrear evento de e-commerce
  trackEcommerceEvent(ecommerceEvent: EcommerceEvent) {
    if (!this.isInitialized) return;

    window.gtag('event', ecommerceEvent.event_name, {
      currency: ecommerceEvent.currency,
      value: ecommerceEvent.value,
      items: ecommerceEvent.items
    });
  }

  // Rastrear visualização de produto
  trackProductView(product: {
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    currency?: string;
  }) {
    this.trackEcommerceEvent({
      event_name: 'view_item',
      currency: product.currency || 'BRL',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: 1
      }]
    });
  }

  // Rastrear adição ao carrinho
  trackAddToCart(product: {
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
    currency?: string;
  }) {
    this.trackEcommerceEvent({
      event_name: 'add_to_cart',
      currency: product.currency || 'BRL',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: product.quantity
      }]
    });
  }

  // Rastrear remoção do carrinho
  trackRemoveFromCart(product: {
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
    currency?: string;
  }) {
    this.trackEcommerceEvent({
      event_name: 'remove_from_cart',
      currency: product.currency || 'BRL',
      value: product.price * product.quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: product.quantity
      }]
    });
  }

  // Rastrear início do checkout
  trackBeginCheckout(products: Array<{
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
  }>, currency: string = 'BRL') {
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

    this.trackEcommerceEvent({
      event_name: 'begin_checkout',
      currency,
      value: totalValue,
      items: products.map(product => ({
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: product.quantity
      }))
    });
  }

  // Rastrear compra concluída
  trackPurchase(transaction: {
    transaction_id: string;
    value: number;
    currency?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
  }, products: Array<{
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
  }>) {
    this.trackEcommerceEvent({
      event_name: 'purchase',
      currency: transaction.currency || 'BRL',
      value: transaction.value,
      items: products.map(product => ({
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: product.quantity
      }))
    });

    // Evento adicional com detalhes da transação
    this.trackEvent({
      event_name: 'purchase_completed',
      event_category: 'ecommerce',
      value: transaction.value,
      custom_parameters: {
        transaction_id: transaction.transaction_id,
        tax: transaction.tax,
        shipping: transaction.shipping,
        coupon: transaction.coupon
      }
    });
  }

  // Rastrear busca
  trackSearch(searchTerm: string, resultsCount: number, category?: string) {
    this.trackEvent({
      event_name: 'search',
      event_category: 'engagement',
      event_label: searchTerm,
      value: resultsCount,
      custom_parameters: {
        search_term: searchTerm,
        results_count: resultsCount,
        category: category
      }
    });
  }

  // Rastrear filtros aplicados
  trackFilterApplied(filters: Record<string, any>, resultsCount: number) {
    this.trackEvent({
      event_name: 'filter_applied',
      event_category: 'engagement',
      value: resultsCount,
      custom_parameters: {
        filters: JSON.stringify(filters),
        results_count: resultsCount
      }
    });
  }

  // Rastrear favoritos
  trackFavorite(productId: string, action: 'add' | 'remove', productName: string) {
    this.trackEvent({
      event_name: action === 'add' ? 'add_to_favorites' : 'remove_from_favorites',
      event_category: 'engagement',
      event_label: productName,
      custom_parameters: {
        product_id: productId,
        product_name: productName
      }
    });
  }

  // Rastrear compartilhamento
  trackShare(contentType: 'product' | 'page', contentId: string, method: 'social' | 'copy_link' | 'email') {
    this.trackEvent({
      event_name: 'share',
      event_category: 'engagement',
      event_label: contentType,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        method: method
      }
    });
  }

  // Rastrear erro
  trackError(errorType: string, errorMessage: string, errorLocation: string) {
    this.trackEvent({
      event_name: 'error',
      event_category: 'technical',
      event_label: errorType,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        error_location: errorLocation
      }
    });
  }

  // Rastrear tempo na página
  trackTimeOnPage(pageName: string, timeSpent: number) {
    this.trackEvent({
      event_name: 'time_on_page',
      event_category: 'engagement',
      event_label: pageName,
      value: timeSpent,
      custom_parameters: {
        page_name: pageName,
        time_spent_seconds: timeSpent
      }
    });
  }

  // Rastrear scroll
  trackScroll(depth: number, pageName: string) {
    this.trackEvent({
      event_name: 'scroll',
      event_category: 'engagement',
      event_label: pageName,
      value: depth,
      custom_parameters: {
        scroll_depth: depth,
        page_name: pageName
      }
    });
  }

  // Rastrear clique em botão
  trackButtonClick(buttonName: string, buttonLocation: string, pageName: string) {
    this.trackEvent({
      event_name: 'button_click',
      event_category: 'engagement',
      event_label: buttonName,
      custom_parameters: {
        button_name: buttonName,
        button_location: buttonLocation,
        page_name: pageName
      }
    });
  }

  // Rastrear formulário
  trackFormSubmit(formName: string, formLocation: string, success: boolean) {
    this.trackEvent({
      event_name: success ? 'form_submit_success' : 'form_submit_error',
      event_category: 'engagement',
      event_label: formName,
      custom_parameters: {
        form_name: formName,
        form_location: formLocation,
        success: success
      }
    });
  }

  // Rastrear evento customizado com contador
  trackCustomEvent(eventName: string, increment: number = 1) {
    const currentCount = this.customEvents.get(eventName) || 0;
    const newCount = currentCount + increment;
    this.customEvents.set(eventName, newCount);

    this.trackEvent({
      event_name: eventName,
      event_category: 'custom',
      value: newCount,
      custom_parameters: {
        count: newCount,
        increment: increment
      }
    });
  }

  // Obter métricas customizadas
  getCustomMetrics(): Record<string, number> {
    return Object.fromEntries(this.customEvents);
  }

  // Limpar métricas customizadas
  clearCustomMetrics() {
    this.customEvents.clear();
  }

  // Rastrear performance
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    this.trackEvent({
      event_name: 'performance_metric',
      event_category: 'technical',
      event_label: metricName,
      value: value,
      custom_parameters: {
        metric_name: metricName,
        unit: unit
      }
    });
  }

  // Rastrear conversão de objetivo
  trackGoal(goalName: string, goalValue: number, goalCategory: string = 'conversion') {
    this.trackEvent({
      event_name: 'goal_completed',
      event_category: goalCategory,
      event_label: goalName,
      value: goalValue,
      custom_parameters: {
        goal_name: goalName,
        goal_value: goalValue
      }
    });
  }

  // Rastrear A/B test
  trackABTest(testName: string, variant: string, conversion: boolean = false) {
    this.trackEvent({
      event_name: 'ab_test',
      event_category: 'experiment',
      event_label: testName,
      custom_parameters: {
        test_name: testName,
        variant: variant,
        conversion: conversion
      }
    });
  }

  // Obter ID da sessão
  getSessionId(): string | null {
    return this.sessionId;
  }

  // Obter ID do usuário
  getUserId(): string | null {
    return this.userId;
  }

  // Verificar se está inicializado
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Instância global do analytics
export const analytics = new AdvancedAnalytics(import.meta.env.VITE_GA_MEASUREMENT_ID);

// Hook para usar analytics em componentes React
export const useAnalytics = () => {
  const trackPageView = useCallback((pageName: string, pagePath: string, customParameters?: Record<string, any>) => {
    analytics.trackPageView(pageName, pagePath, customParameters);
  }, []);

  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analytics.trackEvent(event);
  }, []);

  const trackProductView = useCallback((product: {
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    currency?: string;
  }) => {
    analytics.trackProductView(product);
  }, []);

  const trackAddToCart = useCallback((product: {
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
    currency?: string;
  }) => {
    analytics.trackAddToCart(product);
  }, []);

  const trackPurchase = useCallback((transaction: {
    transaction_id: string;
    value: number;
    currency?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
  }, products: Array<{
    id: string;
    name: string;
    category: string;
    brand?: string;
    price: number;
    quantity: number;
  }>) => {
    analytics.trackPurchase(transaction, products);
  }, []);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number, category?: string) => {
    analytics.trackSearch(searchTerm, resultsCount, category);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, errorLocation: string) => {
    analytics.trackError(errorType, errorMessage, errorLocation);
  }, []);

  return {
    trackPageView,
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackPurchase,
    trackSearch,
    trackError,
    isReady: analytics.isReady(),
    sessionId: analytics.getSessionId(),
    userId: analytics.getUserId()
  };
};

export default AdvancedAnalytics;
