/**
 * Script para testar inserção de transação recorrente
 * Execute: node scripts/test-recurring-insert.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testInsert() {
  let connection;

  try {
    // Usar a mesma configuração do servidor
    const pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: false,
      charset: 'utf8mb4'
    });

    console.log('✅ Pool criado');

    connection = await pool.getConnection();
    console.log('✅ Conexão obtida');

    // Verificar banco atual
    const [dbCheck] = await connection.query('SELECT DATABASE() as current_db');
    console.log('📊 Banco atual:', dbCheck[0]);

    // Tentar SELECT direto
    console.log('\n🔍 Tentando SELECT direto...');
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as total FROM `rare_toy_companion`.`recurring_transactions`');
      console.log('✅ SELECT funcionou! Total:', rows[0].total);
    } catch (selectError) {
      console.error('❌ Erro no SELECT:', selectError.message);
      console.log('\n🔍 Tentando SELECT sem nome do banco...');
      try {
        const [rows2] = await connection.execute('SELECT COUNT(*) as total FROM recurring_transactions');
        console.log('✅ SELECT sem banco funcionou! Total:', rows2[0].total);
      } catch (selectError2) {
        console.error('❌ Erro no SELECT sem banco:', selectError2.message);
        throw selectError2;
      }
    }

    // Tentar INSERT de teste
    console.log('\n📝 Tentando INSERT...');
    const crypto = require('crypto');
    const testId = crypto.randomUUID();
    
    const [result] = await connection.execute(`
      INSERT INTO \`rare_toy_companion\`.\`recurring_transactions\` (
        id, descricao, categoria, tipo, valor, status, metodo_pagamento,
        frequency, start_date, next_occurrence, is_active, auto_create
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testId,
      'Teste de Transação Recorrente',
      'Teste',
      'entrada',
      100.00,
      'Pendente',
      'Pix',
      'monthly',
      '2025-12-06',
      '2026-01-06',
      true,
      true
    ]);

    console.log('✅ INSERT funcionou! ID:', testId);
    console.log('✅ Result:', result);

    // Verificar se foi inserido
    const [check] = await connection.execute(
      'SELECT * FROM `rare_toy_companion`.`recurring_transactions` WHERE id = ?',
      [testId]
    );
    console.log('✅ Verificação:', check.length > 0 ? 'Registro encontrado!' : 'Registro NÃO encontrado');

    // Limpar teste
    await connection.execute(
      'DELETE FROM `rare_toy_companion`.`recurring_transactions` WHERE id = ?',
      [testId]
    );
    console.log('🧹 Teste limpo');

    connection.release();
    await pool.end();
    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    if (connection) connection.release();
    process.exit(1);
  }
}

testInsert();

