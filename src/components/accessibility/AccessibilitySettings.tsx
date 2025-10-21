import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Accessibility, 
  Eye, 
  Type, 
  MousePointer, 
  Volume2, 
  Keyboard,
  Contrast,
  Zap
} from 'lucide-react';
import useAccessibility from '@/hooks/useAccessibility';

interface AccessibilitySettingsProps {
  className?: string;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ className }) => {
  const {
    reducedMotion,
    highContrast,
    fontSize,
    isKeyboardUser,
    announce,
    setFontSize,
    setHighContrast,
    enhanceKeyboardNavigation,
    addSkipLinks
  } = useAccessibility();

  const [showSettings, setShowSettings] = React.useState(false);

  const handleFontSizeChange = (value: string) => {
    setFontSize(value as 'small' | 'medium' | 'large');
    announce(`Tamanho da fonte alterado para ${value}`);
  };

  const handleHighContrastToggle = (enabled: boolean) => {
    setHighContrast(enabled);
    announce(enabled ? 'Alto contraste ativado' : 'Alto contraste desativado');
  };

  const enableAccessibilityFeatures = () => {
    enhanceKeyboardNavigation();
    addSkipLinks();
    announce('Recursos de acessibilidade ativados');
  };

  const fontSizeOptions = [
    { value: 'small', label: 'Pequeno', description: 'Mais compacto' },
    { value: 'medium', label: 'Médio', description: 'Padrão' },
    { value: 'large', label: 'Grande', description: 'Mais legível' }
  ];

  return (
    <>
      {/* Botão de acesso rápido */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setShowSettings(!showSettings)}
          size="icon"
          className="rounded-full shadow-lg"
          aria-label="Configurações de acessibilidade"
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </div>

      {/* Painel de configurações */}
      {showSettings && (
        <Card className={`fixed bottom-20 left-4 z-50 w-80 max-w-[calc(100vw-2rem)] ${className}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Accessibility className="h-5 w-5" />
              Acessibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status atual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {isKeyboardUser && (
                  <Badge variant="secondary" className="text-xs">
                    <Keyboard className="h-3 w-3 mr-1" />
                    Teclado
                  </Badge>
                )}
                {reducedMotion && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Movimento reduzido
                  </Badge>
                )}
                {highContrast && (
                  <Badge variant="secondary" className="text-xs">
                    <Contrast className="h-3 w-3 mr-1" />
                    Alto contraste
                  </Badge>
                )}
              </div>
            </div>

            {/* Tamanho da fonte */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tamanho da Fonte
              </Label>
              <Select value={fontSize} onValueChange={handleFontSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alto contraste */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                Alto Contraste
              </Label>
              <Switch
                checked={highContrast}
                onCheckedChange={handleHighContrastToggle}
                aria-label="Ativar alto contraste"
              />
            </div>

            {/* Botão para ativar recursos */}
            <Button 
              onClick={enableAccessibilityFeatures} 
              className="w-full"
              variant="outline"
            >
              <Accessibility className="h-4 w-4 mr-2" />
              Ativar Recursos de Acessibilidade
            </Button>

            {/* Dicas de acessibilidade */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="text-sm font-medium mb-2">💡 Dicas:</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use Tab para navegar</li>
                <li>• Enter ou Espaço para ativar</li>
                <li>• Esc para fechar modais</li>
                <li>• Setas para navegar em menus</li>
              </ul>
            </div>

            {/* Fechar */}
            <Button 
              onClick={() => setShowSettings(false)} 
              variant="ghost" 
              className="w-full"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AccessibilitySettings;
