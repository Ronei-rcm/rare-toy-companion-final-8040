-- Adiciona coluna hora em financial_transactions (idempotente)
-- Se a coluna já existir, ignorar o erro 1060 (Duplicate column name).

-- Verificação: só adiciona se não existir (via procedure)
DELIMITER //
DROP PROCEDURE IF EXISTS add_hora_if_missing//
CREATE PROCEDURE add_hora_if_missing()
BEGIN
  IF (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'financial_transactions' 
        AND COLUMN_NAME = 'hora') = 0 THEN
    ALTER TABLE financial_transactions 
    ADD COLUMN hora TIME NULL 
    COMMENT 'Hora da transação (extrato)' 
    AFTER data;
  END IF;
END//
DELIMITER ;
CALL add_hora_if_missing();
DROP PROCEDURE IF EXISTS add_hora_if_missing;
