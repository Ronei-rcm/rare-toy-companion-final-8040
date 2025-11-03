#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

(async () => {
  const email = (process.argv[2] || '').toLowerCase();
  const pass = process.argv[3] || '';
  if (!email) { console.error('Uso: node scripts/check-admin.cjs <email> [senha]'); process.exit(1);}  
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    const [rows] = await pool.execute('SELECT id, email, nome, status, role, senha_hash FROM admin_users WHERE email = ? LIMIT 1', [email]);
    if (!Array.isArray(rows) || rows.length === 0) { console.log('Não encontrado'); return; }
    const row = rows[0];
    console.log('Row:', row);
    if (pass) {
      const hash = crypto.createHash('sha256').update(String(pass)).digest('hex');
      console.log('Hash confere?', hash === row.senha_hash);
    }
  } finally { await pool.end(); }
})();


