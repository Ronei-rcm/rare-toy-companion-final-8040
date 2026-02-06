#!/usr/bin/env node

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: 'rare_toy_companion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testUserAccount() {
  console.log('\n🔍 =======================================');
  console.log('   TESTE COMPLETO DE MINHA CONTA');
  console.log('=======================================\n');

  try {
    // 1. Verificar se usuário teste existe
    console.log('📊 1. Verificando usuário teste...');
    const [users] = await pool.execute(`
      SELECT * FROM users WHERE email = 'teste@exemplo.com'
    `);
    
    if (users.length === 0) {
      console.log('❌ Usuário teste não encontrado');
      console.log('💡 Execute: curl -X POST "http://localhost:3001/api/auth/register" -H "Content-Type: application/json" -d \'{"nome":"Teste Usuário","email":"teste@exemplo.com","senha":"senha123","telefone":"51999999999"}\'');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.nome} (${user.email})`);
    console.log(`   ID: ${user.id}`);

    // 2. Verificar pedidos do usuário
    console.log('\n📦 2. Verificando pedidos...');
    const [orders] = await pool.execute(`
      SELECT * FROM orders WHERE user_id = ?
    `, [user.id]);
    console.log(`   Total de pedidos: ${orders.length}`);
    
    // 3. Verificar endereços
    console.log('\n📍 3. Verificando endereços...');
    const [addresses] = await pool.execute(`
      SELECT * FROM customer_addresses WHERE customer_id = ?
    `, [user.id]);
    console.log(`   Total de endereços: ${addresses.length}`);
    
    // 4. Verificar favoritos
    console.log('\n❤️  4. Verificando favoritos...');
    const [favorites] = await pool.execute(`
      SELECT * FROM favorites WHERE user_email = ?
    `, [user.email]);
    console.log(`   Total de favoritos: ${favorites.length}`);
    
    // 5. Verificar cupons
    console.log('\n🎟️  5. Verificando cupons...');
    const [coupons] = await pool.execute(`
      SELECT * FROM customer_coupons WHERE customer_id = ? AND status = 'active'
    `, [user.id]);
    console.log(`   Total de cupons ativos: ${coupons.length}`);
    
    // 6. Calcular estatísticas
    console.log('\n📊 6. Calculando estatísticas...');
    const [pendingOrders] = await pool.execute(`
      SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status IN ('pending', 'processing')
    `, [user.id]);
    
    const [totalSpent] = await pool.execute(`
      SELECT SUM(total) as total FROM orders WHERE user_id = ? AND status != 'cancelled'
    `, [user.id]);
    
    const stats = {
      totalPedidos: orders.length,
      pedidosPendentes: pendingOrders[0].total,
      totalGasto: parseFloat(totalSpent[0].total || 0),
      favoritos: favorites.length,
      enderecos: addresses.length,
      cupons: coupons.length
    };
    
    console.log('\n✨ ESTATÍSTICAS DO USUÁRIO:');
    console.log(`   📦 Total de pedidos: ${stats.totalPedidos}`);
    console.log(`   ⏳ Pedidos pendentes: ${stats.pedidosPendentes}`);
    console.log(`   💰 Total gasto: R$ ${stats.totalGasto.toFixed(2)}`);
    console.log(`   ❤️  Favoritos: ${stats.favoritos}`);
    console.log(`   📍 Endereços: ${stats.enderecos}`);
    console.log(`   🎟️  Cupons ativos: ${stats.cupons}`);
    
    // 7. Verificar sessões
    console.log('\n🔐 7. Verificando sessões...');
    const [sessions] = await pool.execute(`
      SELECT * FROM sessions WHERE user_id = ?
    `, [user.id]);
    console.log(`   Total de sessões: ${sessions.length}`);
    
    // 8. Teste de dados ausentes
    console.log('\n⚠️  8. Verificando dados ausentes...');
    const issues = [];
    
    if (orders.length === 0) {
      issues.push('Nenhum pedido encontrado');
    }
    
    if (addresses.length === 0) {
      issues.push('Nenhum endereço cadastrado');
    }
    
    if (sessions.length === 0) {
      issues.push('Nenhuma sessão ativa');
    }
    
    if (issues.length > 0) {
      console.log('   ⚠️  Problemas encontrados:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✅ Todos os dados estão OK');
    }
    
    console.log('\n✅ =======================================');
    console.log('   TESTE CONCLUÍDO COM SUCESSO!');
    console.log('=======================================\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar teste:', error);
  } finally {
    await pool.end();
  }
}

testUserAccount();

