-- Migração para adicionar colunas avançadas na tabela de pedidos
-- Data: 21 de Outubro de 2025
-- Descrição: Adiciona colunas para sistema avançado de gerenciamento de pedidos

-- Adicionar coluna de prioridade
ALTER TABLE orders ADD COLUMN priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' AFTER status;

-- Adicionar coluna de tags
ALTER TABLE orders ADD COLUMN tags TEXT AFTER priority;

-- Adicionar coluna de código de rastreamento
ALTER TABLE orders ADD COLUMN tracking_code VARCHAR(100) AFTER tags;

-- Adicionar coluna de entrega estimada
ALTER TABLE orders ADD COLUMN estimated_delivery DATETIME AFTER tracking_code;

-- Adicionar coluna de endereço de entrega
ALTER TABLE orders ADD COLUMN shipping_address JSON AFTER estimated_delivery;

-- Adicionar coluna de endereço de cobrança
ALTER TABLE orders ADD COLUMN billing_address JSON AFTER shipping_address;

-- Adicionar coluna de notas internas
ALTER TABLE orders ADD COLUMN notes TEXT AFTER billing_address;

-- Adicionar coluna de método de pagamento
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) AFTER notes;

-- Adicionar coluna de status do pagamento
ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER payment_method;

-- Adicionar coluna de valor do frete
ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0.00 AFTER payment_status;

-- Adicionar coluna de desconto
ALTER TABLE orders ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00 AFTER shipping_cost;

-- Adicionar coluna de valor total com frete
ALTER TABLE orders ADD COLUMN total_with_shipping DECIMAL(10,2) AFTER discount;

-- Adicionar coluna de observações do cliente
ALTER TABLE orders ADD COLUMN customer_notes TEXT AFTER total_with_shipping;

-- Adicionar coluna de origem do pedido
ALTER TABLE orders ADD COLUMN order_source ENUM('website', 'mobile', 'admin', 'api') DEFAULT 'website' AFTER customer_notes;

-- Adicionar coluna de canal de venda
ALTER TABLE orders ADD COLUMN sales_channel VARCHAR(50) DEFAULT 'direct' AFTER order_source;

-- Adicionar coluna de cupom utilizado
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) AFTER sales_channel;

-- Adicionar coluna de valor do cupom
ALTER TABLE orders ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0.00 AFTER coupon_code;

-- Adicionar coluna de IP do cliente
ALTER TABLE orders ADD COLUMN customer_ip VARCHAR(45) AFTER coupon_discount;

-- Adicionar coluna de user agent
ALTER TABLE orders ADD COLUMN user_agent TEXT AFTER customer_ip;

-- Adicionar coluna de referrer
ALTER TABLE orders ADD COLUMN referrer VARCHAR(500) AFTER user_agent;

-- Adicionar coluna de campanha
ALTER TABLE orders ADD COLUMN campaign VARCHAR(100) AFTER referrer;

-- Adicionar coluna de utm_source
ALTER TABLE orders ADD COLUMN utm_source VARCHAR(100) AFTER campaign;

-- Adicionar coluna de utm_medium
ALTER TABLE orders ADD COLUMN utm_medium VARCHAR(100) AFTER utm_source;

-- Adicionar coluna de utm_campaign
ALTER TABLE orders ADD COLUMN utm_campaign VARCHAR(100) AFTER utm_medium;

-- Adicionar coluna de data de processamento
ALTER TABLE orders ADD COLUMN processed_at DATETIME AFTER utm_campaign;

-- Adicionar coluna de data de envio
ALTER TABLE orders ADD COLUMN shipped_at DATETIME AFTER processed_at;

-- Adicionar coluna de data de entrega
ALTER TABLE orders ADD COLUMN delivered_at DATETIME AFTER shipped_at;

-- Adicionar coluna de data de cancelamento
ALTER TABLE orders ADD COLUMN cancelled_at DATETIME AFTER delivered_at;

-- Adicionar coluna de motivo do cancelamento
ALTER TABLE orders ADD COLUMN cancellation_reason TEXT AFTER cancelled_at;

-- Adicionar coluna de data de reembolso
ALTER TABLE orders ADD COLUMN refunded_at DATETIME AFTER cancellation_reason;

-- Adicionar coluna de valor reembolsado
ALTER TABLE orders ADD COLUMN refunded_amount DECIMAL(10,2) DEFAULT 0.00 AFTER refunded_at;

-- Adicionar coluna de motivo do reembolso
ALTER TABLE orders ADD COLUMN refund_reason TEXT AFTER refunded_amount;

-- Adicionar coluna de avaliação do pedido
ALTER TABLE orders ADD COLUMN rating TINYINT(1) AFTER refund_reason;

-- Adicionar coluna de comentário da avaliação
ALTER TABLE orders ADD COLUMN rating_comment TEXT AFTER rating;

-- Adicionar coluna de flag de follow-up
ALTER TABLE orders ADD COLUMN follow_up_required TINYINT(1) DEFAULT 0 AFTER rating_comment;

-- Adicionar coluna de data do follow-up
ALTER TABLE orders ADD COLUMN follow_up_date DATETIME AFTER follow_up_required;

-- Adicionar coluna de notas do follow-up
ALTER TABLE orders ADD COLUMN follow_up_notes TEXT AFTER follow_up_date;

