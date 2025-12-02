import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Imagem",
  placeholder = "URL da imagem ou faça upload",
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resolver URL da imagem para preview
  const resolveImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    const trimmed = url.trim();
    
    // Se já é uma URL absoluta ou data URL, retornar como está
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
      return trimmed;
    }
    
    // Se é uma URL relativa, garantir que comece com /
    const relativeUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    
    // Se for /lovable-uploads/, tentar também via /api/uploads/ como fallback
    // Isso evita problemas com nginx interceptando
    if (relativeUrl.startsWith('/lovable-uploads/')) {
      const filename = relativeUrl.replace('/lovable-uploads/', '');
      // Primeiro tentar URL original
      const originalUrl = `${window.location.origin}${relativeUrl}`;
      // Também preparar URL alternativa via API
      const apiUrl = `${window.location.origin}/api/uploads/${filename}`;
      // Retornar original, mas o onError tentará a alternativa
      return originalUrl;
    }
    
    // Para outras URLs relativas, usar window.location.origin
    return `${window.location.origin}${relativeUrl}`;
  };
  
  const imageUrl = resolveImageUrl(value);
  
  // Preparar URLs alternativas via API se for lovable-uploads
  const getAlternativeUrls = (url: string | undefined): string[] => {
    if (!url) return [];
    const trimmed = url.trim();
    if (trimmed.startsWith('/lovable-uploads/')) {
      const filename = trimmed.replace('/lovable-uploads/', '');
      const base = window.location.origin;
      // Múltiplas rotas alternativas para garantir que pelo menos uma funcione
      // Ordem: tentar rotas menos comuns primeiro (menos provável de serem interceptadas pelo nginx)
      return [
        `${base}/api/file/${filename}`,      // Menos comum
        `${base}/api/asset/${filename}`,     // Menos comum
        `${base}/api/media/${filename}`,     // Menos comum
        `${base}/api/static/${filename}`,   // Menos comum
        `${base}/api/files/${filename}`,     // Alternativa
        `${base}/api/img/${filename}`,       // Alternativa
        `${base}/api/uploads/${filename}`    // Padrão (pode ser interceptado pelo nginx)
      ];
    }
    return [];
  };
  
  const alternativeUrls = getAlternativeUrls(value);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      console.log('📤 Upload response:', result);
      
      if (result.success && result.imageUrl) {
        const imageUrl = result.imageUrl;
        console.log('🖼️ Image URL recebida:', imageUrl);
        console.log('💾 Salvando imagem no tema...');
        
        onChange(imageUrl);
        toast.success("Imagem carregada com sucesso!");
        
        console.log('✅ Imagem salva com sucesso:', imageUrl);
      } else {
        const errorMsg = result.error || 'Upload failed';
        console.error('❌ Erro no upload:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao fazer upload: ${errorMessage}`);
    } finally {
      setUploading(false);
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearImage = () => {
    onChange('');
    setImageError(false);
    setImageLoading(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Reset loading state when value changes
  useEffect(() => {
    if (value) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [value]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        {value && (
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Clique ou arraste uma imagem aqui</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP até 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {value && !uploading && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Preview:</p>
            {imageError && (
              <p className="text-xs text-destructive">Erro ao carregar imagem</p>
            )}
          </div>
          <div className="relative inline-block group">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-md">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img 
              src={imageUrl} 
              alt="Preview"
              className={`max-h-32 max-w-32 object-contain rounded-md border bg-white p-1 transition-opacity ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const currentSrc = target.src;
                let attempts = 0;
                const maxAttempts = alternativeUrls.length + 3; // Todas as URLs alternativas + 3 tentativas extras
                
                // Função para tentar próxima URL
                const tryNext = () => {
                  attempts++;
                  
                  // Tentar URLs alternativas via API (múltiplas rotas)
                  if (attempts <= alternativeUrls.length) {
                    const altUrl = alternativeUrls[attempts - 1];
                    console.log(`🔄 Tentativa ${attempts}: URL via API (${altUrl.split('/api/')[1].split('/')[0]}):`, altUrl);
                    target.src = altUrl;
                    setImageLoading(true);
                    return;
                  }
                  
                  // Tentar URL relativa direta
                  if (attempts === alternativeUrls.length + 1 && value) {
                    const relativeUrl = value.startsWith('/') ? value : `/${value}`;
                    console.log(`🔄 Tentativa ${attempts}: URL relativa:`, relativeUrl);
                    target.src = relativeUrl;
                    setImageLoading(true);
                    return;
                  }
                  
                  // Tentar com timestamp para bypass cache
                  if (attempts === alternativeUrls.length + 2 && currentSrc && !currentSrc.includes('?v=')) {
                    const urlWithCache = `${currentSrc}?v=${Date.now()}`;
                    console.log(`🔄 Tentativa ${attempts}: Cache bypass:`, urlWithCache);
                    target.src = urlWithCache;
                    setImageLoading(true);
                    return;
                  }
                  
                  // Se todas as tentativas falharam, usar placeholder
                  console.log('❌ Todas as tentativas falharam para:', value);
                  setImageError(true);
                  setImageLoading(false);
                  target.onerror = null; // Evitar loop infinito
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                };
                
                // Configurar handler de erro para tentar próxima URL
                target.onerror = () => {
                  if (attempts < maxAttempts) {
                    tryNext();
                  } else {
                    target.onerror = null; // Evitar loop infinito
                    setImageError(true);
                    setImageLoading(false);
                  }
                };
                
                // Tentar primeira alternativa
                tryNext();
              }}
              onLoad={() => {
                setImageError(false);
                setImageLoading(false);
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-md transition-colors" />
          </div>
          {value && (
            <p className="text-xs text-muted-foreground mt-2 break-all">
              {value}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;