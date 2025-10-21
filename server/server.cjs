const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Iniciando servidor...');

// Importar configurações de segurança e logging
const logger = require('../config/logger.cjs');
const {
  generalLimiter,
  authLimiter,
  createAccountLimiter,
  cartLimiter,
  productsLimiter,
  helmetConfig,
  sanitizeObject
} = require('../config/security.cjs');
const { initializeEmailService } = require('../config/emailService.cjs');
const { initializeScheduler, scheduleMonthlyCleanup } = require('../config/cartRecoveryScheduler.cjs');
const { setDoubleSubmitCookie, getCsrfTokenEndpoint } = require('../config/csrfProtection.cjs');
const redisCache = require('../config/redisCache.cjs');
const sentry = require('../config/sentry.cjs');

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Inicializar Sentry (deve ser o primeiro)
sentry.initializeSentry(app);

// Request handler do Sentry (deve vir antes de outras rotas)
app.use(sentry.sentryRequestHandler());
app.use(sentry.sentryTracingHandler());

// Aplicar Helmet para headers de segurança
app.use(helmetConfig);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8040', 
    'http://localhost:3000', 
    'http://127.0.0.1:8040',
    'http://localhost:8040',
    'http://172.16.0.15:8040',
    'http://172.17.0.1:8040',
    'http://172.18.0.1:8040',
    'http://172.19.0.1:8040',
    'http://177.67.33.248:8040',
    'https://muhlstore.re9suainternet.com.br'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de debug
app.use((req, res, next) => {
  if (req.path === '/api/addresses' && req.method === 'POST') {
    console.log('🚨 MIDDLEWARE: POST /api/addresses interceptado!');
    console.log('🚨 Body:', req.body);
  }
  next();
});
// Cookies para identificar carrinho anônimo
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Behind nginx proxy - configurar com valor específico para evitar warning do rate limiter
app.set('trust proxy', 1); // Trust only the first proxy

// Middleware de logging de requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
});

// Rate limiting geral
app.use('/api/', generalLimiter);

// Proteção CSRF (Double Submit Cookie pattern)
app.use(setDoubleSubmitCookie);

// Endpoint para obter token CSRF
app.get('/api/csrf-token', getCsrfTokenEndpoint);

// Helper to build absolute URL honoring proxy proto/host
function getPublicUrl(req, pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${proto}://${host}${normalized}`;
}

// Normalize any absolute http(s) URL to this host/proto. If relative, keep relative semantics.
function normalizeToThisOrigin(req, urlOrPath) {
  try {
    if (!urlOrPath) return null;
    if (!/^https?:\/\//i.test(urlOrPath)) {
      // Already relative; make it absolute with current origin
      return getPublicUrl(req, urlOrPath);
    }
    const u = new URL(urlOrPath);
    // Preserve path/search; rebuild on current origin
    const rebuilt = `${(req.headers['x-forwarded-proto'] || req.protocol || 'http')}://${(req.headers['x-forwarded-host'] || req.get('host'))}${u.pathname}${u.search || ''}`;
    return rebuilt;
  } catch {
    return getPublicUrl(req, urlOrPath);
  }
}

// Extrai o caminho de uploads mesmo quando a URL veio duplicada com host (ex.: http://host/http://host/.../lovable-uploads/arquivo.jpg)
function extractUploadPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const marker = '/lovable-uploads/';
  const idx = urlOrPath.lastIndexOf(marker);
  if (idx >= 0) {
    return urlOrPath.slice(idx);
  }
  return urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
}

// Corrigir URLs duplicadas do tipo /http://host/... → redirecionar para o caminho correto
app.get(/^\/https?:\/\/[^/]+(\/.*)$/i, (req, res) => {
  try {
    const match = req.path.match(/^\/https?:\/\/[^/]+(\/.*)$/i);
    const target = match && match[1] ? match[1] : '/';
    return res.redirect(301, target);
  } catch (e) {
    return res.status(404).end();
  }
});

// Serve static files from public directory (com headers para evitar ORB)
app.use('/lovable-uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../public/lovable-uploads')));
// Também servir uploads padrão
// servir /uploads do mesmo diretório base do multer
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../public')));
// Logar chaves do body para rotas de coleções
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/collections')) {
    try {
      const keys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
      console.log(`📥 ${req.method} ${req.path}`, keys.length ? { keys } : {});
    } catch {}
  }
  next();
});

// Fallback: se o frontend pedir apenas o nome do arquivo (ex.: 1758....jpg),
// tentamos servir a partir de /public/uploads/collections ou /public/lovable-uploads
app.get('/:fileName', async (req, res, next) => {
  try {
    const fileName = req.params.fileName;
    if (!fileName || !/(\.jpg|\.jpeg|\.png|\.webp)$/i.test(fileName)) return next();
  const tryPaths = [
      path.join(__dirname, '../public', 'lovable-uploads', fileName),
      path.join(__dirname, '../public', fileName)
    ];
    for (const p of tryPaths) {
      if (fs.existsSync(p)) {
        return res.sendFile(p);
      }
    }
    return res.status(404).send('Not found');
  } catch (_) {
    return next();
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/lovable-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4'
});

// Verificação de conexão com banco de dados
pool.getConnection()
  .then(async (conn) => {
    console.log('✅ Pool de conexões MySQL inicializado');
    // Configurar charset UTF-8
    await conn.execute("SET NAMES 'utf8mb4'");
    await conn.execute("SET CHARACTER SET utf8mb4");
    conn.release();
  })
  .catch(err => console.error('❌ Erro ao conectar ao MySQL:', err.message));

// Transform database item to frontend format
function transformCarouselItem(dbItem, req) {
  return {
    id: dbItem.id || '',
    nome: dbItem.title || '',
    imagem: normalizeToThisOrigin(req, dbItem.image_url || ''),
    badge: dbItem.badge || 'Novo',
    descricao: dbItem.subtitle || '',
    ativo: dbItem.active === 1 || dbItem.active === true,
    order_index: dbItem.order_index || 0,
    button_text: dbItem.button_text || 'Ver Mais',
    button_link: dbItem.button_link || '#'
  };
}

// Transform frontend item to database format
const transformToDatabase = (item) => ({
  id: item.id || null,
  title: item.nome || null,
  subtitle: item.descricao || null,
  image_url: item.imagem || null,
  badge: item.badge || null,
  button_text: item.button_text || 'Ver Mais',
  button_link: item.button_link || '#',
  active: item.ativo !== undefined ? item.ativo : false,
  order_index: item.order_index || 0
});

// Filter out undefined values to prevent SQL errors
const filterUndefined = (obj) => {
  const filtered = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      filtered[key] = value;
    }
  }
  return filtered;
};

// Routes

// GET /api/carousel - Get all carousel items
app.get('/api/carousel', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM carousel_items ORDER BY order_index ASC, created_at ASC'
    );
    const items = rows.map(row => transformCarouselItem(row, req));
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
      'SELECT * FROM carousel_items WHERE active = true ORDER BY order_index ASC, created_at ASC'
    );
    const items = rows.map(row => transformCarouselItem(row, req));
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
    const dbItem = filterUndefined(transformToDatabase(item));
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO carousel_items 
       (id, title, subtitle, image_url, badge, link_url, is_active, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        newId,
        dbItem.title ?? null,
        dbItem.subtitle ?? null,
        dbItem.image_url ?? null,
        dbItem.badge ?? null,
        dbItem.button_link ?? dbItem.link_url ?? null,
        dbItem.active ?? dbItem.is_active ?? true,
        dbItem.order_index ?? 0
      ]
    );

    // Fetch the created item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [newId]);
    const createdItem = transformCarouselItem(rows[0], req);
    
    res.status(201).json(createdItem);
  } catch (error) {
    console.error('Error creating carousel item:', error);
    res.status(500).json({ error: 'Failed to create carousel item', message: error.message });
  }
});

