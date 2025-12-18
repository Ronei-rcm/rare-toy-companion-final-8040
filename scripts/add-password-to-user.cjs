#!/usr/bin/env node

/**
 * Script para adicionar senha a um usuário existente
 * 
 * Uso:
 *   node scripts/add-password-to-user.cjs email@exemplo.com "senha123"
 * 
 * Ou interativo:
 *   node scripts/add-password-to-user.cjs
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

// Função para hash de senha (SHA256 - compatível com o sistema atual)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Função para hash bcrypt (mais seguro, se o sistema estiver usando)
async function hashPasswordBcrypt(password) {
  try {
    const bcrypt = require('bcrypt');
    return await bcrypt.hash(password, 10);
  } catch (e) {
    console.log('⚠️ Bcrypt não disponível, usando SHA256');
    return hashPassword(password);
  }
}

async function addPasswordToUser(email, newPassword) {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    console.log('✅ Conectado ao banco de dados');
    
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Verificar se usuário existe em users
    console.log(`🔍 Procurando usuário: ${normalizedEmail}...`);
    
    let [users] = await connection.execute(
      'SELECT id, email, nome, password_hash FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );
    
    if (users.length === 0) {
      // Tentar em customers
      [users] = await connection.execute(
        'SELECT id, email, nome FROM customers WHERE email = ? LIMIT 1',
        [normalizedEmail]
      );
      
      if (users.length === 0) {
        console.error(`❌ Usuário não encontrado: ${normalizedEmail}`);
        console.log('💡 Dica: Crie uma conta primeiro ou verifique o email');
        process.exit(1);
      }
      
      // Se encontrou em customers mas não em users, criar em users
      console.log('⚠️ Usuário encontrado em customers, mas não em users. Criando entrada em users...');
      
      const userId = users[0].id || require('crypto').randomUUID();
      const nome = users[0].nome || users[0].email;
      
      // Criar em users com senha
      const senhaHash = hashPassword(newPassword);
      
      await connection.execute(
        `INSERT INTO users (id, email, nome, password_hash, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE password_hash = ?, updated_at = NOW()`,
        [userId, normalizedEmail, nome, senhaHash, senhaHash]
      );
      
      console.log('✅ Usuário criado em users com senha cadastrada!');
      console.log(`   ID: ${userId}`);
      console.log(`   Email: ${normalizedEmail}`);
      console.log(`   Nome: ${nome}`);
      
      await connection.end();
      return;
    }
    
    const user = users[0];
    
    // Verificar se já tem senha (suporta ambos os nomes de coluna)
    const hasPassword = user.password_hash || user.senha_hash;
    if (hasPassword) {
      console.log('⚠️ Usuário já possui senha cadastrada!');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.nome || 'N/A'}`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Deseja substituir a senha existente? (sim/não): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() !== 'sim' && answer.toLowerCase() !== 's') {
        console.log('❌ Operação cancelada');
        await connection.end();
        return;
      }
    }
    
    // Hash da senha (tentar bcrypt primeiro, depois SHA256)
    let senhaHash;
    try {
      senhaHash = await hashPasswordBcrypt(newPassword);
      console.log('✅ Senha hasheada com bcrypt (mais seguro)');
    } catch (e) {
      senhaHash = hashPassword(newPassword);
      console.log('⚠️ Senha hasheada com SHA256 (compatível com sistema atual)');
    }
    
    // Atualizar senha (usar password_hash, que é o nome correto da coluna)
    await connection.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?',
      [senhaHash, normalizedEmail]
    );
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log(`   Email: ${normalizedEmail}`);
    console.log(`   Nome: ${user.nome || 'N/A'}`);
    console.log(`   ID: ${user.id}`);
    
    // Verificar se existe em customers também e sincronizar
    const [customers] = await connection.execute(
      'SELECT id FROM customers WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );
    
    if (customers.length === 0) {
      console.log('💡 Criando entrada em customers também...');
      await connection.execute(
        `INSERT INTO customers (id, email, nome, created_at, updated_at) 
         VALUES (?, ?, ?, NOW(), NOW())`,
        [user.id, normalizedEmail, user.nome || normalizedEmail]
      );
      console.log('✅ Entrada criada em customers');
    }
    
    await connection.end();
    console.log('\n✅ Processo concluído! Agora o usuário pode fazer login.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    if (connection) await connection.end();
    process.exit(1);
  }
}

// Main
(async () => {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Modo com argumentos: email e senha
    const email = args[0];
    const password = args[1];
    
    if (!email || !password) {
      console.error('❌ Uso: node scripts/add-password-to-user.cjs email@exemplo.com "senha123"');
      process.exit(1);
    }
    
    await addPasswordToUser(email, password);
    
  } else {
    // Modo interativo
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('🔐 Adicionar Senha a Usuário Existente\n');
    
    const email = await new Promise(resolve => {
      readline.question('Digite o email do usuário: ', resolve);
    });
    
    const password = await new Promise(resolve => {
      readline.question('Digite a nova senha: ', { echo: false }, resolve);
    });
    
    readline.close();
    
    if (!email || !password) {
      console.error('❌ Email e senha são obrigatórios!');
      process.exit(1);
    }
    
    await addPasswordToUser(email, password);
  }
})();

