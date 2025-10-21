# 📂 Organização da Documentação - Rare Toy Companion

> **Guia de Manutenção** - Como manter a documentação organizada e atualizada

---

## 🎯 Estrutura Atual

A documentação do projeto está organizada da seguinte forma:

```
/
├── README.md                    # ✅ Documento principal do projeto
├── DOCS_INDEX.md               # ✅ Índice centralizado
│
└── docs/
    ├── ARCHITECTURE.md          # ✅ Arquitetura técnica
    ├── INSTALL.md              # ✅ Guia de instalação
    ├── SCRIPTS.md              # ✅ Referência de scripts
    ├── CHANGELOG.md            # ✅ Histórico de versões
    │
    ├── 📁 guias/               # ✅ Guias práticos de uso
    │   ├── INICIO_RAPIDO.md
    │   ├── GUIA_DE_TESTES.md
    │   ├── MANUAL_WHATSAPP.md
    │   └── ... (12 guias)
    │
    ├── 📁 evoluções/           # ✅ Histórico de evoluções
    │   ├── EVOLUCAO_CARRINHO_AVANCADO_v3.0.md
    │   ├── EVOLUCAO_MINHA_CONTA_COMPLETA.md
    │   └── ... (20 documentos)
    │
    ├── 📁 correções/           # ✅ Correções aplicadas
    │   ├── CORRECAO_SERVICE_WORKER_502.md
    │   ├── CORRECAO_ESTOQUE_FINAL.md
    │   └── ... (13 correções)
    │
    ├── 📁 resumos/             # ✅ Resumos executivos
    │   ├── RESUMO_COMPLETO_PROJETO.md
    │   ├── RESUMO_EVOLUCAO_CARRINHO_v3.0.md
    │   └── ... (4 resumos)
    │
    ├── 📁 obsoletos/           # 📦 Docs antigos (manter para histórico)
    │   └── ... (30 documentos)
    │
    └── 📁 temporarios/         # 🗑️ Docs temporários (podem ser removidos)
        └── ... (110 documentos)
```

---

## ✅ Documentação Organizada

### 📘 Principais (Raiz e docs/)

Documentos essenciais e sempre atualizados:

1. **README.md** - Documento principal do projeto
2. **DOCS_INDEX.md** - Índice centralizado de toda documentação
3. **docs/ARCHITECTURE.md** - Arquitetura técnica detalhada
4. **docs/INSTALL.md** - Guia completo de instalação
5. **docs/SCRIPTS.md** - Referência de scripts NPM
6. **docs/CHANGELOG.md** - Histórico de todas as versões

### 📁 Por Categoria

#### Guias Práticos (`docs/guias/`)
- ✅ 12 guias ativos e organizados
- ✅ Prontos para uso imediato
- ✅ Cobrem todos os principais módulos

#### Evoluções (`docs/evoluções/`)
- ✅ 20 documentos de evolução
- ✅ Histórico completo de implementações
- ✅ Detalhes técnicos de cada feature

#### Correções (`docs/correções/`)
- ✅ 13 documentos de correções
- ✅ Soluções para problemas conhecidos
- ✅ Troubleshooting detalhado

#### Resumos (`docs/resumos/`)
- ✅ 4 resumos executivos principais
- ✅ Visão geral de alto nível
- ✅ Ideal para gestores e stakeholders

---

## 📦 Documentos Obsoletos

Os documentos em `docs/obsoletos/` (30 arquivos) foram **mantidos para histórico**, mas não devem ser usados:

### Por que manter?
- 📚 Histórico do projeto
- 🔍 Referência para decisões passadas
- 📊 Auditoria e compliance
- 🔄 Possível restauração futura

### Status
- ❌ Não devem ser usados para desenvolvimento
- ❌ Não aparecem no DOCS_INDEX.md
- ✅ Preservados para consulta histórica

### Principais Obsoletos
- `LEIA_ME_PRIMEIRO.md` → Substituído por README.md
- `INDICE_COMPLETO_DOCUMENTACAO.md` → Substituído por DOCS_INDEX.md
- `README_ATUALIZACAO_10_OUT_2025.md` → Info integrada ao CHANGELOG.md
- `TESTES_CARRINHO_COMPLETO.md` → Integrado aos guias/

---

## 🗑️ Documentos Temporários

Os documentos em `docs/temporarios/` (110 arquivos) são **trabalho em andamento ou rascunhos**:

### Categorias de Temporários

#### 1. Correções Aplicadas (podem ser arquivadas)
```
CORRECAO_*.md                    # 30+ arquivos
```
**Ação sugerida:** Consolidar em correções/ ou obsoletos/

#### 2. Resumos/Status (podem ser consolidados)
```
RESUMO_*.md                      # 15+ arquivos
STATUS_*.md                      # 10+ arquivos
```
**Ação sugerida:** Manter só os mais recentes, mover resto para obsoletos/

