/**
 * Products Service
 * 
 * Service layer para produtos - contém lógica de negócio e acesso ao banco
 */

const pool = require('../database/pool.cjs');

/**
 * Busca produtos com filtros opcionais e paginação
 * 
 * @param {Object} filters - Filtros (search, categoria, inStock, onSale, featured, novo)
 * @param {Object} pagination - Paginação (page, pageSize)
 * @param {Object} sort - Ordenação
 * @returns {Promise<Object>} { items, total, page, pageSize } ou array
 */
async function findAll(filters = {}, pagination = {}, sort = 'created_at_desc') {
  try {
    const whereParts = [];
    const params = [];

    // Filtros
    if (filters.search) {
      whereParts.push('(LOWER(nome) LIKE ? OR LOWER(categoria) LIKE ? OR LOWER(descricao) LIKE ?)');
      const s = `%${String(filters.search).toLowerCase()}%`;
      params.push(s, s, s);
    }
    
    if (filters.categoria) {
      whereParts.push('categoria = ?');
      params.push(String(filters.categoria));
    }
    
    if (filters.inStock === 'true') {
      whereParts.push('estoque > 0');
    }
    
    if (filters.onSale === 'true') {
      whereParts.push('promocao = 1');
    }
    
    if (filters.featured === 'true') {
      whereParts.push('destaque = 1');
    }
    
    if (filters.novo === 'true') {
      whereParts.push('lancamento = 1');
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Ordenação segura (whitelist)
    const sortMap = {
      created_at_desc: 'created_at DESC',
      created_at_asc: 'created_at ASC',
      nome_asc: 'nome ASC',
      nome_desc: 'nome DESC',
      preco_asc: 'preco ASC',
      preco_desc: 'preco DESC',
    };
    const orderBy = sortMap[String(sort)] || sortMap.created_at_desc;

    // Query base
    const baseQuery = `
      SELECT id, nome, descricao, preco, imagem_url as imagemUrl, categoria, estoque,
             status, destaque, promocao, lancamento, avaliacao, total_avaliacoes as totalAvaliacoes,
             faixa_etaria as faixaEtaria, peso, dimensoes, material, marca, origem, fornecedor,
             codigo_barras as codigoBarras, data_lancamento as dataLancamento, 
             created_at as createdAt, updated_at as updatedAt
      FROM produtos ${whereSql}
      ORDER BY ${orderBy}
    `;

    // Caso sem paginação: retorna array direto
    if (!pagination.page || !pagination.pageSize) {
      const [rows] = await pool.execute(baseQuery, params);
      return rows;
    }

    // Com paginação: retorna objeto com items, total, page, pageSize
    const page = Math.max(parseInt(pagination.page, 10) || 0, 0);
    const pageSize = Math.min(Math.max(parseInt(pagination.pageSize, 10) || 0, 1), 100);
    
    // Total
    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM produtos ${whereSql}`, params);
    const total = Number(countRows?.[0]?.total || 0);

    // Página
    const offset = Math.max(0, (page - 1) * pageSize);
    const limitInt = parseInt(String(pageSize), 10);
    const offsetInt = parseInt(String(offset), 10);
    
    const [rows] = await pool.execute(
      `${baseQuery} LIMIT ${limitInt} OFFSET ${offsetInt}`,
      params
    );

    return {
      items: rows,
      total,
      page,
      pageSize
    };
  } catch (error) {
    console.error('Erro no service findAll:', error);
    throw error;
  }
}

/**
 * Busca um produto por ID
 * 
 * @param {number|string} id - ID do produto
 * @returns {Promise<Object|null>} Produto encontrado ou null
 */
async function findById(id) {
  try {
    const query = `
      SELECT *, imagem_url as imagemUrl, total_avaliacoes as totalAvaliacoes, 
             faixa_etaria as faixaEtaria, codigo_barras as codigoBarras, 
             data_lancamento as dataLancamento, created_at as createdAt, 
             updated_at as updatedAt 
      FROM produtos 
      WHERE id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Erro no service findById:', error);
    throw error;
  }
}

/**
 * Busca produtos em destaque
 * 
 * @returns {Promise<Array>} Lista de produtos em destaque
 */
async function findFeatured() {
  try {
    const query = `
      SELECT *, imagem_url as imagemUrl, total_avaliacoes as totalAvaliacoes, 
             faixa_etaria as faixaEtaria, codigo_barras as codigoBarras, 
             data_lancamento as dataLancamento, created_at as createdAt, 
             updated_at as updatedAt 
      FROM produtos 
      WHERE destaque = true 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  } catch (error) {
    console.error('Erro no service findFeatured:', error);
    throw error;
  }
}

/**
 * Busca produtos por categoria
 * 
 * @param {string} categoria - Nome ou slug da categoria
 * @returns {Promise<Array>} Lista de produtos da categoria
 */
async function findByCategory(categoria) {
  try {
    // Primeiro tentar buscar por slug, depois por nome
    const query = `
      SELECT p.*, p.imagem_url as imagemUrl, p.total_avaliacoes as totalAvaliacoes, 
             p.faixa_etaria as faixaEtaria, p.codigo_barras as codigoBarras, 
             p.data_lancamento as dataLancamento, p.created_at as createdAt, 
             p.updated_at as updatedAt 
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria = c.nome OR p.categoria = c.slug
      WHERE (c.slug = ? OR c.nome = ? OR p.categoria = ?)
      ORDER BY p.created_at DESC
    `;
    const [rows] = await pool.execute(query, [categoria, categoria, categoria]);
    return rows;
  } catch (error) {
    console.error('Erro no service findByCategory:', error);
    throw error;
  }
}

/**
 * Cria um novo produto
 * 
 * @param {Object} produtoData - Dados do produto
 * @returns {Promise<Object>} Produto criado com ID
 */
async function create(produtoData) {
  try {
    const crypto = require('crypto');
    
    // Buscar categoria_id pelo nome
    let categoria_id = null;
    if (produtoData.categoria) {
      const [catRows] = await pool.execute(
        'SELECT id FROM `rare_toy_companion`.`categorias` WHERE nome = ? OR slug = ? LIMIT 1',
        [produtoData.categoria, produtoData.categoria]
      );
      if (catRows.length > 0) {
        categoria_id = catRows[0].id;
      }
    }
    
    // Se não encontrou, usa a primeira categoria disponível
    if (!categoria_id) {
      const [firstCat] = await pool.execute(
        'SELECT id FROM `rare_toy_companion`.`categorias` WHERE ativo = 1 ORDER BY ordem LIMIT 1'
      );
      if (firstCat.length > 0) {
        categoria_id = firstCat[0].id;
      } else {
        throw new Error('Nenhuma categoria disponível');
      }
    }
    
    // Criar produto com campos obrigatórios
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Verificar banco atual
      const [dbCheck] = await connection.query('SELECT DATABASE() as current_db');
      const currentDb = dbCheck[0]?.current_db;
      
      // Forçar uso do banco correto
      if (currentDb !== 'rare_toy_companion') {
        await connection.query('USE `rare_toy_companion`');
      }
      
      const id = crypto.randomUUID();
      const [result] = await connection.execute(`
        INSERT INTO produtos (
          id, nome, preco, categoria, categoria_id, imagem_url, descricao, estoque, status,
          destaque, promocao, lancamento, avaliacao, total_avaliacoes,
          faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor,
          codigo_barras, data_lancamento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        produtoData.nome,
        produtoData.preco,
        produtoData.categoria,
        categoria_id,
        produtoData.imagemUrl || null,
        produtoData.descricao || null,
        produtoData.estoque || 0,
        produtoData.status || 'ativo',
        produtoData.destaque || false,
        produtoData.promocao || false,
        produtoData.lancamento || false,
        produtoData.avaliacao || 0,
        produtoData.totalAvaliacoes || 0,
        produtoData.faixaEtaria || null,
        produtoData.peso || null,
        produtoData.dimensoes || null,
        produtoData.material || null,
        produtoData.marca || null,
        produtoData.origem || null,
        produtoData.fornecedor || null,
        produtoData.codigoBarras || null,
        produtoData.dataLancamento || null
      ]);
      
      connection.release();
      
      return { id, insertId: result.insertId || id };
    } catch (insertError) {
      if (connection) connection.release();
      console.error('Erro ao inserir produto:', insertError);
      throw insertError;
    }
  } catch (error) {
    console.error('Erro no service create:', error);
    throw error;
  }
}

