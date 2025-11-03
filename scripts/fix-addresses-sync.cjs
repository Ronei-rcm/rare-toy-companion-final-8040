#!/usr/bin/env node

/**
 * Script para corrigir sincronização de endereços
 * Resolve problemas de endereços não aparecendo no perfil do usuário
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

async function fixAddressesSync() {
  let connection;
  
  try {
    console.log('🔧 Iniciando correção de sincronização de endereços...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar estrutura das tabelas
    console.log('📋 Verificando estrutura das tabelas...');
    
    const [addressesStructure] = await connection.execute('DESCRIBE addresses');
    const [customerAddressesStructure] = await connection.execute('DESCRIBE customer_addresses');
    
    console.log('✅ Tabelas encontradas: addresses, customer_addresses\n');

    // 2. Verificar dados existentes
    console.log('🔍 Analisando dados existentes...');
    
    const [addressesCount] = await connection.execute('SELECT COUNT(*) as total FROM addresses');
    const [customerAddressesCount] = await connection.execute('SELECT COUNT(*) as total FROM customer_addresses');
    
    console.log(`📊 Endereços na tabela 'addresses': ${addressesCount[0].total}`);
    console.log(`📊 Endereços na tabela 'customer_addresses': ${customerAddressesCount[0].total}`);

    // 3. Verificar endereços em customer_addresses
    console.log('\n📍 Endereços em customer_addresses:');
    
    const [customerAddresses] = await connection.execute(`
      SELECT 
        ca.*,
        c.email as customer_email,
        c.nome as customer_nome
      FROM customer_addresses ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      ORDER BY ca.created_at DESC
    `);
    
    if (customerAddresses.length > 0) {
      customerAddresses.forEach((addr, index) => {
        console.log(`\n   ${index + 1}. Endereço ${addr.id}:`);
        console.log(`      - Cliente: ${addr.customer_nome} (${addr.customer_email})`);
        console.log(`      - Endereço: ${addr.rua}, ${addr.numero} - ${addr.bairro}`);
        console.log(`      - Cidade: ${addr.cidade} - ${addr.estado}`);
        console.log(`      - CEP: ${addr.cep}`);
        console.log(`      - Padrão: ${addr.padrao ? 'Sim' : 'Não'}`);
        console.log(`      - Data: ${addr.created_at.toLocaleDateString('pt-BR')}`);
      });
    } else {
      console.log('   ⚠️  Nenhum endereço encontrado em customer_addresses');
    }

    // 4. Verificar se há usuários sem endereços
    console.log('\n👥 Verificando usuários sem endereços...');
    
    const [usersWithoutAddresses] = await connection.execute(`
      SELECT 
        u.id,
        u.email,
        u.nome,
        (SELECT COUNT(*) FROM customer_addresses ca WHERE ca.customer_id = u.id) as address_count
      FROM users u
      WHERE (SELECT COUNT(*) FROM customer_addresses ca WHERE ca.customer_id = u.id) = 0
    `);
    
    if (usersWithoutAddresses.length > 0) {
      console.log(`📊 ${usersWithoutAddresses.length} usuários sem endereços:`);
      usersWithoutAddresses.forEach(user => {
        console.log(`   - ${user.nome} (${user.email})`);
      });
    } else {
      console.log('✅ Todos os usuários têm endereços cadastrados');
    }

    // 5. Verificar se há endereços órfãos (sem cliente)
    console.log('\n🔍 Verificando endereços órfãos...');
    
    const [orphanAddresses] = await connection.execute(`
      SELECT ca.*
      FROM customer_addresses ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (orphanAddresses.length > 0) {
      console.log(`⚠️  ${orphanAddresses.length} endereços órfãos encontrados`);
    } else {
      console.log('✅ Nenhum endereço órfão encontrado');
    }

    // 6. Sincronizar endereços entre tabelas (se necessário)
    console.log('\n🔄 Sincronizando endereços...');
    
    // Verificar se há endereços em 'addresses' que precisam ser migrados
    const [addressesToMigrate] = await connection.execute(`
      SELECT a.*, c.id as customer_id
      FROM addresses a
      LEFT JOIN customers c ON a.cart_id = c.id
      WHERE c.id IS NOT NULL
    `);
    
    let migratedAddresses = 0;
    for (const addr of addressesToMigrate) {
      // Verificar se já existe em customer_addresses
      const [existing] = await connection.execute(`
        SELECT id FROM customer_addresses 
        WHERE customer_id = ? AND rua = ? AND numero = ?
      `, [addr.customer_id, addr.endereco, addr.numero]);
      
      if (existing.length === 0) {
        // Migrar endereço
        const newId = crypto.randomUUID();
        await connection.execute(`
          INSERT INTO customer_addresses (
            id, customer_id, tipo, nome, rua, numero, complemento, 
            bairro, cidade, estado, cep, padrao, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newId,
          addr.customer_id,
          'casa',
          addr.nome || 'Endereço Migrado',
          addr.endereco,
          addr.numero || '',
          addr.complemento,
          addr.bairro || '',
          addr.cidade,
          addr.estado,
          addr.cep,
          addr.shipping_default ? 1 : 0,
          addr.created_at,
          addr.updated_at
        ]);
        
        console.log(`   ✅ Endereço migrado: ${addr.endereco} para cliente ${addr.customer_id}`);
        migratedAddresses++;
      }
    }

    // 7. Criar endereços de exemplo para usuários sem endereços (opcional)
    console.log('\n🏠 Criando endereços de exemplo para usuários sem endereços...');
    
    let createdAddresses = 0;
    for (const user of usersWithoutAddresses.slice(0, 3)) { // Limitar a 3 para não criar muitos
      const addressId = crypto.randomUUID();
      
      await connection.execute(`
        INSERT INTO customer_addresses (
          id, customer_id, tipo, nome, rua, numero, complemento,
          bairro, cidade, estado, cep, padrao, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        addressId,
        user.id,
        'casa',
        'Endereço Principal',
        'Rua Principal, 123',
        '123',
        'Apartamento 1',
        'Centro',
        'São Paulo',
        'SP',
        '01234-567',
        1 // Padrão
      ]);
      
      console.log(`   ✅ Endereço de exemplo criado para ${user.nome} (${user.email})`);
      createdAddresses++;
    }

    // 8. Verificar resultado final
    console.log('\n📊 Resultado final da sincronização:');
    
    const [finalAddressesCount] = await connection.execute('SELECT COUNT(*) as total FROM customer_addresses');
    const [finalUsersWithAddresses] = await connection.execute(`
      SELECT COUNT(DISTINCT customer_id) as total FROM customer_addresses
    `);
    
    console.log(`   📍 Total de endereços: ${finalAddressesCount[0].total}`);
    console.log(`   👥 Usuários com endereços: ${finalUsersWithAddresses[0].total}`);
    console.log(`   🔄 Endereços migrados: ${migratedAddresses}`);
    console.log(`   🏠 Endereços de exemplo criados: ${createdAddresses}`);

    // 9. Mostrar endereços mais recentes
    console.log('\n📋 Endereços mais recentes:');
    
    const [recentAddresses] = await connection.execute(`
      SELECT 
        ca.*,
        c.email as customer_email,
        c.nome as customer_nome
      FROM customer_addresses ca
      LEFT JOIN customers c ON ca.customer_id = c.id
      ORDER BY ca.created_at DESC 
      LIMIT 5
    `);
    
    recentAddresses.forEach((addr, index) => {
      console.log(`   ${index + 1}. ${addr.customer_nome} - ${addr.rua}, ${addr.numero} - ${addr.cidade}/${addr.estado}`);
    });
    
    console.log('\n✅ Sincronização de endereços concluída!');
    console.log('🔗 Agora os endereços devem aparecer corretamente no perfil do usuário');

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
  fixAddressesSync()
    .then(() => {
      console.log('\n🎉 Script de sincronização executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixAddressesSync };
