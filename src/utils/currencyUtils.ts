/**
 * Utilitários para formatação de moeda
 */

export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const formatCurrencyCompact = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0';
  }
  
  if (numValue >= 1000000) {
    return `R$ ${(numValue / 1000000).toFixed(1)}M`;
  }
  
  if (numValue >= 1000) {
    return `R$ ${(numValue / 1000).toFixed(1)}K`;
  }
  
  return formatCurrency(numValue);
};

export const parseCurrency = (value: string): number => {
  // Remove todos os caracteres não numéricos exceto vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para conversão
  const normalizedValue = cleanValue.replace(',', '.');
  
  return parseFloat(normalizedValue) || 0;
};

export const formatPercentage = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(numValue / 100);
};

export const formatNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR').format(numValue);
};

export const formatNumberCompact = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(1)}M`;
  }
  
  if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }
  
  return formatNumber(numValue);
};
