#!/usr/bin/env node

/**
 * Script para testar endpoint de endereços
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_store',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  charset: 'utf8mb4'
};

const pool = mysql.createPool(config);

// Endpoint de teste
app.get('/api/test/addresses', async (req, res) => {
  try {
    console.log('🧪 Teste GET /api/test/addresses');
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    console.log('Session ID:', sessionId);
    
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        console.log('Sessões encontradas:', sessions.length);
        
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          console.log('Clientes encontrados:', customers.length);
          
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Buscar endereços
    const [addresses] = await pool.execute(`
      SELECT * FROM customer_addresses 
      WHERE customer_id = ? 
      ORDER BY padrao DESC, created_at DESC
    `, [userId]);
    
    console.log(`✅ ${addresses.length} endereços encontrados`);
    res.json(addresses);
    
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Endpoint POST de teste
app.post('/api/test/addresses', async (req, res) => {
  try {
    console.log('🧪 Teste POST /api/test/addresses');
    console.log('Body:', req.body);
    
    const { nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default } = req.body;
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    
    if (sessionId) {
      const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (sessions && sessions[0] && sessions[0].user_email) {
        const userEmail = sessions[0].user_email;
        const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
        if (customers && customers[0]) {
          userId = customers[0].id;
        }
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Se for endereço padrão, remover padrão dos outros
    if (is_default) {
      await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ?', [userId]);
    }
    
    // Inserir novo endereço
    const [result] = await pool.execute(
      `INSERT INTO customer_addresses 
      (customer_id, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, padrao, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [userId, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo || 'residencial', is_default ? 1 : 0]
    );
    
    console.log('✅ Endereço criado com ID:', result.insertId);
    res.json({ success: true, id: result.insertId });
    
  } catch (error) {
    console.error('❌ Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🧪 Servidor de teste rodando na porta ${PORT}`);
  console.log('Teste GET: curl -X GET "http://localhost:3002/api/test/addresses" -b "session_id=test-session-123"');
  console.log('Teste POST: curl -X POST "http://localhost:3002/api/test/addresses" -H "Content-Type: application/json" -b "session_id=test-session-123" -d \'{"nome":"Casa","rua":"Rua Teste","numero":"123","cidade":"São Paulo","estado":"SP","cep":"01234567","is_default":1}\'');
});
