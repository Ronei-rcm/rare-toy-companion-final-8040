#!/usr/bin/env node

/**
 * Script para testar o endpoint de endereços
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

async function testAddressesEndpoint() {
  let connection;
  
  try {
    console.log('🔧 Testando endpoint de endereços...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar se as tabelas existem
    console.log('📋 Verificando tabelas...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('📊 Tabelas encontradas:', tableNames);
    
    const hasAddresses = tableNames.includes('addresses');
    const hasCustomerAddresses = tableNames.includes('customer_addresses');
    
    console.log(`   - addresses: ${hasAddresses ? '✅' : '❌'}`);
    console.log(`   - customer_addresses: ${hasCustomerAddresses ? '✅' : '❌'}`);

    // 2. Testar consulta na tabela customer_addresses
    if (hasCustomerAddresses) {
      console.log('\n🔍 Testando consulta na tabela customer_addresses...');
      
      try {
        const [addresses] = await connection.execute(`
          SELECT 
            id,
            nome,
            cep,
            rua as endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            padrao as principal,
            created_at,
            updated_at
          FROM customer_addresses 
          ORDER BY padrao DESC, created_at DESC
          LIMIT 5
        `);
        
        console.log(`✅ Consulta executada com sucesso! Encontrados ${addresses.length} endereços:`);
        
        addresses.forEach((addr, index) => {
          console.log(`\n   ${index + 1}. Endereço ${addr.id}:`);
          console.log(`      - Nome: ${addr.nome}`);
          console.log(`      - Endereço: ${addr.endereco}, ${addr.numero}`);
          console.log(`      - Cidade: ${addr.cidade} - ${addr.estado}`);
          console.log(`      - CEP: ${addr.cep}`);
          console.log(`      - Padrão: ${addr.principal ? 'Sim' : 'Não'}`);
        });
        
      } catch (e) {
        console.error('❌ Erro na consulta:', e.message);
        console.error('   SQL State:', e.sqlState);
        console.error('   SQL Message:', e.sqlMessage);
      }
    }

    // 3. Testar consulta na tabela addresses
    if (hasAddresses) {
      console.log('\n🔍 Testando consulta na tabela addresses...');
      
      try {
        const [addresses] = await connection.execute(`
          SELECT 
            id,
            nome,
            cep,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            shipping_default as principal,
            created_at,
            updated_at
          FROM addresses 
          ORDER BY shipping_default DESC, created_at DESC
          LIMIT 5
        `);
        
        console.log(`✅ Consulta executada com sucesso! Encontrados ${addresses.length} endereços:`);
        
        addresses.forEach((addr, index) => {
          console.log(`\n   ${index + 1}. Endereço ${addr.id}:`);
          console.log(`      - Nome: ${addr.nome}`);
          console.log(`      - Endereço: ${addr.endereco}, ${addr.numero}`);
          console.log(`      - Cidade: ${addr.cidade} - ${addr.estado}`);
          console.log(`      - CEP: ${addr.cep}`);
          console.log(`      - Padrão: ${addr.principal ? 'Sim' : 'Não'}`);
        });
        
      } catch (e) {
        console.error('❌ Erro na consulta:', e.message);
        console.error('   SQL State:', e.sqlState);
        console.error('   SQL Message:', e.sqlMessage);
      }
    }

    // 4. Testar com usuário específico
    console.log('\n👤 Testando consulta com usuário específico...');
    
    const [users] = await connection.execute('SELECT id, email FROM users LIMIT 1');
    if (users.length > 0) {
      const userId = users[0].id;
      console.log(`🔍 Testando com usuário: ${users[0].email} (${userId})`);
      
      try {
        const [userAddresses] = await connection.execute(`
          SELECT 
            id,
            nome,
            cep,
            rua as endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            padrao as principal,
            created_at,
            updated_at
          FROM customer_addresses 
          WHERE customer_id = ?
          ORDER BY padrao DESC, created_at DESC
        `, [userId]);
        
        console.log(`✅ Consulta com usuário específico executada! Encontrados ${userAddresses.length} endereços para este usuário.`);
        
      } catch (e) {
        console.error('❌ Erro na consulta com usuário:', e.message);
      }
    }

    console.log('\n✅ Teste do endpoint de endereços concluído!');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAddressesEndpoint()
    .then(() => {
      console.log('\n🎉 Script de teste executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { testAddressesEndpoint };
