const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Configuração MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

console.log('🔧 Configuração MySQL:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Criar pool de conexões
let pool;

async function initDatabase() {
  try {
    console.log('🔄 Tentando conectar no MySQL...');
    pool = mysql.createPool(dbConfig);
    
    // Testar conexão
    const connection = await pool.getConnection();
    console.log('✅ Conexão MySQL estabelecida com sucesso!');
    
    // Testar query simples
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Query de teste executada:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar no MySQL:', error.message);
    console.error('❌ Código do erro:', error.code);
    return false;
  }
}

// Middleware
app.use(express.json());

// Rota de health check
app.get('/api/health', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        status: 'error',
        message: 'Pool de conexões não inicializado'
      });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    connection.release();

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: rows[0].timestamp,
      test: rows[0].test
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      code: error.code
    });
  }
});

// Rota de teste de tabelas
app.get('/api/test-tables', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Pool não inicializado' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute('SHOW TABLES');
    connection.release();

    res.json({
      status: 'success',
      tables: rows.map(row => Object.values(row)[0]),
      count: rows.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
});

// Iniciar servidor
async function startServer() {
  const dbConnected = await initDatabase();
  
  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`🚀 API de teste rodando na porta ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗃️ Teste de tabelas: http://localhost:${PORT}/api/test-tables`);
    });
  } else {
    console.error('❌ Não foi possível conectar no MySQL. Servidor não iniciado.');
    process.exit(1);
  }
}

startServer();
