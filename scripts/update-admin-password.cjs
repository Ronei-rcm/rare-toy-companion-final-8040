#!/usr/bin/env node
// Atualiza a senha de TODOS os usuários admin para o valor informado via arg1
// Uso: node scripts/update-admin-password.cjs "NOVA_SENHA"

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error('Erro: informe a nova senha como primeiro argumento.');
    process.exit(1);
  }
  const hash = crypto.createHash('sha256').update(String(newPassword)).digest('hex');

  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);

  const pool = await mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });
  try {
    // Garantir coluna opcional
    try { await pool.execute('ALTER TABLE admin_users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0'); } catch (_) {}
    try { await pool.execute('ALTER TABLE admin_users ADD COLUMN updated_at DATETIME NULL'); } catch (_) {}
    const [result] = await pool.execute('UPDATE admin_users SET senha_hash = ?, must_change_password = 0, updated_at = NOW()', [hash]);
    const affected = result?.affectedRows ?? 0;
    console.log('✅ Senha atualizada para todos os admins. Registros afetados:', affected);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error('Falha ao atualizar senha:', e?.message || e); process.exit(1); });


