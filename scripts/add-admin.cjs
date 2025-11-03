#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const crypto = require('crypto');

(async () => {
  const [email, nome, senha] = process.argv.slice(2);
  if (!email || !senha) {
    console.error('Uso: node scripts/add-admin.cjs <email> <nome opcional> <senha>');
    process.exit(1);
  }
  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    await pool.execute("CREATE TABLE IF NOT EXISTS admin_users (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(191), email VARCHAR(191) UNIQUE, telefone VARCHAR(50), senha_hash VARCHAR(191), role VARCHAR(50) DEFAULT 'admin', status VARCHAR(50) DEFAULT 'ativo', permissoes TEXT, avatar VARCHAR(255), must_change_password TINYINT(1) DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)");
    const [exists] = await pool.execute('SELECT id FROM admin_users WHERE email = ? LIMIT 1', [email]);
    if (Array.isArray(exists) && exists.length > 0) {
      console.log('Usuário já existe:', email);
      process.exit(0);
    }
    const hash = crypto.createHash('sha256').update(String(senha)).digest('hex');
    await pool.execute('INSERT INTO admin_users (nome, email, senha_hash, role, status, permissoes, must_change_password) VALUES (?,?,?,?,?, ?, 1)', [nome || 'Admin', email.toLowerCase(), hash, 'admin', 'ativo', '[]']);
    console.log('✅ Admin criado:', email);
  } finally {
    await pool.end();
  }
})().catch(e => { console.error(e); process.exit(1); });


