const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware básico
app.use(cors({
  origin: ['http://localhost:8040', 'http://localhost:8041', 'http://localhost:8042', 'http://localhost:3000', 'http://127.0.0.1:8040', 'http://127.0.0.1:8041', 'http://127.0.0.1:8042', 'http://[::1]:8040', 'http://[::1]:8041', 'http://[::1]:8042'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
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

// Transform database product to frontend format
const transformProduct = (dbProduct) => ({
  id: dbProduct.id || '',
  nome: dbProduct.nome || '',
  descricao: dbProduct.descricao || '',
  preco: parseFloat(dbProduct.preco) || 0,
  imagemUrl: dbProduct.imagem_url || '/placeholder.svg',
  categoria: dbProduct.categoria || '',
  estoque: parseInt(dbProduct.estoque) || 0,
  status: dbProduct.status || 'ativo',
  destaque: dbProduct.destaque === 1 || dbProduct.destaque === true,
  promocao: dbProduct.promocao === 1 || dbProduct.promocao === true,
  lancamento: dbProduct.lancamento === 1 || dbProduct.lancamento === true,
  avaliacao: parseFloat(dbProduct.avaliacao) || 0,
  totalAvaliacoes: parseInt(dbProduct.total_avaliacoes) || 0,
  faixaEtaria: dbProduct.faixa_etaria || '',
  peso: dbProduct.peso || '',
  dimensoes: dbProduct.dimensoes || '',
  material: dbProduct.material || '',
  marca: dbProduct.marca || '',
  origem: dbProduct.origem || '',
  fornecedor: dbProduct.fornecedor || '',
  codigoBarras: dbProduct.codigo_barras || '',
  dataLancamento: dbProduct.data_lancamento || '',
  createdAt: dbProduct.created_at || '',
  updatedAt: dbProduct.updated_at || ''
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

// ===== PRODUTOS CRUD ENDPOINTS =====

// GET /api/produtos - Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    const produtos = rows.map(transformProduct);
    res.json(produtos);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/produtos/:id - Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const produto = transformProduct(rows[0]);
    res.json(produto);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/produtos - Criar novo produto
app.post('/api/produtos', async (req, res) => {
  try {
    const produto = req.body;
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO products 
       (id, nome, descricao, preco, imagem_url, categoria, estoque, status, 
        destaque, promocao, lancamento, avaliacao, total_avaliacoes, 
        faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor, 
        codigo_barras, data_lancamento, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        produto.nome || '',
        produto.descricao || '',
        parseFloat(produto.preco) || 0,
        produto.imagemUrl || '/placeholder.svg',
        produto.categoria || '',
        parseInt(produto.estoque) || 0,
        produto.status || 'ativo',
        produto.destaque ? 1 : 0,
        produto.promocao ? 1 : 0,
        produto.lancamento ? 1 : 0,
        parseFloat(produto.avaliacao) || 0,
        parseInt(produto.totalAvaliacoes) || 0,
        produto.faixaEtaria || '',
        produto.peso || '',
        produto.dimensoes || '',
        produto.material || '',
        produto.marca || '',
        produto.origem || '',
        produto.fornecedor || '',
        produto.codigoBarras || '',
        produto.dataLancamento || null
      ]
    );

    // Buscar o produto criado
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [newId]);
    const createdProduct = transformProduct(rows[0]);
    
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produto = req.body;
    
    const [result] = await pool.execute(
      `UPDATE products SET 
       nome = ?, descricao = ?, preco = ?, imagem_url = ?, categoria = ?, 
       estoque = ?, status = ?, destaque = ?, promocao = ?, lancamento = ?, 
       avaliacao = ?, total_avaliacoes = ?, faixa_etaria = ?, peso = ?, 
       dimensoes = ?, material = ?, marca = ?, origem = ?, fornecedor = ?, 
       codigo_barras = ?, data_lancamento = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        produto.nome || '',
        produto.descricao || '',
        parseFloat(produto.preco) || 0,
        produto.imagemUrl || '/placeholder.svg',
        produto.categoria || '',
        parseInt(produto.estoque) || 0,
        produto.status || 'ativo',
        produto.destaque ? 1 : 0,
        produto.promocao ? 1 : 0,
        produto.lancamento ? 1 : 0,
        parseFloat(produto.avaliacao) || 0,
        parseInt(produto.totalAvaliacoes) || 0,
        produto.faixaEtaria || '',
        produto.peso || '',
        produto.dimensoes || '',
        produto.material || '',
        produto.marca || '',
        produto.origem || '',
        produto.fornecedor || '',
        produto.codigoBarras || '',
        produto.dataLancamento || null,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Buscar o produto atualizado
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
    const updatedProduct = transformProduct(rows[0]);
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/produtos/:id - Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// GET /api/produtos/categoria/:categoria - Buscar produtos por categoria
app.get('/api/produtos/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE categoria = ? ORDER BY created_at DESC',
      [categoria]
    );
    const produtos = rows.map(transformProduct);
    res.json(produtos);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

// GET /api/produtos/destaque - Buscar produtos em destaque
app.get('/api/produtos/destaque', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE destaque = 1 AND status = "ativo" ORDER BY created_at DESC'
    );
    const produtos = rows.map(transformProduct);
    res.json(produtos);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
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
  console.log(`🚀 Mega Simple API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎠 Carousel API: http://localhost:${PORT}/api/carousel`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
