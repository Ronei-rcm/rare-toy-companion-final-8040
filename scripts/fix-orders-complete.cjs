#!/usr/bin/env node

/**
 * Script completo para corrigir todos os problemas de pedidos
 * 1. Corrigir totais zerados
 * 2. Corrigir status dos pedidos
 * 3. Sincronizar dados entre tabelas
 * 4. Garantir que pedidos apareçam no admin e perfil do usuário
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'RareToy2025!',
  database: process.env.DB_NAME || 'rare_toy_companion',
  charset: 'utf8mb4'
};

async function fixOrdersComplete() {
  let connection;
  
  try {
    console.log('🔧 Iniciando correção completa de pedidos...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar pedidos problemáticos
    console.log('🔍 Analisando pedidos problemáticos...');
    
    const [problematicOrders] = await connection.execute(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) as calculated_total
      FROM orders o 
      WHERE o.total = 0 OR o.status = 'pending' OR o.total != (
        SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id
      )
      ORDER BY o.created_at DESC
    `);
    
    console.log(`📊 Encontrados ${problematicOrders.length} pedidos com problemas:`);
    
    for (const order of problematicOrders) {
      console.log(`\n📦 Pedido ${order.id}:`);
      console.log(`   - Total atual: R$ ${order.total}`);
      console.log(`   - Total calculado: R$ ${order.calculated_total}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Itens: ${order.items_count}`);
    }

    // 2. Corrigir totais dos pedidos
    console.log('\n💰 Corrigindo totais dos pedidos...');
    
    let fixedTotals = 0;
    for (const order of problematicOrders) {
      if (order.calculated_total !== order.total) {
        await connection.execute(`
          UPDATE orders 
          SET total = ?, updated_at = NOW()
          WHERE id = ?
        `, [order.calculated_total, order.id]);
        
        console.log(`   ✅ Pedido ${order.id}: R$ ${order.total} → R$ ${order.calculated_total}`);
        fixedTotals++;
      }
    }

    // 3. Corrigir status dos pedidos
    console.log('\n📋 Corrigindo status dos pedidos...');
    
    const [statusUpdate] = await connection.execute(`
      UPDATE orders 
      SET status = 'criado', updated_at = NOW()
      WHERE status = 'pending'
    `);
    
    console.log(`✅ ${statusUpdate.affectedRows} pedidos tiveram status corrigido: pending → criado`);

    // 4. Verificar e corrigir itens órfãos
    console.log('\n🔍 Verificando itens órfãos...');
    
    const [orphanItems] = await connection.execute(`
      SELECT oi.* 
      FROM order_items oi 
      LEFT JOIN orders o ON oi.order_id = o.id 
      WHERE o.id IS NULL
    `);
    
    if (orphanItems.length > 0) {
      console.log(`⚠️  Encontrados ${orphanItems.length} itens órfãos`);
      await connection.execute('DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)');
      console.log(`✅ ${orphanItems.length} itens órfãos removidos`);
    } else {
      console.log('✅ Nenhum item órfão encontrado');
    }

    // 5. Sincronizar clientes com pedidos
    console.log('\n👥 Sincronizando clientes com pedidos...');
    
    // Buscar pedidos sem customer_id mas com email
    const [ordersToSync] = await connection.execute(`
      SELECT o.*, c.id as existing_customer_id
      FROM orders o
      LEFT JOIN customers c ON (
        (o.email IS NOT NULL AND c.email = o.email) OR
        (o.user_id IS NOT NULL AND c.id = o.user_id)
      )
      WHERE o.customer_id IS NULL AND c.id IS NOT NULL
    `);
    
    let syncedCustomers = 0;
    for (const order of ordersToSync) {
      await connection.execute(`
        UPDATE orders 
        SET customer_id = ?, updated_at = NOW()
        WHERE id = ?
      `, [order.existing_customer_id, order.id]);
      
      console.log(`   ✅ Pedido ${order.id} sincronizado com cliente ${order.existing_customer_id}`);
      syncedCustomers++;
    }

    // 6. Criar clientes para pedidos órfãos
    console.log('\n👤 Criando clientes para pedidos órfãos...');
    
    const [orphanOrders] = await connection.execute(`
      SELECT DISTINCT o.email, o.nome, o.telefone
      FROM orders o
      WHERE o.customer_id IS NULL 
        AND o.email IS NOT NULL 
        AND o.email != ''
        AND o.email NOT IN (SELECT email FROM customers WHERE email IS NOT NULL)
    `);
    
    let createdCustomers = 0;
    for (const order of orphanOrders) {
      const customerId = crypto.randomUUID();
      
      await connection.execute(`
        INSERT INTO customers (
          id, nome, email, telefone, 
          total_pedidos, total_gasto, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        customerId,
        order.nome || 'Cliente',
        order.email,
        order.telefone || null,
        1,
        0.00
      ]);
      
      // Atualizar pedidos com o novo customer_id
      await connection.execute(`
        UPDATE orders 
        SET customer_id = ?, updated_at = NOW()
        WHERE email = ? AND customer_id IS NULL
      `, [customerId, order.email]);
      
      console.log(`   ✅ Cliente criado: ${customerId} (${order.email})`);
      createdCustomers++;
    }

    // 7. Atualizar estatísticas de clientes
    console.log('\n📊 Atualizando estatísticas de clientes...');
    
    const [customersToUpdate] = await connection.execute(`
      SELECT 
        c.id,
        COUNT(o.id) as total_pedidos,
        COALESCE(SUM(o.total), 0) as total_gasto,
        MAX(o.created_at) as ultimo_pedido
      FROM customers c
      LEFT JOIN orders o ON (c.id = o.customer_id OR c.id = o.user_id)
      GROUP BY c.id
    `);
    
    let updatedCustomers = 0;
    for (const customer of customersToUpdate) {
      await connection.execute(`
        UPDATE customers 
        SET 
          total_pedidos = ?,
          total_gasto = ?,
          ultimo_pedido = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        customer.total_pedidos,
        customer.total_gasto,
        customer.ultimo_pedido,
        customer.id
      ]);
      
      updatedCustomers++;
    }

    // 8. Verificar resultado final
    console.log('\n📊 Resultado final da correção:');
    
    const [finalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN total > 0 THEN 1 ELSE 0 END) as orders_with_total,
        SUM(CASE WHEN status = 'criado' THEN 1 ELSE 0 END) as orders_created,
        SUM(CASE WHEN (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) > 0 THEN 1 ELSE 0 END) as orders_with_items,
        SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END) as orders_with_customer,
        COALESCE(SUM(total), 0) as total_revenue
      FROM orders o
    `);
    
    const [finalOrderItems] = await connection.execute('SELECT COUNT(*) as total_items FROM order_items');
    const [finalCustomers] = await connection.execute('SELECT COUNT(*) as total_customers FROM customers');
    
    const stats = finalStats[0];
    
    console.log(`   📦 Total de pedidos: ${stats.total_orders}`);
    console.log(`   💰 Pedidos com total > 0: ${stats.orders_with_total}`);
    console.log(`   ✅ Pedidos com status 'criado': ${stats.orders_created}`);
    console.log(`   🛍️  Pedidos com itens: ${stats.orders_with_items}`);
    console.log(`   👥 Pedidos com cliente: ${stats.orders_with_customer}`);
    console.log(`   💵 Receita total: R$ ${Number(stats.total_revenue || 0).toFixed(2)}`);
    console.log(`   🛍️  Total de itens: ${finalOrderItems[0].total_items}`);
    console.log(`   👥 Total de clientes: ${finalCustomers[0].total_customers}`);
    
    // 9. Mostrar pedidos mais recentes
    console.log('\n📋 Pedidos mais recentes (após correção):');
    
    const [recentOrders] = await connection.execute(`
      SELECT 
        o.id,
        o.status,
        o.total,
        o.nome,
        o.email,
        o.created_at,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o 
      ORDER BY o.created_at DESC 
      LIMIT 5
    `);
    
    recentOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.id.substring(0, 8)}... - R$ ${order.total} - ${order.status} - ${order.items_count} itens - ${order.created_at.toLocaleDateString('pt-BR')}`);
    });
    
    console.log('\n✅ Correção completa finalizada!');
    console.log(`   💰 Totais corrigidos: ${fixedTotals}`);
    console.log(`   👥 Clientes sincronizados: ${syncedCustomers}`);
    console.log(`   👤 Clientes criados: ${createdCustomers}`);
    console.log(`   📊 Estatísticas atualizadas: ${updatedCustomers}`);
    
    console.log('\n🎉 Agora os pedidos devem aparecer corretamente no admin e no perfil do usuário!');

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixOrdersComplete()
    .then(() => {
      console.log('\n🎉 Script de correção executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixOrdersComplete };
