#!/usr/bin/env node

/**
 * Script de Migração de Senhas SHA256 para Bcrypt
 * 
 * Este script migra senhas de SHA256 para bcrypt de forma segura.
 * As senhas antigas continuam funcionando durante a transição.
 */

const mysql = require('mysql2/promise');
const { hashPassword, verifyPassword } = require('../server/utils/security.cjs');
require('dotenv').config();

async function migratePasswords() {
  let connection;
  
  try {
    console.log('🔄 Iniciando migração de senhas SHA256 → Bcrypt...\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rare_toy_companion'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Buscar usuários admin com senhas SHA256
    const [users] = await connection.execute(
      `SELECT id, email, senha_hash 
       FROM admin_users 
       WHERE senha_hash IS NOT NULL 
       AND senha_hash != '' 
       AND senha_hash NOT LIKE '$2%' 
       AND senha_hash NOT LIKE '$2a%' 
       AND senha_hash NOT LIKE '$2b%' 
       AND senha_hash NOT LIKE '$2y%'`
    );
    
    if (users.length === 0) {
      console.log('✅ Nenhuma senha SHA256 encontrada. Todas as senhas já estão em bcrypt!\n');
      return;
    }
    
    console.log(`📊 Encontradas ${users.length} senhas em SHA256 que precisam ser migradas\n`);
    console.log('⚠️  ATENÇÃO: Este script NÃO pode migrar automaticamente porque não temos as senhas em texto plano.');
    console.log('⚠️  As senhas serão migradas automaticamente quando os usuários fizerem login.\n');
    console.log('📋 Usuários que precisam migrar:\n');
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n💡 SOLUÇÃO:');
    console.log('   1. Os usuários podem fazer login normalmente (SHA256 ainda funciona)');
    console.log('   2. Quando fizerem login, o sistema detectará que a senha está em SHA256');
    console.log('   3. Você pode criar um script para forçar a troca de senha na próxima vez que fizerem login');
    console.log('   4. Ou você pode resetar as senhas manualmente usando o script update-admin-password.cjs\n');
    
    // Opção: Criar flag para forçar troca de senha
    const forcePasswordChange = process.argv.includes('--force-change');
    
    if (forcePasswordChange) {
      console.log('🔄 Marcando usuários para troca obrigatória de senha...\n');
      
      for (const user of users) {
        await connection.execute(
          'UPDATE admin_users SET must_change_password = 1 WHERE id = ?',
          [user.id]
        );
        console.log(`   ✅ ${user.email} marcado para troca de senha`);
      }
      
      console.log('\n✅ Todos os usuários foram marcados para troca obrigatória de senha.');
      console.log('   Na próxima vez que fizerem login, serão obrigados a trocar a senha.\n');
    }
    
    console.log('✅ Migração concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar migração
if (require.main === module) {
  migratePasswords().catch(console.error);
}

module.exports = { migratePasswords };

