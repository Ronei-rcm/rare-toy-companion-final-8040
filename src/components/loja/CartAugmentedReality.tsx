import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Camera, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Monitor, 
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
  Sparkles,
  Target,
  Move3D,
  Layers,
  Scan,
  QrCode
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ARProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  arModelUrl?: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  features: string[];
  arPreview?: string;
}

interface ARSettings {
  enableAR: boolean;
  showDimensions: boolean;
  showPrice: boolean;
  showFeatures: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  quality: 'low' | 'medium' | 'high';
}

const CartAugmentedReality: React.FC = () => {
  const { state } = useCart();
  const [arSettings, setArSettings] = useState<ARSettings>({
    enableAR: false,
    showDimensions: true,
    showPrice: true,
    showFeatures: true,
    soundEnabled: true,
    hapticFeedback: true,
    quality: 'medium'
  });
  const [isARActive, setIsARActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ARProduct | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [arSupported, setArSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Verificar suporte a AR
  useEffect(() => {
    const checkARSupport = () => {
      const hasWebGL = !!window.WebGLRenderingContext;
      const hasWebXR = 'xr' in navigator;
      const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
      
      setArSupported(hasWebGL && hasCamera);
    };

    checkARSupport();
  }, []);

  // Solicitar permissão da câmera
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission(true);
      toast.success('🎥 Câmera ativada com sucesso!');
    } catch (error) {
      setCameraPermission(false);
      toast.error('❌ Não foi possível acessar a câmera');
    }
  };

  // Iniciar AR
  const startAR = async () => {
    if (!arSupported) {
      toast.error('📱 Seu dispositivo não suporta AR');
      return;
    }

    if (!cameraPermission) {
      await requestCameraPermission();
    }

    setIsARActive(true);
    toast.success('🚀 Realidade Aumentada ativada!');
  };

  // Parar AR
  const stopAR = () => {
    setIsARActive(false);
    setSelectedProduct(null);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    toast.info('⏹️ AR desativada');
  };

  // Simular detecção de produto
  const simulateProductDetection = (product: any) => {
    const arProduct: ARProduct = {
      id: product.id,
      name: product.nome,
      price: product.preco,
      imageUrl: product.imagemUrl || '',
      dimensions: {
        width: Math.random() * 20 + 10, // 10-30cm
        height: Math.random() * 20 + 10,
        depth: Math.random() * 10 + 5
      },
      features: [
        'Material premium',
        'Certificado de segurança',
        'Garantia estendida',
        'Entrega rápida'
      ]
    };

    setSelectedProduct(arProduct);
    
    if (arSettings.hapticFeedback) {
      navigator.vibrate?.(100);
    }
    
    toast.success(`🎯 Produto detectado: ${arProduct.name}`);
  };

  // Renderizar overlay AR
  const renderAROverlay = () => {
    if (!canvasRef.current || !selectedProduct) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar informações do produto
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(20, 20, 300, 150);

    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(selectedProduct.name, 30, 45);

    if (arSettings.showPrice) {
      ctx.font = '14px Arial';
      ctx.fillText(`R$ ${selectedProduct.price.toFixed(2)}`, 30, 70);
    }

    if (arSettings.showDimensions) {
      ctx.font = '12px Arial';
      ctx.fillText(
        `${selectedProduct.dimensions.width.toFixed(1)} x ${selectedProduct.dimensions.height.toFixed(1)} x ${selectedProduct.dimensions.depth.toFixed(1)} cm`,
        30,
        95
      );
    }

    // Desenhar botões de ação
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillRect(30, 110, 80, 30);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText('Adicionar', 45, 130);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.fillRect(120, 110, 80, 30);
    ctx.fillStyle = 'white';
    ctx.fillText('Comprar', 135, 130);
  };

  // Atualizar overlay quando produto muda
  useEffect(() => {
    if (isARActive) {
      const interval = setInterval(renderAROverlay, 100);
      return () => clearInterval(interval);
    }
  }, [isARActive, selectedProduct, arSettings]);

  const toggleSetting = (key: keyof ARSettings) => {
    setArSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (state.itens.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Camera className="h-12 w-12 mx-auto text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Realidade Aumentada
          </h3>
          <p className="text-blue-700">
            Adicione produtos ao carrinho para visualizar em AR!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header AR */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Realidade Aumentada</CardTitle>
                <p className="text-blue-100 text-sm">
                  Visualize seus produtos no mundo real
                </p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white">
              {arSupported ? 'Suportado' : 'Não Suportado'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Controles AR */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Controles AR</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Camera className="h-5 w-5" />
              <div>
                <p className="font-medium">Ativar Câmera</p>
                <p className="text-sm text-muted-foreground">
                  {cameraPermission ? 'Permissão concedida' : 'Solicitar permissão'}
                </p>
              </div>
            </div>
            <Button 
              onClick={isARActive ? stopAR : startAR}
              variant={isARActive ? "destructive" : "default"}
              disabled={!arSupported}
            >
              {isARActive ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Parar AR
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Iniciar AR
                </>
              )}
            </Button>
          </div>

          <Separator />

          {/* Configurações AR */}
          <div className="space-y-3">
            <h4 className="font-medium">Configurações</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="h-4 w-4" />
                  <span className="text-sm">Mostrar Dimensões</span>
                </div>
                <Switch
                  checked={arSettings.showDimensions}
                  onCheckedChange={() => toggleSetting('showDimensions')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span className="text-sm">Mostrar Preço</span>
                </div>
                <Switch
                  checked={arSettings.showPrice}
                  onCheckedChange={() => toggleSetting('showPrice')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Som</span>
                </div>
                <Switch
                  checked={arSettings.soundEnabled}
                  onCheckedChange={() => toggleSetting('soundEnabled')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Vibração</span>
                </div>
                <Switch
                  checked={arSettings.hapticFeedback}
                  onCheckedChange={() => toggleSetting('hapticFeedback')}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizador AR */}
      {isARActive && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scan className="h-5 w-5" />
              <span>Visualizador AR</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative">
              {/* Câmera */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              
              {/* Overlay AR */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                width={640}
                height={480}
              />

              {/* Controles de overlay */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button size="sm" variant="secondary">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Instruções */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 text-white p-3 rounded-lg">
                  <p className="text-sm text-center">
                    📱 Aponte a câmera para uma superfície plana para visualizar os produtos
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Produtos para AR */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Move3D className="h-5 w-5 text-purple-500" />
          <span>Produtos no Carrinho</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.itens.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <img
                      src={item.produto.imagemUrl || '/placeholder.svg'}
                      alt={item.produto.nome}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2">
                      {item.produto.nome}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.produto.preco.toFixed(2)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => simulateProductDetection(item.produto)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Visualizar em AR
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Informações do produto selecionado */}
      {selectedProduct && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Produto Detectado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold">{selectedProduct.name}</h4>
                  <p className="text-lg font-bold text-green-600">
                    R$ {selectedProduct.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Largura</p>
                  <p className="font-semibold">{selectedProduct.dimensions.width.toFixed(1)}cm</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Altura</p>
                  <p className="font-semibold">{selectedProduct.dimensions.height.toFixed(1)}cm</p>
                </div>
                <div className="bg-white/50 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">Profundidade</p>
                  <p className="font-semibold">{selectedProduct.dimensions.depth.toFixed(1)}cm</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  Adicionar ao Carrinho
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Comprar Agora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de uso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Dicas para melhor experiência AR</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use em ambiente bem iluminado</li>
                <li>• Mantenha o dispositivo estável</li>
                <li>• Aponte para superfícies planas</li>
                <li>• Ajuste o zoom para melhor visualização</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartAugmentedReality;
