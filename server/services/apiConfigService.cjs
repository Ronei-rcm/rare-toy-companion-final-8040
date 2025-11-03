const mysql = require('mysql2/promise');

class ApiConfigService {
  constructor() {
    this.pool = null;
    this.initPool();
  }

  // Inicializar pool de conexão MySQL
  initPool() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // Obter configurações atuais
  async getConfig() {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM api_configurations WHERE id = 1'
      );
      
      if (rows.length > 0) {
        return {
          id: rows[0].id,
          google_client_id: rows[0].google_client_id || '',
          google_client_secret: rows[0].google_client_secret || '',
          google_redirect_uri: rows[0].google_redirect_uri || '',
          frontend_url: rows[0].frontend_url || '',
          is_active: Boolean(rows[0].is_active),
          created_at: rows[0].created_at,
          updated_at: rows[0].updated_at
        };
      }
      
      // Retornar configuração padrão se não existir
      return {
        id: 1,
        google_client_id: '',
        google_client_secret: '',
        google_redirect_uri: 'http://localhost:3001/api/google/oauth/callback',
        frontend_url: 'http://localhost:3000',
        is_active: false,
        created_at: null,
        updated_at: null
      };
    } catch (error) {
      console.error('❌ Erro ao obter configurações:', error);
      throw error;
    }
  }

  // Salvar configurações
  async saveConfig(config) {
    try {
      const {
        google_client_id,
        google_client_secret,
        google_redirect_uri,
        frontend_url,
        is_active = false
      } = config;

      await this.pool.execute(`
        INSERT INTO api_configurations (
          id, google_client_id, google_client_secret, google_redirect_uri, 
          frontend_url, is_active, created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        google_client_id = VALUES(google_client_id),
        google_client_secret = VALUES(google_client_secret),
        google_redirect_uri = VALUES(google_redirect_uri),
        frontend_url = VALUES(frontend_url),
        is_active = VALUES(is_active),
        updated_at = NOW()
      `, [
        google_client_id,
        google_client_secret,
        google_redirect_uri,
        frontend_url,
        is_active ? 1 : 0
      ]);

      console.log('✅ Configurações da API salvas');
      return { success: true, message: 'Configurações salvas com sucesso' };
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      throw error;
    }
  }

  // Testar configurações do Google
  async testGoogleConfig() {
    try {
      const config = await this.getConfig();
      
      if (!config.google_client_id || !config.google_client_secret) {
        return {
          success: false,
          message: 'Client ID e Client Secret são obrigatórios'
        };
      }

      // Testar se as credenciais são válidas fazendo uma requisição simples
      const { OAuth2Client } = require('google-auth-library');
      const oauth2Client = new OAuth2Client(
        config.google_client_id,
        config.google_client_secret,
        config.google_redirect_uri
      );

      // Gerar URL de teste
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        prompt: 'consent'
      });

      return {
        success: true,
        message: 'Configurações válidas',
        testUrl: authUrl
      };
    } catch (error) {
      console.error('❌ Erro ao testar configurações:', error);
      return {
        success: false,
        message: `Erro ao testar: ${error.message}`
      };
    }
  }

  // Ativar/Desativar integração
  async toggleIntegration(active) {
    try {
      await this.pool.execute(
        'UPDATE api_configurations SET is_active = ?, updated_at = NOW() WHERE id = 1',
        [active ? 1 : 0]
      );

      console.log(`✅ Integração ${active ? 'ativada' : 'desativada'}`);
      return { success: true, message: `Integração ${active ? 'ativada' : 'desativada'} com sucesso` };
    } catch (error) {
      console.error('❌ Erro ao alterar status da integração:', error);
      throw error;
    }
  }

  // Obter configurações para uso no GoogleCalendarService
  async getConfigForService() {
    try {
      const config = await this.getConfig();
      
      if (!config.is_active) {
        return null;
      }

      return {
        clientId: config.google_client_id,
        clientSecret: config.google_client_secret,
        redirectUri: config.google_redirect_uri
      };
    } catch (error) {
      console.error('❌ Erro ao obter configurações para serviço:', error);
      return null;
    }
  }

  // Validar configurações obrigatórias
  validateConfig(config) {
    const errors = [];

    if (!config.google_client_id || config.google_client_id.trim() === '') {
      errors.push('Client ID do Google é obrigatório');
    }

    if (!config.google_client_secret || config.google_client_secret.trim() === '') {
      errors.push('Client Secret do Google é obrigatório');
    }

    if (!config.google_redirect_uri || config.google_redirect_uri.trim() === '') {
      errors.push('Redirect URI é obrigatório');
    }

    if (!config.frontend_url || config.frontend_url.trim() === '') {
      errors.push('Frontend URL é obrigatória');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ApiConfigService();



