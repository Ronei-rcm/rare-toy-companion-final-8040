-- =====================================================
-- Migração: Criar Tabela de Galeria de Vídeos
-- Data: 23/11/2025
-- Descrição: Tabela para gerenciar galeria de vídeos gerenciável no admin
-- =====================================================

-- Tabela de vídeos da galeria
CREATE TABLE IF NOT EXISTS video_gallery (
  id VARCHAR(191) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  video_url VARCHAR(1000) NOT NULL,
  thumbnail_url VARCHAR(500),
  categoria VARCHAR(100),
  duracao INT DEFAULT 0 COMMENT 'Duração em segundos',
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  visualizacoes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_ordem (ordem),
  INDEX idx_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

