// Teste direto de INSERT via Node.js
const mysql = require('mysql2/promise');

async function testInsert() {
  console.log('=== TESTE DE INSERT DIRETO VIA NODE.JS ===');
  
  try {
    // Criar conexão direta (não pool)
    // SECURITY: Usar variáveis de ambiente, nunca hardcodar senhas
    require('dotenv').config();
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion'
    });
    
    console.log('✅ Conexão criada');
    
    // Verificar banco atual
    const [db] = await connection.query('SELECT DATABASE() as db');
    console.log('📊 Banco atual:', db[0].db);
    
    // Verificar estrutura da tabela
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'rare_toy_companion' 
      AND TABLE_NAME = 'produtos'
      AND COLUMN_NAME = 'categoria_id'
    `);
    console.log('📊 Coluna categoria_id existe?', columns.length > 0 ? 'SIM' : 'NÃO');
    
    if (columns.length > 0) {
      // Tentar INSERT
      const id = require('crypto').randomUUID();
      const [result] = await connection.query(`
        INSERT INTO produtos (
          id, nome, preco, categoria, categoria_id, estoque, status,
          destaque, promocao, lancamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, 'Teste Node.js Direto', 50.00, 'Outros', 1, 10, 'ativo', 0, 0, 0]);
      
      console.log('✅ INSERT executado com sucesso!');
      console.log('📊 Result:', result);
    } else {
      console.log('❌ Coluna categoria_id não encontrada!');
    }
    
    await connection.end();
    console.log('✅ Conexão fechada');
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('❌ Código:', error.code);
    console.error('❌ SQL State:', error.sqlState);
    console.error('❌ Stack:', error.stack);
  }
}

testInsert();

