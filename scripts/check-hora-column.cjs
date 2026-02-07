/**
 * Script para verificar se a coluna 'hora' existe na tabela financial_transactions
 * e criá-la se não existir
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function checkAndCreateHoraColumn() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'muhlstore',
      port: process.env.DB_PORT || 3307
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna existe
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'financial_transactions'
        AND COLUMN_NAME = 'hora'
    `, [process.env.DB_NAME || 'muhlstore']);

    if (columns.length > 0) {
      console.log('✅ Coluna "hora" já existe na tabela financial_transactions');
      console.log('📊 Detalhes da coluna:');
      console.log('   - Tipo:', columns[0].DATA_TYPE);
      console.log('   - Permite NULL:', columns[0].IS_NULLABLE);
      console.log('   - Valor padrão:', columns[0].COLUMN_DEFAULT || 'NULL');
      
      // Verificar se há dados com hora preenchida
      const [count] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(hora) as com_hora,
          COUNT(*) - COUNT(hora) as sem_hora
        FROM financial_transactions
      `);
      
      console.log('\n📈 Estatísticas:');
      console.log('   - Total de transações:', count[0].total);
      console.log('   - Com hora preenchida:', count[0].com_hora);
      console.log('   - Sem hora:', count[0].sem_hora);
      
      // Mostrar algumas transações com hora
      const [samples] = await connection.execute(`
        SELECT id, data, hora, descricao, valor
        FROM financial_transactions
        WHERE hora IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      if (samples.length > 0) {
        console.log('\n📋 Exemplos de transações com hora:');
        samples.forEach((t, i) => {
          console.log(`   ${i + 1}. ID ${t.id}: ${t.data} ${t.hora || 'N/A'} - ${t.descricao.substring(0, 40)}... - R$ ${t.valor}`);
        });
      } else {
        console.log('\n⚠️  Nenhuma transação com hora encontrada');
      }
      
    } else {
      console.log('❌ Coluna "hora" NÃO existe na tabela financial_transactions');
      console.log('🔧 Criando coluna...');
      
      // Criar a coluna
      await connection.execute(`
        ALTER TABLE financial_transactions
        ADD COLUMN hora TIME NULL
        COMMENT 'Hora da transação (formato HH:MM:SS)'
        AFTER data
      `);
      
      console.log('✅ Coluna "hora" criada com sucesso!');
      
      // Criar índice
      try {
        await connection.execute(`
          CREATE INDEX idx_data_hora ON financial_transactions(data, hora)
        `);
        console.log('✅ Índice idx_data_hora criado com sucesso!');
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log('ℹ️  Índice idx_data_hora já existe');
        } else {
          throw err;
        }
      }
    }

    // Verificar estrutura completa da tabela
    const [allColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'financial_transactions'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'muhlstore']);

    console.log('\n📋 Estrutura completa da tabela financial_transactions:');
    allColumns.forEach((col, i) => {
      console.log(`   ${i + 1}. ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('   Código:', error.code);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão fechada');
    }
  }
}

// Executar
checkAndCreateHoraColumn()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
