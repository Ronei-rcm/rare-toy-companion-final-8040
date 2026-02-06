#!/usr/bin/env node

const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

// Configuração do banco
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: 'rare_toy_companion',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            rawData: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testRealUserFlow() {
  console.log('\n🔍 ===========================================');
  console.log('   TESTE PRÁTICO - FLUXO REAL DO USUÁRIO');
  console.log('==========================================\n');

  try {
    // 1. VERIFICAR USUÁRIO CLIENTE@EXEMPLO.COM
    console.log('1. VERIFICANDO USUÁRIO cliente@exemplo.com...');
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', ['cliente@exemplo.com']);
    
    if (users.length === 0) {
      console.log('❌ Usuário cliente@exemplo.com não encontrado!');
      console.log('🔧 Criando usuário de teste...');
      
      // Criar usuário de teste
      const userId = require('crypto').randomUUID();
      await pool.execute(`
        INSERT INTO users (id, email, nome, telefone, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [userId, 'cliente@exemplo.com', 'Cliente Exemplo', '51999999999', 'hashed_password']);
      
      console.log('✅ Usuário criado:', userId);
    } else {
      console.log('✅ Usuário encontrado:', users[0].id);
    }

    // 2. TESTAR LOGIN
    console.log('\n2. TESTANDO LOGIN...');
    const loginResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/auth/login', {
      method: 'POST',
      body: {
        email: 'cliente@exemplo.com',
        senha: 'senha123'
      }
    });
    
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Response:`, loginResponse.data);
    
    let cookies = '';
    if (loginResponse.status === 200 && loginResponse.headers['set-cookie']) {
      cookies = loginResponse.headers['set-cookie'].join('; ');
      console.log('✅ Login realizado com sucesso');
      console.log('🍪 Cookies:', cookies.substring(0, 100) + '...');
    } else {
      console.log('❌ Falha no login');
      return;
    }

    // 3. TESTAR ACESSO À MINHA CONTA
    console.log('\n3. TESTANDO ACESSO À MINHA CONTA...');
    const minhaContaResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/minha-conta', {
      headers: { 'Cookie': cookies }
    });
    
    console.log(`Status: ${minhaContaResponse.status}`);
    if (minhaContaResponse.status === 200) {
      console.log('✅ Página Minha Conta acessível');
    } else {
      console.log('❌ Não foi possível acessar Minha Conta');
    }

    // 4. TESTAR ESTATÍSTICAS DO USUÁRIO
    console.log('\n4. TESTANDO ESTATÍSTICAS...');
    const statsResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/customers/current/stats', {
      headers: { 'Cookie': cookies }
    });
    
    console.log(`Status: ${statsResponse.status}`);
    console.log(`Stats:`, statsResponse.data);

    // 5. TESTAR PEDIDOS DO USUÁRIO
    console.log('\n5. TESTANDO PEDIDOS...');
    const [user] = await pool.execute('SELECT id FROM users WHERE email = ?', ['cliente@exemplo.com']);
    const userId = user[0].id;
    
    const ordersResponse = await makeRequest(`https://muhlstore.re9suainternet.com.br/api/orders?user_id=${userId}`, {
      headers: { 'Cookie': cookies }
    });
    
    console.log(`Status: ${ordersResponse.status}`);
    console.log(`Pedidos:`, ordersResponse.data);

    // 6. VERIFICAR PEDIDOS NO BANCO
    console.log('\n6. VERIFICANDO PEDIDOS NO BANCO...');
    const [orders] = await pool.execute('SELECT * FROM orders WHERE user_id = ?', [userId]);
    console.log(`Pedidos no banco para ${userId}:`, orders.length);
    
    if (orders.length > 0) {
      console.log('📋 Pedidos encontrados:');
      orders.forEach(order => {
        console.log(`  - ID: ${order.id}, Status: ${order.status}, Total: R$ ${order.total}`);
      });
    }

    // 7. TESTAR ENDEREÇOS
    console.log('\n7. TESTANDO ENDEREÇOS...');
    const addressesResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/addresses', {
      headers: { 'Cookie': cookies }
    });
    
    console.log(`Status: ${addressesResponse.status}`);
    console.log(`Endereços:`, addressesResponse.data);

    // 8. TESTAR CRIAR ENDEREÇO
    console.log('\n8. TESTANDO CRIAR ENDEREÇO...');
    const addressData = {
      nome: 'Casa',
      cep: '94065350',
      endereco: 'Rua Teste, 123',
      numero: '123',
      complemento: 'Apto 1',
      bairro: 'Centro',
      cidade: 'Gravataí',
      estado: 'RS',
      principal: true
    };
    
    const createAddressResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/addresses', {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: addressData
    });
    
    console.log(`Status: ${createAddressResponse.status}`);
    console.log(`Response:`, createAddressResponse.data);

    // 9. VERIFICAR SESSÃO NO BANCO
    console.log('\n9. VERIFICANDO SESSÃO...');
    const sessionId = cookies.match(/session_id=([^;]+)/)?.[1];
    if (sessionId) {
      const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      console.log(`Sessão encontrada:`, sessions.length > 0);
      if (sessions.length > 0) {
        console.log(`User ID na sessão:`, sessions[0].user_id);
      }
    }

    // 10. TESTAR CRIAR PEDIDO
    console.log('\n10. TESTANDO CRIAR PEDIDO...');
    
    // Primeiro, verificar produtos disponíveis
    const productsResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/products');
    console.log(`Produtos disponíveis:`, productsResponse.data.length);
    
    if (productsResponse.data.length > 0) {
      const firstProduct = productsResponse.data[0];
      console.log(`Produto para teste:`, firstProduct.nome, `R$ ${firstProduct.preco}`);
      
      // Criar pedido
      const orderData = {
        user_id: userId,
        total: parseFloat(firstProduct.preco),
        status: 'pending',
        payment_method: 'pix',
        items: [{
          product_id: firstProduct.id,
          quantity: 1,
          price: parseFloat(firstProduct.preco)
        }]
      };
      
      const createOrderResponse = await makeRequest('https://muhlstore.re9suainternet.com.br/api/orders', {
        method: 'POST',
        headers: { 'Cookie': cookies },
        body: orderData
      });
      
      console.log(`Status: ${createOrderResponse.status}`);
      console.log(`Response:`, createOrderResponse.data);
    }

    console.log('\n📋 RESUMO DO TESTE:');
    console.log('==========================================');
    console.log('✅ Login:', loginResponse.status === 200 ? 'OK' : 'FALHA');
    console.log('✅ Minha Conta:', minhaContaResponse.status === 200 ? 'OK' : 'FALHA');
    console.log('✅ Estatísticas:', statsResponse.status === 200 ? 'OK' : 'FALHA');
    console.log('✅ Pedidos:', ordersResponse.status === 200 ? 'OK' : 'FALHA');
    console.log('✅ Endereços:', addressesResponse.status === 200 ? 'OK' : 'FALHA');
    console.log('✅ Criar Endereço:', createAddressResponse.status === 201 || createAddressResponse.status === 200 ? 'OK' : 'FALHA');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error);
  } finally {
    await pool.end();
  }
}

testRealUserFlow();
