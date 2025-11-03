-- ============================================================================
-- Migration 011: Adicionar categoria_id à tabela produtos
-- Data: 13 de Outubro de 2025
-- Objetivo: Melhorar relacionamento produtos <-> categorias usando ID
-- ============================================================================

-- Etapa 1: Adicionar nova coluna categoria_id
ALTER TABLE produtos 
ADD COLUMN categoria_id INT NULL 
AFTER categoria;

-- Etapa 2: Popular categoria_id baseado no nome atual da categoria
UPDATE produtos p 
INNER JOIN categorias c ON p.categoria = c.nome
SET p.categoria_id = c.id;

-- Etapa 3: Para produtos sem categoria válida, usar a primeira categoria disponível
UPDATE produtos p 
SET p.categoria_id = (SELECT id FROM categorias ORDER BY ordem LIMIT 1)
WHERE p.categoria_id IS NULL;

-- Etapa 4: Criar índice para performance
CREATE INDEX idx_categoria_id ON produtos(categoria_id);

-- Etapa 5: Adicionar foreign key constraint
ALTER TABLE produtos 
ADD CONSTRAINT fk_produto_categoria 
FOREIGN KEY (categoria_id) REFERENCES categorias(id) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;

-- Etapa 6: Tornar NOT NULL após popular todos os registros
ALTER TABLE produtos 
MODIFY categoria_id INT NOT NULL;

-- Etapa 7: Sincronizar coluna categoria (nome) com categoria_id
-- Isso garante que categoria (nome) sempre esteja atualizado
UPDATE produtos p
INNER JOIN categorias c ON p.categoria_id = c.id
SET p.categoria = c.nome
WHERE p.categoria != c.nome;

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

-- Verificar se todos os produtos têm categoria_id
SELECT 
  'Produtos sem categoria_id' as check_name,
  COUNT(*) as total
FROM produtos 
WHERE categoria_id IS NULL;

-- Verificar integridade (categoria deve corresponder ao categoria_id)
SELECT 
  'Produtos com inconsistência nome/id' as check_name,
  COUNT(*) as total
FROM produtos p
INNER JOIN categorias c ON p.categoria_id = c.id
WHERE p.categoria != c.nome;

-- Estatísticas gerais
SELECT 
  'Distribuição por categoria' as info,
  c.nome as categoria,
  c.id as categoria_id,
  COUNT(p.id) as total_produtos
FROM categorias c
LEFT JOIN produtos p ON c.id = p.categoria_id
GROUP BY c.id, c.nome, c.ordem
ORDER BY c.ordem;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- 
-- 1. A coluna 'categoria' (VARCHAR) é mantida para compatibilidade
-- 2. Foreign key com ON UPDATE CASCADE atualiza produtos se categoria mudar
-- 3. Foreign key com ON DELETE RESTRICT impede deletar categoria com produtos
-- 4. Índice em categoria_id melhora performance de JOINs
--
-- ============================================================================

