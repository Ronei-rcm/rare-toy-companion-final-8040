/**
 * Products Routes
 * 
 * Rotas para produtos - endpoints da API de produtos
 */

const express = require('express');
const router = express.Router();

// Importar controller
const productsController = require('../controllers/products.controller.cjs');

// Importar middlewares
const { productsLimiter } = require('../../config/security.cjs');
const redisCache = require('../../config/redisCache.cjs');
const { upload } = require('../config/upload.cjs');

// Cache de produtos (1 minuto)
const productsCacheMiddleware = redisCache.cacheMiddleware(60);

/**
 * GET /api/produtos
 * Lista produtos com filtros e paginação
 */
router.get('/', productsLimiter, productsCacheMiddleware, async (req, res) => {
  try {
    return await productsController.getAll(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/produtos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/produtos/destaque
 * Lista produtos em destaque
 */
router.get('/destaque', async (req, res) => {
  try {
    return await productsController.getFeatured(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/produtos/destaque:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/produtos/categoria/:categoria
 * Lista produtos por categoria
 */
router.get('/categoria/:categoria', async (req, res) => {
  try {
    return await productsController.getByCategory(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/produtos/categoria/:categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/produtos/:id
 * Busca produto por ID
 */
router.get('/:id', async (req, res) => {
  try {
    return await productsController.getById(req, res);
  } catch (error) {
    console.error('Erro na rota GET /api/produtos/:id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/produtos/quick-add-test
 * Cria produto rapidamente (teste, sem upload)
 */
router.post('/quick-add-test', async (req, res) => {
  try {
    return await productsController.quickCreateTest(req, res);
  } catch (error) {
    console.error('Erro na rota POST /api/produtos/quick-add-test:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/produtos/quick-add
 * Cria produto rapidamente com upload opcional de imagem
 */
router.post('/quick-add', (req, res, next) => {
  // Middleware antes do multer para logs
  next();
}, upload.single('imagem'), (err, req, res, next) => {
  // Error handler do multer
  if (err) {
    console.error('❌ Erro no multer:', err);
    return res.status(400).json({ error: 'Erro no upload', details: err.message });
  }
  next();
}, async (req, res) => {
  try {
    return await productsController.quickCreate(req, res);
  } catch (error) {
    console.error('Erro na rota POST /api/produtos/quick-add:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/produtos
 * Cria um novo produto completo
 */
router.post('/', async (req, res) => {
  try {
    return await productsController.create(req, res);
  } catch (error) {
    console.error('Erro na rota POST /api/produtos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * PUT /api/produtos/:id
 * Atualiza um produto existente
 */
router.put('/:id', async (req, res) => {
  try {
    return await productsController.update(req, res);
  } catch (error) {
    console.error('Erro na rota PUT /api/produtos/:id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/produtos/:id
 * Deleta um produto
 */
router.delete('/:id', async (req, res) => {
  try {
    return await productsController.remove(req, res);
  } catch (error) {
    console.error('Erro na rota DELETE /api/produtos/:id:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
