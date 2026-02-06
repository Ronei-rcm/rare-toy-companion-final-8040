#!/usr/bin/env node

/**
 * Script para debugar login de usuário
 * Uso: node scripts/debug-login-user.cjs email@exemplo.com
 */

require('dotenv').config({ path: '.env' });

const mysql = require('mysql2/promise');

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('❌ Por favor, forneça um email como argumento');
  console.log('Uso: node scripts/debug-login-user.cjs email@exemplo.com');
  process.exit(1);
}

async function debugLogin() {
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

    console.log('🔍 DEBUG LOGIN - Verificando usuário:', email);
    console.log('');

    // 1. Verificar em users
    console.log('📋 1. Verificando na tabela users...');
    const [users] = await connection.execute(
      `SELECT id, email, nome, password_hash, created_at 
       FROM users 
       WHERE email = ? 
       LIMIT 1`,
      [email]
    );

    if (users && users.length > 0) {
      const user = users[0];
      console.log('✅ Usuário encontrado em users:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.nome || 'Não informado'}`);
      console.log(`   Tem senha: ${user.password_hash ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   Criado em: ${user.created_at || 'Não informado'}`);
      
      if (user.password_hash) {
        console.log(`   Tipo de hash: ${user.password_hash.startsWith('$2') ? 'bcrypt ✅' : 'Outro tipo ⚠️'}`);
        console.log(`   Hash (primeiros 20 chars): ${user.password_hash.substring(0, 20)}...`);
      } else {
        console.log('   ⚠️ Usuário não tem senha cadastrada!');
        console.log('   💡 Solução: Use "Esqueci minha senha" ou crie senha com:');
        console.log(`      node scripts/add-password-to-user.cjs ${email} "nova_senha"`);
      }
    } else {
      console.log('❌ Usuário NÃO encontrado em users');
    }

    console.log('');

    // 2. Verificar em customers
    console.log('📋 2. Verificando na tabela customers...');
    const [customers] = await connection.execute(
      `SELECT id, email, nome, password_hash, created_at 
       FROM customers 
       WHERE email = ? 
       LIMIT 1`,
      [email]
    );

    if (customers && customers.length > 0) {
      const customer = customers[0];
      console.log('✅ Usuário encontrado em customers:');
      console.log(`   ID: ${customer.id}`);
      console.log(`   Email: ${customer.email}`);
      console.log(`   Nome: ${customer.nome || 'Não informado'}`);
      console.log(`   Tem senha: ${customer.password_hash ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`   Criado em: ${customer.created_at || 'Não informado'}`);
      
      if (customer.password_hash) {
        console.log(`   Tipo de hash: ${customer.password_hash.startsWith('$2') ? 'bcrypt ✅' : 'Outro tipo ⚠️'}`);
      }
    } else {
      console.log('❌ Usuário NÃO encontrado em customers');
    }

    console.log('');

    // 3. Verificar sessões ativas
    console.log('📋 3. Verificando sessões ativas...');
    const [sessions] = await connection.execute(
      `SELECT s.id, s.user_id, s.created_at, s.last_seen, u.email 
       FROM sessions s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE u.email = ? 
       ORDER BY s.last_seen DESC 
       LIMIT 5`,
      [email]
    );

    if (sessions && sessions.length > 0) {
      console.log(`✅ ${sessions.length} sessão(ões) ativa(s):`);
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. Sessão ID: ${session.id}`);
        console.log(`      User ID: ${session.user_id}`);
        console.log(`      Criada em: ${session.created_at}`);
        console.log(`      Última visita: ${session.last_seen || 'Nunca'}`);
      });
    } else {
      console.log('❌ Nenhuma sessão ativa encontrada');
    }

    console.log('');

    // 4. Resumo
    console.log('📊 RESUMO:');
    const userExists = (users && users.length > 0) || (customers && customers.length > 0);
    const hasPassword = (users && users[0]?.password_hash) || (customers && customers[0]?.password_hash);
    
    if (!userExists) {
      console.log('❌ Usuário NÃO EXISTE no banco de dados');
      console.log('💡 Solução: Criar usuário ou verificar email correto');
    } else if (!hasPassword) {
      console.log('⚠️ Usuário EXISTE mas NÃO TEM SENHA');
      console.log('💡 Solução: Use "Esqueci minha senha" ou:');
      console.log(`   node scripts/add-password-to-user.cjs ${email} "nova_senha"`);
    } else {
      console.log('✅ Usuário EXISTE e TEM SENHA cadastrada');
      console.log('💡 Se login falha, verifique se:');
      console.log('   1. Senha está correta (case-sensitive)');
      console.log('   2. Não há espaços antes/depois da senha');
      console.log('   3. Hash está correto no banco');
    }

  } catch (error) {
    console.error('❌ Erro ao debugar login:', error.message);
    console.error('Stack:', error.stack);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar debug
debugLogin().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
