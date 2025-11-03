-- ==================== TABELA DE LOGS DE SINCRONIZAÇÃO ====================

-- Criar tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS sync_logs (
  id VARCHAR(191) PRIMARY KEY,
  tipo ENUM('cliente', 'pedido', 'sistema') NOT NULL,
  acao ENUM('criado', 'atualizado', 'sincronizado', 'erro', 'associado', 'desassociado', 'iniciado', 'finalizado') NOT NULL,
  entidade_id VARCHAR(191) NOT NULL,
  entidade_nome VARCHAR(255) NOT NULL,
  detalhes TEXT,
  status ENUM('sucesso', 'erro', 'pendente') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duracao_ms INT DEFAULT NULL,
  erro TEXT DEFAULT NULL,
  INDEX idx_tipo (tipo),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),
  INDEX idx_entidade (entidade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar colunas de sincronização na tabela users (se não existirem)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sync_status ENUM('sincronizado', 'pendente', 'erro', 'nunca_sincronizado') DEFAULT 'nunca_sincronizado',
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS sync_errors TEXT NULL,
ADD COLUMN IF NOT EXISTS total_pedidos INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gasto DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ultimo_pedido TIMESTAMP NULL;

-- Adicionar colunas de sincronização na tabela orders (se não existirem)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS sync_status ENUM('sincronizado', 'pendente', 'erro', 'nunca_sincronizado') DEFAULT 'nunca_sincronizado',
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS sync_errors TEXT NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_sync_status ON users(sync_status);
CREATE INDEX IF NOT EXISTS idx_users_last_sync ON users(last_sync);
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_last_sync ON orders(last_sync);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Inserir log inicial
INSERT INTO sync_logs (id, tipo, acao, entidade_id, entidade_nome, detalhes, status, timestamp)
VALUES (
  UUID(),
  'sistema',
  'criado',
  'system',
  'Sistema',
  'Tabela de logs de sincronização criada',
  'sucesso',
  NOW()
);





