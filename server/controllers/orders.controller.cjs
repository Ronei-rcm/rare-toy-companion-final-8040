/**
 * Orders Controller
 * 
 * Controller layer para pedidos - validação, transformação e respostas HTTP
 * Foco em operações CRUD básicas
 */

const ordersService = require('../services/orders.service.cjs');
const { getPublicUrl, getOrCreateCartId } = require('../utils/helpers.cjs');
const pool = require('../database/pool.cjs');

/**
 * Lista pedidos do usuário autenticado
 * GET /api/orders
 */
async function getAll(req, res) {
  try {
    console.log('📦 GET /api/orders - Listando pedidos');
    
    // Tentar obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    
    if (sessionId) {
      try {
        userId = await ordersService.getUserIdFromSessionOrEmail(sessionId, null);
        if (userId) {
          console.log('✅ User ID encontrado via sessão:', userId);
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
    
    // SEGURANÇA: Se não há userId, NÃO retornar pedidos
    if (!userId) {
      console.log('🚫 Nenhum usuário autenticado - retornando lista vazia');
      return res.json([]);
    }
    
    const orders = await ordersService.findAll(userId);
    
    console.log(`📦 Pedidos carregados: ${orders.length} pedidos para user_id=${userId}`);
    return res.json(orders);
  } catch (error) {
    console.error('❌ Erro ao listar pedidos:', error);
    return res.status(500).json({ error: 'orders_list_failed' });
  }
}

/**
 * Busca pedido por ID com seus itens
 * GET /api/orders/:id
 */
async function getById(req, res) {
  try {
    const { id } = req.params;
    
    const order = await ordersService.findById(id);
    
    if (!order) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    
    // Enriquecer items com dados de products quando faltar name/imagem
    try {
      const missing = order.items.filter(i => !i.image_url || !i.name || i.name === 'Produto');
      const productIds = [...new Set(missing.map(i => i.product_id))];
      if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        let pRows;
        try {
          const [pCols] = await pool.execute('DESCRIBE produtos');
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
          const [rows] = await pool.query(
            `SELECT id, COALESCE(nome, name) AS nome, COALESCE(imagem_url, image_url) AS imagem_url FROM produtos WHERE id IN (${placeholders})`,
            productIds
          );
          pRows = rows;
        }
        const map = new Map((pRows || []).map(r => [String(r.id), r]));
        order.items = order.items.map(i => {
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
    
    return res.json(order);
  } catch (error) {
    console.error('❌ Erro ao buscar pedido:', error);
    return res.status(500).json({ error: 'order_detail_failed' });
  }
}

/**
 * Deleta um pedido
 * DELETE /api/orders/:id
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    console.log(`🔄 Deletando pedido ID: ${id}`);
    
    const deleted = await ordersService.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    
    console.log('✅ Pedido deletado');
    return res.json({ message: 'Pedido deletado com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao deletar pedido:', error);
    return res.status(500).json({ error: 'order_delete_failed' });
  }
}

module.exports = {
  getAll,
  getById,
  remove
};
