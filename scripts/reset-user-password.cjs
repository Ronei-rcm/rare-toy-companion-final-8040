#!/usr/bin/env node

/**
 * Script para resetar senha de usuário cliente
 * Uso: node scripts/reset-user-password.cjs <email> <nova-senha>
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = 12;

async function resetUserPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('❌ Uso: node scripts/reset-user-password.cjs <email> <nova-senha>');
    console.error('   Exemplo: node scripts/reset-user-password.cjs roneinetslim@gmail.com RSM_Rg51gti66');
    process.exit(1);
  }

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'rare_toy_companion',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  let connection;

  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);

    const emailLower = String(email).trim().toLowerCase();
    console.log(`🔍 Buscando usuário: ${emailLower}`);

    // Verificar se usuário existe
    const [users] = await connection.execute(
      'SELECT id, email, nome, password_hash FROM users WHERE email = ? LIMIT 1',
      [emailLower]
    );

    if (!users || users.length === 0) {
      console.error(`❌ Usuário não encontrado: ${emailLower}`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.nome || user.email} (ID: ${user.id})`);
    console.log(`📋 Hash atual: ${user.password_hash ? user.password_hash.substring(0, 30) + '...' : 'NENHUM'}`);

    // Gerar novo hash bcrypt
    console.log('🔐 Gerando novo hash bcrypt...');
    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    console.log(`✅ Novo hash gerado: ${newHash.substring(0, 30)}...`);

    // Atualizar senha no banco
    console.log('💾 Atualizando senha no banco de dados...');
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [newHash, emailLower]
    );

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ SENHA RESETADA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📧 Email: ${emailLower}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    console.log(`🔐 Hash: bcrypt (${BCRYPT_ROUNDS} rounds)`);
    console.log('');
    console.log('🌐 Agora você pode fazer login com essas credenciais!');
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error.message);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetUserPassword();
