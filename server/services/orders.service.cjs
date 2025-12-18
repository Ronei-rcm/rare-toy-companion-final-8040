/**
 * Orders Service
 * 
 * Service layer para pedidos - contém lógica de negócio e acesso ao banco
 * Foco em operações CRUD básicas (criar, listar, buscar, deletar)
 */

const pool = require('../database/pool.cjs');
const crypto = require('crypto');

/**
 * Lista pedidos do usuário autenticado
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} Lista de pedidos formatados
 */
async function findAll(userId) {
  try {
    if (!userId) {
      return [];
    }

    const [orders] = await pool.execute(
      `SELECT o.*, (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
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

    return normalized;
  } catch (error) {
    console.error('Erro no service findAll (orders):', error);
    throw error;
  }
}

/**
 * Busca um pedido por ID com seus itens
 * 
 * @param {string} id - ID do pedido
 * @returns {Promise<Object|null>} Pedido encontrado ou null
 */
async function findById(id) {
  try {
    // Buscar pedido
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (!Array.isArray(orders) || orders.length === 0) {
      return null;
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

    // Normalização básica de tipos
    let normalizedItems = (items || []).map((it) => ({
      order_id: it.order_id,
      product_id: it.product_id,
      name: it.name || 'Produto',
      price: Number(it.price || 0),
      image_url: it.image_url || null,
      quantity: Number(it.quantity || 1),
    }));

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

    return {
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
    };
  } catch (error) {
    console.error('Erro no service findById (orders):', error);
    throw error;
  }
}

/**
 * Deleta um pedido
 * 
 * @param {string} id - ID do pedido
 * @returns {Promise<boolean>} true se deletado, false se não encontrado
 */
async function remove(id) {
  try {
    // Deletar itens do pedido primeiro
    await pool.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    
    // Deletar pedido
    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Erro no service remove (orders):', error);
    throw error;
  }
}

/**
 * Busca itens do carrinho para criar pedido
 * 
 * @param {string} cartId - ID do carrinho
 * @returns {Promise<Array>} Itens válidos do carrinho
 */
async function getValidCartItems(cartId) {
  try {
    const [rows] = await pool.execute('SELECT * FROM cart_items WHERE cart_id = ?', [cartId]);
    
    if (!rows.length) {
      return [];
    }

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
        }
      } catch (e) {
        invalidItems.push(item.id);
      }
    }

    // Remover itens inválidos do carrinho
    if (invalidItems.length > 0) {
      await pool.execute(`DELETE FROM cart_items WHERE id IN (${invalidItems.map(() => '?').join(',')})`, invalidItems);
    }

    return validItems;
  } catch (error) {
    console.error('Erro no service getValidCartItems:', error);
    throw error;
  }
}

/**
 * Obtém userId da sessão ou email
 * 
 * @param {Object} pool - Pool de conexão
 * @param {string} sessionId - ID da sessão
 * @param {string} email - Email do cliente
 * @returns {Promise<string|null>} userId ou null
 */
async function getUserIdFromSessionOrEmail(sessionId, email) {
  try {
    // Tentar obter da sessão primeiro
    if (sessionId) {
      const [sessions] = await pool.execute('SELECT user_email FROM sessions WHERE id = ?', [sessionId]);
      if (sessions && sessions[0]) {
        const userEmail = sessions[0].user_email;
        const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
        if (customers && customers[0]) {
          return customers[0].id;
        }
      }
    }

    // Se não encontrou na sessão, tentar pelo email
    if (email) {
      const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [email]);
      if (customers && customers[0]) {
        return customers[0].id;
      }
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar userId:', error);
    return null;
  }
}

module.exports = {
  findAll,
  findById,
  remove,
  getValidCartItems,
  getUserIdFromSessionOrEmail
};
