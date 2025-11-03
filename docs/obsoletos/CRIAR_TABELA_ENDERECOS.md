# 📦 Como Criar a Tabela de Endereços

## 🎯 Objetivo

Criar a tabela `customer_addresses` no banco de dados para permitir que clientes gerenciem múltiplos endereços de entrega.

---

## ⚠️ Por que isso é necessário?

O erro que você viu:
```
Table 'rare_toy_companion.customer_addresses' doesn't exist
```

Indica que a tabela de endereços ainda não foi criada no banco de dados. **Agora o sistema não quebra mais** (retorna array vazio), mas para ter a funcionalidade completa de endereços, precisamos criar a tabela.

---

## 🚀 Opção 1: Executar via Terminal (Recomendado)

```bash
# Conectar ao MySQL
mysql -u root -p

# Selecionar o banco
USE rare_toy_companion;

# Executar o script
SOURCE /home/git-muhlstore/rare-toy-companion-final-8040/database/migrations/005_create_customer_addresses_table.sql

# Sair
EXIT;
```

---

## 🚀 Opção 2: Executar Diretamente

```bash
mysql -u root -p rare_toy_companion < /home/git-muhlstore/rare-toy-companion-final-8040/database/migrations/005_create_customer_addresses_table.sql
```

---

## 🚀 Opção 3: Copiar e Colar no phpMyAdmin

1. Abra o phpMyAdmin
2. Selecione o banco `rare_toy_companion`
3. Vá na aba "SQL"
4. Copie o conteúdo de `database/migrations/005_create_customer_addresses_table.sql`
5. Cole e execute

---

## ✅ Verificar se Funcionou

```bash
# Via terminal
mysql -u root -p -e "USE rare_toy_companion; DESCRIBE customer_addresses;"

# Ou via código (já está implementado)
# O endpoint agora retorna um warning se a tabela não existe
```

---

## 📊 Estrutura da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | VARCHAR(36) | UUID único |
| customer_id | INT | ID do cliente (FK para users) |
| nome | VARCHAR(100) | Label (Casa, Trabalho, etc) |
| cep | VARCHAR(9) | CEP |
| rua | VARCHAR(200) | Endereço completo |
| numero | VARCHAR(20) | Número |
| complemento | VARCHAR(100) | Complemento (opcional) |
| bairro | VARCHAR(100) | Bairro |
| cidade | VARCHAR(100) | Cidade |
| estado | VARCHAR(2) | UF |
| padrao | BOOLEAN | Endereço padrão |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Última atualização |

---

## 🔒 Recursos de Segurança

### Triggers Automáticos:
- ✅ Apenas um endereço padrão por cliente
- ✅ Auto-update do timestamp
- ✅ Cascade delete (se usuário for deletado, endereços também)

### Índices:
- ✅ `customer_id` (busca rápida por cliente)
- ✅ `padrao` (filtro rápido de padrão)
- ✅ `cep` (busca por região)

---

## 🧪 Testar Após Criar

1. **Via Interface:**
   - Vá para `/minha-conta?tab=enderecos`
   - Não deve mais ter erro 500
   - Clique em "Adicionar Endereço"
   - Preencha e salve
   - Verifique se aparece na lista

2. **Via API:**
   ```bash
   # Ver endereços do usuário
   curl https://muhlstore.re9suainternet.com.br/api/customers/1/addresses \
     -H "Cookie: seu-cookie-aqui"
   ```

3. **Logs do PM2:**
   ```bash
   pm2 logs api --lines 20
   ```
   
   Você deve ver:
   ```
   📍 GET /api/customers/1/addresses
   🔍 Buscando endereços para userId: 1
   ✅ Encontrados 0 endereços
   ```

---

## ❓ Troubleshooting

### "Access denied for user"
```bash
# Usar o usuário correto do MySQL
mysql -u SEU_USUARIO -p
```

### "Database doesn't exist"
```bash
# Verificar nome do banco
SHOW DATABASES;

# Se for diferente, ajustar no script
USE nome_correto_do_banco;
```

### "Table already exists"
Tudo bem! O script usa `CREATE TABLE IF NOT EXISTS`, então não vai dar erro.

---

## 📝 Notas Importantes

1. **Backup:** Sempre faça backup antes de executar migrations:
   ```bash
   mysqldump -u root -p rare_toy_companion > backup_$(date +%Y%m%d).sql
   ```

2. **Permissões:** Certifique-se de que o usuário do MySQL tem permissão para:
   - CREATE TABLE
   - CREATE TRIGGER
   - CREATE INDEX

3. **Performance:** A tabela já vem com índices otimizados

4. **Segurança:** Foreign keys garantem integridade referencial

---

## ✅ Checklist

- [ ] Backup do banco feito
- [ ] Script executado sem erros
- [ ] Tabela criada (DESCRIBE customer_addresses)
- [ ] Triggers criados
- [ ] Testado via interface
- [ ] Testado via API
- [ ] Logs conferidos

---

## 🎉 Pronto!

Após executar a migration, o sistema de endereços estará 100% funcional! 🚀

**Dúvidas?** Veja os logs do PM2 para debug detalhado.

