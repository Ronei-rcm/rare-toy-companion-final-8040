import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CONDICAO_BADGES, SPECIAL_BADGES, CondicaoType, SpecialBadgeType } from '@/config/productBadges';

interface ProductBadgesProps {
  condicao?: CondicaoType;
  badges?: SpecialBadgeType[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente para exibir badges de condição e especiais do produto
 */
export const ProductBadges: React.FC<ProductBadgesProps> = ({ 
  condicao, 
  badges = [], 
  className = '',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {/* Badge de condição (novo, seminovo, colecionável, usado) */}
      {condicao && CONDICAO_BADGES[condicao] && (
        <Badge 
          className={`${CONDICAO_BADGES[condicao].color} ${CONDICAO_BADGES[condicao].textColor} ${sizeClasses[size]} shadow-sm`}
          title={CONDICAO_BADGES[condicao].description}
        >
          <span className="mr-1">{CONDICAO_BADGES[condicao].icon}</span>
          {CONDICAO_BADGES[condicao].label}
        </Badge>
      )}
      
      {/* Badges especiais (raro, edição limitada, vintage, etc.) */}
      {badges.map((badgeKey) => {
        const badge = SPECIAL_BADGES[badgeKey];
        if (!badge) return null;
        
        return (
          <Badge 
            key={badgeKey}
            className={`${badge.color} ${badge.textColor} ${sizeClasses[size]} shadow-sm`}
          >
            <span className="mr-1">{badge.icon}</span>
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
};

export default ProductBadges;
