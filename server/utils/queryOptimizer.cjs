/**
 * Utilitários para Otimização de Queries
 * Funções auxiliares para evitar queries N+1 e melhorar performance
 */

/**
 * Buscar produtos com categoria em uma única query
 * @param {object} pool - Pool de conexões MySQL
 * @param {object} filters - Filtros de busca
 * @returns {Promise<Array>} Array de produtos com categoria
 */
async function getProductsWithCategory(pool, filters = {}) {
  const {
    status = 'ativo',
    categoriaId = null,
    limit = 20,
    offset = 0,
    orderBy = 'created_at',
    order = 'DESC'
  } = filters;
  
  let query = `
    SELECT 
      p.*,
      c.nome as categoria_nome,
      c.slug as categoria_slug
    FROM produtos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.status = ?
  `;
  
  const params = [status];
  
  if (categoriaId) {
    query += ' AND p.categoria_id = ?';
    params.push(categoriaId);
  }
  
  query += ` ORDER BY p.${orderBy} ${order} LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [products] = await pool.execute(query, params);
  return products;
}

/**
 * Buscar pedidos com itens e cliente em uma única query
 * @param {object} pool - Pool de conexões MySQL
 * @param {object} filters - Filtros de busca
 * @returns {Promise<Array>} Array de pedidos com dados completos
 */
async function getOrdersWithDetails(pool, filters = {}) {
  const {
    customerId = null,
    userId = null,
    status = null,
    limit = 50,
    offset = 0
  } = filters;
  
  let query = `
    SELECT 
      o.*,
      c.nome as customer_nome,
      c.email as customer_email,
      c.telefone as customer_telefone
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (customerId) {
    query += ' AND o.customer_id = ?';
    params.push(customerId);
  }
  
  if (userId) {
    query += ' AND o.user_id = ?';
    params.push(userId);
  }
  
  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  
  const [orders] = await pool.execute(query, params);
  
  // Buscar itens de cada pedido em batch (evita N+1)
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => '?').join(',');
    
    const [items] = await pool.execute(
      `SELECT 
        oi.*,
        p.nome as product_nome,
        p.imagem_url as product_image
      FROM order_items oi
      LEFT JOIN produtos p ON oi.product_id = p.id
      WHERE oi.order_id IN (${placeholders})
      ORDER BY oi.created_at ASC`,
      orderIds
    );
    
    // Agrupar itens por pedido
    const itemsByOrder = {};
    items.forEach(item => {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }
      itemsByOrder[item.order_id].push(item);
    });
    
    // Adicionar itens aos pedidos
    orders.forEach(order => {
      order.items = itemsByOrder[order.id] || [];
    });
  }
  
  return orders;
}

/**
 * Buscar estatísticas de pedidos de forma otimizada
 * @param {object} pool - Pool de conexões MySQL
 * @param {number} customerId - ID do cliente
 * @returns {Promise<object>} Estatísticas do cliente
 */
async function getCustomerOrderStats(pool, customerId) {
  const [stats] = await pool.execute(
    `SELECT 
      COUNT(*) as total_pedidos,
      COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pedidos_pendentes,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) as pedidos_entregues,
      SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as total_gasto,
      AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END) as ticket_medio,
      MAX(created_at) as ultimo_pedido
    FROM orders 
    WHERE customer_id = ? OR user_id = ?`,
    [customerId, customerId]
  );
  
  return stats[0];
}

/**
 * Buscar carrinho com itens e produtos em uma única query
 * @param {object} pool - Pool de conexões MySQL
 * @param {string} cartId - ID do carrinho
 * @returns {Promise<object>} Carrinho com itens e produtos
 */
async function getCartWithItems(pool, cartId) {
  const [cartItems] = await pool.execute(
    `SELECT 
      ci.*,
      p.nome as product_nome,
      p.preco as product_preco,
      p.imagem_url as product_image,
      p.estoque as product_stock,
      p.status as product_status
    FROM cart_items ci
    LEFT JOIN produtos p ON ci.product_id = p.id
    WHERE ci.cart_id = ?
    ORDER BY ci.created_at ASC`,
    [cartId]
  );
  
  return cartItems;
}

/**
 * Buscar múltiplos clientes por IDs de forma otimizada
 * @param {object} pool - Pool de conexões MySQL
 * @param {Array<number>} customerIds - Array de IDs
 * @returns {Promise<Array>} Array de clientes
 */
async function getCustomersByIds(pool, customerIds) {
  if (!customerIds || customerIds.length === 0) {
    return [];
  }
  
  const placeholders = customerIds.map(() => '?').join(',');
  const [customers] = await pool.execute(
    `SELECT * FROM customers WHERE id IN (${placeholders})`,
    customerIds
  );
  
  return customers;
}

/**
 * Buscar produtos por IDs de forma otimizada
 * @param {object} pool - Pool de conexões MySQL
 * @param {Array<number>} productIds - Array de IDs
 * @returns {Promise<Array>} Array de produtos
 */
async function getProductsByIds(pool, productIds) {
  if (!productIds || productIds.length === 0) {
    return [];
  }
  
  const placeholders = productIds.map(() => '?').join(',');
  const [products] = await pool.execute(
    `SELECT * FROM produtos WHERE id IN (${placeholders}) AND status = 'ativo'`,
    productIds
  );
  
  return products;
}

module.exports = {
  getProductsWithCategory,
  getOrdersWithDetails,
  getCustomerOrderStats,
  getCartWithItems,
  getCustomersByIds,
  getProductsByIds
};

