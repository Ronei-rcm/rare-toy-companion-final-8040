const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware básico
app.use(cors({
  origin: ['http://localhost:8040', 'http://localhost:3000', 'http://127.0.0.1:8040'],
  credentials: true
}));
app.use(express.json());
// Serve arquivos enviados
const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');
const COLLECTION_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'collections');
fs.mkdirSync(COLLECTION_UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_ROOT));

// Utilitário: salvar imagem base64 e retornar caminho
function saveBase64ImageToCollections(base64Data) {
  try {
    if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:')) return null;
    const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return null;
    const mime = match[1];
    const ext = mime.split('/')[1] || 'png';
    const buffer = Buffer.from(match[2], 'base64');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const absPath = path.join(COLLECTION_UPLOAD_DIR, filename);
    fs.writeFileSync(absPath, buffer);
    return `/uploads/collections/${filename}`;
  } catch (e) {
    console.error('Erro ao salvar imagem base64:', e);
    return null;
  }
}

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

// Ensure required tables exist (collections)
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT,
        image_url TEXT,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        order_index INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Checked/created table: collections');
  } catch (err) {
    console.error('Failed ensuring collections table:', err);
  }
})();

// Utils de normalização de entrada
const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
  }
  return undefined;
};

const normalizeInteger = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const n = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(n) ? n : defaultValue;
};

const normalizeString = (value, defaultValue = '') => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return defaultValue;
  }
};

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
        normalizeBoolean(item.ativo) !== undefined ? normalizeBoolean(item.ativo) : true,
        normalizeInteger(item.order_index, 0)
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

// Buscar item único do carrossel por ID
app.get('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Item não encontrado' });
    res.json(transformCarouselItem(rows[0]));
  } catch (error) {
    console.error('Error fetching carousel item by id:', error);
    res.status(500).json({ error: 'Failed to fetch carousel item' });
  }
});

// Atualizar item do carrossel (replace semantics)
app.put('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body || {};
    if (!id) return res.status(400).json({ error: 'Parâmetro id é obrigatório' });

    // Verifica existência
    const [exists] = await pool.execute('SELECT id FROM carousel_items WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Item não encontrado' });

    const title = item.nome ?? '';
    const subtitle = item.descricao ?? '';
    const image_url = item.imagem ?? '';
    const button_text = item.button_text ?? 'Ver Mais';
    const button_link = item.button_link ?? '#';
    const normalizedActive = normalizeBoolean(item.ativo);
    const active = normalizedActive !== undefined ? normalizedActive : true;
    const order_index = normalizeInteger(item.order_index, 0);

    await pool.execute(
      `UPDATE carousel_items SET 
        title = ?, subtitle = ?, image_url = ?, button_text = ?, button_link = ?,
        active = ?, order_index = ?, updated_at = NOW()
       WHERE id = ?`,
      [title, subtitle, image_url, button_text, button_link, active, order_index, id]
    );

    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    res.json(transformCarouselItem(rows[0]));
  } catch (error) {
    console.error('Error updating carousel item:', error);
    res.status(500).json({ error: 'Failed to update carousel item' });
  }
});

// Alternar/definir ativo do item do carrossel
app.patch('/api/carousel/:id/active', async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
    const normalizedActive = normalizeBoolean(ativo);
    if (normalizedActive === undefined) return res.status(400).json({ error: 'Campo ativo é obrigatório (true/false, 1/0)' });

    const [exists] = await pool.execute('SELECT id FROM carousel_items WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Item não encontrado' });

    await pool.execute('UPDATE carousel_items SET active = ?, updated_at = NOW() WHERE id = ?', [normalizedActive, id]);
    const [rows] = await pool.execute('SELECT * FROM carousel_items WHERE id = ?', [id]);
    res.json(transformCarouselItem(rows[0]));
  } catch (error) {
    console.error('Error toggling active for carousel item:', error);
    res.status(500).json({ error: 'Failed to update active status' });
  }
});