/**
 * Atualiza um produto existente
 * 
 * @param {string} id - ID do produto
 * @param {Object} produtoData - Dados a serem atualizados
 * @returns {Promise<Object|null>} Produto atualizado ou null se não encontrado
 */
async function update(id, produtoData) {
  try {
    // Construir query dinamicamente baseado nos campos enviados
    const fields = [];
    const values = [];
    
    // Mapear campos do camelCase para snake_case
    const fieldMap = {
      nome: 'nome',
      descricao: 'descricao',
      preco: 'preco',
      imagemUrl: 'imagem_url',
      categoria: 'categoria',
      estoque: 'estoque',
      status: 'status',
      destaque: 'destaque',
      promocao: 'promocao',
      lancamento: 'lancamento',
      avaliacao: 'avaliacao',
      totalAvaliacoes: 'total_avaliacoes',
      faixaEtaria: 'faixa_etaria',
      peso: 'peso',
      dimensoes: 'dimensoes',
      material: 'material',
      marca: 'marca',
      origem: 'origem',
      fornecedor: 'fornecedor',
      codigoBarras: 'codigo_barras',
      dataLancamento: 'data_lancamento'
    };
    
    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (produtoData[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(produtoData[key]);
      }
    }
    
    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }
    
    // Adicionar updated_at
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(query, values);
    
    if (result.affectedRows === 0) {
      return null;
    }
    
    // Buscar o produto atualizado completo
    return await findById(id);
  } catch (error) {
    console.error('Erro no service update:', error);
    throw error;
  }
}

