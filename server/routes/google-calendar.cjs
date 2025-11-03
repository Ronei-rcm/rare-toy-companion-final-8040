const express = require('express');
const router = express.Router();
const googleCalendarService = require('../services/googleCalendarService.cjs');
const mysql = require('mysql2/promise');

// Configurar pool de conexão MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Inicializar serviço
googleCalendarService.setupOAuth2();

// GET /api/google/status - Verificar status da autenticação
router.get('/status', async (req, res) => {
  try {
    const status = googleCalendarService.getAuthStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/google/auth - Obter URL de autorização
router.get('/auth', async (req, res) => {
  try {
    const authUrl = await googleCalendarService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('❌ Erro ao gerar URL de auth:', error);
    res.status(500).json({ error: 'Erro ao gerar URL de autorização' });
  }
});

// GET /api/google/oauth/callback - Callback de autorização
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Código de autorização não fornecido' });
    }

    const result = await googleCalendarService.handleCallback(code);
    
    if (result.success) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/eventos?google_auth=success`);
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/eventos?google_auth=error`);
    }
  } catch (error) {
    console.error('❌ Erro no callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/eventos?google_auth=error`);
  }
});

// POST /api/google/sync-event/:id - Sincronizar evento específico
router.post('/sync-event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar evento no banco
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ? AND ativo = 1',
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    const event = events[0];
    const result = await googleCalendarService.syncEvent(event);
    
    // Salvar Google Event ID no banco
    await pool.execute(
      'UPDATE events SET google_event_id = ? WHERE id = ?',
      [result.googleEventId, id]
    );
    
    res.json({
      success: true,
      message: 'Evento sincronizado com sucesso',
      googleEventId: result.googleEventId,
      eventUrl: result.eventUrl
    });
  } catch (error) {
    console.error('❌ Erro ao sincronizar evento:', error);
    res.status(500).json({ 
      error: 'Erro ao sincronizar evento',
      message: error.message 
    });
  }
});

// POST /api/google/sync-all - Sincronizar todos os eventos
router.post('/sync-all', async (req, res) => {
  try {
    const results = await googleCalendarService.syncAllEvents();
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Sincronização concluída: ${successCount} sucessos, ${errorCount} erros`,
      results
    });
  } catch (error) {
    console.error('❌ Erro ao sincronizar todos os eventos:', error);
    res.status(500).json({ 
      error: 'Erro ao sincronizar eventos',
      message: error.message 
    });
  }
});

// PUT /api/google/update-event/:id - Atualizar evento no Google Calendar
router.put('/update-event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar evento no banco
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    const event = events[0];
    
    if (!event.google_event_id) {
      return res.status(400).json({ error: 'Evento não está sincronizado com Google Calendar' });
    }
    
    await googleCalendarService.updateEvent(event, event.google_event_id);
    
    res.json({
      success: true,
      message: 'Evento atualizado no Google Calendar'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar evento',
      message: error.message 
    });
  }
});

// DELETE /api/google/delete-event/:id - Deletar evento do Google Calendar
router.delete('/delete-event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar evento no banco
    const [events] = await pool.execute(
      'SELECT google_event_id FROM events WHERE id = ?',
      [id]
    );
    
    if (events.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    const googleEventId = events[0].google_event_id;
    
    if (!googleEventId) {
      return res.status(400).json({ error: 'Evento não está sincronizado com Google Calendar' });
    }
    
    await googleCalendarService.deleteEvent(googleEventId);
    
    // Remover Google Event ID do banco
    await pool.execute(
      'UPDATE events SET google_event_id = NULL WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Evento removido do Google Calendar'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar evento',
      message: error.message 
    });
  }
});

// POST /api/google/disconnect - Desconectar Google Calendar
router.post('/disconnect', async (req, res) => {
  try {
    const result = await googleCalendarService.disconnect();
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
    res.status(500).json({ 
      error: 'Erro ao desconectar',
      message: error.message 
    });
  }
});

module.exports = router;
