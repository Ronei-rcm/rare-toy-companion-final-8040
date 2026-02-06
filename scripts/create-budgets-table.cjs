/**
 * Script para criar tabela de orçamentos
 * Execute: node scripts/create-budgets-table.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBudgetsTable() {
  let connection;

  try {
    // Criar conexão
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: 'rare_toy_companion',
      port: parseInt(process.env.MYSQL_PORT || '3306')
    });

    console.log('✅ Conectado ao banco de dados');

    // Criar tabela de orçamentos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        tipo ENUM('mensal', 'trimestral', 'semestral', 'anual', 'customizado') NOT NULL,
        categoria VARCHAR(100),
        valor_orcado DECIMAL(10,2) NOT NULL,
        valor_real DECIMAL(10,2) DEFAULT 0,
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        alerta_percentual INT DEFAULT 80 COMMENT 'Alerta quando atingir X% do orçado',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        INDEX idx_tipo (tipo),
        INDEX idx_categoria (categoria),
        INDEX idx_data_inicio (data_inicio),
        INDEX idx_data_fim (data_fim),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela budgets criada/verificada');

    // Criar tabela de histórico de atualizações
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS budget_history (
        id VARCHAR(36) PRIMARY KEY,
        budget_id VARCHAR(36) NOT NULL,
        valor_anterior DECIMAL(10,2),
        valor_novo DECIMAL(10,2),
        valor_real_anterior DECIMAL(10,2),
        valor_real_novo DECIMAL(10,2),
        motivo TEXT,
        changed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
        INDEX idx_budget_id (budget_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela budget_history criada/verificada');

    // Criar tabela de alertas de orçamento
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS budget_alerts (
        id VARCHAR(36) PRIMARY KEY,
        budget_id VARCHAR(36) NOT NULL,
        tipo ENUM('alerta', 'extrapolado', 'meta_atingida') NOT NULL,
        percentual_atingido DECIMAL(5,2),
        mensagem TEXT,
        foi_notificado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
        INDEX idx_budget_id (budget_id),
        INDEX idx_tipo (tipo),
        INDEX idx_foi_notificado (foi_notificado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabela budget_alerts criada/verificada');

    console.log('\n🎉 Todas as tabelas foram criadas com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Implementar endpoints API para gerenciar orçamentos');
    console.log('   2. Criar componente frontend para criar/editar orçamentos');
    console.log('   3. Implementar sistema de alertas automáticos');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createBudgetsTable();
}

module.exports = { createBudgetsTable };

