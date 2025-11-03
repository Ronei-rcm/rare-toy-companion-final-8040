# 📱 Manual de Configuração WhatsApp Business API

Este manual completo te guiará através de todo o processo de configuração do WhatsApp Business API para integrar com o MuhlStore.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Criando Conta WhatsApp Business](#criando-conta-whatsapp-business)
3. [Configurando Meta Business](#configurando-meta-business)
4. [Obtendo Credenciais da API](#obtendo-credenciais-da-api)
5. [Configurando Webhook](#configurando-webhook)
6. [Configuração no MuhlStore](#configuração-no-muhlstore)
7. [Testando a Integração](#testando-a-integração)
8. [Comandos Automáticos](#comandos-automáticos)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

- Conta do Facebook Business
- Número de telefone válido (não pode ser usado no WhatsApp pessoal)
- Domínio com HTTPS configurado
- Acesso ao servidor onde o MuhlStore está instalado

---

## 🏢 Criando Conta WhatsApp Business

### Passo 1: Acesse o Meta Business Manager

1. Vá para [business.facebook.com](https://business.facebook.com)
2. Clique em "Criar Conta" se não tiver uma conta Business
3. Preencha os dados da sua empresa

### Passo 2: Configurar WhatsApp Business

1. No Business Manager, vá para **"WhatsApp Business"**
2. Clique em **"Começar"**
3. Escolha **"WhatsApp Business API"** (não o app)
4. Selecione seu país e idioma

### Passo 3: Verificar Número de Telefone

1. Insira o número de telefone que será usado para o WhatsApp Business
2. **IMPORTANTE**: Este número NÃO pode estar sendo usado no WhatsApp pessoal
3. Receba o código de verificação via SMS
4. Confirme o número

---

## ⚙️ Configurando Meta Business

### Passo 1: Criar App do Facebook

1. Vá para [developers.facebook.com](https://developers.facebook.com)
2. Clique em **"Meus Apps"**
3. Clique em **"Criar App"**
4. Escolha **"Business"** como tipo de app
5. Preencha:
   - **Nome do App**: MuhlStore WhatsApp
   - **Email de contato**: seu-email@empresa.com
   - **Categoria**: E-commerce ou Varejo

### Passo 2: Adicionar Produto WhatsApp

1. No dashboard do seu app, clique em **"+ Adicionar Produto"**
2. Encontre **"WhatsApp Business"** e clique em **"Configurar"**
3. Aceite os termos de uso

### Passo 3: Configurar Número de Telefone

1. Na seção WhatsApp, clique em **"Começar"**
2. Adicione o mesmo número verificado anteriormente
3. Aguarde a verificação (pode levar alguns minutos)

---

## 🔑 Obtendo Credenciais da API

### Passo 1: Token de Acesso Temporário

1. No painel do WhatsApp Business API, vá para **"Configurações"**
2. Clique em **"Tokens de acesso"**
3. Copie o **"Token de acesso temporário"**
   - ⚠️ **IMPORTANTE**: Este token expira em 24 horas!

### Passo 2: Phone Number ID

1. Na seção **"WhatsApp"** > **"Configurações"**
2. Encontre o campo **"ID do número de telefone"**
3. Copie este ID (formato: números longos)

### Passo 3: Webhook Secret

1. Vá para **"Configurações"** > **"Webhooks"**
2. Clique em **"Configurar webhooks"**
3. Crie um **"Segredo do webhook"** personalizado
4. Anote este segredo (você precisará dele depois)

### Passo 4: Token Permanente (Opcional mas Recomendado)

Para produção, você precisará de um token permanente:

1. No Business Manager, vá para **"Configurações"** > **"Usuários"**
2. Adicione um **"Administrador do Sistema"**
3. Vá para **"Apps"** > **"WhatsApp Business"**
4. Gere um **"Token de acesso do sistema"**
5. Este token não expira, mas tem limitações de uso

---

## 🔗 Configurando Webhook

### Passo 1: URL do Webhook

O MuhlStore já vem com um servidor de webhook configurado. A URL será:

```
https://seu-dominio.com:3002/webhook
```

**Exemplo:**
```
https://muhlstore.re9suainternet.com.br:3002/webhook
```

### Passo 2: Configurar no Meta Business

1. No painel do WhatsApp Business API
2. Vá para **"Configurações"** > **"Webhooks"**
3. Clique em **"Configurar webhooks"**
4. Insira a URL do webhook
5. Use o mesmo **"Segredo do webhook"** criado anteriormente
6. Marque os eventos que deseja receber:
   - ✅ **messages** (mensagens)
   - ✅ **message_deliveries** (entregas)
   - ✅ **message_reads** (leituras)

### Passo 3: Verificar Webhook

1. Clique em **"Verificar e salvar"**
2. O Meta enviará uma requisição GET para seu webhook
3. Se configurado corretamente, você verá ✅ "Webhook verificado"

---

## 🏪 Configuração no MuhlStore

### Passo 1: Acessar Painel Administrativo

1. Acesse: `https://seu-dominio.com/admin/whatsapp-grupos`
2. Faça login como administrador
3. Vá para a aba **"Integração"**

### Passo 2: Preencher Configurações

#### **Webhook Configuration**
- **URL do Webhook**: `https://seu-dominio.com:3002/webhook`
- **Webhook Secret**: O segredo criado no Meta Business

#### **API Configuration**
- **Token da API**: Token de acesso (temporário ou permanente)
- **Phone ID**: ID do número de telefone

#### **Automação**
- **Resposta Automática**: ✅ Ativada
- **Mensagem de Boas-vindas**: Personalize sua mensagem

### Passo 3: Salvar e Testar

1. Clique em **"Salvar Configurações"**
2. Clique em **"Testar Webhook"**
3. Verifique se aparece ✅ "Webhook testado com sucesso!"

---

## 🧪 Testando a Integração

### Teste 1: Verificar Status

1. No painel do MuhlStore, verifique se o status está **"Conectado"**
2. As estatísticas devem aparecer (mesmo que zeradas inicialmente)

### Teste 2: Enviar Mensagem de Teste

1. Vá para a aba **"Mensagens"**
2. No campo **"Enviar Mensagem"**:
   - **Número**: Seu número pessoal (formato: 5511999999999)
   - **Mensagem**: "Teste de integração MuhlStore"
3. Clique em **"Enviar Mensagem"**
4. Verifique se a mensagem chegou no seu WhatsApp

### Teste 3: Comandos Automáticos

Envie uma mensagem para o número do WhatsApp Business com os comandos:

- **!ajuda** - Lista todos os comandos
- **!catalogo** - Recebe catálogo de produtos
- **!contato** - Informações de contato
- **!pedido** - Instruções de como comprar

---

## 🤖 Comandos Automáticos

O sistema vem com comandos automáticos pré-configurados:

### **Comandos Disponíveis**

| Comando | Função | Exemplo |
|---------|--------|---------|
| `!ajuda` | Lista todos os comandos | `!ajuda` |
| `!catalogo` | Envia catálogo de produtos | `!catalogo` |
| `!pedido` | Instruções de como comprar | `!pedido` |
| `!contato` | Informações de contato | `!contato` |
| `!status` | Status dos pedidos do cliente | `!status` |

### **Respostas Automáticas**

O sistema também responde automaticamente a saudações como:
- "Oi", "Olá", "Bom dia", "Boa tarde", "Boa noite"
- "Hello", "Hi", "Hey"
- "E aí", "Salve"

---

## 🔧 Configuração Avançada

### Personalizar Mensagens

Você pode personalizar as mensagens automáticas editando o arquivo:
```
whatsapp-webhook-server.js
```

Procure pelas funções:
- `getCatalogMessage()` - Mensagem do catálogo
- `getOrderMessage()` - Instruções de pedido
- `getContactMessage()` - Informações de contato
- `getWelcomeMessage()` - Mensagem de boas-vindas

### Adicionar Novos Comandos

Para adicionar novos comandos automáticos:

1. Edite a função `processAutomaticCommands()` no arquivo `whatsapp-webhook-server.js`
2. Adicione um novo `case` com seu comando
3. Crie uma função para gerar a resposta
4. Reinicie o servidor: `pm2 restart whatsapp-webhook`

---

## 🚨 Troubleshooting

### Problema: "Webhook não verificado"

**Solução:**
1. Verifique se a porta 3002 está aberta no firewall
2. Confirme se a URL está acessível publicamente
3. Teste: `curl -X GET "https://seu-dominio.com:3002/webhook?hub.mode=subscribe&hub.verify_token=seu-secret&hub.challenge=test"`

### Problema: "Token inválido"

**Solução:**
1. Verifique se o token não expirou (tokens temporários expiram em 24h)
2. Gere um novo token no Meta Business
3. Atualize no painel do MuhlStore

### Problema: "Mensagens não chegam"

**Solução:**
1. Verifique os logs do webhook: `pm2 logs whatsapp-webhook`
2. Confirme se o webhook está recebendo dados
3. Teste enviando uma mensagem manual primeiro

### Problema: "Comandos não funcionam"

**Solução:**
1. Verifique se a resposta automática está ativada
2. Confirme se os comandos estão sendo processados nos logs
3. Teste com mensagens simples primeiro

---

## 📊 Monitoramento

### Logs do Webhook

Para monitorar o funcionamento:

```bash
# Ver logs em tempo real
pm2 logs whatsapp-webhook

# Ver apenas erros
pm2 logs whatsapp-webhook --err

# Ver status do processo
pm2 status whatsapp-webhook
```

### Estatísticas no Painel

O painel administrativo mostra:
- Total de mensagens
- Mensagens recebidas vs enviadas
- Contatos únicos
- Mensagens de hoje

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca compartilhe** tokens de acesso
2. **Use HTTPS** para todas as URLs
3. **Monitore** o uso da API (há limites)
4. **Mantenha** tokens atualizados
5. **Configure** firewall para porta 3002

### Limites da API

- **1.000 mensagens/dia** (gratuito)
- **Rate limiting**: 80 mensagens/segundo
- **Templates** obrigatórios para mensagens promocionais

---

## 📞 Suporte

### Recursos Úteis

- **Documentação Meta**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Logs do Sistema**: `pm2 logs`
- **Status dos Serviços**: `pm2 status`

### Contato

Para suporte técnico:
1. Verifique os logs primeiro
2. Consulte este manual
3. Abra uma issue no repositório do projeto

---

## ✅ Checklist Final

Antes de considerar a integração completa:

- [ ] Conta WhatsApp Business criada e verificada
- [ ] App Meta Business configurado
- [ ] Token de acesso obtido
- [ ] Phone ID copiado
- [ ] Webhook configurado e verificado
- [ ] Configurações salvas no MuhlStore
- [ ] Teste de envio realizado com sucesso
- [ ] Comandos automáticos funcionando
- [ ] Logs sendo gerados corretamente
- [ ] Estatísticas aparecendo no painel

**🎉 Parabéns! Sua integração WhatsApp Business está funcionando!**
