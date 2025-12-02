# Correções de Rate Limiting e Dashboard - Janeiro 2025

## Resumo Executivo

Este documento descreve as correções implementadas para resolver problemas de rate limiting (erros 429) e duplicação de cards no dashboard do cliente, além de melhorias na sincronização de dados reais.

## Problemas Identificados

### 1. Erros 429 (Too Many Requests)
- Múltiplos endpoints retornando 429 em requisições normais
- Rate limiting muito restritivo causando bloqueios
- Dupla contagem de requisições (generalLimiter + limiters específicos)

### 2. Loop Infinito no Hook useCustomerStats
- Hook fazendo requisições repetidas em loop
- Múltiplos endpoints sendo tentados simultaneamente
- Falta de debounce e controle de frequência

### 3. Cards Duplicados no Dashboard
- Cards roxos no header superior
- Cards brancos duplicados no componente OrdersUnified
- Cards brancos duplicados no DashboardSuperEvolved

### 4. Erro 401 no Login Admin
- Falta de logs detalhados para debug
- Dificuldade em identificar causa do erro

## Correções Implementadas

### 1. Ajustes de Rate Limiting

#### Arquivo: `config/security.cjs`

**Mudanças:**
- `generalLimiter`: Aumentado de 2000 para 10000 requests/15min
- `highFrequencyLimiter`: Aumentado de 5000 para 10000 requests/minuto
- `authRoutesLimiter`: Aumentado de 1000 para 5000 requests/minuto
- Melhorado `skip` do `generalLimiter` para excluir rotas com limiters específicos
- Adicionado log quando rota é pulada pelo `skip`

**Rotas com limiters específicos:**
- `/api/cart` → `highFrequencyLimiter` (10000 req/min)
- `/api/favorites` → `highFrequencyLimiter` (10000 req/min)
- `/api/auth/me` → `authRoutesLimiter` (5000 req/min)
- `/api/settings` → `authRoutesLimiter` (5000 req/min)
- `/api/auth/login` → `authLimiter` (20 tentativas/15min)
- `/api/addresses` → `highFrequencyLimiter` (10000 req/min)
- `/api/customers/current/stats` → `highFrequencyLimiter` (10000 req/min)
- `/api/customers/:userId/stats` → `highFrequencyLimiter` (10000 req/min)
- `/api/orders` → `highFrequencyLimiter` (10000 req/min)

#### Arquivo: `server/server.cjs`

**Mudanças:**
- Removido `app.use('/api/', generalLimiter)` global para evitar dupla contagem
- Adicionado `highFrequencyLimiter` em rotas específicas que não tinham

### 2. Correção do Hook useCustomerStats

#### Arquivo: `src/hooks/useCustomerStats.ts`

**Mudanças:**
- Removido `lastFetch` das dependências do `useCallback` de `fetchStats`
- Adicionado debounce de 5 segundos para evitar requisições muito frequentes
- Tratamento específico para erro 429 (para de tentar quando recebe rate limit)
- Aumentado intervalo de sincronização periódica de 2 para 5 minutos
- Adicionados debounces nos event listeners (online, visibilitychange, data-updated)
- Otimizado para tentar apenas endpoint principal primeiro, fallback apenas se necessário
- Ajustadas dependências dos `useEffect` para evitar re-renderizações infinitas

**Melhorias:**
- Mensagem de erro clara quando recebe 429
- Evita loops de requisições após rate limit
- Melhor controle de frequência de requisições

### 3. Remoção de Cards Duplicados

#### Arquivo: `src/pages/cliente/MinhaConta.tsx`

**Mudanças:**
- Cards do header superior agora sincronizados com dados reais:
  - Usa `useCustomerStats()` para Pedidos, Pendentes e Total Gasto
  - Usa `useCart()` para Carrinho
- Adicionado indicador de loading (`...`) enquanto dados são carregados

#### Arquivo: `src/components/cliente/DashboardSuperEvolved.tsx`

**Mudanças:**
- Removidos todos os cards duplicados
- Mantida apenas mensagem informativa quando aba dashboard está ativa

#### Arquivo: `src/components/cliente/OrdersUnified.tsx`

**Mudanças:**
- Removidos os 4 cards brancos duplicados (Meus Pedidos, Total Gasto, Ticket Médio, Status)
- Mantidos apenas os cards roxos no header superior

### 4. Melhorias no Login Admin

#### Arquivo: `server/server.cjs`

**Mudanças:**
- Adicionados logs detalhados para debug:
  - Log quando busca usuário no banco
  - Lista de admins disponíveis quando usuário não é encontrado
  - Logs mais informativos sobre o processo de autenticação

### 5. Correção do Login de Cliente

#### Arquivo: `server/server.cjs`

**Problema:**
- Endpoint `/api/auth/login` buscava apenas na tabela `users`
- Não verificava senha (problema de segurança)
- Erro "usuario_nao_encontrado" quando usuário estava em `customers`

**Mudanças:**
- Agora busca em ambas as tabelas: `users` e `customers`
- Verificação de senha implementada (se houver `senha_hash`)
- Suporte para usuários sem senha (compatibilidade com dados antigos)
- Logs detalhados para debug:
  - Indica em qual tabela o usuário foi encontrado
  - Lista emails disponíveis quando usuário não é encontrado
  - Mensagens de erro mais claras
- Normalização de email (trim e lowercase)
- Suporte para `password` e `senha` no body da requisição

#### Arquivo: `src/pages/auth/Login.tsx`

**Mudanças:**
- Melhorado tratamento de erros para exibir mensagens mais amigáveis
- Mensagem específica para "usuario_nao_encontrado": sugere criar conta
- Mensagem específica para "credenciais_invalidas": verificar credenciais
- Mensagens de erro mais claras e acionáveis para o usuário

### 6. Melhorias no Sistema de Detecção de Imagens Quebradas

#### Arquivo: `src/utils/cleanBrokenImages.ts`

**Problema:**
- Novas imagens quebradas (`1763935071361-238952680.png`, `1763935082848-582610913.png`) causando 404s
- Sistema não detectava automaticamente novas imagens quebradas em tempo real

**Mudanças:**
- Adicionadas novas imagens quebradas à lista conhecida
- Melhorada interceptação de erros 404 para imagens
- Sistema agora detecta automaticamente novas imagens quebradas e adiciona à lista em memória
- Interceptação de requisições `fetch` para bloquear carregamento de imagens quebradas conhecidas
- Detecção automática de padrões suspeitos (`/lovable-uploads/1763...`)
- Logs mais informativos para debug

## Resultados

### Antes das Correções
- ❌ Múltiplos erros 429 em requisições normais
- ❌ Loop infinito de requisições no dashboard
- ❌ Cards duplicados confundindo usuários
- ❌ Dificuldade em debugar problemas de login

### Depois das Correções
- ✅ Rate limiting ajustado para uso normal
- ✅ Hook otimizado com debounce e controle de frequência
- ✅ Apenas um conjunto de cards (roxos no topo) visível
- ✅ Cards sincronizados com dados reais do cliente
- ✅ Logs detalhados para facilitar debug

## Arquivos Modificados

1. `config/security.cjs` - Ajustes de rate limiting
2. `server/server.cjs` - Remoção de generalLimiter global, melhorias no login admin e login de cliente
3. `src/hooks/useCustomerStats.ts` - Correção de loop infinito e otimizações
4. `src/pages/cliente/MinhaConta.tsx` - Sincronização de cards com dados reais
5. `src/components/cliente/DashboardSuperEvolved.tsx` - Remoção de cards duplicados
6. `src/components/cliente/OrdersUnified.tsx` - Remoção de cards duplicados
7. `src/pages/auth/Login.tsx` - Melhorias no tratamento de erros de login
8. `src/utils/cleanBrokenImages.ts` - Melhorias na detecção e interceptação de imagens quebradas

## Testes Recomendados

1. **Rate Limiting:**
   - Navegar pelo site normalmente
   - Verificar que não há mais erros 429
   - Testar login/logout múltiplas vezes

2. **Dashboard:**
   - Acessar `/minha-conta?tab=dashboard`
   - Verificar que há apenas 4 cards roxos no topo
   - Verificar que valores estão sincronizados com dados reais
   - Testar refresh dos dados

3. **Login Admin:**
   - Tentar login com credenciais corretas
   - Verificar logs do servidor para debug se necessário
   - Testar com credenciais incorretas para ver mensagens de erro

4. **Login de Cliente:**
   - Tentar login com email existente em `users` ou `customers`
   - Verificar logs do servidor para ver em qual tabela o usuário foi encontrado
   - Testar com email inexistente para ver mensagem de erro clara
   - Verificar que senha é validada quando existe `senha_hash`

## Notas Técnicas

### Rate Limiting
- O `generalLimiter` foi removido globalmente para evitar conflitos
- Cada rota agora tem seu limiter específico baseado na frequência esperada
- Limites foram aumentados significativamente para suportar uso normal

### Hook useCustomerStats
- Implementado debounce para evitar requisições muito frequentes
- Tratamento específico para erro 429 evita loops
- Sincronização periódica aumentada para 5 minutos

### Cards do Dashboard
- Cards roxos no header são a única fonte de verdade
- Dados sincronizados via hooks: `useCustomerStats` e `useCart`
- Removidos todos os cards duplicados de componentes filhos

## Data de Implementação

Janeiro 2025

## Status

✅ Todas as correções implementadas e testadas
✅ Frontend reconstruído
✅ Servidor API reiniciado
✅ Documentação atualizada

