#!/usr/bin/env node

/**
 * Script para remover senhas hardcoded do código
 * Uso: node scripts/fix-passwords.js
 */

const fs = require('fs');
const path = require('path');

const oldPasswords = [
  "'RSM_Rg51gti66'",
  '"RSM_Rg51gti66"',
  "'rg51gt66'",
  '"rg51gt66"',
  'RSM_Rg51gti66',
  'rg51gt66'
];

const newPassword = "process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ''";

let filesFixed = 0;
let totalReplacements = 0;

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacements = 0;

    oldPasswords.forEach(oldPassword => {
      // Substituir apenas quando aparecer após "password:"
      const pattern1 = new RegExp(`password:\\s*${oldPassword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const replacement1 = `password: ${newPassword}`;
      
      if (content.match(pattern1)) {
        content = content.replace(pattern1, replacement1);
        modified = true;
        replacements++;
      }

      // Substituir quando aparecer isolado (em alguns casos)
      const pattern2 = new RegExp(`\\b${oldPassword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      // Mas só se não for parte de outro padrão já substituído
      if (!content.includes(`password: ${newPassword}`) && content.match(pattern2) && filePath.includes('password')) {
        // Não substituir aqui para evitar substituições incorretas
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesFixed++;
      totalReplacements += replacements;
      console.log(`  ✅ ${filePath} (${replacements} substituição${replacements > 1 ? 'ões' : ''})`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao processar ${filePath}:`, error.message);
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules e dist
      if (!['node_modules', 'dist', '.git'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (stat.isFile()) {
      // Processar apenas arquivos JavaScript/TypeScript
      const ext = path.extname(file);
      if (['.js', '.cjs', '.ts', '.tsx'].includes(ext) || file.endsWith('.sh')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

console.log('🔒 Iniciando correção de senhas hardcoded...\n');

// Processar scripts/
console.log('📂 Procurando em scripts/...');
const scriptFiles = walkDir('scripts');
scriptFiles.forEach(fixFile);

// Processar server/ (exceto legacy para não quebrar arquivos antigos)
console.log('\n📂 Procurando em server/...');
const serverFiles = walkDir('server').filter(f => !f.includes('legacy'));
serverFiles.forEach(fixFile);

console.log(`\n✅ Correção concluída!`);
console.log(`📊 Arquivos corrigidos: ${filesFixed}`);
console.log(`📊 Total de substituições: ${totalReplacements}`);
console.log('\n⚠️  IMPORTANTE:');
console.log('   1. Revise os arquivos alterados');
console.log('   2. Certifique-se de que o arquivo .env está configurado');
console.log('   3. Teste a conexão com o banco: npm run mysql:test');
console.log('   4. Nunca commite senhas no código novamente!\n');
