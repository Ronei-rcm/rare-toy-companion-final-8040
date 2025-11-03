
/**
 * Servidor principal refatorado
 * Agora usa módulos organizados por funcionalidade
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Importar módulos organizados
const {
  setupSecurityMiddleware,
  authenticateUser,
  authenticateAdmin,
  productsRoutes,
  cartRoutes,
  DatabaseService
} = require('./modules/index.cjs');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware básico
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configurar middleware de segurança
setupSecurityMiddleware(app);

// Pool de conexão MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_store',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Inicializar serviço de banco de dados
const db = new DatabaseService(pool);

// Disponibilizar pool e db para as rotas
app.use((req, res, next) => {
  req.pool = pool;
  req.db = db;
  next();
});

// Rotas organizadas
app.use('/', productsRoutes);
app.use('/', cartRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
