#!/usr/bin/env node

/**
 * Script para resetar senha do admin roneinetslim@gmail.com
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: 'rare_toy_companion'
};

async function resetAdminPassword() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(config);
    
    const email = 'roneinetslim@gmail.com';
    const newPassword = 'RSM_Rg51gti66';
    
    console.log('\n1️⃣ Verificando se usuário existe...');
    const [users] = await connection.execute(
      'SELECT id, nome, email FROM admin_users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log(`\n❌ Usuário ${email} não encontrado!`);
      console.log('📝 Criando novo usuário admin...');
      
      // Criar hash bcrypt
      const hash = await bcrypt.hash(newPassword, 10);
      
      // Criar usuário
      await connection.execute(
        `INSERT INTO admin_users (nome, email, senha_hash, role, ativo) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Ronei Admin', email, hash, 'super_admin', 1]
      );
      
      console.log('✅ Usuário criado com sucesso!');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${newPassword}`);
      console.log(`   Role: super_admin`);
      
    } else {
      console.log(`✅ Usuário encontrado: ${users[0].nome}`);
      
      console.log('\n2️⃣ Gerando novo hash bcrypt...');
      const hash = await bcrypt.hash(newPassword, 10);
      console.log(`✅ Hash gerado: ${hash.substring(0, 30)}...`);
      
      console.log('\n3️⃣ Atualizando senha no banco...');
      await connection.execute(
        'UPDATE admin_users SET senha_hash = ?, ativo = 1 WHERE email = ?',
        [hash, email]
      );
      
      console.log('✅ Senha atualizada com sucesso!');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SENHA RESETADA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email: roneinetslim@gmail.com');
    console.log('🔑 Senha: RSM_Rg51gti66');
    console.log('');
    console.log('🔄 Faça login no admin agora!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
resetAdminPassword()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
