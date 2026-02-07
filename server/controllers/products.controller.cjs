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
  console.log('🔍 [DEBUG] getAll called, query:', req.query);
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
    console.log('🔍 [DEBUG] Calling productsService.findAll with filters:', filters, 'pagination:', pagination);
    const result = await productsService.findAll(filters, pagination, sort);
    console.log('🔍 [DEBUG] productsService.findAll returned, result type:', Array.isArray(result) ? 'array' : 'object');

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
    console.error('❌ [DEBUG] Erro ao buscar produtos:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
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

/**
 * Cria um novo produto
 * POST /api/produtos
 */
async function create(req, res) {
  try {
    const produtoData = req.body;
    console.log('🔄 Criando produto:', produtoData.nome);

    const result = await productsService.create(produtoData);

    // Invalidar cache
    await cacheHelpers.invalidateProductsCache();
    await cacheHelpers.invalidateCategoriesCache();

    console.log('✅ Produto criado com ID:', result.id);
    return res.status(201).json({ id: result.id, ...produtoData });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    if (error.message === 'Nenhuma categoria disponível') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Atualiza um produto existente
 * PUT /api/produtos/:id
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const produtoData = req.body;
    console.log(`🔄 Atualizando produto ID: ${id}`);

    const produto = await productsService.update(id, produtoData);

    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Converter snake_case para camelCase
    const produtoFormatado = {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: parseFloat(produto.preco),
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : produto.imagemUrl,
      categoria: produto.categoria,
      estoque: produto.estoque,
      status: produto.status,
      destaque: Boolean(produto.destaque),
      promocao: Boolean(produto.promocao),
      lancamento: Boolean(produto.lancamento),
      avaliacao: parseFloat(produto.avaliacao) || 0,
      totalAvaliacoes: produto.totalAvaliacoes || 0,
      faixaEtaria: produto.faixaEtaria,
      peso: produto.peso,
      dimensoes: produto.dimensoes,
      material: produto.material,
      marca: produto.marca,
      origem: produto.origem,
      fornecedor: produto.fornecedor,
      codigoBarras: produto.codigoBarras,
      dataLancamento: produto.dataLancamento,
      createdAt: produto.createdAt,
      updatedAt: produto.updatedAt
    };

    // Invalidar cache
    await cacheHelpers.invalidateProductCache(id);
    await cacheHelpers.invalidateProductsCache();

    console.log('✅ Produto atualizado com sucesso');
    return res.json(produtoFormatado);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    if (error.message === 'Nenhum campo para atualizar') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Deleta um produto
 * DELETE /api/produtos/:id
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando produto ID: ${id}`);

    const deleted = await productsService.remove(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Invalidar cache
    await cacheHelpers.invalidateProductCache(id);
    await cacheHelpers.invalidateProductsCache();

    console.log('✅ Produto deletado');
    return res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Cria um produto rapidamente (quick-add)
 * POST /api/produtos/quick-add
 */
async function quickCreate(req, res) {
  try {
    const { nome, preco, estoque, categoria, status } = req.body;
    console.log('⚡ Cadastro rápido:', nome);

    // URL da imagem (se enviou arquivo)
    let imagemUrl = null;
    if (req.file) {
      imagemUrl = `/lovable-uploads/${req.file.filename}`;
      console.log('📸 Foto capturada:', imagemUrl);
    }

    const produtoData = { nome, preco, estoque, categoria, status };
    const result = await productsService.quickCreate(produtoData, imagemUrl);

    // Invalidar cache
    await cacheHelpers.invalidateProductsCache();
    await cacheHelpers.invalidateCategoriesCache();

    return res.json({
      success: true,
      id: result.id,
      message: status === 'rascunho' ? 'Rascunho salvo! Complete depois.' : 'Produto cadastrado com sucesso!',
      produto: { id: result.id, nome, preco, categoria, status }
    });
  } catch (error) {
    console.error('❌ Erro no quick-add:', error);
    return res.status(500).json({
      error: 'Erro ao cadastrar produto rapidamente',
      details: error.message
    });
  }
}

/**
 * Cria um produto rapidamente (quick-add-test - sem upload)
 * POST /api/produtos/quick-add-test
 */
async function quickCreateTest(req, res) {
  try {
    const { nome, preco, estoque, categoria, status } = req.body;
    console.log('⚡ Cadastro rápido (teste):', nome);

    const produtoData = { nome, preco, estoque, categoria, status };
    const result = await productsService.quickCreate(produtoData, null);

    return res.json({
      success: true,
      id: result.id,
      message: 'Produto cadastrado (teste)'
    });
  } catch (error) {
    console.error('❌ Erro no quick-add-test:', error);
    return res.status(500).json({
      error: 'Erro ao cadastrar produto (teste)',
      details: error.message
    });
  }
}

module.exports = {
  getAll,
  getById,
  getFeatured,
  getByCategory,
  create,
  update,
  remove,
  quickCreate,
  quickCreateTest
};
