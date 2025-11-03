-- =====================================================
-- Migração: Criar Tabela de Categorias
-- Data: 13/10/2025
-- Descrição: Tabela para gerenciar categorias de produtos
-- =====================================================

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  icon VARCHAR(50) DEFAULT '📦',
  cor VARCHAR(100) DEFAULT 'from-purple-500 to-purple-600',
  imagem_url VARCHAR(500),
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_ativo (ativo),
  INDEX idx_ordem (ordem)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir categorias padrão com base nas categorias existentes nos produtos
INSERT INTO categorias (nome, slug, descricao, icon, cor, ordem, ativo) VALUES
('Action Figures', 'action-figures', 'Bonecos de ação de suas franquias favoritas', '⚔️', 'from-blue-500 to-blue-600', 1, TRUE),
('Colecionáveis', 'colecionaveis', 'Itens raros e exclusivos para colecionadores', '👑', 'from-purple-500 to-purple-600', 2, TRUE),
('Vintage', 'vintage', 'Brinquedos clássicos dos anos 80 e 90', '⭐', 'from-yellow-500 to-orange-500', 3, TRUE),
('Gaming', 'gaming', 'Personagens e itens do universo dos games', '🎮', 'from-green-500 to-green-600', 4, TRUE),
('Edição Limitada', 'edicao-limitada', 'Peças exclusivas e numeradas', '🛡️', 'from-red-500 to-red-600', 5, TRUE),
('Bonecos de Ação', 'bonecos-de-acao', 'Figuras articuladas de super-heróis e vilões', '🤖', 'from-indigo-500 to-indigo-600', 6, TRUE),
('Carrinhos', 'carrinhos', 'Miniaturas de carros e veículos colecionáveis', '🚗', 'from-orange-500 to-orange-600', 7, TRUE),
('Bonecas', 'bonecas', 'Bonecas de coleção e fashion dolls', '👸', 'from-pink-500 to-pink-600', 8, TRUE),
('Jogos', 'jogos', 'Jogos de tabuleiro e card games colecionáveis', '🎲', 'from-teal-500 to-teal-600', 9, TRUE),
('Star Wars', 'star-wars', 'Uma galáxia muito, muito distante...', '🌟', 'from-slate-700 to-slate-900', 10, TRUE),
('Marvel', 'marvel', 'Heróis e vilões do Universo Marvel', '🦸', 'from-red-600 to-red-800', 11, TRUE),
('DC Comics', 'dc-comics', 'Liga da Justiça e personagens DC', '🦇', 'from-blue-700 to-blue-900', 12, TRUE),
('Transformers', 'transformers', 'Robôs disfarçados', '🤖', 'from-gray-600 to-gray-800', 13, TRUE),
('Dragon Ball', 'dragon-ball', 'Guerreiros Z e personagens do anime', '🐉', 'from-orange-500 to-orange-700', 14, TRUE),
('Pokemon', 'pokemon', 'Gotta catch em all!', '⚡', 'from-yellow-400 to-yellow-600', 15, TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Criar índices para otimização
CREATE INDEX idx_categorias_nome ON categorias(nome);
CREATE INDEX idx_categorias_ativo_ordem ON categorias(ativo, ordem);

