#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

(async () => {
  const email = (process.argv[2] || '').toLowerCase();
  const nome = process.argv[3] || email;
  if (!email) {
    console.error('Uso: node scripts/create-user.cjs <email> [nome]');
    process.exit(1);
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);

  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    // Detectar colunas opcionais
    const [cols] = await pool.execute("SHOW COLUMNS FROM users");
    const hasPasswordHash = Array.isArray(cols) && cols.some((c) => c.Field === 'password_hash');
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (Array.isArray(exists) && exists[0] && exists[0].id) {
      await pool.execute('UPDATE users SET nome = ? WHERE email = ?', [nome, email]);
      console.log('✅ User atualizado:', { email, nome });
    } else {
      if (hasPasswordHash) {
        await pool.execute('INSERT INTO users (id, email, nome, password_hash, created_at) VALUES (?,?,?,?,NOW())', [randomUUID(), email, nome, '']);
      } else {
        await pool.execute('INSERT INTO users (id, email, nome, created_at) VALUES (?,?,?,NOW())', [randomUUID(), email, nome]);
      }
      console.log('✅ User criado:', { email, nome });
    }
  } catch (e) {
    console.error('❌ Erro ao criar/atualizar user:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();


