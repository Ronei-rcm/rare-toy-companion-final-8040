const express = require('express');
const router = express.Router();

/**
 * Rotas de produtos
 */
router.get('/api/products', async (req, res) => {
  // Implementação das rotas de produtos
  res.json({ message: 'Produtos endpoint' });
});

router.get('/api/products/:id', async (req, res) => {
  // Implementação da rota de produto específico
  res.json({ message: 'Produto específico' });
});

module.exports = router;