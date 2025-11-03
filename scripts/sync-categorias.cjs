#!/usr/bin/env node

/**
 * Script de Sincronização de Categorias
 * 
 * Este script sincroniza as categorias dos produtos com a tabela de categorias
 * Cria automaticamente categorias que não existem
 * Atualiza contadores de produtos
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: '127.0.0.1',
  user: 'root',
  password: 'RSM_Rg51gti66',
  database: 'rare_toy_companion',
  port: 3306
};

console.log('🔧 Configuração MySQL:', { ...config, password: '***' });

async function syncCategorias() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('🔄 Iniciando sincronização de categorias...\n');
    
    // Verificar conexão
    const [dbCheck] = await connection.execute('SELECT DATABASE() as db');
    console.log(`🔍 Conectado ao banco: ${dbCheck[0].db}`);
    
    // Listar tabelas disponíveis
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`🔍 Tabelas disponíveis: ${tableNames.length}`);
    console.log(`🔍 Tem categorias? ${tableNames.includes('categorias') ? 'SIM' : 'NÃO'}\n`);
    
    if (!tableNames.includes('categorias')) {
      throw new Error('Tabela categorias não encontrada! Execute a migração primeiro.');
    }
    
    // 1. Buscar categorias únicas dos produtos
    const [categoriasEmProdutos] = await connection.execute(`
      SELECT DISTINCT categoria 
      FROM produtos 
      WHERE categoria IS NOT NULL AND categoria != '' 
      ORDER BY categoria
    `);
    
    console.log(`📦 Categorias encontradas em produtos: ${categoriasEmProdutos.length}`);
    categoriasEmProdutos.forEach(c => console.log(`   - ${c.categoria}`));
    console.log('');
    
    // 2. Buscar categorias existentes na tabela
    const [categoriasExistentes] = await connection.query(`
      SELECT nome FROM categorias
    `);
    
    const nomesExistentes = categoriasExistentes.map(c => c.nome);
    console.log(`📋 Categorias na tabela: ${nomesExistentes.length}`);
    console.log('');
    
    // 3. Criar categorias que não existem
    let criadas = 0;
    for (const cat of categoriasEmProdutos) {
      if (!nomesExistentes.includes(cat.categoria)) {
        const slug = cat.categoria.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        
        await connection.execute(`
          INSERT INTO categorias (nome, slug, descricao, ordem, ativo)
          VALUES (?, ?, ?, ?, TRUE)
        `, [cat.categoria, slug, `Produtos da categoria ${cat.categoria}`, 100 + criadas]);
        
        console.log(`✅ Categoria criada: ${cat.categoria}`);
        criadas++;
      }
    }
    
    if (criadas === 0) {
      console.log('ℹ️  Nenhuma categoria nova precisou ser criada');
    } else {
      console.log(`\n✅ ${criadas} nova(s) categoria(s) criada(s)!`);
    }
    console.log('');
    
    // 4. Atualizar estatísticas de todas as categorias
    console.log('📊 Atualizando estatísticas...');
    const [todasCategorias] = await connection.execute('SELECT id, nome FROM categorias');
    
    for (const cat of todasCategorias) {
      const [stats] = await connection.execute(`
        SELECT 
          COUNT(*) as quantidade,
          MIN(preco) as precoMinimo,
          MAX(preco) as precoMaximo
        FROM produtos
        WHERE categoria = ? AND status = 'ativo'
      `, [cat.nome]);
      
      if (stats[0].quantidade > 0) {
        console.log(`   ${cat.nome}: ${stats[0].quantidade} produto(s)`);
      }
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Sincronização concluída com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Executar
syncCategorias()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });

