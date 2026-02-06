// Configuração de badges de condição do produto
export const CONDICAO_BADGES = {
  novo: {
    label: 'Novo',
    icon: '✨',
    color: 'bg-green-500',
    textColor: 'text-white',
    description: 'Produto novo, lacrado na embalagem original'
  },
  seminovo: {
    label: 'Seminovo',
    icon: '🔵',
    color: 'bg-blue-500',
    textColor: 'text-white',
    description: 'Produto em excelente estado, pouco uso'
  },
  colecionavel: {
    label: 'Colecionável',
    icon: '⭐',
    color: 'bg-purple-500',
    textColor: 'text-white',
    description: 'Item de coleção, raro ou exclusivo'
  },
  usado: {
    label: 'Usado',
    icon: '🔄',
    color: 'bg-gray-500',
    textColor: 'text-white',
    description: 'Produto usado, em bom estado'
  }
} as const;

// Badges especiais adicionais
export const SPECIAL_BADGES = {
  raro: {
    label: 'Raro',
    icon: '💎',
    color: 'bg-orange-500',
    textColor: 'text-white'
  },
  'edicao-limitada': {
    label: 'Edição Limitada',
    icon: '🔥',
    color: 'bg-red-600',
    textColor: 'text-white'
  },
  vintage: {
    label: 'Vintage',
    icon: '🕰️',
    color: 'bg-amber-600',
    textColor: 'text-white'
  },
  exclusivo: {
    label: 'Exclusivo',
    icon: '👑',
    color: 'bg-yellow-500',
    textColor: 'text-gray-900'
  }
} as const;

export type CondicaoType = keyof typeof CONDICAO_BADGES;
export type SpecialBadgeType = keyof typeof SPECIAL_BADGES;
