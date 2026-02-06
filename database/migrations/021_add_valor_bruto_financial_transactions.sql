-- Adiciona coluna valor_bruto para extratos com Valor (R$) e Líquido (R$)
-- valor = líquido (valor que entra no saldo); valor_bruto = bruto quando disponível
-- Valor bruto (extrato): quando preenchido, valor = líquido
ALTER TABLE financial_transactions 
ADD COLUMN valor_bruto DECIMAL(15,2) NULL DEFAULT NULL 
COMMENT 'Valor bruto (extrato): quando preenchido, valor = líquido' 
AFTER valor;
