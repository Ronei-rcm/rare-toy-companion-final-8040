#!/usr/bin/env node
// Marca must_change_password = 1 para todos (ou para emails específicos via args)

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const mysql = require('mysql2/promise');

async function main() {
  const emails = process.argv.slice(2).map(e => String(e).trim().toLowerCase()).filter(Boolean);
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);

  const pool = await mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });
  try {
    try { await pool.execute('ALTER TABLE admin_users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0'); } catch (_) {}
    let result;
    if (emails.length > 0) {
      const placeholders = emails.map(() => '?').join(',');
      [result] = await pool.execute(`UPDATE admin_users SET must_change_password = 1 WHERE email IN (${placeholders})`, emails);
    } else {
      [result] = await pool.execute('UPDATE admin_users SET must_change_password = 1');
    }
    const affected = result?.affectedRows ?? 0;
    console.log('✅ must_change_password ajustado. Registros afetados:', affected);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error('Falha ao marcar must_change_password:', e?.message || e); process.exit(1); });


