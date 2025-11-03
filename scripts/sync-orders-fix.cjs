#!/usr/bin/env node

/**
 * Script para corrigir e sincronizar dados de pedidos
 * Resolve problemas de pedidos sem itens e sincronização de clientes
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'RareToy2025!',
  database: process.env.DB_NAME || 'rare_toy_companion',
  charset: 'utf8mb4'
};

async function syncOrdersFix() {
  let connection;
  
  try {
    console.log('🔧 Iniciando correção e sincronização de pedidos...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar estrutura das tabelas
    console.log('📋 Verificando estrutura das tabelas...');
    
    const [ordersStructure] = await connection.execute('DESCRIBE orders');
    const [orderItemsStructure] = await connection.execute('DESCRIBE order_items');
    const [customersStructure] = await connection.execute('DESCRIBE customers');
    
    console.log('✅ Tabelas encontradas: orders, order_items, customers\n');

    // 2. Verificar pedidos existentes
    console.log('🔍 Analisando pedidos existentes...');
    
    const [orders] = await connection.execute(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o 
      ORDER BY o.created_at DESC
    `);
    
    console.log(`📊 Total de pedidos encontrados: ${orders.length}`);
    
    for (const order of orders) {
      console.log(`\n📦 Pedido ${order.id}:`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Total: R$ ${order.total}`);
      console.log(`   - Itens: ${order.items_count}`);
      console.log(`   - User ID: ${order.user_id || 'NULL'}`);
      console.log(`   - Customer ID: ${order.customer_id || 'NULL'}`);
      console.log(`   - Data: ${order.created_at}`);
      
      if (order.items_count === 0) {
        console.log(`   ⚠️  PROBLEMA: Pedido sem itens!`);
      }
    }

    // 3. Verificar itens órfãos
    console.log('\n🔍 Verificando itens órfãos...');
    
    const [orphanItems] = await connection.execute(`
      SELECT oi.* 
      FROM order_items oi 
      LEFT JOIN orders o ON oi.order_id = o.id 
      WHERE o.id IS NULL
    `);
    
    if (orphanItems.length > 0) {
      console.log(`⚠️  Encontrados ${orphanItems.length} itens órfãos (sem pedido pai)`);
    } else {
      console.log('✅ Nenhum item órfão encontrado');
    }

    // 4. Verificar clientes sem pedidos
    console.log('\n🔍 Verificando sincronização de clientes...');
    
    const [customersWithoutOrders] = await connection.execute(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id OR o.user_id = c.id) as orders_count
      FROM customers c
      WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id OR o.user_id = c.id) = 0
    `);
    
    console.log(`📊 Clientes sem pedidos: ${customersWithoutOrders.length}`);

    // 5. Corrigir pedidos sem itens (se existirem dados de carrinho)
    console.log('\n🔧 Corrigindo pedidos sem itens...');
    
    let fixedOrders = 0;
    for (const order of orders) {
      if (order.items_count === 0) {
        console.log(`\n🔧 Tentando corrigir pedido ${order.id}...`);
        
        // Verificar se ainda existe carrinho com itens
        const [cartItems] = await connection.execute(`
          SELECT ci.* 
          FROM cart_items ci 
          WHERE ci.cart_id = ?
        `, [order.cart_id]);
        
        if (cartItems.length > 0) {
          console.log(`   📦 Encontrados ${cartItems.length} itens no carrinho original`);
          
          // Inserir itens do carrinho como itens do pedido
          for (const item of cartItems) {
            await connection.execute(`
              INSERT INTO order_items (order_id, product_id, name, price, image_url, quantity)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              order.id,
              item.product_id,
              item.name,
              item.price,
              item.image_url,
              item.quantity
            ]);
          }
          
          // Limpar carrinho
          await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [order.cart_id]);
          
          console.log(`   ✅ Pedido ${order.id} corrigido com ${cartItems.length} itens`);
          fixedOrders++;
        } else {
          console.log(`   ⚠️  Carrinho ${order.cart_id} não encontrado ou vazio`);
        }
      }
    }

    // 6. Sincronizar clientes com pedidos
    console.log('\n🔄 Sincronizando clientes com pedidos...');
    
    const [ordersToSync] = await connection.execute(`
      SELECT o.*, c.id as customer_id
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
        SET customer_id = ? 
        WHERE id = ?
      `, [order.customer_id, order.id]);
      
      console.log(`   ✅ Pedido ${order.id} sincronizado com cliente ${order.customer_id}`);
      syncedCustomers++;
    }

    // 7. Atualizar estatísticas de clientes
    console.log('\n📊 Atualizando estatísticas de clientes...');
    
    const [customersToUpdate] = await connection.execute(`
      SELECT c.id,
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
          ultimo_pedido = ?
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
    console.log('\n📊 Resultado final:');
    
    const [finalOrders] = await connection.execute(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) > 0 THEN 1 ELSE 0 END) as orders_with_items,
        SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END) as orders_with_customer
      FROM orders o
    `);
    
    const [finalOrderItems] = await connection.execute('SELECT COUNT(*) as total_items FROM order_items');
    const [finalCustomers] = await connection.execute('SELECT COUNT(*) as total_customers FROM customers');
    
    console.log(`   📦 Total de pedidos: ${finalOrders[0].total_orders}`);
    console.log(`   📦 Pedidos com itens: ${finalOrders[0].orders_with_items}`);
    console.log(`   👥 Pedidos com cliente: ${finalOrders[0].orders_with_customer}`);
    console.log(`   🛍️  Total de itens: ${finalOrderItems[0].total_items}`);
    console.log(`   👥 Total de clientes: ${finalCustomers[0].total_customers}`);
    
    console.log('\n✅ Sincronização concluída!');
    console.log(`   🔧 Pedidos corrigidos: ${fixedOrders}`);
    console.log(`   🔄 Clientes sincronizados: ${syncedCustomers}`);
    console.log(`   📊 Estatísticas atualizadas: ${updatedCustomers}`);

  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
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
  syncOrdersFix()
    .then(() => {
      console.log('\n🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { syncOrdersFix };
