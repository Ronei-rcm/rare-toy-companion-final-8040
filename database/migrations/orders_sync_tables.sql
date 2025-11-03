-- Migração para sistema unificado de pedidos
-- Criar tabelas necessárias para sincronização admin ↔ cliente

-- Tabela de histórico de status dos pedidos
CREATE TABLE IF NOT EXISTS order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Tabela de comentários dos pedidos
CREATE TABLE IF NOT EXISTS order_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_internal (is_internal)
);

-- Tabela de notificações de pedidos
CREATE TABLE IF NOT EXISTS order_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_id (order_id),
  INDEX idx_customer_email (customer_email),
  INDEX idx_notification_type (notification_type),
  INDEX idx_is_read (is_read)
);

-- Tabela de métricas de pedidos (cache para performance)
CREATE TABLE IF NOT EXISTS order_metrics_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_period VARCHAR(20) NOT NULL,
  metric_value DECIMAL(15,2),
  metric_data JSON,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE KEY unique_metric (metric_type, metric_period),
  INDEX idx_metric_type (metric_type),
  INDEX idx_expires_at (expires_at)
);

-- Adicionar campos à tabela orders se não existirem
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);

-- Inserir dados iniciais de histórico para pedidos existentes
INSERT IGNORE INTO order_status_history (order_id, status, notes, created_at)
SELECT 
  id,
  COALESCE(status, 'pending'),
  'Status inicial migrado',
  COALESCE(created_at, NOW())
FROM orders 
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_status_history);

-- Criar view para pedidos com dados completos
CREATE OR REPLACE VIEW orders_complete AS
SELECT 
  o.id,
  o.user_id,
  o.customer_id,
  o.cart_id,
  o.status,
  o.total,
  o.nome as customer_name,
  o.email as customer_email,
  o.telefone as customer_phone,
  o.endereco as shipping_address,
  o.metodo_pagamento as payment_method,
  o.payment_status,
  o.tracking_code,
  o.estimated_delivery,
  o.notes,
  o.priority,
  o.assigned_to,
  o.created_at,
  o.updated_at,
  o.last_activity,
  c.nome as customer_nome,
  c.email as customer_email_real,
  c.telefone as customer_telefone_real,
  c.total_pedidos as customer_total_orders,
  c.total_gasto as customer_total_spent,
  c.ultimo_pedido as customer_last_order,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Cliente Sincronizado'
    WHEN o.user_id IS NOT NULL THEN 'Cliente Registrado'
    ELSE 'Cliente Anônimo'
  END as customer_type,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count,
  (SELECT COUNT(*) FROM order_status_history osh WHERE osh.order_id = o.id) as status_changes_count,
  (SELECT COUNT(*) FROM order_comments oc WHERE oc.order_id = o.id AND oc.is_internal = FALSE) as public_comments_count,
  (SELECT COUNT(*) FROM order_comments oc WHERE oc.order_id = o.id AND oc.is_internal = TRUE) as internal_comments_count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id;

-- Criar view para estatísticas em tempo real
CREATE OR REPLACE VIEW orders_stats_realtime AS
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
  COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as total_revenue,
  AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END) as average_ticket,
  COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
  SUM(CASE WHEN DATE(created_at) = CURDATE() AND status = 'delivered' THEN total ELSE 0 END) as today_revenue,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(CASE WHEN DATE(created_at) = CURDATE() AND customer_id IS NOT NULL THEN 1 END) as new_customers_today,
  AVG(TIMESTAMPDIFF(HOUR, created_at, 
    CASE WHEN status = 'delivered' THEN updated_at ELSE NULL END)) as avg_delivery_time_hours,
  COUNT(CASE WHEN priority = 'urgent' AND status IN ('pending', 'processing') THEN 1 END) as urgent_orders,
  COUNT(CASE WHEN assigned_to IS NOT NULL AND status IN ('pending', 'processing') THEN 1 END) as assigned_orders,
  NOW() as last_updated
FROM orders;

