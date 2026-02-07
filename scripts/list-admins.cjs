#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);
  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    const [rows] = await pool.execute('SELECT id, email, nome, status FROM admin_users ORDER BY id');
    console.table(rows);
  } finally {
    await pool.end();
  }
})().catch(e => { console.error(e); process.exit(1); });


