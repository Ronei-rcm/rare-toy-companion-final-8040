-- =====================================================
-- Migração 023: Tabela categorias_financeiras
-- Data: Fevereiro 2026
-- Descrição: Categorias do módulo financeiro (entrada/saída)
-- Idempotente: CREATE TABLE IF NOT EXISTS
-- =====================================================

CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(50) DEFAULT '#3B82F6',
  icone VARCHAR(50) DEFAULT '📁',
  tipo VARCHAR(20) DEFAULT 'ambos',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
