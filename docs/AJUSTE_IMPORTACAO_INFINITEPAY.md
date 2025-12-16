# 🔄 Ajuste de Importação - Formato InfinitePay

**Data:** Janeiro 2025  
**Status:** ✅ Implementado

---

## 📋 Resumo

Ajustes realizados no módulo financeiro para suportar a importação de extratos CSV no formato específico do InfinitePay.

---

## 📊 Formato do CSV InfinitePay

### Estrutura do Arquivo

```
Data,Hora,Tipo de transação,Nome,Detalhe,Valor (R$)
2025-12-12,20:03:19,Pix,Pix KAUAN SELAU SZCZESNY,Recebido,"+R$ 80,00"
2025-12-15,16:09:56,Pix,Pix Beatriz da Silva Manoel,Enviado,"-R$ 394,00"
```

### Campos

| Campo | Posição | Exemplo | Mapeamento |
|-------|---------|---------|------------|
| **Data** | Coluna 0 | `2025-12-12` | `data` (formato ISO) |
| **Hora** | Coluna 1 | `20:03:19` | `hora` (opcional) |
| **Tipo de transação** | Coluna 2 | `Pix` | `metodo_pagamento` |
| **Nome** | Coluna 3 | `Pix KAUAN SELAU SZCZESNY` | `origem` |
| **Detalhe** | Coluna 4 | `Recebido`, `Enviado`, `Devolvido` | Determina `tipo` |
| **Valor (R$)** | Coluna 5 | `"+R$ 80,00"` | `valor` (numérico) |

---

## 🔧 Alterações Implementadas

### 1. **Detecção Automática de Formato**

O sistema agora detecta automaticamente se o CSV é do formato InfinitePay ou genérico:

```typescript
const isInfinitePayFormat = header.includes('data') && 
                           header.includes('hora') && 
                           header.includes('tipo de transa') &&
                           header.includes('nome') &&
                           header.includes('detalhe') &&
                           header.includes('valor');
```

### 2. **Parser Melhorado**

#### Extração de Valores Monetários

- Suporta sinal `+` ou `-` no início
- Remove `R$` e aspas automaticamente
- Converte vírgula decimal para ponto
- Exemplo: `"+R$ 80,00"` → `80.00`

```typescript
const extractValue = (str: string): { valor: number; sinal: '+' | '-' } => {
  // Detecta sinal, remove R$, converte formato brasileiro
  // Retorna valor numérico e sinal
}
```

#### Divisão de Colunas com Aspas

- Preserva valores entre aspas duplas
- Suporta vírgulas dentro de strings
- Exemplo: `"Pix KAUAN SELAU SZCZESNY"` é mantido como uma única coluna

### 3. **Mapeamento de Campos**

#### Tipo de Transação

Baseado no campo **Detalhe**:

| Detalhe | Tipo | Explicação |
|---------|------|------------|
| `Recebido` | `entrada` (crédito) | Dinheiro recebido |
| `Enviado` | `saída` (débito) | Dinheiro enviado |
| `Devolvido` | `entrada` (crédito) | Devolução de pagamento |

Se não houver detalhe, usa o sinal do valor (`+` = entrada, `-` = saída).

#### Campos Adicionais

```typescript
transactionData.metodo_pagamento = tipoTransacao || 'PIX';
transactionData.origem = nome || 'Extrato Bancário';
transactionData.categoria = 'Outros';
```

### 4. **Backend Atualizado**

O endpoint `/api/financial/bank-statements/import` agora:

- Aceita campos adicionais (`metodo_pagamento`, `origem`, `categoria`)
- Usa os valores fornecidos em vez de valores padrão
- Mantém compatibilidade com formato genérico

```javascript
const metodoPagamento = trans.metodo_pagamento || 
                       (contaId ? `Conta: ${contaId}` : 'PIX');
const origem = trans.origem || 'Extrato Bancário';
const categoria = trans.categoria || 'Outros';
```

