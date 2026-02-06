# Importação de Extrato CSV e Ajustes do Módulo Financeiro

**Data:** Fevereiro 2026  
**Status:** ✅ Implementado

---

## Resumo

Ajustes no módulo financeiro para importação fiel de extratos CSV (InfinitPay e similares), colunas valor bruto/líquido, tratamento de duplicatas e compatibilidade com diferentes schemas do banco.

---

## 1. Importação de CSV

### Comportamento

- **Preview:** Ao selecionar o CSV, o sistema parseia e exibe uma tabela com todas as transações (Data, Hora, Tipo, Nome, Detalhe, Descrição, **Valor Bruto (R$)**, **Valor Líquido (R$)**).
- **Duplicatas em relação ao que já está no banco:** Antes de inserir cada transação, o sistema verifica se já existe uma com a mesma **data**, **hora**, **valor** e **descrição**. Se existir, a linha é ignorada (não duplicada) e o contador "já existiam" é incrementado. Assim, ao importar um segundo CSV (ex.: outro extrato ou o "Relatório CSV - InfinitePay") que contenha transações já importadas de outro CSV, apenas as **novas** são inseridas.
- **Vendas com mesmo valor:** Dentro do mesmo CSV, vendas com o mesmo valor na mesma data **não** são tratadas como duplicata entre si; cada linha do arquivo é considerada uma transação. A verificação de duplicata é feita apenas contra o que **já está na base**.
- **Formato aceito:** CSV no formato InfinitePay (Data, Hora, Tipo, Nome, Detalhe, Valor) ou formato **Relatório CSV** (colunas como "Data e hora", "Valor bruto (R$)", "Valor líquido (R$)", "Descrição", "Tipo"). Quando existem Valor e Líquido, o valor da transação é o **líquido** e a diferença é registrada como taxa nas observações.

### Fluxo

1. Usuário seleciona o arquivo CSV no modal "Importar Extrato Bancário".
2. Frontend parseia o CSV e exibe o preview com Valor Bruto e Valor Líquido.
3. Ao clicar em "Importar X Transações", o frontend envia `transactions` (JSON) no body da requisição para `POST /api/financial/bank-statements/import`.
4. Backend, para cada transação: verifica se já existe uma com mesma data, hora, valor e descrição; se existir, ignora e incrementa "já existiam"; senão, insere. Em caso de coluna inexistente, usa fallback (veja seção 3).

### Formato "Relatório CSV - InfinitePay"

O parser reconhece automaticamente CSVs de relatório que tenham, no cabeçalho, referências a "relatório", "valor líquido", "valor bruto" ou colunas como "Data e hora", "Descrição", "Valor bruto (R$)", "Valor líquido (R$)". As colunas são mapeadas por nome (Data/Hora, Tipo, Nome/Descrição, Valor/Líquido), permitindo importar tanto o extrato simples quanto o relatório em CSV sem alterar o fluxo.

---

## 2. Colunas Valor Bruto e Valor Líquido

### Banco de dados

- **`valor`:** valor líquido (o que efetivamente entra/sai).
- **`valor_bruto`:** opcional; preenchido quando o CSV traz Valor (R$) e Líquido (R$). A diferença é exibida como taxa.

### Migrations

- **021_add_valor_bruto_financial_transactions.sql**  
  Adiciona `valor_bruto DECIMAL(15,2) NULL` em `financial_transactions`.

- **022_add_hora_financial_transactions.sql**  
  Adiciona `hora TIME NULL` em `financial_transactions` (idempotente via procedure).

### Interface (Financeiro)

- Tabela de transações: colunas **Valor Bruto (R$)** e **Valor Líquido (R$)**.
- Exportação CSV/JSON inclui Valor Bruto, Valor Líquido e Taxa (R$).
- Card "Total em taxas" no resumo e no Dashboard.

---

## 3. Compatibilidade de schema (resiliência)

O backend aceita tabelas com nomes de coluna diferentes:

| Cenário | Coluna de pagamento | Colunas opcionais |
|--------|----------------------|--------------------|
| Schema novo | `metodo_pagamento` | `hora`, `valor_bruto` |
| Schema antigo | `forma_pagamento` | ausentes |

### GET /api/financial/transactions

- Tenta SELECT com `hora`, `valor_bruto`, `metodo_pagamento`.
- Se der "Unknown column", faz fallback sem `hora`/`valor_bruto` e, se necessário, usa `forma_pagamento AS metodo_pagamento`.
- Último fallback: `SELECT *` e normalização em código.

### POST /api/financial/bank-statements/import

- INSERT completo com `valor_bruto`, `hora`, `metodo_pagamento`. Se falhar por coluna inexistente, usa schema mínimo (sem `valor_bruto` e `hora`).
- Se falhar por "Unknown column 'metodo_pagamento'", repete o INSERT usando **`forma_pagamento`** no lugar de `metodo_pagamento`.

### ENUM tipo

- A tabela usa `ENUM('Entrada','Saída')`. O backend converte `credito`/`entrada` → `'Entrada'` e débito/saída → `'Saída'` antes do INSERT.

---

## 4. Migrations – como executar

No servidor (ajuste usuário, senha e banco conforme `.env`):

