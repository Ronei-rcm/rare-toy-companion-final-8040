#!/usr/bin/env node

/**
 * Script para analisar queries lentas e sugerir otimizações
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeSlowQueries() {
  let connection;
  
  try {
    console.log('🔍 Analisando queries lentas...\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3307,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rare_toy_companion'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Queries comuns para analisar
    const queries = [
      {
        name: 'Produtos por categoria e status',
        sql: 'SELECT * FROM produtos WHERE categoria_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20',
        params: [1, 'ativo']
      },
      {
        name: 'Pedidos do cliente',
        sql: 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50',
        params: [1]
      },
      {
        name: 'Itens do carrinho',
        sql: 'SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC',
        params: ['test-cart-id']
      },
      {
        name: 'Busca de produtos',
        sql: 'SELECT * FROM produtos WHERE nome LIKE ? OR descricao LIKE ? LIMIT 20',
        params: ['%test%', '%test%']
      },
      {
        name: 'Estatísticas de pedidos',
        sql: 'SELECT COUNT(*) as total, SUM(total) as revenue FROM orders WHERE DATE(created_at) = CURDATE()',
        params: []
      },
      {
        name: 'Cliente por email',
        sql: 'SELECT * FROM customers WHERE email = ?',
        params: ['test@example.com']
      }
    ];
    
    console.log('📊 Analisando queries com EXPLAIN:\n');
    console.log('═'.repeat(80));
    
    for (const query of queries) {
      console.log(`\n🔍 Query: ${query.name}`);
      console.log(`SQL: ${query.sql}`);
      console.log('-'.repeat(80));
      
      try {
        const [explain] = await connection.execute(`EXPLAIN ${query.sql}`, query.params);
        
        // Verificar se usa índices
        const usesIndex = explain.some(row => row.key !== null);
        const usesFullScan = explain.some(row => row.type === 'ALL');
        const rowsExamined = explain.reduce((sum, row) => sum + (row.rows || 0), 0);
        
        console.log(`   Tipo de busca: ${explain[0]?.type || 'unknown'}`);
        console.log(`   Usa índice: ${usesIndex ? '✅ Sim' : '❌ Não'}`);
        console.log(`   Full table scan: ${usesFullScan ? '⚠️ Sim' : '✅ Não'}`);
        console.log(`   Linhas examinadas: ${rowsExamined}`);
        
        if (usesFullScan && rowsExamined > 100) {
          console.log(`   ⚠️ ATENÇÃO: Query pode ser otimizada!`);
        }
        
        if (explain[0]?.key) {
          console.log(`   Índice usado: ${explain[0].key}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao analisar: ${error.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📋 Verificando índices existentes:\n');
    
    // Listar índices das tabelas principais
    const tables = ['produtos', 'orders', 'order_items', 'cart_items', 'customers', 'customer_addresses'];
    
    for (const table of tables) {
      try {
        const [indexes] = await connection.execute(`
          SHOW INDEXES FROM ${table}
        `);
        
        if (indexes.length > 0) {
          console.log(`\n📊 ${table}:`);
          indexes.forEach(idx => {
            if (idx.Key_name !== 'PRIMARY') {
              console.log(`   - ${idx.Key_name} (${idx.Column_name})`);
            }
          });
        }
      } catch (error) {
        // Tabela pode não existir
        console.log(`   ⚠️ Tabela ${table} não encontrada ou sem índices`);
      }
    }
    
    console.log('\n✅ Análise concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
if (require.main === module) {
  analyzeSlowQueries().catch(console.error);
}

module.exports = { analyzeSlowQueries };

