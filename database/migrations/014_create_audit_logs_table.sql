-- =====================================================
-- Migração: Sistema de Auditoria
-- Data: 11/01/2025
-- Descrição: Cria tabela para logs de auditoria de ações administrativas
-- =====================================================

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL COMMENT 'ID do usuário admin que executou a ação',
  user_email VARCHAR(255) NULL COMMENT 'Email do usuário (backup)',
  action VARCHAR(100) NOT NULL COMMENT 'Tipo de ação (create, update, delete, login, etc)',
  resource_type VARCHAR(100) NOT NULL COMMENT 'Tipo de recurso (product, order, user, etc)',
  resource_id VARCHAR(255) NULL COMMENT 'ID do recurso afetado',
  ip_address VARCHAR(45) NULL COMMENT 'Endereço IP do usuário',
  user_agent TEXT NULL COMMENT 'User agent do navegador',
  request_method VARCHAR(10) NULL COMMENT 'Método HTTP (GET, POST, PUT, DELETE)',
  request_path VARCHAR(500) NULL COMMENT 'Caminho da requisição',
  request_body JSON NULL COMMENT 'Corpo da requisição (sanitizado)',
  response_status INT NULL COMMENT 'Status HTTP da resposta',
  response_body JSON NULL COMMENT 'Corpo da resposta (sanitizado)',
  metadata JSON NULL COMMENT 'Metadados adicionais',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da ação',
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at),
  INDEX idx_ip_address (ip_address),
  
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Logs de auditoria para ações administrativas';

-- Criar índice composto para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_user_action_date ON audit_logs(user_id, action, created_at);
CREATE INDEX IF NOT EXISTS idx_resource_action_date ON audit_logs(resource_type, action, created_at);

-- Comentários nas colunas principais
ALTER TABLE audit_logs 
MODIFY COLUMN action VARCHAR(100) NOT NULL COMMENT 'Tipo de ação: create, update, delete, login, logout, export, import, etc',
MODIFY COLUMN resource_type VARCHAR(100) NOT NULL COMMENT 'Tipo de recurso: product, order, user, customer, coupon, etc',
MODIFY COLUMN ip_address VARCHAR(45) NULL COMMENT 'Endereço IP (suporta IPv4 e IPv6)';

