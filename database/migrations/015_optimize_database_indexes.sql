-- =====================================================
-- Migração: Otimização de Performance - Índices
-- Data: 11/01/2025
-- Descrição: Adiciona índices estratégicos para melhorar performance de queries frequentes
-- =====================================================

-- ==================== PRODUTOS ====================

-- Índice para busca por status (queries frequentes)
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);

-- Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_produtos_created_at ON produtos(created_at);

-- Índice para busca por preço (range queries)
CREATE INDEX IF NOT EXISTS idx_produtos_preco ON produtos(preco);

-- Índice composto para produtos ativos por categoria
CREATE INDEX IF NOT EXISTS idx_produtos_status_categoria ON produtos(status, categoria_id);

-- Índice composto para busca e ordenação
CREATE INDEX IF NOT EXISTS idx_produtos_status_created ON produtos(status, created_at DESC);

-- Fulltext index para busca de texto (se suportado)
-- CREATE FULLTEXT INDEX IF NOT EXISTS idx_produtos_search ON produtos(nome, descricao);

-- ==================== PEDIDOS ====================

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Índice composto para pedidos por cliente e status
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);

-- Índice composto para pedidos por data e status (dashboard)
CREATE INDEX IF NOT EXISTS idx_orders_date_status ON orders(DATE(created_at), status);

-- Índice para busca por método de pagamento
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(metodo_pagamento);

-- Índice para busca por status de pagamento
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ==================== ITENS DE PEDIDO ====================

-- Índice para busca por pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Índice composto para estatísticas de produtos
CREATE INDEX IF NOT EXISTS idx_order_items_product_created ON order_items(product_id, created_at);

-- ==================== CARRINHO ====================

-- Índice para busca por carrinho
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- Índice para busca por produto no carrinho
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Índice composto para busca rápida de item no carrinho
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_product ON cart_items(cart_id, product_id);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

-- ==================== CLIENTES ====================

-- Índice único para email (já deve existir, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Índice para busca por data de criação
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- ==================== ENDEREÇOS ====================

-- Índice para busca por cliente
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);

-- Índice para busca de endereço padrão
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default);

-- ==================== CUPONS ====================

-- Índice para busca por código
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);

-- Índice para busca por data de expiração
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at);

-- Índice composto para cupons ativos
CREATE INDEX IF NOT EXISTS idx_coupons_status_expires ON coupons(status, expires_at);

-- ==================== ADMIN USERS ====================

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON admin_users(status);

-- Índice para busca por role
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ==================== SESSÕES ====================

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_sessions_user_email ON sessions(user_email);

-- Índice para limpeza de sessões expiradas
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen ON sessions(last_seen);

-- ==================== REVIEWS ====================

-- Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);

-- Índice composto para reviews aprovadas de um produto
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status ON product_reviews(product_id, status);

-- ==================== ANALYTICS E DASHBOARD ====================

-- Índice composto para métricas de vendas por data
CREATE INDEX IF NOT EXISTS idx_orders_date_total ON orders(DATE(created_at), total);

-- Índice para estatísticas de clientes
CREATE INDEX IF NOT EXISTS idx_orders_customer_total ON orders(customer_id, total);

-- ==================== OTIMIZAÇÕES ADICIONAIS ====================

-- Analisar tabelas para otimizar estatísticas
ANALYZE TABLE produtos;
ANALYZE TABLE orders;
ANALYZE TABLE order_items;
ANALYZE TABLE cart_items;
ANALYZE TABLE customers;
ANALYZE TABLE customer_addresses;
ANALYZE TABLE coupons;
ANALYZE TABLE admin_users;
ANALYZE TABLE sessions;
ANALYZE TABLE product_reviews;

-- Comentários finais
SELECT '✅ Índices de performance criados com sucesso!' as status;

