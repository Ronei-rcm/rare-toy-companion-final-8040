const express = require('express');
const router = express.Router();

// Middleware para obter pool de conexão
// IMPORTANTE: Sempre usar rare_toy_companion, mesmo se .env tiver outro valor
const getPool = () => {
  const mysql = require('mysql2/promise');
  return mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: 'rare_toy_companion', // Forçado para garantir banco correto
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

// =============================================================================
// CATEGORIAS FINANCEIRAS
// =============================================================================

// GET /api/financial/categorias - Listar todas as categorias financeiras
router.get('/categorias', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM categorias ORDER BY nome');
    res.json({ success: true, categorias: rows });
  } catch (error) {
    console.error('Erro ao buscar categorias financeiras:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias financeiras', details: error.message });
  }
});

// POST /api/financial/categorias - Criar nova categoria financeira
router.post('/categorias', async (req, res) => {
  try {
    const pool = getPool();
    const { nome, descricao, cor, icone, tipo } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO categorias (nome, descricao, cor, icone, tipo) 
      VALUES (?, ?, ?, ?, ?)
    `, [nome, descricao, cor || '#3B82F6', icone || '📁', tipo || 'ambos']);

    console.log('Categoria financeira criada:', { id: result.insertId, nome });
    res.json({ success: true, message: 'Categoria financeira criada com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar categoria financeira:', error);
    res.status(500).json({ error: 'Erro ao criar categoria financeira', details: error.message });
  }
});

// PUT /api/financial/categorias/:id - Atualizar categoria financeira
router.put('/categorias/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { nome, descricao, cor, icone, tipo } = req.body;

    const [result] = await pool.execute(`
      UPDATE categorias 
      SET nome = ?, descricao = ?, cor = ?, icone = ?, tipo = ?, atualizado_em = NOW()
      WHERE id = ?
    `, [nome, descricao, cor, icone, tipo, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria financeira não encontrada' });
    }

    console.log('Categoria financeira atualizada:', { id, nome });
    res.json({ success: true, message: 'Categoria financeira atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar categoria financeira:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria financeira', details: error.message });
  }
});

// DELETE /api/financial/categorias/:id - Excluir categoria financeira
router.delete('/categorias/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM categorias WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria financeira não encontrada' });
    }

    console.log('Categoria financeira excluída:', { id });
    res.json({ success: true, message: 'Categoria financeira excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir categoria financeira:', error);
    res.status(500).json({ error: 'Erro ao excluir categoria financeira', details: error.message });
  }
});

// =============================================================================
// FORNECEDORES
// =============================================================================

// GET /api/financial/fornecedores - Listar todos os fornecedores
router.get('/fornecedores', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM fornecedores ORDER BY nome');
    res.json({ success: true, fornecedores: rows });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores', details: error.message });
  }
});

// POST /api/financial/fornecedores - Criar novo fornecedor
router.post('/fornecedores', async (req, res) => {
  try {
    const pool = getPool();
    const { nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO fornecedores (nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo || 'outros', status || 'ativo', observacoes]);

    console.log('Fornecedor criado:', { id: result.insertId, nome });
    res.json({ success: true, message: 'Fornecedor criado com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
  }
});

// PUT /api/financial/fornecedores/:id - Atualizar fornecedor
router.put('/fornecedores/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes } = req.body;

    const [result] = await pool.execute(`
      UPDATE fornecedores 
      SET nome = ?, cnpj = ?, email = ?, telefone = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, contato = ?, tipo = ?, status = ?, observacoes = ?, atualizado_em = NOW()
      WHERE id = ?
    `, [nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    console.log('Fornecedor atualizado:', { id, nome });
    res.json({ success: true, message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor', details: error.message });
  }
});

// DELETE /api/financial/fornecedores/:id - Excluir fornecedor
router.delete('/fornecedores/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    console.log('Fornecedor excluído:', { id });
    res.json({ success: true, message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    res.status(500).json({ error: 'Erro ao excluir fornecedor', details: error.message });
  }
});

// =============================================================================
// CLIENTES
// =============================================================================

// GET /api/financial/clientes - Listar todos os clientes
router.get('/clientes', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.execute('SELECT * FROM clientes ORDER BY nome');
    res.json({ success: true, clientes: rows });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error.message });
  }
});

// POST /api/financial/clientes - Criar novo cliente
router.post('/clientes', async (req, res) => {
  try {
    const pool = getPool();
    const { nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO clientes (nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo || 'pessoa_fisica', status || 'ativo', observacoes]);

    console.log('Cliente criado:', { id: result.insertId, nome });
    res.json({ success: true, message: 'Cliente criado com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente', details: error.message });
  }
});

// PUT /api/financial/clientes/:id - Atualizar cliente
router.put('/clientes/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes } = req.body;

    const [result] = await pool.execute(`
      UPDATE clientes 
      SET nome = ?, cpf = ?, email = ?, telefone = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, data_nascimento = ?, tipo = ?, status = ?, observacoes = ?, atualizado_em = NOW()
      WHERE id = ?
    `, [nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    console.log('Cliente atualizado:', { id, nome });
    res.json({ success: true, message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente', details: error.message });
  }
});

// DELETE /api/financial/clientes/:id - Excluir cliente
router.delete('/clientes/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    console.log('Cliente excluído:', { id });
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: 'Erro ao excluir cliente', details: error.message });
  }
});

module.exports = router;
