import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBadges } from '@/hooks/useBadges';
import { CONDICAO_BADGES } from '@/config/productBadges';

interface BadgeSelectorProps {
  productId?: string | number;
  selectedCondicao?: string;
  selectedBadges?: number[];
  onCondicaoChange?: (condicao: string) => void;
  onBadgesChange?: (badgeIds: number[]) => void;
  className?: string;
}

/**
 * Componente para selecionar condição e badges especiais do produto
 */
export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  productId,
  selectedCondicao = 'novo',
  selectedBadges = [],
  onCondicaoChange,
  onBadgesChange,
  className = ''
}) => {
  const { badges, loading } = useBadges();
  const [condicao, setCondicao] = useState(selectedCondicao);
  const [checkedBadges, setCheckedBadges] = useState<number[]>(selectedBadges);

  // Badges especiais (excluir os 4 primeiros que são condições)
  const specialBadges = badges.filter(b => b.id > 4);

  useEffect(() => {
    setCondicao(selectedCondicao);
  }, [selectedCondicao]);

  useEffect(() => {
    setCheckedBadges(selectedBadges);
  }, [selectedBadges]);

  const handleCondicaoChange = (value: string) => {
    setCondicao(value);
    onCondicaoChange?.(value);
  };

  const handleBadgeToggle = (badgeId: number) => {
    const newCheckedBadges = checkedBadges.includes(badgeId)
      ? checkedBadges.filter(id => id !== badgeId)
      : [...checkedBadges, badgeId];
    
    setCheckedBadges(newCheckedBadges);
    onBadgesChange?.(newCheckedBadges);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando badges...</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Condição do Produto */}
      <div className="space-y-2">
        <Label htmlFor="condicao">Condição do Produto</Label>
        <Select value={condicao} onValueChange={handleCondicaoChange}>
          <SelectTrigger id="condicao">
            <SelectValue placeholder="Selecione a condição" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CONDICAO_BADGES).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <span>{value.icon}</span>
                  <span>{value.label}</span>
                  <span className="text-xs text-muted-foreground">({value.description})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Preview da condição selecionada */}
        {condicao && CONDICAO_BADGES[condicao as keyof typeof CONDICAO_BADGES] && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Preview:</span>
            <Badge className={`${CONDICAO_BADGES[condicao as keyof typeof CONDICAO_BADGES].color} ${CONDICAO_BADGES[condicao as keyof typeof CONDICAO_BADGES].textColor}`}>
              {CONDICAO_BADGES[condicao as keyof typeof CONDICAO_BADGES].icon} {CONDICAO_BADGES[condicao as keyof typeof CONDICAO_BADGES].label}
            </Badge>
          </div>
        )}
      </div>

      {/* Badges Especiais */}
      {specialBadges.length > 0 && (
        <div className="space-y-2">
          <Label>Badges Especiais (opcional)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/20">
            {specialBadges.map((badge) => (
              <div key={badge.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`badge-${badge.id}`}
                  checked={checkedBadges.includes(badge.id)}
                  onCheckedChange={() => handleBadgeToggle(badge.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`badge-${badge.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{badge.icone}</span>
                    <span>{badge.nome}</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {badge.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Preview dos badges selecionados */}
          {checkedBadges.length > 0 && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <span className="text-xs text-muted-foreground">Badges selecionados:</span>
              <div className="flex flex-wrap gap-2">
                {specialBadges
                  .filter(b => checkedBadges.includes(b.id))
                  .map(badge => (
                    <Badge key={badge.id} className={`bg-${badge.cor}-500 text-white`}>
                      {badge.icone} {badge.nome}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeSelector;
