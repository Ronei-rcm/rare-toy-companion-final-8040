/**
 * Template para Criar Novas Rotas
 * 
 * Este é um template que pode ser usado como base para criar novas rotas
 * após a refatoração do server.cjs
 * 
 * Como usar:
 * 1. Copiar este arquivo para o nome da sua rota (ex: products.routes.cjs)
 * 2. Substituir [RESOURCE] pelo nome do recurso
 * 3. Adicionar suas rotas específicas
 * 4. Exportar o router
 */

const express = require('express');
const router = express.Router();

// Importar controller
const [RESOURCE]Controller = require('../controllers/[resource].controller.cjs');

// Importar middleware
const { authenticateAdmin } = require('../middleware/auth.cjs');
const { generalLimiter } = require('../../config/security.cjs');

/**
 * GET /api/[resource]
 * Lista todos os recursos
 */
router.get('/', generalLimiter, async (req, res) => {
  try {
    const result = await [RESOURCE]Controller.getAll(req, res);
    return result;
  } catch (error) {
    console.error('Erro ao listar [resource]:', error);
    return res.status(500).json({ 
      error: 'Erro ao listar [resource]',
      message: error.message 
    });
  }
});

/**
 * GET /api/[resource]/:id
 * Busca um recurso por ID
 */
router.get('/:id', generalLimiter, async (req, res) => {
  try {
    const result = await [RESOURCE]Controller.getById(req, res);
    return result;
  } catch (error) {
    console.error('Erro ao buscar [resource]:', error);
    return res.status(500).json({ 
      error: 'Erro ao buscar [resource]',
      message: error.message 
    });
  }
});

/**
 * POST /api/[resource]
 * Cria um novo recurso (Admin only)
 */
router.post('/', generalLimiter, authenticateAdmin, async (req, res) => {
  try {
    const result = await [RESOURCE]Controller.create(req, res);
    return result;
  } catch (error) {
    console.error('Erro ao criar [resource]:', error);
    return res.status(500).json({ 
      error: 'Erro ao criar [resource]',
      message: error.message 
    });
  }
});

/**
 * PUT /api/[resource]/:id
 * Atualiza um recurso (Admin only)
 */
router.put('/:id', generalLimiter, authenticateAdmin, async (req, res) => {
  try {
    const result = await [RESOURCE]Controller.update(req, res);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar [resource]:', error);
    return res.status(500).json({ 
      error: 'Erro ao atualizar [resource]',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/[resource]/:id
 * Deleta um recurso (Admin only)
 */
router.delete('/:id', generalLimiter, authenticateAdmin, async (req, res) => {
  try {
    const result = await [RESOURCE]Controller.delete(req, res);
    return result;
  } catch (error) {
    console.error('Erro ao deletar [resource]:', error);
    return res.status(500).json({ 
      error: 'Erro ao deletar [resource]',
      message: error.message 
    });
  }
});

module.exports = router;
