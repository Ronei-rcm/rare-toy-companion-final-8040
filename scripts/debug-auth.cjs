#!/usr/bin/env node

/**
 * Script para debugar problemas de autenticação
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_store',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  charset: 'utf8mb4'
};

async function debugAuth() {
  let connection;
  
  try {
    console.log('🔍 Debugando autenticação...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco');

    // 1. Verificar sessão
    console.log('\n📋 Verificando sessão test-session-123...');
    const [sessions] = await connection.execute('SELECT * FROM sessions WHERE id = ?', ['test-session-123']);
    console.log('Sessões encontradas:', sessions.length);
    if (sessions.length > 0) {
      console.log('Sessão:', sessions[0]);
    }

    // 2. Verificar cliente
    console.log('\n👤 Verificando cliente cliente@exemplo.com...');
    const [customers] = await connection.execute('SELECT * FROM customers WHERE email = ?', ['cliente@exemplo.com']);
    console.log('Clientes encontrados:', customers.length);
    if (customers.length > 0) {
      console.log('Cliente:', customers[0]);
    }

    // 3. Testar query completa
    console.log('\n🔗 Testando query completa...');
    const sessionId = 'test-session-123';
    const [sessions2] = await connection.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
    
    if (sessions2 && sessions2[0] && sessions2[0].user_email) {
      const userEmail = sessions2[0].user_email;
      console.log('Email da sessão:', userEmail);
      
      const [customers2] = await connection.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
      if (customers2 && customers2[0]) {
        const userId = customers2[0].id;
        console.log('User ID encontrado:', userId);
        
        // Testar query de endereços
        const [addresses] = await connection.execute(`
          SELECT * FROM customer_addresses 
          WHERE customer_id = ? 
          ORDER BY padrao DESC, created_at DESC
        `, [userId]);
        
        console.log('Endereços encontrados:', addresses.length);
        console.log('Endereços:', addresses);
      } else {
        console.log('❌ Cliente não encontrado para email:', userEmail);
      }
    } else {
      console.log('❌ Sessão inválida ou sem email');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugAuth().catch(console.error);
