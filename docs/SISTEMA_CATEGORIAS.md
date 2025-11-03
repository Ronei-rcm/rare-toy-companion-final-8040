# 🎯 Sistema de Categorias - MuhlStore

## 📋 Visão Geral

Sistema completo de gerenciamento de categorias de produtos integrado ao painel administrativo e à página inicial da loja.

**Data de Implementação:** 13 de Outubro de 2025

---

## ✨ Funcionalidades Implementadas

### 🗄️ **Banco de Dados**
- ✅ Tabela `categorias` com 15 categorias pré-configuradas
- ✅ Suporte para:
  - Ícones personalizados (emoji)
  - Cores gradientes customizadas
  - Upload de imagens
  - Ordenação personalizada
  - Ativação/desativação
  - Meta tags para SEO
  - Slug automático

### 🔌 **API Completa (REST)**

#### **Rotas Públicas**
```javascript
GET /api/categorias
// Retorna categorias ativas com estatísticas de produtos
```

#### **Rotas Administrativas** (Autenticadas)
```javascript
GET    /api/categorias/gerenciaveis      // Listar todas (admin)
GET    /api/categorias/:id               // Buscar por ID
POST   /api/categorias                   // Criar nova
PUT    /api/categorias/:id               // Atualizar
DELETE /api/categorias/:id               // Deletar (se sem produtos)
PATCH  /api/categorias/:id/ordem         // Atualizar ordem
PATCH  /api/categorias/:id/toggle        // Ativar/desativar
```

### 🎨 **Painel Administrativo**

**Rota:** `/admin/categorias`

**Funcionalidades:**
- ✅ Grid visual com cards coloridos
- ✅ Pesquisa em tempo real
- ✅ Criar/Editar/Deletar categorias
- ✅ Upload de imagem para cada categoria
- ✅ Seletor de ícones (23 opções pré-definidas)
- ✅ Seletor de cores gradientes (12 opções)
- ✅ Controle de ordem de exibição
- ✅ Toggle ativo/inativo
- ✅ Estatísticas em tempo real (quantidade de produtos, preços, avaliações)
- ✅ Proteção contra exclusão (não permite deletar se há produtos)
- ✅ Configurações de SEO (meta title, description, keywords)

### 🏠 **Visualização na Home**

**Componente:** `CategoriasVisuais.tsx`

**Melhorias:**
- ✅ Suporte para imagem de fundo personalizada
- ✅ Fallback para gradiente colorido
- ✅ Lazy loading de imagens
- ✅ Overlay escuro para melhor legibilidade
- ✅ Animações suaves com Framer Motion
- ✅ Responsivo (1-5 colunas dependendo do tamanho da tela)
- ✅ Cards interativos com hover effects
- ✅ Estatísticas de produtos exibidas
- ✅ Filtros rápidos (mais populares, lançamentos, preço, avaliação)

---

## 📊 Estrutura da Tabela