-- Adicionar coluna de flag de arquivamento
ALTER TABLE orders ADD COLUMN archived TINYINT(1) DEFAULT 0 AFTER follow_up_notes;

-- Adicionar coluna de data de arquivamento
ALTER TABLE orders ADD COLUMN archived_at DATETIME AFTER archived;

-- Adicionar coluna de usuário que arquivou
ALTER TABLE orders ADD COLUMN archived_by VARCHAR(191) AFTER archived_at;

-- Adicionar coluna de versão do pedido
ALTER TABLE orders ADD COLUMN version INT DEFAULT 1 AFTER archived_by;

-- Adicionar coluna de hash para integridade
ALTER TABLE orders ADD COLUMN integrity_hash VARCHAR(64) AFTER version;

-- Criar índices para melhor performance
CREATE INDEX idx_orders_priority ON orders(priority);
CREATE INDEX idx_orders_tracking_code ON orders(tracking_code);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_source ON orders(order_source);
CREATE INDEX idx_orders_sales_channel ON orders(sales_channel);
CREATE INDEX idx_orders_coupon_code ON orders(coupon_code);
CREATE INDEX idx_orders_customer_ip ON orders(customer_ip);
CREATE INDEX idx_orders_campaign ON orders(campaign);
CREATE INDEX idx_orders_utm_source ON orders(utm_source);
CREATE INDEX idx_orders_utm_medium ON orders(utm_medium);
CREATE INDEX idx_orders_utm_campaign ON orders(utm_campaign);
CREATE INDEX idx_orders_processed_at ON orders(processed_at);
CREATE INDEX idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX idx_orders_cancelled_at ON orders(cancelled_at);
CREATE INDEX idx_orders_refunded_at ON orders(refunded_at);
CREATE INDEX idx_orders_rating ON orders(rating);
CREATE INDEX idx_orders_follow_up_required ON orders(follow_up_required);
CREATE INDEX idx_orders_archived ON orders(archived);
CREATE INDEX idx_orders_version ON orders(version);

-- Criar trigger para atualizar total_with_shipping automaticamente
DELIMITER $$
CREATE TRIGGER update_total_with_shipping
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    SET NEW.total_with_shipping = NEW.total + COALESCE(NEW.shipping_cost, 0) - COALESCE(NEW.discount, 0) - COALESCE(NEW.coupon_discount, 0);
END$$
DELIMITER ;

-- Criar trigger para atualizar integrity_hash
DELIMITER $$
CREATE TRIGGER update_integrity_hash
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    SET NEW.integrity_hash = SHA2(CONCAT(NEW.id, NEW.customer_id, NEW.status, NEW.total, NEW.created_at), 256);
END$$
DELIMITER ;

-- Atualizar total_with_shipping para pedidos existentes
UPDATE orders 
SET total_with_shipping = total + COALESCE(shipping_cost, 0) - COALESCE(discount, 0) - COALESCE(coupon_discount, 0)
WHERE total_with_shipping IS NULL;

-- Atualizar integrity_hash para pedidos existentes
UPDATE orders 
SET integrity_hash = SHA2(CONCAT(id, COALESCE(customer_id, ''), status, total, created_at), 256)
WHERE integrity_hash IS NULL;

-- Comentários sobre as novas colunas
-- priority: Prioridade do pedido (low, medium, high, urgent)
-- tags: Tags para categorização e filtros
-- tracking_code: Código de rastreamento da transportadora
-- estimated_delivery: Data estimada de entrega
-- shipping_address: Endereço de entrega em formato JSON
-- billing_address: Endereço de cobrança em formato JSON
-- notes: Notas internas do administrador
-- payment_method: Método de pagamento utilizado
-- payment_status: Status do pagamento
-- shipping_cost: Custo do frete
-- discount: Desconto aplicado
-- total_with_shipping: Total final com frete e descontos
-- customer_notes: Observações do cliente
-- order_source: Origem do pedido (website, mobile, admin, api)
-- sales_channel: Canal de venda (direct, affiliate, etc.)
-- coupon_code: Código do cupom utilizado
-- coupon_discount: Valor do desconto do cupom
-- customer_ip: IP do cliente
-- user_agent: User agent do navegador
-- referrer: Site de referência
-- campaign: Campanha de marketing
-- utm_source: Fonte UTM
-- utm_medium: Meio UTM
-- utm_campaign: Campanha UTM
-- processed_at: Data de processamento
-- shipped_at: Data de envio
-- delivered_at: Data de entrega
-- cancelled_at: Data de cancelamento
-- cancellation_reason: Motivo do cancelamento
-- refunded_at: Data de reembolso
-- refunded_amount: Valor reembolsado
-- refund_reason: Motivo do reembolso
-- rating: Avaliação do pedido (1-5)
-- rating_comment: Comentário da avaliação
-- follow_up_required: Flag para follow-up necessário
-- follow_up_date: Data do follow-up
-- follow_up_notes: Notas do follow-up
-- archived: Flag de arquivamento
-- archived_at: Data de arquivamento
-- archived_by: Usuário que arquivou
-- version: Versão do pedido para controle de concorrência
-- integrity_hash: Hash para verificação de integridade
