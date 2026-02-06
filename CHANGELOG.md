# 📝 Changelog - MuhlStore

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.9.0] - 2026-02-06

### ✨ Adicionado
- **Importação de extrato CSV (financeiro)**
  - Preview com colunas Valor Bruto (R$) e Valor Líquido (R$) no modal de importação
  - Importação fiel: todas as transações do preview são importadas (vendas com mesmo valor não são tratadas como duplicata)
  - Coluna `valor_bruto` em `financial_transactions` (migration 021) e coluna `hora` (migration 022)
  - Tabela de transações e exportação CSV/JSON com Valor Bruto, Valor Líquido e Taxa (R$)
- **Resiliência de schema**
  - GET/POST de transações e importação funcionam com tabela usando `forma_pagamento` ou `metodo_pagamento`
  - Fallbacks quando colunas `hora` ou `valor_bruto` não existem; fallback final com `SELECT *` na listagem
  - ENUM `tipo` normalizado para 'Entrada'/'Saída' no INSERT

### 🔧 Corrigido
- **Importação CSV:** erro "Unknown column 'metodo_pagamento'" em bancos com coluna `forma_pagamento`; fallback para INSERT com `forma_pagamento`
- **500 em GET /api/financial/transactions:** múltiplos fallbacks de query conforme colunas existentes
- **PUT/POST de transações:** fallback sem coluna `hora` quando a migration 022 não foi aplicada
- **Feedback na importação:** toast com "X de Y importadas" e lista de erros quando há falhas

### 🎨 Melhorado
- **Logs em produção:** mensagens de Service Worker/SSL e de imagens quebradas apenas em desenvolvimento
- **Normalização de linhas:** função `normalizeFinancialRow` para resposta estável e segura da API de transações

### 📚 Documentação
- Criado `docs/evoluções/IMPORTACAO_EXTRATO_CSV_FEV_2026.md` (importação CSV, valor bruto/líquido, migrations, resiliência de schema)
- CHANGELOG e DOCS_INDEX atualizados

---

## [1.8.0] - 2026-01-18

### ✨ Adicionado
- **Novos Badges "Novo" e "Seminovo"**
  - Badge verde "Novo" para produtos novos/lacrados
  - Badge laranja "Seminovo" para produtos usados/bom estado
  - Colunas `novo` e `seminovo` na tabela `produtos`
  - Switches no modal "Editar Produto" do Controle de Estoque
  - Preview em tempo real dos badges ativos

### 🔧 Corrigido
- **Centralização dos Modais do Controle de Estoque**
  - Ajustar Estoque: agora centralizado
  - Movimentar: agora centralizado
  - Editar Produto: agora centralizado
  - Excluir: agora centralizado
  - Aplicado `position: fixed` + `transform: translate(-50%, -50%)`

### 🎨 Melhorado
- **Tamanhos dos Modais**
  - Ajustar Estoque: pequeno (max-w-md)
  - Movimentar: médio (max-w-lg)
  - Editar Produto: grande (max-w-4xl)
  - Excluir: médio (max-w-lg)

### 📚 Documentação
- Criado `docs/evoluções/EVOLUCAO_CONTROLE_ESTOQUE_BADGES.md`
- Criado `docs/resumos/RESUMO_SESSAO_18_JAN_2026.md`
- Atualizado CHANGELOG.md

---

## [1.7.0] - 2026-01-17

### 🔧 Corrigido
- **Login Admin**
  - Corrigido hash de senha para bcrypt
  - Senha resetada para admin123
  - Debug logs adicionados

- **Proxy Frontend**
  - Substituído http-proxy-middleware por proxy manual HTTP
  - Corrigido forwarding de POST requests
  - Body parsing implementado

### 🐛 Bugs Corrigidos
- Menu duplo em páginas admin (DatabaseBackup, Relatorios)
- Backup de banco de dados não gerando arquivo
- APIs retornando HTML ao invés de JSON

---

## [1.6.0] - 2026-01-10

### ✨ Adicionado
- **Sistema de Backup de Banco de Dados**
  - Página de gerenciamento de backups
  - Criação manual de backups
  - Restauração de backups
  - Download de backups
  - Exclusão de backups

### 📚 Documentação
- Criado `docs/modulos/MODULO_BACKUP_RESTAURACAO.md`
- Criado `docs/resumos/RESUMO_MODULO_BACKUP_CRIACAO.md`

---

## [1.5.0] - 2025-10-10

### ✨ Adicionado
- **Sistema de Badges para Produtos**
  - Condição: novo, seminovo, colecionável, usado
  - Badges especiais: destaque, promoção, lançamento
  - Componentes: BadgeSelector, ProductBadges
  - Endpoints: /api/badges, /api/produtos/:id/badges, /api/produtos/:id/condicao

### 🔧 Melhorado
- **Admin - Produtos**
  - Modal de edição com abas (Básico, Preço, Imagens, Extras)
  - Integração com sistema de badges
  - Layout organizado e responsivo

### 📚 Documentação
- Criado `docs/evoluções/EVOLUCAO_ADMIN_PRODUTOS_BADGES.md`
- Criado `docs/resumos/RESUMO_BADGES_CRIACAO.md`

---

## [1.4.0] - 2025-10-09

### 🎉 Adicionado
- **Carrinho de Compras Completo**
  - 13 novos componentes criados
  - Sistema de imagens otimizado com lazy loading
  - 8 tipos de mensagens contextuais de incentivo
  - Sistema de recuperação de carrinho abandonado
  - Sugestões inteligentes de produtos
  - Feedbacks visuais aprimorados
  - Mobile otimizado com gestos
  - 100% acessibilidade WCAG 2.1 AA
  - Sincronização perfeita entre drawer, página e header
  - Tabela customer_addresses criada
  - Endpoint de endereços implementado

### 📚 Documentação
- 10 documentos técnicos criados sobre o carrinho

---

## [1.3.0] - Data Anterior

### ✨ Adicionado
- Sistema de produtos
- Categorias
- Painel administrativo
- Autenticação
- Dashboard

### 🔧 Corrigido
- Diversos bugs de API
- Problemas de cache
- Erros de servidor

---

## Formato

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- **✨ Adicionado** - para novas funcionalidades
- **🔧 Corrigido** - para correções de bugs
- **🎨 Melhorado** - para mudanças em funcionalidades existentes
- **🐛 Bugs Corrigidos** - para bugs corrigidos
- **📚 Documentação** - para mudanças na documentação
- **⚡ Performance** - para melhorias de performance
- **🚨 Segurança** - para correções de segurança
