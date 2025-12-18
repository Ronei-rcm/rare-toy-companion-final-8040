#!/usr/bin/env node
/**
 * Script para testar criação de usuário e pedido
 * Uso: node scripts/test-create-user-order.cjs
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function testCreateUserAndOrder() {
  let conn = null;
  
  try {
    console.log('🔧 Conectando ao banco de dados...');
    
    conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Criar usuário de teste
    const testEmail = `teste_${Date.now()}@exemplo.com`;
    const testPassword = 'senha123';
    const testName = 'Usuário Teste';
    const userId = crypto.randomUUID();
    
    console.log('📝 Criando usuário de teste...');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Nome: ${testName}`);
    console.log(`   ID: ${userId}`);
    
    // Hash da senha
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Inserir em users
    await conn.execute(
      'INSERT INTO users (id, email, password_hash, nome) VALUES (?, ?, ?, ?)',
      [userId, testEmail, passwordHash, testName]
    );
    
    console.log('✅ Usuário criado em users\n');
    
    // Inserir em customers
    await conn.execute(
      'INSERT INTO customers (id, nome, email, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [userId, testName, testEmail]
    );
    
    console.log('✅ Cliente criado em customers\n');
    
    // 2. Criar pedido de teste
    const orderId = crypto.randomUUID();
    const orderTotal = 99.90;
    
    console.log('📦 Criando pedido de teste...');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Total: R$ ${orderTotal.toFixed(2)}`);
    
    await conn.execute(
      `INSERT INTO orders (
        id, user_id, total, status, payment_method, 
        shipping_address, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        orderId,
        userId,
        orderTotal,
        'pending',
        'pix',
        JSON.stringify({
          rua: 'Rua Teste, 123',
          cidade: 'Porto Alegre',
          cep: '90000-000'
        })
      ]
    );
    
    console.log('✅ Pedido criado\n');
    
    // 3. Criar item do pedido
    const itemId = crypto.randomUUID();
    
    console.log('🛍️ Criando item do pedido...');
    
    // order_items não tem coluna 'name', apenas: id, order_id, product_id, quantity, price, created_at
    await conn.execute(
      `INSERT INTO order_items (
        id, order_id, product_id, price, quantity, created_at
      ) VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        itemId,
        orderId,
        'produto-teste-123',
        99.90,
        1
      ]
    );
    
    console.log('✅ Item do pedido criado\n');
    
    // 4. Verificar se o pedido pode ser buscado
    console.log('🔍 Testando busca de pedidos...');
    
    const [orders] = await conn.execute(
      `SELECT 
        o.id,
        o.user_id,
        o.status,
        o.total,
        o.created_at,
        c.nome as customer_nome,
        c.email as customer_email,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o
      LEFT JOIN customers c ON o.user_id = c.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10`,
      [userId]
    );
    
    console.log(`✅ Encontrados ${orders.length} pedido(s):\n`);
    
    orders.forEach((order, index) => {
      console.log(`   Pedido ${index + 1}:`);
      console.log(`     ID: ${order.id}`);
      console.log(`     Status: ${order.status}`);
      console.log(`     Total: R$ ${parseFloat(order.total).toFixed(2)}`);
      console.log(`     Cliente: ${order.customer_nome || 'N/A'} (${order.customer_email || 'N/A'})`);
      console.log(`     Itens: ${order.items_count}`);
      console.log(`     Data: ${order.created_at}`);
      console.log('');
    });
    
    // 5. Testar estatísticas
    console.log('📊 Testando estatísticas do usuário...');
    
    const [stats] = await conn.execute(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE user_id = ?`,
      [userId]
    );
    
    const stat = stats[0];
    console.log(`✅ Estatísticas:`);
    console.log(`   Total de pedidos: ${stat.total_orders}`);
    console.log(`   Total gasto: R$ ${parseFloat(stat.total_spent).toFixed(2)}`);
    console.log(`   Último pedido: ${stat.last_order_date || 'N/A'}\n`);
    
    // 6. Resumo
    console.log('═══════════════════════════════════════');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════');
    console.log(`\n📋 Dados do teste:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Order ID: ${orderId}`);
    console.log(`\n💡 Você pode usar esses dados para testar o login e visualizar o pedido na aplicação.`);
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error('   Código:', error.code);
    console.error('   Mensagem:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  } finally {
    if (conn) {
      await conn.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar teste
testCreateUserAndOrder()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

