#!/usr/bin/env node

/**
 * Script para testar o sistema de endereços
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

async function testAddressSystem() {
  console.log('🧪 Testando sistema de endereços...\n');
  
  try {
    // 1. Verificar estrutura da tabela customer_addresses
    console.log('1️⃣ Verificando estrutura da tabela customer_addresses...');
    const [structure] = await pool.execute('DESCRIBE customer_addresses');
    console.log('   📋 Colunas da tabela:');
    structure.forEach(col => {
      console.log(`      - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(obrigatório)' : '(opcional)'}`);
    });
    
    // 2. Verificar se existem endereços
    console.log('\n2️⃣ Verificando endereços existentes...');
    const [addresses] = await pool.execute('SELECT COUNT(*) as count FROM customer_addresses');
    console.log(`   📊 Total de endereços: ${addresses[0].count}`);
    
    if (addresses[0].count > 0) {
      const [sampleAddresses] = await pool.execute(`
        SELECT id, customer_id, nome, rua, cidade, estado, padrao, created_at
        FROM customer_addresses 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('   📋 Últimos endereços:');
      sampleAddresses.forEach((addr, index) => {
        console.log(`      ${index + 1}. ${addr.nome} - ${addr.rua}, ${addr.cidade}/${addr.estado} (${addr.padrao ? 'Padrão' : 'Normal'})`);
      });
    }
    
    // 3. Verificar clientes
    console.log('\n3️⃣ Verificando clientes...');
    const [customers] = await pool.execute('SELECT COUNT(*) as count FROM customers');
    console.log(`   📊 Total de clientes: ${customers[0].count}`);
    
    if (customers[0].count > 0) {
      const [sampleCustomers] = await pool.execute(`
        SELECT id, nome, email, created_at
        FROM customers 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('   📋 Últimos clientes:');
      sampleCustomers.forEach((customer, index) => {
        console.log(`      ${index + 1}. ${customer.nome} (${customer.email})`);
      });
    }
    
    // 4. Verificar sessões
    console.log('\n4️⃣ Verificando sessões ativas...');
    const [sessions] = await pool.execute('SELECT COUNT(*) as count FROM sessions');
    console.log(`   📊 Total de sessões: ${sessions[0].count}`);
    
    if (sessions[0].count > 0) {
      const [sampleSessions] = await pool.execute(`
        SELECT user_email, created_at, last_seen
        FROM sessions 
        ORDER BY last_seen DESC 
        LIMIT 3
      `);
      
      console.log('   📋 Últimas sessões:');
      sampleSessions.forEach((session, index) => {
        console.log(`      ${index + 1}. ${session.user_email} - Última atividade: ${session.last_seen}`);
      });
    }
    
    // 5. Testar query de endereços por cliente
    console.log('\n5️⃣ Testando query de endereços por cliente...');
    
    if (customers[0].count > 0) {
      const [testCustomer] = await pool.execute(`
        SELECT id, nome, email
        FROM customers 
        LIMIT 1
      `);
      
      const customer = testCustomer[0];
      console.log(`   👤 Cliente de teste: ${customer.nome} (${customer.email})`);
      
      const [customerAddresses] = await pool.execute(`
        SELECT id, nome, rua, cidade, estado, padrao
        FROM customer_addresses 
        WHERE customer_id = ?
      `, [customer.id]);
      
      console.log(`   📦 Endereços do cliente: ${customerAddresses.length}`);
      customerAddresses.forEach((addr, index) => {
        console.log(`      ${index + 1}. ${addr.nome} - ${addr.rua}, ${addr.cidade}/${addr.estado} (${addr.padrao ? 'Padrão' : 'Normal'})`);
      });
    }
    
    // 6. Verificar integridade dos dados
    console.log('\n6️⃣ Verificando integridade dos dados...');
    
    // Verificar endereços órfãos (sem cliente)
    const [orphanAddresses] = await pool.execute(`
      SELECT COUNT(*) as count
      FROM customer_addresses ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      WHERE c.id IS NULL
    `);
    
    console.log(`   📊 Endereços órfãos (sem cliente): ${orphanAddresses[0].count}`);
    
    if (orphanAddresses[0].count > 0) {
      console.log('   ⚠️  ATENÇÃO: Existem endereços órfãos!');
    } else {
      console.log('   ✅ Nenhum endereço órfão encontrado');
    }
    
    // 7. Resumo e recomendações
    console.log('\n📋 RESUMO E RECOMENDAÇÕES:');
    
    if (structure.length > 0) {
      console.log('✅ Estrutura da tabela customer_addresses está correta');
    } else {
      console.log('❌ Tabela customer_addresses não existe ou está vazia');
    }
    
    if (orphanAddresses[0].count === 0) {
      console.log('✅ Dados íntegros - sem endereços órfãos');
    } else {
      console.log('❌ Dados inconsistentes - endereços órfãos encontrados');
    }
    
    if (customers[0].count > 0 && addresses[0].count > 0) {
      console.log('✅ Sistema de endereços funcionando');
      console.log('✅ Clientes e endereços existem');
    } else if (customers[0].count === 0) {
      console.log('⚠️  Nenhum cliente cadastrado');
    } else if (addresses[0].count === 0) {
      console.log('⚠️  Nenhum endereço cadastrado');
    }
    
    console.log('\n💡 Para testar criação de endereços:');
    console.log('   1. Faça login no sistema');
    console.log('   2. Acesse "Minha Conta" > "Endereços"');
    console.log('   3. Clique em "Adicionar Endereço"');
    console.log('   4. Preencha os dados e salve');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Iniciando teste do sistema de endereços...\n');
  
  try {
    await testAddressSystem();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
  
  console.log('\n🎉 Teste concluído!');
}

if (require.main === module) {
  main();
}

module.exports = { testAddressSystem };
