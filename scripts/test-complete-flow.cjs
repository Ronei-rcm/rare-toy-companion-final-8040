#!/usr/bin/env node

const mysql = require('mysql2/promise');
const https = require('https');
const http = require('http');

// Configuração do banco
const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'RSM_Rg51gti66',
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

async function testCompleteFlow() {
  console.log('\n🔍 ===========================================');
  console.log('   TESTE COMPLETO DE FLUXO DE CADASTRO');
  console.log('==========================================\n');

  const testEmail = `teste-${Date.now()}@exemplo.com`;
  const testPassword = 'senha123';
  const testName = 'Teste Usuário Completo';
  const testPhone = '51999999999';
  
  let cookies = '';
  let userId = null;
  let sessionId = null;

  try {
    // 1. TESTE DE REGISTRO
    console.log('📝 1. TESTANDO REGISTRO DE USUÁRIO...');
    const registerResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/auth/register', {
      method: 'POST',
      body: {
        nome: testName,
        email: testEmail,
        senha: testPassword,
        telefone: testPhone
      }
    });
    
    console.log(`   Status: ${registerResponse.status}`);
    console.log(`   Response: ${JSON.stringify(registerResponse.data)}`);
    
    if (registerResponse.status !== 200) {
      console.log('❌ FALHA NO REGISTRO');
      return;
    }
    console.log('✅ Registro realizado com sucesso');

    // 2. VERIFICAR USUÁRIO NO BANCO
    console.log('\n🔍 2. VERIFICANDO USUÁRIO NO BANCO...');
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    
    if (users.length === 0) {
      console.log('❌ USUÁRIO NÃO ENCONTRADO NO BANCO');
      return;
    }
    
    userId = users[0].id;
    console.log(`✅ Usuário encontrado no banco: ${userId}`);

    // 3. TESTE DE LOGIN
    console.log('\n🔐 3. TESTANDO LOGIN...');
    const loginResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        senha: testPassword
      }
    });
    
    console.log(`   Status: ${loginResponse.status}`);
    console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
    
    if (loginResponse.status !== 200) {
      console.log('❌ FALHA NO LOGIN');
      return;
    }
    
    // Extrair cookies
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (setCookieHeader) {
      cookies = setCookieHeader.join('; ');
      console.log(`✅ Login realizado - Cookies: ${cookies.substring(0, 100)}...`);
      
      // Extrair session_id
      const sessionMatch = cookies.match(/session_id=([^;]+)/);
      if (sessionMatch) {
        sessionId = sessionMatch[1];
        console.log(`✅ Session ID extraído: ${sessionId}`);
      }
    } else {
      console.log('⚠️ Nenhum cookie de sessão encontrado');
    }

    // 4. TESTAR ENDPOINTS COM AUTENTICAÇÃO
    console.log('\n📊 4. TESTANDO ENDPOINTS COM AUTENTICAÇÃO...');
    
    // 4.1 Estatísticas do usuário logado
    console.log('\n   4.1. Testando /api/customers/current/stats...');
    const statsResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/customers/current/stats', {
      headers: { 'Cookie': cookies }
    });
    console.log(`      Status: ${statsResponse.status}`);
    console.log(`      Response: ${JSON.stringify(statsResponse.data)}`);
    
    if (statsResponse.status === 200) {
      console.log('✅ Estatísticas carregadas com sucesso');
    } else {
      console.log('❌ FALHA ao carregar estatísticas');
    }

    // 4.2 Favoritos
    console.log('\n   4.2. Testando /api/customers/:userId/favorites...');
    const favoritesResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/favorites`, {
      headers: { 'Cookie': cookies }
    });
    console.log(`      Status: ${favoritesResponse.status}`);
    console.log(`      Response: ${JSON.stringify(favoritesResponse.data)}`);
    
    if (favoritesResponse.status === 200) {
      console.log('✅ Favoritos carregados com sucesso');
    } else {
      console.log('❌ FALHA ao carregar favoritos');
    }

    // 4.3 Recomendações
    console.log('\n   4.3. Testando /api/customers/:userId/recommendations...');
    const recommendationsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/recommendations`, {
      headers: { 'Cookie': cookies }
    });
    console.log(`      Status: ${recommendationsResponse.status}`);
    console.log(`      Response: ${JSON.stringify(recommendationsResponse.data)}`);
    
    if (recommendationsResponse.status === 200) {
      console.log('✅ Recomendações carregadas com sucesso');
    } else {
      console.log('❌ FALHA ao carregar recomendações');
    }

    // 4.4 Endereços
    console.log('\n   4.4. Testando /api/addresses...');
    const addressesResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/addresses', {
      headers: { 'Cookie': cookies }
    });
    console.log(`      Status: ${addressesResponse.status}`);
    console.log(`      Response: ${JSON.stringify(addressesResponse.data)}`);
    
    if (addressesResponse.status === 200) {
      console.log('✅ Endereços carregados com sucesso');
    } else {
      console.log('❌ FALHA ao carregar endereços');
    }

    // 5. TESTAR CADASTRO DE ENDEREÇO
    console.log('\n📍 5. TESTANDO CADASTRO DE ENDEREÇO...');
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
    
    const createAddressResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/addresses', {
      method: 'POST',
      headers: { 'Cookie': cookies },
      body: addressData
    });
    
    console.log(`   Status: ${createAddressResponse.status}`);
    console.log(`   Response: ${JSON.stringify(createAddressResponse.data)}`);
    
    if (createAddressResponse.status === 201 || createAddressResponse.status === 200) {
      console.log('✅ Endereço criado com sucesso');
      
      // Verificar se endereço foi salvo no banco
      const [customerAddresses] = await pool.execute('SELECT COUNT(*) as count FROM customer_addresses WHERE customer_id = ?', [userId]);
      const [generalAddresses] = await pool.execute('SELECT COUNT(*) as count FROM addresses WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);
      const totalAddresses = customerAddresses[0].count + generalAddresses[0].count;
      
      console.log(`✅ Endereços encontrados no banco: ${totalAddresses}`);
    } else {
      console.log('❌ FALHA ao criar endereço');
    }

    // 6. VERIFICAR SESSÃO NO BANCO
    console.log('\n🔐 6. VERIFICANDO SESSÃO NO BANCO...');
    if (sessionId) {
      const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      console.log(`   Sessões encontradas: ${sessions.length}`);
      
      if (sessions.length > 0) {
        const sessionData = JSON.parse(sessions[0].data || '{}');
        console.log(`   Dados da sessão: ${JSON.stringify(sessionData)}`);
        console.log('✅ Sessão válida no banco');
      } else {
        console.log('❌ SESSÃO NÃO ENCONTRADA NO BANCO');
      }
    }

    // 7. TESTAR PÁGINA MINHA CONTA
    console.log('\n🏠 7. TESTANDO ACESSO À PÁGINA MINHA CONTA...');
    const minhaContaResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/minha-conta', {
      headers: { 'Cookie': cookies }
    });
    
    console.log(`   Status: ${minhaContaResponse.status}`);
    if (minhaContaResponse.status === 200) {
      console.log('✅ Página Minha Conta acessível');
    } else {
      console.log('❌ FALHA ao acessar página Minha Conta');
    }

    // 8. RESUMO FINAL
    console.log('\n📋 8. RESUMO DO TESTE:');
    console.log('==========================================');
    console.log(`✅ Usuário criado: ${testEmail}`);
    console.log(`✅ ID do usuário: ${userId}`);
    console.log(`✅ Login realizado: ${sessionId ? 'SIM' : 'NÃO'}`);
    console.log(`✅ Estatísticas: ${statsResponse.status === 200 ? 'OK' : 'FALHA'}`);
    console.log(`✅ Favoritos: ${favoritesResponse.status === 200 ? 'OK' : 'FALHA'}`);
    console.log(`✅ Recomendações: ${recommendationsResponse.status === 200 ? 'OK' : 'FALHA'}`);
    console.log(`✅ Endereços: ${addressesResponse.status === 200 ? 'OK' : 'FALHA'}`);
    console.log(`✅ Cadastro endereço: ${createAddressResponse.status === 201 || createAddressResponse.status === 200 ? 'OK' : 'FALHA'}`);
    console.log('==========================================');

    // 9. LIMPEZA - REMOVER USUÁRIO DE TESTE
    console.log('\n🧹 9. LIMPEZA - REMOVENDO USUÁRIO DE TESTE...');
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    console.log('✅ Usuário de teste removido');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error);
  } finally {
    await pool.end();
  }
}

testCompleteFlow();
