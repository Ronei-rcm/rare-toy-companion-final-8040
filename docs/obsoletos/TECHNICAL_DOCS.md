# Documentação Técnica - Rare Toy Companion

## 🏗️ Arquitetura do Sistema

### **Frontend (React + TypeScript)**
```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── sections/       # Seções específicas de páginas
│   └── admin/          # Componentes do painel administrativo
├── pages/              # Páginas da aplicação
│   ├── admin/          # Painel administrativo
│   └── public/         # Páginas públicas
├── api/                # Serviços de API
├── hooks/              # Custom hooks
├── utils/              # Utilitários e helpers
└── types/              # Definições de tipos TypeScript
```

### **Backend (Node.js + Express)**
```
server.cjs              # Servidor principal
├── Middleware          # CORS, validação, upload
├── Routes              # Endpoints da API
├── Database            # Conexão e queries MySQL
└── Utils               # Funções auxiliares
```

## 🗄️ Estrutura do Banco de Dados

### **Tabelas Principais**
```sql
-- Coleções de brinquedos
collections
├── id (VARCHAR)        # UUID único
├── nome (VARCHAR)      # Nome da coleção
├── descricao (TEXT)    # Descrição detalhada
├── imagem_url (VARCHAR) # URL da imagem principal
├── slug (VARCHAR)      # URL amigável
├── ativo (BOOLEAN)     # Status ativo/inativo
├── destaque (BOOLEAN)  # Coleção em destaque
├── ordem (INT)         # Ordem de exibição
├── tags (TEXT)         # Tags separadas por vírgula
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Produtos
products
├── id (VARCHAR)        # UUID único
├── nome (VARCHAR)      # Nome do produto
├── descricao (TEXT)    # Descrição detalhada
├── preco (DECIMAL)     # Preço do produto
├── imagem_url (VARCHAR) # URL da imagem
├── categoria (VARCHAR) # Categoria do produto
├── tags (TEXT)         # Tags separadas por vírgula
├── ativo (BOOLEAN)     # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Relacionamento Coleções-Produtos
collection_products
├── id (VARCHAR)        # UUID único
├── collection_id (VARCHAR) # ID da coleção
├── product_id (VARCHAR)    # ID do produto
├── order_index (INT)   # Ordem na coleção
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### **Tabelas da Página "Sobre"**
```sql
-- Conteúdo das seções
sobre_content
├── id (VARCHAR)        # UUID único
├── section (VARCHAR)   # Nome da seção (hero, valores, etc.)
├── title (VARCHAR)     # Título da seção
├── subtitle (VARCHAR)  # Subtítulo da seção
├── description (TEXT)  # Descrição da seção
├── image_url (VARCHAR) # URL da imagem
├── is_active (BOOLEAN) # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Valores da empresa
company_values
├── id (VARCHAR)        # UUID único
├── title (VARCHAR)     # Título do valor
├── description (TEXT)  # Descrição do valor
├── icon (VARCHAR)      # Ícone (nome do componente)
├── order_index (INT)   # Ordem de exibição
├── is_active (BOOLEAN) # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Membros da equipe
team_members
├── id (VARCHAR)        # UUID único
├── name (VARCHAR)      # Nome do membro
├── position (VARCHAR)  # Cargo/posição
├── description (TEXT)  # Descrição do membro
├── image_url (VARCHAR) # URL da foto
├── icon (VARCHAR)      # Ícone (nome do componente)
├── order_index (INT)   # Ordem de exibição
├── is_active (BOOLEAN) # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Estatísticas da empresa
company_stats
├── id (VARCHAR)        # UUID único
├── title (VARCHAR)     # Título da estatística
├── value (VARCHAR)     # Valor da estatística
├── description (TEXT)  # Descrição da estatística
├── icon (VARCHAR)      # Ícone (nome do componente)
├── order_index (INT)   # Ordem de exibição
├── is_active (BOOLEAN) # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

-- Informações de contato
contact_info
├── id (VARCHAR)        # UUID único
├── title (VARCHAR)     # Título da informação
├── type (VARCHAR)      # Tipo (email, phone, address, etc.)
├── value (VARCHAR)     # Valor da informação
├── icon (VARCHAR)      # Ícone (nome do componente)
├── order_index (INT)   # Ordem de exibição
├── is_active (BOOLEAN) # Status ativo/inativo
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔌 API Endpoints Detalhados

### **Coleções**
| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| GET | `/api/collections` | Listar coleções | `page`, `limit`, `search`, `active`, `featured` |
| POST | `/api/collections` | Criar coleção | `nome`, `descricao`, `imagem_url`, `tags` |
| PUT | `/api/collections/:id` | Atualizar coleção | Todos os campos da coleção |
| DELETE | `/api/collections/:id` | Deletar coleção | - |
| GET | `/api/collections/slug/:slug` | Buscar por slug | - |
| PUT | `/api/collections/reorder` | Reordenar coleções | `collections` (array de IDs) |
| PATCH | `/api/collections/:id` | Atualizar campos específicos | `ativo`, `destaque` |

