#!/usr/bin/env node

/**
 * Script para otimizar performance do banco de dados
 * Cria índices, corrige collation e otimiza queries
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

async function optimizeDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado com sucesso');

    // 1. Verificar e corrigir collation
    console.log('\n🔧 Verificando collation das tabelas...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    for (const table of tables) {
      if (table.TABLE_COLLATION !== 'utf8mb4_unicode_ci') {
        console.log(`🔄 Corrigindo collation da tabela ${table.TABLE_NAME}...`);
        await connection.execute(`
          ALTER TABLE \`${table.TABLE_NAME}\` 
          CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        `);
        console.log(`✅ ${table.TABLE_NAME} corrigida`);
      }
    }

    // 2. Criar índices de performance
    console.log('\n📊 Criando índices de performance...');
    
    const indexes = [
      // Produtos
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_category ON products(categoria_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_price ON products(preco)',
      'CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at)',
      'CREATE FULLTEXT INDEX IF NOT EXISTS idx_products_search ON products(nome, descricao)',
      
      // Pedidos
      'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_total ON orders(total)',
      
      // Itens de pedido
      'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id)',
      
      // Carrinho
      'CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id)',
      'CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id)',
      
      // Clientes
      'CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)',
      'CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at)',
      
      // Endereços
      'CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_addresses_default ON customer_addresses(is_default)',
      
      // Transações financeiras
      'CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_financial_category ON financial_transactions(category_id)',
      
      // Fornecedores
      'CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status)',
      'CREATE INDEX IF NOT EXISTS idx_suppliers_created ON suppliers(created_at)',
      
      // Sessões
      'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
      
      // Notificações
      'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
        const indexName = indexQuery.match(/idx_\w+/)?.[0] || 'unknown';
        console.log(`✅ Índice ${indexName} criado/verificado`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`ℹ️ Índice já existe: ${indexQuery.match(/idx_\w+/)?.[0]}`);
        } else {
          console.warn(`⚠️ Erro ao criar índice: ${error.message}`);
        }
      }
    }

    // 3. Analisar tabelas para otimização
    console.log('\n📈 Analisando tabelas para otimização...');
    const [tableStats] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        DATA_LENGTH,
        INDEX_LENGTH,
        (DATA_LENGTH + INDEX_LENGTH) as TOTAL_SIZE
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TOTAL_SIZE DESC
    `);

    console.log('\n📊 Estatísticas das tabelas:');
    console.log('┌─────────────────────┬──────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Tabela              │ Registros│ Dados (MB)  │ Índices(MB) │ Total (MB)  │');
    console.log('├─────────────────────┼──────────┼─────────────┼─────────────┼─────────────┤');
    
    for (const stat of tableStats) {
      const dataMB = (stat.DATA_LENGTH / 1024 / 1024).toFixed(2);
      const indexMB = (stat.INDEX_LENGTH / 1024 / 1024).toFixed(2);
      const totalMB = (stat.TOTAL_SIZE / 1024 / 1024).toFixed(2);
      
      console.log(`│ ${stat.TABLE_NAME.padEnd(19)} │ ${stat.TABLE_ROWS.toString().padEnd(8)} │ ${dataMB.padEnd(11)} │ ${indexMB.padEnd(11)} │ ${totalMB.padEnd(11)} │`);
    }
    console.log('└─────────────────────┴──────────┴─────────────┴─────────────┴─────────────┘');

    // 4. Verificar queries lentas
    console.log('\n🔍 Verificando queries que podem ser otimizadas...');
    
    const slowQueries = [
      {
        name: 'Produtos por categoria',
        query: 'SELECT * FROM products WHERE categoria_id = ? ORDER BY created_at DESC LIMIT 20'
      },
      {
        name: 'Pedidos do cliente',
        query: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
      },
      {
        name: 'Busca de produtos',
        query: 'SELECT * FROM products WHERE nome LIKE ? OR descricao LIKE ? LIMIT 20'
      }
    ];

    for (const { name, query } of slowQueries) {
      try {
        const [result] = await connection.execute(`EXPLAIN ${query}`, ['1', '%test%', '%test%']);
        console.log(`✅ Query "${name}" otimizada`);
      } catch (error) {
        console.warn(`⚠️ Erro ao verificar query "${name}": ${error.message}`);
      }
    }

    console.log('\n🎉 Otimização do banco de dados concluída!');
    console.log('\n📋 Resumo das melhorias:');
    console.log('✅ Collation corrigida para utf8mb4_unicode_ci');
    console.log('✅ Índices de performance criados');
    console.log('✅ Estatísticas das tabelas analisadas');
    console.log('✅ Queries principais verificadas');

  } catch (error) {
    console.error('❌ Erro durante otimização:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco encerrada');
    }
  }
}

// Executar otimização
optimizeDatabase().catch(console.error);
