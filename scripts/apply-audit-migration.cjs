#!/usr/bin/env node

/**
 * Script para aplicar migração de auditoria
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
  let connection;
  
  try {
    console.log('🔄 Aplicando migração de auditoria...\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rare_toy_companion',
      multipleStatements: true
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../database/migrations/014_create_audit_logs_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📦 Executando migração...\n');
    
    // Executar migração
    await connection.query(migrationSQL);
    
    console.log('✅ Migração aplicada com sucesso!\n');
    console.log('📋 Tabela audit_logs criada com:');
    console.log('   - Índices otimizados');
    console.log('   - Foreign key para admin_users');
    console.log('   - Campos para rastreamento completo\n');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('already exists')) {
      console.log('\n⚠️  Tabela já existe. Migração pode ter sido aplicada anteriormente.');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };

