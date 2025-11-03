#!/usr/bin/env node

/**
 * 🚀 MUHLSTORE - SCRIPT DE OTIMIZAÇÃO DE BUILD
 * =============================================
 * Data: Outubro 2025
 * Versão: 2.0
 * Autor: Sistema de Otimização Automática
 * =============================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.blue}==> ${message}${colors.reset}\n`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function printBanner() {
  console.log(`${colors.purple}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║                    🚀 MUHLSTORE v2.0                        ║');
  console.log('║                                                              ║');
  console.log('║              OTIMIZADOR DE BUILD AUTOMÁTICO                  ║');
  console.log('║                                                              ║');
  console.log('║              Performance & Security Optimizer                ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
}

// Configurações
const config = {
  distDir: path.join(process.cwd(), 'dist'),
  uploadsDir: path.join(process.cwd(), 'uploads'),
  logsDir: path.join(process.cwd(), 'logs'),
  maxFileSize: 1024 * 1024 * 5, // 5MB
  imageFormats: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
  textFormats: ['.js', '.css', '.html', '.json', '.xml', '.txt']
};

/**
 * Verifica se um arquivo existe
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se um diretório existe
 */
function dirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Obtém o tamanho de um arquivo
 */
function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (error) {
    return 0;
  }
}

/**
 * Obtém informações de um arquivo
 */
function getFileInfo(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size: stats.size,
    modified: stats.mtime,
    created: stats.birthtime
  };
}

/**
 * Remove arquivos desnecessários
 */
function cleanupUnnecessaryFiles() {
  logHeader('🧹 Removendo Arquivos Desnecessários');
  
  const filesToRemove = [
    'dist/*.map',
    'dist/**/*.map',
    'node_modules/.cache',
    '.vite',
    '.eslintcache'
  ];
  
  filesToRemove.forEach(pattern => {
    try {
      execSync(`rm -rf ${pattern}`, { stdio: 'ignore' });
      logSuccess(`Removido: ${pattern}`);
    } catch (error) {
      // Ignorar erros de arquivos não encontrados
    }
  });
}

/**
 * Otimiza imagens usando sharp
 */
function optimizeImages() {
  logHeader('🖼️ Otimizando Imagens');
  
  if (!dirExists(config.uploadsDir)) {
    logWarning('Diretório de uploads não encontrado');
    return;
  }
  
  try {
    // Verificar se sharp está instalado
    require('sharp');
    
    const files = getAllFiles(config.uploadsDir);
    const imageFiles = files.filter(file => 
      config.imageFormats.includes(path.extname(file).toLowerCase())
    );
    
    let optimizedCount = 0;
    
    imageFiles.forEach(filePath => {
      try {
        const fileInfo = getFileInfo(filePath);
        
        // Só otimizar arquivos maiores que 100KB
        if (fileInfo.size > 100 * 1024) {
          const sharp = require('sharp');
          const ext = path.extname(filePath).toLowerCase();
          
          sharp(filePath)
            .jpeg({ quality: 85, progressive: true })
            .png({ quality: 85, progressive: true })
            .webp({ quality: 85 })
            .toFile(filePath.replace(ext, '.optimized' + ext))
            .then(() => {
              // Substituir arquivo original pelo otimizado
              fs.renameSync(
                filePath.replace(ext, '.optimized' + ext),
                filePath
              );
              optimizedCount++;
            })
            .catch(error => {
              logWarning(`Erro ao otimizar ${filePath}: ${error.message}`);
            });
        }
      } catch (error) {
        logWarning(`Erro ao processar ${filePath}: ${error.message}`);
      }
    });
    
    logSuccess(`${optimizedCount} imagens otimizadas`);
  } catch (error) {
    logWarning('Sharp não instalado, pulando otimização de imagens');
  }
}

/**
 * Comprime arquivos de texto
 */
function compressTextFiles() {
  logHeader('📝 Comprimindo Arquivos de Texto');
  
  if (!dirExists(config.distDir)) {
    logWarning('Diretório dist não encontrado');
    return;
  }
  
  const files = getAllFiles(config.distDir);
  const textFiles = files.filter(file => 
    config.textFormats.includes(path.extname(file).toLowerCase())
  );
  
  let compressedCount = 0;
  
  textFiles.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Comprimir removendo espaços desnecessários
      let compressed = content
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
      
      // Para CSS e JS, remover comentários
      if (filePath.endsWith('.css') || filePath.endsWith('.js')) {
        compressed = compressed
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
      }
      
      fs.writeFileSync(filePath, compressed);
      compressedCount++;
    } catch (error) {
      logWarning(`Erro ao comprimir ${filePath}: ${error.message}`);
    }
  });
  
  logSuccess(`${compressedCount} arquivos de texto comprimidos`);
}

/**
 * Gera arquivos de cache para navegadores
 */
function generateCacheFiles() {
  logHeader('💾 Gerando Arquivos de Cache');
  
  const cacheConfig = {
    'cache.manifest': generateManifest(),
    'robots.txt': generateRobots(),
    'sitemap.xml': generateSitemap()
  };
  
  Object.entries(cacheConfig).forEach(([filename, content]) => {
    const filePath = path.join(config.distDir, filename);
    try {
      fs.writeFileSync(filePath, content);
      logSuccess(`Gerado: ${filename}`);
    } catch (error) {
      logWarning(`Erro ao gerar ${filename}: ${error.message}`);
    }
  });
}

/**
 * Gera manifest para cache offline
 */
function generateManifest() {
  return `CACHE MANIFEST
# MuhlStore v2.0 - Cache Manifest
# Gerado em: ${new Date().toISOString()}

CACHE:
/index.html
/assets/
/uploads/

NETWORK:
*
/api/*

FALLBACK:
/ /index.html`;
}

/**
 * Gera robots.txt otimizado
 */
function generateRobots() {
  return `User-agent: *
Allow: /
Allow: /uploads/
Disallow: /admin/
Disallow: /api/
Disallow: /_internal/

Sitemap: https://muhlstore.re9suainternet.com.br/sitemap.xml`;
}

/**
 * Gera sitemap.xml básico
 */
function generateSitemap() {
  const baseUrl = 'https://muhlstore.re9suainternet.com.br';
  const pages = [
    '/',
    '/loja',
    '/sobre',
    '/eventos',
    '/colecoes',
    '/contato'
  ];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
}

/**
 * Obtém todos os arquivos de um diretório recursivamente
 */
function getAllFiles(dirPath, files = []) {
  if (!dirExists(dirPath)) return files;
  
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  });
  
  return files;
}

/**
 * Calcula estatísticas do build
 */
function calculateBuildStats() {
  logHeader('📊 Estatísticas do Build');
  
  if (!dirExists(config.distDir)) {
    logWarning('Diretório dist não encontrado');
    return;
  }
  
  const files = getAllFiles(config.distDir);
  let totalSize = 0;
  let fileCount = 0;
  const extensions = {};
  
  files.forEach(filePath => {
    const size = getFileSize(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    totalSize += size;
    fileCount++;
    
    extensions[ext] = (extensions[ext] || 0) + size;
  });
  
  log(`Total de arquivos: ${fileCount}`);
  log(`Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Mostrar maiores extensões
  const sortedExtensions = Object.entries(extensions)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  log('\nMaiores tipos de arquivo:');
  sortedExtensions.forEach(([ext, size]) => {
    const percentage = ((size / totalSize) * 100).toFixed(1);
    log(`  ${ext || '(sem extensão)'}: ${(size / 1024 / 1024).toFixed(2)} MB (${percentage}%)`);
  });
}

/**
 * Verifica integridade dos arquivos
 */
function verifyIntegrity() {
  logHeader('✅ Verificando Integridade');
  
  const criticalFiles = [
    'index.html',
    'assets/index.js',
    'assets/index.css'
  ];
  
  let allGood = true;
  
  criticalFiles.forEach(file => {
    const filePath = path.join(config.distDir, file);
    if (fileExists(filePath)) {
      logSuccess(`✓ ${file}`);
    } else {
      logError(`✗ ${file} - Arquivo crítico não encontrado`);
      allGood = false;
    }
  });
  
  if (allGood) {
    logSuccess('Todos os arquivos críticos estão presentes');
  } else {
    logError('Alguns arquivos críticos estão faltando');
  }
}

/**
 * Função principal
 */
function main() {
  printBanner();
  
  try {
    // Executar otimizações
    cleanupUnnecessaryFiles();
    optimizeImages();
    compressTextFiles();
    generateCacheFiles();
    calculateBuildStats();
    verifyIntegrity();
    
    logHeader('🎉 Otimização Concluída!');
    logSuccess('Build otimizado com sucesso');
    logSuccess('Arquivos prontos para produção');
    
  } catch (error) {
    logError(`Erro durante a otimização: ${error.message}`);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  cleanupUnnecessaryFiles,
  optimizeImages,
  compressTextFiles,
  generateCacheFiles,
  calculateBuildStats,
  verifyIntegrity
};
