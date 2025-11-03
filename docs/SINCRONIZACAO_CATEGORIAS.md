# 🔄 Sincronização de Categorias

## 📋 Visão Geral

Sistema de sincronização automática entre a tabela `categorias` e as categorias utilizadas nos produtos.

**Data de Criação:** 13 de Outubro de 2025

---

## 🎯 Objetivo

Garantir que todas as categorias usadas em produtos existam na tabela `categorias` e vice-versa, mantendo o sistema sempre sincronizado.

---

## 🚀 Como Usar

### **Executar Sincronização Manual:**

```bash
npm run sync:categorias
```

Ou diretamente:

```bash
node scripts/sync-categorias.cjs
```

---

## 📊 O Que o Script Faz

### **1. Verificação**
- ✅ Conecta ao banco de dados
- ✅ Verifica se a tabela `categorias` existe
- ✅ Lista todas as tabelas disponíveis

### **2. Análise**
- 📦 Busca categorias únicas nos produtos
- 📋 Busca categorias na tabela `categorias`
- 🔍 Identifica categorias que faltam

### **3. Criação Automática**
- ➕ Cria categorias que existem em produtos mas não na tabela
- 🎨 Gera slug automaticamente
- 📝 Adiciona descrição padrão
- 📊 Define ordem sequencial

### **4. Estatísticas**
- 📈 Conta produtos por categoria
- 💰 Mostra faixas de preço
- ⭐ Exibe médias de avaliações

---

## 📁 Estrutura do Script

```
scripts/sync-categorias.cjs
├── Conexão com MySQL
├── Verificação de tabelas
├── Busca de categorias em produtos
├── Comparação com tabela categorias
├── Criação de categorias faltantes
├── Atualização de estatísticas
└── Relatório de sincronização
```

---

## 🔌 APIs de Categorias

### **Para Uso Público:**

```javascript
GET /api/categorias
// Retorna todas as categorias ativas com estatísticas

GET /api/categorias/nomes
// Retorna apenas array de nomes (para dropdowns)

GET /api/categorias/lista  
// Retorna categorias com ícones e cores (para selects)
```

### **Para Uso Administrativo:**

```javascript
GET    /api/categorias/gerenciaveis
POST   /api/categorias
PUT    /api/categorias/:id
DELETE /api/categorias/:id
PATCH  /api/categorias/:id/ordem
PATCH  /api/categorias/:id/toggle
```

---

## 🎯 Regras de Sincronização

### **Criação de Categorias:**
1. Categoria encontrada em produto mas não na tabela
2. Slug gerado automaticamente (lowercase, sem acentos)
3. Ícone padrão: 📦
4. Cor padrão: from-purple-500 to-purple-600
5. Status: Ativo
6. Ordem: Final da lista (100+)

### **Validação:**
- ✅ Nome único
- ✅ Slug único
- ✅ Mínimo 2 caracteres
- ✅ Sem caracteres especiais no slug

---

## 📊 Exemplo de Saída

```bash
$ npm run sync:categorias

🔧 Configuração MySQL: { host: '127.0.0.1', user: 'root', ... }
🔄 Iniciando sincronização de categorias...

🔍 Conectado ao banco: rare_toy_companion
🔍 Tabelas disponíveis: 36
🔍 Tem categorias? SIM

📦 Categorias encontradas em produtos: 3
   - Action Figures
   - Bonecos de Ação
   - Star Wars

📋 Categorias na tabela: 15

ℹ️  Nenhuma categoria nova precisou ser criada

📊 Atualizando estatísticas...
   Action Figures: 5 produto(s)
   Bonecos de Ação: 3 produto(s)
   Star Wars: 12 produto(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sincronização concluída com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Integração com Produtos

### **Ao Criar Produto:**

O formulário de produtos deve usar o endpoint para listar categorias:

```javascript
// Buscar categorias para dropdown
fetch('/api/categorias/nomes')
  .then(res => res.json())
  .then(nomes => {
    // nomes = ["Action Figures", "Vintage", ...]
  });
```

### **Validação:**

O backend deve validar se a categoria existe:

```javascript
// Exemplo de validação
const [categoria] = await pool.execute(
  'SELECT id FROM categorias WHERE nome = ? AND ativo = TRUE',
  [nomeCategoria]
);

if (!categoria.length) {
  throw new Error('Categoria inválida ou inativa');
}
```

---

## 📅 Quando Executar

### **Manualmente:**
- Após importação em massa de produtos
- Quando adicionar produtos de nova categoria
- Para sincronizar dados migrados

### **Automaticamente (Futuro):**
- Trigger no banco de dados
- Cron job diário
- Webhook após cadastro de produto

---

## ⚠️ Importante

### **Não Delete Categorias com Produtos:**
O sistema impede deletar categorias que têm produtos associados.

Para deletar:
1. Mover produtos para outra categoria
2. Ou inativar a categoria (não deleta, apenas oculta)

### **Backup Antes de Sincronizar:**
Sempre faça backup antes de sincronizações em massa:

```bash
mysqldump -u root rare_toy_companion categorias > backup_categorias.sql
```

---

## 🔮 Próximas Melhorias

- [ ] Sincronização automática ao criar produto
- [ ] Detecção de categorias órfãs
- [ ] Merge de categorias similares
- [ ] Tradução automática de nomes
- [ ] Sugestões de ícones com IA
- [ ] Import/export de categorias
- [ ] Validação em tempo real no frontend

---

## 📞 Troubleshooting

**Problema:** Script não encontra tabela categorias  
**Solução:** Execute a migração primeiro: `mysql -u root rare_toy_companion < database/migrations/009_create_categorias_table.sql`

**Problema:** Categoria duplicada  
**Solução:** Verifique se o nome já existe com outro slug

**Problema:** Categoria não aparece no dropdown  
**Solução:** Verifique se está ativa: `UPDATE categorias SET ativo = TRUE WHERE nome = 'X'`

---

## 👥 Autor

**Desenvolvido por:** AI Assistant  
**Data:** 13 de Outubro de 2025  
**Versão:** 1.0.0  

---

**🔄 Mantenha seu sistema sempre sincronizado! 🔄**

