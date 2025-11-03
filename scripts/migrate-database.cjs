#!/usr/bin/env node

/**
 * Script para migrar banco de dados
 * Cria rare_toy_store e migra dados de rare_toy_companion
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  charset: 'utf8mb4'
};

async function migrateDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado com sucesso');

    // 1. Verificar se rare_toy_companion existe
    console.log('\n🔍 Verificando banco de origem...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const sourceDb = databases.find(db => db.Database === 'rare_toy_companion');
    const targetDb = databases.find(db => db.Database === 'rare_toy_store');

    if (!sourceDb) {
      console.log('❌ Banco rare_toy_companion não encontrado');
      console.log('📋 Bancos disponíveis:');
      databases.forEach(db => console.log(`   - ${db.Database}`));
      process.exit(1);
    }

    console.log('✅ Banco de origem encontrado: rare_toy_companion');

    // 2. Criar banco de destino se não existir
    if (!targetDb) {
      console.log('\n🏗️ Criando banco de destino...');
      await connection.execute('CREATE DATABASE rare_toy_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Banco rare_toy_store criado');
    } else {
      console.log('ℹ️ Banco rare_toy_store já existe');
    }

    // 3. Obter lista de tabelas do banco de origem
    console.log('\n📋 Obtendo lista de tabelas...');
    await connection.execute('USE rare_toy_companion');
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log(`✅ ${tables.length} tabelas encontradas:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // 4. Criar dump e restaurar
    console.log('\n💾 Criando dump do banco de origem...');
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    const dumpFile = 'rare_toy_companion_dump.sql';
    const dumpCommand = `mysqldump -h${config.host} -P${config.port} -u${config.user} -p${config.password} --single-transaction --routines --triggers rare_toy_companion > ${dumpFile}`;
    
    try {
      await execAsync(dumpCommand);
      console.log('✅ Dump criado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao criar dump:', error.message);
      process.exit(1);
    }

    // 5. Restaurar no banco de destino
    console.log('\n🔄 Restaurando no banco de destino...');
    const restoreCommand = `mysql -h${config.host} -P${config.port} -u${config.user} -p${config.password} rare_toy_store < ${dumpFile}`;
    
    try {
      await execAsync(restoreCommand);
      console.log('✅ Dados restaurados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao restaurar dados:', error.message);
      process.exit(1);
    }

    // 6. Verificar migração
    console.log('\n✅ Verificando migração...');
    await connection.execute('USE rare_toy_store');
    const [newTables] = await connection.execute('SHOW TABLES');
    
    console.log(`✅ ${newTables.length} tabelas migradas:`);
    newTables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // 7. Limpar arquivo temporário
    try {
      const fs = require('fs');
      fs.unlinkSync(dumpFile);
      console.log('🧹 Arquivo temporário removido');
    } catch (error) {
      console.warn('⚠️ Não foi possível remover arquivo temporário:', error.message);
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Reiniciar o servidor: npm run pm2:restart');
    console.log('   2. Executar otimização: node scripts/optimize-database.cjs');
    console.log('   3. Testar endpoints da API');

  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

// Executar migração
migrateDatabase().catch(console.error);
