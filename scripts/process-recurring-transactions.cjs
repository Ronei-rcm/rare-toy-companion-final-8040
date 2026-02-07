/**
 * Script para processar transações recorrentes
 * 
 * Este script deve ser executado diariamente via cron para criar
 * automaticamente as transações que estão agendadas.
 * 
 * Exemplo de cron (executar todo dia às 6h):
 * 0 6 * * * cd /caminho/do/projeto && node scripts/process-recurring-transactions.cjs
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Função auxiliar para calcular próxima ocorrência
function calculateNextOccurrence(lastDate, frequency, dayOfMonth = null, dayOfWeek = null) {
  const date = new Date(lastDate);
  const next = new Date(date);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      if (dayOfWeek !== null) {
        const diff = dayOfWeek - next.getDay();
        if (diff !== 0) {
          next.setDate(next.getDate() + (diff > 0 ? diff : 7 + diff));
        }
      }
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth !== null) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth !== null) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'semiannual':
      next.setMonth(next.getMonth() + 6);
      if (dayOfMonth !== null) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      if (dayOfMonth !== null) {
        next.setDate(dayOfMonth);
      }
      break;
  }

  return next.toISOString().split('T')[0];
}

async function processRecurringTransactions() {
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
    console.log(`📅 Processando recorrências para ${new Date().toISOString().split('T')[0]}`);

    const today = new Date().toISOString().split('T')[0];
    
    // Buscar recorrências ativas com próxima ocorrência hoje ou antes
    const [recurring] = await connection.execute(`
      SELECT * FROM recurring_transactions
      WHERE is_active = TRUE
        AND auto_create = TRUE
        AND next_occurrence <= ?
        AND (end_date IS NULL OR next_occurrence <= end_date)
        AND (max_occurrences IS NULL OR occurrences_count < max_occurrences)
      ORDER BY next_occurrence ASC
    `, [today]);

    console.log(`📊 Encontradas ${recurring.length} recorrência(s) para processar`);

    if (recurring.length === 0) {
      console.log('✅ Nenhuma recorrência para processar');
      return;
    }

    const crypto = require('crypto');
    const processed = [];
    const errors = [];

    for (const rec of recurring) {
      try {
        console.log(`\n🔄 Processando: ${rec.descricao} (${rec.id})`);

        // Verificar se já existe uma transação para esta data
        const [existing] = await connection.execute(`
          SELECT id FROM financial_transactions
          WHERE data = ? AND descricao = ? AND categoria = ?
          LIMIT 1
        `, [rec.next_occurrence, rec.descricao, rec.categoria]);

        if (existing.length > 0) {
          console.log(`⏭️  Transação já existe para ${rec.next_occurrence}, pulando...`);
          // Atualizar próxima ocorrência mesmo assim
          const nextOccurrence = calculateNextOccurrence(
            rec.next_occurrence,
            rec.frequency,
            rec.day_of_month,
            rec.day_of_week
          );
          await connection.execute(`
            UPDATE recurring_transactions
            SET next_occurrence = ?, updated_at = NOW()
            WHERE id = ?
          `, [nextOccurrence, rec.id]);
          continue;
        }

        // Criar transação financeira
        const [result] = await connection.execute(`
          INSERT INTO financial_transactions (
            descricao, categoria, tipo, valor, status, 
            metodo_pagamento, data, origem, observacoes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          rec.descricao, rec.categoria, rec.tipo, rec.valor, rec.status,
          rec.metodo_pagamento, rec.next_occurrence, rec.origem || null, rec.observacoes || null
        ]);

        const transactionId = result.insertId;
        console.log(`✅ Transação criada: ID ${transactionId}`);

        // Registrar ocorrência
        await connection.execute(`
          INSERT INTO recurring_transaction_occurrences (
            id, recurring_transaction_id, financial_transaction_id,
            scheduled_date, created_at, status
          ) VALUES (?, ?, ?, ?, NOW(), 'created')
        `, [crypto.randomUUID(), rec.id, transactionId, rec.next_occurrence]);

        // Calcular próxima ocorrência
        const nextOccurrence = calculateNextOccurrence(
          rec.next_occurrence,
          rec.frequency,
          rec.day_of_month,
          rec.day_of_week
        );

        // Atualizar recorrência
        await connection.execute(`
          UPDATE recurring_transactions
          SET next_occurrence = ?,
              occurrences_count = occurrences_count + 1,
              updated_at = NOW()
          WHERE id = ?
        `, [nextOccurrence, rec.id]);

        processed.push({
          recurring_id: rec.id,
          recurring_descricao: rec.descricao,
          transaction_id: transactionId,
          date: rec.next_occurrence,
          next_occurrence: nextOccurrence
        });

        console.log(`✅ Próxima ocorrência: ${nextOccurrence}`);
      } catch (error) {
        console.error(`❌ Erro ao processar ${rec.descricao}:`, error.message);
        errors.push({
          recurring_id: rec.id,
          recurring_descricao: rec.descricao,
          error: error.message
        });

        // Registrar erro na tabela de ocorrências
        try {
          await connection.execute(`
            INSERT INTO recurring_transaction_occurrences (
              id, recurring_transaction_id, financial_transaction_id,
              scheduled_date, status, error_message
            ) VALUES (?, ?, NULL, ?, 'failed', ?)
          `, [crypto.randomUUID(), rec.id, rec.next_occurrence, error.message]);
        } catch (err) {
          console.error('Erro ao registrar falha:', err.message);
        }
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Processadas: ${processed.length}`);
    console.log(`   ❌ Erros: ${errors.length}`);

    if (processed.length > 0) {
      console.log('\n✅ Transações criadas:');
      processed.forEach(p => {
        console.log(`   - ${p.recurring_descricao}: R$ ${rec.valor} em ${p.date} (ID: ${p.transaction_id})`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Erros:');
      errors.forEach(e => {
        console.log(`   - ${e.recurring_descricao}: ${e.error}`);
      });
    }

    console.log('\n🎉 Processamento concluído!');

  } catch (error) {
    console.error('❌ Erro fatal ao processar recorrências:', error);
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
  processRecurringTransactions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

module.exports = { processRecurringTransactions };

