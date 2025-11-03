const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const mysql = require('mysql2/promise');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.isAuthenticated = false;
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

  // Configurar OAuth2
  async setupOAuth2() {
    try {
      console.log('🔧 Iniciando configuração OAuth2...');
      
      // Tentar obter configurações do banco de dados primeiro
      const apiConfigService = require('./apiConfigService.cjs');
      const config = await apiConfigService.getConfigForService();
      
      console.log('📊 Configuração obtida:', config);
      
      if (config && config.clientId && config.clientSecret && config.redirectUri) {
        console.log('✅ Usando configurações do banco de dados:', {
          clientId: config.clientId,
          redirectUri: config.redirectUri
        });
        this.oauth2Client = new OAuth2Client(
          config.clientId,
          config.clientSecret,
          config.redirectUri
        );
      } else {
        console.log('⚠️ Fallback para variáveis de ambiente');
        // Fallback para variáveis de ambiente
        this.oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/oauth/callback'
        );
      }

      // Verificar se já temos tokens salvos
      const tokens = await this.getStoredTokens();
      if (tokens) {
        this.oauth2Client.setCredentials(tokens);
        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        this.isAuthenticated = true;
        console.log('✅ Google Calendar autenticado com tokens salvos');
      } else {
        console.log('✅ OAuth2 configurado, aguardando autorização');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar OAuth2:', error);
      return false;
    }
  }

  // Obter tokens salvos do banco
  async getStoredTokens() {
    try {
      const [rows] = await this.pool.execute(
        'SELECT access_token, refresh_token, expiry_date FROM google_calendar_tokens WHERE id = 1'
      );
      
      if (rows.length > 0) {
        const token = rows[0];
        return {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expiry_date: token.expiry_date
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao obter tokens:', error);
      return null;
    }
  }

  // Salvar tokens no banco
  async saveTokens(tokens) {
    try {
      await this.pool.execute(`
        INSERT INTO google_calendar_tokens (id, access_token, refresh_token, expiry_date, created_at, updated_at)
        VALUES (1, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        expiry_date = VALUES(expiry_date),
        updated_at = NOW()
      `, [
        tokens.access_token,
        tokens.refresh_token,
        tokens.expiry_date
      ]);
      console.log('✅ Tokens salvos no banco de dados');
    } catch (error) {
      console.error('❌ Erro ao salvar tokens:', error);
    }
  }

  // Gerar URL de autorização
  async getAuthUrl() {
    if (!this.oauth2Client) {
      console.log('⚠️ OAuth2 não configurado, inicializando...');
      await this.setupOAuth2();
    }

    if (!this.oauth2Client) {
      throw new Error('OAuth2 não configurado');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Processar callback de autorização
  async handleCallback(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Salvar tokens
      await this.saveTokens(tokens);
      
      // Configurar cliente do Calendar
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.isAuthenticated = true;
      
      console.log('✅ Google Calendar autenticado com sucesso');
      return { success: true, message: 'Autenticação realizada com sucesso' };
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      return { success: false, message: 'Erro na autenticação' };
    }
  }

  // Sincronizar evento com Google Calendar
  async syncEvent(event) {
    if (!this.isAuthenticated) {
      throw new Error('Google Calendar não autenticado');
    }

    try {
      const eventData = {
        summary: event.titulo,
        description: event.descricao || '',
        start: {
          dateTime: new Date(event.data_evento).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(new Date(event.data_evento).getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
          timeZone: 'America/Sao_Paulo'
        },
        location: event.local || '',
        colorId: '2', // Verde para eventos da loja
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        }
      };

      // Adicionar preço se disponível
      if (event.preco) {
        eventData.description += `\n\n💰 Preço: R$ ${event.preco.toFixed(2)}`;
      }

      // Adicionar vagas se disponível
      if (event.numero_vagas) {
        eventData.description += `\n\n👥 Vagas: ${event.numero_vagas}`;
        if (event.vagas_limitadas) {
          eventData.description += ' (Limitadas)';
        }
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData
      });

      console.log(`✅ Evento sincronizado: ${event.titulo}`);
      return {
        success: true,
        googleEventId: response.data.id,
        eventUrl: response.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Erro ao sincronizar evento:', error);
      throw error;
    }
  }

  // Atualizar evento no Google Calendar
  async updateEvent(event, googleEventId) {
    if (!this.isAuthenticated) {
      throw new Error('Google Calendar não autenticado');
    }

    try {
      const eventData = {
        summary: event.titulo,
        description: event.descricao || '',
        start: {
          dateTime: new Date(event.data_evento).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(new Date(event.data_evento).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: event.local || '',
        colorId: '2'
      };

      if (event.preco) {
        eventData.description += `\n\n💰 Preço: R$ ${event.preco.toFixed(2)}`;
      }

      if (event.numero_vagas) {
        eventData.description += `\n\n👥 Vagas: ${event.numero_vagas}`;
        if (event.vagas_limitadas) {
          eventData.description += ' (Limitadas)';
        }
      }

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: googleEventId,
        resource: eventData
      });

      console.log(`✅ Evento atualizado: ${event.titulo}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Deletar evento do Google Calendar
  async deleteEvent(googleEventId) {
    if (!this.isAuthenticated) {
      throw new Error('Google Calendar não autenticado');
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId
      });

      console.log(`✅ Evento deletado do Google Calendar: ${googleEventId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
  }

  // Sincronizar todos os eventos ativos
  async syncAllEvents() {
    try {
      const [events] = await this.pool.execute(`
        SELECT * FROM events 
        WHERE ativo = 1 
        AND data_evento >= NOW()
        ORDER BY data_evento ASC
      `);

      const results = [];
      for (const event of events) {
        try {
          const result = await this.syncEvent(event);
          results.push({
            eventId: event.id,
            eventTitle: event.titulo,
            success: true,
            googleEventId: result.googleEventId,
            eventUrl: result.eventUrl
          });

          // Salvar Google Event ID no banco
          await this.pool.execute(
            'UPDATE events SET google_event_id = ? WHERE id = ?',
            [result.googleEventId, event.id]
          );
        } catch (error) {
          results.push({
            eventId: event.id,
            eventTitle: event.titulo,
            success: false,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Erro ao sincronizar todos os eventos:', error);
      throw error;
    }
  }

  // Verificar status da autenticação
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasOAuth2Client: !!this.oauth2Client,
      hasCalendar: !!this.calendar
    };
  }

  // Desconectar (limpar tokens)
  async disconnect() {
    try {
      await this.pool.execute('DELETE FROM google_calendar_tokens WHERE id = 1');
      this.oauth2Client = null;
      this.calendar = null;
      this.isAuthenticated = false;
      console.log('✅ Google Calendar desconectado');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new GoogleCalendarService();
