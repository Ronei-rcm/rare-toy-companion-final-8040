#!/usr/bin/env node
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

(async () => {
  const nome = process.argv[2] || '';
  const email = (process.argv[3] || '').toLowerCase();
  if (!nome || !email) {
    console.error('Uso: node scripts/create-customer.cjs <nome> <email>');
    process.exit(1);
  }

  const host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1';
  const user = process.env.MYSQL_USER || process.env.DB_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion';
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3307);

  const pool = await mysql.createPool({ host, user, password, database, port });
  try {
    // Gerar ID determinístico por email se já existir, senão um UUID
    const [existing] = await pool.execute('SELECT id FROM customers WHERE email = ? LIMIT 1', [email]);
    const id = (existing && existing[0] && existing[0].id) ? existing[0].id : randomUUID();

    // Upsert manual por email
    const [res] = await pool.execute('SELECT 1 FROM customers WHERE email = ? LIMIT 1', [email]);
    if (Array.isArray(res) && res.length > 0) {
      await pool.execute('UPDATE customers SET nome = ?, updated_at = NOW() WHERE email = ?', [nome, email]);
    } else {
      await pool.execute('INSERT INTO customers (id, nome, email, created_at) VALUES (?, ?, ?, NOW())', [id, nome, email]);
    }
    console.log('✅ Cliente criado/atualizado com sucesso:', { nome, email });
  } catch (e) {
    console.error('❌ Erro ao criar/atualizar cliente:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();


