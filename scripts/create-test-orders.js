/**
 * Script para criar pedidos de teste no sistema
 * Execute: node scripts/create-test-orders.js
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function createTestOrders() {
  try {
    console.log('🚀 Criando pedidos de teste...');
    
    const response = await fetch(`${API_BASE_URL}/admin/orders/test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso:', data.message);
      console.log('📊 Total de pedidos:', data.count);
      
      if (data.orders) {
        console.log('\n📋 Pedidos criados:');
        data.orders.forEach(order => {
          console.log(`  - ${order.id}: ${order.nome} - R$ ${order.total} (${order.status})`);
        });
      }
    } else {
      const error = await response.text();
      console.error('❌ Erro:', error);
    }
  } catch (error) {
    console.error('❌ Erro ao criar pedidos de teste:', error.message);
  }
}

async function checkOrders() {
  try {
    console.log('\n🔍 Verificando pedidos existentes...');
    
    const response = await fetch(`${API_BASE_URL}/admin/orders`);
    
    if (response.ok) {
      const orders = await response.json();
      console.log(`📊 Total de pedidos encontrados: ${orders.length}`);
      
      if (orders.length > 0) {
        console.log('\n📋 Pedidos:');
        orders.forEach(order => {
          console.log(`  - ${order.id}: ${order.customer_name} - R$ ${order.total} (${order.status})`);
        });
      }
    } else {
      console.error('❌ Erro ao verificar pedidos');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar pedidos:', error.message);
  }
}

async function checkStats() {
  try {
    console.log('\n📊 Verificando estatísticas...');
    
    const response = await fetch(`${API_BASE_URL}/admin/orders/stats`);
    
    if (response.ok) {
      const stats = await response.json();
      console.log('📈 Estatísticas:');
      console.log(`  - Total de pedidos: ${stats.total}`);
      console.log(`  - Receita total: R$ ${stats.totalRevenue}`);
      console.log(`  - Ticket médio: R$ ${stats.averageTicket}`);
      console.log(`  - Pedidos pendentes: ${stats.pending}`);
      console.log(`  - Pedidos entregues: ${stats.delivered}`);
      console.log(`  - Total de clientes: ${stats.totalCustomers}`);
    } else {
      console.error('❌ Erro ao verificar estatísticas');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error.message);
  }
}

async function main() {
  console.log('🎯 Script de Teste de Pedidos - Muhlstore');
  console.log('==========================================\n');
  
  await checkOrders();
  await createTestOrders();
  await checkOrders();
  await checkStats();
  
  console.log('\n✅ Script concluído!');
  console.log('🌐 Acesse: http://localhost:8040/admin/pedidos');
}

main().catch(console.error);
