import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  AlertCircle, 
  Plus,
  Trash2,
  Eye,
  Download,
  RotateCcw,
  Crop,
  Filter,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isUploading?: boolean;
  isMain?: boolean;
  order: number;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

interface ImageGalleryUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  label?: string;
  maxImages?: number;
  maxSizePerImage?: number; // em MB
  acceptedTypes?: string[];
  showPreview?: boolean;
  allowReorder?: boolean;
  allowMainImage?: boolean;
  className?: string;
}

const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({
  images = [],
  onChange,
  label = "Galeria de Imagens",
  maxImages = 10,
  maxSizePerImage = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  showPreview = true,
  allowReorder = true,
  allowMainImage = true,
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Validar tipo de arquivo
    if (!acceptedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado. Use: ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Validar tamanho
    const maxSizeBytes = maxSizePerImage * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${maxSizePerImage}MB`;
    }

    return null;
  }, [acceptedTypes, maxSizePerImage]);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (files: FileList) => {
    setError(null);
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validar todos os arquivos
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('; '));
      toast.error(`Erro de validação: ${errors[0]}`);
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      setError(`Máximo de ${maxImages} imagens permitidas`);
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const newImages: ImageItem[] = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progress = ((i + 1) / validFiles.length) * 100;
        setUploadProgress(progress);

        // Obter dimensões da imagem
        const dimensions = await getImageDimensions(file);

        // Simular upload (substitua pela sua API)
        const imageUrl = URL.createObjectURL(file);
        
        const newImage: ImageItem = {
          id: `temp-${Date.now()}-${i}`,
          url: imageUrl,
          file: file,
          isUploading: false,
          isMain: images.length === 0 && i === 0, // Primeira imagem é principal
          order: images.length + i,
          metadata: {
            size: file.size,
            type: file.type,
            dimensions
          }
        };

        newImages.push(newImage);
      }

      onChange([...images, ...newImages]);
      toast.success(`${validFiles.length} imagem(ns) adicionada(s) com sucesso!`);
      setError(null);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Erro ao fazer upload das imagens');
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Se removemos a imagem principal, definir a primeira como principal
    if (images.find(img => img.id === imageId)?.isMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
    }
    onChange(updatedImages);
  };

  const setMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isMain: img.id === imageId
    }));
    onChange(updatedImages);
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Atualizar ordem
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      order: index
    }));
    
    onChange(reorderedImages);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <Badge variant="outline" className="text-xs">
          {images.length}/{maxImages} imagens
        </Badge>
      </div>
      
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-gray-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && images.length < maxImages && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Carregando imagens...</p>
              <Progress value={uploadProgress} className="w-full h-2" />
              <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% concluído</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {images.length >= maxImages 
                  ? `Máximo de ${maxImages} imagens atingido`
                  : 'Clique ou arraste imagens aqui'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} até {maxSizePerImage}MB cada
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {images.length > 0 && showPreview && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Galeria de Imagens:</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, index) => (
              <Card key={image.id} className="relative group overflow-hidden">
                <CardContent className="p-2">
                  <div className="relative">
                    <img 
                      src={image.url} 
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCAzMEM0Mi40NzcyIDMwIDM4IDM0LjQ3NzIgMzggNDBTNDIuNDc3MiA1MCA0OCA1MEM1My41MjI4IDUwIDU4IDQ1LjUyMjggNTggNDBTNTMuNTIyOCAzMCA0OCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTQ4IDM2QzQ0LjY4NjMgMzYgNDIgMzguNjg2MyA0MiA0MkM0MiA0NS4zMTM3IDQ0LjY4NjMgNDggNDggNDhDNTUuMzEzNyA0OCA1OCA0NS4zMTM3IDU4IDQyQzU4IDM4LjY4NjMgNTUuMzEzNyAzNiA0OCAzNloiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                      }}
                    />
                    
                    {/* Overlay com ações */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <div className="flex gap-1">
                        {allowMainImage && (
                          <Button
                            size="sm"
                            variant={image.isMain ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMainImage(image.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Star className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Implementar visualização em tela cheia
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(image.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-1 left-1 flex gap-1">
                      {image.isMain && (
                        <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                          <Star className="w-2 h-2 mr-1" />
                          Principal
                        </Badge>
                      )}
                      {image.isUploading && (
                        <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                          <Loader2 className="w-2 h-2 mr-1 animate-spin" />
                          Upload
                        </Badge>
                      )}
                    </div>

                    {/* Ordem */}
                    <div className="absolute top-1 right-1">
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        {index + 1}
                      </Badge>
                    </div>
                  </div>

                  {/* Metadados */}
                  {image.metadata && (
                    <div className="mt-2 text-xs text-gray-500">
                      <p>{image.metadata.dimensions?.width}x{image.metadata.dimensions?.height}</p>
                      <p>{formatFileSize(image.metadata.size)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryUpload;
