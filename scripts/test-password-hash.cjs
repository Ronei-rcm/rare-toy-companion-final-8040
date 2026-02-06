#!/usr/bin/env node

/**
 * Script para testar hash de senha
 * Uso: node scripts/test-password-hash.cjs email@exemplo.com "senha_a_testar"
 */

require('dotenv').config({ path: '.env' });

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const email = process.argv[2]?.trim().toLowerCase();
const passwordToTest = process.argv[3];

if (!email || !passwordToTest) {
  console.error('❌ Por favor, forneça email e senha como argumentos');
  console.log('Uso: node scripts/test-password-hash.cjs email@exemplo.com "senha_a_testar"');
  process.exit(1);
}

async function testPassword() {
  let connection = null;
  
  try {
    // Configurar conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      user: process.env.DB_USER || process.env.MYSQL_USER || 'rare_toy_user',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'rare_toy_companion',
      connectTimeout: 10000
    });

    console.log('🔐 TESTE DE SENHA');
    console.log('Email:', email);
    console.log('Senha testada:', '*'.repeat(passwordToTest.length));
    console.log('');

    // Buscar usuário em users
    const [users] = await connection.execute(
      `SELECT id, email, nome, password_hash 
       FROM users 
       WHERE email = ? 
       LIMIT 1`,
      [email]
    );

    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado em users');
      
      // Tentar em customers
      const [customers] = await connection.execute(
        `SELECT id, email, nome, password_hash 
         FROM customers 
         WHERE email = ? 
         LIMIT 1`,
        [email]
      );
      
      if (!customers || customers.length === 0) {
        console.log('❌ Usuário não encontrado em customers também');
        process.exit(1);
      }
      
      const user = customers[0];
      if (!user.password_hash) {
        console.log('❌ Usuário não tem senha cadastrada');
        process.exit(1);
      }
      
      await testHash(user.password_hash, passwordToTest, user);
    } else {
      const user = users[0];
      if (!user.password_hash) {
        console.log('❌ Usuário não tem senha cadastrada');
        process.exit(1);
      }
      
      await testHash(user.password_hash, passwordToTest, user);
    }

  } catch (error) {
    console.error('❌ Erro ao testar senha:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testHash(hash, password, user) {
  console.log('📋 Informações do Hash:');
  console.log(`   Hash completo: ${hash.substring(0, 50)}...`);
  console.log(`   Tamanho: ${hash.length} caracteres`);
  console.log(`   Tipo detectado: ${detectHashType(hash)}`);
  console.log('');

  // Teste 1: Bcrypt
  if (hash.startsWith('$2')) {
    console.log('🔐 Testando com bcrypt...');
    try {
      const match = await bcrypt.compare(password, hash);
      if (match) {
        console.log('✅ SENHA CORRETA! (bcrypt)');
        console.log('💡 O problema pode ser no código de verificação do servidor.');
      } else {
        console.log('❌ Senha INCORRETA (bcrypt)');
        console.log('💡 A senha fornecida não corresponde ao hash.');
      }
    } catch (error) {
      console.log('❌ Erro ao testar bcrypt:', error.message);
    }
  }
  
  // Teste 2: SHA256
  console.log('🔐 Testando com SHA256...');
  const crypto = require('crypto');
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  if (sha256Hash === hash) {
    console.log('✅ SENHA CORRETA! (SHA256)');
    console.log('💡 Hash é SHA256 antigo. Considere migrar para bcrypt.');
  } else {
    console.log('❌ Senha INCORRETA (SHA256)');
    console.log(`   Hash esperado: ${sha256Hash.substring(0, 20)}...`);
    console.log(`   Hash no banco: ${hash.substring(0, 20)}...`);
  }
  
  // Teste 3: scrypt (formato salt:key) - mesmo formato do servidor
  console.log('🔐 Testando com scrypt (formato salt:key)...');
  if (hash.includes(':')) {
    const [saltHex, keyHex] = hash.split(':');
    if (saltHex && keyHex) {
      try {
        const testKey = await new Promise((resolve, reject) => {
          crypto.scrypt(password, Buffer.from(saltHex, 'hex'), 64, (err, derivedKey) => {
            if (err) return reject(err);
            try {
              const match = crypto.timingSafeEqual(Buffer.from(keyHex, 'hex'), derivedKey);
              resolve(match);
            } catch (compareError) {
              reject(compareError);
            }
          });
        });
        
        if (testKey) {
          console.log('✅ SENHA CORRETA! (scrypt)');
          console.log('💡 O servidor agora deve aceitar esta senha após reiniciar!');
        } else {
          console.log('❌ Senha INCORRETA (scrypt)');
        }
      } catch (error) {
        console.log('❌ Erro ao testar scrypt:', error.message);
      }
    }
  }
  
  console.log('');
  console.log('📊 RESUMO:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Nome: ${user.nome || 'Não informado'}`);
  console.log(`   Tipo de hash: ${detectHashType(hash)}`);
  console.log('');
  
  // Sugestões
  if (!hash.startsWith('$2')) {
    console.log('💡 RECOMENDAÇÃO:');
    console.log('   O hash não é bcrypt. Considere migrar para bcrypt:');
    console.log(`   node scripts/migrate-passwords-to-bcrypt.cjs`);
    console.log(`   ou`);
    console.log(`   node scripts/add-password-to-user.cjs ${user.email} "nova_senha"`);
  }
}

function detectHashType(hash) {
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return 'bcrypt ✅';
  } else if (hash.includes(':')) {
    return 'SHA256 + salt (antigo)';
  } else if (hash.length === 64) {
    return 'SHA256 (antigo)';
  } else {
    return 'Desconhecido ⚠️';
  }
}

// Executar teste
testPassword().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
