const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../config/logger.cjs');

class ExternalApiService {
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
      console.log('✅ External API Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ External API Service: Erro na inicialização:', error.message);
    }
  }

  // ===== GESTÃO DE APIs EXTERNAS =====

  // Criar configuração de API externa
  async createExternalApi(apiData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        api_type,
        provider,
        base_url,
        api_key,
        api_secret,
        webhook_url,
        is_active = true,
        config = {},
        created_by
      } = apiData;

      const [result] = await this.db.execute(`
        INSERT INTO external_apis (
          id, name, description, api_type, provider, base_url, 
          api_key, api_secret, webhook_url, is_active, config, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, api_type, provider, base_url,
        api_key, api_secret, webhook_url, is_active, JSON.stringify(config), created_by
      ]);

      return {
        success: true,
        data: { id, ...apiData }
      };
    } catch (error) {
      console.error('Erro ao criar API externa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar APIs externas
  async getExternalApis(filters = {}) {
    try {
      let query = 'SELECT * FROM external_apis WHERE 1=1';
      const params = [];

      if (filters.api_type) {
        query += ' AND api_type = ?';
        params.push(filters.api_type);
      }

      if (filters.provider) {
        query += ' AND provider = ?';
        params.push(filters.provider);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
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
      console.error('Erro ao listar APIs externas:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fazer requisição para API externa
  async makeApiRequest(apiId, endpoint, method = 'GET', data = null, headers = {}) {
    try {
      // Obter configuração da API
      const [apis] = await this.db.execute(`
        SELECT * FROM external_apis WHERE id = ? AND is_active = TRUE
      `, [apiId]);

      if (apis.length === 0) {
        return {
          success: false,
          error: 'API não encontrada ou inativa'
        };
      }

      const api = apis[0];
      const apiConfig = JSON.parse(api.config || '{}');
      
      // Preparar URL completa
      const fullUrl = `${api.base_url}${endpoint}`;
      
      // Preparar headers padrão
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'MuhlStore-API-Client/1.0'
      };

      // Adicionar autenticação baseada no tipo de API
      if (api.api_key) {
        switch (api.provider.toLowerCase()) {
          case 'stripe':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'paypal':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'mercadopago':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'pagseguro':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'correios':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'facebook':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'instagram':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          case 'google':
            defaultHeaders['Authorization'] = `Bearer ${api.api_key}`;
            break;
          default:
            defaultHeaders['X-API-Key'] = api.api_key;
        }
      }

      // Adicionar headers customizados
      const finalHeaders = { ...defaultHeaders, ...headers };

      const startTime = Date.now();
      let response;

      // Fazer requisição
      const requestConfig = {
        method: method.toLowerCase(),
        url: fullUrl,
        headers: finalHeaders,
        timeout: apiConfig.timeout || 30000
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.data = data;
      }

      response = await axios(requestConfig);
      
      const responseTime = Date.now() - startTime;

      // Registrar requisição no banco
      await this.logApiRequest(apiId, endpoint, method, data, response.data, response.status, responseTime);

      return {
        success: true,
        data: response.data,
        status: response.status,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Registrar erro no banco
      await this.logApiRequest(apiId, endpoint, method, data, null, error.response?.status || 0, responseTime, error.message);

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        responseTime
      };
    }
  }

  // Registrar requisição de API
  async logApiRequest(apiId, endpoint, method, requestData, responseData, statusCode, responseTime, errorMessage = null) {
    try {
      const id = uuidv4();
      
      await this.db.execute(`
        INSERT INTO api_requests (
          id, api_id, endpoint, method, request_data, response_data, 
          status_code, response_time_ms, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, apiId, endpoint, method, 
        JSON.stringify(requestData), JSON.stringify(responseData),
        statusCode, responseTime, errorMessage
      ]);
    } catch (error) {
      console.error('Erro ao registrar requisição de API:', error);
    }
  }

  // ===== INTEGRAÇÕES DE PAGAMENTO =====

  // Processar pagamento via Stripe
  async processStripePayment(paymentData) {
    try {
      const stripeApi = await this.getApiByProvider('stripe', 'payment');
      if (!stripeApi) {
        return { success: false, error: 'API do Stripe não configurada' };
      }

      const { amount, currency, payment_method, customer_id, description } = paymentData;

      const paymentIntent = await this.makeApiRequest(
        stripeApi.id,
        '/v1/payment_intents',
        'POST',
        {
          amount: Math.round(amount * 100), // Stripe usa centavos
          currency: currency || 'brl',
          payment_method: payment_method,
          customer: customer_id,
          description: description,
          confirm: true
        }
      );

      return paymentIntent;
    } catch (error) {
      console.error('Erro ao processar pagamento Stripe:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar pagamento via PayPal
  async processPayPalPayment(paymentData) {
    try {
      const paypalApi = await this.getApiByProvider('paypal', 'payment');
      if (!paypalApi) {
        return { success: false, error: 'API do PayPal não configurada' };
      }

      const { amount, currency, return_url, cancel_url, description } = paymentData;

      const order = await this.makeApiRequest(
        paypalApi.id,
        '/v2/checkout/orders',
        'POST',
        {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency || 'BRL',
              value: amount.toString()
            },
            description: description
          }],
          application_context: {
            return_url: return_url,
            cancel_url: cancel_url
          }
        }
      );

      return order;
    } catch (error) {
      console.error('Erro ao processar pagamento PayPal:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Processar pagamento via Mercado Pago
  async processMercadoPagoPayment(paymentData) {
    try {
      const mpApi = await this.getApiByProvider('mercadopago', 'payment');
      if (!mpApi) {
        return { success: false, error: 'API do Mercado Pago não configurada' };
      }

      const { amount, currency, description, external_reference, notification_url } = paymentData;

      const preference = await this.makeApiRequest(
        mpApi.id,
        '/checkout/preferences',
        'POST',
        {
          items: [{
            title: description,
            quantity: 1,
            unit_price: amount
          }],
          currency_id: currency || 'BRL',
          external_reference: external_reference,
          notification_url: notification_url
        }
      );

      return preference;
    } catch (error) {
      console.error('Erro ao processar pagamento Mercado Pago:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== INTEGRAÇÕES DE FRETE =====

  // Calcular frete via Correios
  async calculateCorreiosShipping(shippingData) {
    try {
      const correiosApi = await this.getApiByProvider('correios', 'shipping');
      if (!correiosApi) {
        return { success: false, error: 'API dos Correios não configurada' };
      }

      const { cep_origem, cep_destino, peso, comprimento, largura, altura, valor_declarado } = shippingData;

      const response = await this.makeApiRequest(
        correiosApi.id,
        '/calculador/CalcPrecoPrazo.aspx',
        'GET',
        null,
        {
          params: {
            nCdServico: '04014,04510,04782', // PAC, SEDEX, SEDEX 10
            sCepOrigem: cep_origem,
            sCepDestino: cep_destino,
            nVlPeso: peso,
            nCdFormato: 1, // Caixa
            nVlComprimento: comprimento,
            nVlLargura: largura,
            nVlAltura: altura,
            nVlDiametro: 0,
            nVlValorDeclarado: valor_declarado || 0,
            sCdMaoPropria: 'N',
            sCdAvisoRecebimento: 'N'
          }
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao calcular frete Correios:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Rastrear encomenda via Correios
  async trackCorreiosPackage(trackingCode) {
    try {
      const correiosApi = await this.getApiByProvider('correios', 'shipping');
      if (!correiosApi) {
        return { success: false, error: 'API dos Correios não configurada' };
      }

      const response = await this.makeApiRequest(
        correiosApi.id,
        `/rastro/v1/objetos/${trackingCode}`,
        'GET'
      );

      return response;
    } catch (error) {
      console.error('Erro ao rastrear encomenda:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== INTEGRAÇÕES DE REDES SOCIAIS =====

  // Postar no Facebook
  async postToFacebook(postData) {
    try {
      const facebookApi = await this.getApiByProvider('facebook', 'social');
      if (!facebookApi) {
        return { success: false, error: 'API do Facebook não configurada' };
      }

      const { message, link, image_url, page_id } = postData;

      const response = await this.makeApiRequest(
        facebookApi.id,
        `/${page_id}/feed`,
        'POST',
        {
          message: message,
          link: link,
          picture: image_url
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao postar no Facebook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Postar no Instagram
  async postToInstagram(postData) {
    try {
      const instagramApi = await this.getApiByProvider('instagram', 'social');
      if (!instagramApi) {
        return { success: false, error: 'API do Instagram não configurada' };
      }

      const { image_url, caption, hashtags } = postData;

      const response = await this.makeApiRequest(
        instagramApi.id,
        '/v1/media',
        'POST',
        {
          image_url: image_url,
          caption: `${caption} ${hashtags}`.trim()
        }
      );

      return response;
    } catch (error) {
      console.error('Erro ao postar no Instagram:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== SISTEMA DE WEBHOOKS =====

  // Criar webhook
  async createWebhook(webhookData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        url,
        events,
        headers = {},
        is_active = true,
        retry_count = 3,
        timeout_seconds = 30,
        created_by
      } = webhookData;

      const [result] = await this.db.execute(`
        INSERT INTO webhooks (
          id, name, description, url, events, headers, 
          is_active, retry_count, timeout_seconds, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, url, JSON.stringify(events), JSON.stringify(headers),
        is_active, retry_count, timeout_seconds, created_by
      ]);

      return {
        success: true,
        data: { id, ...webhookData }
      };
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enviar webhook
  async sendWebhook(webhookId, eventType, payload) {
    try {
      // Obter configuração do webhook
      const [webhooks] = await this.db.execute(`
        SELECT * FROM webhooks WHERE id = ? AND is_active = TRUE
      `, [webhookId]);

      if (webhooks.length === 0) {
        return {
          success: false,
          error: 'Webhook não encontrado ou inativo'
        };
      }

      const webhook = webhooks[0];
      const events = JSON.parse(webhook.events || '[]');

      // Verificar se o evento está configurado
      if (!events.includes(eventType)) {
        return {
          success: false,
          error: 'Evento não configurado para este webhook'
        };
      }

      // Criar registro de entrega
      const deliveryId = uuidv4();
      await this.db.execute(`
        INSERT INTO webhook_deliveries (
          id, webhook_id, event_type, payload, status
        ) VALUES (?, ?, ?, ?, 'pending')
      `, [deliveryId, webhookId, eventType, JSON.stringify(payload)]);

      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'MuhlStore-Webhook/1.0',
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': this.generateWebhookSignature(payload, webhook.id)
      };

      // Adicionar headers customizados
      const customHeaders = JSON.parse(webhook.headers || '{}');
      Object.assign(headers, customHeaders);

      // Enviar webhook
      const startTime = Date.now();
      let response;

      try {
        response = await axios({
          method: 'POST',
          url: webhook.url,
          data: payload,
          headers: headers,
          timeout: webhook.timeout_seconds * 1000
        });

        const responseTime = Date.now() - startTime;

        // Atualizar status de entrega
        await this.db.execute(`
          UPDATE webhook_deliveries 
          SET status = 'delivered', response_status = ?, response_body = ?, delivered_at = NOW()
          WHERE id = ?
        `, [response.status, JSON.stringify(response.data), deliveryId]);

        return {
          success: true,
          data: {
            deliveryId,
            status: response.status,
            responseTime
          }
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        // Atualizar status de erro
        await this.db.execute(`
          UPDATE webhook_deliveries 
          SET status = 'failed', response_status = ?, error_message = ?
          WHERE id = ?
        `, [error.response?.status || 0, error.message, deliveryId]);

        return {
          success: false,
          error: error.message,
          status: error.response?.status || 0
        };
      }
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Gerar assinatura do webhook
  generateWebhookSignature(payload, webhookId) {
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Processar webhook recebido
  async processIncomingWebhook(req, res) {
    try {
      const signature = req.headers['x-webhook-signature'];
      const eventType = req.headers['x-webhook-event'];
      const payload = req.body;

      // Verificar assinatura
      if (!this.verifyWebhookSignature(payload, signature)) {
        return res.status(401).json({ error: 'Assinatura inválida' });
      }

      // Processar evento baseado no tipo
      switch (eventType) {
        case 'payment.completed':
          await this.handlePaymentCompleted(payload);
          break;
        case 'order.shipped':
          await this.handleOrderShipped(payload);
          break;
        case 'customer.created':
          await this.handleCustomerCreated(payload);
          break;
        default:
          console.log(`Evento não processado: ${eventType}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Verificar assinatura do webhook
  verifyWebhookSignature(payload, signature) {
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    return signature === expectedSignature;
  }

  // ===== HANDLERS DE EVENTOS =====

  async handlePaymentCompleted(payload) {
    console.log('Pagamento completado:', payload);
    // Implementar lógica de processamento de pagamento
  }

  async handleOrderShipped(payload) {
    console.log('Pedido enviado:', payload);
    // Implementar lógica de atualização de status
  }

  async handleCustomerCreated(payload) {
    console.log('Cliente criado:', payload);
    // Implementar lógica de sincronização de cliente
  }

  // ===== UTILITÁRIOS =====

  // Obter API por provedor
  async getApiByProvider(provider, type) {
    try {
      const [apis] = await this.db.execute(`
        SELECT * FROM external_apis 
        WHERE provider = ? AND api_type = ? AND is_active = TRUE
        ORDER BY created_at DESC LIMIT 1
      `, [provider, type]);

      return apis.length > 0 ? apis[0] : null;
    } catch (error) {
      console.error('Erro ao obter API por provedor:', error);
      return null;
    }
  }

  // Obter estatísticas de APIs
  async getApiStats() {
    try {
      const [requestStats] = await this.db.execute(`
        SELECT 
          ar.api_id,
          ea.name as api_name,
          ea.provider,
          COUNT(*) as total_requests,
          AVG(ar.response_time_ms) as avg_response_time,
          SUM(CASE WHEN ar.status_code >= 200 AND ar.status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN ar.status_code >= 400 THEN 1 ELSE 0 END) as failed_requests
        FROM api_requests ar
        LEFT JOIN external_apis ea ON ar.api_id = ea.id
        WHERE ar.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY ar.api_id, ea.name, ea.provider
        ORDER BY total_requests DESC
      `);

      const [webhookStats] = await this.db.execute(`
        SELECT 
          wd.webhook_id,
          w.name as webhook_name,
          COUNT(*) as total_deliveries,
          SUM(CASE WHEN wd.status = 'delivered' THEN 1 ELSE 0 END) as successful_deliveries,
          SUM(CASE WHEN wd.status = 'failed' THEN 1 ELSE 0 END) as failed_deliveries
        FROM webhook_deliveries wd
        LEFT JOIN webhooks w ON wd.webhook_id = w.id
        WHERE wd.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY wd.webhook_id, w.name
        ORDER BY total_deliveries DESC
      `);

      return {
        success: true,
        data: {
          apiStats: requestStats,
          webhookStats: webhookStats
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de APIs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Testar conectividade da API
  async testApiConnection(apiId) {
    try {
      const [apis] = await this.db.execute(`
        SELECT * FROM external_apis WHERE id = ?
      `, [apiId]);

      if (apis.length === 0) {
        return { success: false, error: 'API não encontrada' };
      }

      const api = apis[0];
      
      // Fazer requisição de teste baseada no provedor
      let testEndpoint = '/';
      switch (api.provider.toLowerCase()) {
        case 'stripe':
          testEndpoint = '/v1/charges?limit=1';
          break;
        case 'paypal':
          testEndpoint = '/v1/notifications/webhooks';
          break;
        case 'mercadopago':
          testEndpoint = '/users/me';
          break;
        case 'correios':
          testEndpoint = '/rastro/v1/objetos/test';
          break;
        default:
          testEndpoint = '/';
      }

      const result = await this.makeApiRequest(apiId, testEndpoint, 'GET');
      
      return {
        success: result.success,
        data: {
          status: result.status,
          responseTime: result.responseTime,
          error: result.error
        }
      };
    } catch (error) {
      console.error('Erro ao testar conexão da API:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ExternalApiService();
