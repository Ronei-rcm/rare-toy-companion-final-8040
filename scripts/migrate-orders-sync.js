#!/usr/bin/env node

// Script para executar migrações do sistema unificado de pedidos
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rare_toy_companion',
  multipleStatements: true
};

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔄 Iniciando migrações do sistema de pedidos...');
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Ler arquivo de migração
    const migrationPath = path.join(__dirname, '../database/migrations/orders_sync_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar migração - dividir em comandos individuais
    console.log('📦 Executando migrações...');
    
    // Dividir o SQL em comandos individuais e ordenar por prioridade
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    // Ordenar comandos: CREATE TABLE primeiro, depois ALTER TABLE, depois CREATE INDEX
    const createTables = commands.filter(cmd => cmd.startsWith('CREATE TABLE'));
    const alterTables = commands.filter(cmd => cmd.startsWith('ALTER TABLE'));
    const createIndexes = commands.filter(cmd => cmd.startsWith('CREATE INDEX'));
    const insertData = commands.filter(cmd => cmd.startsWith('INSERT'));
    const createViews = commands.filter(cmd => cmd.startsWith('CREATE OR REPLACE VIEW'));
    
    const orderedCommands = [...createTables, ...alterTables, ...createIndexes, ...insertData, ...createViews];
    
    for (const command of orderedCommands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Executado: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Ignorar erros de "já existe" para tabelas e colunas
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
              error.code === 'ER_DUP_KEYNAME' || 
              error.code === 'ER_DUP_FIELDNAME' ||
              error.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
              error.code === 'ER_KEY_COLUMN_DOES_NOT_EXITS') {
            console.log(`⚠️  Já existe: ${command.substring(0, 50)}...`);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ Migrações executadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('order_status_history', 'order_comments', 'order_notifications', 'order_metrics_cache')
    `, [dbConfig.database]);
    
    console.log('📋 Tabelas criadas:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}`);
    });
    
    // Verificar se as colunas foram adicionadas à tabela orders
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME IN ('tracking_code', 'estimated_delivery', 'notes', 'priority', 'assigned_to', 'last_activity')
    `, [dbConfig.database]);
    
    console.log('🔧 Colunas adicionadas à tabela orders:');
    columns.forEach(column => {
      console.log(`  - ${column.COLUMN_NAME}`);
    });
    
    // Verificar views criadas
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('orders_complete', 'orders_stats_realtime')
    `, [dbConfig.database]);
    
    console.log('👁️ Views criadas:');
    views.forEach(view => {
      console.log(`  - ${view.TABLE_NAME}`);
    });
    
    console.log('\n🎉 Sistema de pedidos unificado configurado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Reiniciar o servidor backend');
    console.log('2. Configurar WebSocket no servidor');
    console.log('3. Testar sincronização em tempo real');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco encerrada');
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };

