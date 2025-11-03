-- Script para inserir cupons de exemplo
-- Execute: mysql -u root -p rare_toy_companion < insert_sample_coupons.sql

USE rare_toy_companion;

-- Limpar cupons existentes (apenas para teste)
-- DELETE FROM user_coupons;
-- DELETE FROM coupon_usage;
-- DELETE FROM coupons;

-- Cupom 1: Boas-vindas (10% de desconto)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, max_discount_amount, usage_limit, 
  usage_limit_per_user, is_active, is_public, category,
  expires_at
) VALUES (
  UUID(), 
  'BEMVINDO10', 
  'Desconto de Boas-vindas', 
  '10% de desconto na sua primeira compra!', 
  'percentage', 
  10.00,
  50.00,
  50.00,
  1000,
  1,
  TRUE,
  TRUE,
  'first_purchase',
  DATE_ADD(NOW(), INTERVAL 60 DAY)
);

-- Cupom 2: Aniversário (R$ 25 off)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, usage_limit_per_user, is_active, 
  is_public, category, expires_at
) VALUES (
  UUID(), 
  'ANIVERSARIO25', 
  'Cupom de Aniversário', 
  'R$ 25 de desconto no seu aniversário! 🎂', 
  'fixed_amount', 
  25.00,
  100.00,
  1,
  TRUE,
  FALSE,
  'birthday',
  DATE_ADD(NOW(), INTERVAL 30 DAY)
);

-- Cupom 3: Frete Grátis
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, usage_limit, usage_limit_per_user, 
  is_active, is_public, category, expires_at
) VALUES (
  UUID(), 
  'FRETEGRATIS', 
  'Frete Grátis', 
  'Frete grátis em compras acima de R$ 80! 🚚', 
  'free_shipping', 
  0.00,
  80.00,
  500,
  1,
  TRUE,
  TRUE,
  'promotion',
  DATE_ADD(NOW(), INTERVAL 45 DAY)
);

-- Cupom 4: Black Friday (20% off)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, max_discount_amount, usage_limit, 
  usage_limit_per_user, is_active, is_public, category,
  expires_at
) VALUES (
  UUID(), 
  'BLACKFRIDAY20', 
  'Black Friday', 
  '20% de desconto em tudo! 🔥', 
  'percentage', 
  20.00,
  100.00,
  100.00,
  2000,
  2,
  TRUE,
  TRUE,
  'promotion',
  DATE_ADD(NOW(), INTERVAL 7 DAY)
);

-- Cupom 5: Fidelidade Ouro (15% off)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, usage_limit_per_user, is_active, 
  is_public, category, expires_at
) VALUES (
  UUID(), 
  'OURO15', 
  'Desconto Fidelidade Ouro', 
  'Desconto exclusivo para clientes Ouro! 👑', 
  'percentage', 
  15.00,
  0.00,
  3,
  TRUE,
  FALSE,
  'loyalty',
  DATE_ADD(NOW(), INTERVAL 90 DAY)
);

-- Cupom 6: Natal 2025 (R$ 50 off)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, usage_limit, usage_limit_per_user, 
  is_active, is_public, category, expires_at
) VALUES (
  UUID(), 
  'NATAL50', 
  'Natal 2025', 
  'R$ 50 de desconto nas compras de Natal! 🎄', 
  'fixed_amount', 
  50.00,
  200.00,
  1000,
  1,
  TRUE,
  TRUE,
  'promotion',
  '2025-12-31 23:59:59'
);

-- Cupom 7: Primeira Compra Premium (30% off)
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, max_discount_amount, usage_limit_per_user, 
  is_active, is_public, category, expires_at
) VALUES (
  UUID(), 
  'PREMIUM30', 
  'Primeira Compra Premium', 
  '30% de desconto na sua primeira compra premium! ⭐', 
  'percentage', 
  30.00,
  300.00,
  150.00,
  1,
  TRUE,
  FALSE,
  'first_purchase',
  DATE_ADD(NOW(), INTERVAL 15 DAY)
);

-- Cupom 8: Frete Grátis VIP
INSERT INTO coupons (
  id, code, name, description, type, value, 
  min_order_amount, usage_limit_per_user, is_active, 
  is_public, category, expires_at
) VALUES (
  UUID(), 
  'FRETEVIP', 
  'Frete Grátis VIP', 
  'Frete grátis sem valor mínimo! 🎁', 
  'free_shipping', 
  0.00,
  0.00,
  5,
  TRUE,
  FALSE,
  'loyalty',
  DATE_ADD(NOW(), INTERVAL 30 DAY)
);

SELECT '✅ Cupons de exemplo criados com sucesso!' as status;
SELECT COUNT(*) as total_cupons FROM coupons;

