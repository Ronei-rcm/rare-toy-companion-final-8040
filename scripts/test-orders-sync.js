#!/usr/bin/env node

// Script para testar o sistema unificado de pedidos
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testOrdersSync() {
  console.log('🧪 Testando Sistema Unificado de Pedidos...\n');
  
  try {
    // Teste 1: Verificar se as rotas estão funcionando
    console.log('1️⃣ Testando rotas da API...');
    
    const routes = [
      '/orders/unified',
      '/orders/stats/unified',
      '/ws/stats'
    ];
    
    for (const route of routes) {
      try {
        const response = await fetch(`${API_BASE_URL}${route}`);
        console.log(`   ✅ ${route}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ❌ ${route}: ${error.message}`);
      }
    }
    
    // Teste 2: Verificar banco de dados
    console.log('\n2️⃣ Testando banco de dados...');
    
    const mysql = await import('mysql2/promise');
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: 'RSM_Rg51gti66',
      database: 'rare_toy_companion'
    });
    
    // Verificar tabelas
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'rare_toy_companion' 
      AND TABLE_NAME LIKE 'order_%'
    `);
    
    console.log('   📋 Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`      - ${table.TABLE_NAME}`);
    });
    
    // Verificar colunas da tabela orders
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'rare_toy_companion' 
      AND TABLE_NAME = 'orders'
      AND COLUMN_NAME IN ('tracking_code', 'priority', 'notes', 'assigned_to')
    `);
    
    console.log('   🔧 Colunas adicionadas à tabela orders:');
    columns.forEach(column => {
      console.log(`      - ${column.COLUMN_NAME}: ${column.DATA_TYPE} (${column.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar se há pedidos no banco
    const [orders] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    console.log(`   📦 Total de pedidos no banco: ${orders[0].total}`);
    
    await connection.end();
    
    // Teste 3: Verificar componentes React
    console.log('\n3️⃣ Verificando componentes React...');
    
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const components = [
      '../src/components/admin/OrdersUnified.tsx',
      '../src/components/cliente/OrdersUnified.tsx',
      '../src/pages/admin/PedidosAdminUnified.tsx'
    ];
    
    for (const component of components) {
      const componentPath = path.join(__dirname, component);
      if (fs.existsSync(componentPath)) {
        console.log(`   ✅ ${component}: Existe`);
      } else {
        console.log(`   ❌ ${component}: Não encontrado`);
      }
    }
    
    // Teste 4: Verificar arquivos de configuração
    console.log('\n4️⃣ Verificando arquivos de configuração...');
    
    const configFiles = [
      '../server/routes/orders-sync.cjs',
      '../server/websocket-orders.cjs',
      '../database/migrations/orders_sync_tables.sql',
      '../docs/SISTEMA_PEDIDOS_UNIFICADO.md'
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(__dirname, configFile);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${configFile}: Existe`);
      } else {
        console.log(`   ❌ ${configFile}: Não encontrado`);
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Reiniciar o servidor backend');
    console.log('2. Acessar /admin/pedidos para testar interface admin');
    console.log('3. Acessar /minha-conta?tab=pedidos para testar interface cliente');
    console.log('4. Testar sincronização em tempo real');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testOrdersSync();
}

export { testOrdersSync };

