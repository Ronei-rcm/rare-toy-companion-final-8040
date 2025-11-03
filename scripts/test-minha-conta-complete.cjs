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

async function testMinhaContaComplete() {
  console.log('\n🔍 ===========================================');
  console.log('   TESTE COMPLETO - SISTEMA MINHA CONTA');
  console.log('==========================================\n');

  const testEmail = `teste-completo-${Date.now()}@exemplo.com`;
  const testPassword = 'senha123';
  const testName = 'Teste Completo Minha Conta';
  const testPhone = '51999999999';
  
  let cookies = '';
  let userId = null;
  let sessionId = null;
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  function addTestResult(testName, status, details = '') {
    testResults.total++;
    if (status === 'PASS') {
      testResults.passed++;
      console.log(`✅ ${testName}: ${details}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${testName}: ${details}`);
    }
    testResults.details.push({ testName, status, details });
  }

  try {
    // ==================== FASE 1: SETUP ====================
    console.log('📝 FASE 1: CONFIGURAÇÃO INICIAL');
    console.log('==========================================');

    // 1.1 Registro de usuário
    console.log('\n1.1. Registrando usuário...');
    const registerResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/auth/register', {
      method: 'POST',
      body: {
        nome: testName,
        email: testEmail,
        senha: testPassword,
        telefone: testPhone
      }
    });
    
    if (registerResponse.status === 200) {
      addTestResult('Registro de usuário', 'PASS', 'Usuário criado com sucesso');
    } else {
      addTestResult('Registro de usuário', 'FAIL', `Status: ${registerResponse.status}`);
      return;
    }

    // 1.2 Verificar usuário no banco
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [testEmail]);
    if (users.length > 0) {
      userId = users[0].id;
      addTestResult('Usuário no banco', 'PASS', `ID: ${userId}`);
    } else {
      addTestResult('Usuário no banco', 'FAIL', 'Usuário não encontrado');
      return;
    }

    // 1.3 Login
    console.log('\n1.3. Fazendo login...');
    const loginResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        senha: testPassword
      }
    });
    
    if (loginResponse.status === 200) {
      const setCookieHeader = loginResponse.headers['set-cookie'];
      if (setCookieHeader) {
        cookies = setCookieHeader.join('; ');
        const sessionMatch = cookies.match(/session_id=([^;]+)/);
        if (sessionMatch) {
          sessionId = sessionMatch[1];
          addTestResult('Login', 'PASS', 'Sessão criada com sucesso');
        } else {
          addTestResult('Login', 'FAIL', 'Session ID não encontrado');
        }
      } else {
        addTestResult('Login', 'FAIL', 'Cookies não encontrados');
      }
    } else {
      addTestResult('Login', 'FAIL', `Status: ${loginResponse.status}`);
      return;
    }

    // ==================== FASE 2: ENDPOINTS PRINCIPAIS ====================
    console.log('\n📊 FASE 2: ENDPOINTS PRINCIPAIS');
    console.log('==========================================');

    // 2.1 Estatísticas do usuário
    console.log('\n2.1. Testando estatísticas do usuário...');
    const statsResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/customers/current/stats', {
      headers: { 'Cookie': cookies }
    });
    
    if (statsResponse.status === 200 && statsResponse.data) {
      addTestResult('Estatísticas do usuário', 'PASS', `Pedidos: ${statsResponse.data.totalPedidos}, Gasto: R$ ${statsResponse.data.totalGasto}`);
    } else {
      addTestResult('Estatísticas do usuário', 'FAIL', `Status: ${statsResponse.status}`);
    }

    // 2.2 Estatísticas gerais
    const generalStatsResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/customers/stats');
    if (generalStatsResponse.status === 200) {
      addTestResult('Estatísticas gerais', 'PASS', 'Dados gerais carregados');
    } else {
      addTestResult('Estatísticas gerais', 'FAIL', `Status: ${generalStatsResponse.status}`);
    }

    // ==================== FASE 3: FUNCIONALIDADES DE PEDIDOS ====================
    console.log('\n📦 FASE 3: FUNCIONALIDADES DE PEDIDOS');
    console.log('==========================================');

    // 3.1 Listar pedidos do usuário
    const ordersResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/orders?user_id=${userId}`, {
      headers: { 'Cookie': cookies }
    });
    
    if (ordersResponse.status === 200) {
      addTestResult('Listar pedidos', 'PASS', `${ordersResponse.data.length} pedidos encontrados`);
    } else {
      addTestResult('Listar pedidos', 'FAIL', `Status: ${ordersResponse.status}`);
    }

    // 3.2 Estatísticas de pedidos do usuário
    const userStatsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/user-stats/stats/${userId}`, {
      headers: { 'Cookie': cookies }
    });
    
    if (userStatsResponse.status === 200) {
      addTestResult('Estatísticas de pedidos', 'PASS', 'Dados de pedidos carregados');
    } else {
      addTestResult('Estatísticas de pedidos', 'FAIL', `Status: ${userStatsResponse.status}`);
    }

    // ==================== FASE 4: SISTEMA DE ENDEREÇOS ====================
    console.log('\n📍 FASE 4: SISTEMA DE ENDEREÇOS');
    console.log('==========================================');

    // 4.1 Listar endereços
    const addressesResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/addresses', {
      headers: { 'Cookie': cookies }
    });
    
    if (addressesResponse.status === 200) {
      addTestResult('Listar endereços', 'PASS', `${addressesResponse.data.length} endereços encontrados`);
    } else {
      addTestResult('Listar endereços', 'FAIL', `Status: ${addressesResponse.status}`);
    }

    // 4.2 Criar endereço
    const addressData = {
      nome: 'Casa Teste',
      cep: '94065350',
      endereco: 'Rua Teste Completo, 123',
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
    
    if (createAddressResponse.status === 201 || createAddressResponse.status === 200) {
      addTestResult('Criar endereço', 'PASS', 'Endereço criado com sucesso');
      
      // 4.3 Verificar endereço no banco
      const [customerAddresses] = await pool.execute('SELECT COUNT(*) as count FROM customer_addresses WHERE customer_id = ?', [userId]);
      const [generalAddresses] = await pool.execute('SELECT COUNT(*) as count FROM addresses WHERE cart_id IN (SELECT id FROM carts WHERE user_id = ?)', [userId]);
      const totalAddresses = customerAddresses[0].count + generalAddresses[0].count;
      
      if (totalAddresses > 0) {
        addTestResult('Endereço salvo no banco', 'PASS', `${totalAddresses} endereços no banco`);
      } else {
        addTestResult('Endereço salvo no banco', 'FAIL', 'Endereço não encontrado no banco');
      }
    } else {
      addTestResult('Criar endereço', 'FAIL', `Status: ${createAddressResponse.status}`);
    }

    // ==================== FASE 5: SISTEMA DE FAVORITOS ====================
    console.log('\n❤️ FASE 5: SISTEMA DE FAVORITOS');
    console.log('==========================================');

    // 5.1 Listar favoritos
    const favoritesResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/favorites`, {
      headers: { 'Cookie': cookies }
    });
    
    if (favoritesResponse.status === 200) {
      addTestResult('Listar favoritos', 'PASS', `${favoritesResponse.data.favorites.length} favoritos encontrados`);
    } else {
      addTestResult('Listar favoritos', 'FAIL', `Status: ${favoritesResponse.status}`);
    }

    // 5.2 Adicionar favorito (se houver produtos)
    const productsResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/api/products');
    if (productsResponse.status === 200 && productsResponse.data.length > 0) {
      const firstProduct = productsResponse.data[0];
      const addFavoriteResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/favorites/${firstProduct.id}`, {
        method: 'POST',
        headers: { 'Cookie': cookies }
      });
      
      if (addFavoriteResponse.status === 200) {
        addTestResult('Adicionar favorito', 'PASS', 'Produto adicionado aos favoritos');
        
        // 5.3 Remover favorito
        const removeFavoriteResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/favorites/${firstProduct.id}`, {
          method: 'DELETE',
          headers: { 'Cookie': cookies }
        });
        
        if (removeFavoriteResponse.status === 200) {
          addTestResult('Remover favorito', 'PASS', 'Produto removido dos favoritos');
        } else {
          addTestResult('Remover favorito', 'FAIL', `Status: ${removeFavoriteResponse.status}`);
        }
      } else {
        addTestResult('Adicionar favorito', 'FAIL', `Status: ${addFavoriteResponse.status}`);
      }
    } else {
      addTestResult('Adicionar favorito', 'SKIP', 'Nenhum produto disponível para teste');
    }

    // ==================== FASE 6: SISTEMA DE RECOMENDAÇÕES ====================
    console.log('\n🎯 FASE 6: SISTEMA DE RECOMENDAÇÕES');
    console.log('==========================================');

    // 6.1 Recomendações
    const recommendationsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/recommendations`, {
      headers: { 'Cookie': cookies }
    });
    
    if (recommendationsResponse.status === 200) {
      addTestResult('Recomendações', 'PASS', `${recommendationsResponse.data.recommendations.length} produtos recomendados`);
    } else {
      addTestResult('Recomendações', 'FAIL', `Status: ${recommendationsResponse.status}`);
    }

    // ==================== FASE 7: SISTEMA DE AVALIAÇÕES ====================
    console.log('\n⭐ FASE 7: SISTEMA DE AVALIAÇÕES');
    console.log('==========================================');

    // 7.1 Reviews do usuário
    const reviewsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/reviews`, {
      headers: { 'Cookie': cookies }
    });
    
    if (reviewsResponse.status === 200) {
      addTestResult('Reviews do usuário', 'PASS', `${reviewsResponse.data.reviews.length} avaliações encontradas`);
    } else {
      addTestResult('Reviews do usuário', 'FAIL', `Status: ${reviewsResponse.status}`);
    }

    // 7.2 Reviews pendentes
    const pendingReviewsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/pending-reviews`, {
      headers: { 'Cookie': cookies }
    });
    
    if (pendingReviewsResponse.status === 200) {
      addTestResult('Reviews pendentes', 'PASS', `${pendingReviewsResponse.data.products.length} avaliações pendentes`);
    } else {
      addTestResult('Reviews pendentes', 'FAIL', `Status: ${pendingReviewsResponse.status}`);
    }

    // 7.3 Estatísticas de reviews
    const reviewStatsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/review-stats`, {
      headers: { 'Cookie': cookies }
    });
    
    if (reviewStatsResponse.status === 200) {
      addTestResult('Estatísticas de reviews', 'PASS', 'Estatísticas carregadas');
    } else {
      addTestResult('Estatísticas de reviews', 'FAIL', `Status: ${reviewStatsResponse.status}`);
    }

    // ==================== FASE 8: SISTEMA DE CUPONS ====================
    console.log('\n🎁 FASE 8: SISTEMA DE CUPONS');
    console.log('==========================================');

    // 8.1 Cupons do usuário
    const couponsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/coupons`, {
      headers: { 'Cookie': cookies }
    });
    
    if (couponsResponse.status === 200) {
      addTestResult('Cupons do usuário', 'PASS', `${couponsResponse.data.coupons.length} cupons encontrados`);
    } else {
      addTestResult('Cupons do usuário', 'FAIL', `Status: ${couponsResponse.status}`);
    }

    // ==================== FASE 9: SISTEMA DE NOTIFICAÇÕES ====================
    console.log('\n🔔 FASE 9: SISTEMA DE NOTIFICAÇÕES');
    console.log('==========================================');

    // 9.1 Notificações do usuário
    const notificationsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/notifications`, {
      headers: { 'Cookie': cookies }
    });
    
    if (notificationsResponse.status === 200) {
      addTestResult('Notificações do usuário', 'PASS', `${notificationsResponse.data.notifications.length} notificações encontradas`);
    } else {
      addTestResult('Notificações do usuário', 'FAIL', `Status: ${notificationsResponse.status}`);
    }

    // ==================== FASE 10: CONFIGURAÇÕES E SESSÕES ====================
    console.log('\n⚙️ FASE 10: CONFIGURAÇÕES E SESSÕES');
    console.log('==========================================');

    // 10.1 Configurações do usuário
    const settingsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/settings`, {
      headers: { 'Cookie': cookies }
    });
    
    if (settingsResponse.status === 200) {
      addTestResult('Configurações do usuário', 'PASS', 'Configurações carregadas');
    } else {
      addTestResult('Configurações do usuário', 'FAIL', `Status: ${settingsResponse.status}`);
    }

    // 10.2 Sessões do usuário
    const sessionsResponse = await makeRequest(`http://muhlstore.re9suainternet.com.br/api/customers/${userId}/sessions`, {
      headers: { 'Cookie': cookies }
    });
    
    if (sessionsResponse.status === 200) {
      addTestResult('Sessões do usuário', 'PASS', `${sessionsResponse.data.sessions.length} sessões encontradas`);
    } else {
      addTestResult('Sessões do usuário', 'FAIL', `Status: ${sessionsResponse.status}`);
    }

    // ==================== FASE 11: TESTE DE INTERFACE ====================
    console.log('\n🖥️ FASE 11: TESTE DE INTERFACE');
    console.log('==========================================');

    // 11.1 Página Minha Conta
    const minhaContaResponse = await makeRequest('http://muhlstore.re9suainternet.com.br/minha-conta', {
      headers: { 'Cookie': cookies }
    });
    
    if (minhaContaResponse.status === 200) {
      addTestResult('Página Minha Conta', 'PASS', 'Interface carregada com sucesso');
    } else {
      addTestResult('Página Minha Conta', 'FAIL', `Status: ${minhaContaResponse.status}`);
    }

    // ==================== RESUMO FINAL ====================
    console.log('\n📋 RESUMO FINAL DOS TESTES');
    console.log('==========================================');
    console.log(`Total de testes: ${testResults.total}`);
    console.log(`✅ Passou: ${testResults.passed}`);
    console.log(`❌ Falhou: ${testResults.failed}`);
    console.log(`📊 Taxa de sucesso: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ TESTES QUE FALHARAM:');
      testResults.details
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`   - ${t.testName}: ${t.details}`));
    }

    console.log('\n🎯 SISTEMA MINHA CONTA:');
    if (testResults.failed === 0) {
      console.log('✅ TOTALMENTE FUNCIONAL - Todos os testes passaram!');
    } else if (testResults.passed / testResults.total >= 0.8) {
      console.log('⚠️ MAJORITARIAMENTE FUNCIONAL - Alguns problemas menores');
    } else {
      console.log('❌ PROBLEMAS SIGNIFICATIVOS - Necessita correções');
    }

    // ==================== LIMPEZA ====================
    console.log('\n🧹 LIMPEZA - REMOVENDO USUÁRIO DE TESTE...');
    await pool.execute('DELETE FROM users WHERE email = ?', [testEmail]);
    console.log('✅ Usuário de teste removido');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error);
    addTestResult('Erro geral', 'FAIL', error.message);
  } finally {
    await pool.end();
  }
}

testMinhaContaComplete();
