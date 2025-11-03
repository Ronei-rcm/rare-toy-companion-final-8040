const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
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
  id: dbItem.id,
  nome: dbItem.titulo || '',
  preco: dbItem.preco || '',
  precoOriginal: dbItem.preco_original,
  imagem: dbItem.imagem_url || '',
  badge: dbItem.badge || 'Novo',
  avaliacao: dbItem.avaliacao || 5.0,
  vendidos: dbItem.vendidos || 0,
  descricao: dbItem.descricao || '',
  ativo: dbItem.ativo || false,
  order_index: dbItem.order_index || 0
});

// Transform frontend item to database format
const transformToDatabase = (item) => ({
  id: item.id,
  titulo: item.nome,
  descricao: item.descricao,
  preco: item.preco,
  preco_original: item.precoOriginal,
  imagem_url: item.imagem,
  badge: item.badge,
  avaliacao: item.avaliacao,
  vendidos: item.vendidos,
  ativo: item.ativo,
  order_index: item.order_index || 0
});

// Routes

// GET /api/carousel - Get all carousel items
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

// GET /api/carousel/active - Get active carousel items only
app.get('/api/carousel/active', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_items WHERE ativo = true ORDER BY order_index ASC, created_at ASC'
    );
    const items = rows.map(transformCarouselItem);
    res.json(items);
  } catch (error) {
    console.error('Error fetching active carousel items:', error);
    res.status(500).json({ error: 'Failed to fetch active carousel items' });
  }
});

// POST /api/carousel - Create new carousel item
app.post('/api/carousel', async (req, res) => {
  try {
    const item = req.body;
    const dbItem = transformToDatabase(item);
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO carousel_items 
       (id, titulo, descricao, preco, preco_original, imagem_url, badge, avaliacao, vendidos, ativo, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        dbItem.titulo,
        dbItem.descricao,
        dbItem.preco,
        dbItem.preco_original,
        dbItem.imagem_url,
        dbItem.badge,
        dbItem.avaliacao,
        dbItem.vendidos,
        dbItem.ativo,
        dbItem.order_index
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

// PUT /api/carousel/:id - Update carousel item
app.put('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    const dbItem = transformToDatabase(item);
    
    await pool.execute(
      `UPDATE carousel_items 
       SET titulo = ?, descricao = ?, preco = ?, preco_original = ?, imagem_url = ?, badge = ?, 
           avaliacao = ?, vendidos = ?, ativo = ?, order_index = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        dbItem.titulo,
        dbItem.descricao,
        dbItem.preco,
        dbItem.preco_original,
        dbItem.imagem_url,
        dbItem.badge,
        dbItem.avaliacao,
        dbItem.vendidos,
        dbItem.ativo,
        dbItem.order_index,
        id
      ]
    );

    // Fetch the updated item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }
    
    const updatedItem = transformCarouselItem(rows[0]);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating carousel item:', error);
    res.status(500).json({ error: 'Failed to update carousel item' });
  }
});

// DELETE /api/carousel/:id - Delete carousel item
app.delete('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute('DELETE FROM carousel_items WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    res.status(500).json({ error: 'Failed to delete carousel item' });
  }
});

// PUT /api/carousel/:id/toggle - Toggle item active status
app.put('/api/carousel/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    await pool.execute(
      'UPDATE carousel_items SET ativo = ?, updated_at = NOW() WHERE id = ?',
      [ativo, id]
    );

    // Fetch the updated item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }
    
    const updatedItem = transformCarouselItem(rows[0]);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error toggling carousel item:', error);
    res.status(500).json({ error: 'Failed to toggle carousel item' });
  }
});

// POST /api/carousel/bulk - Save all carousel items (bulk update)
app.post('/api/carousel/bulk', async (req, res) => {
  try {
    const items = req.body;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get all existing items
      const [existingRows] = await connection.execute('SELECT id FROM carousel_items');
      const existingIds = new Set(existingRows.map(row => row.id));
      const newItemIds = new Set(items.map(item => item.id));

      // Delete items that were removed
      for (const existingRow of existingRows) {
        if (!newItemIds.has(existingRow.id)) {
          await connection.execute('DELETE FROM carousel_items WHERE id = ?', [existingRow.id]);
        }
      }

      // Update or create items
      for (let i = 0; i < items.length; i++) {
        const item = { ...items[i], order_index: i };
        const dbItem = transformToDatabase(item);
        
        if (existingIds.has(item.id)) {
          // Update existing item
          await connection.execute(
            `UPDATE carousel_items 
             SET titulo = ?, descricao = ?, preco = ?, preco_original = ?, imagem_url = ?, badge = ?, 
                 avaliacao = ?, vendidos = ?, ativo = ?, order_index = ?, updated_at = NOW()
             WHERE id = ?`,
            [
              dbItem.titulo,
              dbItem.descricao,
              dbItem.preco,
              dbItem.preco_original,
              dbItem.imagem_url,
              dbItem.badge,
              dbItem.avaliacao,
              dbItem.vendidos,
              dbItem.ativo,
              dbItem.order_index,
              item.id
            ]
          );
        } else {
          // Create new item
          const newId = item.id || require('crypto').randomUUID();
          await connection.execute(
            `INSERT INTO carousel_items 
             (id, titulo, descricao, preco, preco_original, imagem_url, badge, avaliacao, vendidos, ativo, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              newId,
              dbItem.titulo,
              dbItem.descricao,
              dbItem.preco,
              dbItem.preco_original,
              dbItem.imagem_url,
              dbItem.badge,
              dbItem.avaliacao,
              dbItem.vendidos,
              dbItem.ativo,
              dbItem.order_index
            ]
          );
        }
      }

      await connection.commit();
      res.json({ success: true });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error saving carousel items:', error);
    res.status(500).json({ error: 'Failed to save carousel items' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Carousel API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎠 Carousel API: http://localhost:${PORT}/api/carousel`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
