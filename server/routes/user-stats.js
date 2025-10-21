// API para estatísticas do usuário - dados reais do banco
const express = require('express');
const { pool } = require('../database/mysql');

const router = express.Router();

// Buscar estatísticas do usuário
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário existe
    const [userResult] = await pool.execute(
      'SELECT id, nome, email, created_at FROM customers WHERE id = ?',
      [userId]
    );
    
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    const user = userResult[0];
    
    // Buscar estatísticas de pedidos
    const [ordersResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN status IN ('pending', 'processing') THEN 1 END) as pedidos_pendentes,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as pedidos_entregues,
        SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as total_gasto,
        AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END) as ticket_medio
      FROM orders 
      WHERE customer_id = ? OR user_id = ?`,
      [userId, userId]
    );
    
    // Buscar itens do carrinho ativo
    const [cartResult] = await pool.execute(
      `SELECT 
        COUNT(*) as itens_carrinho,
        SUM(price * quantity) as valor_carrinho
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.id
      WHERE c.user_id = ? OR c.id IN (
        SELECT cart_id FROM orders WHERE customer_id = ? OR user_id = ? ORDER BY created_at DESC LIMIT 1
      )`,
      [userId, userId, userId]
    );
    
    // Buscar favoritos
    const [favoritesResult] = await pool.execute(
      'SELECT COUNT(*) as total_favoritos FROM customer_favorites WHERE customer_id = ?',
      [userId]
    );
    
    // Calcular nível de fidelidade baseado no total gasto
    const totalGasto = ordersResult[0].total_gasto || 0;
    let nivelUsuario = 'Bronze';
    let pontosFidelidade = Math.floor(totalGasto * 0.1); // 1 ponto por R$ 10 gastos
    
    if (totalGasto >= 1000) {
      nivelUsuario = 'Diamante';
      pontosFidelidade += 100; // bônus diamante
    } else if (totalGasto >= 500) {
      nivelUsuario = 'Ouro';
      pontosFidelidade += 50; // bônus ouro
    } else if (totalGasto >= 200) {
      nivelUsuario = 'Prata';
      pontosFidelidade += 25; // bônus prata
    }
    
    // Próximo nível
    const proximoNivel = nivelUsuario === 'Bronze' ? 200 : 
                        nivelUsuario === 'Prata' ? 500 : 
                        nivelUsuario === 'Ouro' ? 1000 : 0;
    
    const stats = {
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        membro_desde: user.created_at
      },
      pedidos: {
        total: ordersResult[0].total_pedidos,
        pendentes: ordersResult[0].pedidos_pendentes,
        entregues: ordersResult[0].pedidos_entregues,
        total_gasto: totalGasto,
        ticket_medio: ordersResult[0].ticket_medio || 0
      },
      carrinho: {
        itens: cartResult[0].itens_carrinho,
        valor: cartResult[0].valor_carrinho || 0
      },
      favoritos: {
        total: favoritesResult[0].total_favoritos
      },
      fidelidade: {
        nivel: nivelUsuario,
        pontos: pontosFidelidade,
        proximo_nivel: proximoNivel,
        progresso: proximoNivel > 0 ? Math.min((totalGasto / proximoNivel) * 100, 100) : 100
      }
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar pedidos do usuário com detalhes
router.get('/orders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Buscar pedidos do usuário
    const [ordersResult] = await pool.execute(
      `SELECT 
        o.id,
        o.status,
        o.total,
        o.nome,
        o.email,
        o.telefone,
        o.endereco,
        o.metodo_pagamento,
        o.payment_status,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as total_itens
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ? OR o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, userId, parseInt(limit), parseInt(offset)]
    );
    
    // Para cada pedido, buscar os itens
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const [itemsResult] = await pool.execute(
          `SELECT 
            oi.id,
            oi.product_id,
            oi.name,
            oi.price,
            oi.image_url,
            oi.quantity,
            p.nome as produto_nome,
            p.imagem_url as produto_imagem
          FROM order_items oi
          LEFT JOIN produtos p ON oi.product_id = p.id
          WHERE oi.order_id = ?`,
          [order.id]
        );
        
        return {
          ...order,
          itens: itemsResult
        };
      })
    );
    
    // Buscar total de pedidos para paginação
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM orders WHERE customer_id = ? OR user_id = ?',
      [userId, userId]
    );
    
    res.json({
      pedidos: ordersWithItems,
      paginacao: {
        total: totalResult[0].total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        total_paginas: Math.ceil(totalResult[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar carrinho ativo do usuário
router.get('/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar carrinho ativo
    const [cartResult] = await pool.execute(
      `SELECT 
        c.id as cart_id,
        c.created_at,
        c.updated_at
      FROM carts c
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
      LIMIT 1`,
      [userId]
    );
    
    if (cartResult.length === 0) {
      return res.json({
        carrinho: null,
        itens: [],
        total: 0,
        quantidade: 0
      });
    }
    
    const cart = cartResult[0];
    
    // Buscar itens do carrinho
    const [itemsResult] = await pool.execute(
      `SELECT 
        ci.id,
        ci.product_id,
        ci.name,
        ci.price,
        ci.image_url,
        ci.quantity,
        p.nome as produto_nome,
        p.imagem_url as produto_imagem,
        p.estoque,
        p.destaque
      FROM cart_items ci
      LEFT JOIN produtos p ON ci.product_id = p.id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at ASC`,
      [cart.cart_id]
    );
    
    const total = itemsResult.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const quantidade = itemsResult.reduce((sum, item) => sum + item.quantity, 0);
    
    res.json({
      carrinho: cart,
      itens: itemsResult,
      total,
      quantidade
    });
    
  } catch (error) {
    console.error('Erro ao buscar carrinho do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar favoritos do usuário
router.get('/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const [favoritesResult] = await pool.execute(
      `SELECT 
        f.id as favorite_id,
        f.created_at as favoritado_em,
        p.id as product_id,
        p.nome,
        p.descricao,
        p.preco,
        p.imagem_url,
        p.estoque,
        p.destaque,
        p.promocao,
        p.lancamento,
        p.marca,
        p.avaliacao,
        p.total_avaliacoes
      FROM customer_favorites f
      JOIN produtos p ON f.product_id = p.id
      WHERE f.customer_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    // Buscar total para paginação
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM customer_favorites WHERE customer_id = ?',
      [userId]
    );
    
    res.json({
      favoritos: favoritesResult,
      paginacao: {
        total: totalResult[0].total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        total_paginas: Math.ceil(totalResult[0].total / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar favoritos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
