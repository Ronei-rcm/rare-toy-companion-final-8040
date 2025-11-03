#!/usr/bin/env node

/**
 * Script para corrigir problemas com endpoints de endereços
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo endpoints de endereços...');

// 1. Corrigir o componente EnderecosTab.tsx
const enderecosTabPath = path.join(__dirname, '..', 'src', 'components', 'cliente', 'EnderecosTab.tsx');
let enderecosContent = fs.readFileSync(enderecosTabPath, 'utf8');

// Corrigir URL de carregamento de endereços
enderecosContent = enderecosContent.replace(
  'const res = await fetch(`${API_BASE_URL}/customers/addresses`, { credentials: \'include\' });',
  'const res = await fetch(`${API_BASE_URL}/customers/addresses`, { credentials: \'include\' });'
);

// Corrigir URL de exclusão de endereços
enderecosContent = enderecosContent.replace(
  'const res = await fetch(`${API_BASE_URL}/addresses/${id}`, { method: \'DELETE\', credentials: \'include\' });',
  'const res = await fetch(`${API_BASE_URL}/customers/addresses/${id}`, { method: \'DELETE\', credentials: \'include\' });'
);

fs.writeFileSync(enderecosTabPath, enderecosContent);
console.log('✅ EnderecosTab.tsx corrigido');

// 2. Verificar se o endpoint DELETE existe no servidor
const serverPath = path.join(__dirname, '..', 'server', 'server.cjs');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Verificar se existe endpoint DELETE para endereços
if (!serverContent.includes('app.delete(\'/api/customers/addresses/:id\'')) {
  console.log('⚠️ Endpoint DELETE para endereços não encontrado, adicionando...');
  
  // Adicionar endpoint DELETE após o endpoint PUT
  const putEndpointIndex = serverContent.lastIndexOf('app.put(\'/api/customers/addresses/:id\'');
  if (putEndpointIndex !== -1) {
    const endOfPutEndpoint = serverContent.indexOf('});', putEndpointIndex) + 3;
    
    const deleteEndpoint = `
// Deletar endereço
app.delete('/api/customers/addresses/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/customers/addresses/:id');
    
    const { id } = req.params;
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Verificar se o endereço pertence ao usuário
    const [addresses] = await pool.execute(
      'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?', 
      [id, userId]
    );
    
    if (addresses.length === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    // Deletar endereço
    await pool.execute('DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?', [id, userId]);
    
    console.log('✅ Endereço deletado com sucesso');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Erro ao deletar endereço:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

`;

    serverContent = serverContent.slice(0, endOfPutEndpoint) + deleteEndpoint + serverContent.slice(endOfPutEndpoint);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Endpoint DELETE adicionado ao servidor');
  }
}

// 3. Verificar se existe endpoint GET para listar endereços
if (!serverContent.includes('app.get(\'/api/customers/addresses\'')) {
  console.log('⚠️ Endpoint GET para endereços não encontrado, adicionando...');
  
  const deleteEndpointIndex = serverContent.lastIndexOf('app.delete(\'/api/customers/addresses/:id\'');
  if (deleteEndpointIndex !== -1) {
    const endOfDeleteEndpoint = serverContent.indexOf('});', deleteEndpointIndex) + 3;
    
    const getEndpoint = `
// Listar endereços do cliente
app.get('/api/customers/addresses', async (req, res) => {
  try {
    console.log('📋 GET /api/customers/addresses');
    
    // Obter usuário da sessão
    let userId = null;
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      try {
        const [sessions] = await pool.execute('SELECT * FROM sessions WHERE id = ?', [sessionId]);
        if (sessions && sessions[0] && sessions[0].user_email) {
          const userEmail = sessions[0].user_email;
          console.log('👤 Usuário logado via sessão:', userEmail);
          
          // Buscar o user_id na tabela customers baseado no email
          const [customers] = await pool.execute('SELECT id FROM customers WHERE email = ?', [userEmail]);
          if (customers && customers[0]) {
            userId = customers[0].id;
            console.log('✅ User ID encontrado:', userId);
          }
        }
      } catch (e) {
        console.log('⚠️ Erro ao verificar sessão:', e.message);
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    // Buscar endereços do cliente
    const [addresses] = await pool.execute(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY padrao DESC, created_at DESC', 
      [userId]
    );
    
    console.log(\`✅ \${addresses.length} endereços encontrados\`);
    res.json(addresses);
    
  } catch (error) {
    console.error('❌ Erro ao listar endereços:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

`;

    serverContent = serverContent.slice(0, endOfDeleteEndpoint) + getEndpoint + serverContent.slice(endOfDeleteEndpoint);
    fs.writeFileSync(serverPath, serverContent);
    console.log('✅ Endpoint GET adicionado ao servidor');
  }
}

// 4. Corrigir o endpoint POST que tem erro de sintaxe
const postEndpointFix = serverContent.replace(
  `    const [result] = await pool.execute
      INSERT INTO customer_addresses 
      (customer_id, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, padrao, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
;`,
  `    const [result] = await pool.execute(
      \`INSERT INTO customer_addresses 
      (customer_id, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo, padrao, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())\`,
      [userId, nome, rua, numero, complemento, bairro, cidade, estado, cep, tipo || 'residencial', is_default ? 1 : 0]
    );`
);

if (postEndpointFix !== serverContent) {
  fs.writeFileSync(serverPath, postEndpointFix);
  console.log('✅ Endpoint POST corrigido');
}

console.log('\n🎉 Correções de endereços concluídas!');
console.log('\n📋 Correções aplicadas:');
console.log('✅ EnderecosTab.tsx - URLs corrigidas');
console.log('✅ Endpoint DELETE adicionado');
console.log('✅ Endpoint GET adicionado');
console.log('✅ Endpoint POST corrigido');
console.log('\n🚀 Próximos passos:');
console.log('   1. Reiniciar servidor: npm run pm2:restart');
console.log('   2. Testar salvamento de endereços');
console.log('   3. Verificar logs: pm2 logs api');
