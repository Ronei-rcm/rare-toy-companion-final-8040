/**
 * Script para criar tabela de transações recorrentes
 * Execute: node scripts/create-recurring-transactions-table.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRecurringTransactionsTable() {
  let connection;

  try {
    // Criar conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rare_toy_companion',
      port: process.env.DB_PORT || 3307
    });

    console.log('✅ Conectado ao banco de dados');

    // Criar tabela de transações recorrentes
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id VARCHAR(36) PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        tipo ENUM('entrada', 'saida') NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        status ENUM('Pago', 'Pendente', 'Atrasado') DEFAULT 'Pendente',
        metodo_pagamento VARCHAR(50) DEFAULT 'Não informado',
        origem VARCHAR(255),
        observacoes TEXT,
        
        -- Configurações de recorrência
        frequency ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'yearly') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        next_occurrence DATE NOT NULL,
        day_of_month INT NULL COMMENT 'Dia do mês para recorrência mensal/trimestral/semestral/anual (1-31)',
        day_of_week INT NULL COMMENT 'Dia da semana para recorrência semanal (0=Domingo, 6=Sábado)',
        
        -- Configurações de notificação
        notify_days_before INT DEFAULT 0 COMMENT 'Notificar N dias antes do vencimento (0 = não notificar)',
        notify_email VARCHAR(255) NULL,
        
        -- Controle
        is_active BOOLEAN DEFAULT TRUE,
        auto_create BOOLEAN DEFAULT TRUE COMMENT 'Criar transações automaticamente',
        occurrences_count INT DEFAULT 0 COMMENT 'Número de ocorrências já criadas',
        max_occurrences INT NULL COMMENT 'Número máximo de ocorrências (NULL = infinito)',
        
        -- Metadados
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(255) NULL,
        
        -- Índices
        INDEX idx_active (is_active),
        INDEX idx_next_occurrence (next_occurrence),
        INDEX idx_frequency (frequency),
        INDEX idx_type (tipo),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela recurring_transactions criada/verificada');

    // Criar tabela de histórico de ocorrências (para rastrear quais transações foram criadas)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recurring_transaction_occurrences (
        id VARCHAR(36) PRIMARY KEY,
        recurring_transaction_id VARCHAR(36) NOT NULL,
        financial_transaction_id INT NULL COMMENT 'ID da transação criada (NULL se ainda não criada)',
        scheduled_date DATE NOT NULL,
        created_at TIMESTAMP NULL COMMENT 'Quando a transação foi criada',
        status ENUM('pending', 'created', 'skipped', 'failed') DEFAULT 'pending',
        error_message TEXT NULL,
        
        FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
        INDEX idx_recurring_id (recurring_transaction_id),
        INDEX idx_scheduled_date (scheduled_date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela recurring_transaction_occurrences criada/verificada');

    // Criar tabela de notificações de recorrências
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS recurring_transaction_notifications (
        id VARCHAR(36) PRIMARY KEY,
        recurring_transaction_id VARCHAR(36) NOT NULL,
        notification_date DATE NOT NULL,
        scheduled_date DATE NOT NULL,
        sent_at TIMESTAMP NULL,
        status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
        notification_type ENUM('before_due', 'due_today', 'overdue') NOT NULL,
        error_message TEXT NULL,
        
        FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
        INDEX idx_recurring_id (recurring_transaction_id),
        INDEX idx_notification_date (notification_date),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela recurring_transaction_notifications criada/verificada');

    console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Implementar endpoints API para gerenciar recorrências');
    console.log('   2. Criar componente frontend para criar/editar recorrências');
    console.log('   3. Implementar script/cron para processar recorrências');

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão fechada');
    }
  }
}

// Executar
createRecurringTransactionsTable();

