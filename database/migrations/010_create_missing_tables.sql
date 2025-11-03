-- =====================================================
-- Migração: Criar Tabelas Faltantes
-- Data: 13/10/2025
-- Descrição: Tabelas de carousel, events e blog que estavam faltando
-- =====================================================

-- Tabela de itens do carrossel
CREATE TABLE IF NOT EXISTS carousel_items (
  id VARCHAR(191) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  badge VARCHAR(100),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(191) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_evento DATETIME NOT NULL,
  local VARCHAR(255),
  imagem_url VARCHAR(500),
  link_inscricao VARCHAR(500),
  status VARCHAR(50) DEFAULT 'ativo',
  destaque BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_data (data_evento),
  INDEX idx_status (status),
  INDEX idx_destaque (destaque)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar alias para compatibilidade
CREATE OR REPLACE VIEW upcoming_events AS
SELECT * FROM events WHERE data_evento >= NOW() AND status = 'ativo'
ORDER BY data_evento ASC;

-- Tabela de posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
  id VARCHAR(191) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  resumo TEXT,
  conteudo LONGTEXT,
  imagem_destaque VARCHAR(500),
  autor VARCHAR(255),
  categoria VARCHAR(100),
  tags TEXT,
  status VARCHAR(50) DEFAULT 'rascunho',
  visualizacoes INT DEFAULT 0,
  publicado_em DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_categoria (categoria),
  INDEX idx_publicado (publicado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais do carrossel
INSERT IGNORE INTO carousel_items (id, title, subtitle, image_url, badge, order_index, is_active) VALUES
(UUID(), 'Bem-vindo à MuhlStore Galaxy', 'Descubra coleções incríveis de action figures e muito mais!', '/mario-starwars-hero-CxsquRjT.jpg', 'Novo', 1, TRUE);

-- Evento exemplo
INSERT IGNORE INTO events (id, titulo, descricao, data_evento, local, status, destaque, ordem) VALUES
(UUID(), 'Lançamento de Nova Coleção', 'Descubra as novidades que estão chegando!', DATE_ADD(NOW(), INTERVAL 30 DAY), 'MuhlStore', 'ativo', TRUE, 1);

-- Post de blog exemplo
INSERT IGNORE INTO blog_posts (id, titulo, slug, resumo, conteudo, categoria, status, publicado_em) VALUES
(UUID(), 'Bem-vindo à MuhlStore', 'bem-vindo-muhlstore', 'Conheça nossa história e missão', '<p>Bem-vindo à MuhlStore, sua loja de brinquedos raros e colecionáveis!</p>', 'Novidades', 'publicado', NOW());

