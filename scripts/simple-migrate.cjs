#!/usr/bin/env node

/**
 * Script simples para migrar tabelas essenciais
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  charset: 'utf8mb4'
};

async function simpleMigrate() {
  let sourceConn, targetConn;
  
  try {
    console.log('🔌 Conectando aos bancos...');
    sourceConn = await mysql.createConnection({ ...config, database: 'rare_toy_companion' });
    targetConn = await mysql.createConnection({ ...config, database: 'rare_toy_store' });
    console.log('✅ Conectado com sucesso');

    // Tabelas essenciais para migrar
    const essentialTables = [
      'categorias',
      'produtos', 
      'customers',
      'customer_addresses',
      'carts',
      'cart_items',
      'orders',
      'order_items',
      'admin_users',
      'collections',
      'collection_products',
      'financial_transactions',
      'financial_categories',
      'suppliers',
      'sessions'
    ];

    for (const tableName of essentialTables) {
      try {
        console.log(`\n📋 Migrando tabela: ${tableName}`);
        
        // 1. Verificar se tabela existe no source
        const [sourceTables] = await sourceConn.execute(`
          SELECT COUNT(*) as count 
          FROM information_schema.TABLES 
          WHERE TABLE_SCHEMA = 'rare_toy_companion' 
          AND TABLE_NAME = ?
        `, [tableName]);

        if (sourceTables[0].count === 0) {
          console.log(`⚠️ Tabela ${tableName} não existe no source, pulando...`);
          continue;
        }

        // 2. Obter estrutura da tabela
        const [createTable] = await sourceConn.execute(`SHOW CREATE TABLE ${tableName}`);
        const createStatement = createTable[0]['Create Table'];
        
        // 3. Criar tabela no target (se não existir)
        try {
          await targetConn.execute(`DROP TABLE IF EXISTS ${tableName}`);
          await targetConn.execute(createStatement);
          console.log(`✅ Estrutura da tabela ${tableName} criada`);
        } catch (error) {
          console.log(`ℹ️ Tabela ${tableName} já existe ou erro na criação: ${error.message}`);
        }

        // 4. Migrar dados
        const [rows] = await sourceConn.execute(`SELECT * FROM ${tableName}`);
        
        if (rows.length > 0) {
          // Obter colunas
          const [columns] = await sourceConn.execute(`DESCRIBE ${tableName}`);
          const columnNames = columns.map(col => col.Field);
          
          // Preparar INSERT
          const placeholders = columnNames.map(() => '?').join(', ');
          const insertQuery = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders})`;
          
          // Inserir dados em lotes
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            for (const row of batch) {
              const values = columnNames.map(col => row[col]);
              await targetConn.execute(insertQuery, values);
            }
          }
          
          console.log(`✅ ${rows.length} registros migrados para ${tableName}`);
        } else {
          console.log(`ℹ️ Tabela ${tableName} está vazia`);
        }

      } catch (error) {
        console.error(`❌ Erro ao migrar ${tableName}:`, error.message);
        // Continuar com próxima tabela
      }
    }

    console.log('\n🎉 Migração concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Reiniciar servidor: npm run pm2:restart');
    console.log('   2. Testar endpoints da API');

  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
  } finally {
    if (sourceConn) await sourceConn.end();
    if (targetConn) await targetConn.end();
    console.log('\n🔌 Conexões encerradas');
  }
}

simpleMigrate().catch(console.error);
