-- Migration: Adicionar colunas de reset de senha
-- Data: 2025-01-11
-- Descrição: Adiciona colunas reset_token e reset_expires para recuperação de senha

-- Adicionar colunas em users (se não existirem)
ALTER TABLE `rare_toy_companion`.`users` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_expires` DATETIME NULL DEFAULT NULL;

-- Adicionar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS `idx_users_reset_token` ON `rare_toy_companion`.`users`(`reset_token`);

-- Adicionar colunas em customers (se não existirem)
ALTER TABLE `rare_toy_companion`.`customers` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_expires` DATETIME NULL DEFAULT NULL;

-- Adicionar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS `idx_customers_reset_token` ON `rare_toy_companion`.`customers`(`reset_token`);
