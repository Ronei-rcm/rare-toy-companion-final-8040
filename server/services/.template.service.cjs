/**
 * Template para Criar Novos Services
 * 
 * Este é um template que pode ser usado como base para criar novos services
 * após a refatoração do server.cjs
 * 
 * Services contêm a lógica de negócio e acesso ao banco de dados
 * 
 * Como usar:
 * 1. Copiar este arquivo para o nome do seu service (ex: products.service.cjs)
 * 2. Substituir [RESOURCE] pelo nome do recurso
 * 3. Implementar métodos de acesso ao banco
 * 4. Exportar os métodos
 */

/**
 * Busca todos os recursos com filtros opcionais
 * 
 * @param {Object} pool - Pool de conexão MySQL
 * @param {Object} filters - Filtros opcionais
 * @returns {Promise<Array>} Lista de recursos
 */
async function findAll(pool, filters = {}) {
  try {
    let query = 'SELECT * FROM [table_name] WHERE 1=1';
    const params = [];
    
    // Adicionar filtros dinâmicos
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    if (filters.search) {
      query += ' AND (nome LIKE ? OR descricao LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    // Ordenação
    query += ' ORDER BY created_at DESC';
    
    // Paginação
    const limit = parseInt(filters.limit) || 20;
    const offset = parseInt(filters.offset) || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [results] = await pool.execute(query, params);
    return [results];
  } catch (error) {
    console.error('Erro no service findAll:', error);
    throw error;
  }
}

/**
 * Busca um recurso por ID
 * 
 * @param {Object} pool - Pool de conexão MySQL
 * @param {number|string} id - ID do recurso
 * @returns {Promise<Array>} Recurso encontrado
 */
async function findById(pool, id) {
  try {
    const query = 'SELECT * FROM [table_name] WHERE id = ?';
    const [results] = await pool.execute(query, [id]);
    return [results];
  } catch (error) {
    console.error('Erro no service findById:', error);
    throw error;
  }
}

/**
 * Cria um novo recurso
 * 
 * @param {Object} pool - Pool de conexão MySQL
 * @param {Object} data - Dados do recurso
 * @returns {Promise<Object>} Recurso criado
 */
async function create(pool, data) {
  try {
    const query = `
      INSERT INTO [table_name] 
      (nome, descricao, status, created_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      data.nome,
      data.descricao || null,
      data.status || 'ativo'
    ];
    
    const [result] = await pool.execute(query, params);
    
    // Buscar recurso criado
    const [created] = await findById(pool, result.insertId);
    return created[0];
  } catch (error) {
    console.error('Erro no service create:', error);
    throw error;
  }
}

/**
 * Atualiza um recurso
 * 
 * @param {Object} pool - Pool de conexão MySQL
 * @param {number|string} id - ID do recurso
 * @param {Object} data - Dados para atualizar
 * @returns {Promise<Object>} Recurso atualizado
 */
async function update(pool, id, data) {
  try {
    const fields = [];
    const params = [];
    
    if (data.nome !== undefined) {
      fields.push('nome = ?');
      params.push(data.nome);
    }
    
    if (data.descricao !== undefined) {
      fields.push('descricao = ?');
      params.push(data.descricao);
    }
    
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    
    fields.push('updated_at = NOW()');
    params.push(id);
    
    const query = `
      UPDATE [table_name] 
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    
    await pool.execute(query, params);
    
    // Buscar recurso atualizado
    const [updated] = await findById(pool, id);
    return updated[0];
  } catch (error) {
    console.error('Erro no service update:', error);
    throw error;
  }
}

/**
 * Deleta um recurso
 * 
 * @param {Object} pool - Pool de conexão MySQL
 * @param {number|string} id - ID do recurso
 * @returns {Promise<void>}
 */
async function delete(pool, id) {
  try {
    // Soft delete (recomendado)
    const query = `
      UPDATE [table_name] 
      SET status = 'deleted', updated_at = NOW()
      WHERE id = ?
    `;
    
    // Ou hard delete:
    // const query = 'DELETE FROM [table_name] WHERE id = ?';
    
    await pool.execute(query, [id]);
  } catch (error) {
    console.error('Erro no service delete:', error);
    throw error;
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  delete
};
