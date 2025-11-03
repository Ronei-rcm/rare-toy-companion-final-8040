# 👋 Bem-vindo ao Rare Toy Companion!

> **Comece por aqui** - Guia rápido para navegar no projeto

---

## 🎯 Por Onde Começar?

### 📘 Você é um Desenvolvedor Novo?

**Leia nesta ordem:**

1. 📖 [**README.md**](README.md) - Visão geral do projeto (10 min)
2. ⚙️ [**docs/INSTALL.md**](docs/INSTALL.md) - Instalar e configurar (30 min)
3. 🚀 [**docs/guias/INICIO_RAPIDO.md**](docs/guias/INICIO_RAPIDO.md) - Primeiros passos (15 min)
4. 🏗️ [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Entender arquitetura (30 min)
5. 🧪 [**docs/guias/GUIA_DE_TESTES.md**](docs/guias/GUIA_DE_TESTES.md) - Como testar (15 min)

**Tempo total:** ~1h40min para estar produtivo! 🚀

---

### 🧪 Você é um Testador/QA?

**Documentos essenciais:**

1. 📖 [**README.md**](README.md) - Entender o sistema
2. 🧪 [**docs/guias/GUIA_DE_TESTES.md**](docs/guias/GUIA_DE_TESTES.md) - Como testar
3. ✅ [**docs/guias/CHECKLIST_DE_TESTES.md**](docs/guias/CHECKLIST_DE_TESTES.md) - Checklist completo
4. 🔧 [**docs/correções/**](docs/correções/) - Problemas conhecidos e soluções

---

### 📊 Você é Gestor/Product Owner?

**Visão executiva:**

1. 📖 [**README.md**](README.md) - Overview do projeto
2. 📊 [**docs/resumos/RESUMO_COMPLETO_PROJETO.md**](docs/resumos/RESUMO_COMPLETO_PROJETO.md) - Resumo executivo
3. 📝 [**docs/CHANGELOG.md**](docs/CHANGELOG.md) - O que mudou
4. 🎯 [**docs/evoluções/MELHORIAS_ADICIONAIS_SUGERIDAS.md**](docs/evoluções/MELHORIAS_ADICIONAIS_SUGERIDAS.md) - Roadmap

---

### 🏗️ Você é Arquiteto de Software?

**Documentação técnica:**

1. 🏗️ [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) - Arquitetura completa
2. 🗄️ [**database/**](database/) - Schema e migrations
3. 🔐 [**config/**](config/) - Configurações de segurança
4. 📦 [**docs/evoluções/**](docs/evoluções/) - Histórico de implementações

---

## 📚 Navegação Rápida

### 🎯 Principais Documentos

| Documento | O Que É | Link |
|-----------|---------|------|
| **README** | Visão geral do projeto | [README.md](README.md) |
| **Índice Completo** | Todos os documentos catalogados | [DOCS_INDEX.md](DOCS_INDEX.md) |
| **Arquitetura** | Detalhes técnicos | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Instalação** | Como instalar | [INSTALL.md](docs/INSTALL.md) |
| **Changelog** | Histórico de versões | [CHANGELOG.md](docs/CHANGELOG.md) |

### 📂 Documentação por Categoria

| Categoria | Conteúdo | Pasta |
|-----------|----------|-------|
| **Guias** | Como fazer algo (12 docs) | [docs/guias/](docs/guias/) |
| **Evoluções** | Features implementadas (20 docs) | [docs/evoluções/](docs/evoluções/) |
| **Correções** | Soluções de problemas (13 docs) | [docs/correções/](docs/correções/) |
| **Resumos** | Visões executivas (5 docs) | [docs/resumos/](docs/resumos/) |

### 🛠️ Por Funcionalidade

| Funcionalidade | Documentação | Link |
|----------------|--------------|------|
| 🛒 **Carrinho** | Sistema avançado v3.0 | [docs/evoluções/EVOLUCAO_CARRINHO_AVANCADO_v3.0.md](docs/evoluções/EVOLUCAO_CARRINHO_AVANCADO_v3.0.md) |
| 👤 **Minha Conta** | Área do cliente | [docs/evoluções/EVOLUCAO_MINHA_CONTA_COMPLETA.md](docs/evoluções/EVOLUCAO_MINHA_CONTA_COMPLETA.md) |
| 📦 **Produtos** | Gestão de produtos | [docs/evoluções/EVOLUCAO_PRODUTOS_PREMIUM.md](docs/evoluções/EVOLUCAO_PRODUTOS_PREMIUM.md) |
| 💰 **Financeiro** | Módulo financeiro | [docs/MODULO_FINANCEIRO_PROFISSIONAL.md](docs/MODULO_FINANCEIRO_PROFISSIONAL.md) |
| 📋 **Pedidos** | Gestão de pedidos | [docs/evoluções/EVOLUCAO_PEDIDOS_ADMIN.md](docs/evoluções/EVOLUCAO_PEDIDOS_ADMIN.md) |
| 📱 **WhatsApp** | Integração WhatsApp | [docs/guias/MANUAL_WHATSAPP.md](docs/guias/MANUAL_WHATSAPP.md) |

---

## 🚀 Primeiros Comandos

### Instalar e Iniciar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp env.example .env

# 3. Iniciar banco de dados
npm run docker:up

# 4. Executar migrations
npm run db:migrate

# 5. Iniciar aplicação completa
npm run dev:full
```

### Acessar

- **Frontend:** http://localhost:8040
- **Backend API:** http://localhost:3001
- **Admin:** http://localhost:8040/admin/login

### Testar

```bash
# Executar todos os testes
npm test

# Testes com UI
npm run test:ui

# Testes com coverage
npm run test:coverage
```

---

## 🔍 Procurando Algo Específico?

### Use o Índice Completo

📇 [**DOCS_INDEX.md**](DOCS_INDEX.md) - Índice centralizado de TODA documentação (60+ documentos)

### Atalhos Rápidos

- 🐛 **Encontrou um bug?** → [docs/correções/](docs/correções/)
- 📝 **Como fazer X?** → [docs/guias/](docs/guias/)
- 🆕 **O que há de novo?** → [docs/CHANGELOG.md](docs/CHANGELOG.md)
- 🏗️ **Como funciona?** → [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 🧪 **Como testar?** → [docs/guias/GUIA_DE_TESTES.md](docs/guias/GUIA_DE_TESTES.md)

---

## 🎯 Tarefas Comuns

### Desenvolvimento

```bash
# Iniciar desenvolvimento
npm run dev:full

# Apenas frontend
npm run dev

# Apenas backend
npm run server

# Build de produção
npm run build:prod
```

### Banco de Dados

```bash
# Backup
npm run db:backup

# Restore
npm run db:restore

# Migrations
npm run db:migrate
```

### PM2 (Produção)

```bash
# Iniciar processos
npm run pm2:start

# Ver status
npm run pm2:status

# Ver logs
npm run pm2:logs

# Restart
npm run pm2:restart
```

### Testes

```bash
# Testes unitários
npm test

# Testes com watch
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 📦 Estrutura do Projeto

```
rare-toy-companion-final-8040/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços de API
│   └── hooks/             # Custom hooks
│
├── server/                # Backend Node.js + Express
│   ├── server.cjs         # Servidor principal
│   └── routes/            # Rotas da API
│
├── config/                # Configurações
│   ├── security.cjs       # Segurança
│   └── logger.cjs         # Logs
│
├── database/              # Banco de dados
│   ├── init.sql           # Schema inicial
│   └── migrations/        # Migrations SQL
│
├── docs/                  # 📚 Documentação
│   ├── guias/            # Guias práticos
│   ├── evoluções/        # Histórico de features
│   ├── correções/        # Troubleshooting
│   └── resumos/          # Resumos executivos
│
└── public/               # Assets públicos
```

---

## 🆘 Precisa de Ajuda?

### Documentação

1. 📇 Consulte o [**DOCS_INDEX.md**](DOCS_INDEX.md) - Índice completo
2. 🔍 Busque em [**docs/correções/**](docs/correções/) - Problemas comuns
3. 📖 Leia o [**README.md**](README.md) - Overview geral

### Suporte

- 📧 Email: suporte@muhlstore.com.br
- 💬 Slack: #dev-suporte
- 📱 WhatsApp: (número)
- 🌐 Site: https://muhlstore.re9suainternet.com.br

### Criar Issue

Se não encontrou solução, crie uma issue no repositório com:
- ✅ Descrição clara do problema
- ✅ Passos para reproduzir
- ✅ Comportamento esperado vs atual
- ✅ Screenshots se aplicável
- ✅ Logs relevantes

---

## 💡 Dicas Úteis

### Para Desenvolvedores

1. ✅ Use o VS Code com extensões recomendadas
2. ✅ Configure o ESLint e Prettier
3. ✅ Rode testes antes de commitar
4. ✅ Consulte ARCHITECTURE.md para entender o sistema
5. ✅ Use TypeScript e siga as convenções

### Para QA

1. ✅ Sempre use o checklist de testes
2. ✅ Documente bugs com prints e logs
3. ✅ Teste em múltiplos browsers
4. ✅ Verifique mobile e desktop
5. ✅ Valide acessibilidade

### Para Todos

1. ✅ Mantenha a documentação atualizada
2. ✅ Siga as convenções de código
3. ✅ Faça commits descritivos
4. ✅ Revise PRs com atenção
5. ✅ Comunique mudanças importantes

---

## 📈 Status do Projeto

### Versão Atual: 2.0.0

- ✅ **Status:** Produção
- ✅ **Estabilidade:** Alta
- ✅ **Cobertura de Testes:** 70%+
- ✅ **Documentação:** 90%+
- ✅ **Performance:** Excelente
- ✅ **Segurança:** Robusta

### Últimas Atualizações

- 🎉 **21/10/2025** - Documentação completamente reorganizada
- 🛒 **10/10/2025** - Carrinho v3.0 lançado
- 💰 **Outubro/2025** - Módulo financeiro profissional
- 📦 **Setembro/2025** - Controle de estoque premium

Ver histórico completo: [CHANGELOG.md](docs/CHANGELOG.md)

---

## 🎉 Pronto para Começar!

Agora que você sabe por onde começar, escolha o caminho apropriado acima e comece a explorar!

**Dica:** Comece sempre pelo [**README.md**](README.md) para ter uma visão geral do projeto.

---

## 🔗 Links Importantes

### Documentação Principal
- 📖 [README.md](README.md)
- 📇 [DOCS_INDEX.md](DOCS_INDEX.md)
- 🏗️ [ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Guias Essenciais
- 🚀 [Início Rápido](docs/guias/INICIO_RAPIDO.md)
- ⚙️ [Instalação](docs/INSTALL.md)
- 🧪 [Guia de Testes](docs/guias/GUIA_DE_TESTES.md)

### Referências
- 📝 [Changelog](docs/CHANGELOG.md)
- 🛠️ [Scripts NPM](docs/SCRIPTS.md)
- 📂 [Organização Docs](docs/ORGANIZACAO_DOCUMENTACAO.md)

---

**Bem-vindo ao time! 🚀**

**Última Atualização:** 21 de Outubro de 2025

**[⬆ Voltar ao topo](#-bem-vindo-ao-rare-toy-companion)**

