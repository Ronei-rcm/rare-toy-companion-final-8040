const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.WHATSAPP_WEBHOOK_PORT || 3002;

// Middleware
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rare_toy_companion',
  port: process.env.DB_PORT || 3307
};

// WhatsApp Webhook Secret (configure no painel)
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || 'seu-secret-aqui';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'seu-token-aqui';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || 'seu-phone-id-aqui';

// Pool de conexões MySQL
const pool = mysql.createPool(dbConfig);

// Função para validar assinatura do webhook
function validateWebhookSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest('hex');

  const receivedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

// Endpoint para verificação do webhook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_SECRET) {
    console.log('✅ Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Falha na verificação do webhook');
    res.status(403).send('Forbidden');
  }
});

// Endpoint principal para receber mensagens
app.post('/webhook', async (req, res) => {
  try {
    // Validar assinatura
    if (!validateWebhookSignature(req)) {
      console.log('❌ Assinatura inválida do webhook');
      return res.status(403).send('Forbidden');
    }

    const body = req.body;
    console.log('📨 Webhook recebido:', JSON.stringify(body, null, 2));

    // Processar eventos do WhatsApp
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processMessages(change.value);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Função para processar mensagens recebidas
async function processMessages(value) {
  try {
    const messages = value.messages || [];
    const contacts = value.contacts || [];
    const statuses = value.statuses || [];

    // Processar mensagens recebidas
    for (const message of messages) {
      await handleIncomingMessage(message, contacts);
    }

    // Processar status de mensagens enviadas
    for (const status of statuses) {
      await handleMessageStatus(status);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagens:', error);
  }
}

// Função para lidar com mensagens recebidas
async function handleIncomingMessage(message, contacts) {
  try {
    const contact = contacts.find(c => c.wa_id === message.from);
    const contactName = contact ? contact.profile.name : 'Usuário';
    const contactPhone = message.from;
    const messageText = message.text ? message.text.body : '';
    const messageType = message.type;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    console.log(`📱 Mensagem de ${contactName} (${contactPhone}): ${messageText}`);

    // Salvar mensagem no banco
    await saveMessage({
      whatsapp_id: messageId,
      from_phone: contactPhone,
      from_name: contactName,
      message_type: messageType,
      message_text: messageText,
      timestamp: timestamp,
      direction: 'incoming'
    });

    // Processar comandos automáticos
    if (messageText) {
      await processAutomaticCommands(contactPhone, contactName, messageText);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem recebida:', error);
  }
}

// Função para processar comandos automáticos
async function processAutomaticCommands(phone, name, message) {
  try {
    const command = message.toLowerCase().trim();
    let response = '';

    switch (command) {
      case '!catalogo':
        response = await getCatalogMessage();
        break;
      case '!pedido':
        response = await getOrderMessage();
        break;
      case '!contato':
        response = await getContactMessage();
        break;
      case '!status':
        response = await getStatusMessage(phone);
        break;
      case '!ajuda':
      case '!help':
        response = await getHelpMessage();
        break;
      default:
        // Verificar se é uma saudação
        if (isGreeting(message)) {
          response = await getWelcomeMessage(name);
        }
        break;
    }

    if (response) {
      await sendWhatsAppMessage(phone, response);
    }
  } catch (error) {
    console.error('❌ Erro ao processar comandos automáticos:', error);
  }
}

// Funções para gerar respostas automáticas
async function getCatalogMessage() {
  return `🛍️ *Catálogo de Produtos*

Aqui estão nossos produtos em destaque:

🔸 *Brinquedos Raros*
• Action Figures colecionáveis
• Bonecos importados
• Réplicas exclusivas

🔸 *Colecionáveis*
• Cards especiais
• Figuras limitadas
• Edições especiais

Para ver todos os produtos, acesse:
https://muhlstore.re9suainternet.com.br

Digite *!pedido* para fazer um pedido ou *!contato* para falar conosco!`;
}

async function getOrderMessage() {
  return `🛒 *Como Fazer um Pedido*

1️⃣ Acesse nossa loja online:
   https://muhlstore.re9suainternet.com.br

2️⃣ Escolha seus produtos favoritos

3️⃣ Adicione ao carrinho e finalize

4️⃣ Pague com PIX (5% OFF) ou cartão

5️⃣ Receba em casa com segurança!

💡 *Dica:* Use PIX e ganhe 5% de desconto automático!

Precisa de ajuda? Digite *!contato* ou *!ajuda*`;
}

async function getContactMessage() {
  return `📞 *Informações de Contato*

🏪 *MuhlStore - Brinquedos Raros*
🌐 Site: https://muhlstore.re9suainternet.com.br
📱 WhatsApp: Este mesmo número
📧 E-mail: contato@muhlstore.com

🕒 *Horário de Atendimento:*
Segunda a Sexta: 9h às 18h
Sábado: 9h às 14h

💬 *Comandos Úteis:*
• !catalogo - Ver produtos
• !pedido - Como comprar
• !status - Status do pedido
• !ajuda - Lista de comandos

Estamos aqui para ajudar! 😊`;
}

async function getStatusMessage(phone) {
  // Buscar pedidos do cliente
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC LIMIT 3',
      [phone]
    );

    if (orders.length === 0) {
      return `📋 *Status dos Pedidos*

Não encontramos pedidos para este número.

Para fazer seu primeiro pedido, digite *!pedido* e siga as instruções!

🛍️ Acesse: https://muhlstore.re9suainternet.com.br`;
    }

    let statusMessage = `📋 *Seus Pedidos Recentes*\n\n`;

    for (const order of orders) {
      const status = getOrderStatusText(order.status);
      statusMessage += `🔸 *Pedido #${order.id}*\n`;
      statusMessage += `💰 Valor: R$ ${order.total.toFixed(2)}\n`;
      statusMessage += `📦 Status: ${status}\n`;
      statusMessage += `📅 Data: ${new Date(order.created_at).toLocaleDateString('pt-BR')}\n\n`;
    }

    statusMessage += `Para mais detalhes, acesse: https://muhlstore.re9suainternet.com.br/minha-conta`;
    return statusMessage;
  } catch (error) {
    console.error('❌ Erro ao buscar status:', error);
    return `❌ Erro ao consultar pedidos. Tente novamente mais tarde.`;
  }
}

async function getHelpMessage() {
  return `🤖 *Comandos Disponíveis*

*!catalogo* - Ver catálogo de produtos
*!pedido* - Como fazer um pedido
*!contato* - Informações de contato
*!status* - Status dos seus pedidos
*!ajuda* - Esta lista de comandos

🛍️ *Acesse nossa loja:*
https://muhlstore.re9suainternet.com.br

💡 *Dica:* Use PIX e ganhe 5% de desconto!

Estamos aqui para ajudar! 😊`;
}

async function getWelcomeMessage(name) {
  return `👋 *Olá ${name}!*

Bem-vindo à *MuhlStore*! 🎉

Somos especializados em brinquedos raros e colecionáveis exclusivos.

💬 *Comandos úteis:*
• !catalogo - Ver nossos produtos
• !pedido - Como comprar
• !contato - Informações de contato
• !ajuda - Lista completa de comandos

🛍️ *Acesse nossa loja:*
https://muhlstore.re9suainternet.com.br

Como posso ajudá-lo hoje? 😊`;
}

// Função para detectar saudações
function isGreeting(message) {
  const greetings = [
    'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
    'hello', 'hi', 'hey', 'e aí', 'eai', 'salve'
  ];

  const lowerMessage = message.toLowerCase();
  return greetings.some(greeting => lowerMessage.includes(greeting));
}

// Função para enviar mensagem via WhatsApp
async function sendWhatsAppMessage(to, message) {
  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`;

    const data = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Mensagem enviada para ${to}:`, response.data);

    // Salvar mensagem enviada no banco
    await saveMessage({
      whatsapp_id: response.data.messages[0].id,
      from_phone: 'system',
      from_name: 'Sistema',
      to_phone: to,
      message_type: 'text',
      message_text: message,
      timestamp: new Date(),
      direction: 'outgoing'
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
    throw error;
  }
}

// Função para salvar mensagem no banco
async function saveMessage(messageData) {
  try {
    await pool.execute(`
      INSERT INTO whatsapp_messages 
      (whatsapp_id, from_phone, from_name, to_phone, message_type, message_text, timestamp, direction)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      messageData.whatsapp_id,
      messageData.from_phone,
      messageData.from_name,
      messageData.to_phone || null,
      messageData.message_type,
      messageData.message_text,
      messageData.timestamp,
      messageData.direction
    ]);
  } catch (error) {
    console.error('❌ Erro ao salvar mensagem:', error);
  }
}

// Função para lidar com status de mensagens
async function handleMessageStatus(status) {
  try {
    console.log(`📊 Status da mensagem ${status.id}: ${status.status}`);

    // Atualizar status no banco se necessário
    await pool.execute(
      'UPDATE whatsapp_messages SET status = ? WHERE whatsapp_id = ?',
      [status.status, status.id]
    );
  } catch (error) {
    console.error('❌ Erro ao processar status:', error);
  }
}

// Função para obter texto do status do pedido
function getOrderStatusText(status) {
  const statusMap = {
    'pending': '⏳ Aguardando Pagamento',
    'paid': '✅ Pago',
    'processing': '📦 Processando',
    'shipped': '🚚 Enviado',
    'delivered': '🏠 Entregue',
    'cancelled': '❌ Cancelado'
  };

  return statusMap[status] || '❓ Status Desconhecido';
}

// Endpoint para enviar mensagem manual (para testes)
app.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'to e message são obrigatórios' });
    }

    const result = await sendWhatsAppMessage(to, message);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem manual:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Endpoint para obter estatísticas
app.get('/stats', async (req, res) => {
  try {
    const [messages] = await pool.execute(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as incoming_messages,
        COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as outgoing_messages,
        COUNT(DISTINCT from_phone) as unique_contacts
      FROM whatsapp_messages 
      WHERE DATE(timestamp) = CURDATE()
    `);

    res.json({ success: true, stats: messages[0] });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// Criar tabela de mensagens WhatsApp se não existir
async function createTables() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        whatsapp_id VARCHAR(255) UNIQUE,
        from_phone VARCHAR(20),
        from_name VARCHAR(255),
        to_phone VARCHAR(20),
        message_type VARCHAR(50),
        message_text TEXT,
        timestamp DATETIME,
        direction ENUM('incoming', 'outgoing'),
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabela whatsapp_messages criada/verificada');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  }
}

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 WhatsApp Webhook Server rodando na porta ${PORT}`);
  console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📊 Stats URL: http://localhost:${PORT}/stats`);

  await createTables();
});

module.exports = app;
