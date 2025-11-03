-- Script para inserir cupons de exemplo (adaptado para estrutura existente)
USE rare_toy_companion;

-- Cupom 1: Boas-vindas (10% de desconto)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'BEMVINDO10', 
  'Desconto de Boas-vindas', 
  '10% de desconto na sua primeira compra!', 
  'percentage', 
  10.00,
  50.00,
  1000,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 60 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 2: Aniversário (R$ 25 off)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'ANIVERSARIO25', 
  'Cupom de Aniversário', 
  'R$ 25 de desconto no seu aniversário! 🎂', 
  'fixed', 
  25.00,
  100.00,
  100,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 30 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 3: Frete Grátis
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'FRETEGRATIS', 
  'Frete Grátis', 
  'Frete grátis em compras acima de R$ 80! 🚚', 
  'freeShipping', 
  0.00,
  80.00,
  500,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 45 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 4: Black Friday (20% off)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'BLACKFRIDAY20', 
  'Black Friday', 
  '20% de desconto em tudo! 🔥', 
  'percentage', 
  20.00,
  100.00,
  2000,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 7 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 5: Fidelidade Ouro (15% off)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'OURO15', 
  'Desconto Fidelidade Ouro', 
  'Desconto exclusivo para clientes Ouro! 👑', 
  'percentage', 
  15.00,
  0.00,
  NULL,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 90 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 6: Natal 2025 (R$ 50 off)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'NATAL50', 
  'Natal 2025', 
  'R$ 50 de desconto nas compras de Natal! 🎄', 
  'fixed', 
  50.00,
  200.00,
  1000,
  TRUE,
  '2025-12-31 23:59:59'
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 7: Primeira Compra Premium (30% off)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'PREMIUM30', 
  'Primeira Compra Premium', 
  '30% de desconto na sua primeira compra premium! ⭐', 
  'percentage', 
  30.00,
  300.00,
  100,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 15 DAY)
) ON DUPLICATE KEY UPDATE code=code;

-- Cupom 8: Expirando em breve (para testar alerta)
INSERT INTO coupons (
  id, code, title, description, type, value, 
  min_value, max_uses, active, expires_at
) VALUES (
  UUID(), 
  'URGENTE5', 
  'Desconto Urgente', 
  'Desconto de 5% que expira em 3 dias! ⚠️', 
  'percentage', 
  5.00,
  0.00,
  500,
  TRUE,
  DATE_ADD(NOW(), INTERVAL 3 DAY)
) ON DUPLICATE KEY UPDATE code=code;

SELECT '✅ Cupons de exemplo criados com sucesso!' as status;
SELECT COUNT(*) as total_cupons FROM coupons WHERE active = TRUE;

