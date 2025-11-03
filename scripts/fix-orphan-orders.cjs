#!/usr/bin/env node

/**
 * Script para corrigir pedidos órfãos
 * Remove pedidos que não têm customer_id válido associado
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'RSM_Rg51gti66',
  database: 'rare_toy_companion',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function fixOrphanOrders() {
  console.log('🔍 Verificando pedidos órfãos...');
  
  try {
    // Buscar pedidos que não têm customer_id válido
    const [orphanOrders] = await pool.execute(`
      SELECT o.id, o.email, o.customer_id, o.user_id, o.created_at
      FROM orders o
      WHERE o.customer_id IS NULL 
         OR o.customer_id = ''
         OR o.customer_id NOT IN (SELECT id FROM customers)
      ORDER BY o.created_at DESC
    `);
    
    console.log(`📊 Encontrados ${orphanOrders.length} pedidos órfãos`);
    
    if (orphanOrders.length === 0) {
      console.log('✅ Nenhum pedido órfão encontrado!');
      return;
    }
    
    // Mostrar pedidos órfãos
    console.log('\n📋 Pedidos órfãos encontrados:');
    orphanOrders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order.id}`);
      console.log(`   Email: ${order.email || 'N/A'}`);
      console.log(`   Customer ID: ${order.customer_id || 'N/A'}`);
      console.log(`   User ID: ${order.user_id || 'N/A'}`);
      console.log(`   Data: ${order.created_at}`);
      console.log('');
    });
    
    // Perguntar se deve remover
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Deseja remover estes pedidos órfãos? (s/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'sim') {
      console.log('🗑️ Removendo pedidos órfãos...');
      
      for (const order of orphanOrders) {
        try {
          // Remover itens do pedido primeiro
          await pool.execute('DELETE FROM order_items WHERE order_id = ?', [order.id]);
          console.log(`✅ Itens do pedido ${order.id} removidos`);
          
          // Remover o pedido
          await pool.execute('DELETE FROM orders WHERE id = ?', [order.id]);
          console.log(`✅ Pedido ${order.id} removido`);
          
        } catch (error) {
          console.error(`❌ Erro ao remover pedido ${order.id}:`, error.message);
        }
      }
      
      console.log('✅ Limpeza concluída!');
    } else {
      console.log('ℹ️ Operação cancelada pelo usuário');
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar pedidos órfãos:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Iniciando correção de pedidos órfãos...\n');
  
  try {
    await fixOrphanOrders();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Script concluído!');
}

if (require.main === module) {
  main();
}

module.exports = { fixOrphanOrders };
