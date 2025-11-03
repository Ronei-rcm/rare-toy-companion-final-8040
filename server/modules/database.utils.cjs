const mysql = require('mysql2/promise');

/**
 * Utilitários de banco de dados
 */
class DatabaseService {
  constructor(pool) {
    this.pool = pool;
  }

  async getProduct(id) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM produtos WHERE id = ?', 
      [id]
    );
    return rows[0];
  }

  async getProducts(categoryId = null) {
    let query = 'SELECT * FROM produtos WHERE status = "ativo"';
    let params = [];
    
    if (categoryId) {
      query += ' AND categoria_id = ?';
      params.push(categoryId);
    }
    
    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async createCart(userId) {
    const cartId = require('crypto').randomUUID();
    await this.pool.execute(
      'INSERT INTO carts (id, user_id) VALUES (?, ?)',
      [cartId, userId]
    );
    return cartId;
  }
}

module.exports = DatabaseService;