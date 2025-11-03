-- ====================================================================
-- Migração: Criar Tabela de Endereços dos Clientes
-- Data: 10 de Outubro de 2025
-- Descrição: Tabela para gerenciar múltiplos endereços por cliente
-- ====================================================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS customer_addresses (
    id VARCHAR(36) PRIMARY KEY,
    customer_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL COMMENT 'Label do endereço (Casa, Trabalho, etc)',
    cep VARCHAR(9) NOT NULL,
    rua VARCHAR(200) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    padrao BOOLEAN DEFAULT FALSE COMMENT 'Endereço padrão para entrega',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para melhorar performance
    INDEX idx_customer_id (customer_id),
    INDEX idx_padrao (padrao),
    INDEX idx_cep (cep),
    
    -- Foreign key para users (se existir)
    CONSTRAINT fk_customer_addresses_user 
        FOREIGN KEY (customer_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Endereços de entrega dos clientes';

-- Garantir que apenas um endereço seja padrão por cliente
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS before_insert_customer_address
BEFORE INSERT ON customer_addresses
FOR EACH ROW
BEGIN
    IF NEW.padrao = TRUE THEN
        UPDATE customer_addresses 
        SET padrao = FALSE 
        WHERE customer_id = NEW.customer_id AND padrao = TRUE;
    END IF;
END$$

CREATE TRIGGER IF NOT EXISTS before_update_customer_address
BEFORE UPDATE ON customer_addresses
FOR EACH ROW
BEGIN
    IF NEW.padrao = TRUE AND OLD.padrao = FALSE THEN
        UPDATE customer_addresses 
        SET padrao = FALSE 
        WHERE customer_id = NEW.customer_id 
        AND id != NEW.id 
        AND padrao = TRUE;
    END IF;
END$$
DELIMITER ;

-- ====================================================================
-- Dados de exemplo (opcional - comentado por padrão)
-- ====================================================================

/*
-- Exemplo de endereço
INSERT INTO customer_addresses (
    id, 
    customer_id, 
    nome, 
    cep, 
    rua, 
    numero, 
    complemento, 
    bairro, 
    cidade, 
    estado, 
    padrao
) VALUES (
    UUID(), 
    1, 
    'Casa', 
    '01310-100', 
    'Avenida Paulista', 
    '1578', 
    'Apto 501', 
    'Bela Vista', 
    'São Paulo', 
    'SP', 
    TRUE
);
*/

-- ====================================================================
-- Verificação
-- ====================================================================

SELECT 
    'Tabela customer_addresses criada com sucesso!' as status,
    COUNT(*) as total_enderecos
FROM customer_addresses;

-- Ver estrutura da tabela
DESCRIBE customer_addresses;

