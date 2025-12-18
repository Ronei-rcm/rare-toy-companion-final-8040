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

module.exports = router;