```bash
# Valor bruto
mysql -h 127.0.0.1 -P 3307 -u root -p rare_toy_companion < database/migrations/021_add_valor_bruto_financial_transactions.sql

# Hora (idempotente)
mysql -h 127.0.0.1 -P 3307 -u root -p rare_toy_companion < database/migrations/022_add_hora_financial_transactions.sql
```

Se a coluna já existir, 021 pode retornar "Duplicate column name"; 022 foi feita para ser idempotente.

---

## 5. Conciliação de saldo com o banco

Na aba **Transações** do Financeiro, foi adicionado o bloco **"Conferir saldo com o banco"**:

- O usuário pode informar o **saldo exibido no app do InfinitePay** (ex.: R$ 278,88 do extrato).
- O sistema exibe:
  - **Saldo calculado (sistema):** soma das transações importadas (entradas − saídas, usando valor líquido).
  - **Saldo informado (banco):** valor digitado.
  - **Diferença:** se for menor que R$ 0,02, mostra "✓ Bate"; caso contrário, mostra a diferença em R$.
- Se a diferença for próxima do **total em taxas**, é exibida a dica: o banco pode estar mostrando valor bruto; conferir se o extrato usa valor líquido.
- Se não bater e não for por taxas, a dica sugere conferir se todas as transações do período foram importadas e se os tipos (entrada/saída) estão corretos.

Isso ajuda a identificar quando o saldo do InfinitePay não bate com o saldo calculado pelas transações importadas (ex.: extrato vs. PDF de teste).

---

## 6. Outros ajustes (fevereiro 2026)

- **Service Worker / SSL:** Mensagens de erro de certificado SSL e logs de detecção de navegador só em desenvolvimento; em produção o console fica mais limpo.
- **Imagens quebradas:** Logs de "Verificando imagens quebradas" e dica do console só em desenvolvimento.
- **Feedback na importação:** Se algumas linhas falharem, o toast exibe "X de Y importadas" e até 3 mensagens de erro; a resposta da API inclui `errors` (até 15).

---

## 7. Correções de erros 500 (fevereiro 2026)

- **GET `/api/admin/analytics/pedidos-recentes`:** A query usava a coluna `payment_method`; a tabela `orders` tem `metodo_pagamento`. Corrigido para `COALESCE(o.metodo_pagamento, 'Não informado') as payment_method` e uso do pool padrão (tabelas sem prefixo de banco).
- **POST `/api/financial/transactions`:** O ENUM `tipo` na tabela é `'Entrada'`/`'Saída'`; o backend enviava `'entrada'`/`'saida'`. Passou a mapear para o ENUM antes do INSERT. Mantidos fallbacks para schema sem `hora` ou com `forma_pagamento`.
- **POST `/api/financial/categorias`:** A tabela `categorias_financeiras` não existia. O servidor agora cria a tabela automaticamente (idempotente) e usa o pool global. Validação de nome obrigatório e tratamento de duplicata (409). Migration **023_create_categorias_financeiras.sql** disponível para deploy explícito.
- **PUT/DELETE categorias financeiras:** Validação de ID numérico; retorno 404 quando a categoria não existe (affectedRows === 0).

---

## 8. Revisão e evoluções possíveis

### Revisão (já aplicada)

- Categorias financeiras: `ensureCategoriasFinanceirasTable` sem engolir erro (rethrow); PUT/DELETE com validação de ID e 404 quando não encontrar.
- Migration 023 criada para alinhar ambiente de produção com a tabela criada em runtime.

### Evoluções já implementadas

- **Segurança:** Rotas do financeiro protegidas com `authenticateAdmin`: GET/POST/PUT/DELETE categorias, GET/POST/PUT/DELETE transactions (incl. bulk e reverse), import CSV/PDF. Apenas admin autenticado pode listar/criar/editar/excluir.
- **Categorias:** Ao excluir categoria, o backend verifica se existem transações com essa categoria (por nome). Se houver, retorna 409 com mensagem "Existem X transação(ões) usando esta categoria. Altere ou remova-as antes de excluir."
- **API:** Respostas 500 nas rotas de categorias e POST transactions não incluem `details` em produção (`process.env.NODE_ENV === 'production'`); em desenvolvimento o campo `details` continua sendo enviado.

### Evoluções sugeridas (futuro)

| Área | Ideia | Benefício |
|------|--------|-----------|
| **Conciliação** | Persistir "saldo informado" e data da conferência (tabela ou preferência) | Histórico de conciliações |
| **Conciliação** | Filtro por período (ex.: "Saldo do extrato em DD/MM–DD/MM") e calcular saldo só das transações no período | Comparar com extrato mensal |
| **API** | Estender ocultação de `details` no 500 para todas as rotas (helper global) | Consistência |
| **Testes** | Testes automatizados para GET pedidos-recentes, POST transactions (ENUM), POST categorias (tabela criada) | Regressão |
| **Front** | Toast específico para 409 (categoria duplicada / em uso) e 404 (categoria não encontrada) | UX |

---

## Referências

- [Ajuste Importação InfinitePay](../AJUSTE_IMPORTACAO_INFINITEPAY.md)
- [Migração Campo Hora](../MIGRACAO_CAMPO_HORA.md)
- [Módulo Financeiro Profissional](../MODULO_FINANCEIRO_PROFISSIONAL.md)
