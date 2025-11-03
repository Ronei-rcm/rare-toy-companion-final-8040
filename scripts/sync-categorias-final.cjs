const mysql = require('mysql2/promise');

// Configuração do banco
const config = {
  host: 'localhost',
  user: 'root',
  password: 'MuhlStore2025!',
  database: 'rare_toy_companion',
  port: 3306
};

async function syncCategorias() {
  let connection;
  
  try {
    console.log('🔄 Iniciando sincronização final das categorias...\n');
    
    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar produtos sem categoria_id
    const [produtosSemCategoria] = await connection.execute(`
      SELECT id, nome, categoria 
      FROM produtos 
      WHERE categoria_id IS NULL OR categoria_id = 0
    `);
    
    console.log(`\n📊 Produtos sem categoria_id: ${produtosSemCategoria.length}`);
    
    // 2. Atualizar produtos para usar categoria_id
    if (produtosSemCategoria.length > 0) {
      for (const produto of produtosSemCategoria) {
        const [categoria] = await connection.execute(`
          SELECT id FROM categorias 
          WHERE nome = ? AND ativo = 1
        `, [produto.categoria]);
        
        if (categoria.length > 0) {
          await connection.execute(`
            UPDATE produtos 
            SET categoria_id = ? 
            WHERE id = ?
          `, [categoria[0].id, produto.id]);
          console.log(`✅ Produto "${produto.nome}" -> categoria_id: ${categoria[0].id}`);
        } else {
          // Criar categoria se não existir
          const [novaCategoria] = await connection.execute(`
            INSERT INTO categorias (nome, slug, ativo, ordem) 
            VALUES (?, ?, 1, 999)
          `, [produto.categoria, produto.categoria.toLowerCase().replace(/\s+/g, '-')]);
          
          await connection.execute(`
            UPDATE produtos 
            SET categoria_id = ? 
            WHERE id = ?
          `, [novaCategoria.insertId, produto.id]);
          
          console.log(`🆕 Criada categoria "${produto.categoria}" e associada ao produto`);
        }
      }
    }

    // 3. Verificar integridade
    const [produtosIntegridade] = await connection.execute(`
      SELECT 
        p.nome,
        p.categoria,
        p.categoria_id,
        c.nome as categoria_nome
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.id
    `);
    
    console.log('\n📋 Status final dos produtos:');
    console.log('┌─────────────────┬─────────────────┬──────────────┬─────────────────┐');
    console.log('│ Produto         │ Categoria       │ categoria_id │ Categoria Nome  │');
    console.log('├─────────────────┼─────────────────┼──────────────┼─────────────────┤');
    
    for (const produto of produtosIntegridade) {
      const status = produto.categoria_nome ? '✅' : '❌';
      console.log(`│ ${produto.nome.padEnd(15)} │ ${produto.categoria.padEnd(15)} │ ${produto.categoria_id?.toString().padEnd(12)} │ ${(produto.categoria_nome || 'ERRO').padEnd(15)} │`);
    }
    console.log('└─────────────────┴─────────────────┴──────────────┴─────────────────┘');

    // 4. Estatísticas finais
    const [stats] = await connection.execute(`
      SELECT 
        'Total Produtos' as tipo,
        COUNT(*) as total
      FROM produtos
      UNION ALL
      SELECT 
        'Produtos com categoria_id' as tipo,
        COUNT(*) as total
      FROM produtos 
      WHERE categoria_id IS NOT NULL AND categoria_id > 0
      UNION ALL
      SELECT 
        'Total Categorias Ativas' as tipo,
        COUNT(*) as total
      FROM categorias 
      WHERE ativo = 1
    `);
    
    console.log('\n📊 Estatísticas Finais:');
    for (const stat of stats) {
      console.log(`   ${stat.tipo}: ${stat.total}`);
    }

    console.log('\n✅ Sincronização finalizada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão encerrada');
    }
  }
}

// Executar sincronização
syncCategorias();