#### 3. Changelogs Temporários
```
CHANGELOG_*.md                   # 5 arquivos
```
**Ação sugerida:** Consolidar no CHANGELOG.md principal

#### 4. Guias/Instruções (avaliar relevância)
```
GUIA_*.md                        # 15+ arquivos
INSTRUCOES_*.md                  # 10+ arquivos
```
**Ação sugerida:** Mover importantes para guias/, resto para obsoletos/

#### 5. Evoluções (podem ser movidas)
```
EVOLUCAO_*.md                    # 10 arquivos
```
**Ação sugerida:** Avaliar e mover para evoluções/ se relevantes

---

## 🔄 Processo de Manutenção

### Quando Criar Novo Documento

1. **Determine a categoria:**
   - Guia prático → `docs/guias/`
   - Nova feature → `docs/evoluções/`
   - Correção → `docs/correções/`
   - Resumo → `docs/resumos/`

2. **Use nomenclatura padronizada:**
   ```
   TIPO_NOME_DESCRITIVO.md
   
   Exemplos:
   - GUIA_RAPIDO_MODULO_X.md
   - EVOLUCAO_FEATURE_Y.md
   - CORRECAO_BUG_Z.md
   - RESUMO_PROJETO_DATA.md
   ```

3. **Atualize o DOCS_INDEX.md:**
   ```markdown
   | Nome | Descrição | Link |
   |------|-----------|------|
   | Novo Doc | Breve descrição | [link](path/to/doc.md) |
   ```

### Quando Atualizar Documento

1. **Documente mudanças:**
   ```markdown
   ---
   **Última Atualização:** DD de MMM de YYYY
   **Versão:** X.Y.Z
   **Autor:** Nome
   ---
   ```

2. **Mantenha changelog interno se necessário:**
   ```markdown
   ## Histórico de Mudanças
   
   ### [1.1.0] - 2025-10-21
   - Adicionada seção X
   - Corrigida informação Y
   ```

### Quando Deprecar Documento

1. **Adicione aviso no topo:**
   ```markdown
   > ⚠️ **OBSOLETO** - Este documento foi substituído por [novo-doc.md](link)
   > Data de depreciação: DD/MM/YYYY
   ```

2. **Mova para obsoletos/:**
   ```bash
   mv docs/DOC_ANTIGO.md docs/obsoletos/
   ```

3. **Remova do DOCS_INDEX.md**

4. **Atualize referências em outros documentos**

### Limpeza Periódica (Mensal)

```bash
# 1. Revisar temporários
cd docs/temporarios/
ls -la

# 2. Identificar docs para mover
# - Importante e atual → Mover para categoria apropriada
# - Ainda útil mas antigo → Mover para obsoletos/
# - Sem valor → Deletar

# 3. Atualizar DOCS_INDEX.md

# 4. Commit das mudanças
git add docs/
git commit -m "docs: Limpeza e organização mensal"
```

---

## 📋 Checklist de Qualidade

### Para Novos Documentos

- [ ] Título claro e descritivo
- [ ] Data de criação/atualização
- [ ] Índice (se > 3 seções)
- [ ] Exemplos práticos
- [ ] Links funcionando
- [ ] Formatação consistente
- [ ] Sem informações sensíveis
- [ ] Adicionado ao DOCS_INDEX.md

### Para Documentos Existentes

- [ ] Informação ainda é válida?
- [ ] Links ainda funcionam?
- [ ] Comandos/código ainda corretos?
- [ ] Capturas de tela atualizadas?
- [ ] Referências a outros docs corretas?

---

## 🎯 Prioridades de Limpeza

### Alta Prioridade (Fazer Agora)

1. ✅ **Criar README.md principal** - CONCLUÍDO
2. ✅ **Criar DOCS_INDEX.md** - CONCLUÍDO
3. ✅ **Criar ARCHITECTURE.md** - CONCLUÍDO
4. ✅ **Mover docs da raiz para pastas** - CONCLUÍDO

### Média Prioridade (Próximas Semanas)

