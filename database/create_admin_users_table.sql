-- ==============================================
-- TABELA DE USUÁRIOS ADMINISTRATIVOS
-- Sistema de gerenciamento de acessos ao painel admin
-- ==============================================

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `telefone` varchar(20) DEFAULT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `role` enum('admin','gerente','operador','viewer') NOT NULL DEFAULT 'viewer',
  `status` enum('ativo','inativo','bloqueado') NOT NULL DEFAULT 'ativo',
  `permissoes` text DEFAULT NULL COMMENT 'JSON com permissões específicas',
  `avatar` varchar(500) DEFAULT NULL,
  `last_access` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- USUÁRIO ADMIN PADRÃO
-- Email: admin@muhlstore.com
-- Senha: admin123 (deve ser alterada após primeiro acesso)
-- ==============================================

INSERT INTO `admin_users` (
  `nome`, 
  `email`, 
  `telefone`, 
  `senha_hash`, 
  `role`, 
  `status`, 
  `permissoes`,
  `created_at`
) VALUES (
  'Administrador',
  'admin@muhlstore.com',
  NULL,
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- admin123 em SHA256
  'admin',
  'ativo',
  '["produtos","pedidos","clientes","financeiro","relatorios","configuracoes","usuarios","colecoes"]',
  NOW()
) ON DUPLICATE KEY UPDATE nome = nome; -- Não sobrescrever se já existir

-- ==============================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ==============================================

ALTER TABLE `admin_users` 
  ADD INDEX `idx_role_status` (`role`, `status`),
  ADD INDEX `idx_created_at` (`created_at`),
  ADD INDEX `idx_last_access` (`last_access`);

-- ==============================================
-- COMENTÁRIOS DA TABELA
-- ==============================================

ALTER TABLE `admin_users` COMMENT = 'Tabela de usuários do painel administrativo com controle de permissões';

-- ==============================================
-- ROLES E SUAS PERMISSÕES PADRÃO
-- ==============================================

-- admin: Acesso total ao sistema
-- gerente: Pode gerenciar produtos, pedidos e clientes
-- operador: Pode gerenciar pedidos e visualizar produtos
-- viewer: Apenas visualização de dados

-- ==============================================
-- PERMISSÕES DISPONÍVEIS (JSON)
-- ==============================================

-- produtos: Gerenciar produtos (criar, editar, excluir)
-- pedidos: Gerenciar pedidos (ver, atualizar status)
-- clientes: Gerenciar clientes (ver, editar dados)
-- financeiro: Visualizar relatórios financeiros
-- relatorios: Gerar relatórios personalizados
-- configuracoes: Acessar configurações do sistema
-- usuarios: Gerenciar usuários admin
-- colecoes: Gerenciar coleções de produtos

-- ==============================================
-- EXEMPLO DE USO
-- ==============================================

-- SELECT * FROM admin_users WHERE status = 'ativo';
-- SELECT * FROM admin_users WHERE role = 'admin';
-- UPDATE admin_users SET last_access = NOW() WHERE email = 'admin@muhlstore.com';

