/**
 * Template para Criar Novos Controllers
 * 
 * Este é um template que pode ser usado como base para criar novos controllers
 * após a refatoração do server.cjs
 * 
 * Como usar:
 * 1. Copiar este arquivo para o nome do seu controller (ex: products.controller.cjs)
 * 2. Substituir [RESOURCE] pelo nome do recurso
 * 3. Implementar métodos que chamam os services
 * 4. Exportar os métodos
 */

// Importar services
const [RESOURCE]Service = require('../services/[resource].service.cjs');

// Importar pool do banco (se necessário)
const { getPool } = require('../../src/integrations/mysql/client');

/**
 * Lista todos os recursos
 */
async function getAll(req, res) {
  try {
    const pool = getPool();
    const filters = req.query; // pegar filtros da query string
    
    const [resources] = await [RESOURCE]Service.findAll(pool, filters);
    
    return res.status(200).json({
      success: true,
      data: [resources],
      count: [resources].length
    });
  } catch (error) {
    console.error('Erro no controller getAll:', error);
    throw error;
  }
}

/**
 * Busca um recurso por ID
 */
async function getById(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    const [resource] = await [RESOURCE]Service.findById(pool, id);
    
    if (![resource] || [resource].length === 0) {
      return res.status(404).json({
        success: false,
        error: '[Resource] não encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: [resource][0]
    });
  } catch (error) {
    console.error('Erro no controller getById:', error);
    throw error;
  }
}

/**
 * Cria um novo recurso
 */
async function create(req, res) {
  try {
    const pool = getPool();
    const data = req.body;
    
    // Validações básicas
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
    }
    
    const result = await [RESOURCE]Service.create(pool, data);
    
    return res.status(201).json({
      success: true,
      data: result,
      message: '[Resource] criado com sucesso'
    });
  } catch (error) {
    console.error('Erro no controller create:', error);
    throw error;
  }
}

/**
 * Atualiza um recurso
 */
async function update(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;
    const data = req.body;
    
    // Verificar se existe
    const [existing] = await [RESOURCE]Service.findById(pool, id);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '[Resource] não encontrado'
      });
    }
    
    const result = await [RESOURCE]Service.update(pool, id, data);
    
    return res.status(200).json({
      success: true,
      data: result,
      message: '[Resource] atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no controller update:', error);
    throw error;
  }
}

/**
 * Deleta um recurso
 */
async function delete(req, res) {
  try {
    const pool = getPool();
    const { id } = req.params;
    
    // Verificar se existe
    const [existing] = await [RESOURCE]Service.findById(pool, id);
    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: '[Resource] não encontrado'
      });
    }
    
    await [RESOURCE]Service.delete(pool, id);
    
    return res.status(200).json({
      success: true,
      message: '[Resource] deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro no controller delete:', error);
    throw error;
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete
};
