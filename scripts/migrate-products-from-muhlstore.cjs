#!/usr/bin/env node

/**
 * Script para migrar produtos do banco 'muhlstore' para 'rare_toy_companion'
 * Converte estrutura antiga para nova estrutura
 */

const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  multipleStatements: true
};

async function migrate() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao MySQL...');
    connection = await mysql.createConnection(config);
    
    // 1. Buscar produtos do banco antigo (excluindo produtos de teste)
    console.log('\n1️⃣ Buscando produtos do banco antigo (muhlstore)...');
    const [oldProducts] = await connection.execute(`
      SELECT * FROM muhlstore.produtos 
      WHERE nome NOT LIKE '%Teste%' 
        AND nome NOT LIKE '%teste%'
        AND id NOT IN (30, 31, 32, 33, 34)
    `);
    
    console.log(`   ✅ Encontrados ${oldProducts.length} produtos para migrar`);
    
    if (oldProducts.length === 0) {
      console.log('   ℹ️  Nenhum produto para migrar');
      return;
    }
    
    // 2. Verificar se produtos já existem no banco novo
    console.log('\n2️⃣ Verificando duplicatas...');
    const [existingProducts] = await connection.execute(`
      SELECT nome FROM rare_toy_companion.produtos
    `);
    const existingNames = new Set(existingProducts.map(p => p.nome.toLowerCase()));
    
    // 3. Migrar produtos
    console.log('\n3️⃣ Migrando produtos...\n');
    let migrated = 0;
    let skipped = 0;
    
    for (const oldProduct of oldProducts) {
      // Verificar se já existe
      if (existingNames.has(oldProduct.nome.toLowerCase())) {
        console.log(`   ⚠️  Pulando: "${oldProduct.nome}" (já existe)`);
        skipped++;
        continue;
      }
      
      // Converter estrutura
      const newProduct = {
        id: uuidv4(),
        nome: oldProduct.nome,
        descricao: oldProduct.descricao || null,
        preco: oldProduct.preco,
        imagem_url: oldProduct.imagem_url || null,
        categoria: oldProduct.categoria || 'Outros',
        estoque: oldProduct.estoque || 0,
        status: oldProduct.status === 'inativo' ? 'inativo' : 'ativo',
        destaque: oldProduct.destaque || 0,
        promocao: oldProduct.promocao || 0,
        lancamento: oldProduct.lancamento || 0,
        avaliacao: oldProduct.avaliacao || 0,
        total_avaliacoes: 0,
        faixa_etaria: null,
        peso: null,
        dimensoes: null,
        material: null,
        marca: null,
        origem: null,
        fornecedor: null,
        codigo_barras: oldProduct.codigo_barras || null,
        data_lancamento: null
      };
      
      // Inserir no banco novo
      try {
        await connection.execute(`
          INSERT INTO rare_toy_companion.produtos (
            id, nome, descricao, preco, imagem_url, categoria, estoque,
            status, destaque, promocao, lancamento, avaliacao, total_avaliacoes,
            faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor,
            codigo_barras, data_lancamento
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newProduct.id, newProduct.nome, newProduct.descricao, newProduct.preco,
          newProduct.imagem_url, newProduct.categoria, newProduct.estoque,
          newProduct.status, newProduct.destaque, newProduct.promocao,
          newProduct.lancamento, newProduct.avaliacao, newProduct.total_avaliacoes,
          newProduct.faixa_etaria, newProduct.peso, newProduct.dimensoes,
          newProduct.material, newProduct.marca, newProduct.origem,
          newProduct.fornecedor, newProduct.codigo_barras, newProduct.data_lancamento
        ]);
        
        console.log(`   ✅ Migrado: "${oldProduct.nome}" (${oldProduct.categoria}) - R$ ${oldProduct.preco}`);
        migrated++;
      } catch (error) {
        console.error(`   ❌ Erro ao migrar "${oldProduct.nome}":`, error.message);
      }
    }
    
    // 4. Resumo
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(`   ✅ Produtos migrados: ${migrated}`);
    console.log(`   ⚠️  Produtos pulados (duplicados): ${skipped}`);
    console.log(`   📦 Total processado: ${oldProducts.length}`);
    
    // 5. Verificar total final
    const [finalCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM rare_toy_companion.produtos WHERE status='ativo'
    `);
    console.log(`\n   🎯 Total de produtos ativos agora: ${finalCount[0].total}`);
    
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
migrate()
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('🔄 Reinicie o backend: pm2 restart muhlstore_api\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migração falhou:', error);
    process.exit(1);
  });
