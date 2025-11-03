# Configuração do Google Calendar

## 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Calendar:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Calendar API"
   - Clique em "Enable"

## 2. Configurar OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure:
   - Application type: "Web application"
   - Name: "Muhlstore Calendar Integration"
   - Authorized redirect URIs: `http://localhost:3001/api/google/oauth/callback`

## 3. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/google/oauth/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

## 4. Funcionalidades

### Sincronização Automática
- ✅ Criar eventos no Google Calendar
- ✅ Atualizar eventos existentes
- ✅ Deletar eventos do Google Calendar
- ✅ Sincronização em massa

### Interface Admin
- ✅ Configuração de conexão
- ✅ Status da integração
- ✅ Sincronização manual
- ✅ Botões de ação individuais

## 5. Como Usar

1. Acesse `/admin/eventos`
2. Vá para a aba "Google Calendar"
3. Clique em "Conectar Google Calendar"
4. Autorize o acesso à sua conta Google
5. Use "Sincronizar Eventos" para enviar todos os eventos
6. Use os botões de sincronização individuais nos eventos

## 6. Estrutura do Banco

### Tabela: google_calendar_tokens
```sql
CREATE TABLE google_calendar_tokens (
  id INT PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Coluna adicionada em events:
```sql
ALTER TABLE events ADD COLUMN google_event_id VARCHAR(255) NULL;
```

## 7. Segurança

- Os tokens são armazenados de forma segura no banco de dados
- Refresh tokens são usados para renovar automaticamente o acesso
- Apenas o administrador pode configurar a integração



