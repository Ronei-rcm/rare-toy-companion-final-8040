-- =====================================================
-- Migração: Adicionar Data Inicial e Final aos Eventos
-- Data: 03/11/2025
-- Descrição: Adiciona campos data_inicio e data_fim para eventos com duração
-- =====================================================

-- Adicionar colunas data_inicio e data_fim
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS data_inicio DATETIME NULL AFTER data_evento,
ADD COLUMN IF NOT EXISTS data_fim DATETIME NULL AFTER data_inicio;

-- Migrar dados existentes: se data_evento existe, usar como data_inicio
-- e data_fim será NULL (eventos de 1 dia)
UPDATE events 
SET data_inicio = data_evento 
WHERE data_inicio IS NULL;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_data_inicio ON events(data_inicio);
CREATE INDEX IF NOT EXISTS idx_data_fim ON events(data_fim);

-- Comentário nas colunas
ALTER TABLE events 
MODIFY COLUMN data_inicio DATETIME NULL COMMENT 'Data e hora de início do evento',
MODIFY COLUMN data_fim DATETIME NULL COMMENT 'Data e hora de término do evento (NULL = evento de 1 dia)';