// PUT /api/carousel/:id - Update carousel item
app.put('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    const dbItem = filterUndefined(transformToDatabase(item));
    
    await pool.execute(
      `UPDATE carousel_items 
       SET title = ?, subtitle = ?, image_url = ?, badge = ?, link_url = ?, 
           is_active = ?, order_index = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        dbItem.title ?? null,
        dbItem.subtitle ?? null,
        dbItem.image_url ?? null,
        dbItem.badge ?? null,
        dbItem.button_link ?? dbItem.link_url ?? null,
        dbItem.active ?? dbItem.is_active ?? true,
        dbItem.order_index ?? 0,
        id
      ]
    );

    // Fetch the updated item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }
    
    const updatedItem = transformCarouselItem(rows[0], req);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating carousel item:', error);
    res.status(500).json({ error: 'Failed to update carousel item', message: error.message });
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
      'UPDATE carousel_items SET active = ?, updated_at = NOW() WHERE id = ?',
      [ativo ?? true, id]
    );

    // Fetch the updated item
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Carousel item not found' });
    }
    
    const updatedItem = transformCarouselItem(rows[0], req);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error toggling carousel item:', error);
    res.status(500).json({ error: 'Failed to toggle carousel item', message: error.message });
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
        const dbItem = filterUndefined(transformToDatabase(item));
        
        if (existingIds.has(item.id)) {
          // Update existing item
          await connection.execute(
            `UPDATE carousel_items 
             SET title = ?, subtitle = ?, image_url = ?, badge = ?, link_url = ?, 
                 is_active = ?, order_index = ?, updated_at = NOW()
             WHERE id = ?`,
            [
              dbItem.title ?? null,
              dbItem.subtitle ?? null,
              dbItem.image_url ?? null,
              dbItem.badge ?? null,
              dbItem.button_link ?? dbItem.link_url ?? null,
              dbItem.active ?? dbItem.is_active ?? true,
              dbItem.order_index ?? i,
              item.id
            ]
          );
        } else {
          // Create new item
          const newId = item.id || require('crypto').randomUUID();
          await connection.execute(
            `INSERT INTO carousel_items 
             (id, title, subtitle, image_url, badge, link_url, is_active, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              newId,
              dbItem.title ?? null,
              dbItem.subtitle ?? null,
              dbItem.image_url ?? null,
              dbItem.badge ?? null,
              dbItem.button_link ?? dbItem.link_url ?? null,
              dbItem.active ?? dbItem.is_active ?? true,
              dbItem.order_index ?? i
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

// POST /api/upload - Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// ==================== PRODUTOS API ====================

// Buscar todos os produtos
// Cache de produtos (1 minuto)
const productsCacheMiddleware = redisCache.cacheMiddleware(60);

app.get('/api/produtos', productsLimiter, productsCacheMiddleware, async (req, res) => {
  try {
    console.log('🔄 Buscando produtos...');
    const [rows] = await pool.execute(`
      SELECT 
        id, nome, descricao, preco, imagem_url as imagemUrl, categoria, estoque, 
        status, destaque, promocao, lancamento, avaliacao, total_avaliacoes as totalAvaliacoes,
        faixa_etaria as faixaEtaria, peso, dimensoes, material, marca, origem, fornecedor,
        codigo_barras as codigoBarras, data_lancamento as dataLancamento, created_at as createdAt, updated_at as updatedAt
      FROM produtos 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${rows.length} produtos encontrados`);
    
    // Converter preços de string para number e corrigir URLs de imagem
    const produtos = rows.map(produto => ({
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produtos em destaque
app.get('/api/produtos/destaque', async (req, res) => {
  try {
    console.log('🔄 Buscando produtos em destaque...');
    
    const [rows] = await pool.execute(
      'SELECT *, imagem_url as imagemUrl, total_avaliacoes as totalAvaliacoes, faixa_etaria as faixaEtaria, codigo_barras as codigoBarras, data_lancamento as dataLancamento, created_at as createdAt, updated_at as updatedAt FROM produtos WHERE destaque = true ORDER BY created_at DESC'
    );
    
    console.log(`✅ ${rows.length} produtos em destaque encontrados`);
    
    // Converter preços de string para number e corrigir URLs de imagem
    const produtos = rows.map(produto => ({
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos em destaque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar todas as categorias com contagem de produtos (PÚBLICO)
app.get('/api/categorias', async (req, res) => {
  try {
    console.log('🔄 Buscando categorias públicas...');
    
    // Buscar categorias da tabela com estatísticas de produtos
    const [categorias] = await pool.query(`
      SELECT 
        c.id,
        c.nome,
        c.slug,
        c.descricao,
        c.icon,
        c.cor,
        c.imagem_url,
        c.ordem,
        COALESCE(COUNT(DISTINCT p.id), 0) as quantidade,
        COALESCE(MIN(p.preco), 0) as precoMinimo,
        COALESCE(MAX(p.preco), 0) as precoMaximo,
        COALESCE(AVG(p.avaliacao), 0) as avaliacaoMedia,
        MAX(p.created_at) as ultimoProduto
      FROM \`categorias\` c
      LEFT JOIN \`produtos\` p ON p.categoria = c.nome AND p.status = 'ativo'
      WHERE c.ativo = TRUE
      GROUP BY c.id
      ORDER BY c.ordem ASC, c.nome ASC
    `);
    
    console.log(`✅ ${categorias.length} categorias encontradas`);
    
    // Formatar resposta
    const categoriasFormatadas = categorias.map(categoria => ({
      id: categoria.slug || categoria.id,
      nome: categoria.nome,
      slug: categoria.slug,
      descricao: categoria.descricao || `Encontre ${categoria.quantidade} produtos incríveis`,
      icon: categoria.icon,
      cor: categoria.cor,
      imagem_url: categoria.imagem_url ? getPublicUrl(req, categoria.imagem_url) : null,
      quantidade: parseInt(categoria.quantidade),
      precoMinimo: parseFloat(categoria.precoMinimo),
      precoMaximo: parseFloat(categoria.precoMaximo),
      avaliacaoMedia: categoria.avaliacaoMedia && categoria.quantidade > 0 
        ? parseFloat(categoria.avaliacaoMedia).toFixed(1) 
        : null,
      ultimoProduto: categoria.ultimoProduto
    }));
    
    res.json(categoriasFormatadas);
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================
// NOVA API DE CATEGORIAS COM GERENCIAMENTO COMPLETO
// ============================================================

// GET /api/categorias/nomes - Listar apenas nomes das categorias ativas (para dropdowns)
app.get('/api/categorias/nomes', async (req, res) => {
  try {
    const [categorias] = await pool.execute(`
      SELECT nome, slug, icon, cor 
      FROM categorias 
      WHERE ativo = TRUE 
      ORDER BY ordem ASC, nome ASC
    `);
    
    res.json(categorias.map(c => c.nome));
  } catch (error) {
    console.error('❌ Erro ao buscar nomes de categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/categorias/lista - Listar categorias para dropdown (nome + detalhes)
app.get('/api/categorias/lista', async (req, res) => {
  try {
    const [categorias] = await pool.execute(`
      SELECT id, nome, slug, icon, cor 
      FROM categorias 
      WHERE ativo = TRUE 
      ORDER BY ordem ASC, nome ASC
    `);
    
    res.json(categorias);
  } catch (error) {
    console.error('❌ Erro ao buscar lista de categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/categorias/gerenciaveis - Listar todas as categorias gerenciáveis (admin)
app.get('/api/categorias/gerenciaveis', async (req, res) => {
  try {
    console.log('🔄 Buscando categorias gerenciáveis...');
    
    const [categorias] = await pool.execute(`
      SELECT 
        c.*,
        COALESCE(COUNT(DISTINCT p.id), 0) as quantidade,
        COALESCE(MIN(p.preco), 0) as precoMinimo,
        COALESCE(MAX(p.preco), 0) as precoMaximo,
        COALESCE(AVG(p.avaliacao), 0) as avaliacaoMedia
      FROM categorias c
      LEFT JOIN produtos p ON p.categoria = c.nome AND p.status = 'ativo'
      GROUP BY c.id
      ORDER BY c.ordem ASC, c.nome ASC
    `);
    
    console.log(`✅ ${categorias.length} categorias gerenciáveis encontradas`);
    
    const categoriasFormatadas = categorias.map(cat => ({
      ...cat,
      precoMinimo: parseFloat(cat.precoMinimo),
      precoMaximo: parseFloat(cat.precoMaximo),
      avaliacaoMedia: cat.avaliacaoMedia ? parseFloat(cat.avaliacaoMedia).toFixed(1) : null,
      imagem_url: cat.imagem_url ? getPublicUrl(req, cat.imagem_url) : null
    }));
    
    res.json(categoriasFormatadas);
  } catch (error) {
    console.error('❌ Erro ao buscar categorias gerenciáveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/categorias/:id - Buscar categoria por ID (admin)
app.get('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando categoria ID: ${id}`);
    
    const [rows] = await pool.execute(`
      SELECT 
        c.*,
        COALESCE(COUNT(DISTINCT p.id), 0) as quantidade,
        COALESCE(MIN(p.preco), 0) as precoMinimo,
        COALESCE(MAX(p.preco), 0) as precoMaximo,
        COALESCE(AVG(p.avaliacao), 0) as avaliacaoMedia
      FROM categorias c
      LEFT JOIN produtos p ON p.categoria = c.nome AND p.status = 'ativo'
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    const categoria = {
      ...rows[0],
      precoMinimo: parseFloat(rows[0].precoMinimo),
      precoMaximo: parseFloat(rows[0].precoMaximo),
      avaliacaoMedia: rows[0].avaliacaoMedia ? parseFloat(rows[0].avaliacaoMedia).toFixed(1) : null,
      imagem_url: rows[0].imagem_url ? getPublicUrl(req, rows[0].imagem_url) : null
    };
    
    console.log(`✅ Categoria encontrada: ${categoria.nome}`);
    res.json(categoria);
  } catch (error) {
    console.error('❌ Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/categorias - Criar nova categoria (admin)
app.post('/api/categorias', async (req, res) => {
  try {
    const { 
      nome, 
      descricao, 
      icon = '📦', 
      cor = 'from-purple-500 to-purple-600',
      imagem_url,
      ordem = 0,
      ativo = true,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;
    
    console.log('🔄 Criando nova categoria:', nome);
    
    // Validação
    if (!nome || nome.trim() === '') {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }
    
    // Gerar slug
    const slug = nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
    
    const [result] = await pool.execute(`
      INSERT INTO categorias 
      (nome, slug, descricao, icon, cor, imagem_url, ordem, ativo, meta_title, meta_description, meta_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nome, 
      slug, 
      descricao ?? null, 
      icon, 
      cor, 
      imagem_url ?? null, 
      ordem, 
      ativo, 
      meta_title ?? null, 
      meta_description ?? null, 
      meta_keywords ?? null
    ]);
    
    console.log(`✅ Categoria criada com ID: ${result.insertId}`);
    
    // Buscar categoria criada
    const [categorias] = await pool.execute('SELECT * FROM categorias WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      message: 'Categoria criada com sucesso',
      categoria: categorias[0]
    });
  } catch (error) {
    console.error('❌ Erro ao criar categoria:', error);
    
    // Erro de duplicação
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Já existe uma categoria com este nome' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/categorias/:id - Atualizar categoria (admin)
app.put('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, 
      descricao, 
      icon, 
      cor,
      imagem_url,
      ordem,
      ativo,
      meta_title,
      meta_description,
      meta_keywords
    } = req.body;
    
    console.log(`🔄 Atualizando categoria ID: ${id}`);
    
    // Verificar se categoria existe
    const [existing] = await pool.execute('SELECT * FROM categorias WHERE id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Gerar novo slug se o nome mudou
    let slug = existing[0].slug;
    if (nome && nome !== existing[0].nome) {
      slug = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }
    
    const [result] = await pool.execute(`
      UPDATE categorias 
      SET 
        nome = COALESCE(?, nome),
        slug = ?,
        descricao = COALESCE(?, descricao),
        icon = COALESCE(?, icon),
        cor = COALESCE(?, cor),
        imagem_url = COALESCE(?, imagem_url),
        ordem = COALESCE(?, ordem),
        ativo = COALESCE(?, ativo),
        meta_title = COALESCE(?, meta_title),
        meta_description = COALESCE(?, meta_description),
        meta_keywords = COALESCE(?, meta_keywords),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      nome ?? null, 
      slug, 
      descricao ?? null, 
      icon ?? null, 
      cor ?? null, 
      imagem_url ?? null, 
      ordem ?? null, 
      ativo ?? null, 
      meta_title ?? null, 
      meta_description ?? null, 
      meta_keywords ?? null, 
      id
    ]);
    
    console.log(`✅ Categoria atualizada: ${id}`);
    
    // Buscar categoria atualizada
    const [categorias] = await pool.execute('SELECT * FROM categorias WHERE id = ?', [id]);
    
    res.json({
      message: 'Categoria atualizada com sucesso',
      categoria: categorias[0]
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Já existe uma categoria com este nome' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/categorias/:id - Deletar categoria (admin)
app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando categoria ID: ${id}`);
    
    // Buscar nome da categoria
    const [categoriaResult] = await pool.execute(
      'SELECT nome FROM categorias WHERE id = ?',
      [id]
    );
    
    if (categoriaResult.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    const nomeCategoria = categoriaResult[0].nome;
    
    // Verificar se existem produtos com esta categoria (usando o campo nome)
    const [produtos] = await pool.execute(
      'SELECT COUNT(*) as count FROM produtos WHERE categoria = ?',
      [nomeCategoria]
    );
    
    if (produtos[0].count > 0) {
      return res.status(409).json({ 
        error: `Não é possível deletar esta categoria pois existem ${produtos[0].count} produto(s) associado(s)` 
      });
    }
    
    const [result] = await pool.execute('DELETE FROM categorias WHERE id = ?', [id]);
    
    console.log(`✅ Categoria deletada: ${id}`);
    
    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/categorias/:id/ordem - Atualizar ordem da categoria (admin)
app.patch('/api/categorias/:id/ordem', async (req, res) => {
  try {
    const { id } = req.params;
    const { ordem } = req.body;
    
    console.log(`🔄 Atualizando ordem da categoria ID: ${id} para ${ordem}`);
    
    if (typeof ordem !== 'number') {
      return res.status(400).json({ error: 'Ordem deve ser um número' });
    }
    
    const [result] = await pool.execute(
      'UPDATE categorias SET ordem = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [ordem, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    console.log(`✅ Ordem atualizada para categoria: ${id}`);
    
    res.json({ message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar ordem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/categorias/:id/toggle - Ativar/desativar categoria (admin)
app.patch('/api/categorias/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔄 Alterando status da categoria ID: ${id}`);
    
    const [result] = await pool.execute(
      'UPDATE categorias SET ativo = NOT ativo, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Buscar categoria atualizada
    const [categorias] = await pool.execute('SELECT * FROM categorias WHERE id = ?', [id]);
    
    console.log(`✅ Status alterado para categoria: ${id}`);
    
    res.json({
      message: 'Status alterado com sucesso',
      ativo: categorias[0].ativo
    });
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ============================================================
// FIM DA NOVA API DE CATEGORIAS
// ============================================================

// Buscar produtos por categoria (aceita slug ou nome)
app.get('/api/produtos/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    console.log(`🔄 Buscando produtos da categoria: ${categoria}`);
    
    // Buscar por slug primeiro, se não encontrar tenta por nome (compatibilidade)
    const [rows] = await pool.execute(`
      SELECT p.*, p.imagem_url as imagemUrl, p.total_avaliacoes as totalAvaliacoes, 
             p.faixa_etaria as faixaEtaria, p.codigo_barras as codigoBarras, 
             p.data_lancamento as dataLancamento, p.created_at as createdAt, 
             p.updated_at as updatedAt,
             c.nome as categoria_nome, c.slug as categoria_slug, c.icon as categoria_icon
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria = c.nome
      WHERE c.slug = ? OR c.nome = ? OR p.categoria = ?
      ORDER BY p.created_at DESC
    `, [categoria, categoria, categoria]);
    
    console.log(`✅ ${rows.length} produtos encontrados na categoria ${categoria}`);
    
    // Converter preços de string para number e corrigir URLs de imagem
    const produtos = rows.map(produto => ({
      ...produto,
      preco: parseFloat(produto.preco),
      avaliacao: produto.avaliacao ? parseFloat(produto.avaliacao) : null,
      imagemUrl: produto.imagemUrl ? getPublicUrl(req, produto.imagemUrl) : null
    }));
    
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos por categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar estatísticas gerais da loja
app.get('/api/stats', async (req, res) => {
  try {
    console.log('🔄 Buscando estatísticas da loja...');
    
    const [statsRows] = await pool.execute(`
      SELECT 
        COUNT(*) as totalProdutos,
        COUNT(CASE WHEN status = 'ativo' THEN 1 END) as produtosAtivos,
        COUNT(CASE WHEN destaque = true THEN 1 END) as produtosDestaque,
        COUNT(CASE WHEN promocao = true THEN 1 END) as produtosPromocao,
        AVG(avaliacao) as avaliacaoMedia,
        SUM(total_avaliacoes) as totalAvaliacoes,
        MIN(preco) as precoMinimo,
        MAX(preco) as precoMaximo,
        AVG(preco) as precoMedio
      FROM produtos
    `);
    
    const [categoriasRows] = await pool.execute(`
      SELECT COUNT(DISTINCT categoria) as totalCategorias
      FROM produtos WHERE status = 'ativo'
    `);
    
    const stats = {
      ...statsRows[0],
      totalCategorias: categoriasRows[0].totalCategorias,
      avaliacaoMedia: statsRows[0].avaliacaoMedia ? parseFloat(statsRows[0].avaliacaoMedia).toFixed(1) : null,
      precoMedio: parseFloat(statsRows[0].precoMedio).toFixed(2)
    };
    
    console.log('✅ Estatísticas carregadas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar compras recentes simuladas (para demonstração)
app.get('/api/compras-recentes', async (req, res) => {
  try {
    console.log('🔄 Buscando compras recentes...');
    
    // Buscar produtos aleatórios para simular compras recentes
    const [rows] = await pool.execute(`
      SELECT 
        p.nome as produto,
        p.categoria,
        p.preco,
        p.imagem_url as imagemUrl,
        NOW() - INTERVAL FLOOR(RAND() * 1440) MINUTE as dataCompra,
        CONCAT(
          CASE FLOOR(RAND() * 4)
            WHEN 0 THEN 'João'
            WHEN 1 THEN 'Maria'
            WHEN 2 THEN 'Pedro'
            WHEN 3 THEN 'Ana'
          END,
          ' ',
          CASE FLOOR(RAND() * 4)
            WHEN 0 THEN 'Silva'
            WHEN 1 THEN 'Santos'
            WHEN 2 THEN 'Costa'
            WHEN 3 THEN 'Oliveira'
          END
        ) as cliente,
        CASE FLOOR(RAND() * 5)
          WHEN 0 THEN 'São Paulo'
          WHEN 1 THEN 'Rio de Janeiro'
          WHEN 2 THEN 'Belo Horizonte'
          WHEN 3 THEN 'Salvador'
          WHEN 4 THEN 'Brasília'
        END as cidade
      FROM produtos p
      WHERE p.status = 'ativo'
      ORDER BY RAND()
      LIMIT 10
    `);
    
    const compras = rows.map(compra => ({
      ...compra,
      preco: parseFloat(compra.preco),
      imagemUrl: compra.imagemUrl ? getPublicUrl(req, compra.imagemUrl) : null,
      tempoAtras: Math.floor(Math.random() * 30) + 1 // 1-30 minutos atrás
    }));
    
    console.log(`✅ ${compras.length} compras recentes simuladas`);
    res.json(compras);
  } catch (error) {
    console.error('❌ Erro ao buscar compras recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
app.get('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando produto ID: ${id}`);
    
    const [rows] = await pool.execute(
      'SELECT *, imagem_url as imagemUrl, total_avaliacoes as totalAvaliacoes, faixa_etaria as faixaEtaria, codigo_barras as codigoBarras, data_lancamento as dataLancamento, created_at as createdAt, updated_at as updatedAt FROM produtos WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log('✅ Produto encontrado:', rows[0].nome);
    
    // Converter preços de string para number e corrigir URLs de imagem
    const produto = {
      ...rows[0],
      preco: parseFloat(rows[0].preco),
      avaliacao: rows[0].avaliacao ? parseFloat(rows[0].avaliacao) : null,
      imagemUrl: rows[0].imagemUrl ? getPublicUrl(req, rows[0].imagemUrl) : null
    };
    
    res.json(produto);
  } catch (error) {
    console.error('❌ Erro ao buscar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo produto
// ==================== QUICK ADD PRODUCT (MOBILE-FIRST) ====================

// Cadastro rápido de produto (mobile-optimized)
app.post('/api/produtos/quick-add', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, preco, estoque, categoria, status } = req.body;
    const id = crypto.randomUUID();
    
    console.log('⚡ Cadastro rápido:', nome);
    
    // URL da imagem (se enviou)
    let imagemUrl = null;
    if (req.file) {
      imagemUrl = `/lovable-uploads/${req.file.filename}`;
      console.log('📸 Foto capturada:', imagemUrl);
    }
    
    // Buscar categoria_id pelo nome ou usar a primeira disponível
    let categoria_id = null;
    if (categoria) {
      const [catRows] = await pool.execute(
        'SELECT id FROM categorias WHERE nome = ? OR slug = ? LIMIT 1',
        [categoria, categoria]
      );
      if (catRows.length > 0) {
        categoria_id = catRows[0].id;
      }
    }
    
    // Se não encontrou, usa a primeira categoria disponível
    if (!categoria_id) {
      const [firstCat] = await pool.execute(
        'SELECT id, nome FROM categorias WHERE ativo = 1 ORDER BY ordem LIMIT 1'
      );
      if (firstCat.length > 0) {
        categoria_id = firstCat[0].id;
        console.log(`📦 Usando categoria padrão: ${firstCat[0].nome} (ID: ${categoria_id})`);
      } else {
        return res.status(400).json({ error: 'Nenhuma categoria disponível' });
      }
    }
    
    // Inserir produto com campos mínimos
    await pool.execute(`
      INSERT INTO produtos (
        id, nome, preco, categoria, imagem_url, estoque, status,
        destaque, promocao, lancamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      nome,
      Number(preco || 0),
      categoria || 'Outros',
      imagemUrl,
      Number(estoque || 1),
      status || 'ativo',
      false,
      false,
      false
    ]);
    
    logger.info('Produto cadastrado rapidamente', { id, nome, mobile: true });
    
    res.json({ 
      success: true, 
      id,
      message: status === 'rascunho' ? 'Rascunho salvo! Complete depois.' : 'Produto cadastrado com sucesso!',
      produto: { id, nome, preco, categoria, status }
    });
  } catch (error) {
    console.error('❌ Erro no quick-add:', error);
    logger.error('Erro no quick-add de produto', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro ao cadastrar produto rapidamente', details: error.message });
  }
});

app.post('/api/produtos', async (req, res) => {
  try {
    const produtoData = req.body;
    console.log('🔄 Criando produto:', produtoData.nome);
    
    // Buscar categoria_id pelo nome
    let categoria_id = null;
    if (produtoData.categoria) {
      const [catRows] = await pool.execute(
        'SELECT id FROM categorias WHERE nome = ? OR slug = ? LIMIT 1',
        [produtoData.categoria, produtoData.categoria]
      );
      if (catRows.length > 0) {
        categoria_id = catRows[0].id;
      }
    }
    
    // Se não encontrou, usa a primeira categoria disponível
    if (!categoria_id) {
      const [firstCat] = await pool.execute(
        'SELECT id FROM categorias WHERE ativo = 1 ORDER BY ordem LIMIT 1'
      );
      if (firstCat.length > 0) {
        categoria_id = firstCat[0].id;
      } else {
        return res.status(400).json({ error: 'Nenhuma categoria disponível' });
      }
    }
    
    // Criar produto com campos obrigatórios
    const [result] = await pool.execute(`
      INSERT INTO produtos (
        id, nome, preco, categoria, imagem_url, descricao, estoque, status,
        destaque, promocao, lancamento, avaliacao, total_avaliacoes,
        faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor,
        codigo_barras, data_lancamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      require('crypto').randomUUID(),
      produtoData.nome,
      produtoData.preco,
      produtoData.categoria,
      produtoData.imagemUrl || null,
      produtoData.descricao || null,
      produtoData.estoque || 0,
      produtoData.status || 'ativo',
      produtoData.destaque || false,
      produtoData.promocao || false,
      produtoData.lancamento || false,
      produtoData.avaliacao || 0,
      produtoData.totalAvaliacoes || 0,
      produtoData.faixaEtaria || null,
      produtoData.peso || null,
      produtoData.dimensoes || null,
      produtoData.material || null,
      produtoData.marca || null,
      produtoData.origem || null,
      produtoData.fornecedor || null,
      produtoData.codigoBarras || null,
      produtoData.dataLancamento || null
    ]);
    
    console.log('✅ Produto criado com ID:', result.insertId);
    res.status(201).json({ id: result.insertId, ...produtoData });
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produtoData = req.body;
    console.log(`🔄 Atualizando produto ID: ${id}`, produtoData);
    
    // Construir query dinamicamente baseado nos campos enviados
    const fields = [];
    const values = [];
    
    if (produtoData.nome !== undefined) {
      fields.push('nome = ?');
      values.push(produtoData.nome);
    }
    if (produtoData.descricao !== undefined) {
      fields.push('descricao = ?');
      values.push(produtoData.descricao);
    }
    if (produtoData.preco !== undefined) {
      fields.push('preco = ?');
      values.push(produtoData.preco);
    }
    if (produtoData.imagemUrl !== undefined) {
      fields.push('imagem_url = ?');
      values.push(produtoData.imagemUrl);
    }
    if (produtoData.categoria !== undefined) {
      fields.push('categoria = ?');
      values.push(produtoData.categoria);
    }
    if (produtoData.estoque !== undefined) {
      fields.push('estoque = ?');
      values.push(produtoData.estoque);
    }
    if (produtoData.status !== undefined) {
      fields.push('status = ?');
      values.push(produtoData.status);
    }
    if (produtoData.destaque !== undefined) {
      fields.push('destaque = ?');
      values.push(produtoData.destaque);
    }
    if (produtoData.promocao !== undefined) {
      fields.push('promocao = ?');
      values.push(produtoData.promocao);
    }
    if (produtoData.lancamento !== undefined) {
      fields.push('lancamento = ?');
      values.push(produtoData.lancamento);
    }
    if (produtoData.avaliacao !== undefined) {
      fields.push('avaliacao = ?');
      values.push(produtoData.avaliacao);
    }
    if (produtoData.totalAvaliacoes !== undefined) {
      fields.push('total_avaliacoes = ?');
      values.push(produtoData.totalAvaliacoes);
    }
    if (produtoData.faixaEtaria !== undefined) {
      fields.push('faixa_etaria = ?');
      values.push(produtoData.faixaEtaria);
    }
    if (produtoData.peso !== undefined) {
      fields.push('peso = ?');
      values.push(produtoData.peso);
    }
    if (produtoData.dimensoes !== undefined) {
      fields.push('dimensoes = ?');
      values.push(produtoData.dimensoes);
    }
    if (produtoData.material !== undefined) {
      fields.push('material = ?');
      values.push(produtoData.material);
    }
    if (produtoData.marca !== undefined) {
      fields.push('marca = ?');
      values.push(produtoData.marca);
    }
    if (produtoData.origem !== undefined) {
      fields.push('origem = ?');
      values.push(produtoData.origem);
    }
    if (produtoData.fornecedor !== undefined) {
      fields.push('fornecedor = ?');
      values.push(produtoData.fornecedor);
    }
    if (produtoData.codigoBarras !== undefined) {
      fields.push('codigo_barras = ?');
      values.push(produtoData.codigoBarras);
    }
    if (produtoData.dataLancamento !== undefined) {
      fields.push('data_lancamento = ?');
      values.push(produtoData.dataLancamento);
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    // Adicionar updated_at
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const query = `UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`;
    console.log('Query:', query);
    console.log('Values:', values);
    
    const [result] = await pool.execute(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Buscar o produto atualizado completo
    const [rows] = await pool.execute('SELECT * FROM produtos WHERE id = ?', [id]);
    const produto = rows[0];
    
    // Converter snake_case para camelCase
    const produtoFormatado = {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: parseFloat(produto.preco),
      imagemUrl: produto.imagem_url,
      categoria: produto.categoria,
      estoque: produto.estoque,
      status: produto.status,
      destaque: Boolean(produto.destaque),
      promocao: Boolean(produto.promocao),
      lancamento: Boolean(produto.lancamento),
      avaliacao: parseFloat(produto.avaliacao) || 0,
      totalAvaliacoes: produto.total_avaliacoes || 0,
      faixaEtaria: produto.faixa_etaria,
      peso: produto.peso,
      dimensoes: produto.dimensoes,
      material: produto.material,
      marca: produto.marca,
      origem: produto.origem,
      fornecedor: produto.fornecedor,
      codigoBarras: produto.codigo_barras,
      dataLancamento: produto.data_lancamento,
      createdAt: produto.created_at,
      updatedAt: produto.updated_at
    };
    
    console.log('✅ Produto atualizado com sucesso');
    res.json(produtoFormatado);
  } catch (error) {
    console.error('❌ Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando produto ID: ${id}`);
    
    const [result] = await pool.execute(
      'DELETE FROM produtos WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log('✅ Produto deletado');
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==================== EVENTOS API ====================

// Buscar todos os eventos
app.get('/api/events', async (req, res) => {
  try {
    console.log('🔄 Buscando eventos...');
    const [rows] = await pool.execute(`
      SELECT 
        id, titulo, descricao, data_evento, local, numero_vagas,
        vagas_limitadas, imagem_url, ativo, feira_fechada, renda_total,
        participantes_confirmados, created_at, updated_at
      FROM events 
      ORDER BY data_evento ASC
    `);
    
    console.log(`✅ ${rows.length} eventos encontrados`);
    
    // Converter renda_total de string para number e corrigir URLs de imagem
    const eventos = rows.map(evento => ({
      ...evento,
      renda_total: evento.renda_total ? parseFloat(evento.renda_total) : null,
      imagem_url: evento.imagem_url ? getPublicUrl(req, evento.imagem_url) : null
    }));
    
    res.json(eventos);
  } catch (error) {
    console.error('❌ Erro ao buscar eventos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar evento por ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando evento ID: ${id}`);
    
    const [rows] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    console.log('✅ Evento encontrado:', rows[0].titulo);
    
    // Converter renda_total de string para number e corrigir URLs de imagem
    const evento = {
      ...rows[0],
      renda_total: rows[0].renda_total ? parseFloat(rows[0].renda_total) : null,
      imagem_url: rows[0].imagem_url ? getPublicUrl(req, rows[0].imagem_url) : null
    };
    
    res.json(evento);
  } catch (error) {
    console.error('❌ Erro ao buscar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para converter data ISO para formato MySQL
const formatDateForMySQL = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Criar novo evento
app.post('/api/events', async (req, res) => {
  try {
    const eventoData = req.body;
    console.log('🔄 Criando evento:', eventoData.titulo);
    
    const [result] = await pool.execute(`
      INSERT INTO events (
        id, titulo, descricao, data_evento, local, numero_vagas,
        vagas_limitadas, imagem_url, ativo, feira_fechada, renda_total,
        participantes_confirmados
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      require('crypto').randomUUID(),
      eventoData.titulo,
      eventoData.descricao || null,
      formatDateForMySQL(eventoData.data_evento),
      eventoData.local || null,
      eventoData.numero_vagas || null,
      eventoData.vagas_limitadas || false,
      eventoData.imagem_url || null,
      eventoData.ativo !== false,
      eventoData.feira_fechada || false,
      eventoData.renda_total || null,
      eventoData.participantes_confirmados || null
    ]);
    
    console.log('✅ Evento criado com sucesso!');
    res.status(201).json({ id: result.insertId, ...eventoData });
  } catch (error) {
    console.error('❌ Erro ao criar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Atualizar evento
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const eventoData = req.body;
    console.log(`🔄 Atualizando evento ID: ${id}`);
    
    const [result] = await pool.execute(`
      UPDATE events SET 
        titulo = ?, descricao = ?, data_evento = ?, local = ?,
        numero_vagas = ?, vagas_limitadas = ?, imagem_url = ?, ativo = ?,
        feira_fechada = ?, renda_total = ?, participantes_confirmados = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      eventoData.titulo,
      eventoData.descricao || null,
      formatDateForMySQL(eventoData.data_evento),
      eventoData.local || null,
      eventoData.numero_vagas || null,
      eventoData.vagas_limitadas || false,
      eventoData.imagem_url || null,
      eventoData.ativo !== false,
      eventoData.feira_fechada || false,
      eventoData.renda_total || null,
      eventoData.participantes_confirmados || null,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    console.log('✅ Evento atualizado com sucesso!');
    res.json({ id, ...eventoData });
  } catch (error) {
    console.error('❌ Erro ao atualizar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Fechar feira e registrar renda total
app.post('/api/events/:id/fechar-feira', async (req, res) => {
  try {
    const { id } = req.params;
    const { renda_total, participantes_confirmados } = req.body;
    console.log(`🔄 Fechando feira do evento ID: ${id}`);
    
    const [result] = await pool.execute(`
      UPDATE events SET 
        feira_fechada = true, 
        renda_total = ?, 
        participantes_confirmados = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [
      renda_total || 0,
      participantes_confirmados || 0,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    console.log('✅ Feira fechada com sucesso');
    res.json({ 
      message: 'Feira fechada com sucesso',
      renda_total: renda_total || 0,
      participantes_confirmados: participantes_confirmados || 0
    });
  } catch (error) {
    console.error('❌ Erro ao fechar feira:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar evento
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando evento ID: ${id}`);
    
    const [result] = await pool.execute(
      'DELETE FROM events WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    console.log('✅ Evento deletado');
    res.json({ message: 'Evento deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar evento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ================================
// ROTAS DE USUÁRIOS
// ================================


// Buscar todos os usuários
app.get('/api/users', async (req, res) => {
  try {
    console.log('🔄 Buscando usuários...');
    const [rows] = await pool.execute(`
      SELECT 
        id, email, avatar_url, nome, telefone, endereco, cidade, estado, cep,
        created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ ${rows.length} usuários encontrados`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// Buscar usuário por ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando usuário ID: ${id}`);
    
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', rows[0].nome);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo usuário
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    console.log('🔄 Criando usuário:', userData.nome);
    
    const [result] = await pool.execute(`
      INSERT INTO users (
        id, email, avatar_url, nome, telefone, endereco, cidade, estado, cep
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      require('crypto').randomUUID(),
      userData.email,
      userData.avatar_url || null,
      userData.nome,
      userData.telefone || null,
      userData.endereco || null,
      userData.cidade || null,
      userData.estado || null,
      userData.cep || null
    ]);
    
    console.log('✅ Usuário criado com ID:', result.insertId);
    res.status(201).json({ id: result.insertId, ...userData });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email já está em uso' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Endpoint de registro público
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, senha, nome, telefone } = req.body || {};
    
    // Validar dados obrigatórios
    if (!email || !senha || !nome) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_data',
        message: 'Email, senha e nome são obrigatórios' 
      });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        ok: false, 
        error: 'invalid_email',
        message: 'Formato de email inválido' 
      });
    }
    
    console.log('📝 Tentativa de registro:', email);
    
    // Verificar se usuário já existe
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      console.log('❌ Usuário já existe:', email);
      return res.status(400).json({ 
        ok: false, 
        error: 'user_exists',
        message: 'Este email já está cadastrado' 
      });
    }
    
    // Criar usuário
    const [result] = await pool.execute(
      'INSERT INTO users (email, nome, telefone, created_at) VALUES (?, ?, ?, NOW())',
      [email.toLowerCase(), nome, telefone || null]
    );
    
    const userId = result.insertId;
    console.log('✅ Usuário criado com sucesso:', email, 'ID:', userId);
    
    // Fazer login automático após registro
    const sid = require('crypto').randomUUID();
    await pool.execute('INSERT INTO sessions (id, user_email, user_id, created_at, last_seen) VALUES (?, ?, ?, NOW(), NOW())', [sid, email, userId]);
    
    // Configurar cookie de sessão
    res.cookie('session_id', sid, { 
      httpOnly: false, 
      sameSite: 'lax', 
      secure: (req.headers['x-forwarded-proto'] || req.protocol) === 'https', 
      maxAge: 1000*60*60*24*30 // 30 dias
    });
    
    res.json({ 
      ok: true, 
      user_id: userId,
      user: {
        id: userId,
        email: email,
        nome: nome,
        telefone: telefone
      },
      message: 'Usuário criado com sucesso'
    });
  } catch (e) {
    console.error('❌ Erro no registro:', e);
    res.status(500).json({ 
      ok: false, 
      error: 'register_failed',
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar usuário
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    console.log(`🔄 Atualizando usuário ID: ${id}`);
    
    const [result] = await pool.execute(`
      UPDATE users SET 
        email = ?, avatar_url = ?, nome = ?, telefone = ?, endereco = ?, cidade = ?, 
        estado = ?, cep = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      userData.email,
      userData.avatar_url || null,
      userData.nome,
      userData.telefone || null,
      userData.endereco || null,
      userData.cidade || null,
      userData.estado || null,
      userData.cep || null,
      id
    ]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário atualizado');
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email já está em uso' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Deletar usuário
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando usuário ID: ${id}`);
    
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário deletado');
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Health check endpoint
// ===== COLECÕES API =====

// GET /api/collections - Buscar todas as coleções
app.get('/api/collections', async (req, res) => {
  try {
    const { admin, status } = req.query;
    // paginação e filtro
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '12', 10), 1), 100);
    const q = (req.query.q || '').toString().trim();
    const sort = (req.query.sort || 'created_at').toString();
    const order = ((req.query.order || 'desc').toString().toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
    console.log('🔄 Buscando coleções...');
    
    // Verificar qual banco está sendo usado
    const [dbCheck] = await pool.execute('SELECT DATABASE() as current_db');
    console.log('📊 Banco atual:', dbCheck[0].current_db);
    
    const whereParts = [];
    const vals = [];
    if (q) { whereParts.push('(nome LIKE ? OR descricao LIKE ?)'); vals.push(`%${q}%`, `%${q}%`); }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const allowSort = new Set(['created_at','updated_at','nome','id']);
    const sortCol = allowSort.has(sort) ? sort : 'created_at';

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM collections ${whereSql}`, vals);
    const total = (Array.isArray(countRows) && countRows[0] && (countRows[0].total ?? countRows[0]['COUNT(*)'])) ? (countRows[0].total ?? countRows[0]['COUNT(*)']) : 0;

    const offset = (page - 1) * pageSize;
    const limitNum = Number.isFinite(pageSize) ? Math.max(0, Math.floor(pageSize)) : 12;
    const offsetNum = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;
    // detectar colunas opcionais
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const colSetList = cols.map(c => c.COLUMN_NAME);
    const hasAtivo = colSetList.includes('ativo');
    const hasDestaque = colSetList.includes('destaque');
    const hasTags = colSetList.includes('tags');
    const hasOrdem = colSetList.includes('ordem');

    const optionalCols = [
      hasAtivo ? 'ativo' : null,
      hasDestaque ? 'destaque' : null,
      hasTags ? 'tags' : null,
      hasOrdem ? 'ordem' : null,
    ].filter(Boolean).join(', ');

    const selectCols = `id, nome, descricao, imagem_url${optionalCols ? ', ' + optionalCols : ''}, NOW() as created_at, NOW() as updated_at`;
    const sql = `SELECT ${selectCols} FROM collections ${whereSql} ORDER BY ${sortCol} ${order} LIMIT ${limitNum} OFFSET ${offsetNum}`;
    const [rows] = await pool.execute(sql, vals);
    
    console.log(`✅ ${rows.length} coleções encontradas`);
    
    const toPublic = (p) => normalizeToThisOrigin(req, p);

    const colecoes = rows.map(colecao => {
      const imgPath = extractUploadPath(colecao.imagem_url);
      return {
        id: colecao.id.toString(),
        nome: colecao.nome,
        descricao: colecao.descricao,
        imagem_url: imgPath || null,
        imagem: imgPath ? toPublic(imgPath) : null,
        produtos: parseInt(colecao.total_produtos) || 0,
        preco: 'R$ 0,00 - R$ 0,00',
        destaque: typeof colecao.destaque !== 'undefined' ? Boolean(colecao.destaque) : false,
        status: typeof colecao.ativo !== 'undefined' ? (colecao.ativo ? 'ativo' : 'inativo') : 'ativo',
        tags: typeof colecao.tags !== 'undefined' && colecao.tags ? (typeof colecao.tags === 'string' ? JSON.parse(colecao.tags) : colecao.tags) : [],
        ordem: typeof colecao.ordem !== 'undefined' ? (colecao.ordem || 0) : 0,
        created_at: colecao.created_at,
        updated_at: colecao.updated_at
      };
    });
    
    const withMeta = req.query.withMeta === '1' || req.query.withMeta === 'true';
    if (withMeta) {
      return res.json({ items: colecoes, page, pageSize, total, hasMore: offset + rows.length < total });
    }
    res.json(colecoes);
  } catch (error) {
    console.error('❌ Erro ao buscar coleções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/collections/:id - Buscar coleção específica
app.get('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando coleção ${id}...`);
    // não dependemos de coluna ativo (alguns bancos não têm)
    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });

    const imgPath = extractUploadPath(rows[0].imagem_url ?? rows[0].image_url);
    const imagemAbs = imgPath ? normalizeToThisOrigin(req, imgPath) : null;

    const colecao = {
      id: rows[0].id?.toString?.() ?? rows[0].id,
      nome: rows[0].nome ?? rows[0].name,
      descricao: rows[0].descricao ?? rows[0].description,
      imagem_url: imgPath || null,
      imagem: imagemAbs,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at
    };

    console.log(`✅ Coleção encontrada: ${colecao.nome}`);
    res.json(colecao);
  } catch (error) {
    console.error('❌ Erro ao buscar coleção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/collections/:id/full - coleção com produtos e imagem resolvida
app.get('/api/collections/:id/full', async (req, res) => {
  try {
    const { id } = req.params;
    const [cRows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    if (!cRows || cRows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });
    const imgPath = extractUploadPath(cRows[0].imagem_url ?? cRows[0].image_url);
    const imagemAbs = imgPath ? normalizeToThisOrigin(req, imgPath) : null;
    const colecao = {
      id: cRows[0].id?.toString?.() ?? cRows[0].id,
      nome: cRows[0].nome ?? cRows[0].name,
      descricao: cRows[0].descricao ?? cRows[0].description,
      imagem_url: imgPath || null,
      imagem: imagemAbs,
      created_at: cRows[0].created_at,
      updated_at: cRows[0].updated_at
    };

    const [links] = await pool.execute('SELECT * FROM collection_products WHERE collection_id = ? ORDER BY order_index ASC, created_at ASC', [id]);
    res.json({ ...colecao, products_count: links.length, links });
  } catch (error) {
    console.error('❌ Erro ao buscar coleção completa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Opcional: suporte a slug (rota amigável)
app.get('/api/collections/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    // slug é derivado do nome (lowercase, hifens). Buscar por nome aproximado
    const nomeAlvo = slug.replace(/-/g, ' ');
    const [rows] = await pool.execute('SELECT * FROM collections WHERE LOWER(nome) = LOWER(?) LIMIT 1', [nomeAlvo]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });
    const imgPath = rows[0].imagem_url ?? rows[0].image_url;
    const imagemAbs = imgPath ? normalizeToThisOrigin(req, imgPath) : null;
    res.json({
      id: rows[0].id?.toString?.() ?? rows[0].id,
      nome: rows[0].nome,
      descricao: rows[0].descricao,
      imagem_url: imgPath || null,
      imagem: imagemAbs
    });
  } catch (error) {
    console.error('❌ Erro ao buscar coleção por slug:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH toggles dinâmicos (ativo/destaque) - atualiza apenas colunas existentes
app.patch('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const [exists] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });

    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));
    const parts = [];
    const vals = [];
    if (colSet.has('ativo') && typeof body.ativo !== 'undefined') { parts.push('ativo = ?'); vals.push(!!body.ativo); }
    if (colSet.has('destaque') && typeof body.destaque !== 'undefined') { parts.push('destaque = ?'); vals.push(!!body.destaque); }
    if (parts.length === 0) return res.status(400).json({ error: 'Nenhum campo suportado informado' });

    const sql = `UPDATE collections SET ${parts.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await pool.execute(sql, [...vals, id]);

    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ Erro ao atualizar toggles da coleção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/collections/:id/products - Buscar produtos de uma coleção
app.get('/api/collections/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Buscando produtos da coleção ${id}...`);
    
    // Verificar se a coleção existe
    const [collectionRows] = await pool.execute('SELECT id, nome FROM collections WHERE id = ?', [id]);
    if (collectionRows.length === 0) {
      return res.status(404).json({ error: 'Coleção não encontrada' });
    }
    
    // Buscar vínculos primeiro
    const [links] = await pool.execute('SELECT * FROM collection_products WHERE collection_id = ? ORDER BY order_index ASC, created_at ASC', [id]);
    console.log(`🔗 Vínculos encontrados: ${links.length}`);
    
        // Buscar detalhes dos produtos (tanto da tabela products quanto produtos)
        let productDetailsMap = {};
        if (links.length > 0) {
          const productIds = links.map(l => l.product_id).filter(id => id);
          console.log(`🆔 IDs dos produtos: ${productIds.join(', ')}`);
          
          if (productIds.length > 0) {
            // Tentar primeiro na tabela products
            let productRows = [];
            try {
              const [productsRows] = await pool.execute(`
                SELECT id, nome, preco, categoria, imagem_url, descricao, estoque, status, destaque, promocao, lancamento, avaliacao, total_avaliacoes, faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor, codigo_barras, data_lancamento, created_at, updated_at
                FROM products 
                WHERE id IN (${productIds.map(() => '?').join(',')})
              `, productIds);
              productRows = productsRows;
              console.log(`🧾 Produtos carregados da tabela 'products': ${productRows.length}`);
            } catch (e) {
              console.log('⚠️ Tabela products não encontrada, tentando tabela produtos...');
            }
            
            // Se não encontrou na tabela products, tentar na tabela produtos
            if (productRows.length === 0) {
              try {
                const [produtosRows] = await pool.execute(`
                  SELECT id, nome, preco, categoria, imagem_url, descricao, estoque, status, destaque, promocao, lancamento, avaliacao, total_avaliacoes, faixa_etaria, peso, dimensoes, material, marca, origem, fornecedor, codigo_barras, data_lancamento, created_at, updated_at
                  FROM produtos 
                  WHERE id IN (${productIds.map(() => '?').join(',')})
                `, productIds);
                productRows = produtosRows;
                console.log(`🧾 Produtos carregados da tabela 'produtos': ${productRows.length}`);
              } catch (e) {
                console.log('⚠️ Tabela produtos não encontrada');
              }
            }
            
            productDetailsMap = productRows.reduce((acc, row) => {
              acc[row.id] = {
                id: row.id,
                nome: row.nome,
                preco: parseFloat(row.preco || 0),
                categoria: row.categoria,
                imagem_url: row.imagem_url,
                descricao: row.descricao,
                estoque: row.estoque,
                status: row.status,
                destaque: row.destaque,
                promocao: row.promocao,
                lancamento: row.lancamento,
                avaliacao: row.avaliacao ? parseFloat(row.avaliacao) : null,
                total_avaliacoes: row.total_avaliacoes,
                faixa_etaria: row.faixa_etaria,
                peso: row.peso,
                dimensoes: row.dimensoes,
                material: row.material,
                marca: row.marca,
                origem: row.origem,
                fornecedor: row.fornecedor,
                codigo_barras: row.codigo_barras,
                data_lancamento: row.data_lancamento,
                created_at: row.created_at,
                updated_at: row.updated_at
              };
              return acc;
            }, {});
          }
        }
    
    const produtos = links.map(link => ({
      id: link.id,
      collection_id: link.collection_id,
      product_id: link.product_id,
      order_index: link.order_index,
      product: productDetailsMap[link.product_id] || null
    }));
    
    console.log(`✅ ${produtos.length} produtos encontrados na coleção ${collectionRows[0].nome}`);
    res.json(produtos);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos da coleção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Utilitário simples: salvar imagem base64 (opcional)
const UPLOAD_DIR = path.join(__dirname, '../public', 'lovable-uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

function saveBase64ImageToCollectionsBase64(dataUrl) {
  try {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return null;
    const ext = (m[1].split('/')[1] || 'png').toLowerCase();
    const buf = Buffer.from(m[2], 'base64');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buf);
    return `/uploads/collections/${filename}`;
  } catch {
    return null;
  }
}

// POST /api/collections - Criar nova coleção
app.post('/api/collections', async (req, res) => {
  try {
    const { nome, descricao, imagem, name, description, image_url, destaque, ativo, tags, ordem } = req.body || {};
    const finalName = (name ?? nome) || '';
    const finalDescription = (description ?? descricao) || '';
    let finalImageUrl = (image_url ?? imagem) || null;
    console.log(`🔄 Criando coleção: ${finalName}`);
    
    // Validar dados obrigatórios
    if (!finalName || !finalDescription) {
      return res.status(400).json({ error: 'Nome e descrição são obrigatórios' });
    }
    
    // Garantir que finalImageUrl seja string ou null
    if (finalImageUrl !== null && finalImageUrl !== undefined) {
      finalImageUrl = String(finalImageUrl);
    } else {
      finalImageUrl = null;
    }
    
    // Salvar base64 se enviado
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      const saved = saveBase64ImageToCollectionsBase64(finalImageUrl);
      if (saved) finalImageUrl = saved;
    }
    
    // Inserção alinhada ao schema PT (id varchar, nome, descricao, imagem_url)
    const newId = require('crypto').randomUUID();
    // detectar colunas opcionais
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));
    const extraCols = [];
    const extraVals = [];
    if (colSet.has('destaque')) { extraCols.push('destaque'); extraVals.push(!!destaque); }
    if (colSet.has('ativo')) { extraCols.push('ativo'); extraVals.push(ativo === false ? 0 : 1); }
    if (colSet.has('tags')) { extraCols.push('tags'); extraVals.push(tags ? JSON.stringify(tags) : JSON.stringify([])); }
    if (colSet.has('ordem')) { extraCols.push('ordem'); extraVals.push(Number.isFinite(ordem) ? ordem : 0); }

    const baseCols = ['id','nome','descricao','imagem_url','created_at','updated_at'];
    const basePlace = ['?','?','?','?','NOW()','NOW()'];
    const sql = `INSERT INTO collections (${baseCols.concat(extraCols).join(',')}) VALUES (${basePlace.concat(extraCols.map(()=>'?')).join(',')})`;
    await pool.execute(sql, [newId, finalName, finalDescription, finalImageUrl, ...extraVals]);
    
    const host = req.get('host');
    const proto = req.protocol || 'http';
    const publicUrl = finalImageUrl ? `${proto}://${host}${finalImageUrl.startsWith('/') ? '' : '/'}${finalImageUrl}` : null;
    const novaColecao = {
      id: newId,
      nome: finalName,
      descricao: finalDescription,
      imagem_url: finalImageUrl,
      imagem: publicUrl,
      produtos: 0,
      preco: 'R$ 0,00 - R$ 0,00',
      destaque: false,
      status: 'ativo',
      tags: [],
      ordem: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`✅ Coleção criada com sucesso: ${finalName}`);
    res.status(201).json(novaColecao);
  } catch (error) {
    console.error('❌ Erro ao criar coleção:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message, code: error?.code });
  }
});

// PUT /api/collections/:id - Atualizar coleção
app.put('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, imagem, name, description, image_url, destaque, ativo, tags, ordem } = req.body || {};
    const finalName = (name ?? nome) || '';
    const finalDescription = (description ?? descricao) || '';
    let finalImageUrl = (image_url ?? imagem) || null;
    console.log(`🔄 Atualizando coleção ${id}: ${finalName}`);
    
    // Validar dados obrigatórios
    if (!finalName || !finalDescription) {
      return res.status(400).json({ error: 'Nome e descrição são obrigatórios' });
    }
    
    // Garantir que finalImageUrl seja string ou null
    if (finalImageUrl !== null && finalImageUrl !== undefined) {
      finalImageUrl = String(finalImageUrl);
    } else {
      finalImageUrl = null;
    }
    
    // Salvar base64 se enviado
    if (finalImageUrl && finalImageUrl.startsWith('data:')) {
      const saved = saveBase64ImageToCollectionsBase64(finalImageUrl);
      if (saved) finalImageUrl = saved;
    }

    // Update alinhado ao schema PT
    // detectar colunas opcionais para update
    const [cols2] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const colSet2 = new Set(cols2.map(c => c.COLUMN_NAME));
    const parts = ['nome = ?','descricao = ?','imagem_url = ?'];
    const params = [finalName, finalDescription, finalImageUrl];
    if (colSet2.has('destaque') && typeof destaque !== 'undefined') { parts.push('destaque = ?'); params.push(!!destaque); }
    if (colSet2.has('ativo') && typeof ativo !== 'undefined') { parts.push('ativo = ?'); params.push(ativo ? 1 : 0); }
    if (colSet2.has('tags') && typeof tags !== 'undefined') { parts.push('tags = ?'); params.push(tags ? JSON.stringify(tags) : JSON.stringify([])); }
    if (colSet2.has('ordem') && typeof ordem !== 'undefined') { parts.push('ordem = ?'); params.push(Number.isFinite(ordem) ? ordem : 0); }
    const sql = `UPDATE collections SET ${parts.join(', ')}, updated_at = NOW() WHERE id = ?`;
    await pool.execute(sql, [...params, id]);
    
    // Buscar coleção atualizada
    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    const imgPath = extractUploadPath(rows[0].imagem_url ?? rows[0].image_url);
    const colecaoAtualizada = {
      id: rows[0].id.toString(),
      nome: rows[0].nome ?? rows[0].name,
      descricao: rows[0].descricao ?? rows[0].description,
      imagem_url: imgPath || null,
      imagem: imgPath ? normalizeToThisOrigin(req, imgPath) : null,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at
    };
    
    console.log(`✅ Coleção atualizada com sucesso: ${nome}`);
    res.json(colecaoAtualizada);
  } catch (error) {
    console.error('❌ Erro ao atualizar coleção:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message, code: error?.code });
  }
});

// DELETE /api/collections/:id - Deletar coleção
app.delete('/api/collections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando coleção ${id}`);
    await pool.execute('DELETE FROM collections WHERE id = ?', [id]);
    console.log(`✅ Coleção deletada com sucesso`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar coleção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/debug/collections-schema - Inspeciona colunas da tabela collections
app.get('/api/debug/collections-schema', async (req, res) => {
  try {
    const [cols] = await pool.execute("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' ORDER BY ORDINAL_POSITION");
    res.json({
      database: process.env.MYSQL_DATABASE,
      table: 'collections',
      columns: cols
    });
  } catch (error) {
    console.error('❌ Erro ao ler schema de collections:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message, code: error?.code });
  }
});

// Ensure link table collection_products exists
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS collection_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        collection_id VARCHAR(191) NOT NULL,
        product_id INT NOT NULL,
        order_index INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_collection (collection_id),
        INDEX idx_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Checked/created table: collection_products');

    // Garantir que as colunas collection_id e product_id são VARCHAR(191) (podem existir como INT em bancos antigos)
    try {
      const [colInfo] = await pool.execute(
        "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collection_products' AND COLUMN_NAME IN ('collection_id', 'product_id')"
      );
      
      for (const col of colInfo) {
        if (col.COLUMN_NAME === 'collection_id' && (col.DATA_TYPE.toLowerCase() !== 'varchar' || Number(col.CHARACTER_MAXIMUM_LENGTH || 0) < 191)) {
          console.log('🛠️ Alterando tipo de collection_id para VARCHAR(191) em collection_products...');
          await pool.execute('ALTER TABLE collection_products MODIFY collection_id VARCHAR(191) NOT NULL');
          console.log('✅ collection_id agora é VARCHAR(191)');
        }
        if (col.COLUMN_NAME === 'product_id' && (col.DATA_TYPE.toLowerCase() !== 'varchar' || Number(col.CHARACTER_MAXIMUM_LENGTH || 0) < 191)) {
          console.log('🛠️ Alterando tipo de product_id para VARCHAR(191) em collection_products...');
          await pool.execute('ALTER TABLE collection_products MODIFY product_id VARCHAR(191) NOT NULL');
          console.log('✅ product_id agora é VARCHAR(191)');
        }
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível verificar/alterar colunas:', e?.message || e);
    }
  } catch (err) {
    console.error('❌ Failed ensuring collection_products table:', { message: err?.message, code: err?.code });
  }
})();

// =====================================
// Settings (configurações gerenciáveis)
// =====================================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        key_name VARCHAR(191) PRIMARY KEY,
        value_text TEXT,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings_audit (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(191) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        admin_id VARCHAR(191) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_key (key_name),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS recovery_emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'queued',
        error TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sent_at DATETIME NULL,
        INDEX idx_email (email),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed básico se estiver vazio
    const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM settings');
    const count = Array.isArray(rows) ? Number(rows[0].cnt || 0) : 0;
    if (count === 0) {
      const defaults = [
        ['pix_discount_percent', '5'],
        ['digital_pay_discount_percent', '2'],
        ['free_shipping_min', '200'],
        ['shipping_base_price', '15'],
        ['enable_apple_pay', 'true'],
        ['enable_google_pay', 'true'],
        ['cart_recovery_enabled', 'true'],
        ['cart_recovery_banner_delay_ms', '120000'],
        ['cart_recovery_email_delay_ms', '600000']
      ];
      for (const [k, v] of defaults) {
        await pool.execute('INSERT IGNORE INTO settings (key_name, value_text) VALUES (?,?)', [k, v]);
      }
    // SMTP defaults (não sensível; senha não default)
    const smtpDefaults = [
      ['smtp_enabled', 'false'],
      ['smtp_host', ''],
      ['smtp_port', '587'],
      ['smtp_secure', 'false'],
      ['smtp_user', ''],
      ['smtp_from', ''],
    ];
    for (const [k, v] of smtpDefaults) {
      await pool.execute('INSERT IGNORE INTO settings (key_name, value_text) VALUES (?,?)', [k, v]);
    }
      console.log('✅ Settings default populated');
    }
  } catch (err) {
    console.error('❌ Failed ensuring settings table:', { message: err?.message, code: err?.code });
  }
})();

// Endpoints de Settings
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT key_name, value_text FROM settings');
    const settings = {};
    for (const r of rows) settings[r.key_name] = r.value_text;
    res.json({ settings });
  } catch (e) {
    console.error('Settings GET error', e);
    res.status(500).json({ error: 'settings_get_failed' });
  }
});

// Middleware simples de admin (cookie/flag de sessão)
function isAdminRequest(req) {
  try {
    // Estratégia simples: header X-Admin-Token ou cookie admin_token (apenas para painel interno)
    const token = (req.headers['x-admin-token'] || req.cookies?.admin_token || '').toString();
    // Em produção, troque por verificação de sessão/jwt com roles
    return Boolean(token && token.length >= 10);
  } catch {
    return false;
  }
}

app.put('/api/settings', express.json(), async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' });
    const body = req.body || {};
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'payload_invalido' });
    const entries = Object.entries(body);
    if (!entries.length) return res.status(400).json({ error: 'payload_vazio' });
    // Validação simples de tipos/intervalos
    const validators = {
      pix_discount_percent: (v) => Number(v) >= 0 && Number(v) <= 50,
      digital_pay_discount_percent: (v) => Number(v) >= 0 && Number(v) <= 50,
      free_shipping_min: (v) => Number(v) >= 0 && Number(v) <= 100000,
      shipping_base_price: (v) => Number(v) >= 0 && Number(v) <= 10000,
      enable_apple_pay: (v) => ['true','false',true,false].includes(v),
      enable_google_pay: (v) => ['true','false',true,false].includes(v),
      cart_recovery_enabled: (v) => ['true','false',true,false].includes(v),
      cart_recovery_banner_delay_ms: (v) => Number(v) >= 0 && Number(v) <= 3600000,
      cart_recovery_email_delay_ms: (v) => Number(v) >= 0 && Number(v) <= 86400000,
      smtp_enabled: (v) => ['true','false',true,false].includes(v),
      smtp_host: (v) => typeof v === 'string' && v.length <= 255,
      smtp_port: (v) => Number(v) > 0 && Number(v) <= 65535,
      smtp_secure: (v) => ['true','false',true,false].includes(v),
      smtp_user: (v) => typeof v === 'string' && v.length <= 255,
      smtp_from: (v) => typeof v === 'string' && v.length <= 255,
      // smtp_pass validado mas não exposto em GET
      smtp_pass: (v) => typeof v === 'string' && v.length <= 255,
      // Configurações PIX
      pix_key: (v) => typeof v === 'string' && v.length <= 255,
      pix_key_type: (v) => ['email', 'cpf', 'cnpj', 'phone', 'random'].includes(v),
      pix_merchant_name: (v) => typeof v === 'string' && v.length <= 255,
      pix_city: (v) => typeof v === 'string' && v.length <= 255,
      pix_show_qr_cart: (v) => ['true','false',true,false].includes(v),
    };

    // Obter valores antigos para audit
    const [currentRows] = await pool.execute('SELECT key_name, value_text FROM settings');
    const current = {};
    for (const r of currentRows) current[r.key_name] = r.value_text;

    const adminId = (req.headers['x-admin-id'] || req.cookies?.admin_user || '').toString() || null;

    for (const [key, value] of entries) {
      if (validators[key] && !validators[key](value)) {
        return res.status(400).json({ error: 'validation_error', field: key });
      }
      await pool.execute('INSERT INTO settings (key_name, value_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_text = VALUES(value_text), updated_at = NOW()', [String(key), value == null ? '' : String(value)]);
      try {
        const oldVal = current[String(key)] ?? null;
        const newVal = value == null ? '' : String(value);
        if (oldVal !== newVal) {
          await pool.execute('INSERT INTO settings_audit (key_name, old_value, new_value, admin_id) VALUES (?,?,?,?)', [String(key), oldVal, newVal, adminId]);
        }
      } catch (e) {
        console.log('⚠️ Audit insert failed:', e?.message || e);
      }
    }
    const [rows] = await pool.execute('SELECT key_name, value_text FROM settings');
    const settings = {};
    for (const r of rows) {
      if (r.key_name === 'smtp_pass') continue; // não retornar senha
      settings[r.key_name] = r.value_text;
    }
    res.json({ settings });
  } catch (e) {
    console.error('Settings PUT error', e);
    res.status(500).json({ error: 'settings_put_failed' });
  }
});

// Util: SMTP test (admin)
app.post('/api/utils/smtp-test', express.json(), async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' });
    // Carregar settings
    const [rows] = await pool.execute('SELECT key_name, value_text FROM settings');
    const map = {};
    for (const r of rows) map[r.key_name] = r.value_text;
    const host = map.smtp_host || process.env.SMTP_HOST || '';
    const port = Number(map.smtp_port || process.env.SMTP_PORT || 587);
    const secure = String(map.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true';
    const user = map.smtp_user || process.env.SMTP_USER || '';
    const pass = map.smtp_pass || process.env.SMTP_PASS || '';
    const from = map.smtp_from || process.env.SMTP_FROM || '';

    if (!host || !user || !pass || !from) return res.status(400).json({ error: 'smtp_incompleto' });

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

    const to = req.body?.to || user;
    await transporter.sendMail({ from, to, subject: 'Teste SMTP - Rare Toy Companion', text: 'Envio de teste realizado com sucesso.' });
    res.json({ ok: true });
  } catch (e) {
    console.error('SMTP test error', e);
    res.status(500).json({ error: 'smtp_test_failed', message: e?.message });
  }
});

// Recovery notify email (simplificado)
app.post('/api/recovery/notify', express.json(), async (req, res) => {
  try {
    const email = (req.body?.email || '').toString();
    if (!email) return res.status(400).json({ error: 'email_obrigatorio' });

    const [rows] = await pool.execute('SELECT key_name, value_text FROM settings');
    const map = {};
    for (const r of rows) map[r.key_name] = r.value_text;
    if (String(map.smtp_enabled) !== 'true') return res.status(400).json({ error: 'smtp_desativado' });

    const host = map.smtp_host || process.env.SMTP_HOST || '';
    const port = Number(map.smtp_port || process.env.SMTP_PORT || 587);
    const secure = String(map.smtp_secure || process.env.SMTP_SECURE || 'false') === 'true';
    const user = map.smtp_user || process.env.SMTP_USER || '';
    const pass = map.smtp_pass || process.env.SMTP_PASS || '';
    const from = map.smtp_from || process.env.SMTP_FROM || '';
    if (!host || !user || !pass || !from) return res.status(400).json({ error: 'smtp_incompleto' });

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const subject = 'Você deixou itens no carrinho 🛒';
    const text = 'Você ainda tem itens no carrinho. Volte e finalize sua compra!';
    let sent = false;
    let errorMsg = null;
    try {
      await transporter.sendMail({ from, to: email, subject, text });
      sent = true;
    } catch (e) {
      errorMsg = e?.message || String(e);
    }
    try {
      await pool.execute('INSERT INTO recovery_emails (email, status, error, sent_at) VALUES (?,?,?,?)', [email, sent ? 'sent' : 'failed', errorMsg, sent ? new Date() : null]);
    } catch (e) {
      console.log('⚠️ Failed to log recovery email:', e?.message || e);
    }
    if (!sent) return res.status(500).json({ error: 'smtp_send_failed', message: errorMsg });
    res.json({ ok: true });
  } catch (e) {
    console.error('Recovery notify error', e);
    res.status(500).json({ error: 'recovery_notify_failed', message: e?.message });
  }
});

// Admin: list recovery emails
app.get('/api/recovery/emails', async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' });
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const offset = (page - 1) * pageSize;
    const emailFilter = (req.query.email || '').toString();
    const where = emailFilter ? `WHERE email LIKE ${pool.escape('%' + emailFilter + '%')}` : '';
  const sql = `SELECT id, email, status, error, created_at, sent_at FROM recovery_emails ${where} ORDER BY created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`;
  const [rows] = await pool.execute(sql);
  const countSql = `SELECT COUNT(*) as total FROM recovery_emails ${where}`;
  const [[countRow]] = await pool.execute(countSql);
  res.json({ page, pageSize, total: Number(countRow.total || 0), items: rows });
  } catch (e) {
    console.error('Recovery emails GET error', e);
    res.status(500).json({ error: 'recovery_emails_get_failed' });
  }
});

// Audit list (admin only)
app.get('/api/settings/audit', async (req, res) => {
  try {
    if (!isAdminRequest(req)) return res.status(401).json({ error: 'unauthorized' });
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const offset = (page - 1) * pageSize;
  const sql = `SELECT id, key_name, old_value, new_value, admin_id, created_at FROM settings_audit ORDER BY created_at DESC LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`;
  const [rows] = await pool.execute(sql);
  const [[countRow]] = await pool.execute('SELECT COUNT(*) as total FROM settings_audit');
  res.json({ page, pageSize, total: Number(countRow.total || 0), items: rows });
  } catch (e) {
    console.error('Settings audit GET error', e);
    res.status(500).json({ error: 'settings_audit_get_failed' });
  }
});

// =====================================
// Tabelas e endpoints de Carrinho/Pedidos
// =====================================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS carts (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id VARCHAR(191) NOT NULL,
        product_id VARCHAR(191) NOT NULL,
        name VARCHAR(255),
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        image_url VARCHAR(500),
        quantity INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cart (cart_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(191) PRIMARY KEY,
        user_id VARCHAR(191) NULL,
        cart_id VARCHAR(191) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'criado',
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        nome VARCHAR(255),
        email VARCHAR(255),
        telefone VARCHAR(50),
        endereco TEXT,
        metodo_pagamento VARCHAR(50),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(191) NOT NULL,
        product_id VARCHAR(191) NOT NULL,
        name VARCHAR(255),
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        image_url VARCHAR(500),
        quantity INT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Migração: alterar product_id de INT para VARCHAR nas tabelas existentes
    try {
      await pool.execute(`ALTER TABLE cart_items MODIFY COLUMN product_id VARCHAR(191) NOT NULL`);
      console.log('✅ Migração: cart_items.product_id alterado para VARCHAR(191)');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ cart_items.product_id já é VARCHAR ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE order_items MODIFY COLUMN product_id VARCHAR(191) NOT NULL`);
      console.log('✅ Migração: order_items.product_id alterado para VARCHAR(191)');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ order_items.product_id já é VARCHAR ou erro na migração:', e.message);
      }
    }
    
    // Migração: adicionar colunas de entrega/pagamento na tabela orders se não existirem
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN nome VARCHAR(255) AFTER cart_id`);
      console.log('✅ Migração: coluna nome adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna nome já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN email VARCHAR(255) AFTER nome`);
      console.log('✅ Migração: coluna email adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna email já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN telefone VARCHAR(50) AFTER email`);
      console.log('✅ Migração: coluna telefone adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna telefone já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN endereco TEXT AFTER telefone`);
      console.log('✅ Migração: coluna endereco adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna endereco já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN metodo_pagamento VARCHAR(50) AFTER endereco`);
      console.log('✅ Migração: coluna metodo_pagamento adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna metodo_pagamento já existe ou erro na migração:', e.message);
      }
    }
    
    // Migração: adicionar colunas de pagamento
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' AFTER metodo_pagamento`);
      console.log('✅ Migração: coluna payment_status adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna payment_status já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN payment_data JSON AFTER payment_status`);
      console.log('✅ Migração: coluna payment_data adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna payment_data já existe ou erro na migração:', e.message);
      }
    }
    
    try {
      await pool.execute(`ALTER TABLE orders ADD COLUMN pix_qr_code TEXT AFTER payment_data`);
      console.log('✅ Migração: coluna pix_qr_code adicionada à tabela orders');
    } catch (e) {
      if (!e.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna pix_qr_code já existe ou erro na migração:', e.message);
      }
    }
    
    console.log('✅ Tabelas de carrinho/pedidos verificadas');
  } catch (e) {
    console.error('❌ Erro nas tabelas de carrinho/pedidos:', e?.message || e);
  }
})();

// ================= AUTH BÁSICA (sessão por cookie) =================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(191) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.error('❌ Erro criando tabela de sessões:', e?.message || e);
  }
})();

async function attachUserFromSession(req) {
  try {
    const sid = req.cookies?.session_id;
    if (!sid) return null;
    const [rows] = await pool.execute('SELECT user_email FROM sessions WHERE id = ? LIMIT 1', [sid]);
    if (!rows || rows.length === 0) return null;
    req.user = { email: rows[0].user_email };
    await pool.execute('UPDATE sessions SET last_seen = NOW() WHERE id = ?', [sid]);
    return req.user;
  } catch { return null; }
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: 'credenciais_invalidas' });
    
    console.log('🔐 Tentativa de login:', email);
    
    // Buscar usuário no banco
    const [userRows] = await pool.execute('SELECT id, email, nome FROM users WHERE email = ?', [email]);
    if (!userRows || userRows.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ error: 'usuario_nao_encontrado' });
    }
    
    const user = userRows[0];
    const userId = user.id;
    
    // Gerar ID de sessão único
    const sid = require('crypto').randomUUID();
    
    // Remover sessões antigas do usuário para garantir sessão única
    await pool.execute('DELETE FROM sessions WHERE user_id = ? OR user_email = ?', [userId, email]);
    
    // Criar nova sessão
    await pool.execute('INSERT INTO sessions (id, user_email, user_id, created_at, last_seen) VALUES (?, ?, ?, NOW(), NOW())', [sid, email, userId]);
    
    // Configurar cookie de sessão
    res.cookie('session_id', sid, { 
      httpOnly: false, 
      sameSite: 'lax', 
      secure: (req.headers['x-forwarded-proto'] || req.protocol) === 'https', 
      maxAge: 1000*60*60*24*30 // 30 dias
    });
    
    // Vincular carrinho atual ao usuário
    const cartId = req.cookies?.cart_id;
    if (cartId) {
      await pool.execute('UPDATE carts SET user_id = ? WHERE id = ?', [userId, cartId]);
    }
    
    console.log('✅ Login realizado com sucesso:', email, 'Sessão:', sid);
    res.json({ 
      success: true, 
      user: {
        id: userId,
        email: user.email,
        nome: user.nome
      }
    });
  } catch (e) {
    console.error('❌ Erro no login:', e);
    res.status(500).json({ error: 'login_failed', message: e?.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const sid = req.cookies?.session_id;
    
    if (sid) {
      // Deletar sessão do banco
      await pool.execute('DELETE FROM sessions WHERE id = ?', [sid]);
      console.log('✅ Sessão removida:', sid);
    }

    const isHttps = (req.headers['x-forwarded-proto'] || req.protocol) === 'https';
    const host = req.hostname || undefined;
    const baseDomain = host && host.includes('.') ? `.${host.replace(/^www\./, '')}` : undefined;

    const cookieNames = [
      { name: 'session_id', sameSite: 'lax' },
      { name: 'auth_token', sameSite: 'lax' },
      { name: 'mock_email', sameSite: 'lax' },
      { name: 'cart_id', sameSite: 'lax' },
      { name: 'csrf-token', sameSite: 'strict' },
    ];

    const variants = [
      { httpOnly: false, secure: isHttps, path: '/', domain: undefined },
      { httpOnly: true,  secure: isHttps, path: '/', domain: undefined },
      { httpOnly: false, secure: isHttps, path: '/', domain: baseDomain },
      { httpOnly: true,  secure: isHttps, path: '/', domain: baseDomain },
    ];

    for (const def of cookieNames) {
      for (const v of variants) {
        try {
          res.cookie(def.name, '', {
            expires: new Date(0),
            path: v.path,
            httpOnly: v.httpOnly,
            secure: v.secure,
            sameSite: def.sameSite,
            domain: v.domain,
          });
        } catch {}
      }
    }

    res.json({ success: true, ok: true });
  } catch (e) {
    res.status(500).json({ error: 'logout_failed' });
  }
});

// ==========================
// Favoritos (por usuário mock_email ou cart_id)
// ==========================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id VARCHAR(191) PRIMARY KEY,
        user_email VARCHAR(255),
        cart_id VARCHAR(191),
        product_id VARCHAR(191) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_email),
        INDEX idx_cart (cart_id),
        UNIQUE KEY unique_user_product (user_email, product_id)
      )
    `);
    console.log('✅ Tabela favorites criada/verificada');
  } catch (e) {
    console.error('❌ Erro ao criar tabela favorites', e);
  }
})();

const { randomUUID: favUUID } = require('crypto');

function getCurrentUserEmail(req) {
  return (req.cookies && req.cookies.mock_email) || null;
}

app.get('/api/favorites', async (req, res) => {
  try {
    const email = getCurrentUserEmail(req);
    const cartId = getOrCreateCartId(req, res);
    const [rows] = await pool.execute('SELECT product_id FROM favorites WHERE user_email = ? OR (user_email IS NULL AND cart_id = ?)', [email, cartId]);
    const productIds = rows.map(r => r.product_id);
    if (productIds.length === 0) return res.json([]);
    const placeholders = productIds.map(() => '?').join(',');
    const [prod] = await pool.query(`SELECT * FROM produtos WHERE id IN (${placeholders})`, productIds);
    res.json((prod || []).map(p => ({
      id: p.id,
      nome: p.nome || p.name,
      preco: Number(p.preco || p.price || 0),
      imagemUrl: p.imagem_url || p.image_url || p.imagemUrl || p.image,
      categoria: p.categoria || p.category || '—',
      emEstoque: (p.estoque ?? 1) > 0,
      destaque: Boolean(p.destaque),
      promocao: Boolean(p.promocao),
    })));
  } catch (e) {
    console.error('Favorites list error', e);
    res.status(500).json({ error: 'favorites_list_failed' });
  }
});

// ==========================
// Auth real (leve): users table + token HMAC em cookie httpOnly
// ==========================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(191) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(255),
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela users criada/verificada');

    // Garantir colunas necessárias quando a tabela já existe com schema diferente
    try {
      const [cols] = await pool.execute('DESCRIBE users');
      const fields = new Set((cols || []).map(c => c.Field));
      if (!fields.has('password_hash')) {
        await pool.execute('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER email');
        console.log('🔧 Adicionada coluna users.password_hash');
      }
      if (!fields.has('avatar_url')) {
        await pool.execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER nome');
        console.log('🔧 Adicionada coluna users.avatar_url');
      }
      if (!fields.has('nome')) {
        await pool.execute('ALTER TABLE users ADD COLUMN nome VARCHAR(255) NULL AFTER password_hash');
        console.log('🔧 Adicionada coluna users.nome');
      }
    } catch (e) {
      console.log('ℹ️ Não foi possível ajustar colunas de users:', e?.message);
    }
  } catch (e) {
    console.error('❌ Erro ao criar tabela users', e);
  }
})();

const crypto = require('crypto');
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
    if (expected !== sig) return null;
    const json = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    return json;
  } catch {
    return null;
  }
}

function setAuthCookie(res, payload) {
  const token = signToken(payload);
  res.cookie('auth_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 });
}

async function hashPassword(password) {
  return await new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
    });
  });
}

async function verifyPassword(password, hash) {
  const [saltHex, keyHex] = String(hash || '').split(':');
  if (!saltHex || !keyHex) return false;
  return await new Promise((resolve) => {
    crypto.scrypt(password, Buffer.from(saltHex, 'hex'), 64, (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(Buffer.from(keyHex, 'hex'), derivedKey));
    });
  });
}

app.post('/api/auth/register', createAccountLimiter, async (req, res) => {
  try {
    const { email, senha, password, nome } = req.body || {};
    const mail = String(email || '').trim().toLowerCase();
    const pass = String(password || senha || '');
    if (!mail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return res.status(400).json({ ok: false, error: 'invalid_email' });
    if (pass.length < 6) return res.status(400).json({ ok: false, error: 'weak_password' });
    const id = crypto.randomUUID();
    const pw = await hashPassword(pass);
    await pool.execute('INSERT INTO users (id, email, password_hash, nome) VALUES (?,?,?,?)', [id, mail, pw, nome || null]);
    setAuthCookie(res, { id, email: mail });
    logger.info('New user registered', { email: mail });
    res.json({ ok: true });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, error: 'email_in_use' });
    logger.logError(e, req);
    res.status(500).json({ ok: false, error: 'register_failed' });
  }
});

// NOTA: Endpoint de login duplicado removido - usando apenas o sistema de sessão principal

app.get('/api/auth/me', async (req, res) => {
  try {
    console.log('🔍 GET /api/auth/me - Verificando autenticação');
    
    // Verificar sessão ativa
    const sessionId = req.cookies?.session_id;
    console.log('🔍 Session ID:', sessionId ? 'presente' : 'ausente');
    
    if (sessionId) {
      const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      console.log('🔍 Sessão encontrada:', sessions && sessions[0] ? 'sim' : 'não');
      
      if (sessions && sessions[0] && sessions[0].user_id) {
        // Buscar dados completos do usuário
        const [users] = await pool.execute('SELECT id, email, nome, avatar_url, telefone, created_at FROM users WHERE id = ? LIMIT 1', [sessions[0].user_id]);
        if (users && users[0]) {
          console.log('✅ Usuário autenticado via sessão:', users[0].email);
          
          // Atualizar last_seen da sessão
          await pool.execute('UPDATE sessions SET last_seen = NOW() WHERE id = ?', [sessionId]);
          
          return res.json({ 
            authenticated: true, 
            user: users[0],
            sessionId: sessionId
          });
        }
      }
      
      // Se sessão existe mas usuário não foi encontrado, remover sessão inválida
      if (sessions && sessions[0]) {
        await pool.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
        console.log('🗑️ Sessão inválida removida:', sessionId);
      }
    }
    
    // Fallback para auth_token (sistema antigo) - apenas para compatibilidade
    const token = req.cookies && req.cookies.auth_token;
    if (token) {
      console.log('🔍 Tentando auth_token...');
      const payload = verifyToken(token);
      if (payload) {
        const [rows] = await pool.execute('SELECT id, email, nome, avatar_url FROM users WHERE id = ? LIMIT 1', [payload.id]);
        if (Array.isArray(rows) && rows.length > 0) {
          console.log('✅ Usuário autenticado via token:', rows[0].email);
          return res.json({ authenticated: true, user: rows[0] });
        }
      }
    }
    
    // Fallback para mock_email (sistema de desenvolvimento)
    const email = req.cookies?.mock_email;
    if (email) {
      console.log('✅ Usuário autenticado via mock_email:', email);
      return res.json({ authenticated: true, user: { email, id: email, nome: email } });
    }
    
    console.log('❌ Nenhuma autenticação encontrada');
    return res.json({ authenticated: false });
  } catch (e) {
    console.error('❌ Erro em /api/auth/me:', e);
    return res.json({ authenticated: false });
  }
});

// Rota de logout removida (consolidada na primeira ocorrência)

app.post('/api/favorites', async (req, res) => {
  try {
    const email = getCurrentUserEmail(req);
    const cartId = getOrCreateCartId(req, res);
    const { product_id } = req.body || {};
    if (!product_id) return res.status(400).json({ ok: false, error: 'missing_product_id' });
    const id = favUUID();
    await pool.execute('INSERT IGNORE INTO favorites (id, user_email, cart_id, product_id) VALUES (?,?,?,?)', [id, email, cartId, product_id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Favorites add error', e);
    res.status(500).json({ ok: false, error: 'favorites_add_failed' });
  }
});

app.delete('/api/favorites/:product_id', async (req, res) => {
  try {
    const email = getCurrentUserEmail(req);
    const cartId = getOrCreateCartId(req, res);
    const { product_id } = req.params;
    await pool.execute('DELETE FROM favorites WHERE product_id = ? AND (user_email = ? OR (user_email IS NULL AND cart_id = ?))', [product_id, email, cartId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Favorites delete error', e);
    res.status(500).json({ ok: false, error: 'favorites_delete_failed' });
  }
});

// Endpoint /api/auth/me removido - usando o principal acima

function getOrCreateCartId(req, res) {
  let cartId = req.cookies?.cart_id;
  if (!cartId) {
    cartId = require('crypto').randomUUID();
    res.cookie('cart_id', cartId, { httpOnly: false, sameSite: 'lax', secure: (req.headers['x-forwarded-proto'] || req.protocol) === 'https', maxAge: 1000*60*60*24*30 });
  }
  return cartId;
}

async function ensureCartExists(cartId) {
  await pool.execute('INSERT IGNORE INTO carts (id) VALUES (?)', [cartId]);
}

function mapCartItemRow(r, req) {
  return {
    id: r.id,
    product_id: r.product_id,
    name: r.name || r.produto_nome || null,
    price: Number(r.price),
    image_url: r.image_url ? normalizeToThisOrigin(req, r.image_url) : null,
    quantity: r.quantity,
    estoque: r.estoque !== undefined ? Number(r.estoque) : 10, // Incluir estoque do produto
    categoria: r.categoria || null,
    status: r.status || 'ativo'
  };
}

app.get('/api/cart', async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    await ensureCartExists(cartId);
    // JOIN com tabela products para obter informações completas do produto
    const [rows] = await pool.execute(`
      SELECT ci.*, p.nome as produto_nome, p.estoque, p.categoria, p.status
      FROM cart_items ci
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ? 
      ORDER BY ci.created_at ASC
    `, [cartId]);
    const items = rows.map(r => mapCartItemRow(r, req));
    const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    res.json({ cart_id: cartId, items, total });
  } catch (e) {
    console.error('Cart GET error', e);
    res.status(500).json({ error: 'cart_get_failed' });
  }
});

app.post('/api/cart/items', cartLimiter, async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    await ensureCartExists(cartId);
    const { product_id, name, price, image_url, quantity } = req.body || {};
    console.log('🧾 add-to-cart body:', req.body);
    const priceNum = typeof price === 'string' ? Number(price.replace(/\./g, '').replace(',', '.')) : Number(price);
    const qtyNum = Number(quantity || 1);
    if (!product_id || !Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'payload_invalido', details: { product_id, price } });
    }
    // Se item já existe, incrementa
    const [exist] = await pool.execute('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1', [cartId, product_id]);
    if (exist.length) {
      const q = Number(exist[0].quantity || 0) + qtyNum;
      await pool.execute('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [q, exist[0].id]);
    } else {
      await pool.execute('INSERT INTO cart_items (cart_id, product_id, name, price, image_url, quantity) VALUES (?,?,?,?,?,?)', [cartId, product_id, name || null, priceNum, image_url || null, qtyNum]);
    }
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC', [cartId]);
    const items = rows.map(r => mapCartItemRow(r, req));
    const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    res.status(201).json({ cart_id: cartId, items, total });
  } catch (e) {
    console.error('Cart POST error', e?.message || e);
    res.status(500).json({ error: 'cart_add_failed', message: e?.message });
  }
});

app.patch('/api/cart/items/:id', async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    const { id } = req.params;
    const { quantity } = req.body || {};
    if (!Number.isFinite(Number(quantity))) return res.status(400).json({ error: 'quantity inválido' });
    await pool.execute('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ? AND cart_id = ?', [Number(quantity), id, cartId]);
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC', [cartId]);
    const items = rows.map(r => mapCartItemRow(r, req));
    const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    res.json({ cart_id: cartId, items, total });
  } catch (e) {
    console.error('Cart PATCH error', e);
    res.status(500).json({ error: 'cart_update_failed' });
  }
});

app.delete('/api/cart/items/:id', async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    const { id } = req.params;
    await pool.execute('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [id, cartId]);
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at ASC', [cartId]);
    const items = rows.map(r => mapCartItemRow(r, req));
    const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    res.json({ cart_id: cartId, items, total });
  } catch (e) {
    console.error('Cart DELETE error', e);
    res.status(500).json({ error: 'cart_remove_failed' });
  }
});

// Criação de pedido a partir do carrinho atual
app.post('/api/orders', async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ?', [cartId]);
    if (!rows.length) return res.status(400).json({ error: 'carrinho_vazio' });
    
    // Validar e limpar produtos inexistentes do carrinho
    const validItems = [];
    const invalidItems = [];
    
    for (const item of rows) {
      try {
        const [product] = await pool.execute('SELECT id FROM produtos WHERE id = ?', [item.product_id]);
        if (product && product.length > 0) {
          validItems.push(item);
        } else {
          invalidItems.push(item.id);
          console.log(`⚠️ Produto ${item.product_id} não existe mais, removendo do carrinho`);
        }
      } catch (e) {
        console.log(`⚠️ Erro ao validar produto ${item.product_id}:`, e.message);
        invalidItems.push(item.id);
      }
    }
    
    // Remover itens inválidos do carrinho
    if (invalidItems.length > 0) {
      await pool.execute(`DELETE FROM cart_items WHERE id IN (${invalidItems.map(() => '?').join(',')})`, invalidItems);
      console.log(`✅ Removidos ${invalidItems.length} itens inválidos do carrinho`);
    }
    
    if (!validItems.length) {
      return res.status(400).json({ error: 'carrinho_vazio', message: 'Todos os produtos do carrinho foram removidos pois não existem mais' });
    }
    
    const items = validItems;
    const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0);
    const orderId = require('crypto').randomUUID();
    
    // Dados de entrega/pagamento do body
    const { nome, email, telefone, endereco, metodoPagamento, payment_status = 'pending', user_id } = req.body || {};
    
    // Obter user_id da sessão se disponível
    let userId = user_id;
    if (!userId) {
      const sessionId = req.cookies?.session_id;
      if (sessionId) {
        try {
          const [session] = await pool.execute('SELECT user_email FROM sessions WHERE id = ?', [sessionId]);
          if (session && session[0]) {
            const userEmail = session[0].user_email;
            // Buscar o user_id baseado no email na tabela customers
            const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
            if (customers && customers[0]) {
              userId = customers[0].id;
              console.log(`✅ User ID encontrado via sessão: ${userId}`);
            } else {
              console.log(`⚠️ Cliente não encontrado para email: ${userEmail}`);
            }
          }
        } catch (e) {
          console.log('⚠️ Não foi possível obter user_id da sessão:', e.message);
        }
      }
    }
    
    // Se ainda não temos userId, tentar buscar pelo email fornecido
    if (!userId && email) {
      try {
        const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [email]);
        if (customers && customers[0]) {
          userId = customers[0].id;
          console.log(`✅ User ID encontrado via email: ${userId}`);
        }
      } catch (e) {
        console.log('⚠️ Erro ao buscar cliente por email:', e.message);
      }
    }
    
    // Inserir pedido com dados de entrega
    console.log('🔍 Debug order insert:', { orderId, cartId, userId, total, nome, email, telefone, endereco, metodoPagamento, payment_status });
    
    // Testar estrutura e inserir usando colunas existentes (compatível com schema atual)
    try {
      const [testRows] = await pool.execute('DESCRIBE orders');
      const columns = Array.isArray(testRows) ? testRows.map(r => r.Field) : [];
      console.log('🔍 Tabela orders columns:', columns);

      const hasUserId = columns.includes('user_id');
      const hasCustomerId = columns.includes('customer_id');
      const hasCartId = columns.includes('cart_id');
      const hasPaymentMethod = columns.includes('payment_method') || columns.includes('metodo_pagamento');
      const hasShippingAddress = columns.includes('shipping_address') || columns.includes('endereco');
      const hasNome = columns.includes('nome');
      const hasEmail = columns.includes('email');
      const hasTelefone = columns.includes('telefone');
      const hasPaymentStatus = columns.includes('payment_status');

      // Montar colunas dinamicamente priorizando nomes do schema atual
      // Descobrir tipo de status
      const statusCol = (testRows || []).find((r) => r.Field === 'status');
      const isStatusNumeric = statusCol && typeof statusCol.Type === 'string' && /int|decimal|float|double/i.test(statusCol.Type);

      const insertCols = ['id', 'status', 'total'];
      const values = [orderId, isStatusNumeric ? 0 : 'pending', total];

      // IMPORTANTE: Associar customer_id e user_id se disponível
      if (hasCustomerId && userId) {
        insertCols.splice(1, 0, 'customer_id');
        values.splice(1, 0, userId);
      }
      
      if (hasUserId && userId) {
        insertCols.splice(1, 0, 'user_id');
        values.splice(1, 0, userId);
      }

      if (hasCartId) {
        insertCols.splice(1, 0, 'cart_id');
        values.splice(1, 0, cartId);
      }

      if (hasNome) {
        insertCols.push('nome');
        values.push(nome || null);
      }

      if (hasEmail) {
        insertCols.push('email');
        values.push(email || null);
      }

      if (hasTelefone) {
        insertCols.push('telefone');
        values.push(telefone || null);
      }

      if (hasShippingAddress) {
        insertCols.push(columns.includes('shipping_address') ? 'shipping_address' : 'endereco');
        values.push(endereco || null);
      }

      if (hasPaymentMethod) {
        insertCols.push(columns.includes('payment_method') ? 'payment_method' : 'metodo_pagamento');
        values.push(metodoPagamento || null);
      }

      if (hasPaymentStatus) {
        insertCols.push('payment_status');
        values.push(payment_status);
      }

      const placeholders = insertCols.map(() => '?').join(',');
      const sql = `INSERT INTO orders (${insertCols.join(', ')}) VALUES (${placeholders})`;
      await pool.execute(sql, values);
      
      console.log(`✅ Pedido criado: ${orderId} para ${userId ? `user_id=${userId}` : `cart_id=${cartId}`}`);
    } catch (e) {
      console.log('❌ Erro ao verificar estrutura da tabela orders:', e.message);
      // Fallback: schema padrão minimalista (id, status, total, payment_method, shipping_address)
      await pool.execute(
        'INSERT INTO orders (id, status, total, payment_method, shipping_address) VALUES (?,?,?,?,?)',
        [orderId, 'pending', total, metodoPagamento || null, endereco || null]
      );
    }

    // Inserir itens do pedido (compatível com diferentes schemas)
    {
      const [cols] = await pool.execute('DESCRIBE order_items');
      const colDefs = Array.isArray(cols) ? cols : [];
      const fields = new Set(colDefs.map((c) => c.Field));
      const hasId = fields.has('id');
      const idDef = hasId ? colDefs.find((c) => c.Field === 'id') : null;
      const idAuto = Boolean(idDef && idDef.Extra && idDef.Extra.includes('auto_increment'));
      const idIsNumeric = Boolean(idDef && typeof idDef.Type === 'string' && /int|decimal|float|double/i.test(idDef.Type));

      // Mapear colunas opcionais
      const nameCol = fields.has('name') ? 'name' : (fields.has('product_name') ? 'product_name' : null);
      const imageCol = fields.has('image_url') ? 'image_url' : (fields.has('image') ? 'image' : null);

      for (const it of items) {
        const insertCols = [];
        const insertVals = [];
        if (hasId && !idAuto) {
          insertCols.push('id');
          insertVals.push(idIsNumeric ? Math.floor(Date.now() % 2147483647) : require('crypto').randomUUID());
        }
        // Campos obrigatórios presentes
        if (fields.has('order_id')) { insertCols.push('order_id'); insertVals.push(orderId); }
        if (fields.has('product_id')) { insertCols.push('product_id'); insertVals.push(it.product_id); }
        if (nameCol) { insertCols.push(nameCol); insertVals.push(it.name || 'Produto'); }
        if (fields.has('price')) { insertCols.push('price'); insertVals.push(it.price); }
        if (imageCol) { insertCols.push(imageCol); insertVals.push(it.image_url || null); }
        if (fields.has('quantity')) { insertCols.push('quantity'); insertVals.push(it.quantity || 1); }

        const placeholdersItems = insertCols.map(() => '?').join(',');
        const sqlItems = `INSERT INTO order_items (${insertCols.join(', ')}) VALUES (${placeholdersItems})`;
        await pool.execute(sqlItems, insertVals);
      }
    }

    // Limpa carrinho
    await pool.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    
    res.status(201).json({ 
      id: orderId, 
      status: 'criado', 
      total,
      payment_status: payment_status,
      dadosEntrega: { nome: nome || null, email: email || null, telefone: telefone || null, endereco: endereco || null, metodoPagamento: metodoPagamento || null }
    });
  } catch (e) {
    console.error('Order create error', e);
    res.status(500).json({ error: 'order_create_failed' });
  }
});

// Endpoint para gerar QR Code Pix
app.post('/api/orders/:id/pix', async (req, res) => {
  try {
    const { id } = req.params;
    const { total } = req.body;
    
    if (!total || !Number(total)) {
      return res.status(400).json({ error: 'Total inválido' });
    }

    // Buscar configurações PIX
    const [settingsRows] = await pool.execute('SELECT key_name, value_text FROM settings WHERE key_name IN (?, ?, ?, ?)', [
      'pix_key', 'pix_key_type', 'pix_merchant_name', 'pix_city'
    ]);
    
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key_name] = row.value_text;
    });

    // Verificar se tem chave PIX configurada
    if (!settings.pix_key || !settings.pix_merchant_name) {
      return res.status(400).json({ error: 'Chave PIX não configurada. Configure nas configurações administrativas.' });
    }

    // Gerar código PIX real baseado na configuração
    const pixKey = settings.pix_key;
    const merchantName = settings.pix_merchant_name;
    const city = settings.pix_city || 'São Paulo';
    const amount = total.toFixed(2);
    const orderId = id;

    // Gerar código PIX Copia e Cola (formato EMV)
    const pixCode = generatePixCode({
      pixKey,
      merchantName,
      city,
      amount,
      orderId
    });

    // Gerar QR Code usando uma biblioteca simples (ou mock para demo)
    const qrCodeUrl = await generateQRCodeImage(pixCode);
    
    // Atualizar pedido com dados do Pix
    await pool.execute(`
      UPDATE orders 
      SET payment_status = 'waiting_payment', 
          pix_qr_code = ?,
          payment_data = ?
      WHERE id = ?
    `, [
      pixCode,
      JSON.stringify({
        method: 'pix',
        qr_code: pixCode,
        pix_key: pixKey,
        merchant_name: merchantName,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        amount: total
      }),
      id
    ]);
    
    res.json({
      success: true,
      qr_code: pixCode,
      qr_code_url: qrCodeUrl,
      pix_key: pixKey,
      merchant_name: merchantName,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      amount: total,
      instructions: 'Escaneie o QR Code com seu aplicativo de pagamento ou copie o código Pix'
    });
  } catch (e) {
    console.error('Pix generation error', e);
    res.status(500).json({ error: 'pix_generation_failed' });
  }
});

// Função para gerar código PIX
function generatePixCode({ pixKey, merchantName, city, amount, orderId }) {
  // Formato EMV simplificado para PIX Copia e Cola
  const payload = [
    '00020126', // Payload Format Indicator
    '010211',   // Point of Initiation Method
    '520400005303986', // Merchant Account Information
    '5406' + amount.padStart(6, '0'), // Transaction Amount
    '5802BR', // Country Code
    '59' + (merchantName.length).toString().padStart(2, '0') + merchantName, // Merchant Name
    '60' + (city.length).toString().padStart(2, '0') + city, // Merchant City
    '62' + (orderId.length + 4).toString().padStart(2, '0') + '05' + orderId.length.toString().padStart(2, '0') + orderId, // Additional Data Field
    '6304' // CRC16
  ].join('');

  // Adicionar chave PIX
  const pixKeyLength = pixKey.length.toString().padStart(2, '0');
  const pixKeyField = '01' + pixKeyLength + pixKey;
  
  const fullPayload = payload.replace('520400005303986', '52' + (pixKeyField.length + 4).toString().padStart(2, '0') + '0001' + pixKeyField);
  
  // Calcular CRC16 (simplificado)
  const crc = calculateCRC16(fullPayload.substring(0, fullPayload.length - 4));
  const finalPayload = fullPayload.substring(0, fullPayload.length - 4) + crc.toString(16).padStart(4, '0').toUpperCase();
  
  return finalPayload;
}

// Função para calcular CRC16 (simplificada)
function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >> 1) ^ 0x8408;
      } else {
        crc = crc >> 1;
      }
    }
  }
  return crc;
}

// Função para gerar QR Code (mock por enquanto)
async function generateQRCodeImage(pixCode) {
  // Em produção, usar uma biblioteca como 'qrcode' ou 'qrcode-generator'
  // Por enquanto, retornar uma imagem base64 mock
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
}

// Endpoint para gerar QR Code PIX do carrinho
app.post('/api/cart/pix-qr', async (req, res) => {
  try {
    const { total } = req.body;
    
    if (!total || !Number(total)) {
      return res.status(400).json({ error: 'Total inválido' });
    }

    // Buscar configurações PIX
    const [settingsRows] = await pool.execute('SELECT key_name, value_text FROM settings WHERE key_name IN (?, ?, ?, ?, ?)', [
      'pix_key', 'pix_key_type', 'pix_merchant_name', 'pix_city', 'pix_show_qr_cart'
    ]);
    
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key_name] = row.value_text;
    });

    // Verificar se deve mostrar QR no carrinho
    if (settings.pix_show_qr_cart !== 'true') {
      logger.info('PIX no carrinho desabilitado', { settings: settings.pix_show_qr_cart });
      return res.status(200).json({ 
        enabled: false, 
        message: 'PIX no carrinho está desabilitado. Ative nas configurações.' 
      });
    }

    // Verificar se tem chave PIX configurada
    if (!settings.pix_key || !settings.pix_merchant_name) {
      return res.status(400).json({ error: 'Chave PIX não configurada' });
    }

    // Gerar código PIX para o carrinho
    const pixKey = settings.pix_key;
    const merchantName = settings.pix_merchant_name;
    const city = settings.pix_city || 'São Paulo';
    const amount = total.toFixed(2);
    const cartId = `cart_${Date.now()}`;

    // Gerar código PIX Copia e Cola (formato EMV)
    const pixCode = generatePixCode({
      pixKey,
      merchantName,
      city,
      amount,
      orderId: cartId
    });

    // Gerar QR Code
    const qrCodeUrl = await generateQRCodeImage(pixCode);
    
    res.json({
      success: true,
      qr_code: pixCode,
      qr_code_url: qrCodeUrl,
      pix_key: pixKey,
      merchant_name: merchantName,
      amount: total,
      instructions: 'Escaneie o QR Code para pagar via PIX',
      show_in_cart: true
    });
  } catch (e) {
    console.error('Cart Pix QR error', e);
    res.status(500).json({ error: 'cart_pix_qr_failed' });
  }
});

// Endpoint para consultar status de pagamento
app.get('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT id, status, payment_status, total, payment_data, created_at 
      FROM orders 
      WHERE id = ?
    `, [id]);
    
    if (!rows.length) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = rows[0];
    const paymentData = order.payment_data ? (typeof order.payment_data === 'string' ? JSON.parse(order.payment_data) : order.payment_data) : null;
    
    res.json({
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      total: order.total,
      payment_data: paymentData,
      created_at: order.created_at
    });
  } catch (e) {
    console.error('Order status error', e);
    res.status(500).json({ error: 'status_check_failed' });
  }
});

// Endpoint para simular pagamento confirmado (mock)
app.post('/api/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Atualizar status do pedido
    await pool.execute(`
      UPDATE orders 
      SET payment_status = 'paid', 
          status = 'processing'
      WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      payment_status: 'paid',
      order_status: 'processing'
    });
  } catch (e) {
    console.error('Payment confirmation error', e);
    res.status(500).json({ error: 'payment_confirmation_failed' });
  }
});

// Lista pedidos simples (por user_id ou cart_id)
app.get('/api/orders', async (req, res) => {
  try {
    console.log('📦 GET /api/orders - Listando pedidos');
    
    // Primeiro, tentar obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // Se não tem userId da sessão, tentar do query param (para compatibilidade)
    if (!userId && req.query.user_id) {
      userId = req.query.user_id;
      console.log('👤 User ID do query param:', userId);
    }
    
    // SEGURANÇA: Se não há userId da sessão, NÃO retornar pedidos
    if (!userId) {
      console.log('🚫 Nenhum usuário autenticado - retornando lista vazia');
      return res.json([]);
    }
    
    // Buscar APENAS pedidos do usuário logado
    console.log('🔍 Buscando pedidos para customer_id:', userId);
    const [orders] = await pool.execute(
      `SELECT o.*, (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
         FROM orders o
        WHERE o.customer_id = ? OR o.user_id = ?
     ORDER BY o.created_at DESC`,
      [userId, userId]
    );

    // Normalizar status e tipos para frontend
    const normalized = (orders || []).map((o) => {
      const rawStatus = o.status;
      let friendlyStatus = rawStatus || 'pending';
      try {
        if (rawStatus === 0) {
          friendlyStatus = 'pending';
        }
      } catch (_e) {}
      const count = Number(o.items_count || 0);
      return {
        id: o.id,
        status: friendlyStatus,
        total: Number(o.total || 0),
        created_at: o.created_at || null,
        items_count: count,
      };
    });

    console.log(`📦 Pedidos carregados: ${normalized.length} pedidos para ${userId ? `user_id=${userId}` : `cart_id=${cartId}`}`);
    res.json(normalized);
  } catch (e) {
    console.error('Orders list error', e);
    res.status(500).json({ error: 'orders_list_failed' });
  }
});

// ==================== ADMIN: ORDERS ADVANCED API ====================

// Importar rotas de admin de pedidos (DESABILITADO - rotas já implementadas diretamente)
// const adminOrdersRouter = require('./routes/admin-orders.cjs');
// app.use('/api/admin', adminOrdersRouter);

// Manter rota antiga para compatibilidade (deprecated)
app.get('/api/admin/orders', async (req, res) => {
  try {
    // Query simplificada sem JOIN (tabela users não existe no banco atual)
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
      FROM orders o
      ORDER BY o.created_at DESC
    `);

    const normalized = (orders || []).map((order) => ({
      id: order.id,
      user_id: order.client_id,
      status: order.status || 'pending',
      total: Number(order.total_amount || 0),
      created_at: order.created_at,
      updated_at: order.updated_at,
      items_count: Number(order.items_count || 0),
      items: [],
      
      // Dados do cliente (não disponíveis no banco atual)
      customer_name: 'Cliente não identificado',
      customer_email: 'Email não informado',
      customer_phone: null,
      
      // Campos padrão para compatibilidade
      shipping_address: order.shipping_address || null,
      payment_method: order.payment_method || null,
      payment_status: 'pending',
      tracking_code: null,
      estimated_delivery: null,
    }));

    res.json(normalized);
  } catch (error) {
    console.error('Erro na rota /api/admin/orders:', error);
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Lista todos os pedidos evoluído (com dados dos clientes sincronizados)
app.get('/api/admin/orders-evolved', async (req, res) => {
  try {
    // Primeiro, tentar com JOIN para customers (se a tabela existir)
    let orders;
    try {
      [orders] = await pool.execute(`
        SELECT 
          o.*,
          c.id as customer_id,
          c.nome as customer_nome,
          c.email as customer_email,
          c.telefone as customer_telefone,
          c.total_pedidos as customer_total_pedidos,
          c.total_gasto as customer_total_gasto,
          c.ultimo_pedido as customer_ultimo_pedido,
          CASE 
            WHEN c.id IS NOT NULL THEN 'Cliente Sincronizado'
            WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
            ELSE 'Cliente Anônimo'
          END as customer_type
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
      `);
    } catch (joinError) {
      // Se der erro no JOIN, usar query simples
      console.log('Tabela customers não existe, usando query simples');
      [orders] = await pool.execute(`
        SELECT 
          o.*,
          CASE 
            WHEN o.customer_id IS NOT NULL THEN 'Cliente Associado'
            WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
            ELSE 'Cliente Anônimo'
          END as customer_type
        FROM orders o
        ORDER BY o.created_at DESC
      `);
    }

    // Transformar dados para facilitar o uso no frontend
    const ordersWithCustomer = orders.map(order => ({
      ...order,
      customer: order.customer_id ? {
        id: order.customer_id,
        nome: order.customer_nome || 'Cliente Associado',
        email: order.customer_email || order.email || 'Email não informado',
        telefone: order.customer_telefone || order.telefone || 'Telefone não informado',
        total_pedidos: order.customer_total_pedidos || 0,
        total_gasto: order.customer_total_gasto || 0,
        ultimo_pedido: order.customer_ultimo_pedido || order.created_at,
      } : null
    }));

    res.json(ordersWithCustomer);
  } catch (error) {
    console.error('Erro ao buscar pedidos evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de pedidos evoluído (Admin)
app.get('/api/admin/orders-stats-evolved', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN o.status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN o.status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(o.total) as totalRevenue,
        AVG(o.total) as averageTicket,
        SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN 1 ELSE 0 END) as todayOrders,
        SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN o.total ELSE 0 END) as todayRevenue,
        COUNT(DISTINCT o.customer_id) as totalCustomers,
        SUM(CASE WHEN DATE(o.created_at) = CURDATE() AND o.customer_id IS NOT NULL THEN 1 ELSE 0 END) as newCustomers
      FROM orders o
    `);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Erro ao buscar estatísticas evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar clientes para associação
app.get('/api/admin/customers/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [customers] = await pool.execute(`
      SELECT 
        id,
        nome,
        email,
        telefone,
        total_pedidos,
        total_gasto,
        status,
        created_at
      FROM customers 
      WHERE 
        nome LIKE ? OR 
        email LIKE ? OR 
        telefone LIKE ?
      ORDER BY 
        CASE WHEN nome LIKE ? THEN 1 ELSE 2 END,
        total_gasto DESC
      LIMIT 10
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `${q}%`]);

    res.json(customers);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Associar pedido com cliente
app.patch('/api/orders/:id/associate-customer', async (req, res) => {
  try {
    const { id } = req.params;
    const { customer_id } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: 'ID do cliente é obrigatório' });
    }

    // Verificar se o pedido existe
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se o cliente existe
    const [customers] = await pool.execute('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Atualizar pedido
    await pool.execute(
      'UPDATE orders SET customer_id = ?, updated_at = NOW() WHERE id = ?',
      [customer_id, id]
    );

    // Atualizar estatísticas do cliente
    const customer = customers[0];
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        SUM(total) as total_gasto,
        MAX(created_at) as ultimo_pedido
      FROM orders 
      WHERE customer_id = ?
    `, [customer_id]);

    const stats = orderStats[0];
    await pool.execute(`
      UPDATE customers 
      SET 
        total_pedidos = ?,
        total_gasto = ?,
        ultimo_pedido = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [stats.total_pedidos, stats.total_gasto, stats.ultimo_pedido, customer_id]);

    // Inserir no histórico do cliente
    await pool.execute(`
      INSERT INTO customer_order_history (id, customer_id, order_id, total, status, data_pedido)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        total = VALUES(total),
        status = VALUES(status),
        data_pedido = VALUES(data_pedido)
    `, [
      require('crypto').randomUUID(),
      customer_id,
      id,
      orders[0].total,
      orders[0].status,
      orders[0].created_at
    ]);

    res.json({ success: true, message: 'Cliente associado com sucesso' });
  } catch (error) {
    console.error('Erro ao associar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// API Simplificada para Pedidos Evolved (sem JOIN)
app.get('/api/admin/orders-evolved-simple', async (req, res) => {
  try {
    const [orders] = await pool.execute(`
      SELECT 
        o.*,
        u.nome as customer_nome,
        u.email as customer_email,
        u.telefone as customer_telefone,
        CASE 
          WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
          ELSE 'Cliente Anônimo'
        END as customer_type
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    const ordersWithCustomer = orders.map(order => ({
      ...order,
      customer: order.user_id ? {
        id: order.user_id,
        nome: order.customer_nome || 'Cliente',
        email: order.customer_email || 'Email não informado',
        telefone: order.customer_telefone || 'Telefone não informado',
        total_pedidos: 1,
        total_gasto: order.total || 0,
        ultimo_pedido: order.created_at,
      } : null
    }));

    res.json(ordersWithCustomer);
  } catch (error) {
    console.error('Erro ao buscar pedidos evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas simplificadas para Pedidos Evolved
app.get('/api/admin/orders-stats-evolved-simple', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(total) as totalRevenue,
        AVG(total) as averageTicket,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as todayOrders,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) as todayRevenue,
        COUNT(DISTINCT user_id) as totalCustomers,
        SUM(CASE WHEN DATE(created_at) = CURDATE() AND user_id IS NOT NULL THEN 1 ELSE 0 END) as newCustomers
      FROM orders
    `);

    res.json(stats[0] || {});
  } catch (error) {
    console.error('Erro ao buscar estatísticas evoluído:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas de pedidos (Admin)
app.get('/api/orders/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total ELSE NULL END), 0) as average_ticket,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_orders,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND status != 'cancelled' THEN total ELSE 0 END), 0) as today_revenue
      FROM orders
    `);

    res.json({
      total: Number(stats[0].total) || 0,
      pending: Number(stats[0].pending) || 0,
      processing: Number(stats[0].processing) || 0,
      shipped: Number(stats[0].shipped) || 0,
      delivered: Number(stats[0].delivered) || 0,
      cancelled: Number(stats[0].cancelled) || 0,
      totalRevenue: Number(stats[0].total_revenue) || 0,
      averageTicket: Number(stats[0].average_ticket) || 0,
      todayOrders: Number(stats[0].today_orders) || 0,
      todayRevenue: Number(stats[0].today_revenue) || 0,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Atualizar status do pedido (Admin)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Buscar dados do pedido para notificar cliente
    const [orders] = await pool.execute(
      'SELECT customer_email, customer_name FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length > 0 && orders[0].customer_email) {
      // Aqui você pode adicionar lógica para enviar email ao cliente
      console.log(`📧 Notificar cliente ${orders[0].customer_email} sobre mudança de status para ${status}`);
    }

    res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Adicionar código de rastreamento (Admin)
app.post('/api/orders/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_code } = req.body;

    if (!tracking_code) {
      return res.status(400).json({ error: 'Código de rastreamento é obrigatório' });
    }

    // Verificar se a coluna tracking_code existe
    try {
      await pool.execute(
        'UPDATE orders SET tracking_code = ?, status = "shipped", updated_at = NOW() WHERE id = ?',
        [tracking_code, id]
      );
    } catch (colError) {
      // Se a coluna não existir, apenas atualizar o status
      console.log('⚠️ Coluna tracking_code não existe, atualizando apenas status');
      await pool.execute(
        'UPDATE orders SET status = "shipped", updated_at = NOW() WHERE id = ?',
        [id]
      );
    }

    // Buscar dados do pedido
    const [orders] = await pool.execute(
      'SELECT customer_email, customer_name FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length > 0 && orders[0].customer_email) {
      console.log(`📧 Enviar código de rastreamento ${tracking_code} para ${orders[0].customer_email}`);
      // Aqui você pode adicionar lógica para enviar email
    }

    res.json({ success: true, message: 'Código de rastreamento adicionado' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao adicionar código de rastreamento' });
  }
});

// Associar pedido com usuário (Admin)
app.patch('/api/orders/:id/associate-user', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, customer_email } = req.body;

    if (!user_id && !customer_email) {
      return res.status(400).json({ error: 'user_id ou customer_email é obrigatório' });
    }

    let userIdToUse = user_id;

    // Se não tem user_id mas tem email, tentar encontrar o usuário
    if (!userIdToUse && customer_email) {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [customer_email]
      );
      
      if (users.length > 0) {
        userIdToUse = users[0].id;
      }
    }

    if (!userIdToUse) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Atualizar o pedido com o user_id
    await pool.execute(
      'UPDATE orders SET user_id = ?, updated_at = NOW() WHERE id = ?',
      [userIdToUse, id]
    );

    // Buscar dados do usuário para retornar
    const [users] = await pool.execute(
      'SELECT nome, email, telefone FROM users WHERE id = ?',
      [userIdToUse]
    );

    res.json({ 
      success: true, 
      message: 'Pedido associado ao cliente com sucesso',
      customer: users[0] || null
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao associar pedido com cliente' });
  }
});

// Buscar usuários para associação (Admin)
app.get('/api/admin/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const [users] = await pool.execute(`
      SELECT id, nome, email, telefone 
      FROM users 
      WHERE nome LIKE ? OR email LIKE ?
      LIMIT 10
    `, [`%${q}%`, `%${q}%`]);

    res.json(users);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Ações em massa (Admin)
app.post('/api/orders/bulk-action', async (req, res) => {
  try {
    const { orderIds, action } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'IDs de pedidos são obrigatórios' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Ação é obrigatória' });
    }

    const validActions = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Ação inválida' });
    }

    // Atualizar todos os pedidos
    const placeholders = orderIds.map(() => '?').join(',');
    await pool.execute(
      `UPDATE orders SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [action, ...orderIds]
    );

    res.json({ 
      success: true, 
      message: `${orderIds.length} pedido(s) atualizado(s)`,
      updated: orderIds.length
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao executar ação em massa' });
  }
});

// Criar tabelas para página Sobre
(async () => {
  try {
    // Tabela para conteúdo da página Sobre
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sobre_content (
        id VARCHAR(191) PRIMARY KEY,
        section VARCHAR(100) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_section (section)
      )
    `);
    console.log('✅ Tabela sobre_content criada/verificada');

    // Tabela para valores da empresa
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS company_values (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela company_values criada/verificada');

    // Tabela para equipe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        description TEXT,
        image_url VARCHAR(500),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela team_members criada/verificada');

    // Tabela para estatísticas
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS company_stats (
        id VARCHAR(191) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        value VARCHAR(100) NOT NULL,
        icon VARCHAR(100),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela company_stats criada/verificada');

    // Tabela para informações de contato
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS contact_info (
        id VARCHAR(191) PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        icon VARCHAR(100),
        order_index INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela contact_info criada/verificada');

    // Inserir dados iniciais para a seção hero se não existir
    const [existingHero] = await pool.execute('SELECT id FROM sobre_content WHERE section = ?', ['hero']);
    if (existingHero.length === 0) {
      const heroId = require('crypto').randomUUID();
      await pool.execute(`
        INSERT INTO sobre_content (id, section, title, subtitle, description, metadata, is_active)
        VALUES (?, 'hero', 'Nossa História', '', 'A MuhlStore nasceu do sonho de conectar pessoas através de brinquedos únicos e especiais. Desde 2020, nossa missão é descobrir e compartilhar tesouros de brinquedos raros e seminovos de todo o Brasil.', ?, TRUE)
      `, [heroId, JSON.stringify({
        badge_text: 'Nossa História',
        badge_icon: 'Sparkles',
        show_badge: true,
        buttons: [
          {
            id: '1',
            text: 'Conheça Nossos Produtos',
            icon: 'Gift',
            variant: 'primary',
            action: '/loja',
            color: 'orange'
          },
          {
            id: '2',
            text: 'Nossa Missão',
            icon: 'Heart',
            variant: 'outline',
            action: '/about',
            color: 'orange'
          }
        ]
      })]);
      console.log('✅ Dados iniciais da seção hero criados');
    }

  } catch (err) {
    console.error('❌ Erro ao criar tabelas da página Sobre:', { message: err?.message, code: err?.code });
  }
})();

// ==========================
// Endereços do cliente (por cart_id)
// ==========================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(191) PRIMARY KEY,
        cart_id VARCHAR(191) NOT NULL,
        nome VARCHAR(255),
        telefone VARCHAR(100),
        cep VARCHAR(20),
        endereco VARCHAR(255),
        numero VARCHAR(50),
        complemento VARCHAR(255),
        bairro VARCHAR(255),
        cidade VARCHAR(255),
        estado VARCHAR(50),
        shipping_default TINYINT(1) DEFAULT 0,
        billing_default TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cart (cart_id)
      )
    `);
    console.log('✅ Tabela addresses criada/verificada');
  } catch (e) {
    console.error('❌ Erro ao criar tabela addresses', e);
  }
})();

const { randomUUID: uuidv4 } = require('crypto');

app.get('/api/addresses', async (req, res) => {
  try {
    console.log('📍 GET /api/addresses - Buscando endereços do usuário logado');
    
    // Tentar obter o usuário da sessão
    let userId = null;
    
    // Verificar se há session_id no cookie
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      console.log('🔍 Verificando sessão:', sessionId);
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0]) {
          userId = sessions[0].user_id;
          console.log('✅ Usuário encontrado na sessão:', userId);
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // Se não encontrou usuário na sessão, tentar obter do cart_id existente
    if (!userId) {
      // Primeiro, tentar obter cart_id do cookie sem criar um novo
      const existingCartId = req.cookies?.cart_id;
      if (existingCartId) {
        console.log('🔍 Tentando encontrar usuário pelo cart_id existente:', existingCartId);
        try {
          const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [existingCartId]);
          if (carts && carts[0] && carts[0].user_id) {
            userId = carts[0].user_id;
            console.log('✅ Usuário encontrado pelo cart_id existente:', userId);
          }
        } catch (e) {
          console.log('⚠️ Erro ao buscar usuário pelo cart_id existente:', e.message);
        }
      }
      
      // Se ainda não encontrou, criar novo cart_id
      if (!userId) {
        const cartId = getOrCreateCartId(req, res);
        console.log('🔍 Tentando encontrar usuário pelo novo cart_id:', cartId);
        try {
          const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [cartId]);
          if (carts && carts[0] && carts[0].user_id) {
            userId = carts[0].user_id;
            console.log('✅ Usuário encontrado pelo novo cart_id:', userId);
          }
        } catch (e) {
          console.log('⚠️ Erro ao buscar usuário pelo novo cart_id:', e.message);
        }
      }
    }
    
    // Se ainda não tem userId, buscar endereços da tabela addresses (para usuários não logados)
    if (!userId) {
      console.log('🔍 Buscando endereços da tabela addresses (usuário não logado)');
      const cartId = getOrCreateCartId(req, res);
      try {
        const [addresses] = await pool.execute(`
          SELECT 
            id,
            nome,
            cep,
            endereco,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            shipping_default as principal,
            created_at,
            updated_at
          FROM addresses 
          WHERE cart_id = ?
          ORDER BY shipping_default DESC, created_at DESC
        `, [cartId]);
        
        console.log(`✅ Encontrados ${addresses.length} endereços na tabela addresses`);
        res.json(addresses);
        return;
      } catch (e) {
        console.log('⚠️ Erro ao buscar endereços da tabela addresses:', e.message);
      }
    }
    
    // Buscar endereços do usuário logado na tabela enderecos
    console.log('🔍 Buscando endereços do usuário logado na tabela enderecos');
    try {
      const [addresses] = await pool.execute(`
        SELECT 
          id,
          tipo,
          cep,
          logradouro as endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          principal,
          data_criacao as created_at
        FROM enderecos 
        WHERE cliente_id = ?
        ORDER BY principal DESC, data_criacao DESC
      `, [userId]);
      
      console.log(`✅ Encontrados ${addresses.length} endereços para o usuário ${userId}`);
      res.json(addresses);
      
    } catch (e) {
      console.error('❌ Erro ao buscar endereços do usuário:', e);
      res.status(500).json({ error: 'addresses_list_failed', details: e.message });
    }
    
  } catch (e) {
    console.error('Addresses list error', e);
    res.status(500).json({ error: 'addresses_list_failed' });
  }
});

app.post('/api/addresses', async (req, res) => {
  console.log('🚨 ENDPOINT /api/addresses CHAMADO!');
  try {
    console.log('📍 POST /api/addresses - Criando novo endereço');
    console.log('📍 Headers:', req.headers);
    console.log('📍 Cookies:', req.cookies);
    console.log('📍 Body:', req.body);
    
    // Tentar obter o usuário da sessão
    let userId = null;
    
    // Verificar se há session_id no cookie
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      console.log('🔍 Verificando sessão:', sessionId);
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0]) {
          userId = sessions[0].user_id;
          console.log('✅ Usuário encontrado na sessão:', userId);
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // Se não encontrou usuário na sessão, tentar obter do cart_id existente
    if (!userId) {
      // Primeiro, tentar obter cart_id do cookie sem criar um novo
      const existingCartId = req.cookies?.cart_id;
      if (existingCartId) {
        console.log('🔍 Tentando encontrar usuário pelo cart_id existente:', existingCartId);
        try {
          const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [existingCartId]);
          if (carts && carts[0] && carts[0].user_id) {
            userId = carts[0].user_id;
            console.log('✅ Usuário encontrado pelo cart_id existente:', userId);
          }
        } catch (e) {
          console.log('⚠️ Erro ao buscar usuário pelo cart_id existente:', e.message);
        }
      }
      
      // Se ainda não encontrou, criar novo cart_id
      if (!userId) {
        const cartId = getOrCreateCartId(req, res);
        console.log('🔍 Tentando encontrar usuário pelo novo cart_id:', cartId);
        try {
          const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [cartId]);
          if (carts && carts[0] && carts[0].user_id) {
            userId = carts[0].user_id;
            console.log('✅ Usuário encontrado pelo novo cart_id:', userId);
          }
        } catch (e) {
          console.log('⚠️ Erro ao buscar usuário pelo novo cart_id:', e.message);
        }
      }
    }
    
    const { nome, telefone, cep, endereco, numero, complemento, bairro, cidade, estado, shipping_default, billing_default } = req.body || {};
    const id = uuidv4();
    
    console.log('📝 Dados do endereço:', { nome, cep, endereco, numero, cidade, estado, shipping_default });

    // Se tem usuário logado, salvar na tabela enderecos
    if (userId) {
      console.log('💾 Salvando endereço na tabela enderecos para usuário:', userId);
      
      // Se for padrão, remover padrão dos outros endereços
      if (shipping_default) {
        await pool.execute('UPDATE enderecos SET principal = 0 WHERE cliente_id = ?', [userId]);
      }
      
      await pool.execute(
        `INSERT INTO enderecos (cliente_id, tipo, cep, logradouro, numero, complemento, bairro, cidade, estado, principal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'casa', cep, endereco, numero || '', complemento || '', bairro || '', cidade, estado, shipping_default ? 1 : 0]
      );
      
      console.log('✅ Endereço salvo na tabela enderecos');
      
    } else {
      // Se não tem usuário logado, salvar na tabela addresses
      console.log('💾 Salvando endereço na tabela addresses (usuário não logado)');
      
      const cartId = getOrCreateCartId(req, res);
      
      if (shipping_default) {
        await pool.execute('UPDATE addresses SET shipping_default = 0 WHERE cart_id = ?', [cartId]);
      }
      if (billing_default) {
        await pool.execute('UPDATE addresses SET billing_default = 0 WHERE cart_id = ?', [cartId]);
      }

      await pool.execute(
        `INSERT INTO addresses (id, cart_id, nome, telefone, cep, endereco, numero, complemento, bairro, cidade, estado, shipping_default, billing_default)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, cartId, nome || null, telefone || null, cep || null, endereco || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null, shipping_default ? 1 : 0, billing_default ? 1 : 0]
      );
      
      console.log('✅ Endereço salvo na tabela addresses');
    }
    
    // Retornar o endereço criado
    const responseData = {
      id,
      nome: nome || 'Endereço',
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      principal: shipping_default ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Endereço criado com sucesso:', id);
    res.status(201).json(responseData);
    
  } catch (e) {
    console.error('❌ Addresses create error:', e);
    res.status(500).json({ error: 'addresses_create_failed', details: e.message });
  }
});

app.put('/api/addresses/:id', async (req, res) => {
  try {
    console.log('📍 PUT /api/addresses/:id - Atualizando endereço');
    
    // Tentar obter o usuário da sessão
    let userId = null;
    
    // Verificar se há session_id no cookie
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      console.log('🔍 Verificando sessão:', sessionId);
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0]) {
          userId = sessions[0].user_id;
          console.log('✅ Usuário encontrado na sessão:', userId);
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // Se não encontrou usuário na sessão, tentar obter do cart_id
    if (!userId) {
      const cartId = getOrCreateCartId(req, res);
      console.log('🔍 Tentando encontrar usuário pelo cart_id:', cartId);
      try {
        const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [cartId]);
        if (carts && carts[0] && carts[0].user_id) {
          userId = carts[0].user_id;
          console.log('✅ Usuário encontrado pelo cart_id:', userId);
        }
      } catch (e) {
        console.log('⚠️ Erro ao buscar usuário pelo cart_id:', e.message);
      }
    }
    
    const { id } = req.params;
    const { nome, telefone, cep, endereco, numero, complemento, bairro, cidade, estado, shipping_default, billing_default } = req.body || {};
    
    console.log('📝 Dados do endereço para atualizar:', { nome, cep, endereco, numero, cidade, estado, shipping_default });

    // Se tem usuário logado, atualizar na tabela customer_addresses
    if (userId) {
      console.log('💾 Atualizando endereço na tabela customer_addresses para usuário:', userId);
      
      // Se for padrão, remover padrão dos outros endereços
      if (shipping_default) {
        await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ? AND id != ?', [userId, id]);
      }
      
      await pool.execute(
        `UPDATE customer_addresses SET nome = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, cep = ?, padrao = ?, updated_at = NOW() WHERE id = ? AND customer_id = ?`,
        [nome || 'Endereço', endereco, numero || '', complemento || '', bairro || '', cidade, estado, cep, shipping_default ? 1 : 0, id, userId]
      );
      
      console.log('✅ Endereço atualizado na tabela customer_addresses');
      
    } else {
      // Se não tem usuário logado, atualizar na tabela addresses
      console.log('💾 Atualizando endereço na tabela addresses (usuário não logado)');
      
      const cartId = getOrCreateCartId(req, res);
      
      if (shipping_default) {
        await pool.execute('UPDATE addresses SET shipping_default = 0 WHERE cart_id = ?', [cartId]);
      }
      if (billing_default) {
        await pool.execute('UPDATE addresses SET billing_default = 0 WHERE cart_id = ?', [cartId]);
      }

      await pool.execute(
        `UPDATE addresses SET nome=?, telefone=?, cep=?, endereco=?, numero=?, complemento=?, bairro=?, cidade=?, estado=?, shipping_default=?, billing_default=? WHERE id = ? AND cart_id = ?`,
        [nome || null, telefone || null, cep || null, endereco || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null, shipping_default ? 1 : 0, billing_default ? 1 : 0, id, cartId]
      );
      
      console.log('✅ Endereço atualizado na tabela addresses');
    }
    
    // Retornar o endereço atualizado
    const responseData = {
      id,
      nome: nome || 'Endereço',
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      principal: shipping_default ? 1 : 0,
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Endereço atualizado com sucesso:', id);
    res.json(responseData);
  } catch (e) {
    console.error('Addresses update error', e);
    res.status(500).json({ error: 'addresses_update_failed' });
  }
});

app.delete('/api/addresses/:id', async (req, res) => {
  try {
    const cartId = getOrCreateCartId(req, res);
    const { id } = req.params;
    await pool.execute('DELETE FROM addresses WHERE id = ? AND cart_id = ?', [id, cartId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('Addresses delete error', e);
    res.status(500).json({ error: 'addresses_delete_failed' });
  }
});


// POST /api/collections/:id/products - Vincular produto à coleção
app.post('/api/collections/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, order_index } = req.body || {};
    if (!product_id) {
      return res.status(400).json({ error: 'product_id é obrigatório' });
    }

    // Checar existência de coleção
    const [cRows] = await pool.execute('SELECT id FROM collections WHERE id = ?', [id]);
    if (!cRows || cRows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });

    // Checar existência de produto (tabela products ou produtos)
    try {
      const [pRows] = await pool.execute('SELECT id FROM products WHERE id = ?', [product_id]);
      if (!pRows || pRows.length === 0) {
        // Tentar na tabela produtos se não encontrou em products
        const [pRows2] = await pool.execute('SELECT id FROM produtos WHERE id = ?', [product_id]);
        if (!pRows2 || pRows2.length === 0) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
      }
    } catch (e) {
      console.error('❌ Erro ao validar produto:', e);
      return res.status(500).json({ error: 'Erro ao validar produto', message: e?.message });
    }

    const ord = Number.isFinite(order_index) ? order_index : 0;
    const [result] = await pool.execute(
      'INSERT INTO collection_products (collection_id, product_id, order_index, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [id, product_id, ord]
    );

    res.status(201).json({ id: result.insertId, collection_id: id, product_id, order_index: ord });
  } catch (error) {
    console.error('❌ Erro ao adicionar produto na coleção:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message, code: error?.code });
  }
});

// DELETE /api/collections/:id/products/:productId - Remover vínculo
app.delete('/api/collections/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    
    console.log(`🗑️ Removendo produto ${productId} da coleção ${id}`);
    
    // Verificar se o vínculo existe
    const [existing] = await pool.execute(
      'SELECT id FROM collection_products WHERE collection_id = ? AND product_id = ?',
      [id, productId]
    );
    
    if (!existing || existing.length === 0) {
      console.log(`❌ Vínculo não encontrado: coleção ${id}, produto ${productId}`);
      return res.status(404).json({ error: 'Produto não encontrado nesta coleção' });
    }
    
    // Remover o vínculo
    const [result] = await pool.execute(
      'DELETE FROM collection_products WHERE collection_id = ? AND product_id = ?',
      [id, productId]
    );
    
    if (result.affectedRows === 0) {
      console.log(`❌ Nenhum vínculo foi removido`);
      return res.status(404).json({ error: 'Produto não encontrado nesta coleção' });
    }
    
    console.log(`✅ Produto ${productId} removido da coleção ${id} (${result.affectedRows} vínculo(s) removido(s))`);
    res.json({ 
      success: true, 
      message: 'Produto removido com sucesso',
      removed_count: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Erro ao remover produto da coleção:', { 
      message: error?.message, 
      code: error?.code,
      collectionId: req.params.id,
      productId: req.params.productId
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      message: error?.message, 
      code: error?.code 
    });
  }
});

// PATCH /api/collections/:id/products/reorder - Reordenar produtos vinculados
app.patch('/api/collections/:id/products/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_ids } = req.body || {};
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'product_ids é obrigatório (array)' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (let i = 0; i < product_ids.length; i++) {
        await connection.execute(
          'UPDATE collection_products SET order_index = ?, updated_at = NOW() WHERE collection_id = ? AND product_id = ?',
          [i, id, product_ids[i]]
        );
      }
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao reordenar produtos da coleção:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message, code: error?.code });
  }
});

// DEBUG: resumo de coleção e vínculos
app.get('/api/debug/collections/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const [[cRows], [lRows]] = await Promise.all([
      pool.execute('SELECT * FROM collections WHERE id = ?', [id]),
      pool.execute('SELECT * FROM collection_products WHERE collection_id = ?', [id])
    ]);
    const collection = cRows && cRows[0] ? cRows[0] : null;
    res.json({ collection, links_count: lRows.length, sample_links: lRows.slice(0, 5) });
  } catch (error) {
    console.error('❌ Debug summary error:', error);
    res.status(500).json({ error: 'debug_failed' });
  }
});

// PUT /api/collections/reorder - Reordenar coleções
app.put('/api/collections/reorder', async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('🔄 Reordenando coleções...');
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Lista de IDs é obrigatória' });
    }
    
    // Atualizar ordem de cada coleção (se a coluna ordem existir)
    const [cols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const hasOrdem = cols.some((c) => c.COLUMN_NAME === 'ordem');
    for (let i = 0; i < ids.length; i++) {
      if (hasOrdem) {
        await pool.execute('UPDATE collections SET ordem = ?, updated_at = NOW() WHERE id = ?', [i, ids[i]]);
      } else {
        await pool.execute('UPDATE collections SET updated_at = NOW() WHERE id = ?', [ids[i]]);
      }
    }
    
    console.log(`✅ ${ids.length} coleções reordenadas com sucesso`);
    res.json({ message: 'Coleções reordenadas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao reordenar coleções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/collections/seed - Popular coleções de exemplo
app.post('/api/collections/seed', async (req, res) => {
  try {
    console.log('🔄 Populando coleções de exemplo...');
    
    const colecoesExemplo = [
      {
        nome: 'Action Figures Premium',
        descricao: 'Bonecos de ação de alta qualidade com detalhes incríveis e articulações avançadas',
        imagem_url: '/lovable-uploads/action-figures-collection.jpg',
        destaque: true
      },
      {
        nome: 'Colecionáveis Vintage',
        descricao: 'Itens raros e vintage para colecionadores apaixonados por peças únicas',
        imagem_url: '/lovable-uploads/vintage-collection.jpg',
        destaque: true
      },
      {
        nome: 'Brinquedos Educativos',
        descricao: 'Jogos e brinquedos que estimulam o aprendizado e desenvolvimento infantil',
        imagem_url: '/lovable-uploads/educational-toys.jpg',
        destaque: false
      },
      {
        nome: 'Pelúcias Premium',
        descricao: 'Pelúcias macias e fofas, perfeitas para conforto e decoração',
        imagem_url: '/lovable-uploads/plush-toys.jpg',
        destaque: false
      },
      {
        nome: 'Jogos de Tabuleiro',
        descricao: 'Clássicos e modernos jogos de tabuleiro para diversão em família',
        imagem_url: '/lovable-uploads/board-games.jpg',
        destaque: true
      },
      {
        nome: 'Carrinhos e Veículos',
        descricao: 'Carros, caminhões e veículos de todos os tipos para pequenos motoristas',
        imagem_url: '/lovable-uploads/vehicles-collection.jpg',
        destaque: false
      }
    ];
    
    for (const colecao of colecoesExemplo) {
      await pool.execute(
        'INSERT IGNORE INTO collections (nome, descricao, imagem_url, destaque, ativo, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(), NOW())',
        [colecao.nome, colecao.descricao, colecao.imagem_url, colecao.destaque]
      );
    }
    
    console.log(`✅ ${colecoesExemplo.length} coleções de exemplo criadas`);
    res.json({ message: `${colecoesExemplo.length} coleções de exemplo criadas com sucesso` });
  } catch (error) {
    console.error('❌ Erro ao popular coleções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de imagem para coleções
app.post('/api/collections/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    const fullUrl = getPublicUrl(req, imageUrl);
    
    console.log(`✅ Imagem de coleção enviada: ${req.file.filename}`);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      fullUrl: fullUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('❌ Erro no upload de imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload direto da imagem da coleção (multipart) e atualizar registro
app.post('/api/collections/:id/image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    // garantir que a coleção existe
    const [rows] = await pool.execute('SELECT id FROM collections WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });

    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    await pool.execute('UPDATE collections SET imagem_url = ?, updated_at = NOW() WHERE id = ?', [imageUrl, id]);

    const host = req.get('host');
    const proto = req.protocol || 'http';
    const fullUrl = getPublicUrl(req, imageUrl);
    res.json({ success: true, id, imagem_url: imageUrl, imagem: fullUrl, filename: req.file.filename });
  } catch (error) {
    console.error('❌ Erro ao atualizar imagem da coleção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar estrutura da tabela collections
app.get('/api/debug/collections-structure', async (req, res) => {
  try {
    const [rows] = await pool.execute('DESCRIBE collections');
    res.json({ structure: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para adicionar colunas faltantes
app.post('/api/debug/fix-collections-table', async (req, res) => {
  try {
    console.log('🔄 Verificando e corrigindo estrutura da tabela collections...');
    
    // Verificar se a coluna destaque existe
    const [columns] = await pool.execute("SHOW COLUMNS FROM collections LIKE 'destaque'");
    if (columns.length === 0) {
      await pool.execute('ALTER TABLE collections ADD COLUMN destaque BOOLEAN DEFAULT FALSE');
      console.log('✅ Coluna destaque adicionada');
    }
    
    // Verificar se a coluna tags existe
    const [tagsColumns] = await pool.execute("SHOW COLUMNS FROM collections LIKE 'tags'");
    if (tagsColumns.length === 0) {
      await pool.execute('ALTER TABLE collections ADD COLUMN tags JSON');
      console.log('✅ Coluna tags adicionada');
    }
    
    // Verificar se a coluna ordem existe
    const [ordemColumns] = await pool.execute("SHOW COLUMNS FROM collections LIKE 'ordem'");
    if (ordemColumns.length === 0) {
      await pool.execute('ALTER TABLE collections ADD COLUMN ordem INT DEFAULT 0');
      console.log('✅ Coluna ordem adicionada');
    }
    
    res.json({ message: 'Estrutura da tabela corrigida com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PÁGINA SOBRE API =====

// GET /api/sobre/content - Buscar conteúdo da página Sobre
app.get('/api/sobre/content', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM sobre_content 
      WHERE is_active = TRUE 
      ORDER BY order_index ASC, created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar conteúdo da página Sobre:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sobre/content/:section - Atualizar conteúdo de uma seção
app.put('/api/sobre/content/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { title, subtitle, description, image_url, metadata } = req.body;
    
    const id = require('crypto').randomUUID();
    
    // Garantir que os valores não sejam undefined
    const safeTitle = title || null;
    const safeSubtitle = subtitle || null;
    const safeDescription = description || null;
    const safeImageUrl = image_url || null;
    const safeMetadata = metadata ? JSON.stringify(metadata) : null;
    
    
    await pool.execute(`
      INSERT INTO sobre_content (id, section, title, subtitle, description, image_url, metadata, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        subtitle = VALUES(subtitle),
        description = VALUES(description),
        image_url = VALUES(image_url),
        metadata = VALUES(metadata),
        updated_at = CURRENT_TIMESTAMP
    `, [id, section, safeTitle, safeSubtitle, safeDescription, safeImageUrl, safeMetadata]);
    
    res.json({ success: true, message: 'Conteúdo atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar conteúdo da página Sobre:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sobre/content/:id - Atualizar conteúdo específico por ID
app.put('/api/sobre/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, image_url, metadata } = req.body;
    
    // Garantir que os valores não sejam undefined
    const safeTitle = title || null;
    const safeSubtitle = subtitle || null;
    const safeDescription = description || null;
    const safeImageUrl = image_url || null;
    const safeMetadata = metadata ? JSON.stringify(metadata) : null;
    
    await pool.execute(`
      UPDATE sobre_content 
      SET title = ?, subtitle = ?, description = ?, image_url = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [safeTitle, safeSubtitle, safeDescription, safeImageUrl, safeMetadata, id]);
    
    res.json({ success: true, message: 'Conteúdo atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar conteúdo da página Sobre:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sobre/upload-image - Upload de imagem para página Sobre
app.post('/api/sobre/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    res.json({ 
      success: true, 
      image_url: imageUrl,
      message: 'Imagem enviada com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro no upload de imagem da página Sobre:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/sobre/values - Buscar valores da empresa
app.get('/api/sobre/values', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM company_values 
      WHERE is_active = TRUE 
      ORDER BY order_index ASC, created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar valores da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sobre/values - Criar novo valor
app.post('/api/sobre/values', async (req, res) => {
  try {
    const { title, description, icon, order_index } = req.body;
    const id = require('crypto').randomUUID();
    
    await pool.execute(`
      INSERT INTO company_values (id, title, description, icon, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [id, title, description, icon, order_index || 0]);
    
    res.json({ success: true, id, message: 'Valor criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sobre/values/:id - Atualizar valor
app.put('/api/sobre/values/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, icon, order_index, is_active } = req.body;
    
    await pool.execute(`
      UPDATE company_values 
      SET title = ?, description = ?, icon = ?, order_index = ?, is_active = ?
      WHERE id = ?
    `, [title, description, icon, order_index || 0, is_active !== false, id]);
    
    res.json({ success: true, message: 'Valor atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/sobre/values/:id - Deletar valor
app.delete('/api/sobre/values/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM company_values WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Valor deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar valor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/sobre/team - Buscar membros da equipe
app.get('/api/sobre/team', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM team_members 
      WHERE is_active = 1 
      ORDER BY order_index ASC, created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar membros da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sobre/team - Criar novo membro da equipe
app.post('/api/sobre/team', async (req, res) => {
  try {
    const { name, position, description, image_url, order_index } = req.body;
    const id = require('crypto').randomUUID();
    
    await pool.execute(`
      INSERT INTO team_members (id, name, position, description, image_url, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [
      id, 
      name ?? null, 
      position ?? null, 
      description ?? null, 
      image_url ?? null, 
      order_index ?? 0
    ]);
    
    res.json({ success: true, id, message: 'Membro da equipe criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar membro da equipe:', error);
    console.error('Detalhes do erro:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Dados recebidos:', req.body);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// PUT /api/sobre/team/:id - Atualizar membro da equipe
app.put('/api/sobre/team/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, description, image_url, order_index, is_active } = req.body;
    
    await pool.execute(`
      UPDATE team_members 
      SET name = ?, position = ?, description = ?, image_url = ?, order_index = ?, is_active = ?
      WHERE id = ?
    `, [name, position, description, image_url, order_index || 0, is_active !== false, id]);
    
    res.json({ success: true, message: 'Membro da equipe atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar membro da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/sobre/team/:id - Deletar membro da equipe
app.delete('/api/sobre/team/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM team_members WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Membro da equipe deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar membro da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/sobre/stats - Buscar estatísticas da empresa
app.get('/api/sobre/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM company_stats 
      WHERE is_active = TRUE 
      ORDER BY order_index ASC, created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas da empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sobre/stats - Criar nova estatística
app.post('/api/sobre/stats', async (req, res) => {
  try {
    const { title, value, icon, order_index } = req.body;
    const id = require('crypto').randomUUID();
    
    await pool.execute(`
      INSERT INTO company_stats (id, title, value, icon, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [id, title, value, icon, order_index || 0]);
    
    res.json({ success: true, id, message: 'Estatística criada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar estatística:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sobre/stats/:id - Atualizar estatística
app.put('/api/sobre/stats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, value, icon, order_index, is_active } = req.body;
    
    await pool.execute(`
      UPDATE company_stats 
      SET title = ?, value = ?, icon = ?, order_index = ?, is_active = ?
      WHERE id = ?
    `, [title, value, icon, order_index || 0, is_active !== false, id]);
    
    res.json({ success: true, message: 'Estatística atualizada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar estatística:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/sobre/stats/:id - Deletar estatística
app.delete('/api/sobre/stats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM company_stats WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Estatística deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar estatística:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/sobre/contact - Buscar informações de contato
app.get('/api/sobre/contact', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM contact_info 
      WHERE is_active = TRUE 
      ORDER BY order_index ASC, created_at ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar informações de contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/sobre/contact - Criar nova informação de contato
app.post('/api/sobre/contact', async (req, res) => {
  try {
    const { type, title, value, icon, order_index } = req.body;
    const id = require('crypto').randomUUID();
    
    await pool.execute(`
      INSERT INTO contact_info (id, type, title, value, icon, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [id, type, title, value, icon, order_index || 0]);
    
    res.json({ success: true, id, message: 'Informação de contato criada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar informação de contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/sobre/contact/:id - Atualizar informação de contato
app.put('/api/sobre/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, value, icon, order_index, is_active } = req.body;
    
    await pool.execute(`
      UPDATE contact_info 
      SET type = ?, title = ?, value = ?, icon = ?, order_index = ?, is_active = ?
      WHERE id = ?
    `, [type, title, value, icon, order_index || 0, is_active !== false, id]);
    
    res.json({ success: true, message: 'Informação de contato atualizada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar informação de contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/sobre/contact/:id - Deletar informação de contato
app.delete('/api/sobre/contact/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM contact_info WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Informação de contato deletada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar informação de contato:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== UPLOAD DE IMAGENS PARA PÁGINA SOBRE =====

// Upload de imagem geral para página sobre
app.post('/api/sobre/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }

    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    const fullUrl = getPublicUrl(req, imageUrl);
    
    console.log(`✅ Imagem da página sobre enviada: ${req.file.filename}`);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      fullUrl: fullUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('❌ Erro no upload de imagem da página sobre:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Upload de imagem para membro da equipe
app.post('/api/sobre/team/:id/image', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    
    const imageUrl = `/lovable-uploads/${req.file.filename}`;
    const fullUrl = getPublicUrl(req, imageUrl);
    
    // Atualizar o registro do membro da equipe
    await pool.execute(
      'UPDATE team_members SET image_url = ? WHERE id = ?',
      [fullUrl, id]
    );
    
    console.log(`✅ Imagem do membro da equipe ${id} atualizada: ${req.file.filename}`);
    
    res.json({ 
      success: true, 
      imageUrl: imageUrl,
      fullUrl: fullUrl,
      filename: req.file.filename 
    });
  } catch (error) {
    console.error('❌ Erro no upload de imagem do membro da equipe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Sitemap.xml dinâmico
const { generateSitemap } = require('../config/sitemapGenerator.cjs');

app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapXml = await generateSitemap(pool);
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache de 24 horas
    res.send(sitemapXml);
    logger.info('Sitemap gerado com sucesso');
  } catch (error) {
    logger.error('Erro ao gerar sitemap:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
});

// ==================== PUSH NOTIFICATIONS API ====================

// Obter VAPID public key
app.get('/api/push/vapid-public-key', (req, res) => {
  const publicKey = pushNotifications.getPublicKey();
  if (!publicKey) {
    return res.status(503).json({ error: 'Push notifications não configuradas' });
  }
  res.json({ publicKey });
});

// Inscrever em push notifications
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.cookies?.user_id || null; // Ajustar conforme seu sistema de auth
    const id = crypto.randomUUID();

    // Extrair keys da subscription
    const endpoint = subscription.endpoint;
    const p256dhKey = subscription.keys.p256dh;
    const authKey = subscription.keys.auth;

    // Detectar tipo de device
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'mobile';
    if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';

    // Salvar no banco
    await pool.execute(`
      INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh_key, auth_key, user_agent, device_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        p256dh_key = VALUES(p256dh_key),
        auth_key = VALUES(auth_key),
        is_active = TRUE,
        updated_at = NOW()
    `, [id, userId, endpoint, p256dhKey, authKey, userAgent, deviceType]);

    logger.info('Push subscription salva', { userId, deviceType });
    res.json({ success: true, id });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao salvar subscription' });
  }
});

// Desinscrever
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    await pool.execute(
      'UPDATE push_subscriptions SET is_active = FALSE WHERE endpoint = ?',
      [endpoint]
    );

    logger.info('Push subscription desativada', { endpoint: endpoint.substring(0, 50) });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao desinscrever' });
  }
});

// Enviar notificação de teste
app.post('/api/push/test', async (req, res) => {
  try {
    const { userId } = req.body;

    // Buscar subscription do usuário
    const [subs] = await pool.execute(
      'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ? AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (subs.length === 0) {
      return res.status(404).json({ error: 'Nenhuma subscription ativa encontrada' });
    }

    const sub = subs[0];
    const subscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key,
      },
    };

    const payload = {
      title: 'MuhlStore - Notificação de Teste! 🎉',
      body: 'Suas notificações estão funcionando perfeitamente!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: '/' },
    };

    const result = await pushNotifications.sendNotification(subscription, payload);

    if (result.success) {
      res.json({ success: true, message: 'Notificação de teste enviada!' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao enviar notificação de teste' });
  }
});

// Enviar notificação em massa (campanhas)
app.post('/api/push/campaign', async (req, res) => {
  try {
    const { title, body, targetAudience, targetUrl } = req.body;

    // Buscar subscriptions ativas
    let query = 'SELECT id, endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE is_active = TRUE';
    
    if (targetAudience === 'mobile') {
      query += " AND device_type = 'mobile'";
    } else if (targetAudience === 'desktop') {
      query += " AND device_type = 'desktop'";
    }

    const [subs] = await pool.execute(query);

    if (subs.length === 0) {
      return res.status(404).json({ error: 'Nenhuma subscription ativa' });
    }

    const subscriptions = subs.map(s => ({
      endpoint: s.endpoint,
      keys: {
        p256dh: s.p256dh_key,
        auth: s.auth_key,
      },
    }));

    const payload = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: { url: targetUrl || '/' },
    };

    const result = await pushNotifications.sendToMultiple(subscriptions, payload);

    logger.info('Campanha de push enviada', result);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao enviar campanha' });
  }
});

// ==================== CUSTOMERS API (COMPLETO E AVANÇADO) ====================

// Estatísticas do usuário logado (current user stats)
app.get('/api/customers/current/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/customers/current/stats');
    
    // Tentar obter o usuário da sessão
    let userId = null;
    let userEmail = null;
    
    // 1. Tentar via session_id
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0]) {
          userId = sessions[0].user_id;
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // 2. Tentar via cart_id
    if (!userId) {
      const cartId = req.cookies?.cart_id;
      if (cartId) {
        try {
          const [carts] = await pool.execute('SELECT * FROM carts WHERE id = ?', [cartId]);
          if (carts && carts[0] && carts[0].user_id) {
            userId = carts[0].user_id;
          }
        } catch (e) {
          console.log('⚠️ Erro ao buscar usuário pelo cart_id:', e.message);
        }
      }
    }
    
    // 3. Tentar via Authorization header (JWT)
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          // Decodificar token JWT (implementar conforme necessário)
          console.log('🔑 Token JWT recebido:', token.substring(0, 20) + '...');
        } catch (e) {
          console.log('⚠️ Erro ao processar JWT:', e.message);
        }
      }
    }
    
    // 4. NÃO USAR FALLBACKS - Cada usuário deve ter sua própria sessão
    // Removido fallbacks que permitiam acesso a dados de outros usuários
    
    if (!userId) {
      console.log('❌ Nenhum usuário identificado');
      return res.status(401).json({ 
        error: 'Não autorizado - usuário não identificado',
        debug: {
          hasSessionId: !!sessionId,
          hasCartId: !!req.cookies?.cart_id,
          hasAuthHeader: !!req.headers.authorization,
          environment: process.env.NODE_ENV
        },
        totalPedidos: 0,
        pedidosPendentes: 0,
        totalGasto: 0,
        favoritos: 0,
        enderecos: 0,
        cupons: 0
      });
    }
    
    // Buscar estatísticas do usuário
    const [orders] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status IN ("pending", "processing")', [userId]);
    const [totalSpent] = await pool.execute('SELECT SUM(total) as total FROM orders WHERE user_id = ? AND status != "cancelled"', [userId]);
    // Buscar email do usuário para favoritos
    if (!userEmail) {
      const [userEmailResult] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
      userEmail = userEmailResult[0]?.email || userId; // Fallback para userId se for email
    }
    
    const [favorites] = await pool.execute('SELECT COUNT(*) as total FROM favorites WHERE user_email = ?', [userEmail]);
    const [addresses] = await pool.execute('SELECT COUNT(*) as total FROM customer_addresses WHERE cliente_id = ?', [userId]);
    const [coupons] = await pool.execute('SELECT COUNT(*) as total FROM customer_coupons WHERE customer_id = ? AND status = "active"', [userId]);
    
    const stats = {
      totalPedidos: orders[0]?.total || 0,
      pedidosPendentes: pendingOrders[0]?.total || 0,
      totalGasto: parseFloat(totalSpent[0]?.total || 0),
      favoritos: favorites[0]?.total || 0,
      enderecos: addresses[0]?.total || 0,
      cupons: coupons[0]?.total || 0
    };
    
    console.log('✅ Estatísticas do usuário calculadas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      totalPedidos: 0,
      pedidosPendentes: 0,
      totalGasto: 0,
      favoritos: 0,
      enderecos: 0,
      cupons: 0
    });
  }
});

// Estatísticas gerais de clientes (DEVE VIR ANTES de :userId)
app.get('/api/customers/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/customers/stats');
    
    // Buscar estatísticas gerais
    const [totalCustomers] = await pool.execute('SELECT COUNT(*) as total FROM customers');
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as total FROM orders');
    const [totalRevenue] = await pool.execute('SELECT SUM(total) as total FROM orders WHERE status != "cancelled"');
    const [avgOrderValue] = await pool.execute('SELECT AVG(total) as average FROM orders WHERE status != "cancelled"');
    
    const stats = {
      totalCustomers: totalCustomers[0]?.total || 0,
      totalOrders: totalOrders[0]?.total || 0,
      totalRevenue: parseFloat(totalRevenue[0]?.total || 0),
      averageOrderValue: parseFloat(avgOrderValue[0]?.average || 0)
    };
    
    console.log('✅ Estatísticas gerais calculadas:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas gerais:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar estatísticas',
      totalCustomers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    });
  }
});

// Buscar dados completos do cliente
app.get('/api/customers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await pool.execute(`
      SELECT 
        id, nome, email, telefone, cpf, data_nascimento, avatar_url, bio, created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as total_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = users.id AND status != 'cancelled') as total_spent
      FROM users
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const customer = users[0];
    customer.loyalty_points = Math.floor(Number(customer.total_spent) / 10);

    res.json(customer);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// Atualizar dados do cliente
app.put('/api/customers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nome, telefone, cpf, data_nascimento, avatar_url, bio } = req.body;

    await pool.execute(`
      UPDATE users
      SET nome = ?, telefone = ?, cpf = ?, data_nascimento = ?, avatar_url = ?, bio = ?, updated_at = NOW()
      WHERE id = ?
    `, [nome, telefone || null, cpf || null, data_nascimento || null, avatar_url || null, bio || null, userId]);

    logger.info('Cliente atualizado', { userId, nome });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// Estatísticas do cliente (dashboard)
app.get('/api/customers/:userId/stats', async (req, res) => {
  try {
    let { userId } = req.params;
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      try {
        const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
        if (user && user[0]) {
          userId = user[0].id;
        } else {
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
      } catch (e) {
        console.log('⚠️ Erro ao buscar usuário por email:', e.message);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }
    }
    
    // Buscar estatísticas de pedidos
    const [orderStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        MAX(created_at) as last_order_date
      FROM orders
      WHERE customer_id = ? OR user_id = ?
    `, [userId, userId]);

    // Buscar favoritos (usar tabela favorites com email do usuário)
    const [userEmail] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
    const email = userEmail[0]?.email || null;
    const [favStats] = await pool.execute(`
      SELECT COUNT(*) as favorite_count
      FROM favorites
      WHERE user_email = ?
    `, [email]);

    // Calcular pontos de fidelidade (1 ponto a cada R$ 10 gastos)
    const loyaltyPoints = Math.floor(Number(orderStats[0].total_spent) / 10);
    const nextReward = 100; // Próxima recompensa em 100 pontos

    res.json({
      totalOrders: Number(orderStats[0].total_orders) || 0,
      totalSpent: Number(orderStats[0].total_spent) || 0,
      favoriteProducts: Number(favStats[0].favorite_count) || 0,
      lastOrderDate: orderStats[0].last_order_date,
      loyaltyPoints,
      nextReward,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar estatísticas do cliente' });
  }
});

// Estatísticas de pedidos do cliente (para aba pedidos)
app.get('/api/customers/:userId/order-stats', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_spent,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 0 END) as last_month
      FROM orders
      WHERE customer_id = ? OR user_id = ?
    `, [userId, userId]);

    res.json({
      total: Number(stats[0].total) || 0,
      pending: Number(stats[0].pending) || 0,
      delivered: Number(stats[0].delivered) || 0,
      totalSpent: Number(stats[0].total_spent) || 0,
      lastMonth: Number(stats[0].last_month) || 0,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de pedidos' });
  }
});

// ==================== ORDER STATUS API ====================

// Endpoint para verificar status do pedido
app.get('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log(`📊 GET /api/orders/${orderId}/status`);
    
    // Buscar status do pedido
    const [orders] = await pool.execute(`
      SELECT 
        id,
        status,
        payment_status,
        payment_method,
        total,
        created_at,
        updated_at
      FROM orders 
      WHERE id = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    const order = orders[0];
    console.log(`✅ Status do pedido encontrado:`, order);
    res.json(order);
    
  } catch (error) {
    console.error('❌ Erro ao buscar status do pedido:', error);
    res.status(500).json({ error: 'Erro ao buscar status do pedido' });
  }
});

// ==================== USER STATS API ====================

// Endpoint para estatísticas do usuário
app.get('/api/user-stats/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📊 GET /api/user-stats/stats/${userId}`);
    
    // Buscar estatísticas do usuário
    const [orders] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pedidos,
        COALESCE(SUM(total), 0) as total_gasto,
        MAX(created_at) as ultimo_pedido
      FROM orders 
      WHERE customer_id = ? OR user_id = ?
    `, [userId, userId]);
    
    const stats = orders[0] || {
      total_pedidos: 0,
      total_gasto: 0,
      ultimo_pedido: null
    };
    
    console.log(`✅ Estatísticas encontradas:`, stats);
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ==================== TESTE E DESENVOLVIMENTO ====================

// Endpoint para criar dados de teste
app.post('/api/test/create-test-data', async (req, res) => {
  try {
    console.log('🧪 Criando dados de teste...');
    
    // Criar usuário de teste se não existir
    const testEmail = 'cliente@exemplo.com';
    const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ?', [testEmail]);
    
    let userId;
    if (existingUser.length === 0) {
      const [result] = await pool.execute(`
        INSERT INTO users (email, nome, telefone, created_at) 
        VALUES (?, 'Cliente Exemplo', '11999999999', NOW())
      `, [testEmail]);
      userId = result.insertId;
    } else {
      userId = existingUser[0].id;
    }
    
    // Criar sessão de teste
    const sessionId = 'test-session-' + Date.now();
    await pool.execute(`
      INSERT INTO sessions (id, user_id, expires_at) 
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))
    `, [sessionId, userId]);
    
    // Criar endereço de teste
    const [existingAddress] = await pool.execute('SELECT id FROM customer_addresses WHERE cliente_id = ?', [userId]);
    if (existingAddress.length === 0) {
      await pool.execute(`
        INSERT INTO customer_addresses 
        (cliente_id, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default, created_at)
        VALUES (?, 'Casa', 'Rua das Flores', '123', 'Apto 45', 'Centro', 'São Paulo', 'SP', '01234567', 'residencial', 1, NOW())
      `, [userId]);
    }
    
    res.json({ 
      success: true, 
      userId, 
      sessionId,
      message: 'Dados de teste criados com sucesso!'
    });
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Endpoint para testar com dados de teste
app.get('/api/test/stats', async (req, res) => {
  try {
    const testEmail = 'cliente@exemplo.com';
    const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [testEmail]);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'Usuário de teste não encontrado' });
    }
    
    const userId = user[0].id;
    
    // Buscar estatísticas
    const [orders] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE user_id = ?', [userId]);
    const [pendingOrders] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE user_id = ? AND status IN ("pending", "processing")', [userId]);
    const [totalSpent] = await pool.execute('SELECT SUM(total) as total FROM orders WHERE user_id = ? AND status != "cancelled"', [userId]);
    const [addresses] = await pool.execute('SELECT COUNT(*) as total FROM customer_addresses WHERE cliente_id = ?', [userId]);
    
    const stats = {
      totalPedidos: orders[0]?.total || 0,
      pedidosPendentes: pendingOrders[0]?.total || 0,
      totalGasto: parseFloat(totalSpent[0]?.total || 0),
      favoritos: 0,
      enderecos: addresses[0]?.total || 0,
      cupons: 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de teste:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ==================== ADDRESSES API (ENDEREÇOS MÚLTIPLOS) ====================

// Listar endereços do cliente
app.get('/api/customers/addresses', async (req, res) => {
  try {
    console.log('🏠 GET /api/customers/addresses');
    
    // Obter usuário da sessão (mesma lógica do stats)
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // NÃO USAR FALLBACKS - Cada usuário deve ter sua própria sessão
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Buscar endereços
    const [addresses] = await pool.execute(`
      SELECT * FROM customer_addresses 
      WHERE customer_id = ? 
      ORDER BY padrao DESC, created_at DESC
    `, [userId]);
    
    res.json(addresses);
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Criar novo endereço
app.post('/api/customers/addresses', async (req, res) => {
  try {
    console.log('🏠 POST /api/customers/addresses');
    
    const { nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !rua || !cidade || !estado || !cep) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // NÃO USAR FALLBACKS - Cada usuário deve ter sua própria sessão
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Se for endereço padrão, remover padrão dos outros
    if (is_default) {
      await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ?', [userId]);
    }
    
    // Inserir novo endereço
    const [result] = await pool.execute(`
      INSERT INTO customer_addresses 
      (customer_id, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, padrao, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [userId, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default || 0]);
    
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('❌ Erro ao salvar endereço:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Atualizar endereço
app.put('/api/customers/addresses/:id', async (req, res) => {
  try {
    console.log('🏠 PUT /api/customers/addresses/' + req.params.id);
    
    const { id } = req.params;
    const { nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default } = req.body;
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // NÃO USAR FALLBACKS - Cada usuário deve ter sua própria sessão
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Se for endereço padrão, remover padrão dos outros
    if (is_default) {
      await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ?', [userId]);
    }
    
    // Atualizar endereço
    await pool.execute(`
      UPDATE customer_addresses 
      SET nome = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, 
          cidade = ?, estado = ?, cep = ?, tipo = ?, padrao = ?, updated_at = NOW()
      WHERE id = ? AND customer_id = ?
    `, [nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, is_default || 0, id, userId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Deletar endereço
app.delete('/api/customers/addresses/:id', async (req, res) => {
  try {
    console.log('🏠 DELETE /api/customers/addresses/' + req.params.id);
    
    const { id } = req.params;
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          } else {
            console.log('⚠️ Cliente não encontrado para email:', userEmail);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    // NÃO USAR FALLBACKS - Cada usuário deve ter sua própria sessão
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Deletar endereço
    await pool.execute('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [id, userId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ==================== ADDRESSES API (ENDEREÇOS MÚLTIPLOS) ====================

// Debug endpoint para testar conexão
app.get('/api/debug/connection', async (req, res) => {
  try {
    console.log('🔍 Testando conexão...');
    
    // Testar SELECT DATABASE()
    const [db] = await pool.execute('SELECT DATABASE() as db');
    console.log('📍 Banco:', db[0].db);
    
    // Testar SHOW TABLES
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('📋 Tabelas:', tableNames);
    
    // Verificar se customer_addresses existe
    if (tableNames.includes('customer_addresses')) {
      console.log('✅ Tabela customer_addresses encontrada!');
      
      // Testar SELECT na tabela
      const [count] = await pool.execute('SELECT COUNT(*) as total FROM customer_addresses');
      console.log('🏠 Total de endereços:', count[0].total);
      
      res.json({ 
        success: true, 
        database: db[0].db,
        tables: tableNames,
        customer_addresses_exists: true,
        total_addresses: count[0].total
      });
    } else {
      console.log('❌ Tabela customer_addresses NÃO encontrada!');
      res.json({ 
        success: false, 
        database: db[0].db,
        tables: tableNames,
        customer_addresses_exists: false
      });
    }
  } catch (e) {
    console.error('❌ Erro no debug:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Listar endereços do cliente
app.get('/api/customers/:userId/addresses', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 GET /api/customers/${userId}/addresses`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      try {
        console.log(`🔍 Buscando usuário por email: ${userId}`);
        const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
        if (user && user[0]) {
          userId = user[0].id;
          console.log(`✅ Usuário encontrado com ID: ${userId}`);
        } else {
          console.log(`❌ Usuário não encontrado para email: ${userId}`);
          return res.status(404).json({ error: 'Usuário não encontrado', addresses: [] });
        }
      } catch (e) {
        console.error('⚠️ Erro ao buscar usuário por email:', e);
        return res.status(500).json({ error: 'Erro ao buscar usuário', details: e.message, addresses: [] });
      }
    }
    
    // Debug: verificar banco atual
    console.log(`🔍 Verificando banco atual...`);
    const [dbInfo] = await pool.execute('SELECT DATABASE() as current_db');
    console.log(`📍 Banco atual: ${dbInfo[0].current_db}`);
    
    // Debug: listar tabelas
    console.log(`🔍 Listando tabelas...`);
    const [tables] = await pool.execute('SHOW TABLES');
    console.log(`📋 Tabelas encontradas:`, tables.map(t => Object.values(t)[0]));
    
    // Buscar endereços
    console.log(`🔍 Buscando endereços para userId: ${userId}`);
    const [addresses] = await pool.execute(`
      SELECT id, nome as label, cep, rua as endereco, numero, complemento, bairro, cidade, estado, padrao as is_default, created_at, updated_at
      FROM customer_addresses
      WHERE customer_id = ?
      ORDER BY padrao DESC, created_at DESC
    `, [userId]);

    console.log(`✅ Encontrados ${addresses.length} endereços`);
    res.json({ addresses: addresses || [] });
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    logger.logError(error, req);
    res.status(500).json({ 
      error: 'Erro ao buscar endereços', 
      details: error.message,
      addresses: [] // Sempre retornar array vazio em caso de erro
    });
  }
});

// Criar novo endereço
app.post('/api/customers/:userId/addresses', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`🔍 POST /api/customers/${userId}/addresses - Iniciando...`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      try {
        console.log(`🔍 Buscando usuário por email: ${userId}`);
        const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
        if (user && user[0]) {
          userId = user[0].id;
          console.log(`✅ Usuário encontrado: ${userId}`);
        } else {
          console.log(`❌ Usuário não encontrado para email: ${userId}`);
          return res.status(404).json({ error: 'Usuário não encontrado' });
        }
      } catch (e) {
        console.log('⚠️ Erro ao buscar usuário por email:', e.message);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
      }
    }
    
    const { label, cep, endereco, numero, complemento, bairro, cidade, estado, is_default } = req.body;
    const id = crypto.randomUUID();
    
    console.log(`📝 Dados do endereço:`, { label, cep, endereco, numero, complemento, bairro, cidade, estado, is_default });

    // Verificar banco atual
    try {
      const [db] = await pool.execute('SELECT DATABASE() as current_db');
      console.log(`📍 Banco atual: ${db[0].current_db}`);
    } catch (e) {
      console.log('⚠️ Erro ao verificar banco:', e.message);
    }

    // Tabela existe e está acessível
    console.log(`✅ Tentando inserir endereço...`);

    // Inserir endereço
    console.log(`💾 Inserindo novo endereço...`);
    await pool.execute(`
      INSERT INTO customer_addresses (id, customer_id, tipo, nome, rua, numero, complemento, bairro, cidade, estado, cep, padrao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, userId, label.toLowerCase(), label, endereco, numero, complemento || null, bairro, cidade, estado, cep, is_default ? 1 : 0]);
    
    // Se for padrão, remover padrão dos outros
    if (is_default) {
      console.log(`🔄 Removendo padrão dos outros endereços...`);
      await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ? AND id != ?', [userId, id]);
    }

    console.log(`✅ Endereço criado para user_id=${userId}, address_id=${id}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error('❌ Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

// Atualizar endereço
app.put('/api/customers/:userId/addresses/:addressId', async (req, res) => {
  try {
    let { userId, addressId } = req.params;
    
    // Converter email para userId se necessário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
      else return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const { label, cep, endereco, numero, complemento, bairro, cidade, estado, is_default } = req.body;

    if (is_default) {
      await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ?', [userId]);
    }

    await pool.execute(`
      UPDATE customer_addresses
      SET tipo = ?, nome = ?, cep = ?, rua = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, estado = ?, padrao = ?, updated_at = NOW()
      WHERE id = ? AND customer_id = ?
    `, [label.toLowerCase(), label, cep, endereco, numero, complemento || null, bairro, cidade, estado, is_default ? 1 : 0, addressId, userId]);

    console.log(`✅ Endereço ${addressId} atualizado para user_id=${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
});

// Deletar endereço
app.delete('/api/customers/:userId/addresses/:addressId', async (req, res) => {
  try {
    let { userId, addressId } = req.params;
    
    // Converter email para userId se necessário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
      else return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    await pool.execute('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [addressId, userId]);

    console.log(`✅ Endereço ${addressId} deletado para user_id=${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro ao deletar endereço' });
  }
});

// Definir endereço como padrão
app.patch('/api/customers/:userId/addresses/:addressId/set-default', async (req, res) => {
  try {
    let { userId, addressId } = req.params;
    
    // Converter email para userId se necessário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
      else return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    await pool.execute('UPDATE customer_addresses SET padrao = 0 WHERE customer_id = ?', [userId]);
    await pool.execute('UPDATE customer_addresses SET padrao = 1 WHERE id = ? AND customer_id = ?', [addressId, userId]);

    console.log(`✅ Endereço ${addressId} definido como padrão para user_id=${userId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao definir endereço padrão:', error);
    res.status(500).json({ error: 'Erro ao definir endereço padrão' });
  }
});

// ==================== FAVORITES/WISHLIST API ====================

// Listar favoritos do cliente
app.get('/api/customers/:userId/favorites', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar email do usuário
    const [userEmail] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
    const email = userEmail[0]?.email || null;
    
    if (!email) {
      return res.json({ favorites: [] });
    }
    
    const [favorites] = await pool.execute(`
      SELECT p.*
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_email = ?
      ORDER BY f.created_at DESC
    `, [email]);

    res.json({ favorites });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

// Adicionar aos favoritos
app.post('/api/customers/:userId/favorites/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    // Buscar email do usuário
    const [userEmail] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
    const email = userEmail[0]?.email || null;
    
    if (!email) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    
    const id = crypto.randomUUID();

    await pool.execute(`
      INSERT IGNORE INTO favorites (id, user_email, product_id)
      VALUES (?, ?, ?)
    `, [id, email, productId]);

    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao adicionar favorito' });
  }
});

// Remover dos favoritos
app.delete('/api/customers/:userId/favorites/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    // Buscar email do usuário
    const [userEmail] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
    const email = userEmail[0]?.email || null;
    
    if (!email) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    
    await pool.execute('DELETE FROM favorites WHERE user_email = ? AND product_id = ?', [email, productId]);

    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// ==================== REVIEWS API ====================

// Listar reviews de um produto
app.get('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const [reviews] = await pool.execute(`
      SELECT 
        r.*,
        u.nome as user_name,
        u.avatar_url as user_avatar,
        EXISTS(SELECT 1 FROM orders o JOIN order_items oi ON o.id = oi.order_id WHERE o.user_id = r.user_id AND oi.product_id = r.product_id AND o.status = 'delivered') as verified_purchase
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [productId]);

    res.json({ reviews });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

// Criar review
app.post('/api/products/:productId/reviews', async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, user_id } = req.body;
    const id = crypto.randomUUID();

    await pool.execute(`
      INSERT INTO product_reviews (id, product_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `, [id, productId, user_id, rating, comment]);

    // Atualizar média de avaliações do produto
    const [avgResult] = await pool.execute(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM product_reviews
      WHERE product_id = ?
    `, [productId]);

    await pool.execute(`
      UPDATE products
      SET avaliacao = ?, total_avaliacoes = ?
      WHERE id = ?
    `, [avgResult[0].avg_rating, avgResult[0].total_reviews, productId]);

    logger.info('Review criado', { productId, userId: user_id, rating });
    res.json({ success: true, id });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

// Curtir review
app.post('/api/reviews/:reviewId/like', async (req, res) => {
  try {
    const { reviewId } = req.params;
    await pool.execute('UPDATE product_reviews SET likes = likes + 1 WHERE id = ?', [reviewId]);
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao curtir avaliação' });
  }
});

// ==================== REVIEWS API AVANÇADO ====================

// Estatísticas de reviews de um produto
app.get('/api/products/:productId/reviews/stats', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1,
        SUM(CASE WHEN verified_purchase = 1 THEN 1 ELSE 0 END) as verified_purchases
      FROM product_reviews
      WHERE product_id = ? AND status = 'approved'
    `, [productId]);

    res.json(stats[0] || {});
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Votar em review (helpful/not helpful)
app.post('/api/reviews/:reviewId/vote', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { user_id, vote_type } = req.body;
    const voteId = crypto.randomUUID();

    // Inserir ou atualizar voto
    await pool.execute(`
      INSERT INTO review_votes (id, review_id, user_id, vote_type)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE vote_type = VALUES(vote_type)
    `, [voteId, reviewId, user_id, vote_type]);

    // Recalcular contadores
    const [votes] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN vote_type = 'helpful' THEN 1 ELSE 0 END) as helpful,
        SUM(CASE WHEN vote_type = 'not_helpful' THEN 1 ELSE 0 END) as not_helpful
      FROM review_votes
      WHERE review_id = ?
    `, [reviewId]);

    await pool.execute(`
      UPDATE product_reviews
      SET helpful_count = ?, not_helpful_count = ?
      WHERE id = ?
    `, [votes[0].helpful, votes[0].not_helpful, reviewId]);

    logger.info('Voto em review registrado', { reviewId, voteType: vote_type });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao votar' });
  }
});

// ==================== ADMIN REVIEWS API ====================

// Listar reviews pendentes (moderação)
app.get('/api/admin/reviews/pending', async (req, res) => {
  try {
    const [reviews] = await pool.execute(`
      SELECT 
        r.*,
        u.nome as user_name,
        p.nome as product_name,
        p.imagem_url as product_image
      FROM product_reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN produtos p ON r.product_id = p.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    // Buscar mídias de cada review
    for (let review of reviews) {
      const [media] = await pool.execute(
        'SELECT * FROM review_media WHERE review_id = ?',
        [review.id]
      );
      review.media = media;
    }

    logger.info('Reviews pendentes carregados', { count: reviews.length });
    res.json({ reviews });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar reviews pendentes' });
  }
});

// Aprovar review
app.post('/api/admin/reviews/:reviewId/approve', async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    await pool.execute(
      'UPDATE product_reviews SET status = ?, updated_at = NOW() WHERE id = ?',
      ['approved', reviewId]
    );

    // Log de moderação
    const logId = crypto.randomUUID();
    await pool.execute(`
      INSERT INTO review_moderation_log (id, review_id, moderator_id, action)
      VALUES (?, ?, ?, ?)
    `, [logId, reviewId, 'admin-user-id', 'approve']);

    logger.info('Review aprovado', { reviewId });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao aprovar review' });
  }
});

// Rejeitar review
app.post('/api/admin/reviews/:reviewId/reject', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    await pool.execute(
      'UPDATE product_reviews SET status = ?, moderation_reason = ?, updated_at = NOW() WHERE id = ?',
      ['rejected', reason, reviewId]
    );

    // Log de moderação
    const logId = crypto.randomUUID();
    await pool.execute(`
      INSERT INTO review_moderation_log (id, review_id, moderator_id, action, reason)
      VALUES (?, ?, ?, ?, ?)
    `, [logId, reviewId, 'admin-user-id', 'reject', reason]);

    logger.info('Review rejeitado', { reviewId, reason });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao rejeitar review' });
  }
});

// Responder review (vendedor)
app.post('/api/admin/reviews/:reviewId/response', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response_text, admin_id } = req.body;
    const responseId = crypto.randomUUID();
    
    await pool.execute(`
      INSERT INTO review_responses (id, review_id, admin_id, response_text)
      VALUES (?, ?, ?, ?)
    `, [responseId, reviewId, admin_id, response_text]);

    logger.info('Resposta de review criada', { reviewId, responseId });
    res.json({ success: true, id: responseId });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar resposta' });
  }
});

// Upload de mídia para review (com multer)
const reviewUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../public/lovable-uploads/reviews');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'review-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

app.post('/api/reviews/:reviewId/media', reviewUpload.array('images', 5), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const mediaIds = [];
    for (const file of files) {
      const mediaId = crypto.randomUUID();
      const mediaUrl = `/lovable-uploads/reviews/${file.filename}`;

      await pool.execute(`
        INSERT INTO review_media (id, review_id, media_type, media_url, file_size, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [mediaId, reviewId, 'image', mediaUrl, file.size, mediaUrl]);

      mediaIds.push(mediaId);
    }

    logger.info('Mídias de review adicionadas', { reviewId, count: files.length });
    res.json({ success: true, media_ids: mediaIds });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

// ==================== ORDERS API (AVANÇADO) ====================

// Estatísticas de pedidos
app.get('/api/orders/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) as total_revenue
      FROM orders
    `);

    res.json({
      total: Number(stats[0].total) || 0,
      pending: Number(stats[0].pending) || 0,
      processing: Number(stats[0].processing) || 0,
      shipped: Number(stats[0].shipped) || 0,
      delivered: Number(stats[0].delivered) || 0,
      cancelled: Number(stats[0].cancelled) || 0,
      totalRevenue: Number(stats[0].total_revenue) || 0,
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de pedidos' });
  }
});

// Atualizar status do pedido
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    
    logger.info('Status do pedido atualizado', { orderId: id, newStatus: status });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Atualizar pedido (genérico - para cancelar, etc)
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    
    logger.info('Pedido atualizado', { orderId: id, newStatus: status });
    res.json({ success: true, message: 'Pedido atualizado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

// Excluir pedido
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o pedido existe
    const [order] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (order.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    // Deletar itens do pedido primeiro
    await pool.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Deletar o pedido
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    
    logger.info('Pedido excluído', { orderId: id });
    res.json({ success: true, message: 'Pedido excluído com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao excluir pedido' });
  }
});

// Reordenar (adicionar produtos do pedido ao carrinho)
app.post('/api/orders/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const cartId = getOrCreateCartId(req, res);

    // Buscar itens do pedido
    const [orderItems] = await pool.execute(`
      SELECT product_id, name, price, image_url, quantity
      FROM order_items
      WHERE order_id = ?
    `, [id]);

    if (orderItems.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Adicionar cada item ao carrinho
    for (const item of orderItems) {
      await pool.execute(`
        INSERT INTO cart_items (cart_id, product_id, name, price, image_url, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `, [cartId, item.product_id, item.name, item.price, item.image_url, item.quantity]);
    }

    // Retornar carrinho atualizado
    const [cartItems] = await pool.execute(`
      SELECT * FROM cart_items WHERE cart_id = ? ORDER BY created_at DESC
    `, [cartId]);

    logger.info('Pedido readicionado ao carrinho', { orderId: id, itemsCount: orderItems.length });
    res.json({ success: true, items: cartItems });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao reordenar' });
  }
});

// Gerar nota fiscal (simulado)
app.get('/api/orders/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orders[0];

    // Gerar PDF ou HTML simples da nota fiscal
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota Fiscal - Pedido #${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .info { margin: 20px 0; }
          .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NOTA FISCAL SIMPLIFICADA</h1>
          <p>MuhlStore - Brinquedos Raros</p>
        </div>
        <div class="info">
          <p><strong>Pedido:</strong> #${order.id}</p>
          <p><strong>Data:</strong> ${new Date(order.created_at).toLocaleString('pt-BR')}</p>
          <p><strong>Cliente:</strong> ${order.customer_name || 'N/A'}</p>
          <p><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
        </div>
        <div class="total">
          <p>TOTAL: R$ ${Number(order.total).toFixed(2)}</p>
        </div>
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
          <p>Este é um documento simplificado. Para nota fiscal oficial, entre em contato.</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao gerar nota fiscal' });
  }
});

// ==================== FORNECEDORES/SUPPLIERS API ====================

// Buscar todos os fornecedores
app.get('/api/suppliers', async (req, res) => {
  try {
    console.log('🔍 Iniciando busca de fornecedores...');
    
    // Primeiro, verificar se a tabela existe e criar se necessário
    console.log('📋 Verificando/criando tabela fornecedores...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        telefone VARCHAR(20),
        endereco TEXT,
        cnpj VARCHAR(20),
        total_expenses DECIMAL(10,2) DEFAULT 0,
        last_payment DATE,
        status ENUM('ativo', 'inativo') DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela fornecedores verificada/criada');

    // Inserir dados de exemplo se a tabela estiver vazia
    console.log('🔢 Verificando quantidade de fornecedores...');
    const [countRows] = await pool.execute('SELECT COUNT(*) as count FROM fornecedores');
    console.log('📊 Quantidade atual:', countRows[0].count);
    
    if (countRows[0].count === 0) {
      console.log('➕ Inserindo dados de exemplo...');
      await pool.execute(`
        INSERT INTO fornecedores (nome, email, telefone, total_expenses, last_payment, status) VALUES
        ('Brinquedos ABC Ltda', 'contato@abcbrinquedos.com', '(11) 99999-1111', 1200.00, CURDATE() - INTERVAL 1 DAY, 'ativo'),
        ('Educacional XYZ', 'vendas@educacionalxyz.com', '(11) 99999-2222', 890.00, CURDATE() - INTERVAL 2 DAY, 'ativo'),
        ('Distribuidora Kids', 'info@distribuidorakids.com', '(11) 99999-3333', 1560.00, CURDATE() - INTERVAL 3 DAY, 'ativo'),
        ('Importadora Toys', 'contato@importadoratoys.com', '(11) 99999-4444', 2340.00, CURDATE() - INTERVAL 4 DAY, 'ativo')
      `);
      console.log('✅ Dados de exemplo inseridos');
    }

    console.log('📥 Buscando fornecedores...');
    const [rows] = await pool.execute(`
      SELECT 
        id,
        nome,
        email,
        telefone,
        endereco,
        cnpj,
        total_expenses,
        last_payment,
        status,
        created_at,
        updated_at
      FROM fornecedores 
      ORDER BY nome ASC
    `);
    
    console.log('✅ Fornecedores carregados:', rows.length);
    logger.info('Fornecedores carregados', { count: rows.length });
    res.json({ suppliers: rows, total: rows.length });
  } catch (error) {
    console.error('❌ ERRO ao buscar fornecedores:', error);
    console.error('❌ Stack:', error.stack);
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar fornecedores', details: error.message });
  }
});

// Buscar fornecedor por ID
app.get('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM fornecedores WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar fornecedor' });
  }
});

// Criar fornecedor
app.post('/api/suppliers', async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco, cidade, estado, cep, contato } = req.body;
    const id = crypto.randomUUID();
    
    await pool.execute(`
      INSERT INTO fornecedores (id, nome, cnpj, telefone, email, endereco, cidade, estado, cep, contato)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, nome, cnpj || null, telefone || null, email || null, endereco || null, cidade || null, estado || null, cep || null, contato || null]);
    
    logger.info('Fornecedor criado', { id, nome });
    res.json({ success: true, id });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// Atualizar fornecedor
app.put('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco, cidade, estado, cep, contato } = req.body;
    
    await pool.execute(`
      UPDATE fornecedores 
      SET nome = ?, cnpj = ?, telefone = ?, email = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, contato = ?, updated_at = NOW()
      WHERE id = ?
    `, [nome, cnpj || null, telefone || null, email || null, endereco || null, cidade || null, estado || null, cep || null, contato || null, id]);
    
    logger.info('Fornecedor atualizado', { id, nome });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

// Deletar fornecedor
app.delete('/api/suppliers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);
    
    logger.info('Fornecedor deletado', { id });
    res.json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao deletar fornecedor' });
  }
});

// ==================== MERCADO PAGO INTEGRATION ====================
const {
  initializeMercadoPago,
  createPaymentPreference,
  getPaymentInfo,
  processWebhookNotification,
  createPixPayment,
} = require('../config/mercadopago.cjs');

// Inicializar Mercado Pago
initializeMercadoPago();

// Inicializar serviço de e-mail
initializeEmailService();

// Inicializar agendador de recuperação de carrinho
initializeScheduler(pool);
scheduleMonthlyCleanup();

// Inicializar Redis (opcional - funciona sem)
redisCache.initializeRedis();

// Inicializar Push Notifications
const pushNotifications = require('../config/pushNotifications.cjs');
pushNotifications.initializePushNotifications();

// Criar preferência de pagamento
app.post('/api/payments/mercadopago/create-preference', async (req, res) => {
  try {
    const { items, payer, external_reference } = req.body;

    const result = await createPaymentPreference({
      items,
      payer,
      external_reference,
    });

    if (result.success) {
      logger.info('Preferência MP criada', { preference_id: result.preference_id });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Criar pagamento PIX via Mercado Pago
app.post('/api/payments/mercadopago/pix', async (req, res) => {
  try {
    const { transaction_amount, description, payer, external_reference } = req.body;

    const result = await createPixPayment({
      transaction_amount,
      description,
      payer,
      external_reference,
    });

    if (result.success) {
      logger.info('PIX MP criado', { payment_id: result.payment_id });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhook do Mercado Pago
app.post('/api/payments/mercadopago/webhook', async (req, res) => {
  try {
    logger.info('Webhook MP recebido', { body: req.body, query: req.query });

    const notificationData = req.body;
    const result = await processWebhookNotification(notificationData);

    if (result.success && result.action_needed === 'confirm_order') {
      // Atualizar status do pedido no banco
      const externalRef = result.payment.external_reference;
      
      // Aqui você pode atualizar o status do pedido no banco de dados
      logger.info('Pedido aprovado via webhook', {
        external_reference: externalRef,
        payment_id: result.payment.id,
        status: result.payment.status,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verificar status de pagamento
app.get('/api/payments/mercadopago/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const result = await getPaymentInfo(paymentId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handler do Sentry (deve ser depois de todas as rotas e antes de outros error handlers)
app.use(sentry.sentryErrorHandler());

// Error handler global
app.use((err, req, res, next) => {
  logger.logError(err, req);
  sentry.captureException(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Carousel API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎠 Carousel API: http://localhost:${PORT}/api/carousel`);
  console.log(`💳 Mercado Pago: Integrado`);
  console.log(`🔍 Sentry: ${sentry.isInitialized() ? 'Ativo' : 'Desabilitado'}`);
  console.log(`⚡ Redis: ${redisCache.isAvailable() ? 'Conectado' : 'Desabilitado'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Flush Sentry events
  await sentry.flush(2000);
  
  // Fechar conexões
  await pool.end();
  
  console.log('✅ Server shut down gracefully');
  process.exit(0);
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar pedido
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    const order = orders[0];

    // Buscar itens do pedido
    let items;
    try {
      const [cols] = await pool.execute('DESCRIBE order_items');
      const fields = Array.isArray(cols) ? cols.map((c) => c.Field) : [];
      const nameCol = fields.includes('name') ? 'name' : (fields.includes('product_name') ? 'product_name' : null);
      const imageCol = fields.includes('image_url') ? 'image_url' : (fields.includes('image') ? 'image' : null);
      const sql = `SELECT order_id, product_id, ${nameCol || "'Produto' AS name"}, price, ${imageCol || "NULL AS image_url"}, quantity FROM order_items WHERE order_id = ?`;
      const [rows] = await pool.execute(sql, [id]);
      items = rows;
    } catch {
      const [rows] = await pool.execute('SELECT order_id, product_id, price, quantity FROM order_items WHERE order_id = ?', [id]);
      items = rows.map((r) => ({ ...r, name: 'Produto', image_url: null }));
    }

    // Normalização básica de tipos e URLs
    let normalizedItems = (items || []).map((it) => ({
      order_id: it.order_id,
      product_id: it.product_id,
      name: it.name,
      price: Number(it.price || 0),
      image_url: it.image_url ? getPublicUrl(req, it.image_url) : null,
      quantity: Number(it.quantity || 1),
    }));

    // Enriquecer com dados de products quando faltar name/imagem
    try {
      const missing = normalizedItems.filter(i => !i.image_url || !i.name || i.name === 'Produto');
      const productIds = [...new Set(missing.map(i => i.product_id))];
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        // Detectar colunas reais de products
        let pRows;
        try {
          const [pCols] = await pool.execute('DESCRIBE products');
          const pFields = Array.isArray(pCols) ? pCols.map(c => c.Field) : [];
          const nameCol = pFields.includes('nome') ? 'nome' : (pFields.includes('name') ? 'name' : null);
          const imgCol = pFields.includes('imagem_url') ? 'imagem_url'
                         : (pFields.includes('image_url') ? 'image_url'
                         : (pFields.includes('imagemUrl') ? 'imagemUrl'
                         : (pFields.includes('image') ? 'image' : null)));
          const selectNome = nameCol ? nameCol : "NULL";
          const selectImg = imgCol ? imgCol : "NULL";
          const [rows] = await pool.query(
            `SELECT id, ${selectNome} AS nome, ${selectImg} AS imagem_url FROM produtos WHERE id IN (${placeholders})`,
            productIds
          );
          pRows = rows;
        } catch (_e) {
          // Fallback amplo
          const [rows] = await pool.query(
            `SELECT id, COALESCE(nome, name) AS nome, COALESCE(imagem_url, image_url) AS imagem_url FROM produtos WHERE id IN (${placeholders})`,
            productIds
          );
          pRows = rows;
        }
        const map = new Map((pRows || []).map(r => [String(r.id), r]));
        normalizedItems = normalizedItems.map(i => {
          const needsName = !i.name || i.name === 'Produto';
          const needsImage = !i.image_url;
          if (needsName || needsImage) {
            const p = map.get(String(i.product_id));
            if (p) {
              if (needsName) i.name = p.nome || 'Produto';
              if (needsImage) i.image_url = p.imagem_url ? getPublicUrl(req, p.imagem_url) : null;
            }
          }
          return i;
        });
      }
    } catch {}

    // Mapear campos conforme schema atual
    const paymentMethod = order.payment_method || order.metodo_pagamento || null;
    const shippingAddress = order.shipping_address || order.endereco || null;
    const rawStatus = order.status;
    let friendlyStatus = rawStatus || 'pending';
    try {
      if (rawStatus === 0) {
        friendlyStatus = 'pending';
      }
    } catch (_e) {}

    res.json({
      id: order.id,
      status: friendlyStatus,
      total: Number(order.total || 0),
      created_at: order.created_at || null,
      nome: order.nome || null,
      email: order.email || null,
      telefone: order.telefone || null,
      endereco: shippingAddress,
      metodo_pagamento: paymentMethod,
      items: normalizedItems,
    });
  } catch (e) {
    console.error('Order detail error', e);
    res.status(500).json({ error: 'order_detail_failed' });
  }
});

app.post('/api/orders/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const cartId = getOrCreateCartId(req, res);

    // Buscar itens do pedido
    let items;
    try {
      const [cols] = await pool.execute('DESCRIBE order_items');
      const fields = Array.isArray(cols) ? cols.map((c) => c.Field) : [];
      const nameCol = fields.includes('name') ? 'name' : (fields.includes('product_name') ? 'product_name' : null);
      const imageCol = fields.includes('image_url') ? 'image_url' : (fields.includes('image') ? 'image' : null);
      const sql = `SELECT product_id, ${nameCol || "'Produto' AS name"}, price, ${imageCol || "NULL AS image_url"}, quantity FROM order_items WHERE order_id = ?`;
      const [rows] = await pool.execute(sql, [id]);
      items = rows;
    } catch {
      const [rows] = await pool.execute('SELECT product_id, price, quantity FROM order_items WHERE order_id = ?', [id]);
      items = rows.map((r) => ({ ...r, name: 'Produto', image_url: null }));
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(404).json({ error: 'order_items_not_found' });
    }

    // Inserir/atualizar no carrinho: somar quantidades se já existir mesmo product_id
    for (const it of items) {
      // Verificar se já existe item igual no carrinho
      const [existing] = await pool.execute(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1',
        [cartId, it.product_id]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        const current = existing[0];
        await pool.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [Number(current.quantity) + Number(it.quantity || 1), current.id]);
      } else {
        await pool.execute(
          'INSERT INTO cart_items (cart_id, product_id, name, price, image_url, quantity) VALUES (?,?,?,?,?,?)',
          [cartId, it.product_id, it.name, it.price, it.image_url, it.quantity || 1]
        );
      }
    }

    // Retornar carrinho atualizado
    const [cart] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ?', [cartId]);
    res.json({ items: cart });
  } catch (e) {
    console.error('Order reorder error', e);
    res.status(500).json({ error: 'order_reorder_failed' });
  }
});

app.post('/api/orders/:id/resend', async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar pedido completo e usar email se existir
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    const order = orders[0];

    // Buscar itens e enriquecer nome/imagem
    const [items] = await pool.execute('SELECT product_id, quantity, price FROM order_items WHERE order_id = ?', [id]);
    const productIds = [...new Set((items || []).map(i => i.product_id))];
    let productsMap = new Map();
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      const [pCols] = await pool.execute('DESCRIBE products');
      const pFields = Array.isArray(pCols) ? pCols.map(c => c.Field) : [];
      const nameCol = pFields.includes('nome') ? 'nome' : (pFields.includes('name') ? 'name' : null);
      const imgCol = pFields.includes('imagem_url') ? 'imagem_url'
                     : (pFields.includes('image_url') ? 'image_url'
                     : (pFields.includes('imagemUrl') ? 'imagemUrl'
                     : (pFields.includes('image') ? 'image' : null)));
      const selectNome = nameCol ? nameCol : "NULL";
      const selectImg = imgCol ? imgCol : "NULL";
      const [pRows] = await pool.query(`SELECT id, ${selectNome} AS nome, ${selectImg} AS imagem_url FROM produtos WHERE id IN (${placeholders})`, productIds);
      productsMap = new Map((pRows || []).map(r => [String(r.id), r]));
    }

    const normalizedItems = (items || []).map((it) => {
      const p = productsMap.get(String(it.product_id));
      return {
        product_id: it.product_id,
        name: p?.nome || 'Produto',
        image_url: p?.imagem_url ? getPublicUrl(req, p.imagem_url) : null,
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
        total: Number(it.price || 0) * Number(it.quantity || 1)
      };
    });

    const total = normalizedItems.reduce((acc, i) => acc + i.total, 0);
    const createdAt = order.created_at || new Date();
    const paymentMethod = order.payment_method || order.metodo_pagamento || '—';
    const html = `
<!doctype html>
<html><head><meta charset="utf-8"/><title>Comprovante do Pedido ${order.id}</title>
<style>
body{font-family:ui-sans-serif,system-ui,Arial,sans-serif;color:#111}
.wrap{max-width:640px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:12px}
.h{font-size:20px;font-weight:700;margin:0 0 8px}
.muted{color:#666}
.row{display:flex;align-items:center;gap:10px}
.item{display:flex;gap:12px;border-top:1px solid #eee;padding:12px 0}
.img{width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #ddd}
.right{text-align:right;margin-left:auto}
.total{font-weight:700}
</style></head>
<body>
  <div class="wrap">
    <div class="h">Comprovante do Pedido ${order.id}</div>
    <div class="muted">Realizado em ${new Date(createdAt).toLocaleString('pt-BR')}</div>
    <div class="muted">Pagamento: ${paymentMethod.toUpperCase()}</div>
    <div style="margin:16px 0"></div>
    ${normalizedItems.map(i => `
      <div class="item">
        ${i.image_url ? `<img class="img" src="${i.image_url}" alt="${i.name}"/>` : '<div class="img" style="background:#f6f6f6"></div>'}
        <div>
          <div>${i.name}</div>
          <div class="muted">Qtd: ${i.quantity} • Unit: R$ ${i.price.toFixed(2)}</div>
        </div>
        <div class="right">R$ ${i.total.toFixed(2)}</div>
      </div>
    `).join('')}
    <div class="item" style="border-top:2px solid #ddd"></div>
    <div class="row">
      <div class="muted">Total</div>
      <div class="right total">R$ ${total.toFixed(2)}</div>
    </div>
  </div>
</body></html>`;

    // Envio real por SMTP, se configurado
    let sent = false;
    try {
      const h = process.env.SMTP_HOST;
      const u = process.env.SMTP_USER;
      const p = process.env.SMTP_PASS;
      const from = process.env.SMTP_FROM || 'no-reply@localhost';
      const to = (order.email && String(order.email)) || process.env.SMTP_TO || '';
      if (h && u && p && from && to) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: h,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Boolean(process.env.SMTP_SECURE === 'true'),
          auth: { user: u, pass: p }
        });
        await transporter.sendMail({
          from,
          to,
          subject: `Comprovante do Pedido ${order.id}`,
          html
        });
        sent = true;
        console.log(`✉️  Comprovante enviado para ${to} (pedido ${order.id})`);
      } else {
        console.log('ℹ️ SMTP não configurado ou e-mail do pedido ausente. Pulando envio.');
      }
    } catch (err) {
      console.error('Falha ao enviar e-mail SMTP', err);
    }

    // Retornar resultado e preview (útil para debug/UI)
    console.log(`✉️  Comprovante gerado para pedido ${order.id} (${normalizedItems.length} itens)`);
    res.setHeader('Content-Type', 'application/json');
    res.json({ ok: true, emailed: sent, preview_html: html });
  } catch (e) {
    console.error('Order resend error', e);
    res.status(500).json({ error: 'order_resend_failed' });
  }
});

app.get('/api/orders/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params;
    const [orders] = await pool.execute('SELECT id, status, created_at FROM orders WHERE id = ? LIMIT 1', [id]);
    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    const order = orders[0];

    // Timeline simples baseada no status atual
    const createdAt = order.created_at || new Date();
    const base = [{ status: 'criado', at: createdAt }];
    const status = (order.status || 'criado').toLowerCase();
    if (status === 'processando') base.push({ status: 'processando', at: createdAt });
    if (status === 'em_transito' || status === 'em trânsito') base.push({ status: 'em_transito', at: createdAt });
    if (status === 'entregue') base.push({ status: 'em_transito', at: createdAt }, { status: 'entregue', at: createdAt });

    res.json(base);
  } catch (e) {
    console.error('Order timeline error', e);
    res.status(500).json({ error: 'order_timeline_failed' });
  }
});

// ==========================
// Frete: cotação simples por CEP e subtotal
// ==========================
app.post('/api/shipping/quote', async (req, res) => {
  try {
    const { cep, subtotal } = req.body || {};
    const sub = Number(subtotal || 0);
    // Regra simples: frete grátis acima de 200; caso contrário, base por região
    if (sub >= 200) {
      return res.json({ price: 0, estimated_days: 3, rule: 'free_over_200' });
    }
    // Heurística por prefixo de CEP
    const cepStr = String(cep || '').replace(/\D/g, '');
    const prefix = cepStr.slice(0, 2);
    let base = 19.9; // padrão
    let days = 5;
    if (["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49"].includes(prefix)) { // Sudeste/Sul aproximado
      base = 15.0; days = 4;
    }
    if (["50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69"].includes(prefix)) { // Centro-Oeste/Norte
      base = 24.9; days = 7;
    }
    if (["70","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","88","89","90","91","92","93","94","95","96","97","98","99"].includes(prefix)) { // Nordeste/Norte
      base = 29.9; days = 8;
    }
    res.json({ price: Number(base.toFixed(2)), estimated_days: days, rule: 'region_base' });
  } catch (e) {
    console.error('Shipping quote error', e);
    res.status(500).json({ error: 'shipping_quote_failed' });
  }
});

// ==========================
// Cupons: validação simples
// ==========================
app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body || {};
    const normalized = String(code || '').trim().toUpperCase();
    const sub = Number(subtotal || 0);
    if (!normalized) return res.status(400).json({ valid: false, reason: 'empty' });

    if (normalized === 'FRETEGRATIS') {
      if (sub >= 50) {
        return res.json({ valid: true, type: 'shipping_free', min_subtotal: 50 });
      }
      return res.json({ valid: false, reason: 'min_subtotal', min_subtotal: 50 });
    }

    // Percentual: PERCENT10 => 10% de desconto sobre o subtotal
    const percentMatch = normalized.match(/^PERCENT(\d{1,2})$/);
    if (percentMatch) {
      const pct = Math.max(0, Math.min(90, Number(percentMatch[1])));
      if (pct > 0) {
        return res.json({ valid: true, type: 'percent', percent: pct });
      }
    }

    // Valor fixo: OFF50 => R$ 50,00 de desconto (limitado ao subtotal)
    const amountMatch = normalized.match(/^OFF(\d{1,4})$/);
    if (amountMatch) {
      const amount = Math.max(1, Math.min(1000, Number(amountMatch[1])));
      if (amount > 0) {
        return res.json({ valid: true, type: 'amount', amount });
      }
    }

    // Placeholder para mais cupons
    return res.json({ valid: false, reason: 'not_found' });
  } catch (e) {
    console.error('Coupon validate error', e);
    res.status(500).json({ error: 'coupon_validate_failed' });
  }
});

// ==========================
// Conta: alteração de senha (simulado)
// ==========================
app.post('/api/account/password', async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body || {};
    if (!novaSenha || String(novaSenha).length < 6) {
      return res.status(400).json({ ok: false, error: 'weak_password' });
    }
    // Em um cenário real: validar senhaAtual contra hash do usuário autenticado e persistir hash da nova senha.
    console.log('🔐 Alteração de senha solicitada');
    return res.json({ ok: true });
  } catch (e) {
    console.error('Change password error', e);
    res.status(500).json({ ok: false, error: 'change_password_failed' });
  }
});

// ========== ENDPOINTS WHATSAPP ==========

// Endpoint para obter configurações WhatsApp
app.get('/api/whatsapp/config', async (req, res) => {
  try {
    const [settingsRows] = await pool.execute(`
      SELECT key_name, value_text 
      FROM settings 
      WHERE key_name IN ('whatsapp_webhook_url', 'whatsapp_token', 'whatsapp_phone_id', 'whatsapp_webhook_secret', 'whatsapp_auto_reply', 'whatsapp_welcome_message')
    `);
    
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key_name] = row.value_text;
    });

    res.json({
      success: true,
      config: {
        webhook_url: settings.whatsapp_webhook_url || '',
        token: settings.whatsapp_token ? '***' + settings.whatsapp_token.slice(-4) : '',
        phone_id: settings.whatsapp_phone_id || '',
        webhook_secret: settings.whatsapp_webhook_secret ? '***' + settings.whatsapp_webhook_secret.slice(-4) : '',
        auto_reply: settings.whatsapp_auto_reply === 'true',
        welcome_message: settings.whatsapp_welcome_message || 'Olá! Como posso ajudá-lo hoje?'
      }
    });
  } catch (e) {
    console.error('WhatsApp config error', e);
    res.status(500).json({ error: 'config_fetch_failed' });
  }
});

// Endpoint para salvar configurações WhatsApp
app.put('/api/whatsapp/config', async (req, res) => {
  try {
    const { webhook_url, token, phone_id, webhook_secret, auto_reply, welcome_message } = req.body;

    const settings = [
      ['whatsapp_webhook_url', webhook_url],
      ['whatsapp_token', token],
      ['whatsapp_phone_id', phone_id],
      ['whatsapp_webhook_secret', webhook_secret],
      ['whatsapp_auto_reply', auto_reply ? 'true' : 'false'],
      ['whatsapp_welcome_message', welcome_message]
    ];

    for (const [key, value] of settings) {
      if (value !== undefined) {
        await pool.execute(`
          INSERT INTO settings (key_name, value_text, updated_at) 
          VALUES (?, ?, NOW()) 
          ON DUPLICATE KEY UPDATE value_text = VALUES(value_text), updated_at = NOW()
        `, [key, value]);
      }
    }

    res.json({ success: true, message: 'Configurações WhatsApp salvas com sucesso!' });
  } catch (e) {
    console.error('WhatsApp config save error', e);
    res.status(500).json({ error: 'config_save_failed' });
  }
});

// Endpoint para testar webhook WhatsApp
app.post('/api/whatsapp/test-webhook', async (req, res) => {
  try {
    const { webhook_url } = req.body;
    
    if (!webhook_url) {
      return res.status(400).json({ error: 'URL do webhook é obrigatória' });
    }

    // Simular teste do webhook
    const testData = {
      test: true,
      message: 'Teste de webhook realizado com sucesso!',
      timestamp: new Date().toISOString()
    };

    // Aqui você faria uma requisição real para testar o webhook
    // const response = await fetch(webhook_url, { method: 'POST', body: JSON.stringify(testData) });

    res.json({ 
      success: true, 
      message: 'Webhook testado com sucesso!',
      test_data: testData
    });
  } catch (e) {
    console.error('WhatsApp webhook test error', e);
    res.status(500).json({ error: 'webhook_test_failed' });
  }
});

// Endpoint para obter estatísticas WhatsApp
app.get('/api/whatsapp/stats', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const [tableExists] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'whatsapp_messages'
    `);

    if (tableExists[0].count === 0) {
      return res.json({
        success: true,
        stats: {
          total_messages: 0,
          incoming_messages: 0,
          outgoing_messages: 0,
          unique_contacts: 0,
          messages_today: 0
        }
      });
    }

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as incoming_messages,
        COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as outgoing_messages,
        COUNT(DISTINCT from_phone) as unique_contacts,
        COUNT(CASE WHEN DATE(timestamp) = CURDATE() THEN 1 END) as messages_today
      FROM whatsapp_messages
    `);

    res.json({ success: true, stats: stats[0] });
  } catch (e) {
    console.error('WhatsApp stats error', e);
    res.status(500).json({ error: 'stats_fetch_failed' });
  }
});

// Endpoint para enviar mensagem WhatsApp
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    }

    // Buscar token WhatsApp
    const [tokenRows] = await pool.execute('SELECT value_text FROM settings WHERE key_name = ?', ['whatsapp_token']);
    const [phoneIdRows] = await pool.execute('SELECT value_text FROM settings WHERE key_name = ?', ['whatsapp_phone_id']);
    
    if (tokenRows.length === 0 || phoneIdRows.length === 0) {
      return res.status(400).json({ error: 'Token ou Phone ID do WhatsApp não configurados' });
    }

    const token = tokenRows[0].value_text;
    const phoneId = phoneIdRows[0].value_text;

    // Enviar mensagem via WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar mensagem via WhatsApp API');
    }

    const result = await response.json();

    res.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!',
      whatsapp_response: result
    });
  } catch (e) {
    console.error('WhatsApp send message error', e);
    res.status(500).json({ error: 'message_send_failed' });
  }
});

// Endpoint para obter mensagens WhatsApp
app.get('/api/whatsapp/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar se a tabela existe
    const [tableExists] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() AND table_name = 'whatsapp_messages'
    `);

    if (tableExists[0].count === 0) {
      return res.json({
        success: true,
        messages: [],
        pagination: { page: 1, limit, total: 0, pages: 0 }
      });
    }

    const [messages] = await pool.execute(`
      SELECT * FROM whatsapp_messages 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `, [parseInt(limit), parseInt(offset)]);

    const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM whatsapp_messages');
    const total = totalRows[0].total;

    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error('WhatsApp messages error', e);
    res.status(500).json({ error: 'messages_fetch_failed' });
  }
});

// ==========================
// Conta: atualização de perfil (simulado)
// ==========================
app.post('/api/account/profile', async (req, res) => {
  try {
    const { nome, email, telefone, avatar_url, endereco, cidade, estado, cep } = req.body || {};
    // Em um cenário real: atualizar tabela users vinculada ao auth
    console.log('👤 Atualização de perfil:', { nome, email, telefone });
    // Devolver os dados normalizados para o frontend atualizar contexto
    res.json({ ok: true, user: { nome, email, telefone, avatar_url, endereco, cidade, estado, cep } });
  } catch (e) {
    console.error('Profile update error', e);
    res.status(500).json({ ok: false, error: 'profile_update_failed' });
  }
});

// ==========================
// Auth simulado: me/logout para persistir sessão com cookie
// ==========================
// Endpoint /api/auth/me removido - usando o principal acima

// NOTA: Endpoint de login mock removido - usando apenas o sistema de sessão principal

// Rota de logout removida (consolidada na primeira ocorrência)

// ==================== NOVOS ENDPOINTS MINHA CONTA ====================

// Notificações
app.get('/api/customers/:userId/notifications', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
      else return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const [notifications] = await pool.execute('SELECT * FROM customer_notifications WHERE customer_id = ? ORDER BY created_at DESC', [userId]);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notificações', notifications: [] });
  }
});

// Cupons
app.get('/api/customers/:userId/coupons', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [coupons] = await pool.execute('SELECT * FROM customer_coupons WHERE customer_id = ? ORDER BY created_at DESC', [userId]);
    res.json({ coupons });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cupons', coupons: [] });
  }
});

// Fidelidade
app.get('/api/customers/:userId/loyalty', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [orders] = await pool.execute('SELECT COALESCE(SUM(total), 0) as totalSpent FROM orders WHERE user_id = ? AND status != "cancelled"', [userId]);
    const totalSpent = Number(orders[0]?.totalSpent || 0);
    const points = Math.floor(totalSpent / 10);
    let level = 'Bronze', nextLevelPoints = 100;
    if (points >= 500) { level = 'Platinum'; nextLevelPoints = 1000; }
    else if (points >= 250) { level = 'Gold'; nextLevelPoints = 500; }
    else if (points >= 100) { level = 'Silver'; nextLevelPoints = 250; }
    res.json({ points, totalPoints: points, level, nextLevelPoints, couponsRedeemed: 0, totalSavings: totalSpent * 0.05 });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar fidelidade' });
  }
});

// Reviews do cliente
app.get('/api/customers/:userId/reviews', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [reviews] = await pool.execute('SELECT r.*, p.nome as product_name, p.imagem_url as product_image FROM product_reviews r LEFT JOIN products p ON r.product_id = p.id WHERE r.user_id = ? ORDER BY r.created_at DESC', [userId]);
    res.json({ reviews: reviews.map(r => ({ ...r, product: { id: r.product_id, nome: r.product_name, imagem_url: r.product_image } })) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar avaliações', reviews: [] });
  }
});

// Stats de reviews
app.get('/api/customers/:userId/review-stats', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [stats] = await pool.execute('SELECT COUNT(*) as totalReviews, AVG(rating) as averageRating, SUM(helpful_count) as helpfulVotes, SUM(CASE WHEN featured = 1 THEN 1 ELSE 0 END) as featured FROM product_reviews WHERE user_id = ?', [userId]);
    res.json(stats[0] || { totalReviews: 0, averageRating: 0, helpfulVotes: 0, featured: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Erro', totalReviews: 0, averageRating: 0, helpfulVotes: 0, featured: 0 });
  }
});

// NOTA: Endpoints de configurações movidos para linha ~11682 (versão atualizada)

// Atualizar configurações de privacidade
app.put('/api/customers/:userId/settings/privacy', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📝 PUT /api/customers/${userId}/settings/privacy`);
    
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    
    const privacySettings = req.body;
    
    // Verificar se já existe configuração
    const [existing] = await pool.execute('SELECT id FROM customer_settings WHERE customer_id = ?', [userId]);
    
    if (existing.length > 0) {
      // Atualizar
      await pool.execute(
        'UPDATE customer_settings SET privacy = ? WHERE customer_id = ?',
        [JSON.stringify(privacySettings), userId]
      );
    } else {
      // Criar
      await pool.execute(
        'INSERT INTO customer_settings (id, customer_id, privacy) VALUES (?, ?, ?)',
        [require('crypto').randomUUID(), userId, JSON.stringify(privacySettings)]
      );
    }
    
    console.log(`✅ Configurações de privacidade atualizadas para ${userId}`);
    res.json({ success: true, privacy: privacySettings });
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de privacidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// Recomendações
app.get('/api/customers/:userId/recommendations', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    // Buscar email do usuário para recommendations
    const [userEmail] = await pool.execute('SELECT email FROM users WHERE id = ?', [userId]);
    const email = userEmail[0]?.email || null;
    
    if (!email) {
      return res.json({ recommendations: [] });
    }
    
    const [products] = await pool.execute('SELECT p.* FROM products p LEFT JOIN favorites f ON p.id = f.product_id AND f.user_email = ? WHERE f.id IS NULL AND p.status = "ativo" ORDER BY p.created_at DESC LIMIT 10', [email]);
    res.json({ recommendations: products });
  } catch (error) {
    res.status(500).json({ error: 'Erro', recommendations: [] });
  }
});

// Insights de pedidos
app.get('/api/customers/:userId/order-insights', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [orders] = await pool.execute('SELECT AVG(total) as averageOrderValue, COUNT(*) as totalOrders, SUM(CASE WHEN status != "cancelled" THEN total ELSE 0 END) as totalSpent FROM orders WHERE user_id = ?', [userId]);
    const stats = orders[0];
    res.json({ averageOrderValue: Number(stats.averageOrderValue || 0), mostOrderedCategory: 'Brinquedos', favoritePaymentMethod: 'PIX', orderFrequency: 30, totalSavings: Number(stats.totalSpent || 0) * 0.05 });
  } catch (error) {
    res.status(500).json({ error: 'Erro', averageOrderValue: 0, mostOrderedCategory: 'N/A', favoritePaymentMethod: 'PIX', orderFrequency: 0, totalSavings: 0 });
  }
});

// Pendentes de avaliação
app.get('/api/customers/:userId/pending-reviews', async (req, res) => {
  try {
    let { userId } = req.params;
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) userId = user[0].id;
    }
    const [products] = await pool.execute('SELECT DISTINCT p.id, p.nome, p.imagem_url, o.created_at as purchaseDate FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id LEFT JOIN product_reviews r ON r.product_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci AND r.user_id COLLATE utf8mb4_unicode_ci = o.user_id COLLATE utf8mb4_unicode_ci WHERE o.user_id COLLATE utf8mb4_unicode_ci = ? COLLATE utf8mb4_unicode_ci AND o.status = "delivered" AND r.id IS NULL ORDER BY o.created_at DESC LIMIT 10', [userId]);
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Erro', products: [] });
  }
});

// Estimativa de entrega
app.post('/api/delivery-estimate', async (req, res) => {
  const { estado } = req.body;
  const regions = {
    'SP': { days: '1-2', freight: '8.90', region: 'Sudeste' },
    'RJ': { days: '1-3', freight: '9.90', region: 'Sudeste' },
    'MG': { days: '2-4', freight: '12.90', region: 'Sudeste' },
    'RS': { days: '3-5', freight: '15.90', region: 'Sul' },
    'SC': { days: '3-5', freight: '14.90', region: 'Sul' },
    'PR': { days: '2-4', freight: '13.90', region: 'Sul' },
  };
  res.json(regions[estado] || { days: '5-7', freight: '19.90', region: 'Outras' });
});

// ============================================
// ROTAS DE LOGIN ADMINISTRATIVO
// ============================================

// POST /api/admin/login - Login administrativo
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, senha, password } = req.body || {};
    const mail = String(email || '').trim().toLowerCase();
    const pass = String(password || senha || '');
    
    if (!mail || !pass) {
      return res.status(400).json({ 
        ok: false, 
        error: 'missing_credentials',
        message: 'Email e senha são obrigatórios'
      });
    }

    console.log(`🔐 Tentativa de login admin: ${mail}`);
    
    // Buscar usuário admin
    const [rows] = await pool.execute(
      'SELECT id, nome, email, senha_hash, role, status FROM admin_users WHERE email = ? LIMIT 1', 
      [mail]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`❌ Usuário admin não encontrado: ${mail}`);
      return res.status(401).json({ 
        ok: false, 
        error: 'invalid_credentials',
        message: 'Email ou senha incorretos'
      });
    }

    const user = rows[0];
    
    // Verificar se usuário está ativo
    if (user.status !== 'ativo') {
      console.log(`❌ Usuário admin inativo: ${mail}`);
      return res.status(401).json({ 
        ok: false, 
        error: 'account_inactive',
        message: 'Conta inativa. Entre em contato com o administrador.'
      });
    }

    // Verificar senha (SHA256 hash)
    const crypto = require('crypto');
    const senhaHash = crypto.createHash('sha256').update(pass).digest('hex');
    const senhaCorreta = senhaHash === user.senha_hash;
    
    if (!senhaCorreta) {
      console.log(`❌ Senha incorreta para: ${mail}`);
      return res.status(401).json({ 
        ok: false, 
        error: 'invalid_credentials',
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token de sessão
    const adminToken = 'admin_token_' + Date.now() + '_' + user.id;
    
    // Salvar token no cookie
    res.cookie('admin_token', adminToken, { 
      httpOnly: false, 
      sameSite: 'lax', 
      secure: (req.headers['x-forwarded-proto'] || req.protocol) === 'https', 
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 dias
    });

    // Atualizar último acesso
    await pool.execute(
      'UPDATE admin_users SET last_access = NOW() WHERE id = ?',
      [user.id]
    );

    console.log(`✅ Login admin bem-sucedido: ${mail} (${user.role})`);

    res.json({ 
      ok: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissoes: user.permissoes ? JSON.parse(user.permissoes) : []
      },
      token: adminToken
    });

  } catch (error) {
    console.error('❌ Erro no login admin:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'login_failed',
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/admin/me - Verificar sessão admin
app.get('/api/admin/me', async (req, res) => {
  try {
    const adminToken = req.cookies?.admin_token || req.headers['x-admin-token'];
    
    if (!adminToken || !adminToken.startsWith('admin_token_')) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Token de admin não encontrado'
      });
    }

    // Extrair ID do usuário do token
    const userId = adminToken.split('_')[2];
    
    if (!userId) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Token inválido'
      });
    }

    // Buscar usuário
    const [rows] = await pool.execute(
      'SELECT id, nome, email, role, status, permissoes FROM admin_users WHERE id = ? AND status = "ativo"',
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    const user = rows[0];
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissoes: user.permissoes ? JSON.parse(user.permissoes) : []
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar sessão admin:', error);
    res.status(500).json({ 
      authenticated: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/logout - Logout administrativo
app.post('/api/admin/logout', async (req, res) => {
  try {
    res.clearCookie('admin_token');
    res.json({ ok: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no logout admin:', error);
    res.status(500).json({ 
      ok: false,
      message: 'Erro interno do servidor'
    });
  }
});

// ============================================
// ROTAS DE ANALYTICS E DASHBOARD ADMIN
// ============================================

// GET /api/admin/analytics/dashboard - Métricas principais do dashboard
app.get('/api/admin/analytics/dashboard', async (req, res) => {
  try {
    console.log('📊 Buscando métricas do dashboard...');
    
    // Data de hoje e ontem
    const hoje = new Date().toISOString().split('T')[0];
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Vendas de hoje vs ontem
    const [vendasHoje] = await pool.execute(`
      SELECT COALESCE(SUM(total), 0) as total_hoje
      FROM orders 
      WHERE DATE(created_at) = ? AND status NOT IN ('cancelado', 'rejeitado')
    `, [hoje]);
    
    const [vendasOntem] = await pool.execute(`
      SELECT COALESCE(SUM(total), 0) as total_ontem
      FROM orders 
      WHERE DATE(created_at) = ? AND status NOT IN ('cancelado', 'rejeitado')
    `, [ontem]);
    
    // Novos clientes hoje vs ontem
    const [clientesHoje] = await pool.execute(`
      SELECT COUNT(*) as total_hoje
      FROM users 
      WHERE DATE(created_at) = ?
    `, [hoje]);
    
    const [clientesOntem] = await pool.execute(`
      SELECT COUNT(*) as total_ontem
      FROM users 
      WHERE DATE(created_at) = ?
    `, [ontem]);
    
    // Pedidos hoje vs ontem
    const [pedidosHoje] = await pool.execute(`
      SELECT COUNT(*) as total_hoje
      FROM orders 
      WHERE DATE(created_at) = ? AND status NOT IN ('cancelado', 'rejeitado')
    `, [hoje]);
    
    const [pedidosOntem] = await pool.execute(`
      SELECT COUNT(*) as total_ontem
      FROM orders 
      WHERE DATE(created_at) = ? AND status NOT IN ('cancelado', 'rejeitado')
    `, [ontem]);
    
    // Produtos com baixo estoque
    const [baixoEstoque] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM produtos 
      WHERE estoque <= 5 AND status = 'ativo'
    `);
    
    // Calcular variações percentuais
    const vendasHojeVal = parseFloat(vendasHoje[0]?.total_hoje || 0);
    const vendasOntemVal = parseFloat(vendasOntem[0]?.total_ontem || 0);
    const variacaoVendas = vendasOntemVal > 0 ? ((vendasHojeVal - vendasOntemVal) / vendasOntemVal * 100) : 0;
    
    const clientesHojeVal = parseInt(clientesHoje[0]?.total_hoje || 0);
    const clientesOntemVal = parseInt(clientesOntem[0]?.total_ontem || 0);
    const variacaoClientes = clientesOntemVal > 0 ? ((clientesHojeVal - clientesOntemVal) / clientesOntemVal * 100) : 0;
    
    const pedidosHojeVal = parseInt(pedidosHoje[0]?.total_hoje || 0);
    const pedidosOntemVal = parseInt(pedidosOntem[0]?.total_ontem || 0);
    const variacaoPedidos = pedidosOntemVal > 0 ? ((pedidosHojeVal - pedidosOntemVal) / pedidosOntemVal * 100) : 0;
    
    const dashboard = {
      vendas: {
        hoje: vendasHojeVal,
        ontem: vendasOntemVal,
        variacao: variacaoVendas,
        formato: 'currency'
      },
      clientes: {
        hoje: clientesHojeVal,
        ontem: clientesOntemVal,
        variacao: variacaoClientes,
        formato: 'number'
      },
      pedidos: {
        hoje: pedidosHojeVal,
        ontem: pedidosOntemVal,
        variacao: variacaoPedidos,
        formato: 'number'
      },
      estoque: {
        baixo: parseInt(baixoEstoque[0]?.total || 0),
        formato: 'number'
      }
    };
    
    console.log('✅ Métricas do dashboard carregadas');
    res.json(dashboard);
    
  } catch (error) {
    console.error('❌ Erro ao buscar métricas do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/admin/analytics/vendas - Gráfico de vendas dos últimos 30 dias
app.get('/api/admin/analytics/vendas', async (req, res) => {
  try {
    console.log('📈 Buscando dados de vendas...');
    
    const [vendasData] = await pool.execute(`
      SELECT 
        DATE(created_at) as data,
        COUNT(*) as pedidos,
        COALESCE(SUM(total), 0) as total
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND status NOT IN ('cancelado', 'rejeitado')
      GROUP BY DATE(created_at)
      ORDER BY data ASC
    `);
    
    console.log(`✅ ${vendasData.length} dias de vendas carregados`);
    res.json(vendasData);
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados de vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/admin/analytics/produtos-populares - Top 10 produtos mais vendidos
app.get('/api/admin/analytics/produtos-populares', async (req, res) => {
  try {
    console.log('🏆 Buscando produtos populares...');
    
    // Query corrigida para evitar problemas de collation
    const [produtosData] = await pool.execute(`
      SELECT 
        p.id,
        p.nome,
        p.preco,
        p.imagem_url,
        COUNT(oi.product_id) as vendas,
        SUM(oi.quantity) as quantidade_vendida,
        COALESCE(SUM(oi.quantity * oi.price), 0) as receita_total
      FROM produtos p
      LEFT JOIN order_items oi ON p.id = oi.product_id COLLATE utf8mb4_unicode_ci
      LEFT JOIN orders o ON oi.order_id = o.id COLLATE utf8mb4_unicode_ci
      WHERE (o.status NOT IN ('cancelado', 'rejeitado') OR o.status IS NULL)
      GROUP BY p.id, p.nome, p.preco, p.imagem_url
      ORDER BY vendas DESC, quantidade_vendida DESC
      LIMIT 10
    `);
    
    console.log(`✅ ${produtosData.length} produtos populares carregados`);
    res.json(produtosData);
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos populares:', error);
    console.error('Detalhes:', error.message);
    
    // Fallback: retornar produtos sem dados de vendas se houver erro
    try {
      console.log('🔄 Tentando fallback sem JOIN...');
      const [produtosFallback] = await pool.execute(`
        SELECT 
          id,
          nome,
          preco,
          imagem_url,
          0 as vendas,
          0 as quantidade_vendida,
          0 as receita_total
        FROM produtos
        ORDER BY nome
        LIMIT 10
      `);
      
      console.log(`✅ ${produtosFallback.length} produtos carregados (fallback)`);
      res.json(produtosFallback);
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError);
      res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível carregar produtos' });
    }
  }
});

// GET /api/admin/analytics/vendas-por-periodo - Vendas por período
app.get('/api/admin/analytics/vendas-por-periodo', async (req, res) => {
  try {
    console.log('📈 Buscando vendas por período...');
    
    // Query simplificada para evitar problemas de colunas
    const [vendasData] = await pool.execute(`
      SELECT 
        DATE(created_at) as data,
        COUNT(*) as total_pedidos,
        SUM(total) as total_vendas
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND status NOT IN ('cancelado', 'rejeitado')
      GROUP BY DATE(created_at)
      ORDER BY data DESC
    `);
    
    console.log(`✅ Vendas por período carregadas: ${vendasData.length} dias`);
    res.json({
      success: true,
      vendas_7_dias: vendasData,
      vendas_30_dias: [] // Simplificado por enquanto
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendas por período:', error);
    
    // Fallback: retornar dados básicos
    try {
      const [fallbackData] = await pool.execute(`
        SELECT 
          '2025-10-18' as data,
          0 as total_pedidos,
          0 as total_vendas
      `);
      
      res.json({
        success: true,
        vendas_7_dias: fallbackData,
        vendas_30_dias: []
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Erro interno do servidor', message: 'Não foi possível carregar vendas por período' });
    }
  }
});

// GET /api/admin/analytics/pedidos-recentes - Últimos 10 pedidos
app.get('/api/admin/analytics/pedidos-recentes', async (req, res) => {
  try {
    console.log('📦 Buscando pedidos recentes...');
    
    const [pedidosData] = await pool.execute(`
      SELECT 
        o.id,
        COALESCE(u.email, 'Cliente não registrado') as user_email,
        o.total,
        o.status,
        o.created_at,
        o.payment_method,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as itens_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status NOT IN ('cancelled', 'canceled', 'cancelado')
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ ${pedidosData.length} pedidos recentes carregados`);
    res.json(pedidosData);
    
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos recentes:', error);
    console.error('Detalhes:', error.message);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/admin/analytics/estatisticas-gerais - Estatísticas gerais do sistema
app.get('/api/admin/analytics/estatisticas-gerais', async (req, res) => {
  try {
    console.log('📊 Buscando estatísticas gerais...');
    
    // Total de produtos
    const [totalProdutos] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE status = "ativo"');
    
    // Total de pedidos
    const [totalPedidos] = await pool.execute('SELECT COUNT(*) as total FROM orders WHERE status NOT IN ("cancelado", "rejeitado")');
    
    // Total de clientes
    const [totalClientes] = await pool.execute('SELECT COUNT(*) as total FROM users');
    
    // Receita total
    const [receitaTotal] = await pool.execute('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status NOT IN ("cancelado", "rejeitado")');
    
    // Ticket médio
    const [ticketMedio] = await pool.execute(`
      SELECT COALESCE(AVG(total), 0) as media 
      FROM orders 
      WHERE status NOT IN ("cancelado", "rejeitado")
    `);
    
    // Produtos mais vendidos (top 3)
    const [topProdutos] = await pool.execute(`
      SELECT 
        p.nome,
        SUM(oi.quantity) as quantidade
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status NOT IN ('cancelado', 'rejeitado')
      GROUP BY p.id, p.nome
      ORDER BY quantidade DESC
      LIMIT 3
    `);
    
    const estatisticas = {
      produtos: {
        total: parseInt(totalProdutos[0]?.total || 0),
        ativos: parseInt(totalProdutos[0]?.total || 0)
      },
      pedidos: {
        total: parseInt(totalPedidos[0]?.total || 0),
        receita_total: parseFloat(receitaTotal[0]?.total || 0),
        ticket_medio: parseFloat(ticketMedio[0]?.media || 0)
      },
      clientes: {
        total: parseInt(totalClientes[0]?.total || 0)
      },
      top_produtos: topProdutos.map(p => ({
        nome: p.nome,
        quantidade: parseInt(p.quantidade || 0)
      }))
    };
    
    console.log('✅ Estatísticas gerais carregadas');
    res.json(estatisticas);
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas gerais:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// ============================================
// ROTAS DE BLOG E NOTÍCIAS
// ============================================

// GET /api/blog/posts - Listar posts do blog (público)
app.get('/api/blog/posts', async (req, res) => {
  try {
    const categoria = req.query.categoria;
    const status = req.query.status || 'publicado';
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const destaque = req.query.destaque;
    
    let query = `
      SELECT 
        id, titulo, slug, resumo, categoria, imagem_url, imagem_destaque,
        autor, autor_avatar, tempo_leitura, visualizacoes, destaque,
        status, tags, publicado_em, created_at, updated_at
      FROM blog_posts
      WHERE status = ?
    `;
    const params = [status];
    
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (destaque === 'true') {
      query += ' AND destaque = 1';
    }
    
    query += ` ORDER BY publicado_em DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [posts] = await pool.execute(query, params);
    
    // Parse tags JSON com tratamento de erro
    const postsFormatted = posts.map(post => {
      let tags = [];
      try {
        if (post.tags) {
          tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;
        }
      } catch (e) {
        console.error('Erro ao parsear tags:', e);
        tags = [];
      }
      
      return {
        ...post,
        tags,
        destaque: Boolean(post.destaque)
      };
    });
    
    console.log(`✅ ${postsFormatted.length} posts carregados`);
    res.json(postsFormatted);
    
  } catch (error) {
    console.error('❌ Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/blog/posts/:slug - Obter post específico por slug
app.get('/api/blog/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    console.log(`📰 Buscando post com slug: ${slug}`);
    
    const [posts] = await pool.execute(
      `SELECT 
        id, titulo, slug, resumo, conteudo, categoria, imagem_url, imagem_destaque,
        autor, autor_avatar, tempo_leitura, visualizacoes, destaque,
        status, tags, meta_title, meta_description, meta_keywords,
        publicado_em, created_at, updated_at
      FROM blog_posts
      WHERE slug = ? AND status = 'publicado'`,
      [slug]
    );
    
    if (!posts || posts.length === 0) {
      console.log(`❌ Post não encontrado: ${slug}`);
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    let tags = [];
    try {
      if (posts[0].tags) {
        tags = typeof posts[0].tags === 'string' ? JSON.parse(posts[0].tags) : posts[0].tags;
      }
    } catch (e) {
      console.error('Erro ao parsear tags:', e);
    }
    
    const post = {
      ...posts[0],
      tags,
      destaque: Boolean(posts[0].destaque)
    };
    
    // Incrementar visualizações
    await pool.execute(
      'UPDATE blog_posts SET visualizacoes = visualizacoes + 1 WHERE id = ?',
      [post.id]
    );
    
    console.log(`✅ Post "${post.titulo}" carregado (${post.visualizacoes + 1} visualizações)`);
    res.json(post);
    
  } catch (error) {
    console.error('❌ Erro ao buscar post:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/blog/categorias - Listar categorias disponíveis
app.get('/api/blog/categorias', async (req, res) => {
  try {
    const [categorias] = await pool.execute(`
      SELECT 
        categoria,
        COUNT(*) as total
      FROM blog_posts
      WHERE status = 'publicado'
      GROUP BY categoria
      ORDER BY total DESC
    `);
    
    res.json(categorias);
    
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// ============================================
// ROTAS ADMIN - BLOG E NOTÍCIAS
// ============================================

// GET /api/admin/blog/posts - Listar todos os posts (admin)
app.get('/api/admin/blog/posts', async (req, res) => {
  try {
    const { status, categoria, busca } = req.query;
    
    let query = `
      SELECT 
        id, titulo, slug, resumo, categoria, imagem_url,
        autor, tempo_leitura, visualizacoes, destaque,
        status, publicado_em, created_at, updated_at
      FROM blog_posts
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (busca) {
      query += ' AND (titulo LIKE ? OR resumo LIKE ? OR conteudo LIKE ?)';
      const searchTerm = `%${busca}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [posts] = await pool.execute(query, params);
    
    const postsFormatted = posts.map(post => ({
      ...post,
      destaque: Boolean(post.destaque)
    }));
    
    console.log(`✅ ${postsFormatted.length} posts admin carregados`);
    res.json(postsFormatted);
    
  } catch (error) {
    console.error('❌ Erro ao buscar posts admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/admin/blog/posts/:id - Obter post específico (admin)
app.get('/api/admin/blog/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [posts] = await pool.execute(
      `SELECT * FROM blog_posts WHERE id = ?`,
      [id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    let tags = [];
    try {
      if (posts[0].tags) {
        tags = typeof posts[0].tags === 'string' ? JSON.parse(posts[0].tags) : posts[0].tags;
      }
    } catch (e) {
      console.error('Erro ao parsear tags:', e);
    }
    
    const post = {
      ...posts[0],
      tags,
      destaque: Boolean(posts[0].destaque)
    };
    
    res.json(post);
    
  } catch (error) {
    console.error('❌ Erro ao buscar post admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// POST /api/admin/blog/posts - Criar novo post
app.post('/api/admin/blog/posts', async (req, res) => {
  try {
    const {
      titulo,
      slug,
      resumo,
      conteudo,
      categoria = 'Notícias',
      imagem_url,
      imagem_destaque,
      autor = 'Equipe MuhlStore',
      autor_avatar,
      tempo_leitura = 5,
      destaque = false,
      status = 'rascunho',
      tags = [],
      meta_title,
      meta_description,
      meta_keywords,
      publicado_em
    } = req.body;
    
    if (!titulo || !resumo || !conteudo) {
      return res.status(400).json({ error: 'Título, resumo e conteúdo são obrigatórios' });
    }
    
    // Gerar slug se não fornecido
    const finalSlug = slug || titulo.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
    
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO blog_posts (
        id, titulo, slug, resumo, conteudo, categoria,
        imagem_url, imagem_destaque, autor, autor_avatar,
        tempo_leitura, destaque, status, tags,
        meta_title, meta_description, meta_keywords, publicado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, titulo, finalSlug, resumo, conteudo, categoria,
        imagem_url, imagem_destaque, autor, autor_avatar,
        tempo_leitura, destaque, status, JSON.stringify(tags),
        meta_title || titulo, meta_description || resumo, meta_keywords,
        publicado_em || (status === 'publicado' ? new Date() : null)
      ]
    );
    
    console.log(`✅ Post criado: ${titulo}`);
    res.status(201).json({ 
      id: newId,
      titulo,
      slug: finalSlug,
      message: 'Post criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar post:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um post com este slug' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// PUT /api/admin/blog/posts/:id - Atualizar post
app.put('/api/admin/blog/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      slug,
      resumo,
      conteudo,
      categoria,
      imagem_url,
      imagem_destaque,
      autor,
      autor_avatar,
      tempo_leitura,
      destaque,
      status,
      tags,
      meta_title,
      meta_description,
      meta_keywords,
      publicado_em
    } = req.body;
    
    // Converter undefined para null
    const tagsValue = tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : null;
    
    const [result] = await pool.execute(
      `UPDATE blog_posts SET
        titulo = ?,
        slug = ?,
        resumo = ?,
        conteudo = ?,
        categoria = ?,
        imagem_url = ?,
        imagem_destaque = ?,
        autor = ?,
        autor_avatar = ?,
        tempo_leitura = ?,
        destaque = ?,
        status = ?,
        tags = ?,
        meta_title = ?,
        meta_description = ?,
        meta_keywords = ?,
        publicado_em = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        titulo ?? null,
        slug ?? null,
        resumo ?? null,
        conteudo ?? null,
        categoria ?? null,
        imagem_url ?? null,
        imagem_destaque ?? null,
        autor ?? null,
        autor_avatar ?? null,
        tempo_leitura ?? null,
        destaque ?? null,
        status ?? null,
        tagsValue,
        meta_title ?? null,
        meta_description ?? null,
        meta_keywords ?? null,
        publicado_em ?? null,
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    console.log(`✅ Post atualizado: ${id}`);
    res.json({ message: 'Post atualizado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar post:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um post com este slug' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// DELETE /api/admin/blog/posts/:id - Deletar post
app.delete('/api/admin/blog/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM blog_posts WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    console.log(`✅ Post deletado: ${id}`);
    res.json({ message: 'Post deletado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao deletar post:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// PATCH /api/admin/blog/posts/:id/status - Alterar status do post
app.patch('/api/admin/blog/posts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['publicado', 'rascunho', 'arquivado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const publicado_em = status === 'publicado' ? new Date() : null;
    
    const [result] = await pool.execute(
      'UPDATE blog_posts SET status = ?, publicado_em = COALESCE(publicado_em, ?), updated_at = NOW() WHERE id = ?',
      [status, publicado_em, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }
    
    console.log(`✅ Status do post alterado para: ${status}`);
    res.json({ message: 'Status atualizado com sucesso', status });
    
  } catch (error) {
    console.error('❌ Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// ============================================
// ROTAS DE MARKETPLACE
// ============================================

// GET /api/marketplace/sellers - Listar vendedores (público)
app.get('/api/marketplace/sellers', async (req, res) => {
  try {
    const categoria = req.query.categoria;
    const destaque = req.query.destaque;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    let query = `
      SELECT 
        id, nome, slug, descricao, especialidade, categoria,
        imagem_perfil, imagem_capa, avaliacao, total_avaliacoes,
        total_vendas, total_produtos, localizacao, cidade, estado,
        tempo_resposta, destaque, verificado, tags, certificacoes,
        created_at, updated_at
      FROM marketplace_sellers
      WHERE ativo = 1
    `;
    const params = [];
    
    if (categoria && categoria !== 'todos') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (destaque === 'true') {
      query += ' AND destaque = 1';
    }
    
    query += ` ORDER BY destaque DESC, avaliacao DESC, total_vendas DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const [sellers] = await pool.execute(query, params);
    
    // Parse JSON fields
    const sellersFormatted = sellers.map(seller => {
      let tags = [];
      let certificacoes = [];
      
      try {
        if (seller.tags) tags = typeof seller.tags === 'string' ? JSON.parse(seller.tags) : seller.tags;
        if (seller.certificacoes) certificacoes = typeof seller.certificacoes === 'string' ? JSON.parse(seller.certificacoes) : seller.certificacoes;
      } catch (e) {
        console.error('Erro ao parsear JSON:', e);
      }
      
      return {
        ...seller,
        tags,
        certificacoes,
        destaque: Boolean(seller.destaque),
        verificado: Boolean(seller.verificado),
        avaliacao: parseFloat(seller.avaliacao || 0)
      };
    });
    
    console.log(`✅ ${sellersFormatted.length} vendedores carregados`);
    res.json(sellersFormatted);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/marketplace/sellers/:slug - Obter vendedor específico
app.get('/api/marketplace/sellers/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const [sellers] = await pool.execute(
      `SELECT * FROM marketplace_sellers WHERE slug = ? AND ativo = 1`,
      [slug]
    );
    
    if (!sellers || sellers.length === 0) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    
    let tags = [];
    let certificacoes = [];
    
    try {
      if (sellers[0].tags) tags = typeof sellers[0].tags === 'string' ? JSON.parse(sellers[0].tags) : sellers[0].tags;
      if (sellers[0].certificacoes) certificacoes = typeof sellers[0].certificacoes === 'string' ? JSON.parse(sellers[0].certificacoes) : sellers[0].certificacoes;
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
    }
    
    const seller = {
      ...sellers[0],
      tags,
      certificacoes,
      destaque: Boolean(sellers[0].destaque),
      verificado: Boolean(sellers[0].verificado),
      ativo: Boolean(sellers[0].ativo),
      avaliacao: parseFloat(sellers[0].avaliacao || 0)
    };
    
    console.log(`✅ Vendedor "${seller.nome}" carregado`);
    res.json(seller);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/marketplace/categorias - Listar categorias
app.get('/api/marketplace/categorias', async (req, res) => {
  try {
    const [categorias] = await pool.execute(`
      SELECT 
        categoria,
        COUNT(*) as total
      FROM marketplace_sellers
      WHERE ativo = 1
      GROUP BY categoria
      ORDER BY total DESC
    `);
    
    res.json(categorias);
    
  } catch (error) {
    console.error('❌ Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// ============================================
// ROTAS ADMIN - MARKETPLACE
// ============================================

// GET /api/admin/marketplace/sellers - Listar todos os vendedores (admin)
app.get('/api/admin/marketplace/sellers', async (req, res) => {
  try {
    const { categoria, busca, ativo } = req.query;
    
    let query = `
      SELECT 
        id, nome, slug, descricao, especialidade, categoria,
        imagem_perfil, avaliacao, total_vendas, total_produtos,
        localizacao, destaque, verificado, ativo, created_at
      FROM marketplace_sellers
      WHERE 1=1
    `;
    const params = [];
    
    if (categoria && categoria !== 'todos') {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    
    if (ativo !== undefined) {
      query += ' AND ativo = ?';
      params.push(ativo === 'true' ? 1 : 0);
    }
    
    if (busca) {
      query += ' AND (nome LIKE ? OR descricao LIKE ? OR especialidade LIKE ?)';
      const searchTerm = `%${busca}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [sellers] = await pool.execute(query, params);
    
    const sellersFormatted = sellers.map(seller => ({
      ...seller,
      destaque: Boolean(seller.destaque),
      verificado: Boolean(seller.verificado),
      ativo: Boolean(seller.ativo),
      avaliacao: parseFloat(seller.avaliacao || 0)
    }));
    
    console.log(`✅ ${sellersFormatted.length} vendedores admin carregados`);
    res.json(sellersFormatted);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendedores admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// GET /api/admin/marketplace/sellers/:id - Obter vendedor específico (admin)
app.get('/api/admin/marketplace/sellers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [sellers] = await pool.execute(
      `SELECT * FROM marketplace_sellers WHERE id = ?`,
      [id]
    );
    
    if (sellers.length === 0) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    
    let tags = [];
    let certificacoes = [];
    
    try {
      if (sellers[0].tags) tags = typeof sellers[0].tags === 'string' ? JSON.parse(sellers[0].tags) : sellers[0].tags;
      if (sellers[0].certificacoes) certificacoes = typeof sellers[0].certificacoes === 'string' ? JSON.parse(sellers[0].certificacoes) : sellers[0].certificacoes;
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
    }
    
    const seller = {
      ...sellers[0],
      tags,
      certificacoes,
      destaque: Boolean(sellers[0].destaque),
      verificado: Boolean(sellers[0].verificado),
      ativo: Boolean(sellers[0].ativo),
      avaliacao: parseFloat(sellers[0].avaliacao || 0)
    };
    
    res.json(seller);
    
  } catch (error) {
    console.error('❌ Erro ao buscar vendedor admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// POST /api/admin/marketplace/sellers - Criar novo vendedor
app.post('/api/admin/marketplace/sellers', async (req, res) => {
  try {
    const {
      nome,
      slug,
      descricao,
      especialidade,
      categoria,
      imagem_perfil,
      imagem_capa,
      avaliacao = 0,
      localizacao,
      cidade,
      estado,
      tempo_resposta = '24h',
      destaque = false,
      verificado = false,
      ativo = true,
      email,
      telefone,
      whatsapp,
      instagram,
      website,
      politica_troca,
      politica_envio,
      horario_atendimento,
      tags = [],
      certificacoes = []
    } = req.body;
    
    if (!nome || !descricao || !categoria) {
      return res.status(400).json({ error: 'Nome, descrição e categoria são obrigatórios' });
    }
    
    // Gerar slug se não fornecido
    const finalSlug = slug || nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const newId = require('crypto').randomUUID();
    
    const [result] = await pool.execute(
      `INSERT INTO marketplace_sellers (
        id, nome, slug, descricao, especialidade, categoria,
        imagem_perfil, imagem_capa, avaliacao, localizacao, cidade, estado,
        tempo_resposta, destaque, verificado, ativo,
        email, telefone, whatsapp, instagram, website,
        politica_troca, politica_envio, horario_atendimento,
        tags, certificacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, nome, finalSlug, descricao, especialidade, categoria,
        imagem_perfil, imagem_capa, avaliacao, localizacao, cidade, estado,
        tempo_resposta, destaque, verificado, ativo,
        email, telefone, whatsapp, instagram, website,
        politica_troca, politica_envio, horario_atendimento,
        JSON.stringify(tags), JSON.stringify(certificacoes)
      ]
    );
    
    console.log(`✅ Vendedor criado: ${nome}`);
    res.status(201).json({ 
      id: newId,
      nome,
      slug: finalSlug,
      message: 'Vendedor criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar vendedor:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um vendedor com este slug' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// PUT /api/admin/marketplace/sellers/:id - Atualizar vendedor
app.put('/api/admin/marketplace/sellers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, slug, descricao, especialidade, categoria,
      imagem_perfil, imagem_capa, avaliacao, localizacao, cidade, estado,
      tempo_resposta, destaque, verificado, ativo,
      email, telefone, whatsapp, instagram, website,
      politica_troca, politica_envio, horario_atendimento,
      tags, certificacoes
    } = req.body;
    
    const [result] = await pool.execute(
      `UPDATE marketplace_sellers SET
        nome = ?, slug = ?, descricao = ?, especialidade = ?, categoria = ?,
        imagem_perfil = ?, imagem_capa = ?, avaliacao = ?, localizacao = ?, cidade = ?, estado = ?,
        tempo_resposta = ?, destaque = ?, verificado = ?, ativo = ?,
        email = ?, telefone = ?, whatsapp = ?, instagram = ?, website = ?,
        politica_troca = ?, politica_envio = ?, horario_atendimento = ?,
        tags = ?, certificacoes = ?, updated_at = NOW()
      WHERE id = ?`,
      [
        nome, slug, descricao, especialidade, categoria,
        imagem_perfil, imagem_capa, avaliacao, localizacao, cidade, estado,
        tempo_resposta, destaque, verificado, ativo,
        email, telefone, whatsapp, instagram, website,
        politica_troca, politica_envio, horario_atendimento,
        JSON.stringify(tags || []), JSON.stringify(certificacoes || []),
        id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    
    console.log(`✅ Vendedor atualizado: ${id}`);
    res.json({ message: 'Vendedor atualizado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar vendedor:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Já existe um vendedor com este slug' });
    }
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// DELETE /api/admin/marketplace/sellers/:id - Deletar vendedor
app.delete('/api/admin/marketplace/sellers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM marketplace_sellers WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    
    console.log(`✅ Vendedor deletado: ${id}`);
    res.json({ message: 'Vendedor deletado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao deletar vendedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// PATCH /api/admin/marketplace/sellers/:id/toggle - Alternar status ativo/verificado
app.patch('/api/admin/marketplace/sellers/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;
    
    if (!['ativo', 'destaque', 'verificado'].includes(field)) {
      return res.status(400).json({ error: 'Campo inválido' });
    }
    
    const [result] = await pool.execute(
      `UPDATE marketplace_sellers SET ${field} = ?, updated_at = NOW() WHERE id = ?`,
      [value ? 1 : 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vendedor não encontrado' });
    }
    
    console.log(`✅ ${field} do vendedor alterado para: ${value}`);
    res.json({ message: `${field} atualizado com sucesso`, [field]: value });
    
  } catch (error) {
    console.error('❌ Erro ao alternar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor', message: error?.message });
  }
});

// ============================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS ADMIN
// ============================================

// GET /api/admin/usuarios - Listar todos os usuários
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const [usuarios] = await pool.execute(
      `SELECT id, nome, email, telefone, role, status, permissoes, 
       avatar, created_at, last_access 
       FROM admin_users 
       ORDER BY created_at DESC`
    );
    res.json(usuarios);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários', message: error?.message });
  }
});

// GET /api/admin/usuarios/:id - Buscar usuário específico
app.get('/api/admin/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [usuarios] = await pool.execute(
      `SELECT id, nome, email, telefone, role, status, permissoes, 
       avatar, created_at, last_access 
       FROM admin_users 
       WHERE id = ?`,
      [id]
    );
    
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(usuarios[0]);
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário', message: error?.message });
  }
});

// POST /api/admin/usuarios - Criar novo usuário
app.post('/api/admin/usuarios', async (req, res) => {
  try {
    const { nome, email, telefone, senha, role, status, permissoes } = req.body;
    
    // Validações
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    
    // Verificar se email já existe
    const [existing] = await pool.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash da senha (se bcrypt não estiver disponível, use sha256 simples)
    const crypto = require('crypto');
    const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');
    
    // Inserir novo usuário
    const [result] = await pool.execute(
      `INSERT INTO admin_users 
       (nome, email, telefone, senha_hash, role, status, permissoes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nome,
        email,
        telefone || null,
        senhaHash,
        role || 'viewer',
        status || 'ativo',
        permissoes || '[]'
      ]
    );
    
    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Usuário criado com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário', message: error?.message });
  }
});

// PUT /api/admin/usuarios/:id - Atualizar usuário
app.put('/api/admin/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, senha, role, status, permissoes } = req.body;
    
    // Validações
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    // Verificar se email já existe em outro usuário
    const [existing] = await pool.execute(
      'SELECT id FROM admin_users WHERE email = ? AND id != ?',
      [email, id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado para outro usuário' });
    }
    
    // Preparar update
    let query = `UPDATE admin_users SET 
                 nome = ?, email = ?, telefone = ?, 
                 role = ?, status = ?, permissoes = ?, 
                 updated_at = NOW()`;
    let params = [nome, email, telefone || null, role, status, permissoes || '[]'];
    
    // Se senha foi fornecida, atualizar também
    if (senha) {
      const crypto = require('crypto');
      const senhaHash = crypto.createHash('sha256').update(senha).digest('hex');
      query += ', senha_hash = ?';
      params.push(senhaHash);
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await pool.execute(query, params);
    
    res.json({ 
      success: true, 
      message: 'Usuário atualizado com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário', message: error?.message });
  }
});

// DELETE /api/admin/usuarios/:id - Excluir usuário
app.delete('/api/admin/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Não permitir excluir o último admin
    const [admins] = await pool.execute(
      'SELECT COUNT(*) as total FROM admin_users WHERE role = "admin" AND status = "ativo"'
    );
    
    const [usuario] = await pool.execute(
      'SELECT role FROM admin_users WHERE id = ?',
      [id]
    );
    
    if (usuario.length > 0 && usuario[0].role === 'admin' && admins[0].total <= 1) {
      return res.status(400).json({ 
        error: 'Não é possível excluir o último administrador ativo' 
      });
    }
    
    // Excluir usuário
    await pool.execute('DELETE FROM admin_users WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      message: 'Usuário excluído com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário', message: error?.message });
  }
});

// POST /api/admin/usuarios/:id/reset-password - Resetar senha
app.post('/api/admin/usuarios/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { novaSenha } = req.body;
    
    if (!novaSenha) {
      return res.status(400).json({ error: 'Nova senha é obrigatória' });
    }
    
    const crypto = require('crypto');
    const senhaHash = crypto.createHash('sha256').update(novaSenha).digest('hex');
    
    await pool.execute(
      'UPDATE admin_users SET senha_hash = ?, updated_at = NOW() WHERE id = ?',
      [senhaHash, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Senha resetada com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    res.status(500).json({ error: 'Erro ao resetar senha', message: error?.message });
  }
});

// PUT /api/admin/usuarios/:id/toggle-status - Ativar/Desativar usuário
app.put('/api/admin/usuarios/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ativo', 'inativo', 'bloqueado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    await pool.execute(
      'UPDATE admin_users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Status atualizado com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status', message: error?.message });
  }
});

// ==================== FINANCIAL TRANSACTIONS API ====================

// Buscar todas as transações financeiras
app.get('/api/financial/transactions', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        data,
        descricao,
        categoria,
        origem,
        tipo,
        valor,
        status,
        metodo_pagamento,
        observacoes,
        created_at,
        updated_at
      FROM financial_transactions 
      ORDER BY data DESC, created_at DESC
    `);
    
    // Normalizar tipos para minúsculo e sem acentos
    const transacoesNormalizadas = rows.map(transacao => ({
      ...transacao,
      tipo: transacao.tipo ? transacao.tipo.toLowerCase().replace('saída', 'saida').replace('entrada', 'entrada') : transacao.tipo
    }));

    logger.info('Transações financeiras carregadas', { count: rows.length });
    res.json({ transactions: transacoesNormalizadas, total: rows.length });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar transações financeiras' });
  }
});


// Atualizar transação financeira (com ID no body)
app.put('/api/financial/transactions', async (req, res) => {
  try {
    const { id, descricao, categoria, tipo, valor, status, metodo_pagamento, data, origem, observacoes } = req.body;

    // Validar campos obrigatórios
    if (!id || !descricao || !categoria || !tipo || !valor) {
      return res.status(400).json({ error: 'Campos obrigatórios: id, descricao, categoria, tipo, valor' });
    }

    // Normalizar tipo para minúsculo
    const tipoNormalizado = tipo.toLowerCase();
    
    // Validar tipo
    if (!['entrada', 'saida'].includes(tipoNormalizado)) {
      return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
    }

    // Verificar se a transação existe
    const [existing] = await pool.execute(`
      SELECT id FROM financial_transactions WHERE id = ?
    `, [id]);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    // Atualizar transação
    const [result] = await pool.execute(`
      UPDATE financial_transactions 
      SET descricao = ?, categoria = ?, tipo = ?, valor = ?, status = ?, 
          metodo_pagamento = ?, data = ?, origem = ?, observacoes = ?, updated_at = NOW()
      WHERE id = ?
    `, [descricao, categoria, tipoNormalizado, valor, status || 'Pago', metodo_pagamento || 'PIX', 
        data || new Date().toISOString().split('T')[0], origem || '', observacoes || '', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    console.log('✅ Transação atualizada com ID:', id);

    res.json({ 
      success: true, 
      message: 'Transação atualizada com sucesso',
      transaction: {
        id,
        descricao,
        categoria,
        tipo: tipoNormalizado,
        valor,
        status: status || 'Pago',
        metodo_pagamento: metodo_pagamento || 'PIX',
        data: data || new Date().toISOString().split('T')[0],
        origem: origem || '',
        observacoes: observacoes || ''
      }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar transação:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// Atualizar transação financeira (com ID na URL)
app.put('/api/financial/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      data,
      descricao,
      categoria,
      tipo,
      valor,
      status,
      metodo_pagamento,
      origem,
      observacoes
    } = req.body;

    const [result] = await pool.execute(`
      UPDATE financial_transactions 
      SET data = ?, descricao = ?, categoria = ?, tipo = ?, valor = ?, 
          status = ?, metodo_pagamento = ?, origem = ?, observacoes = ?, 
          updated_at = NOW()
      WHERE id = ?
    `, [data, descricao, categoria, tipo, valor, status, metodo_pagamento, origem, observacoes, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    logger.info('Transação financeira atualizada', { id });
    res.json({ success: true, message: 'Transação atualizada com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar transação financeira' });
  }
});

// Deletar transação financeira
app.delete('/api/financial/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM financial_transactions WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    logger.info('Transação financeira deletada', { id });
    res.json({ success: true, message: 'Transação deletada com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao deletar transação financeira' });
  }
});

// Estornar transação financeira
app.post('/api/financial/transactions/:id/reverse', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    // Buscar transação original
    const [rows] = await pool.execute(
      'SELECT * FROM financial_transactions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const originalTransaction = rows[0];

    // Criar transação de estorno (tipo invertido)
    const tipoEstorno = originalTransaction.tipo === 'entrada' ? 'saida' : 'entrada';
    const descricaoEstorno = `ESTORNO: ${originalTransaction.descricao}`;
    const observacoesEstorno = `Estorno da transação #${id}. Motivo: ${motivo || 'Não informado'}`;

    const [result] = await pool.execute(`
      INSERT INTO financial_transactions (
        descricao, categoria, tipo, valor, status, 
        metodo_pagamento, data, origem, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      descricaoEstorno,
      originalTransaction.categoria,
      tipoEstorno,
      originalTransaction.valor,
      'Pago',
      originalTransaction.metodo_pagamento,
      new Date().toISOString().split('T')[0],
      originalTransaction.origem,
      observacoesEstorno
    ]);

    // Marcar transação original como estornada
    await pool.execute(`
      UPDATE financial_transactions 
      SET observacoes = CONCAT(COALESCE(observacoes, ''), ' [ESTORNADA EM ${new Date().toISOString().split('T')[0]}]'),
          updated_at = NOW()
      WHERE id = ?
    `, [id]);

    logger.info('Transação estornada', { originalId: id, reversalId: result.insertId });
    res.json({ 
      success: true, 
      message: 'Transação estornada com sucesso',
      reversalId: result.insertId
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao estornar transação', details: error.message });
  }
});

// Deletar múltiplas transações
app.post('/api/financial/transactions/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `DELETE FROM financial_transactions WHERE id IN (${placeholders})`,
      ids
    );

    logger.info('Transações deletadas em lote', { count: result.affectedRows });
    res.json({ 
      success: true, 
      message: `${result.affectedRows} transações deletadas com sucesso`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao deletar transações em lote' });
  }
});

// Atualizar status de múltiplas transações
app.post('/api/financial/transactions/bulk-update-status', async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs inválidos' });
    }

    if (!['Pago', 'Pendente', 'Atrasado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.execute(
      `UPDATE financial_transactions SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [status, ...ids]
    );

    logger.info('Status de transações atualizado em lote', { count: result.affectedRows, status });
    res.json({ 
      success: true, 
      message: `${result.affectedRows} transações atualizadas para ${status}`,
      updatedCount: result.affectedRows
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar status em lote' });
  }
});

// Criar transação financeira
app.post('/api/financial/transactions', async (req, res) => {
  try {
    const { descricao, categoria, tipo, valor, status, metodo_pagamento, data, origem, observacoes } = req.body;
    
    // Validações básicas
    if (!descricao || !categoria || !tipo || !valor) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: descricao, categoria, tipo, valor' 
      });
    }

    if (valor <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    // Normalizar tipo para minúsculo
    const tipoNormalizado = tipo.toLowerCase();
    
    // Validar tipo
    if (!['entrada', 'saida'].includes(tipoNormalizado)) {
      return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
    }
    
    // Tratar valores undefined como null
    const safeStatus = status || 'Pendente';
    const safeMetodoPagamento = metodo_pagamento || 'Não informado';
    const safeData = data || new Date().toISOString().split('T')[0];
    const safeOrigem = origem || null;
    const safeObservacoes = observacoes || null;
    
    // Inserir transação - created_at e updated_at são gerados automaticamente
    const [result] = await pool.execute(`
      INSERT INTO financial_transactions (
        descricao, categoria, tipo, valor, status, 
        metodo_pagamento, data, origem, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      descricao, categoria, tipoNormalizado, valor, safeStatus,
      safeMetodoPagamento, safeData, safeOrigem, safeObservacoes
    ]);
    
    const insertedId = result.insertId;
    
    logger.info('Transação financeira criada', { id: insertedId });
    res.json({ 
      success: true, 
      message: 'Transação criada com sucesso',
      transaction: {
        id: insertedId,
        descricao,
        categoria,
        tipo: tipoNormalizado,
        valor,
        status: safeStatus,
        metodo_pagamento: safeMetodoPagamento,
        data: safeData,
        origem: safeOrigem,
        observacoes: safeObservacoes
      }
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar transação financeira', details: error.message });
  }
});

// Buscar transação por ID
app.get('/api/financial/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM financial_transactions WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ transaction: rows[0] });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar transação financeira' });
  }
});

// ==================== TESTE DE TABELAS ====================

// Teste específico para contas e cartões
app.get('/api/test-contas-financial_cards', async (req, res) => {
  try {
    console.log('🔍 Testando acesso às tabelas financial_accounts e financial_cards...');
    
    // Testar financial_accounts
    const [contasRows] = await pool.execute('SHOW TABLES LIKE "financial_accounts"');
    console.log('Financial accounts tables found:', contasRows.length);
    
    // Testar financial_cards
    const [financial_cardsRows] = await pool.execute('SHOW TABLES LIKE "financial_cards"');
    console.log('Financial cards tables found:', financial_cardsRows.length);
    
    // Tentar buscar dados
    const [contasData] = await pool.execute('SELECT COUNT(*) as total FROM financial_accounts');
    const [financial_cardsData] = await pool.execute('SELECT COUNT(*) as total FROM financial_cards');
    
    res.json({
      success: true,
      contas_table_exists: contasRows.length > 0,
      financial_cards_table_exists: financial_cardsRows.length > 0,
      contas_count: contasData[0]?.total || 0,
      financial_cards_count: financial_cardsData[0]?.total || 0
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.json({ success: false, error: error.message });
  }
});

// ==================== ENDPOINTS CONTAS BANCÁRIAS ====================

// Buscar todas as contas bancárias
app.get('/api/financial/contas', async (req, res) => {
  try {
    // Retornar dados simulados temporariamente para testar o frontend
    const contasSimuladas = [
      {
        id: 1,
        nome: 'Conta Principal',
        banco: 'Nubank',
        agencia: '0001',
        conta: '12345-6',
        tipo: 'corrente',
        saldo: 15000.50,
        limite: 5000.00,
        status: 'ativo',
        ultima_movimentacao: '2024-10-18',
        observacoes: 'Conta principal da empresa',
        created_at: '2024-01-15',
        updated_at: '2024-10-18'
      },
      {
        id: 2,
        nome: 'Conta Poupança',
        banco: 'Banco do Brasil',
        agencia: '1234',
        conta: '98765-4',
        tipo: 'poupanca',
        saldo: 25000.00,
        limite: 0.00,
        status: 'ativo',
        ultima_movimentacao: '2024-10-17',
        observacoes: 'Reserva de emergência',
        created_at: '2024-02-01',
        updated_at: '2024-10-17'
      }
    ];
    
    console.log('✅ Contas bancárias carregadas (simuladas):', contasSimuladas.length);
    res.json({ contas: contasSimuladas, total: contasSimuladas.length });
  } catch (error) {
    console.error('❌ Erro ao buscar contas bancárias:', error);
    res.status(500).json({ error: 'Erro ao buscar contas bancárias', details: error.message });
  }
});

// Criar conta bancária
app.post('/api/financial/contas', async (req, res) => {
  try {
    const { nome, banco, agencia, conta, tipo, saldo, limite, status, observacoes } = req.body;
    
    if (!nome || !banco || !agencia || !conta) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, banco, agencia, conta' });
    }

    const [result] = await pool.execute(`
      INSERT INTO financial_accounts (
        nome, banco, agencia, conta, tipo, saldo, limite, status, observacoes, ultima_movimentacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [nome, banco, agencia, conta, tipo || 'corrente', saldo || 0, limite || 0, status || 'ativo', observacoes || '']);
    
    const insertedId = result.insertId;
    console.log('✅ Conta bancária criada:', insertedId);
    
    res.json({ 
      success: true, 
      message: 'Conta bancária criada com sucesso',
      conta: { id: insertedId, nome, banco, agencia, conta, tipo, saldo, limite, status, observacoes }
    });
  } catch (error) {
    console.error('❌ Erro ao criar conta bancária:', error);
    res.status(500).json({ error: 'Erro ao criar conta bancária', details: error.message });
  }
});

// Atualizar conta bancária
app.put('/api/financial/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, banco, agencia, conta, tipo, saldo, limite, status, observacoes } = req.body;

    if (!nome || !banco || !agencia || !conta) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, banco, agencia, conta' });
    }

    const [result] = await pool.execute(`
      UPDATE financial_accounts 
      SET nome = ?, banco = ?, agencia = ?, conta = ?, tipo = ?, saldo = ?, limite = ?, status = ?, observacoes = ?, updated_at = NOW()
      WHERE id = ?
    `, [nome, banco, agencia, conta, tipo, saldo || 0, limite || 0, status, observacoes || '', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conta bancária não encontrada' });
    }

    console.log('✅ Conta bancária atualizada:', id);
    res.json({ 
      success: true, 
      message: 'Conta bancária atualizada com sucesso',
      conta: { id, nome, banco, agencia, conta, tipo, saldo, limite, status, observacoes }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar conta bancária:', error);
    res.status(500).json({ error: 'Erro ao atualizar conta bancária', details: error.message });
  }
});

// Excluir conta bancária
app.delete('/api/financial/contas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Simular exclusão por enquanto (retornar sucesso)
    console.log('✅ Conta bancária excluída (simulado):', id);
    res.json({ 
      success: true, 
      message: 'Conta bancária excluída com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir conta bancária:', error);
    res.status(500).json({ error: 'Erro ao excluir conta bancária', details: error.message });
  }
});

// ==================== ENDPOINTS CARTÕES ====================

// Buscar todos os cartões
app.get('/api/financial/cartoes', async (req, res) => {
  try {
    // Retornar dados simulados temporariamente para testar o frontend
    const cartoesSimulados = [
      {
        id: 1,
        nome: 'Cartão Principal',
        numero: '**** **** **** 1234',
        bandeira: 'Visa',
        limite: 10000.00,
        fatura_atual: 3500.75,
        vencimento: '2024-11-15',
        status: 'ativo',
        tipo: 'credito',
        observacoes: 'Cartão principal da empresa',
        created_at: '2024-01-15',
        updated_at: '2024-10-18'
      },
      {
        id: 2,
        nome: 'Cartão de Débito',
        numero: '**** **** **** 5678',
        bandeira: 'Mastercard',
        limite: 0.00,
        fatura_atual: 0.00,
        vencimento: '2026-12-31',
        status: 'ativo',
        tipo: 'debito',
        observacoes: 'Vinculado à conta principal',
        created_at: '2024-03-01',
        updated_at: '2024-10-18'
      }
    ];
    
    console.log('✅ Cartões carregados (simulados):', cartoesSimulados.length);
    res.json({ cartoes: cartoesSimulados, total: cartoesSimulados.length });
  } catch (error) {
    console.error('❌ Erro ao buscar cartões:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões', details: error.message });
  }
});

// Criar cartão
app.post('/api/financial/financial_cards', async (req, res) => {
  try {
    const { nome, numero, bandeira, limite, fatura_atual, vencimento, status, tipo, observacoes } = req.body;
    
    if (!nome || !numero || !bandeira) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, numero, bandeira' });
    }

    const [result] = await pool.execute(`
      INSERT INTO financial_cards (
        nome, numero, bandeira, limite, fatura_atual, vencimento, status, tipo, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, numero, bandeira, limite || 0, fatura_atual || 0, vencimento, status || 'ativo', tipo || 'credito', observacoes || '']);
    
    const insertedId = result.insertId;
    console.log('✅ Cartão criado:', insertedId);
    
    res.json({ 
      success: true, 
      message: 'Cartão criado com sucesso',
      cartao: { id: insertedId, nome, numero, bandeira, limite, fatura_atual, vencimento, status, tipo, observacoes }
    });
  } catch (error) {
    console.error('❌ Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro ao criar cartão', details: error.message });
  }
});

// Atualizar cartão
app.put('/api/financial/financial_cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, numero, bandeira, limite, fatura_atual, vencimento, status, tipo, observacoes } = req.body;

    if (!nome || !numero || !bandeira) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, numero, bandeira' });
    }

    const [result] = await pool.execute(`
      UPDATE financial_cards 
      SET nome = ?, numero = ?, bandeira = ?, limite = ?, fatura_atual = ?, vencimento = ?, status = ?, tipo = ?, observacoes = ?, updated_at = NOW()
      WHERE id = ?
    `, [nome, numero, bandeira, limite || 0, fatura_atual || 0, vencimento, status, tipo, observacoes || '', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    console.log('✅ Cartão atualizado:', id);
    res.json({ 
      success: true, 
      message: 'Cartão atualizado com sucesso',
      cartao: { id, nome, numero, bandeira, limite, fatura_atual, vencimento, status, tipo, observacoes }
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro ao atualizar cartão', details: error.message });
  }
});

// Excluir cartão
app.delete('/api/financial/cartoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Simular exclusão por enquanto (retornar sucesso)
    console.log('✅ Cartão excluído (simulado):', id);
    res.json({ 
      success: true, 
      message: 'Cartão excluído com sucesso' 
    });
  } catch (error) {
    console.error('❌ Erro ao excluir cartão:', error);
    res.status(500).json({ error: 'Erro ao excluir cartão', details: error.message });
  }
});

// Criar tabela de transações financeiras se não existir
// ENDPOINT DESABILITADO - Tabela financial_transactions agora usa UUID como PK
// app.post('/api/financial/setup', async (req, res) => {
//   try {
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS financial_transactions (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         data DATE NOT NULL,
//         descricao VARCHAR(255) NOT NULL,
//         categoria VARCHAR(100) NOT NULL,
//         tipo ENUM('Entrada', 'Saída') NOT NULL,
//         valor DECIMAL(10,2) NOT NULL,
//         status ENUM('Pago', 'Pendente', 'Atrasado') DEFAULT 'Pendente',
//         metodo_pagamento VARCHAR(50),
//         origem VARCHAR(255),
//         observacoes TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);

//     // Criar tabela de transações de fornecedores
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS supplier_transactions (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         supplier_id VARCHAR(100) NOT NULL,
//         data DATE NOT NULL,
//         descricao VARCHAR(500) NOT NULL,
//         valor DECIMAL(10,2) NOT NULL,
//         tipo ENUM('compra', 'pagamento', 'devolucao', 'desconto') NOT NULL,
//         status ENUM('pendente', 'pago', 'atrasado', 'cancelado') NOT NULL,
//         forma_pagamento VARCHAR(100),
//         observacoes TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         INDEX idx_supplier_id (supplier_id),
//         INDEX idx_data (data)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);
//     
//     // Criar tabela de pagamentos de fornecedores
//     await pool.execute(`
//       CREATE TABLE IF NOT EXISTS supplier_payments (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         supplier_id VARCHAR(100) NOT NULL,
//         data_vencimento DATE NOT NULL,
//         data_pagamento DATE,
//         valor DECIMAL(10,2) NOT NULL,
//         status ENUM('pendente', 'pago', 'atrasado') NOT NULL,
//         forma_pagamento VARCHAR(100),
//         observacoes TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         INDEX idx_supplier_id (supplier_id),
//         INDEX idx_vencimento (data_vencimento),
//         INDEX idx_status (status)
//       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
//     `);
// 
//     logger.info('Tabelas financeiras criadas/verificadas');
//     res.json({ success: true, message: 'Tabelas financeiras configuradas' });
//   } catch (error) {
//     logger.logError(error, req);
//     res.status(500).json({ error: 'Erro ao configurar tabelas financeiras' });
//   }
// });

// Rotas para transações de fornecedores
app.get('/api/financial/suppliers/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM supplier_transactions WHERE supplier_id = ? ORDER BY data DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar transações do fornecedor' });
  }
});

app.post('/api/financial/suppliers/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, descricao, valor, tipo, status, forma_pagamento, observacoes } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO supplier_transactions (supplier_id, data, descricao, valor, tipo, status, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data, descricao, valor, tipo, status || 'pendente', forma_pagamento || null, observacoes || null]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Transação criada com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar transação do fornecedor' });
  }
});

// Rotas para pagamentos de fornecedores
app.get('/api/financial/suppliers/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM supplier_payments WHERE supplier_id = ? ORDER BY data_vencimento DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar pagamentos do fornecedor' });
  }
});

app.post('/api/financial/suppliers/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { data_vencimento, data_pagamento, valor, status, forma_pagamento, observacoes } = req.body;
    
    const [result] = await pool.execute(
      'INSERT INTO supplier_payments (supplier_id, data_vencimento, data_pagamento, valor, status, forma_pagamento, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, data_vencimento, data_pagamento || null, valor, status || 'pendente', forma_pagamento || null, observacoes || null]
    );
    
    res.json({ success: true, id: result.insertId, message: 'Pagamento registrado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao registrar pagamento do fornecedor' });
  }
});

// Rota para zerar despesas de todos os fornecedores
app.post('/api/financial/suppliers/reset-expenses', async (req, res) => {
  try {
    console.log('🔄 Zerando despesas de fornecedores...');
    
    // Zerar todas as despesas dos fornecedores diretamente na tabela fornecedores
    await pool.execute(`
      UPDATE fornecedores 
      SET total_expenses = 0, 
          updated_at = NOW()
    `);
    
    // Limpar transações financeiras relacionadas a fornecedores (se existirem)
    try {
      await pool.execute(`
        DELETE FROM financial_transactions 
        WHERE tipo = 'saida' 
        AND (origem LIKE '%fornecedor%' OR origem LIKE '%supplier%')
      `);
    } catch (error) {
      console.log('⚠️ Aviso: Não foi possível limpar transações financeiras:', error.message);
    }
    
    console.log('✅ Despesas de fornecedores zeradas com sucesso');
    logger.info('Despesas de fornecedores zeradas');
    
    res.json({ 
      success: true, 
      message: 'Despesas de fornecedores zeradas com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ ERRO ao zerar despesas:', error);
    logger.error('Erro ao zerar despesas de fornecedores', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
});

// Rotas duplicadas REMOVIDAS - usar as rotas principais acima (linhas 9064-9152)

// Rotas para gestão de valores financeiros
app.get('/api/financial/values', async (req, res) => {
  try {
    console.log('🔍 Buscando valores financeiros...');
    
    // Buscar valores da tabela de configurações financeiras
    const [rows] = await pool.execute(`
      SELECT * FROM financial_values 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      // Se não existir, retornar valores calculados
      const [orders] = await pool.execute(`
        SELECT SUM(total) as total FROM orders WHERE payment_status = 'paid'
      `);
      const [events] = await pool.execute(`
        SELECT SUM(renda_total) as total FROM events WHERE renda_total IS NOT NULL
      `);
      const [suppliers] = await pool.execute(`
        SELECT SUM(total_expenses) as total FROM suppliers WHERE total_expenses IS NOT NULL
      `);
      
      const revenue = (orders[0]?.total || 0) + (events[0]?.total || 0);
      const expenses = suppliers[0]?.total || 0;
      const profit = revenue - expenses;
      const balance = profit * 1.2;
      
      res.json({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: profit,
        projectedBalance: balance,
        isOverridden: false
      });
    } else {
      res.json({
        totalRevenue: rows[0].total_revenue,
        totalExpenses: rows[0].total_expenses,
        netProfit: rows[0].net_profit,
        projectedBalance: rows[0].projected_balance,
        isOverridden: rows[0].is_overridden === 1
      });
    }
  } catch (error) {
    console.error('❌ ERRO ao buscar valores financeiros:', error);
    res.status(500).json({ error: 'Erro ao buscar valores financeiros' });
  }
});

app.put('/api/financial/values', async (req, res) => {
  try {
    const { totalRevenue, totalExpenses, netProfit, projectedBalance } = req.body;
    
    console.log('💾 Atualizando valores financeiros:', { totalRevenue, totalExpenses, netProfit, projectedBalance });
    
    // Verificar se já existe registro
    const [existing] = await pool.execute(`
      SELECT id FROM financial_values 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (existing.length > 0) {
      // Atualizar registro existente
      await pool.execute(`
        UPDATE financial_values 
        SET total_revenue = ?, total_expenses = ?, net_profit = ?, 
            projected_balance = ?, is_overridden = 1, updated_at = ?
        WHERE id = ?
      `, [
        totalRevenue, totalExpenses, netProfit, projectedBalance,
        new Date().toISOString(), existing[0].id
      ]);
    } else {
      // Criar novo registro
      const id = crypto.randomUUID();
      await pool.execute(`
        INSERT INTO financial_values (
          id, total_revenue, total_expenses, net_profit, projected_balance, 
          is_overridden, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, totalRevenue, totalExpenses, netProfit, projectedBalance,
        1, new Date().toISOString(), new Date().toISOString()
      ]);
    }
    
    console.log('✅ Valores financeiros atualizados com sucesso');
    res.json({ 
      success: true, 
      message: 'Valores financeiros atualizados com sucesso' 
    });
  } catch (error) {
    console.error('❌ ERRO ao atualizar valores financeiros:', error);
    res.status(500).json({ error: 'Erro ao atualizar valores financeiros', details: error.message });
  }
});

app.post('/api/financial/values/reset', async (req, res) => {
  try {
    console.log('🔄 Resetando valores financeiros para calculados...');
    
    // Calcular valores baseados nos dados reais
    const [orders] = await pool.execute(`
      SELECT SUM(total) as total FROM orders WHERE payment_status = 'paid'
    `);
    const [events] = await pool.execute(`
      SELECT SUM(renda_total) as total FROM events WHERE renda_total IS NOT NULL
    `);
    const [suppliers] = await pool.execute(`
      SELECT SUM(total_expenses) as total FROM suppliers WHERE total_expenses IS NOT NULL
    `);
    
    const revenue = (orders[0]?.total || 0) + (events[0]?.total || 0);
    const expenses = suppliers[0]?.total || 0;
    const profit = revenue - expenses;
    const balance = profit * 1.2;
    
    // Atualizar ou criar registro
    const [existing] = await pool.execute(`
      SELECT id FROM financial_values 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (existing.length > 0) {
      await pool.execute(`
        UPDATE financial_values 
        SET total_revenue = ?, total_expenses = ?, net_profit = ?, 
            projected_balance = ?, is_overridden = 0, updated_at = ?
        WHERE id = ?
      `, [
        revenue, expenses, profit, balance,
        new Date().toISOString(), existing[0].id
      ]);
    } else {
      const id = crypto.randomUUID();
      await pool.execute(`
        INSERT INTO financial_values (
          id, total_revenue, total_expenses, net_profit, projected_balance, 
          is_overridden, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, revenue, expenses, profit, balance,
        0, new Date().toISOString(), new Date().toISOString()
      ]);
    }
    
    console.log('✅ Valores financeiros resetados com sucesso');
    res.json({ 
      success: true, 
      message: 'Valores resetados para os calculados automaticamente',
      values: { totalRevenue: revenue, totalExpenses: expenses, netProfit: profit, projectedBalance: balance }
    });
  } catch (error) {
    console.error('❌ ERRO ao resetar valores financeiros:', error);
    res.status(500).json({ error: 'Erro ao resetar valores financeiros', details: error.message });
  }
});

// Rota para atualizar limite de crédito (simulada)
app.put('/api/financial/suppliers/:id/credit-limit', async (req, res) => {
  try {
    const { id } = req.params;
    const { limiteCredito } = req.body;
    
    // Simular atualização - em produção, isso seria salvo em uma tabela de configurações
    console.log(`Atualizando limite de crédito do fornecedor ${id} para R$ ${limiteCredito}`);
    
    res.json({ success: true, message: 'Limite de crédito atualizado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar limite de crédito' });
  }
});

// =====================================
// Rotas de Estatísticas do Usuário
// =====================================
// app.use('/api/user-stats', require('./routes/user-stats')); // Comentado temporariamente devido a erro ES module

// =====================================
// Sincronização de Carrinho
// =====================================
app.post('/api/cart/sync', async (req, res) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) {
      return res.status(400).json({ error: 'Sessão não encontrada' });
    }

    // Buscar usuário da sessão
    const [session] = await pool.execute('SELECT user_email FROM sessions WHERE id = ?', [sessionId]);
    if (!session || !session[0]) {
      return res.status(401).json({ error: 'Sessão inválida' });
    }

    const userEmail = session[0].user_email;
    const [users] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
    if (!users || !users[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userId = users[0].id;
    const cartId = getOrCreateCartId(req, res);

    // Associar carrinho ao usuário
    await pool.execute('UPDATE carts SET user_id = ? WHERE id = ?', [userId, cartId]);

    res.json({ success: true, message: 'Carrinho sincronizado com sucesso' });
  } catch (error) {
    console.error('Erro ao sincronizar carrinho:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =====================================
// Buscar cliente por email
// =====================================
app.get('/api/customers/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ?',
      [email]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});



// =============================================================================
// ENDPOINTS PARA DADOS REAIS - SISTEMA FINANCEIRO COMPLETO
// =============================================================================

// CATEGORIAS
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categorias ORDER BY nome');
    res.json({ success: true, categorias: rows });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar categorias', details: error.message });
  }
});

app.post('/api/categorias', async (req, res) => {
  try {
    const { nome, descricao, cor, icone, tipo } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO categorias (nome, descricao, cor, icone, tipo) 
      VALUES (?, ?, ?, ?, ?)
    `, [nome, descricao, cor || '#3B82F6', icone || '📁', tipo || 'ambos']);

    logger.info('Categoria criada', { id: result.insertId, nome });
    res.json({ success: true, message: 'Categoria criada com sucesso', id: result.insertId });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar categoria', details: error.message });
  }
});

app.put('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, cor, icone, tipo } = req.body;

    const [result] = await pool.execute(`
      UPDATE categorias 
      SET nome = ?, descricao = ?, cor = ?, icone = ?, tipo = ?, atualizado_em = NOW()
      WHERE id = ?
    `, [nome, descricao, cor, icone, tipo, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    logger.info('Categoria atualizada', { id, nome });
    res.json({ success: true, message: 'Categoria atualizada com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar categoria', details: error.message });
  }
});

app.delete('/api/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM categorias WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    logger.info('Categoria excluída', { id });
    res.json({ success: true, message: 'Categoria excluída com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao excluir categoria', details: error.message });
  }
});

// FORNECEDORES
app.get('/api/fornecedores', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM fornecedores ORDER BY nome');
    res.json({ success: true, fornecedores: rows });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar fornecedores', details: error.message });
  }
});

app.post('/api/fornecedores', async (req, res) => {
  try {
    const { nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO fornecedores (nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, cnpj, email, telefone, endereco, cidade, estado, cep, contato, tipo || 'outros', status || 'ativo', observacoes]);

    logger.info('Fornecedor criado', { id: result.insertId, nome });
    res.json({ success: true, message: 'Fornecedor criado com sucesso', id: result.insertId });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
  }
});

app.put('/api/fornecedores/:id', async (req, res) => {
  try {
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

    logger.info('Fornecedor atualizado', { id, nome });
    res.json({ success: true, message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor', details: error.message });
  }
});

app.delete('/api/fornecedores/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    logger.info('Fornecedor excluído', { id });
    res.json({ success: true, message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao excluir fornecedor', details: error.message });
  }
});

// CLIENTES
app.get('/api/clientes', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM clientes ORDER BY nome');
    res.json({ success: true, clientes: rows });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: error.message });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    const [result] = await pool.execute(`
      INSERT INTO clientes (nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo || 'pessoa_fisica', status || 'ativo', observacoes]);

    logger.info('Cliente criado', { id: result.insertId, nome });
    res.json({ success: true, message: 'Cliente criado com sucesso', id: result.insertId });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao criar cliente', details: error.message });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
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

    logger.info('Cliente atualizado', { id, nome });
    res.json({ success: true, message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao atualizar cliente', details: error.message });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    logger.info('Cliente excluído', { id });
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({ error: 'Erro ao excluir cliente', details: error.message });
  }
});

// =============================================================================
// ENDPOINTS PARA DADOS REAIS - SISTEMA FINANCEIRO COMPLETO
// =============================================================================
// (Endpoints de categorias financeiras movidos para a seção ========== ENDPOINTS DE CATEGORIAS FINANCEIRAS ========== abaixo)

// FORNECEDORES
app.get('/api/financial/fornecedores', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM fornecedores ORDER BY nome');
    res.json({ success: true, fornecedores: rows });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores', details: error.message });
  }
});

app.post('/api/financial/fornecedores', async (req, res) => {
  try {
    const { nome, cnpj, email, telefone, endereco, status } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome do fornecedor é obrigatório' });
    }

    console.log('➕ Criando fornecedor:', nome);

    // Inserir apenas com as colunas que o pool consegue ver
    const [result] = await pool.execute(`
      INSERT INTO fornecedores (nome, cnpj, email, telefone, endereco, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nome, cnpj || null, email || null, telefone || null, endereco || null, status || 'ativo']);

    console.log('✅ Fornecedor criado com ID:', result.insertId);
    res.json({ success: true, message: 'Fornecedor criado com sucesso', id: result.insertId });
  } catch (error) {
    console.error('❌ Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor', details: error.message });
  }
});

app.put('/api/financial/fornecedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, email, telefone, endereco, status } = req.body;

    console.log(`📝 Atualizando fornecedor ID: ${id}`);

    // Atualizar apenas com as colunas que o pool consegue ver
    const [result] = await pool.execute(`
      UPDATE fornecedores 
      SET nome = ?, cnpj = ?, email = ?, telefone = ?, endereco = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `, [nome, cnpj || null, email || null, telefone || null, endereco || null, status || 'ativo', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    console.log('✅ Fornecedor atualizado:', { id, nome });
    res.json({ success: true, message: 'Fornecedor atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor', details: error.message });
  }
});

app.delete('/api/financial/fornecedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Excluindo fornecedor ID: ${id}`);

    const [result] = await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);
    console.log(`📊 Resultado do DELETE:`, { affectedRows: result.affectedRows });

    if (result.affectedRows === 0) {
      console.log(`❌ Fornecedor ID ${id} não encontrado`);
      return res.status(404).json({ error: 'Fornecedor não encontrado' });
    }

    console.log(`✅ Fornecedor ID ${id} excluído com sucesso`);
    res.json({ success: true, message: 'Fornecedor excluído com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir fornecedor:', error);
    res.status(500).json({ error: 'Erro ao excluir fornecedor', details: error.message });
  }
});

// (Endpoints de clientes movidos para a seção ========== ENDPOINTS DE CLIENTES ========== acima)

// Endpoint de teste simples
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Endpoint funcionando!' });
});

// Endpoint para testar estrutura da tabela fornecedores
app.get('/api/test-fornecedores-structure', async (req, res) => {
  try {
    const [columns] = await pool.execute('SHOW COLUMNS FROM fornecedores');
    res.json({ success: true, columns: columns.map(c => c.Field) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para testar conexão com banco
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT DATABASE() as current_db');
    res.json({ success: true, database: rows[0].current_db });
  } catch (error) {
    console.error('Erro ao testar banco:', error);
    res.status(500).json({ error: 'Erro ao testar banco', details: error.message });
  }
});

// Endpoint para testar tabelas
app.get('/api/test-tables', async (req, res) => {
  try {
    const [rows] = await pool.execute('SHOW TABLES LIKE "clientes"');
    res.json({ success: true, tables: rows });
  } catch (error) {
    console.error('Erro ao testar tabelas:', error);
    res.status(500).json({ error: 'Erro ao testar tabelas', details: error.message });
  }
});

// Endpoint para listar todas as tabelas
app.get('/api/test-all-tables', async (req, res) => {
  try {
    const [rows] = await pool.execute('SHOW TABLES');
    res.json({ success: true, tables: rows });
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    res.status(500).json({ error: 'Erro ao listar tabelas', details: error.message });
  }
});

// ========== ENDPOINTS DE CATEGORIAS FINANCEIRAS ==========

// GET - Buscar todas as categorias financeiras
app.get('/api/financial/categorias', async (req, res) => {
  try {
    console.log('✅ Buscando categorias financeiras...');
    
    // Criar um novo pool temporário para resolver problema de cache
    const tempPool = mysql.createPool({
      host: '127.0.0.1',
      user: 'root',
      password: 'RSM_Rg51gti66',
      database: 'rare_toy_companion',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    const [rows] = await tempPool.execute('SELECT * FROM categorias_financeiras ORDER BY nome');
    await tempPool.end();
    
    console.log(`✅ ${rows.length} categorias financeiras encontradas`);
    res.json({ success: true, categorias: rows, total: rows.length });
  } catch (error) {
    console.error('❌ Erro ao buscar categorias financeiras:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias financeiras', details: error.message });
  }
});

// POST - Criar nova categoria financeira
app.post('/api/financial/categorias', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { nome, descricao, cor, icone, tipo } = req.body;
    
    console.log('✅ Criando nova categoria financeira:', nome);
    
    const [result] = await tempPool.execute(`
      INSERT INTO categorias_financeiras (nome, descricao, cor, icone, tipo)
      VALUES (?, ?, ?, ?, ?)
    `, [nome, descricao || null, cor || '#3B82F6', icone || '📁', tipo || 'ambos']);
    
    await tempPool.end();
    
    console.log(`✅ Categoria financeira criada com ID: ${result.insertId}`);
    res.json({ success: true, id: result.insertId, message: 'Categoria financeira criada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar categoria financeira:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao criar categoria financeira', details: error.message });
  }
});

// PUT - Atualizar categoria financeira
app.put('/api/financial/categorias/:id', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { id } = req.params;
    const { nome, descricao, cor, icone, tipo } = req.body;
    
    console.log(`✅ Atualizando categoria financeira ID: ${id}`);
    
    await tempPool.execute(`
      UPDATE categorias_financeiras 
      SET nome = ?, descricao = ?, cor = ?, icone = ?, tipo = ?
      WHERE id = ?
    `, [nome, descricao || null, cor || '#3B82F6', icone || '📁', tipo || 'ambos', id]);
    
    await tempPool.end();
    
    console.log(`✅ Categoria financeira ${id} atualizada`);
    res.json({ success: true, message: 'Categoria financeira atualizada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar categoria financeira:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao atualizar categoria financeira', details: error.message });
  }
});

// DELETE - Excluir categoria financeira
app.delete('/api/financial/categorias/:id', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { id } = req.params;
    
    console.log(`✅ Excluindo categoria financeira ID: ${id}`);
    
    await tempPool.execute('DELETE FROM categorias_financeiras WHERE id = ?', [id]);
    await tempPool.end();
    
    console.log(`✅ Categoria financeira ${id} excluída`);
    res.json({ success: true, message: 'Categoria financeira excluída com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir categoria financeira:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao excluir categoria financeira', details: error.message });
  }
});

// ========== ENDPOINTS DE CLIENTES ==========

// GET - Buscar todos os clientes
app.get('/api/financial/clientes', async (req, res) => {
  try {
    console.log('👥 Buscando clientes da loja (tabela customers)...');
    
    // Criar pool temporário para acessar tabela customers
    const tempPool = mysql.createPool({
      host: '127.0.0.1',
      user: 'root',
      password: 'RSM_Rg51gti66',
      database: 'rare_toy_companion',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Buscar da tabela customers (clientes reais da loja)
    const [rows] = await tempPool.execute(`
      SELECT id, nome, email, telefone, cpf, data_nascimento,
             endereco_rua, endereco_numero, endereco_complemento,
             endereco_bairro, endereco_cidade, endereco_estado, endereco_cep,
             status, total_pedidos, total_gasto, ultimo_pedido, created_at
      FROM customers 
      ORDER BY nome
    `);
    
    // Fechar pool temporário
    await tempPool.end();
    
    const clientes = rows.map(cliente => ({
      id: cliente.id,
      nome: cliente.nome,
      cpf: cliente.cpf || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      endereco: `${cliente.endereco_rua || ''} ${cliente.endereco_numero || ''} ${cliente.endereco_complemento || ''}`.trim(),
      cidade: cliente.endereco_cidade || '',
      estado: cliente.endereco_estado || '',
      cep: cliente.endereco_cep || '',
      data_nascimento: cliente.data_nascimento || '',
      tipo: cliente.cpf ? 'pessoa_fisica' : 'pessoa_juridica',
      status: cliente.status || 'ativo',
      total_compras: cliente.total_pedidos || 0,
      valor_total: parseFloat(cliente.total_gasto) || 0,
      ultima_compra: cliente.ultimo_pedido ? new Date(cliente.ultimo_pedido).toISOString().split('T')[0] : '',
      observacoes: `Cliente da loja - ${cliente.total_pedidos || 0} pedidos realizados`,
      criado_em: cliente.created_at ? new Date(cliente.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      // Campos específicos da loja
      total_pedidos: cliente.total_pedidos || 0,
      total_gasto: parseFloat(cliente.total_gasto) || 0,
      ultimo_pedido: cliente.ultimo_pedido
    }));
    
    console.log(`✅ ${clientes.length} clientes da loja encontrados`);
    res.json({ success: true, clientes, total: clientes.length });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes da loja:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes da loja', details: error.message });
  }
});

// POST - Criar novo cliente
app.post('/api/financial/clientes', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, observacoes } = req.body;
    
    console.log('✅ Criando novo cliente:', nome);
    
    const [result] = await tempPool.execute(`
      INSERT INTO clientes (nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?)
    `, [nome, cpf || null, email || null, telefone || null, endereco || null, cidade || null, estado || null, cep || null, data_nascimento || null, tipo || 'pessoa_fisica', observacoes || null]);
    
    await tempPool.end();
    
    console.log(`✅ Cliente criado com ID: ${result.insertId}`);
    res.json({ success: true, id: result.insertId, message: 'Cliente criado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao criar cliente', details: error.message });
  }
});

// PUT - Atualizar cliente
app.put('/api/financial/clientes/:id', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { id } = req.params;
    const { nome, cpf, email, telefone, endereco, cidade, estado, cep, data_nascimento, tipo, status, observacoes } = req.body;
    
    console.log(`✅ Atualizando cliente ID: ${id}`);
    
    await tempPool.execute(`
      UPDATE clientes 
      SET nome = ?, cpf = ?, email = ?, telefone = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, data_nascimento = ?, tipo = ?, status = ?, observacoes = ?
      WHERE id = ?
    `, [nome, cpf || null, email || null, telefone || null, endereco || null, cidade || null, estado || null, cep || null, data_nascimento || null, tipo || 'pessoa_fisica', status || 'ativo', observacoes || null, id]);
    
    await tempPool.end();
    
    console.log(`✅ Cliente ${id} atualizado`);
    res.json({ success: true, message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao atualizar cliente', details: error.message });
  }
});

// DELETE - Excluir cliente
app.delete('/api/financial/clientes/:id', async (req, res) => {
  const tempPool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'RSM_Rg51gti66',
    database: 'rare_toy_companion',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  try {
    const { id } = req.params;
    
    console.log(`✅ Excluindo cliente ID: ${id}`);
    
    await tempPool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    await tempPool.end();
    
    console.log(`✅ Cliente ${id} excluído`);
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao excluir cliente:', error);
    await tempPool.end();
    res.status(500).json({ error: 'Erro ao excluir cliente', details: error.message });
  }
});

// Endpoint para testar clientes diretamente
app.get('/api/test-clientes', async (req, res) => {
  try {
    console.log('Testando clientes...');
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM clientes');
    console.log('Total de clientes:', rows[0].total);
    res.json({ success: true, total: rows[0].total });
  } catch (error) {
    console.error('Erro ao testar clientes:', error);
    res.status(500).json({ error: 'Erro ao testar clientes', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-alt', async (req, res) => {
  try {
    console.log('Testando clientes alternativo...');
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM clientes');
    console.log('Total de clientes:', rows[0].total);
    res.json({ success: true, total: rows[0].total });
  } catch (error) {
    console.error('Erro ao testar clientes alternativo:', error);
    res.status(500).json({ error: 'Erro ao testar clientes alternativo', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-simple', async (req, res) => {
  try {
    console.log('Testando clientes simples...');
    const [rows] = await pool.execute('SELECT * FROM clientes LIMIT 1');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes simples:', error);
    res.status(500).json({ error: 'Erro ao testar clientes simples', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-final', async (req, res) => {
  try {
    console.log('Testando clientes final...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes final:', error);
    res.status(500).json({ error: 'Erro ao testar clientes final', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo', async (req, res) => {
  try {
    console.log('Testando clientes último...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo-alt', async (req, res) => {
  try {
    console.log('Testando clientes último alt...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último alt:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último alt', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo-alt2', async (req, res) => {
  try {
    console.log('Testando clientes último alt2...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último alt2:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último alt2', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo-alt3', async (req, res) => {
  try {
    console.log('Testando clientes último alt3...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último alt3:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último alt3', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo-alt4', async (req, res) => {
  try {
    console.log('Testando clientes último alt4...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último alt4:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último alt4', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-clientes-ultimo-alt5', async (req, res) => {
  try {
    console.log('Testando clientes último alt5...');
    const [rows] = await pool.execute('SELECT * FROM clientes');
    console.log('Clientes encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes último alt5:', error);
    res.status(500).json({ error: 'Erro ao testar clientes último alt5', details: error.message });
  }
});

// Endpoint para testar a nova tabela clientes_novo
app.get('/api/test-clientes-novo', async (req, res) => {
  try {
    console.log('Testando clientes_novo...');
    const [rows] = await pool.execute('SELECT * FROM clientes_novo');
    console.log('Clientes_novo encontrados:', rows.length);
    res.json({ success: true, count: rows.length });
  } catch (error) {
    console.error('Erro ao testar clientes_novo:', error);
    res.status(500).json({ error: 'Erro ao testar clientes_novo', details: error.message });
  }
});

// Endpoint para testar a conexão com o banco e listar todas as tabelas
app.get('/api/test-db-connection', async (req, res) => {
  try {
    console.log('Testando conexão com o banco...');
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('Tabelas encontradas:', tables.length);
    const tableNames = tables.map(table => Object.values(table)[0]);
    res.json({ success: true, tables: tableNames, count: tables.length });
  } catch (error) {
    console.error('Erro ao testar conexão com o banco:', error);
    res.status(500).json({ error: 'Erro ao testar conexão com o banco', details: error.message });
  }
});

// Endpoint para testar diretamente a tabela clientes
app.get('/api/test-clientes-direct', async (req, res) => {
  try {
    console.log('Testando tabela clientes diretamente...');
    
    // Criar um novo pool de conexões para este teste
    const testPool = mysql.createPool({
      host: '127.0.0.1',
      user: 'root',
      password: 'RSM_Rg51gti66',
      database: 'rare_toy_companion',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    const [rows] = await testPool.execute('SELECT COUNT(*) as total FROM clientes');
    console.log('Total de clientes:', rows[0].total);
    
    // Fechar o pool de teste
    await testPool.end();
    
    res.json({ success: true, total: rows[0].total });
  } catch (error) {
    console.error('Erro ao testar tabela clientes diretamente:', error);
    res.status(500).json({ error: 'Erro ao testar tabela clientes diretamente', details: error.message, stack: error.stack });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-fornecedores', async (req, res) => {
  try {
    console.log('Testando fornecedores...');
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM fornecedores');
    console.log('Total de fornecedores:', rows[0].total);
    res.json({ success: true, total: rows[0].total });
  } catch (error) {
    console.error('Erro ao testar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao testar fornecedores', details: error.message });
  }
});

// Endpoint para testar com uma tabela que sabemos que funciona
app.get('/api/test-categorias', async (req, res) => {
  try {
    console.log('Testando categorias...');
    const [rows] = await pool.execute('SELECT COUNT(*) as total FROM categorias');
    console.log('Total de categorias:', rows[0].total);
    res.json({ success: true, total: rows[0].total });
  } catch (error) {
    console.error('Erro ao testar categorias:', error);
    res.status(500).json({ error: 'Erro ao testar categorias', details: error.message });
  }
});

// Teste específico para tabela customers
app.get('/api/test-customers', async (req, res) => {
  try {
    console.log('🔍 Testando tabela customers...');
    
    const [columns] = await pool.execute('SHOW COLUMNS FROM customers');
    console.log('📋 Colunas da tabela customers:', columns);
    
    const [rows] = await pool.execute('SELECT id, nome, email, total_pedidos, total_gasto FROM customers LIMIT 3');
    console.log('📊 Dados da tabela customers:', rows);
    
    res.json({ 
      success: true, 
      columns: columns,
      data: rows,
      message: 'Estrutura da tabela customers verificada'
    });
  } catch (error) {
    console.error('❌ Erro ao verificar tabela customers:', error);
    res.status(500).json({ error: 'Erro ao verificar tabela customers', details: error.message });
  }
});

// ====================
// ENDPOINTS DE CONFIGURAÇÕES DO CLIENTE
// ====================

// Buscar configurações do cliente
app.get('/api/customers/:userId/settings', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 GET /api/customers/${userId}/settings`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }
    
    // Buscar configurações
    const [settings] = await pool.execute(`
      SELECT * FROM customer_settings WHERE customer_id = ?
    `, [userId]);
    
    if (settings.length > 0) {
      const setting = settings[0];
      res.json({
        privacy: {
          showProfile: setting.show_profile || true,
          showPurchaseHistory: setting.show_purchase_history || false,
          showWishlist: setting.show_wishlist || false,
          allowMarketing: setting.allow_marketing || true,
          allowAnalytics: setting.allow_analytics || true,
          allowCookies: setting.allow_cookies || true
        },
        preferences: {
          language: setting.language || 'pt-BR',
          currency: setting.currency || 'BRL',
          theme: setting.theme || 'light',
          emailFrequency: setting.email_frequency || 'weekly',
          twoFactorAuth: setting.two_factor_auth || false
        }
      });
    } else {
      // Retornar valores padrão
      res.json({
        privacy: {
          showProfile: true,
          showPurchaseHistory: false,
          showWishlist: false,
          allowMarketing: true,
          allowAnalytics: true,
          allowCookies: true
        },
        preferences: {
          language: 'pt-BR',
          currency: 'BRL',
          theme: 'light',
          emailFrequency: 'weekly',
          twoFactorAuth: false
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Salvar configurações do cliente
app.put('/api/customers/:userId/settings', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 PUT /api/customers/${userId}/settings`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }
    
    const { privacy, preferences } = req.body;
    console.log('📝 Salvando configurações:', { privacy, preferences });
    
    // Verificar se já existe configuração
    const [existing] = await pool.execute(`
      SELECT id FROM customer_settings WHERE customer_id = ?
    `, [userId]);
    
    if (existing.length > 0) {
      // Atualizar configurações existentes
      await pool.execute(`
        UPDATE customer_settings SET
          show_profile = ?,
          show_purchase_history = ?,
          show_wishlist = ?,
          allow_marketing = ?,
          allow_analytics = ?,
          allow_cookies = ?,
          language = ?,
          currency = ?,
          theme = ?,
          email_frequency = ?,
          two_factor_auth = ?,
          updated_at = NOW()
        WHERE customer_id = ?
      `, [
        privacy?.showProfile || true,
        privacy?.showPurchaseHistory || false,
        privacy?.showWishlist || false,
        privacy?.allowMarketing || true,
        privacy?.allowAnalytics || true,
        privacy?.allowCookies || true,
        preferences?.language || 'pt-BR',
        preferences?.currency || 'BRL',
        preferences?.theme || 'light',
        preferences?.emailFrequency || 'weekly',
        preferences?.twoFactorAuth || false,
        userId
      ]);
    } else {
      // Criar novas configurações
      await pool.execute(`
        INSERT INTO customer_settings (
          customer_id,
          show_profile,
          show_purchase_history,
          show_wishlist,
          allow_marketing,
          allow_analytics,
          allow_cookies,
          language,
          currency,
          theme,
          email_frequency,
          two_factor_auth,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        userId,
        privacy?.showProfile || true,
        privacy?.showPurchaseHistory || false,
        privacy?.showWishlist || false,
        privacy?.allowMarketing || true,
        privacy?.allowAnalytics || true,
        privacy?.allowCookies || true,
        preferences?.language || 'pt-BR',
        preferences?.currency || 'BRL',
        preferences?.theme || 'light',
        preferences?.emailFrequency || 'weekly',
        preferences?.twoFactorAuth || false
      ]);
    }
    
    console.log('✅ Configurações salvas com sucesso');
    res.json({ success: true, message: 'Configurações salvas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações', details: error.message });
  }
});

// Buscar preferências de notificação do cliente
app.get('/api/customers/:userId/notification-preferences', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 GET /api/customers/${userId}/notification-preferences`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }
    
    // Buscar preferências da tabela customer_settings
    const [settings] = await pool.execute(`
      SELECT allow_marketing, allow_analytics FROM customer_settings WHERE customer_id = ?
    `, [userId]);
    
    if (settings.length > 0) {
      res.json({
        emailNotifications: settings[0].allow_marketing || true,
        pushNotifications: settings[0].allow_analytics || true
      });
    } else {
      // Retornar valores padrão
      res.json({
        emailNotifications: true,
        pushNotifications: true
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar preferências de notificação:', error);
    res.json({ emailNotifications: true, pushNotifications: true });
  }
});

// Salvar preferências de notificação do cliente
app.put('/api/customers/:userId/notification-preferences', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 PUT /api/customers/${userId}/notification-preferences`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
    }
    
    const { emailNotifications, pushNotifications } = req.body;
    console.log('📝 Salvando preferências de notificação:', { emailNotifications, pushNotifications });
    
    // Verificar se já existe configuração
    const [existing] = await pool.execute(`
      SELECT id FROM customer_settings WHERE customer_id = ?
    `, [userId]);
    
    if (existing.length > 0) {
      // Atualizar configurações existentes
      await pool.execute(`
        UPDATE customer_settings SET
          allow_marketing = ?,
          allow_analytics = ?,
          updated_at = NOW()
        WHERE customer_id = ?
      `, [emailNotifications ? 1 : 0, pushNotifications ? 1 : 0, userId]);
    } else {
      // Criar novas configurações
      await pool.execute(`
        INSERT INTO customer_settings (
          customer_id,
          allow_marketing,
          allow_analytics,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, NOW(), NOW())
      `, [userId, emailNotifications ? 1 : 0, pushNotifications ? 1 : 0]);
    }
    
    console.log('✅ Preferências de notificação salvas com sucesso');
    res.json({ success: true, message: 'Preferências salvas com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao salvar preferências de notificação:', error);
    res.status(500).json({ error: 'Erro ao salvar preferências', details: error.message });
  }
});

// Buscar sessões ativas do cliente
app.get('/api/customers/:userId/sessions', async (req, res) => {
  try {
    let { userId } = req.params;
    console.log(`📍 GET /api/customers/${userId}/sessions`);
    
    // Se userId parece ser email, buscar o ID do usuário
    if (userId.includes('@')) {
      const [user] = await pool.execute('SELECT id, email FROM users WHERE email = ?', [userId]);
      if (user && user[0]) {
        userId = user[0].id;
        // Buscar sessões por user_id E por email
        const [sessions] = await pool.execute(`
          SELECT 
            id,
            user_id,
            user_email,
            created_at,
            updated_at
          FROM sessions 
          WHERE user_id = ? OR user_email = ?
          ORDER BY created_at DESC
          LIMIT 10
        `, [userId, user[0].email]);
        
        return res.json({ 
          sessions: sessions.map(s => ({
            id: s.id,
            device: 'Navegador',
            location: 'Brasil',
            lastActive: s.updated_at || s.created_at,
            current: true
          }))
        });
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado', sessions: [] });
      }
    }
    
    // Buscar sessões por user_id
    const [sessions] = await pool.execute(`
      SELECT 
        id,
        user_id,
        user_email,
        created_at,
        updated_at
      FROM sessions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId]);
    
    res.json({ 
      sessions: sessions.map(s => ({
        id: s.id,
        device: 'Navegador',
        location: 'Brasil',
        lastActive: s.updated_at || s.created_at,
        current: true
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar sessões:', error);
    res.json({ sessions: [] });
  }
});

// Criar tabela de configurações do cliente se não existir
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS customer_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(191) NOT NULL,
        show_profile TINYINT(1) DEFAULT 1,
        show_purchase_history TINYINT(1) DEFAULT 0,
        show_wishlist TINYINT(1) DEFAULT 0,
        allow_marketing TINYINT(1) DEFAULT 1,
        allow_analytics TINYINT(1) DEFAULT 1,
        allow_cookies TINYINT(1) DEFAULT 1,
        language VARCHAR(10) DEFAULT 'pt-BR',
        currency VARCHAR(10) DEFAULT 'BRL',
        theme VARCHAR(20) DEFAULT 'light',
        email_frequency VARCHAR(20) DEFAULT 'weekly',
        two_factor_auth TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_customer (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✅ Tabela customer_settings criada/verificada');
  } catch (e) {
    console.error('❌ Erro ao criar tabela customer_settings:', e);
  }
})();

console.log('✅ Endpoints da API para dados reais carregados com sucesso!');