### **Produtos**
| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| GET | `/api/produtos` | Listar produtos | `page`, `limit`, `search`, `category` |
| POST | `/api/produtos` | Criar produto | `nome`, `descricao`, `preco`, `imagem_url` |
| PUT | `/api/produtos/:id` | Atualizar produto | Todos os campos do produto |
| DELETE | `/api/produtos/:id` | Deletar produto | - |

### **Página Sobre**
| Método | Endpoint | Descrição | Parâmetros |
|--------|----------|-----------|------------|
| GET | `/api/sobre/content` | Conteúdo das seções | - |
| PUT | `/api/sobre/content/:section` | Atualizar seção | `title`, `subtitle`, `description`, `image_url` |
| GET | `/api/sobre/values` | Valores da empresa | - |
| POST | `/api/sobre/values` | Criar valor | `title`, `description`, `icon`, `order_index` |
| PUT | `/api/sobre/values/:id` | Atualizar valor | Todos os campos do valor |
| DELETE | `/api/sobre/values/:id` | Deletar valor | - |

## 🎨 Componentes Frontend

### **Componentes Base (shadcn/ui)**
- `Button` - Botões com variantes
- `Input` - Campos de entrada
- `Textarea` - Área de texto
- `Card` - Cards de conteúdo
- `Dialog` - Modais e diálogos
- `Switch` - Toggle switches
- `Label` - Labels de formulário
- `Select` - Dropdowns
- `Toast` - Notificações

### **Componentes Customizados**
- `BannerToyHeroes` - Banner principal com carrossel
- `CollectionCard` - Card de coleção
- `ProductCard` - Card de produto
- `AdminLayout` - Layout do painel administrativo
- `SobreAdmin` - Gerenciador da página "Sobre"

## 🚀 Scripts de Deploy

### **Desenvolvimento**
```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# Iniciar servidor e frontend
npm run dev:full
```

### **Produção com PM2**
```bash
# Iniciar todos os serviços
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs

# Reiniciar serviços
pm2 restart all

# Parar serviços
pm2 stop all
```

#### Variáveis Frontend
```
VITE_API_URL=/api
```
Após alterar `.env`, rode `npm run build` e reinicie o `web` no PM2.

### **Backup**
```bash
# Gerar backup completo
npm run backup

# O backup será salvo em: backups/backup_YYYY-MM-DD_HH-MM-SS.zip
```

O script `scripts/backup.sh` inclui arquivos de configuração, código e tenta dump do MySQL (docker-compose ou local) conforme variáveis em `.env`.

## 🔧 Configurações de Ambiente

### **Variáveis de Ambiente Necessárias**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=rare_toy_user
DB_PASSWORD=sua_senha
DB_NAME=rare_toy_companion
PORT=3001
NODE_ENV=development
VITE_API_URL=/api
```

### **Configurações de Upload**
- **Diretório**: `./public/lovable-uploads`
- **Tamanho máximo**: 5MB
- **Formatos permitidos**: JPG, PNG, GIF, WebP
- **Validação**: Tipo MIME e extensão

## 🛡️ Segurança

### **Validações Implementadas**
- ✅ Validação de tipos de arquivo
- ✅ Limite de tamanho de upload
- ✅ Sanitização de entradas
- ✅ Validação de campos obrigatórios
- ✅ CORS configurado
- ✅ Rate limiting (configurável)

### **Boas Práticas**
- ✅ Variáveis sensíveis em `.env`
- ✅ Queries parametrizadas
- ✅ Validação de entrada
- ✅ Tratamento de erros
- ✅ Logs de auditoria

## 📊 Monitoramento

### **PM2 Status**
```bash
pm2 status          # Status dos processos
pm2 logs            # Logs em tempo real
pm2 monit           # Monitor visual
pm2 restart all     # Reiniciar todos
```

### **Logs Importantes**
- **API**: Logs de requisições e erros
- **Upload**: Logs de upload de imagens
- **Database**: Logs de conexão e queries
- **Frontend**: Logs de build e erros

## 🔄 Manutenção

### **Atualizações de Dependências**
```bash
# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update

# Atualizar dependências específicas
npm install package@latest
```

### **Limpeza de Cache**
```bash
# Limpar cache do npm
npm cache clean --force

# Limpar node_modules
rm -rf node_modules
npm install
```

### **Backup Regular**
- Execute `npm run backup` regularmente
- Mantenha backups em local seguro
- Teste restauração periodicamente
