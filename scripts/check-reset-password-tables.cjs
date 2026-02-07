/**
 * Script para verificar e criar colunas de reset de senha
 * Uso: node scripts/check-reset-password-tables.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAndFixTables() {
  let connection;

  try {
    // Criar conexão
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3307')
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar tabela users
    console.log('\n📋 Verificando tabela users...');
    try {
      const [usersColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'rare_toy_companion' 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME IN ('reset_token', 'reset_expires')
      `);

      const hasResetToken = usersColumns.some(col => col.COLUMN_NAME === 'reset_token');
      const hasResetExpires = usersColumns.some(col => col.COLUMN_NAME === 'reset_expires');

      if (!hasResetToken || !hasResetExpires) {
        console.log('⚠️ Colunas reset_token ou reset_expires não encontradas em users');
        console.log('🔧 Adicionando colunas...');

        if (!hasResetToken) {
          await connection.execute(`
            ALTER TABLE \`rare_toy_companion\`.\`users\` 
            ADD COLUMN \`reset_token\` VARCHAR(255) NULL DEFAULT NULL
          `);
          console.log('✅ Coluna reset_token adicionada em users');
        }

        if (!hasResetExpires) {
          await connection.execute(`
            ALTER TABLE \`rare_toy_companion\`.\`users\` 
            ADD COLUMN \`reset_expires\` DATETIME NULL DEFAULT NULL
          `);
          console.log('✅ Coluna reset_expires adicionada em users');
        }

        // Adicionar índice
        try {
          await connection.execute(`
            CREATE INDEX \`idx_users_reset_token\` ON \`rare_toy_companion\`.\`users\`(\`reset_token\`)
          `);
          console.log('✅ Índice idx_users_reset_token criado');
        } catch (e) {
          if (!e.message.includes('Duplicate key')) {
            console.warn('⚠️ Erro ao criar índice (pode já existir):', e.message);
          }
        }
      } else {
        console.log('✅ Colunas reset_token e reset_expires já existem em users');
      }
    } catch (e) {
      console.error('❌ Erro ao verificar users:', e.message);
    }

    // Verificar tabela customers
    console.log('\n📋 Verificando tabela customers...');
    try {
      const [customersColumns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'rare_toy_companion' 
        AND TABLE_NAME = 'customers' 
        AND COLUMN_NAME IN ('reset_token', 'reset_expires')
      `);

      const hasResetToken = customersColumns.some(col => col.COLUMN_NAME === 'reset_token');
      const hasResetExpires = customersColumns.some(col => col.COLUMN_NAME === 'reset_expires');

      if (!hasResetToken || !hasResetExpires) {
        console.log('⚠️ Colunas reset_token ou reset_expires não encontradas em customers');
        console.log('🔧 Adicionando colunas...');

        if (!hasResetToken) {
          await connection.execute(`
            ALTER TABLE \`rare_toy_companion\`.\`customers\` 
            ADD COLUMN \`reset_token\` VARCHAR(255) NULL DEFAULT NULL
          `);
          console.log('✅ Coluna reset_token adicionada em customers');
        }

        if (!hasResetExpires) {
          await connection.execute(`
            ALTER TABLE \`rare_toy_companion\`.\`customers\` 
            ADD COLUMN \`reset_expires\` DATETIME NULL DEFAULT NULL
          `);
          console.log('✅ Coluna reset_expires adicionada em customers');
        }

        // Adicionar índice
        try {
          await connection.execute(`
            CREATE INDEX \`idx_customers_reset_token\` ON \`rare_toy_companion\`.\`customers\`(\`reset_token\`)
          `);
          console.log('✅ Índice idx_customers_reset_token criado');
        } catch (e) {
          if (!e.message.includes('Duplicate key')) {
            console.warn('⚠️ Erro ao criar índice (pode já existir):', e.message);
          }
        }
      } else {
        console.log('✅ Colunas reset_token e reset_expires já existem em customers');
      }
    } catch (e) {
      console.error('❌ Erro ao verificar customers:', e.message);
    }

    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkAndFixTables();
}

module.exports = { checkAndFixTables };