```sql
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  icon VARCHAR(50) DEFAULT '📦',
  cor VARCHAR(100) DEFAULT 'from-purple-500 to-purple-600',
  imagem_url VARCHAR(500),
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### **Índices Criados:**
- `idx_slug` - Busca por slug
- `idx_ativo` - Filtro de status
- `idx_ordem` - Ordenação
- `idx_categorias_nome` - Busca por nome
- `idx_categorias_ativo_ordem` - Composto para listagem

---

## 🎨 Categorias Pré-Configuradas

| Nome | Ícone | Gradiente | Ordem |
|------|-------|-----------|-------|
| Action Figures | ⚔️ | from-blue-500 to-blue-600 | 1 |
| Colecionáveis | 👑 | from-purple-500 to-purple-600 | 2 |
| Vintage | ⭐ | from-yellow-500 to-orange-500 | 3 |
| Gaming | 🎮 | from-green-500 to-green-600 | 4 |
| Edição Limitada | 🛡️ | from-red-500 to-red-600 | 5 |
| Bonecos de Ação | 🤖 | from-indigo-500 to-indigo-600 | 6 |
| Carrinhos | 🚗 | from-orange-500 to-orange-600 | 7 |
| Bonecas | 👸 | from-pink-500 to-pink-600 | 8 |
| Jogos | 🎲 | from-teal-500 to-teal-600 | 9 |
| Star Wars | 🌟 | from-slate-700 to-slate-900 | 10 |
| Marvel | 🦸 | from-red-600 to-red-800 | 11 |
| DC Comics | 🦇 | from-blue-700 to-blue-900 | 12 |
| Transformers | 🤖 | from-gray-600 to-gray-800 | 13 |
| Dragon Ball | 🐉 | from-orange-500 to-orange-700 | 14 |
| Pokemon | ⚡ | from-yellow-400 to-yellow-600 | 15 |

---

## 🔧 Integrações

### **Com Produtos**
- Contagem automática de produtos por categoria
- Estatísticas de preço (mínimo/máximo)
- Média de avaliações
- Data do último produto adicionado

### **Com Home Config**
- Sincronizado com o contexto `HomeConfigContext`
- Controle de exibição via configurações da home
- Títulos e subtítulos editáveis

---

## 🚀 Como Usar

### **Como Administrador:**

1. Acesse `/admin/categorias`
2. Clique em "Nova Categoria"
3. Preencha:
   - Nome (obrigatório)
   - Descrição
   - Selecione um ícone
   - Escolha uma cor
   - Faça upload de uma imagem (opcional)
   - Configure a ordem
   - Adicione meta tags para SEO (opcional)
4. Salve

**Para editar:**
- Clique no botão "Editar" no card da categoria
- Faça as alterações
- Salve

**Para desativar:**
- Clique no ícone de olho (👁️) para toggle

**Para deletar:**
- Só é possível se não houver produtos associados
- Clique no ícone de lixeira

### **Como Cliente:**

As categorias aparecem automaticamente na página inicial (home), ordenadas pela configuração definida no admin.

---

## 📁 Arquivos Modificados/Criados

### **Banco de Dados:**
- `database/migrations/009_create_categorias_table.sql`

### **Backend:**
- `server/server.cjs` (linhas 571-948) - API de categorias

### **Frontend:**
```
src/
├── pages/admin/
│   └── CategoriasAdmin.tsx (NOVO)
├── components/
│   ├── admin/AdminLayout.tsx (atualizado)
│   └── sections/CategoriasVisuais.tsx (evoluído)
├── hooks/
│   └── useCategories.ts (já existente, compatível)
└── App.tsx (rota adicionada)
```

### **Documentação:**
- `docs/SISTEMA_CATEGORIAS.md` (este arquivo)

---

## 🎯 Benefícios

✅ **Gerenciamento Visual** - Interface intuitiva sem necessidade de código
✅ **SEO Otimizado** - Meta tags configuráveis por categoria
✅ **Performance** - Lazy loading e cache inteligente
✅ **Flexibilidade** - Imagens ou gradientes, você escolhe
✅ **Sincronização** - Produtos sincronizados automaticamente
✅ **Responsivo** - Funciona perfeitamente em mobile
✅ **Acessível** - Componentes com suporte ARIA

---

## 🔐 Segurança

- ✅ Rotas administrativas protegidas com autenticação
- ✅ Validação de dados no backend
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ Verificação de duplicatas (nome e slug únicos)
- ✅ Proteção contra exclusão acidental (verifica produtos associados)

---

## 🎨 Paleta de Cores Disponíveis

1. **Azul** - `from-blue-500 to-blue-600`
2. **Roxo** - `from-purple-500 to-purple-600`
3. **Amarelo/Laranja** - `from-yellow-500 to-orange-500`
4. **Verde** - `from-green-500 to-green-600`
5. **Vermelho** - `from-red-500 to-red-600`
6. **Índigo** - `from-indigo-500 to-indigo-600`
7. **Laranja** - `from-orange-500 to-orange-600`
8. **Rosa** - `from-pink-500 to-pink-600`
9. **Teal** - `from-teal-500 to-teal-600`
10. **Âmbar** - `from-amber-500 to-amber-600`
11. **Cinza Escuro** - `from-slate-700 to-slate-900`
12. **Azul Escuro** - `from-blue-700 to-blue-900`

---

## 🧪 Testes Realizados

✅ Criação de categoria com todos os campos
✅ Edição de categoria existente
✅ Upload de imagem
✅ Toggle ativo/inativo
✅ Tentativa de deletar categoria com produtos (bloqueado)
✅ Deleção de categoria sem produtos
✅ Visualização na home com gradiente
✅ Visualização na home com imagem
✅ Responsividade mobile
✅ Sincronização com produtos
✅ Geração automática de slug

---

## 📈 Próximos Passos (Opcional)

- [ ] Drag & drop para reordenação
- [ ] Múltiplos idiomas
- [ ] Analytics por categoria
- [ ] Categorias hierárquicas (subcategorias)
- [ ] Importação/exportação em massa
- [ ] Histórico de alterações

---

## 🆘 Troubleshooting

**Problema:** Categorias não aparecem na home
- **Solução:** Verifique se estão ativas em `/admin/categorias`

**Problema:** Não consigo deletar uma categoria
- **Solução:** Verifique se há produtos associados. Mova os produtos para outra categoria primeiro.

**Problema:** Imagem não aparece
- **Solução:** Verifique se o caminho está correto e se a imagem foi enviada com sucesso

**Problema:** Erro ao criar categoria com nome duplicado
- **Solução:** Cada nome de categoria deve ser único

---

## 👥 Autor

**Sistema desenvolvido por:** AI Assistant
**Data:** 13 de Outubro de 2025
**Versão:** 1.0.0

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Documentação técnica do projeto
- Logs do servidor em `logs/`
- Console do navegador (F12)

---

**🎉 Sistema de Categorias Pronto para Produção!**