// Remover item do carrossel
app.delete('/api/carousel/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Parâmetro id é obrigatório' });

    const [exists] = await pool.execute('SELECT id FROM carousel_items WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Item não encontrado' });

    await pool.execute('DELETE FROM carousel_items WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    res.status(500).json({ error: 'Failed to delete carousel item' });
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

// Debug: inspecionar colunas da tabela collections
app.get('/api/debug/collections-schema', async (req, res) => {
  try {
    const [cols] = await pool.execute("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections' ORDER BY ORDINAL_POSITION");
    res.json({
      database: process.env.MYSQL_DATABASE || 'unknown',
      table: 'collections',
      columns: cols
    });
  } catch (error) {
    console.error('Erro schema collections:', error);
    res.status(500).json({ error: 'Failed to read collections schema', message: error?.message, code: error?.code });
  }
});

// ==========================
// Collections (MySQL-backed)
// ==========================
const transformCollectionOut = (dbRow) => {
  const imageUrl = dbRow.image_url || dbRow.imagem_url || '';
  return {
    id: dbRow.id,
    name: dbRow.name || dbRow.nome || '',
    description: dbRow.description || dbRow.descricao || '',
    image_url: imageUrl,
    imagem: imageUrl,
    active: dbRow.active === 1 || dbRow.active === true || dbRow.ativo === 1 || dbRow.ativo === true || true,
    order_index: normalizeInteger(dbRow.order_index ?? dbRow.ordem, 0)
  };
};

app.get('/api/collections', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '12', 10), 1), 100);
    const q = (req.query.q || '').toString().trim();
    const sort = (req.query.sort || 'created_at').toString();
    const order = ((req.query.order || 'asc').toString().toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    const allowSort = new Set(['created_at', 'nome']);
    const sortCol = allowSort.has(sort) ? sort : 'created_at';

    const whereParts = [];
    const whereVals = [];
    if (q) {
      whereParts.push('(nome LIKE ? OR descricao LIKE ?)');
      whereVals.push(`%${q}%`, `%${q}%`);
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM collections ${whereSql}`, whereVals);
    const total = countRows[0]?.total || 0;

    const [rows] = await pool.execute(
      `SELECT * FROM collections ${whereSql} ORDER BY ${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...whereVals, pageSize, offset]
    );
    res.json({
      items: rows.map(transformCollectionOut),
      page,
      pageSize,
      total,
      hasMore: offset + rows.length < total
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

app.get('/api/collections/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Collection não encontrada' });
    res.json(transformCollectionOut(rows[0]));
  } catch (error) {
    console.error('Error fetching collection by id:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

app.post('/api/collections', async (req, res) => {
  try {
    const body = req.body || {};
    const nome = normalizeString(body.name ?? body.nome, '');
    const descricao = normalizeString(body.description ?? body.descricao, '');
    let imagem_url = normalizeString(body.image_url ?? body.imagem_url ?? body.imagem, '');
    if (!nome || !descricao) return res.status(400).json({ error: 'Nome e descrição são obrigatórios' });

    // Se recebeu base64, salvar em disco
    if (imagem_url && imagem_url.startsWith('data:')) {
      const saved = saveBase64ImageToCollections(imagem_url);
      if (saved) imagem_url = saved;
    }

    // Detect schema and build insert
    const [cols] = await pool.execute("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collections'");
    const colSet = new Set(cols.map(c => c.COLUMN_NAME));
    const typeBy = Object.fromEntries(cols.map(c => [c.COLUMN_NAME, c.DATA_TYPE]));

    const insertCols = [];
    const insertVals = [];
    // If id exists and is not integer, provide uuid; if integer, let DB autoincrement
    let providedId = null;
    if (colSet.has('id') && typeBy['id'] !== 'int' && typeBy['id'] !== 'bigint') {
      providedId = require('crypto').randomUUID();
      insertCols.push('id');
      insertVals.push(providedId);
    }
    if (colSet.has('nome')) { insertCols.push('nome'); insertVals.push(nome); }
    if (colSet.has('name')) { insertCols.push('name'); insertVals.push(nome); }
    if (colSet.has('descricao')) { insertCols.push('descricao'); insertVals.push(descricao); }
    if (colSet.has('description')) { insertCols.push('description'); insertVals.push(descricao); }
    if (colSet.has('imagem_url')) { insertCols.push('imagem_url'); insertVals.push(imagem_url); }
    if (colSet.has('image_url')) { insertCols.push('image_url'); insertVals.push(imagem_url); }

    const placeholders = insertVals.map(() => '?').join(', ');
    let sql = `INSERT INTO collections (${insertCols.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW())`;
    console.log('🧩 collections.insert columns:', insertCols);
    console.log('🧩 collections.insert sql:', sql);
    let result;
    try {
      [result] = await pool.execute(sql, insertVals);
    } catch (e) {
      // Retry including id if missing default for id
      if (e && e.code === 'ER_NO_DEFAULT_FOR_FIELD' && colSet.has('id')) {
        const retryId = require('crypto').randomUUID();
        insertCols.unshift('id');
        insertVals.unshift(retryId);
        sql = `INSERT INTO collections (${insertCols.join(', ')}, created_at, updated_at) VALUES (${insertVals.map(() => '?').join(', ')}, NOW(), NOW())`;
        console.warn('⚠️ Retry insert with id generated. sql:', sql);
        ;[result] = await pool.execute(sql, insertVals);
        providedId = retryId;
      } else {
        throw e;
      }
    }

    // Read created row
    let idToFetch = providedId;
    if (!idToFetch) idToFetch = result.insertId;
    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [idToFetch]);
    res.status(201).json(transformCollectionOut(rows[0]));
  } catch (error) {
    console.error('Error creating collection:', { message: error?.message, code: error?.code });
    res.status(500).json({ error: 'Failed to create collection', message: error?.message, code: error?.code });
  }
});

app.put('/api/collections/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body || {};
    console.log('[PUT /api/collections/:id] body:', {
      keys: Object.keys(body || {}),
      nome: body?.nome ?? body?.name,
      descricao: body?.descricao ?? body?.description,
      imagem_url: body?.imagem_url ?? body?.image_url
    });
    const [exists] = await pool.execute('SELECT id FROM collections WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Collection não encontrada' });

    const nome = normalizeString(body.name ?? body.nome, '');
    const descricao = normalizeString(body.description ?? body.descricao, '');
    let imagem_url = normalizeString(body.image_url ?? body.imagem_url ?? body.imagem, '');

    if (imagem_url && imagem_url.startsWith('data:')) {
      const saved = saveBase64ImageToCollections(imagem_url);
      if (saved) imagem_url = saved;
    }

    await pool.execute(
      `UPDATE collections SET 
        nome = ?, descricao = ?, imagem_url = ?, updated_at = NOW()
       WHERE id = ?`,
      [nome, descricao, imagem_url, id]
    );

    const [rows] = await pool.execute('SELECT * FROM collections WHERE id = ?', [id]);
    res.json(transformCollectionOut(rows[0]));
  } catch (error) {
    console.error('Error updating collection:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    res.status(500).json({ error: 'Failed to update collection', code: error?.code || null, message: error?.message || null });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [exists] = await pool.execute('SELECT id FROM collections WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Collection não encontrada' });

    await pool.execute('DELETE FROM collections WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// ==========================
// Collection Products linking
// ==========================
// Ensure link table exists with flexible types (collection_id as VARCHAR, product_id as INT)
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
  } catch (err) {
    console.error('❌ Failed ensuring collection_products table:', err);
  }
})();

// List products in a collection
app.get('/api/collections/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '12', 10), 1), 200);
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM collection_products WHERE collection_id = ?', [id]);
    const total = countRows[0]?.total || 0;

    const [links] = await pool.execute(
      'SELECT * FROM collection_products WHERE collection_id = ? ORDER BY order_index ASC, created_at ASC LIMIT ? OFFSET ?',
      [id, pageSize, offset]
    );

    // Try to enrich with product details if products table exists
    let productMap = {};
    if (links.length > 0) {
      const ids = links.map(l => l.product_id);
      try {
        const placeholders = ids.map(() => '?').join(',');
        const [prodCols] = await pool.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'");
        const colSet = new Set(prodCols.map(c => c.COLUMN_NAME));
        const idCol = colSet.has('id') ? 'id' : null;
        const nameCol = colSet.has('name') ? 'name' : (colSet.has('nome') ? 'nome' : null);
        const imageCol = colSet.has('image_url') ? 'image_url' : (colSet.has('imagem_url') ? 'imagem_url' : null);
        const priceCol = colSet.has('price') ? 'price' : (colSet.has('preco') ? 'preco' : null);
        if (idCol) {
          const [rows] = await pool.execute(`SELECT * FROM products WHERE ${idCol} IN (${placeholders})`, ids);
          productMap = rows.reduce((acc, row) => {
            acc[row[idCol]] = {
              id: row[idCol],
              name: nameCol ? row[nameCol] : undefined,
              image_url: imageCol ? row[imageCol] : undefined,
              price: priceCol ? row[priceCol] : undefined
            };
            return acc;
          }, {});
        }
      } catch (_) {}
    }

    res.json({
      items: links.map(l => ({
        id: l.id,
        collection_id: l.collection_id,
        product_id: l.product_id,
        order_index: l.order_index,
        product: productMap[l.product_id] || null
      })),
      page,
      pageSize,
      total,
      hasMore: offset + links.length < total
    });
  } catch (error) {
    console.error('Error listing collection products:', error);
    res.status(500).json({ error: 'Failed to list collection products' });
  }
});

