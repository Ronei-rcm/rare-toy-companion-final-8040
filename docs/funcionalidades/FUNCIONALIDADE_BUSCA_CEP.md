# 📍 Funcionalidade: Busca Automática de CEP

## ✨ O que foi implementado

Adicionada busca automática de CEP na seção de clientes do admin. Ao digitar o CEP, os campos de endereço são preenchidos automaticamente.

---

## 🎯 Funcionalidades

### 1. Hook de Busca de CEP (`useCepLookup.ts`)
- Consulta na API ViaCEP
- Validação automática de CEP
- Tratamento de erros
- Loading states

### 2. Componente de Diálogo (`ClienteFormDialog.tsx`)
- Campo CEP com indicador visual de busca
- Preenchimento automático de:
  - Logradouro (Rua/Avenida)
  - Bairro
  - Cidade
  - Estado (UF)
  - Complemento (opcional)
- Feedback visual durante a busca

### 3. Integração no `AdvancedClientsManager.tsx`
- Import do hook de CEP
- Função `handleCepLookup` para buscar e preencher
- Toasts de sucesso/erro
- Atualização de interfaces com novos campos

---

## 🔧 Como funciona

```typescript
// 1. Usuário digita CEP
onChange={(e) => {
  const cep = e.target.value;
  setFormData(prev => ({ ...prev, cep }));
  
  // 2. Quando CEP tem 8 dígitos, busca automaticamente
  if (cep.replace(/\D/g, '').length === 8) {
    const cepData = await lookupCep(cep);
    
    // 3. Preenche campos automaticamente
    if (cepData) {
      setFormData(prev => ({
        ...prev,
        endereco: cepData.logradouro,
        bairro: cepData.bairro,
        cidade: cepData.localidade,
        estado: cepData.uf,
      }));
      toast.success('Endereço preenchido automaticamente!');
    }
  }
}}
```

---

## 📦 Arquivos Criados/Modificados

### Criados:
1. **`src/hooks/useCepLookup.ts`**
   - Hook personalizado para busca de CEP
   - Usa API ViaCEP
   - Retorna dados formatados

2. **`src/components/admin/ClienteFormDialog.tsx`**
   - Componente de diálogo completo
   - Busca automática de CEP
   - Interface moderna
   - Validação de campos

### Modificados:
1. **`src/components/admin/AdvancedClientsManager.tsx`**
   - Import do hook
   - Função `handleCepLookup`
   - Integração com formulário existente
   - Novos campos: `bairro`, `complemento`

---

## 🎨 Interface do Usuário

### Indicador Visual Durante Busca:
```tsx
{consultandoCep && (
  <Loader2 className="h-3 w-3 animate-spin text-primary" />
)}
```

### Feedback ao Usuário:
- ✅ Toast de sucesso: "Endereço preenchido automaticamente!"
- ❌ Toast de erro: "CEP não encontrado" ou "Erro ao consultar CEP"

---

## 🌐 API Utilizada

**ViaCEP:**
- URL: `https://viacep.com.br/ws/{cep}/json/`
- Método: GET
- Formato: JSON
- Endpoint público, sem autenticação

### Exemplo de Resposta:
```json
{
  "cep": "01000-000",
  "logradouro": "Praça da Sé",
  "complemento": "lado ímpar",
  "bairro": "Sé",
  "localidade": "São Paulo",
  "uf": "SP",
  "erro": false
}
```

---

## 📋 Campos Preenchidos Automaticamente

| Campo              | Valor via API      | Obrigatório |
|-------------------|-------------------|-------------|
| **CEP**           | `cep`             | ✅          |
| **Endereço**      | `logradouro`      | ✅          |
| **Bairro**        | `bairro`          | ⚪          |
| **Cidade**        | `localidade`      | ✅          |
| **Estado**        | `uf`              | ✅          |
| **Complemento**   | `complemento`     | ⚪          |

---

## 🚀 Como Usar

1. Abra a seção **Clientes** no admin
2. Clique em **"Adicionar Cliente"**
3. Digite o CEP (8 dígitos)
4. Aguarde a busca automática (~1-2 segundos)
5. ✅ Campos de endereço são preenchidos automaticamente
6. Revise e ajuste se necessário
7. Preencha os demais dados e salve

---

## ✨ Benefícios

- ⏱️ **Economia de tempo**: Não precisa preencher endereço manualmente
- 🎯 **Menos erros**: Dados vindos de API confiável
- 📱 **UX melhor**: Fluxo mais rápido e fluido
- 🎨 **Visual feedback**: Indicadores de loading e toasts
- 🔍 **Validação**: CEP verificado antes de buscar

---

## 🔮 Melhorias Futuras

- [ ] Cache de CEPs consultados
- [ ] Sugestão de CEPs ao digitar (typeahead)
- [ ] Suporte a múltiplas APIs (fallback)
- [ ] Histórico de CEPs consultados
- [ ] Validação de CEP por regex

---

## ✅ Status

- ✅ Hook criado
- ✅ Componente de diálogo criado
- ✅ Integração completa
- ✅ Build gerado com sucesso
- ✅ Pronto para uso

---

**Funcionalidade implementada e testada!** 🎉

