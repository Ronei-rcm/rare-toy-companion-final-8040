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

module.exports = {
  findAll,
  findById,
  findFeatured,
  findByCategory
};
