const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware básico
app.use(cors({
  origin: ['http://localhost:8040', 'http://localhost:3000', 'http://127.0.0.1:8040'],
  credentials: true
}));
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'rare_toy_user',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || '3307'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Transform database item to frontend format
const transformCarouselItem = (dbItem) => ({
  id: dbItem.id || '',
  nome: dbItem.title || '',
  imagem: dbItem.image_url || '',
  badge: 'Novo',
  descricao: dbItem.subtitle || '',
  ativo: dbItem.active === 1 || dbItem.active === true,
  order_index: dbItem.order_index || 0,
  button_text: dbItem.button_text || 'Ver Mais',
  button_link: dbItem.button_link || '#'
});

// Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando!', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

app.get('/api/carousel', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_items ORDER BY order_index ASC, created_at ASC'
    );
    const items = rows.map(transformCarouselItem);
    res.json(items);
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    res.status(500).json({ error: 'Failed to fetch carousel items' });
  }
});

app.get('/api/carousel/active', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_items WHERE active = true ORDER BY order_index ASC, created_at ASC'
    );
    const items = rows.map(transformCarouselItem);
    res.json(items);
  } catch (error) {
    console.error('Error fetching active carousel items:', error);
    res.status(500).json({ error: 'Failed to fetch active carousel items' });
  }
});

// Endpoints do carrossel para criação e atualização
app.post('/api/carousel', async (req, res) => {
  try {
    const item = req.body;
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO carousel_items 
       (id, title, subtitle, image_url, button_text, button_link, active, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        item.nome || '',
        item.descricao || '',
        item.imagem || '',
        item.button_text || 'Ver Mais',
        item.button_link || '#',
        item.ativo !== undefined ? item.ativo : true,
        item.order_index || 0
      ]
    );

    // Fetch the created item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [newId]);
    const createdItem = transformCarouselItem(rows[0]);
    
    res.status(201).json(createdItem);
  } catch (error) {
    console.error('Error creating carousel item:', error);
    res.status(500).json({ error: 'Failed to create carousel item' });
  }
});

// Endpoints de fallback
app.get('/api/pedidos/carrinho', (req, res) => {
  res.json({ message: 'API de carrinho não implementada ainda', items: [] });
});

app.get('/api/produtos', (req, res) => {
  res.json({ message: 'API de produtos não implementada ainda', produtos: [] });
});

app.get('/api/pedidos', (req, res) => {
  res.json({ message: 'API de pedidos não implementada ainda', pedidos: [] });
});

app.post('/api/upload', (req, res) => {
  res.json({ 
    success: true, 
    imageUrl: '/placeholder.svg',
    filename: 'placeholder.svg'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎠 Carousel API: http://localhost:${PORT}/api/carousel`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
