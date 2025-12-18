/**
 * Products Controller
 * 
 * Controller layer para produtos - validação, transformação e respostas HTTP
 */

const productsService = require('../services/products.service.cjs');
const { getPublicUrl } = require('../utils/helpers.cjs');
const cacheHelpers = require('../utils/cacheHelpers.cjs');

/**
 * Lista produtos com filtros e paginação
 * GET /api/produtos
 */
async function getAll(req, res) {
  try {
    const {
      page: pageRaw,
      pageSize: pageSizeRaw,
      search = '',
      categoria = '',
      sort = 'created_at_desc',
      inStock,
      onSale,
      featured,
      novo
    } = req.query || {};

    const page = Math.max(parseInt(pageRaw, 10) || 0, 0);
    const pageSize = Math.min(Math.max(parseInt(pageSizeRaw, 10) || 0, 1), 100);

    const filters = {
      search,
      categoria,
      inStock,
      onSale,
      featured,
      novo
    };

    const pagination = { page, pageSize };
    const result = await productsService.findAll(filters, pagination, sort);

    // Transformar resultados (parseFloat para preços, URLs de imagem)
    const transformProduct = (p) => ({
      ...p,
      preco: parseFloat(p.preco),
      avaliacao: p.avaliacao ? parseFloat(p.avaliacao) : null,
      imagemUrl: p.imagemUrl ? getPublicUrl(req, p.imagemUrl) : null,
    });

    // Caso sem paginação: retorna array
    if (Array.isArray(result)) {
      const produtos = result.map(transformProduct);
      return res.json(produtos);
    }

    // Caso com paginação: retorna objeto
    const itens = result.items.map(transformProduct);
    return res.json({ items: itens, total: result.total, page: result.page, pageSize: result.pageSize });
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Busca produto por ID
 * GET /api/produtos/:id
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    
    // Tentar cache primeiro
    const cached = await cacheHelpers.getCachedProduct(id);
    if (cached) {
      console.log(`✅ Produto ${id} do cache`);
      return res.json(cached);
    }
    
    console.log(`🔄 Buscando produto ID: ${id}`);
    
    const produto = await productsService.findById(id);
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log('✅ Produto encontrado:', produto.nome);
    
    // Transformar resultado
    const produtoFormatado = {
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    };
    
    // Cachear resultado
    await cacheHelpers.setCachedProduct(id, produtoFormatado);
    
    return res.json(produtoFormatado);
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Busca produtos em destaque
 * GET /api/produtos/destaque
 */
async function getFeatured(req, res) {
  try {
    console.log('🔄 Buscando produtos em destaque...');
    
    const produtos = await productsService.findFeatured();
    
    const produtosFormatados = produtos.map((produto) => ({
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    }));
    
    console.log(`✅ ${produtosFormatados.length} produtos em destaque encontrados`);
    return res.json(produtosFormatados);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos em destaque:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Busca produtos por categoria
 * GET /api/produtos/categoria/:categoria
 */
async function getByCategory(req, res) {
  try {
    const { categoria } = req.params;
    console.log(`🔄 Buscando produtos da categoria: ${categoria}`);
    
    const produtos = await productsService.findByCategory(categoria);
    
    const produtosFormatados = produtos.map((produto) => ({
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    }));
    
    console.log(`✅ ${produtosFormatados.length} produtos encontrados na categoria ${categoria}`);
    return res.json(produtosFormatados);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos por categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = {
  getAll,
  getById,
  getFeatured,
  getByCategory
};
