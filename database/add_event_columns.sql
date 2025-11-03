-- Adicionar colunas para controle de feira na tabela events
USE rare_toy_companion;

-- Verificar se as colunas já existem antes de adicionar
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'rare_toy_companion' 
         AND TABLE_NAME = 'events' 
         AND COLUMN_NAME = 'feira_fechada') = 0,
        'ALTER TABLE events ADD COLUMN feira_fechada BOOLEAN DEFAULT FALSE;',
        'SELECT "Coluna feira_fechada já existe" as message;'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'rare_toy_companion' 
         AND TABLE_NAME = 'events' 
         AND COLUMN_NAME = 'renda_total') = 0,
        'ALTER TABLE events ADD COLUMN renda_total DECIMAL(10,2) DEFAULT NULL;',
        'SELECT "Coluna renda_total já existe" as message;'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'rare_toy_companion' 
         AND TABLE_NAME = 'events' 
         AND COLUMN_NAME = 'participantes_confirmados') = 0,
        'ALTER TABLE events ADD COLUMN participantes_confirmados INT DEFAULT NULL;',
        'SELECT "Coluna participantes_confirmados já existe" as message;'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Remover coluna preco se existir (não é mais necessária)
SET @sql = (
    SELECT IF(
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'rare_toy_companion' 
         AND TABLE_NAME = 'events' 
         AND COLUMN_NAME = 'preco') > 0,
        'ALTER TABLE events DROP COLUMN preco;',
        'SELECT "Coluna preco não existe ou já foi removida" as message;'
    )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mostrar estrutura final da tabela
DESCRIBE events;
