#!/usr/bin/env node

/**
 * Script para testar criação completa de pedidos
 * Simula o fluxo completo: carrinho -> checkout -> pedido -> itens
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

async function testOrderCreation() {
  let connection;
  
  try {
    console.log('🧪 Iniciando teste de criação de pedidos...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar produtos disponíveis
    console.log('🔍 Verificando produtos disponíveis...');
    
    const [products] = await connection.execute(`
      SELECT id, nome, preco, estoque 
      FROM produtos 
      WHERE status = 'ativo' AND estoque > 0 
      LIMIT 3
    `);
    
    if (products.length === 0) {
      console.log('❌ Nenhum produto ativo encontrado!');
      return;
    }
    
    console.log(`✅ Encontrados ${products.length} produtos:`);
    products.forEach(p => {
      console.log(`   - ${p.nome}: R$ ${p.preco} (estoque: ${p.estoque})`);
    });

    // 2. Criar cliente de teste
    console.log('\n👤 Criando cliente de teste...');
    
    const customerId = crypto.randomUUID();
    const customerEmail = `teste.${Date.now()}@muhlstore.com`;
    
    await connection.execute(`
      INSERT INTO customers (
        id, nome, email, telefone, 
        total_pedidos, total_gasto, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      customerId,
      'Cliente Teste',
      customerEmail,
      '11999999999',
      0,
      0.00
    ]);
    
    console.log(`✅ Cliente criado: ${customerId} (${customerEmail})`);

    // 3. Criar carrinho de teste
    console.log('\n🛒 Criando carrinho de teste...');
    
    const cartId = crypto.randomUUID();
    
    await connection.execute(`
      INSERT INTO carts (id, user_id, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW())
    `, [cartId, customerId]);
    
    console.log(`✅ Carrinho criado: ${cartId}`);

    // 4. Adicionar produtos ao carrinho
    console.log('\n📦 Adicionando produtos ao carrinho...');
    
    let totalCart = 0;
    for (let i = 0; i < Math.min(2, products.length); i++) {
      const product = products[i];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1 ou 2
      
      await connection.execute(`
        INSERT INTO cart_items (
          cart_id, product_id, name, price, 
          image_url, quantity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        cartId,
        product.id,
        product.nome,
        product.preco,
        '/placeholder.jpg',
        quantity
      ]);
      
      totalCart += product.preco * quantity;
      console.log(`   ✅ ${product.nome} x${quantity} = R$ ${(product.preco * quantity).toFixed(2)}`);
    }
    
    console.log(`📊 Total do carrinho: R$ ${totalCart.toFixed(2)}`);

    // 5. Criar pedido (simulando checkout)
    console.log('\n💳 Criando pedido...');
    
    const orderId = crypto.randomUUID();
    
    await connection.execute(`
      INSERT INTO orders (
        id, user_id, cart_id, customer_id,
        status, total, nome, email, telefone,
        endereco, metodo_pagamento, payment_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      orderId,
      customerId,
      cartId,
      customerId,
      'criado',
      totalCart,
      'Cliente Teste',
      customerEmail,
      '11999999999',
      'Rua Teste, 123 - São Paulo/SP, CEP: 01234-567',
      'PIX',
      'pending'
    ]);
    
    console.log(`✅ Pedido criado: ${orderId}`);

    // 6. Transferir itens do carrinho para o pedido
    console.log('\n🔄 Transferindo itens do carrinho para o pedido...');
    
    const [cartItems] = await connection.execute(`
      SELECT * FROM cart_items WHERE cart_id = ?
    `, [cartId]);
    
    for (const item of cartItems) {
      await connection.execute(`
        INSERT INTO order_items (
          order_id, product_id, name, price,
          image_url, quantity, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        orderId,
        item.product_id,
        item.name,
        item.price,
        item.image_url,
        item.quantity
      ]);
      
      console.log(`   ✅ ${item.name} x${item.quantity} transferido`);
    }
    
    // 7. Limpar carrinho
    console.log('\n🧹 Limpando carrinho...');
    
    await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    await connection.execute('DELETE FROM carts WHERE id = ?', [cartId]);
    
    console.log('✅ Carrinho limpo');

    // 8. Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    
    const [orderCheck] = await connection.execute(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
      FROM orders o 
      WHERE o.id = ?
    `, [orderId]);
    
    const [itemsCheck] = await connection.execute(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [orderId]);
    
    const [customerCheck] = await connection.execute(`
      SELECT * FROM customers WHERE id = ?
    `, [customerId]);
    
    if (orderCheck.length > 0 && itemsCheck.length > 0) {
      console.log('🎉 SUCESSO! Pedido criado corretamente:');
      console.log(`   📦 Pedido: ${orderCheck[0].id}`);
      console.log(`   💰 Total: R$ ${orderCheck[0].total}`);
      console.log(`   🛍️  Itens: ${orderCheck[0].items_count}`);
      console.log(`   👤 Cliente: ${customerCheck[0].nome} (${customerCheck[0].email})`);
      console.log(`   📍 Status: ${orderCheck[0].status}`);
      
      console.log('\n📋 Detalhes dos itens:');
      itemsCheck.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} x${item.quantity} = R$ ${(item.price * item.quantity).toFixed(2)}`);
      });
      
      console.log('\n✅ Teste concluído com sucesso!');
      console.log('🔗 O pedido deve aparecer agora no admin e no perfil do usuário');
      
    } else {
      console.log('❌ FALHA! Pedido não foi criado corretamente');
    }

    // 9. Limpar dados de teste (opcional)
    console.log('\n🧹 Limpando dados de teste...');
    
    // Descomente as linhas abaixo para limpar os dados de teste
    // await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    // await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    // await connection.execute('DELETE FROM customers WHERE id = ?', [customerId]);
    
    console.log('ℹ️  Dados de teste mantidos para verificação manual');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
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
  testOrderCreation()
    .then(() => {
      console.log('\n🎉 Script de teste executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testOrderCreation };
