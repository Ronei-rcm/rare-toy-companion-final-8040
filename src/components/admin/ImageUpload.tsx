import React, { useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Toast usando sonner

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
      
      if (result.success) {
        onChange(result.imageUrl);
        toast.success("Imagem carregada com sucesso!");
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao fazer upload da imagem.");
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <div className="relative inline-block">
            <img 
              src={value} 
              alt="Preview"
              className="h-20 w-20 object-cover rounded-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;