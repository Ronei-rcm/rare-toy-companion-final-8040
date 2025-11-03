import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Crop, 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Download,
  Save,
  X,
  Undo,
  Redo,
  Filter,
  Contrast,
  Brightness,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onClose: () => void;
  className?: string;
}

interface TransformState {
  scale: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onSave,
  onClose,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<TransformState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [transform, setTransform] = useState<TransformState>({
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    blur: 0,
    crop: null
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    loadImage();
  }, [imageUrl]);

  useEffect(() => {
    if (imageRef.current) {
      drawImage();
    }
  }, [transform]);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setIsLoading(false);
      saveToHistory();
      drawImage();
    };
    img.onerror = () => {
      toast.error('Erro ao carregar imagem');
      setIsLoading(false);
    };
    img.src = imageUrl;
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 800;
    canvas.height = 600;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar transformações
    ctx.save();

    // Centralizar
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Aplicar rotação
    ctx.rotate((transform.rotation * Math.PI) / 180);

    // Aplicar escala
    ctx.scale(transform.scale, transform.scale);

    // Aplicar flip
    if (transform.flipX) ctx.scale(-1, 1);
    if (transform.flipY) ctx.scale(1, -1);

    // Aplicar filtros
    const filters = [
      `brightness(${100 + transform.brightness}%)`,
      `contrast(${100 + transform.contrast}%)`,
      `saturate(${100 + transform.saturation}%)`,
      `hue-rotate(${transform.hue}deg)`,
      `blur(${transform.blur}px)`
    ].join(' ');

    ctx.filter = filters;

    // Desenhar imagem
    const imgWidth = img.width * 0.5;
    const imgHeight = img.height * 0.5;
    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    ctx.restore();
  };

  const saveToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...transform });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTransform(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTransform(history[historyIndex + 1]);
    }
  };

  const reset = () => {
    setTransform({
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      blur: 0,
      crop: null
    });
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onSave(url);
        toast.success('Imagem editada salva com sucesso!');
      }
    }, 'image/jpeg', 0.9);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'imagem-editada.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const updateTransform = (updates: Partial<TransformState>) => {
    setTransform(prev => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Editor de Imagem
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transform" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transform">Transformar</TabsTrigger>
              <TabsTrigger value="filters">Filtros</TabsTrigger>
              <TabsTrigger value="crop">Cortar</TabsTrigger>
              <TabsTrigger value="adjust">Ajustar</TabsTrigger>
            </TabsList>

            <TabsContent value="transform" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Escala</label>
                    <Badge variant="outline">{Math.round(transform.scale * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[transform.scale]}
                    onValueChange={([value]) => updateTransform({ scale: value })}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Rotação</label>
                    <Badge variant="outline">{transform.rotation}°</Badge>
                  </div>
                  <Slider
                    value={[transform.rotation]}
                    onValueChange={([value]) => updateTransform({ rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTransform({ rotation: transform.rotation - 90 })}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  -90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTransform({ rotation: transform.rotation + 90 })}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  +90°
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTransform({ flipX: !transform.flipX })}
                >
                  <FlipHorizontal className="w-4 h-4 mr-2" />
                  Flip H
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTransform({ flipY: !transform.flipY })}
                >
                  <FlipVertical className="w-4 h-4 mr-2" />
                  Flip V
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Brilho</label>
                    <Badge variant="outline">{transform.brightness}</Badge>
                  </div>
                  <Slider
                    value={[transform.brightness]}
                    onValueChange={([value]) => updateTransform({ brightness: value })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Contraste</label>
                    <Badge variant="outline">{transform.contrast}</Badge>
                  </div>
                  <Slider
                    value={[transform.contrast]}
                    onValueChange={([value]) => updateTransform({ contrast: value })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Saturação</label>
                    <Badge variant="outline">{transform.saturation}</Badge>
                  </div>
                  <Slider
                    value={[transform.saturation]}
                    onValueChange={([value]) => updateTransform({ saturation: value })}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Matiz</label>
                    <Badge variant="outline">{transform.hue}°</Badge>
                  </div>
                  <Slider
                    value={[transform.hue]}
                    onValueChange={([value]) => updateTransform({ hue: value })}
                    min={-180}
                    max={180}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="crop" className="space-y-4">
              <div className="text-center text-muted-foreground">
                <Crop className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Funcionalidade de corte em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá cortar imagens diretamente aqui!</p>
              </div>
            </TabsContent>

            <TabsContent value="adjust" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Desfoque</label>
                  <Badge variant="outline">{transform.blur}px</Badge>
                </div>
                <Slider
                  value={[transform.blur]}
                  onValueChange={([value]) => updateTransform({ blur: value })}
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Canvas */}
          <div className="mt-6 border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-96 object-contain"
              style={{ imageRendering: 'high-quality' }}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={undo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4 mr-2" />
                Desfazer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4 mr-2" />
                Refazer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageEditor;
