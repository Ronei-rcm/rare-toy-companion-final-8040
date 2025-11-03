import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { useHomeConfig } from '@/contexts/HomeConfigContext';

interface HomePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

const HomePreview: React.FC<HomePreviewProps> = ({ isOpen, onClose }) => {
  const { config } = useHomeConfig();
  const [device, setDevice] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getDeviceClass = () => {
    switch (device) {
      case 'mobile':
        return 'w-80 h-[600px]';
      case 'tablet':
        return 'w-96 h-[700px]';
      default:
        return 'w-full h-[800px]';
    }
  };

  const renderSection = (section: any) => {
    if (!section.enabled) return null;

    switch (section.id) {
      case 'hero':
        return (
          <div key={section.id} className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded mb-4">
            <h1 className="text-xl font-bold mb-2">{config.hero.title}</h1>
            <p className="text-sm opacity-90 mb-3">{config.hero.subtitle}</p>
            <Button size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
              {config.hero.ctaText}
            </Button>
          </div>
        );

      case 'produtos-destaque':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.produtosDestaque.title}</h2>
              <p className="text-sm text-gray-600">{config.produtosDestaque.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-2">
                  <CardContent className="p-2">
                    <div className="w-full h-16 bg-gray-200 rounded mb-2"></div>
                    <p className="text-xs font-medium">Produto {i + 1}</p>
                    <p className="text-xs text-gray-500">R$ 99,90</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'categorias':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.categorias.title}</h2>
              <p className="text-sm text-gray-600">{config.categorias.subtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-center p-2 border rounded">
                  <div className="w-8 h-8 bg-gray-300 rounded mx-auto mb-1"></div>
                  <p className="text-xs">Categoria {i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'eventos':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.eventos.title}</h2>
              <p className="text-sm text-gray-600">{config.eventos.subtitle}</p>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Evento {i + 1}</p>
                        <p className="text-xs text-gray-500">Data: 15/05/2024</p>
                        <Badge variant="secondary" className="text-xs mt-1">Ativo</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'social-proof':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.socialProof.title}</h2>
              <p className="text-sm text-gray-600">{config.socialProof.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {config.socialProof.stats.slice(0, 4).map((stat, i) => (
                <div key={i} className="text-center p-2 border rounded">
                  <p className="text-lg font-bold text-purple-600">{stat.number}</p>
                  <p className="text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'features':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.features.title}</h2>
              <p className="text-sm text-gray-600">{config.features.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {config.features.items.slice(0, 4).map((feature, i) => (
                <div key={i} className="text-center p-2 border rounded">
                  <p className="text-lg mb-1">{feature.icon}</p>
                  <p className="text-xs font-medium">{feature.title}</p>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div key={section.id} className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg font-semibold">{config.testimonials.title}</h2>
              <p className="text-sm text-gray-600">{config.testimonials.subtitle}</p>
            </div>
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-3">
                  <CardContent className="p-0">
                    <p className="text-xs mb-2">"Excelente produto, entrega rápida!"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      <div>
                        <p className="text-xs font-medium">Cliente {i + 1}</p>
                        <div className="flex text-yellow-400 text-xs">★★★★★</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div key={section.id} className="bg-gray-100 text-center p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">{config.cta.title}</h2>
            <p className="text-sm text-gray-600 mb-3">{config.cta.subtitle}</p>
            <Button size="sm">{config.cta.buttonText}</Button>
          </div>
        );

      default:
        return (
          <div key={section.id} className="border-2 border-dashed border-gray-300 p-4 rounded text-center mb-4">
            <p className="text-sm text-gray-500">{section.name}</p>
            <Badge variant="outline" className="mt-1">Seção Ativa</Badge>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview da Home
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controles de dispositivo */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={device === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                variant={device === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('tablet')}
              >
                <Tablet className="h-4 w-4 mr-1" />
                Tablet
              </Button>
              <Button
                variant={device === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Abrir Home Real
            </Button>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <div className={`border rounded-lg overflow-y-auto bg-white ${getDeviceClass()}`}>
              <div className="p-4">
                {config.sections && Array.isArray(config.sections) && config.sections
                  .sort((a, b) => a.order - b.order)
                  .map(renderSection)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomePreview;
