#!/usr/bin/env node

/**
 * Script para corrigir configuração do banco de dados
 * Corrige inconsistência entre rare_toy_companion e rare_toy_store
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo configuração do banco de dados...');

// Ler arquivo .env
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Arquivo .env lido com sucesso');
} catch (error) {
  console.error('❌ Erro ao ler .env:', error.message);
  process.exit(1);
}

// Fazer backup
const backupPath = path.join(__dirname, '..', '.env.backup');
fs.writeFileSync(backupPath, envContent);
console.log('✅ Backup criado: .env.backup');

// Corrigir nomes do banco
let correctedContent = envContent
  .replace(/DB_NAME=rare_toy_companion/g, 'DB_NAME=rare_toy_store')
  .replace(/MYSQL_DATABASE=rare_toy_companion/g, 'MYSQL_DATABASE=rare_toy_store');

// Verificar se houve mudanças
if (correctedContent === envContent) {
  console.log('ℹ️ Nenhuma correção necessária - configuração já está correta');
} else {
  // Salvar arquivo corrigido
  fs.writeFileSync(envPath, correctedContent);
  console.log('✅ Arquivo .env corrigido com sucesso');
  console.log('📝 Mudanças aplicadas:');
  console.log('   - DB_NAME: rare_toy_companion → rare_toy_store');
  console.log('   - MYSQL_DATABASE: rare_toy_companion → rare_toy_store');
}

console.log('🎯 Próximos passos:');
console.log('   1. Reiniciar o servidor: npm run pm2:restart');
console.log('   2. Verificar logs: pm2 logs api');
console.log('   3. Testar endpoints do banco');