/**
 * Deleta um produto
 * 
 * @param {string} id - ID do produto
 * @returns {Promise<boolean>} true se deletado, false se não encontrado
 */
async function remove(id) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM produtos WHERE id = ?',
      [id]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erro no service remove:', error);
    throw error;
  }
}

/**
 * Cria um produto rapidamente (quick-add)
 * 
 * @param {Object} produtoData - Dados básicos do produto
 * @param {string|null} imagemUrl - URL da imagem (opcional)
 * @returns {Promise<Object>} Produto criado com ID
 */
async function quickCreate(produtoData, imagemUrl = null) {
  try {
    const crypto = require('crypto');
    const id = crypto.randomUUID();
    
    // Buscar categoria_id
    let categoria_id = null;
    if (produtoData.categoria) {
      const [catRows] = await pool.execute(
        'SELECT id FROM `rare_toy_companion`.`categorias` WHERE nome = ? OR slug = ? LIMIT 1',
        [produtoData.categoria, produtoData.categoria]
      );
      if (catRows.length > 0) {
        categoria_id = catRows[0].id;
      }
    }
    
    if (!categoria_id) {
      const [firstCat] = await pool.execute(
        'SELECT id, nome FROM `rare_toy_companion`.`categorias` WHERE ativo = 1 ORDER BY ordem LIMIT 1'
      );
      if (firstCat.length > 0) {
        categoria_id = firstCat[0].id;
      } else {
        // Tentar qualquer categoria
        const [anyCat] = await pool.execute(
          'SELECT id, nome FROM `rare_toy_companion`.`categorias` ORDER BY id LIMIT 1'
        );
        if (anyCat.length > 0) {
          categoria_id = anyCat[0].id;
        } else {
          throw new Error('Nenhuma categoria disponível no banco de dados');
        }
      }
    }
    
    // Inserir produto com campos mínimos
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Forçar uso do banco correto
      const [dbCheck] = await connection.query('SELECT DATABASE() as current_db');
      const currentDb = dbCheck[0]?.current_db;
      if (currentDb !== 'rare_toy_companion') {
        await connection.query('USE `rare_toy_companion`');
      }
      
      // Tentar inserir SEM categoria_id primeiro, depois COM categoria_id se falhar
      let result;
      try {
        result = await connection.query(`
          INSERT INTO produtos (
            id, nome, preco, categoria, imagem_url, estoque, status,
            destaque, promocao, lancamento
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          produtoData.nome,
          Number(produtoData.preco || 0),
          produtoData.categoria || 'Outros',
          imagemUrl,
          Number(produtoData.estoque || 1),
          produtoData.status || 'ativo',
          false,
          false,
          false
        ]);
      } catch (errorWithoutCat) {
        // Se falhar, tentar COM categoria_id
        result = await connection.query(`
          INSERT INTO produtos (
            id, nome, preco, categoria, categoria_id, imagem_url, estoque, status,
            destaque, promocao, lancamento
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id,
          produtoData.nome,
          Number(produtoData.preco || 0),
          produtoData.categoria || 'Outros',
          categoria_id,
          imagemUrl,
          Number(produtoData.estoque || 1),
          produtoData.status || 'ativo',
          false,
          false,
          false
        ]);
      }
      
      connection.release();
      return { id, success: true };
    } catch (insertError) {
      if (connection) connection.release();
      console.error('Erro ao inserir produto (quick-add):', insertError);
      throw insertError;
    }
  } catch (error) {
    console.error('Erro no service quickCreate:', error);
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  findFeatured,
  findByCategory,
  create,
  update,
  remove,
  quickCreate
};