---

## 📝 Exemplo de Uso

### 1. Exportar CSV do InfinitePay

1. Acesse o InfinitePay
2. Exporte o relatório como CSV
3. Salve o arquivo (formato: `Data,Hora,Tipo de transação,Nome,Detalhe,Valor (R$)`)

### 2. Importar no Sistema

1. Acesse **Financeiro** → **Conciliação** → **Importar Extrato**
2. Selecione o arquivo CSV
3. O sistema detecta automaticamente o formato InfinitePay
4. Visualize a prévia das transações
5. Clique em **Importar**

### 3. Resultado

As transações serão importadas com:

- ✅ Data correta (formato ISO)
- ✅ Hora preservada (se disponível)
- ✅ Método de pagamento = "Pix" (ou outro tipo)
- ✅ Origem = Nome do remetente/destinatário
- ✅ Tipo correto (entrada/saída baseado em "Detalhe")
- ✅ Valor numérico correto
- ✅ Status = "Pago" (transações importadas são consideradas pagas)

---

## 🔍 Validações

### Validação de Formato

- ✅ Verifica se o arquivo tem cabeçalho válido
- ✅ Detecta formato InfinitePay automaticamente
- ✅ Valida número mínimo de colunas (4+)

### Validação de Dados

- ✅ Data obrigatória (usa data atual se ausente)
- ✅ Valor deve ser > 0
- ✅ Remove duplicatas (mesma data, descrição e valor)

### Tratamento de Erros

- ⚠️ Linhas inválidas são ignoradas (com log)
- ⚠️ Erros individuais não impedem importação completa
- ⚠️ Relatório de erros retornado ao final

---

## 🎯 Melhorias Futuras

### Prioridade Alta

- [ ] Suporte a múltiplos formatos de CSV (configurável)
- [ ] Mapeamento customizável de colunas
- [ ] Preview com edição manual antes de importar
- [ ] Categorização automática baseada em histórico

### Prioridade Média

- [ ] Importação em lote (múltiplos arquivos)
- [ ] Agendamento de importações automáticas
- [ ] Conciliação automática com transações existentes
- [ ] Relatório de importação detalhado

---

## 📊 Arquivos Modificados

1. **Frontend:**
   - `src/components/admin/ImportBankStatementModal.tsx`
     - Parser melhorado com detecção de formato InfinitePay
     - Extração de valores monetários com sinal
     - Mapeamento correto de campos

2. **Backend:**
   - `server/server.cjs`
     - Endpoint `/api/financial/bank-statements/import` atualizado
     - Suporte a campos adicionais (metodo_pagamento, origem, categoria)

---

## ✅ Testes Recomendados

1. **Importar CSV InfinitePay válido**
   - Verificar se todas as transações são importadas
   - Verificar se tipo (entrada/saída) está correto
   - Verificar se valores estão corretos

2. **Importar CSV com valores negativos**
   - Verificar se sinal é interpretado corretamente

3. **Importar CSV com duplicatas**
   - Verificar se duplicatas são detectadas e ignoradas

4. **Importar CSV genérico**
   - Verificar compatibilidade com formato antigo

---

## 🐛 Problemas Conhecidos

### Codificação de Caracteres

O cabeçalho pode aparecer com problemas de codificação:
- `transaÃ§Ã£o` em vez de `transação`

**Solução:** O sistema ignora problemas de codificação no cabeçalho, focando na estrutura das colunas.

### Valores com Espaços

Alguns valores podem ter espaços extras:
- `" +R$ 80,00"` (espaço antes do sinal)

**Solução:** O parser remove espaços automaticamente.

---

## 📚 Referências

- Documentação do InfinitePay: [Link]
- Formato CSV: RFC 4180
- Módulo Financeiro: `docs/MODULO_FINANCEIRO_PROFISSIONAL.md`

---

**Última Atualização:** Janeiro 2025  
**Versão:** 1.0.0
