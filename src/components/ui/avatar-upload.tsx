import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
  name?: string;
  disabled?: boolean;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  name = 'avatar',
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para o servidor
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload da imagem');
      }

      const result = await response.json();
      onChange(result.imageUrl);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao fazer upload da imagem');
      setPreview(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Label>Avatar</Label>
      
      <Card className="w-fit">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 cursor-pointer" onClick={handleClick}>
                <AvatarImage src={preview || undefined} alt="Avatar" />
                <AvatarFallback className="text-lg">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              
              {!disabled && (
                <div className="absolute -bottom-1 -right-1">
                  <Button
                    size="sm"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={handleClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  disabled={disabled || isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {preview ? 'Alterar' : 'Adicionar'}
                </Button>
                
                {preview && !disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isUploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou GIF até 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};
