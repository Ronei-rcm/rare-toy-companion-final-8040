#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔌 Testing MySQL connection...');
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'rare_toy_user',
      password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66',
      database: process.env.MYSQL_DATABASE || 'rare_toy_companion'
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
