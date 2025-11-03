-- ============================================================================
-- Migration 012: Sincronizar categorias com frontend
-- Data: 13 de Outubro de 2025
-- Objetivo: Alinhar categorias do banco com as usadas no frontend
-- ============================================================================

-- Atualizar categorias existentes para match com frontend
UPDATE categorias SET 
  nome = 'Action Figures', 
  slug = 'action-figures',
  icon = '⚔️',
  cor = 'from-blue-500 to-blue-600',
  ordem = 1
WHERE nome = 'Action Figures';

UPDATE categorias SET 
  nome = 'Bonecos', 
  slug = 'bonecos',
  icon = '🤖',
  cor = 'from-purple-500 to-purple-600',
  ordem = 2
WHERE nome = 'Bonecos de Ação';

-- Adicionar categorias do frontend que não existem
INSERT IGNORE INTO categorias (nome, slug, descricao, icon, cor, ordem, ativo) VALUES
('Carrinhos', 'carrinhos', 'Miniaturas e veículos colecionáveis', '🚗', 'from-orange-500 to-orange-600', 3, 1),
('Pelúcias', 'pelucias', 'Bonecos de pelúcia macios', '🧸', 'from-pink-400 to-pink-500', 4, 1),
('Jogos', 'jogos', 'Jogos de tabuleiro, cartas e eletrônicos', '🎲', 'from-teal-500 to-teal-600', 5, 1),
('Quebra-Cabeças', 'quebra-cabecas', 'Quebra-cabeças e jogos de lógica', '🧩', 'from-indigo-500 to-indigo-600', 6, 1),
('Livros', 'livros', 'Livros infantis e educativos', '📚', 'from-green-500 to-green-600', 7, 1),
('Educativos', 'educativos', 'Brinquedos educativos e didáticos', '🎓', 'from-yellow-500 to-yellow-600', 8, 1),
('Colecionáveis', 'colecionaveis', 'Itens raros e exclusivos para sua coleção', '👑', 'from-purple-500 to-purple-600', 9, 1),
('Vintage', 'vintage', 'Brinquedos clássicos que marcaram gerações', '⭐', 'from-yellow-500 to-orange-500', 10, 1),
('Outros', 'outros', 'Outros tipos de brinquedos', '📦', 'from-gray-500 to-gray-600', 99, 1);

-- Reordenar todas as categorias
SET @row_number = 0;
UPDATE categorias 
SET ordem = (@row_number:=@row_number+1) 
WHERE ativo = 1 
ORDER BY ordem, nome;

-- Verificar resultado
SELECT 
  'Categorias ativas' as info,
  nome,
  slug,
  ordem,
  icon,
  cor
FROM categorias 
WHERE ativo = 1 
ORDER BY ordem;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- Categorias alinhadas com frontend:
-- 1. Action Figures (⚔️)
-- 2. Bonecos (🤖) 
-- 3. Carrinhos (🚗)
-- 4. Pelúcias (🧸)
-- 5. Jogos (🎲)
-- 6. Quebra-Cabeças (🧩)
-- 7. Livros (📚)
-- 8. Educativos (🎓)
-- 9. Colecionáveis (👑)
-- 10. Vintage (⭐)
-- 99. Outros (📦)
--
-- ============================================================================