// Add product to collection
app.post('/api/collections/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id, order_index } = req.body || {};
    if (!product_id) return res.status(400).json({ error: 'product_id é obrigatório' });

    const [exists] = await pool.execute('SELECT id FROM collections WHERE id = ?', [id]);
    if (!exists || exists.length === 0) return res.status(404).json({ error: 'Coleção não encontrada' });

    // Validate product if possible
    try {
      const [prow] = await pool.execute('SELECT id FROM products WHERE id = ?', [product_id]);
      if (!prow || prow.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
    } catch (_) {}

    const ord = Number.isFinite(order_index) ? order_index : 0;
    const [result] = await pool.execute(
      'INSERT INTO collection_products (collection_id, product_id, order_index, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [id, product_id, ord]
    );
    res.status(201).json({ id: result.insertId, collection_id: id, product_id, order_index: ord });
  } catch (error) {
    console.error('Error adding product to collection:', error);
    res.status(500).json({ error: 'Failed to add product to collection' });
  }
});

// Remove product from collection
app.delete('/api/collections/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    await pool.execute('DELETE FROM collection_products WHERE collection_id = ? AND product_id = ?', [id, productId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing product from collection:', error);
    res.status(500).json({ error: 'Failed to remove product from collection' });
  }
});

// Reorder products in a collection (batch)
app.patch('/api/collections/:id/products/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items deve ser um array de { product_id, order_index }' });
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const it of items) {
        if (!it || typeof it.product_id === 'undefined') continue;
        const ord = Number.isFinite(it.order_index) ? it.order_index : 0;
        await conn.execute(
          'UPDATE collection_products SET order_index = ?, updated_at = NOW() WHERE collection_id = ? AND product_id = ?',
          [ord, id, it.product_id]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering products in collection:', error);
    res.status(500).json({ error: 'Failed to reorder products' });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ultra Simple API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎠 Carousel API: http://localhost:${PORT}/api/carousel`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});
