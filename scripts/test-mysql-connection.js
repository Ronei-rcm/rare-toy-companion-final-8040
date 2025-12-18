#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔌 Testing MySQL connection...');
    
    // SECURITY: Nunca hardcodar senhas! Use apenas variáveis de ambiente
    if (!process.env.MYSQL_PASSWORD && !process.env.DB_PASSWORD) {
      throw new Error('MYSQL_PASSWORD ou DB_PASSWORD deve estar definido no arquivo .env');
    }
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
      port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
      user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
      password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'rare_toy_companion'
    });

    console.log('✅ Connected to MySQL successfully!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query executed:', rows);
    
    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Available tables:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
    console.log('✅ Connection closed successfully!');
    
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
