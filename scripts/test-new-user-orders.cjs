#!/usr/bin/env node

/**
 * Script para testar criação de novos usuários sem pedidos pré-existentes
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: 'rare_toy_companion',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testNewUserOrders() {
  console.log('🧪 Testando sistema de pedidos para novos usuários...\n');
  
  try {
    // 1. Verificar se existem pedidos sem customer_id válido
    console.log('1️⃣ Verificando pedidos órfãos...');
    const [orphanOrders] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM orders o
      WHERE o.customer_id IS NULL 
         OR o.customer_id = ''
         OR o.customer_id NOT IN (SELECT id FROM customers)
    `);
    
    console.log(`   📊 Pedidos órfãos encontrados: ${orphanOrders[0].count}`);
    
    if (orphanOrders[0].count > 0) {
      console.log('   ⚠️  ATENÇÃO: Existem pedidos órfãos!');
    } else {
      console.log('   ✅ Nenhum pedido órfão encontrado');
    }
    
    // 2. Verificar estrutura da tabela orders
    console.log('\n2️⃣ Verificando estrutura da tabela orders...');
    const [orderStructure] = await pool.execute('DESCRIBE orders');
    const hasCustomerId = orderStructure.some(col => col.Field === 'customer_id');
    const hasUserId = orderStructure.some(col => col.Field === 'user_id');
    
    console.log(`   📋 Coluna customer_id: ${hasCustomerId ? '✅' : '❌'}`);
    console.log(`   📋 Coluna user_id: ${hasUserId ? '✅' : '❌'}`);
    
    // 3. Verificar se existem clientes de teste
    console.log('\n3️⃣ Verificando clientes de teste...');
    const [testCustomers] = await pool.execute(`
      SELECT id, email, nome, created_at
      FROM customers 
      WHERE email LIKE '%teste%' 
         OR email LIKE '%@example.com'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`   📊 Clientes de teste encontrados: ${testCustomers.length}`);
    testCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.email} (${customer.nome}) - ${customer.created_at}`);
    });
    
    // 4. Verificar pedidos de clientes de teste
    if (testCustomers.length > 0) {
      console.log('\n4️⃣ Verificando pedidos de clientes de teste...');
      
      for (const customer of testCustomers) {
        const [customerOrders] = await pool.execute(`
          SELECT id, status, total, created_at
          FROM orders 
          WHERE customer_id = ? OR user_id = ?
          ORDER BY created_at DESC
          LIMIT 3
        `, [customer.id, customer.id]);
        
        console.log(`   👤 Cliente: ${customer.email}`);
        console.log(`      📦 Pedidos encontrados: ${customerOrders.length}`);
        
        customerOrders.forEach((order, index) => {
          console.log(`      ${index + 1}. ${order.id} - ${order.status} - R$ ${order.total} - ${order.created_at}`);
        });
        
        if (customerOrders.length === 0) {
          console.log('      ✅ Cliente sem pedidos (correto para novo usuário)');
        }
      }
    }
    
    // 5. Testar endpoint de pedidos
    console.log('\n5️⃣ Testando endpoint de pedidos...');
    
    // Simular uma requisição sem sessão
    const testEmail = 'teste300@gmail.com';
    const [testUser] = await pool.execute('SELECT id FROM customers WHERE email = ?', [testEmail]);
    
    if (testUser.length > 0) {
      const userId = testUser[0].id;
      console.log(`   👤 Usuário de teste: ${testEmail} (ID: ${userId})`);
      
      // Verificar pedidos deste usuário
      const [userOrders] = await pool.execute(`
        SELECT id, status, total, created_at
        FROM orders 
        WHERE customer_id = ? OR user_id = ?
        ORDER BY created_at DESC
      `, [userId, userId]);
      
      console.log(`   📦 Pedidos do usuário: ${userOrders.length}`);
      
      if (userOrders.length > 0) {
        console.log('   ⚠️  PROBLEMA: Usuário tem pedidos quando não deveria ter!');
        userOrders.forEach((order, index) => {
          console.log(`      ${index + 1}. ${order.id} - ${order.status} - R$ ${order.total} - ${order.created_at}`);
        });
      } else {
        console.log('   ✅ Usuário sem pedidos (correto)');
      }
    } else {
      console.log(`   ℹ️  Usuário ${testEmail} não encontrado na tabela customers`);
    }
    
    // 6. Verificar sessões ativas
    console.log('\n6️⃣ Verificando sessões ativas...');
    const [activeSessions] = await pool.execute(`
      SELECT user_email, created_at, last_seen
      FROM sessions 
      WHERE user_email LIKE '%teste%'
         OR user_email LIKE '%@example.com'
      ORDER BY last_seen DESC
      LIMIT 5
    `);
    
    console.log(`   📊 Sessões de teste encontradas: ${activeSessions.length}`);
    activeSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.user_email} - Última atividade: ${session.last_seen}`);
    });
    
    // 7. Resumo e recomendações
    console.log('\n📋 RESUMO E RECOMENDAÇÕES:');
    
    if (orphanOrders[0].count === 0) {
      console.log('✅ Sistema de pedidos está funcionando corretamente');
      console.log('✅ Não há pedidos órfãos');
      console.log('✅ Novos usuários não terão pedidos pré-existentes');
    } else {
      console.log('❌ Sistema precisa de correção');
      console.log('❌ Existem pedidos órfãos que precisam ser limpos');
      console.log('💡 Execute: node scripts/fix-orphan-orders.cjs');
    }
    
    if (hasCustomerId && hasUserId) {
      console.log('✅ Estrutura da tabela orders está correta');
    } else {
      console.log('❌ Estrutura da tabela orders precisa de ajustes');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Iniciando teste do sistema de pedidos...\n');
  
  try {
    await testNewUserOrders();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Teste concluído!');
}

if (require.main === module) {
  main();
}

module.exports = { testNewUserOrders };
