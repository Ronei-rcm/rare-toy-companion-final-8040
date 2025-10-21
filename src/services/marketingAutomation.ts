/**
 * Sistema de Marketing Automation
 * Campanhas automáticas, segmentação e automação de marketing
 */

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  location: {
    city: string;
    state: string;
    country: string;
  };
  preferences: {
    categories: string[];
    brands: string[];
    priceRange: {
      min: number;
      max: number;
    };
    communication: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  behavior: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: string;
    averageOrderValue: number;
    favoriteProducts: string[];
    abandonedCartItems: string[];
    lastLoginDate?: string;
    emailOpens: number;
    emailClicks: number;
    websiteVisits: number;
  };
  tags: string[];
  customFields: Record<string, any>;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  subject?: string;
  content: string;
  template: string;
  audience: {
    segment: string;
    filters: Record<string, any>;
    excludeSegments: string[];
  };
  schedule: {
    type: 'immediate' | 'scheduled' | 'triggered';
    date?: string;
    time?: string;
    timezone: string;
  };
  trigger?: {
    event: string;
    conditions: Record<string, any>;
    delay?: number; // em minutos
  };
  goals: {
    primary: string;
    secondary?: string[];
    conversionValue?: number;
  };
  settings: {
    sendLimit?: number;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
    maxPerCustomer?: number;
    respectOptOut: boolean;
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    unsubscribe: number;
    complaints: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  conditions: {
    operator: 'AND' | 'OR';
    rules: Array<{
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
      value: any;
    }>;
  };
  customerCount: number;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'welcome' | 'abandoned_cart' | 'order_confirmation' | 'shipping_update' | 'promotional' | 'newsletter' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'send_email' | 'send_sms' | 'send_push' | 'add_tag' | 'remove_tag' | 'add_to_segment' | 'remove_from_segment' | 'create_order' | 'update_customer';
    config: Record<string, any>;
    delay?: number;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class MarketingAutomationEngine {
  private customers: Map<string, Customer> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private segments: Map<string, Segment> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.initializeEngine();
  }

  // Inicializar o motor de automação
  private async initializeEngine() {
    await this.loadInitialData();
    this.startAutomationEngine();
    console.log('📧 Motor de Marketing Automation inicializado');
  }

  // Carregar dados iniciais
  private async loadInitialData() {
    try {
      // Carregar clientes
      const customersResponse = await fetch('/api/customers');
      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        customers.forEach((customer: Customer) => {
          this.customers.set(customer.id, customer);
        });
      }

      // Carregar campanhas
      const campaignsResponse = await fetch('/api/campaigns');
      if (campaignsResponse.ok) {
        const campaigns = await campaignsResponse.json();
        campaigns.forEach((campaign: Campaign) => {
          this.campaigns.set(campaign.id, campaign);
        });
      }

      // Carregar segmentos
      const segmentsResponse = await fetch('/api/segments');
      if (segmentsResponse.ok) {
        const segments = await segmentsResponse.json();
        segments.forEach((segment: Segment) => {
          this.segments.set(segment.id, segment);
        });
      }

      // Carregar templates
      const templatesResponse = await fetch('/api/email-templates');
      if (templatesResponse.ok) {
        const templates = await templatesResponse.json();
        templates.forEach((template: EmailTemplate) => {
          this.templates.set(template.id, template);
        });
      }

      // Carregar regras de automação
      const rulesResponse = await fetch('/api/automation-rules');
      if (rulesResponse.ok) {
        const rules = await rulesResponse.json();
        rules.forEach((rule: AutomationRule) => {
          this.automationRules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  }

  // Iniciar motor de automação
  private startAutomationEngine() {
    if (this.isRunning) return;

    this.isRunning = true;
    
    // Verificar campanhas agendadas a cada minuto
    setInterval(() => {
      this.processScheduledCampaigns();
    }, 60000);

    // Processar regras de automação a cada 30 segundos
    setInterval(() => {
      this.processAutomationRules();
    }, 30000);

    // Atualizar métricas a cada 5 minutos
    setInterval(() => {
      this.updateCampaignMetrics();
    }, 300000);

    console.log('🤖 Motor de automação iniciado');
  }

  // Processar campanhas agendadas
  private async processScheduledCampaigns() {
    const now = new Date();
    
    for (const campaign of this.campaigns.values()) {
      if (campaign.status === 'scheduled' && campaign.schedule.date) {
        const scheduledDate = new Date(campaign.schedule.date);
        
        if (now >= scheduledDate) {
          await this.executeCampaign(campaign.id);
        }
      }
    }
  }

  // Processar regras de automação
  private async processAutomationRules() {
    for (const rule of this.automationRules.values()) {
      if (rule.isActive) {
        await this.evaluateAutomationRule(rule);
      }
    }
  }

  // Executar campanha
  async executeCampaign(campaignId: string): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    try {
      // Atualizar status
      campaign.status = 'running';
      campaign.updatedAt = new Date().toISOString();

      // Obter audiência
      const audience = await this.getCampaignAudience(campaign);
      
      // Enviar para cada cliente
      for (const customerId of audience) {
        await this.sendToCustomer(campaign, customerId);
      }

      // Atualizar métricas
      campaign.metrics.sent = audience.length;
      
      console.log(`📧 Campanha "${campaign.name}" executada para ${audience.length} clientes`);
      return true;
    } catch (error) {
      console.error('Erro ao executar campanha:', error);
      campaign.status = 'cancelled';
      return false;
    }
  }

  // Obter audiência da campanha
  private async getCampaignAudience(campaign: Campaign): Promise<string[]> {
    const segment = this.segments.get(campaign.audience.segment);
    if (!segment) return [];

    return this.getCustomersInSegment(segment);
  }

  // Obter clientes em segmento
  private getCustomersInSegment(segment: Segment): string[] {
    const customers: string[] = [];

    for (const customer of this.customers.values()) {
      if (this.customerMatchesSegment(customer, segment)) {
        customers.push(customer.id);
      }
    }

    return customers;
  }

  // Verificar se cliente corresponde ao segmento
  private customerMatchesSegment(customer: Customer, segment: Segment): boolean {
    const { operator, rules } = segment.conditions;
    
    if (operator === 'AND') {
      return rules.every(rule => this.evaluateRule(customer, rule));
    } else {
      return rules.some(rule => this.evaluateRule(customer, rule));
    }
  }

  // Avaliar regra individual
  private evaluateRule(customer: Customer, rule: any): boolean {
    const { field, operator, value } = rule;
    
    // Obter valor do campo
    const fieldValue = this.getFieldValue(customer, field);
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return false;
    }
  }

  // Obter valor do campo do cliente
  private getFieldValue(customer: Customer, field: string): any {
    const fieldParts = field.split('.');
    let value: any = customer;

    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }

    return value;
  }

  // Enviar para cliente
  private async sendToCustomer(campaign: Campaign, customerId: string): Promise<boolean> {
    const customer = this.customers.get(customerId);
    if (!customer) return false;

    try {
      // Verificar preferências de comunicação
      if (campaign.type === 'email' && !customer.preferences.communication.email) {
        return false;
      }
      if (campaign.type === 'sms' && !customer.preferences.communication.sms) {
        return false;
      }
      if (campaign.type === 'push' && !customer.preferences.communication.push) {
        return false;
      }

      // Personalizar conteúdo
      const personalizedContent = this.personalizeContent(campaign, customer);

      // Enviar mensagem
      switch (campaign.type) {
        case 'email':
          await this.sendEmail(customer.email, campaign.subject || '', personalizedContent);
          break;
        case 'sms':
          await this.sendSMS(customer.phone || '', personalizedContent);
          break;
        case 'push':
          await this.sendPushNotification(customer.id, campaign.subject || '', personalizedContent);
          break;
      }

      // Atualizar métricas do cliente
      this.updateCustomerMetrics(customer, campaign.type);

      return true;
    } catch (error) {
      console.error('Erro ao enviar para cliente:', error);
      return false;
    }
  }

  // Personalizar conteúdo
  private personalizeContent(campaign: Campaign, customer: Customer): string {
    let content = campaign.content;

    // Substituir variáveis
    const variables = {
      '{{customer_name}}': customer.name,
      '{{customer_email}}': customer.email,
      '{{customer_city}}': customer.location.city,
      '{{customer_state}}': customer.location.state,
      '{{total_orders}}': customer.behavior.totalOrders.toString(),
      '{{total_spent}}': customer.behavior.totalSpent.toFixed(2),
      '{{last_order_date}}': customer.behavior.lastOrderDate || 'Nunca',
      '{{favorite_category}}': customer.preferences.categories[0] || 'Geral'
    };

    for (const [placeholder, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    }

    return content;
  }

  // Enviar email
  private async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, content })
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  // Enviar SMS
  private async sendSMS(to: string, content: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, content })
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return false;
    }
  }

  // Enviar notificação push
  private async sendPushNotification(to: string, title: string, content: string): Promise<boolean> {
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, title, content })
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      return false;
    }
  }

  // Atualizar métricas do cliente
  private updateCustomerMetrics(customer: Customer, type: string) {
    switch (type) {
      case 'email':
        customer.behavior.emailOpens++;
        break;
      case 'sms':
        // Métricas específicas de SMS
        break;
      case 'push':
        // Métricas específicas de push
        break;
    }
  }

  // Avaliar regra de automação
  private async evaluateAutomationRule(rule: AutomationRule): Promise<void> {
    // Implementar lógica de avaliação de regras
    // Por exemplo: cliente abandona carrinho -> enviar email de recuperação
  }

  // Atualizar métricas das campanhas
  private async updateCampaignMetrics(): Promise<void> {
    // Implementar atualização de métricas
  }

  // Criar campanha
  async createCampaign(campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<string> {
    const campaign: Campaign = {
      ...campaignData,
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0,
        unsubscribe: 0,
        complaints: 0
      }
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign.id;
  }

  // Criar segmento
  async createSegment(segmentData: Omit<Segment, 'id' | 'customerCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const segment: Segment = {
      ...segmentData,
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calcular número de clientes
    segment.customerCount = this.getCustomersInSegment(segment).length;

    this.segments.set(segment.id, segment);
    return segment.id;
  }

  // Obter estatísticas
  getStats(): {
    totalCustomers: number;
    totalCampaigns: number;
    totalSegments: number;
    activeCampaigns: number;
    totalSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  } {
    const campaigns = Array.from(this.campaigns.values());
    const totalSent = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.metrics.opened, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.metrics.clicked, 0);
    const totalConverted = campaigns.reduce((sum, c) => sum + c.metrics.converted, 0);

    return {
      totalCustomers: this.customers.size,
      totalCampaigns: campaigns.length,
      totalSegments: this.segments.size,
      activeCampaigns: campaigns.filter(c => c.status === 'running').length,
      totalSent,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      conversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0
    };
  }
}

// Instância global do motor de automação
export const marketingAutomation = new MarketingAutomationEngine();

// Hook para usar automação em componentes React
export const useMarketingAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
    setLoading(true);
    setError(null);

    try {
      const campaignId = await marketingAutomation.createCampaign(campaignData);
      return campaignId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSegment = useCallback(async (segmentData: Omit<Segment, 'id' | 'customerCount' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);

    try {
      const segmentId = await marketingAutomation.createSegment(segmentData);
      return segmentId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar segmento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(() => {
    return marketingAutomation.getStats();
  }, []);

  return {
    createCampaign,
    createSegment,
    getStats,
    loading,
    error
  };
};

export default MarketingAutomationEngine;