5. ⏳ **Consolidar correções de temporarios/**
   - Avaliar 30+ arquivos CORRECAO_*.md
   - Mover relevantes para correções/
   - Arquivar resto em obsoletos/

6. ⏳ **Consolidar resumos**
   - Manter só os 4-5 mais recentes em resumos/
   - Mover antigos para obsoletos/

7. ⏳ **Limpar changelogs duplicados**
   - Consolidar tudo no CHANGELOG.md principal
   - Deletar CHANGELOG_*.md temporários

### Baixa Prioridade (Quando Possível)

8. 📅 **Avaliar guias em temporarios/**
   - Identificar guias duplicados
   - Mover únicos para guias/
   - Remover redundantes

9. 📅 **Limpar completamente temporarios/**
   - Meta: Reduzir de 110 para < 20 arquivos
   - Manter só trabalhos realmente em andamento

10. 📅 **Criar templates**
    - Template para guias
    - Template para evoluções
    - Template para correções

---

## 📊 Métricas de Documentação

### Estado Atual (21/10/2025)

```
Total de Documentos: ~180
├── Raiz: 2 (README.md, DOCS_INDEX.md)
├── docs/ principais: 4 (ARCHITECTURE, INSTALL, SCRIPTS, CHANGELOG)
├── docs/guias/: 12
├── docs/evoluções/: 20
├── docs/correções/: 13
├── docs/resumos/: 4
├── docs/obsoletos/: 30
└── docs/temporarios/: 110

Status de Organização: 🟡 70%
```

### Meta (Dezembro 2025)

```
Total de Documentos: ~80
├── Raiz: 2
├── docs/ principais: 6
├── docs/guias/: 15
├── docs/evoluções/: 25
├── docs/correções/: 20
├── docs/resumos/: 5
├── docs/obsoletos/: 50 (consolidado)
└── docs/temporarios/: 10 (reduzido)

Status de Organização: 🟢 95%
```

---

## 🛠️ Scripts Úteis

### Listar documentos por data

```bash
# Mais recentes
find docs/ -name "*.md" -type f -printf '%T+ %p\n' | sort -r | head -20

# Mais antigos
find docs/ -name "*.md" -type f -printf '%T+ %p\n' | sort | head -20
```

### Encontrar docs duplicados

```bash
# Por nome similar
find docs/ -name "*.md" | sort | uniq -d

# Por conteúdo (hash)
find docs/ -name "*.md" -type f -exec md5sum {} \; | sort | uniq -w32 -d
```

### Estatísticas

```bash
# Total de documentos por pasta
for dir in docs/*/; do 
  echo "$dir: $(find "$dir" -name "*.md" | wc -l)"
done

# Tamanho total
du -sh docs/
```

---

## 📝 Convenções de Nomenclatura

### Prefixos Padrão

- `GUIA_` - Guias práticos de uso
- `EVOLUCAO_` - Documentação de novas features
- `CORRECAO_` - Correções e fixes aplicados
- `RESUMO_` - Resumos executivos
- `MODULO_` - Documentação de módulos específicos
- `MANUAL_` - Manuais técnicos detalhados

### Sufixos Comuns

- `_v2.0` - Versão específica
- `_FINAL` - Versão final/definitiva
- `_COMPLETO` - Documentação completa
- `_RAPIDO` - Versão quick-start
- `_DATA` - Com indicação de data (ex: _21_OUT_2025)

### Exemplos Bons ✅

```
GUIA_RAPIDO_TESTES.md
EVOLUCAO_CARRINHO_v3.0.md
CORRECAO_SERVICE_WORKER_502.md
RESUMO_COMPLETO_PROJETO.md
MODULO_FINANCEIRO_PROFISSIONAL.md
```

### Exemplos Ruins ❌

```
doc1.md                          # Muito genérico
TEMP_123.md                      # Sem contexto
NOVO_DOCUMENTO_FINAL_FINAL.md    # Redundante
correcao-bug.md                  # Inconsistente (minúsculas)
```

---

## 🔗 Links Relacionados

- [README.md](../README.md) - Documento principal
- [DOCS_INDEX.md](../DOCS_INDEX.md) - Índice completo
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura
- [CHANGELOG.md](CHANGELOG.md) - Histórico de versões

---

## 👥 Responsabilidades

| Papel | Responsabilidade |
|-------|------------------|
| **Dev Lead** | Aprovar estrutura e convenções |
| **Devs** | Criar/atualizar docs de features |
| **QA** | Manter guias de testes atualizados |
| **DevOps** | Manter docs de infra e deploy |
| **Todos** | Reportar docs desatualizados |

---

## 🎓 Boas Práticas

### ✅ Faça

- Use markdown corretamente
- Adicione exemplos práticos
- Mantenha links relativos
- Inclua data de atualização
- Use linguagem clara e objetiva
- Adicione índice em docs longos
- Referencie outros docs quando relevante

### ❌ Não Faça

- Não copie/cole documentos inteiros
- Não use caminhos absolutos em links
- Não inclua informações sensíveis
- Não crie docs sem propósito claro
- Não deixe TODOs sem resolver
- Não use formatação inconsistente
- Não esqueça de atualizar DOCS_INDEX.md

---

**Última Atualização:** 21 de Outubro de 2025  
**Versão:** 1.0.0  
**Responsável:** Equipe de Desenvolvimento

---

**[⬆ Voltar ao topo](#-organização-da-documentação---rare-toy-companion)**

