const mysql = require('mysql2/promise');

async function addHoraToFinancialTransactions() {
  let connection;

  try {
    // Criar conexão
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rare_toy_companion',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'financial_transactions' 
        AND COLUMN_NAME = 'hora'
    `, [process.env.DB_NAME || 'rare_toy_companion']);

    if (columns.length > 0) {
      console.log('ℹ️  Coluna "hora" já existe na tabela financial_transactions');
      return;
    }

    // Adicionar coluna hora
    await connection.execute(`
      ALTER TABLE financial_transactions 
      ADD COLUMN hora TIME NULL 
      COMMENT 'Hora da transação (formato HH:MM:SS)'
      AFTER data
    `);

    console.log('✅ Coluna "hora" adicionada com sucesso à tabela financial_transactions');

    // Criar índice para melhorar performance em consultas por data e hora
    try {
      await connection.execute(`
        CREATE INDEX idx_data_hora ON financial_transactions(data, hora)
      `);
      console.log('✅ Índice idx_data_hora criado com sucesso');
    } catch (error) {
      // Índice pode já existir, ignorar erro
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
      console.log('ℹ️  Índice idx_data_hora já existe');
    }

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna hora:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addHoraToFinancialTransactions()
    .then(() => {
      console.log('✅ Migração concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na migração:', error);
      process.exit(1);
    });
}

module.exports = addHoraToFinancialTransactions;
