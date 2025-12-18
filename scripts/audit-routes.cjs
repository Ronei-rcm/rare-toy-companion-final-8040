#!/usr/bin/env node

/**
 * Script de Auditoria de Rotas
 * 
 * Este script analisa o server.cjs e identifica:
 * 1. Todas as rotas definidas
 * 2. Quais já estão modularizadas
 * 3. Quais ainda estão no server.cjs
 * 4. Sugestões de agrupamento
 * 
 * Uso: node scripts/audit-routes.cjs
 */

const fs = require('fs');
const path = require('path');

const SERVER_FILE = path.join(__dirname, '../server/server.cjs');
const ROUTES_DIR = path.join(__dirname, '../server/routes');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function extractRoutesFromFile(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const routes = [];
  const routePattern = /app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi;
  
  lines.forEach((line, index) => {
    let match;
    while ((match = routePattern.exec(line)) !== null) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2],
        line: index + 1,
        file: fileName
      });
    }
  });
  
  return routes;
}

function getModularizedRoutes() {
  const files = fs.readdirSync(ROUTES_DIR);
  const routes = [];
  
  files.forEach(file => {
    if (file.endsWith('.cjs') || file.endsWith('.js')) {
      const filePath = path.join(ROUTES_DIR, file);
      try {
        const fileRoutes = extractRoutesFromFile(filePath, file);
        routes.push(...fileRoutes);
      } catch (error) {
        log(`⚠️  Erro ao processar ${file}: ${error.message}`, 'yellow');
      }
    }
  });
  
  return routes;
}

function groupRoutes(routes) {
  const groups = {};
  
  routes.forEach(route => {
    // Extrair prefixo da rota (ex: /api/products -> products)
    const parts = route.path.split('/').filter(p => p);
    
    if (parts.length > 1 && parts[0] === 'api') {
      const resource = parts[1]; // products, orders, customers, etc.
      
      if (!groups[resource]) {
        groups[resource] = [];
      }
      
      groups[resource].push(route);
    } else {
      // Rotas sem padrão claro
      if (!groups['other']) {
        groups['other'] = [];
      }
      groups['other'].push(route);
    }
  });
  
  return groups;
}

function analyzeRoutes() {
  log('\n🔍 AUDITORIA DE ROTAS - Rare Toy Companion\n', 'bright');
  log('=' .repeat(70), 'cyan');
  
  // Ler server.cjs
  log('\n📄 Analisando server.cjs...', 'blue');
  const serverRoutes = extractRoutesFromFile(SERVER_FILE, 'server.cjs');
  log(`   ✅ ${serverRoutes.length} rotas encontradas no server.cjs`, 'green');
  
  // Ler rotas modularizadas
  log('\n📦 Analisando rotas modularizadas...', 'blue');
  const modularRoutes = getModularizedRoutes();
  log(`   ✅ ${modularRoutes.length} rotas encontradas em arquivos separados`, 'green');
  
  // Agrupar rotas do server.cjs
  log('\n📊 Agrupando rotas do server.cjs...', 'blue');
  const serverGroups = groupRoutes(serverRoutes);
  
  // Estatísticas
  log('\n' + '='.repeat(70), 'cyan');
  log('📈 ESTATÍSTICAS', 'bright');
  log('='.repeat(70), 'cyan');
  log(`\nTotal de rotas no server.cjs: ${serverRoutes.length}`, 'yellow');
  log(`Total de rotas modularizadas: ${modularRoutes.length}`, 'green');
  log(`Porcentagem modularizada: ${((modularRoutes.length / (serverRoutes.length + modularRoutes.length)) * 100).toFixed(1)}%`, 'cyan');
  
  // Agrupamentos
  log('\n' + '='.repeat(70), 'cyan');
  log('📋 ROTAS POR RECURSO (server.cjs)', 'bright');
  log('='.repeat(70), 'cyan');
  
  const sortedGroups = Object.keys(serverGroups).sort();
  sortedGroups.forEach(resource => {
    const routes = serverGroups[resource];
    log(`\n🔸 ${resource.toUpperCase()} (${routes.length} rotas)`, 'magenta');
    
    routes.forEach(route => {
      log(`   ${route.method.padEnd(6)} ${route.path.padEnd(50)} (linha ${route.line})`, 'reset');
    });
  });
  
  // Lista completa de rotas no server.cjs
  log('\n' + '='.repeat(70), 'cyan');
  log('📝 LISTA COMPLETA DE ROTAS NO server.cjs', 'bright');
  log('='.repeat(70), 'cyan');
  
  serverRoutes
    .sort((a, b) => a.path.localeCompare(b.path))
    .forEach((route, index) => {
      log(`${(index + 1).toString().padStart(3)}. ${route.method.padEnd(6)} ${route.path.padEnd(50)} (linha ${route.line})`, 'reset');
    });
  
  // Sugestões
  log('\n' + '='.repeat(70), 'cyan');
  log('💡 SUGESTÕES DE MODULARIZAÇÃO', 'bright');
  log('='.repeat(70), 'cyan');
  
  sortedGroups.forEach(resource => {
    const routes = serverGroups[resource];
    if (routes.length > 0 && resource !== 'other') {
      log(`\n📦 ${resource.toUpperCase()}`, 'green');
      log(`   ${routes.length} rotas podem ser extraídas para:`);
      log(`   → routes/${resource}.routes.cjs`, 'cyan');
      log(`   → controllers/${resource}.controller.cjs`, 'cyan');
      log(`   → services/${resource}.service.cjs`, 'cyan');
    }
  });
  
  // Rotas únicas/misc
  if (serverGroups['other']) {
    log(`\n📦 OTHER/MISC`, 'yellow');
    log(`   ${serverGroups['other'].length} rotas que precisam ser categorizadas manualmente`, 'yellow');
  }
  
  log('\n' + '='.repeat(70), 'cyan');
  log('✅ Auditoria concluída!', 'green');
  log('='.repeat(70), 'cyan');
  log('\n');
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    serverRoutes: serverRoutes.length,
    modularRoutes: modularRoutes.length,
    percentageModularized: ((modularRoutes.length / (serverRoutes.length + modularRoutes.length)) * 100).toFixed(1),
    groups: serverGroups,
    allServerRoutes: serverRoutes
  };
  
  const reportPath = path.join(__dirname, '../docs/relatorio-auditoria-rotas.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 Relatório JSON salvo em: ${reportPath}`, 'blue');
}

// Executar
try {
  analyzeRoutes();
} catch (error) {
  log(`❌ Erro: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
