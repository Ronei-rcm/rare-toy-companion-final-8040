# 🎨 Especificações Visuais Detalhadas - Sistema Financeiro

## 📐 LAYOUT E ESPAÇAMENTOS

### Grid System
```css
Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Grid Gap: gap-4 (mobile), gap-6 (desktop)
Card Spacing: p-6
Section Spacing: space-y-6 (mobile), space-y-8 (desktop)
```

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🎯 COMPONENTES ESPECÍFICOS

### 1. HEADER DO SISTEMA FINANCEIRO

#### Antes:
```
💰 Sistema Financeiro
Gestão completa de transações financeiras
[Botões à direita]
```

#### Depois:
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Sistema Financeiro          [🔄] [📄 CSV] [📄 JSON] [+ Nova] │
│ Gestão completa de transações financeiras                   │
│ ─────────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────────┘
```

**Melhorias:**
- Background: `bg-gradient-to-r from-gray-50 to-white`
- Padding vertical: `py-6`
- Border bottom: `border-b border-gray-200`
- Botões agrupados com gap: `gap-2`
- Subtítulo com cor: `text-gray-600`

---

### 2. CARDS DE MÉTRICAS (Resumo Financeiro)

#### Estrutura Atual:
```
[Card] Entradas: R$ 2.200,00
[Card] Saídas: R$ 1.100,00
[Card] Saldo: R$ 1.100,00
```

#### Estrutura Melhorada:
```
┌─────────────────────────────┐
│ 💰 Entradas                 │
│ R$ 2.200,00      [↑ 15%]   │
│ Últimos 30 dias            │
│ ──────────────────────────  │
│ ↳ vs mês anterior          │
└─────────────────────────────┘
```

**Especificações:**
- Altura mínima: `min-h-[140px]`
- Border left colorido: `border-l-4 border-l-green-500`
- Ícone grande: `w-12 h-12` com `bg-green-100 text-green-600`
- Valor principal: `text-3xl font-bold`
- Subtítulo: `text-sm text-gray-500`
- Indicador de tendência: Badge com seta e percentual
- Hover: `hover:shadow-lg transition-shadow`

---

### 3. CARDS DE ORÇAMENTOS

#### Melhorias Visuais:
```
┌─────────────────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Barra colorida (status)
│ Orçamento Marketing    [✏️] [🗑️]            │
│ Marketing digital e campanhas               │
│                                             │
│ [✅ Ativo] [Mensal]        [Normal ✓]      │
│                                             │
│ 📁 Categoria: Marketing                    │
│ 📅 01/01/2025 - 31/12/2025                │
│                                             │
│ Orçado:    R$ 10.000,00                    │
│ Real:      R$ 8.500,00                     │
│ Restante:  R$ 1.500,00                     │
│                                             │
│ Progresso: 85% ━━━━━━━━━━━━━━━━━━         │
│                                             │
│ ⚠️ Alerta: 85% do orçado utilizado        │
└─────────────────────────────────────────────┘
```

**Estados:**
- Normal: Barra verde, badge verde
- Alerta: Barra amarela, badge amarelo
- Extrapolado: Barra vermelha, badge vermelho

---

### 4. TABELA DE TRANSAÇÕES

#### Melhorias:
```
┌────────────────────────────────────────────────────────────┐
│ Data ▼ │ Descrição │ Categoria │ Tipo │ Valor │ Status │... │
├────────────────────────────────────────────────────────────┤
│ 15/12  │ Venda...  │ [Eventos] │ 💰   │ +2000 │ ✅     │... │
│        │           │           │      │       │        │    │
│ 10/12  │ Compra... │ [Compras] │ 💸   │ -500  │ ⏳     │... │
└────────────────────────────────────────────────────────────┘
```

**Melhorias:**
- Linhas alternadas: `even:bg-gray-50`
- Hover: `hover:bg-blue-50`
- Cabeçalho fixo em scroll
- Ações visíveis no hover
- Badges coloridos para status

---

### 5. FILTROS E BUSCA

#### Layout Melhorado:
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Filtros e Busca                                      │
│ Busque e filtre transações por...                      │
├─────────────────────────────────────────────────────────┤
│ [🔍 Buscar...                    ] [Tipo ▼] [Status ▼] │
│ [Categoria ▼] [Período ▼]        [🔄 Limpar Filtros]  │
└─────────────────────────────────────────────────────────┘
```

**Melhorias:**
- Background: `bg-gray-50`
- Labels: `font-medium text-gray-700`
- Inputs: `h-10` com `focus:ring-2 focus:ring-blue-500`
- Botão limpar: `variant="outline"` com ícone

---

### 6. PROJEÇÃO DE FLUXO DE CAIXA

#### Cards de Projeção Mensal:
```
┌─────────────────────────────────────┐
│ Janeiro 2026                        │
├─────────────────────────────────────┤
│ Entradas:  R$ 0,00                  │
│ Saídas:    R$ 200,00                │
│ Transações: 1                       │
│                                     │
│ Saldo: ━━━━━━━━━━━━━━ R$ -200,00   │
│        [Gráfico de barra]          │
└─────────────────────────────────────┘
```

**Melhorias:**
- Gráfico visual mais proeminente
- Cores: Verde (entradas), Vermelho (saídas)
- Badge de saldo destacado
- Hover: Mostrar detalhes adicionais

---

### 7. RELATÓRIOS EXECUTIVOS

#### Cards de Métricas:
```
┌─────────────────────────────┐
│ 📊 Receitas Totais          │
│                             │
│ R$ 2.200,00                 │
│ [100% vs período anterior]  │
│                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ [Gráfico de linha pequeno]  │
└─────────────────────────────┘
```

**Melhorias:**
- Gráficos mini inline
- Comparativos visíveis
- Cores semânticas
- Exportação destacada

---

## 🎨 ESTADOS E INTERAÇÕES

### Loading State
```
┌─────────────────────────────┐
│ ⏳ Carregando dados...      │
│ [━━━━━━━━━━━━━━━━━━━━━━━━] │
└─────────────────────────────┘
```
- Skeleton screens
- Spinners centralizados
- Progress bars

### Empty State
```
┌─────────────────────────────┐
│         [Ícone grande]      │
│                             │
│   Nenhum item encontrado    │
│                             │
│   Comece criando...         │
│                             │
│   [+ Criar Primeiro Item]   │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│         [⚠️]                │
│                             │
│   Erro ao carregar dados    │
│                             │
│   [🔄 Tentar Novamente]     │
└─────────────────────────────┘
```

---

## 🌈 PALETA DE CORES SEMÂNTICAS

### Status
- **Sucesso**: Verde (#10B981)
- **Erro**: Vermelho (#EF4444)
- **Aviso**: Amarelo (#F59E0B)
- **Info**: Azul (#3B82F6)
- **Neutro**: Cinza (#6B7280)

### Tipos de Transação
- **Entrada**: Verde (#10B981)
- **Saída**: Vermelho (#EF4444)

### Status de Orçamento
- **Normal**: Verde (#10B981) - 0-79%
- **Alerta**: Amarelo (#F59E0B) - 80-99%
- **Extrapolado**: Vermelho (#EF4444) - 100%+

---

## 📱 RESPONSIVIDADE

### Mobile (< 640px)
- Cards: 1 coluna
- Tabelas: Scroll horizontal
- Filtros: Stack vertical
- Botões: Full width ou ícones apenas

### Tablet (640px - 1024px)
- Cards: 2 colunas
- Tabelas: Scroll horizontal
- Filtros: 2 colunas
- Botões: Adaptáveis

### Desktop (> 1024px)
- Cards: 3-4 colunas
- Tabelas: Full width
- Filtros: Inline
- Botões: Agrupados

---

## ✨ ANIMAÇÕES E TRANSIÇÕES

### Microinterações
- **Hover Cards**: `transform: translateY(-2px)` + `shadow-lg`
- **Button Click**: `scale(0.98)`
- **Loading**: `animate-spin` ou `animate-pulse`
- **Entrada**: `fadeIn` + `slideUp`
- **Saída**: `fadeOut` + `slideDown`

### Durações
- Rápido: 150ms (hover, click)
- Médio: 200ms (transições)
- Lento: 300ms (entrada/saída)

---

## 🎯 EXEMPLOS DE IMPLEMENTAÇÃO

### Card de Métrica Melhorado
```tsx
<Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium text-gray-600">
        💰 Entradas
      </CardTitle>
      <div className="p-2 bg-green-100 rounded-full">
        <TrendingUp className="h-5 w-5 text-green-600" />
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-green-600">
      R$ {formatCurrency(value)}
    </div>
    <div className="flex items-center gap-2 mt-2">
      <Badge variant="success" className="text-xs">
        <TrendingUp className="h-3 w-3 mr-1" />
        +15%
      </Badge>
      <span className="text-xs text-gray-500">vs mês anterior</span>
    </div>
  </CardContent>
</Card>
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Visual
- [ ] Paleta de cores aplicada
- [ ] Espaçamentos padronizados
- [ ] Tipografia consistente
- [ ] Sombras padronizadas
- [ ] Bordas e raios consistentes

### Componentes
- [ ] Cards padronizados
- [ ] Botões com estados
- [ ] Inputs melhorados
- [ ] Badges semânticos
- [ ] Tabelas responsivas

### UX
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Feedback visual
- [ ] Microinterações

### Responsividade
- [ ] Mobile testado
- [ ] Tablet testado
- [ ] Desktop testado
- [ ] Breakpoints ajustados

---

**Última atualização:** {{ date }}

