-- ============================================================================
-- Migração: Adicionar Campo Hora na Tabela Financial Transactions
-- Data: Janeiro 2025
-- Descrição: Adiciona coluna 'hora' para armazenar hora das transações do CSV
-- ============================================================================

-- Verificar se a coluna já existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'financial_transactions' 
  AND COLUMN_NAME = 'hora';

-- Adicionar coluna hora (executar apenas se não existir)
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS hora TIME NULL 
COMMENT 'Hora da transação (formato HH:MM:SS)'
AFTER data;

-- Criar índice para melhorar performance em consultas por data e hora
CREATE INDEX IF NOT EXISTS idx_data_hora ON financial_transactions(data, hora);

-- Verificar estrutura final
DESCRIBE financial_transactions;

-- Verificar se a coluna foi adicionada
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'financial_transactions' 
  AND COLUMN_NAME = 'hora';
