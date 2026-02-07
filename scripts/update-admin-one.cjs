#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

(async () => {
  const email = (process.argv[2] || '').toLowerCase();
  const senha = process.argv[3] || '';
  if (!email || !senha) {
    console.error('Uso: node scripts/update-admin-one.cjs <email> <nova_senha>');
    process.exit(1);
  }
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);
  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    try { await pool.execute('ALTER TABLE admin_users ADD COLUMN must_change_password TINYINT(1) DEFAULT 0'); } catch(_) {}
    const hash = crypto.createHash('sha256').update(String(senha)).digest('hex');
    const [res] = await pool.execute('UPDATE admin_users SET senha_hash = ?, must_change_password = 0, status = "ativo" WHERE email = ? LIMIT 1', [hash, email]);
    console.log('Atualizados:', res?.affectedRows ?? 0);
  } finally { await pool.end(); }
})();


