/**
 * Pool de Conexão MySQL Compartilhado
 * 
 * Este módulo exporta um pool de conexão MySQL que pode ser usado
 * por todos os módulos do servidor, evitando múltiplos pools.
 * 
 * SECURITY: Nunca hardcodar senhas! Use apenas variáveis de ambiente
 */

// CRITICAL: Load environment variables BEFORE creating the pool
require('dotenv').config();

const mysql = require('mysql2/promise');

// Criar pool de conexão
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  // Não definir senha real como fallback; em desenvolvimento o .env deve preencher
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4'
});

// Verificação de conexão (opcional, pode ser feito no server.cjs)
pool.getConnection()
  .then((conn) => {
    console.log('✅ Pool de conexões MySQL inicializado (módulo compartilhado)');
    conn.release();
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MySQL:', error.message);
  });

module.exports = pool;
