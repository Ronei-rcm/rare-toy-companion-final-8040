/**
 * Testes Unitários - Banco de Dados
 */

const { describe, it, expect, beforeEach, afterEach } = require('vitest');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração de teste
const testConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_store',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  charset: 'utf8mb4'
};

describe('Banco de Dados', () => {
  let connection;

  beforeEach(async () => {
    connection = await mysql.createConnection(testConfig);
  });

  afterEach(async () => {
    if (connection) {
      await connection.end();
    }
  });

  describe('Conexão', () => {
    it('deve conectar ao banco de dados', async () => {
      expect(connection).toBeDefined();
      const [rows] = await connection.execute('SELECT 1 as test');
      expect(rows[0].test).toBe(1);
    });

    it('deve usar charset utf8mb4', async () => {
      const [rows] = await connection.execute("SHOW VARIABLES LIKE 'character_set_connection'");
      expect(rows[0].Value).toBe('utf8mb4');
    });
  });

  describe('Tabelas Essenciais', () => {
    it('deve ter tabela de produtos', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'produtos'
      `);
      expect(rows[0].count).toBe(1);
    });

    it('deve ter tabela de categorias', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'categorias'
      `);
      expect(rows[0].count).toBe(1);
    });

    it('deve ter tabela de carrinhos', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'carts'
      `);
      expect(rows[0].count).toBe(1);
    });

    it('deve ter tabela de clientes', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'customers'
      `);
      expect(rows[0].count).toBe(1);
    });
  });

  describe('Índices de Performance', () => {
    it('deve ter índices nas tabelas principais', async () => {
      const tables = ['produtos', 'carts', 'customers', 'orders'];
      
      for (const table of tables) {
        const [indexes] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = ?
          AND INDEX_NAME != 'PRIMARY'
        `, [table]);
        
        expect(indexes[0].count).toBeGreaterThan(0);
      }
    });
  });

  describe('Integridade dos Dados', () => {
    it('deve ter produtos com preços válidos', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM produtos 
        WHERE preco > 0
      `);
      expect(rows[0].count).toBeGreaterThan(0);
    });

    it('deve ter categorias válidas', async () => {
      const [rows] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM categorias 
        WHERE nome IS NOT NULL AND nome != ''
      `);
      expect(rows[0].count).toBeGreaterThan(0);
    });
  });

  describe('Queries de Performance', () => {
    it('deve executar query de produtos rapidamente', async () => {
      const startTime = Date.now();
      
      await connection.execute(`
        SELECT p.*, c.nome as categoria_nome 
        FROM produtos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.status = 'ativo' 
        LIMIT 10
      `);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve executar query de carrinho rapidamente', async () => {
      const startTime = Date.now();
      
      await connection.execute(`
        SELECT ci.*, p.nome, p.preco 
        FROM cart_items ci 
        LEFT JOIN produtos p ON ci.product_id = p.id 
        WHERE ci.cart_id = 'test-cart-id'
      `);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(500); // Menos de 500ms
    });
  });
});
