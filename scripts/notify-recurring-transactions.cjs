/**
 * Script para enviar notificações de transações recorrentes próximas do vencimento
 * 
 * Este script deve ser executado diariamente via cron para enviar
 * notificações de recorrências que estão próximas do vencimento.
 * 
 * Exemplo de cron (executar todo dia às 8h):
 * 0 8 * * * cd /caminho/do/projeto && node scripts/notify-recurring-transactions.cjs
 */

const mysql = require('mysql2/promise');
const { sendRecurringTransactionNotification } = require('../config/emailService.cjs');
require('dotenv').config();

async function notifyRecurringTransactions() {
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
    console.log(`📅 Verificando notificações para ${new Date().toISOString().split('T')[0]}`);

    // Buscar recorrências ativas que precisam de notificação
    const [recurring] = await connection.execute(`
      SELECT * FROM recurring_transactions
      WHERE is_active = TRUE
        AND notify_email IS NOT NULL
        AND notify_email != ''
        AND notify_days_before > 0
        AND next_occurrence IS NOT NULL
        AND (end_date IS NULL OR next_occurrence <= end_date)
      ORDER BY next_occurrence ASC
    `);

    console.log(`📊 Encontradas ${recurring.length} recorrência(s) para verificar`);

    if (recurring.length === 0) {
      console.log('✅ Nenhuma recorrência para verificar');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sent = [];
    const errors = [];
    const skipped = [];

    for (const rec of recurring) {
      try {
        const nextDate = new Date(rec.next_occurrence);
        nextDate.setHours(0, 0, 0, 0);
        
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Verificar se está dentro do período de notificação
        if (diffDays < 0 || diffDays > rec.notify_days_before) {
          skipped.push({
            id: rec.id,
            descricao: rec.descricao,
            reason: diffDays < 0 ? 'já passou' : `fora do período (${diffDays} dias)`
          });
          continue;
        }

        // Verificar se já foi enviada notificação para esta data
        const [existing] = await connection.execute(`
          SELECT id FROM recurring_transaction_notifications
          WHERE recurring_transaction_id = ?
            AND notification_date = DATE(NOW())
            AND days_before = ?
          LIMIT 1
        `, [rec.id, diffDays]);

        if (existing.length > 0) {
          skipped.push({
            id: rec.id,
            descricao: rec.descricao,
            reason: 'notificação já enviada hoje'
          });
          continue;
        }

        console.log(`\n📧 Enviando notificação: ${rec.descricao} (${diffDays} dia(s) antes)`);

        // Enviar e-mail
        const result = await sendRecurringTransactionNotification({
          transaction: rec,
          daysUntil: diffDays
        });

        if (result.success) {
          // Registrar notificação enviada
          await connection.execute(`
            INSERT INTO recurring_transaction_notifications (
              id, recurring_transaction_id, notification_date,
              days_before, sent_at, status
            ) VALUES (UUID(), ?, DATE(NOW()), ?, NOW(), 'sent')
          `, [rec.id, diffDays]);

          sent.push({
            id: rec.id,
            descricao: rec.descricao,
            email: rec.notify_email,
            daysUntil: diffDays
          });

          console.log(`✅ Notificação enviada para ${rec.notify_email}`);
        } else {
          // Registrar falha
          await connection.execute(`
            INSERT INTO recurring_transaction_notifications (
              id, recurring_transaction_id, notification_date,
              days_before, sent_at, status, error_message
            ) VALUES (UUID(), ?, DATE(NOW()), ?, NOW(), 'failed', ?)
          `, [rec.id, diffDays, result.error || 'Erro desconhecido']);

          errors.push({
            id: rec.id,
            descricao: rec.descricao,
            email: rec.notify_email,
            error: result.error
          });

          console.error(`❌ Erro ao enviar: ${result.error}`);
        }

      } catch (error) {
        console.error(`❌ Erro ao processar ${rec.descricao}:`, error.message);
        errors.push({
          id: rec.id,
          descricao: rec.descricao,
          error: error.message
        });
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`   ✅ Enviadas: ${sent.length}`);
    console.log(`   ⏭️  Ignoradas: ${skipped.length}`);
    console.log(`   ❌ Erros: ${errors.length}`);

    if (sent.length > 0) {
      console.log('\n✅ Notificações enviadas:');
      sent.forEach(s => {
        console.log(`   - ${s.descricao}: ${s.email} (${s.daysUntil} dia(s) antes)`);
      });
    }

    if (skipped.length > 0 && process.env.DEBUG === 'true') {
      console.log('\n⏭️  Notificações ignoradas:');
      skipped.forEach(s => {
        console.log(`   - ${s.descricao}: ${s.reason}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ Erros:');
      errors.forEach(e => {
        console.log(`   - ${e.descricao}: ${e.error}`);
      });
    }

    console.log('\n🎉 Processamento de notificações concluído!');

  } catch (error) {
    console.error('❌ Erro fatal ao processar notificações:', error);
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
  // Inicializar serviço de email
  const { initializeEmailService } = require('../config/emailService.cjs');
  initializeEmailService();

  notifyRecurringTransactions()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro:', error);
      process.exit(1);
    });
}

module.exports = { notifyRecurringTransactions };

