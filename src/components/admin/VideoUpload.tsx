import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  value?: string;
  onChange: (videoUrl: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  value,
  onChange,
  label = "Vídeo",
  placeholder = "URL do vídeo ou faça upload",
  className = ""
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error("Por favor, selecione apenas arquivos de vídeo.");
      return;
    }

    // Limite de 500MB
    if (file.size > 500 * 1024 * 1024) {
      toast.error("O vídeo deve ter no máximo 500MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();

      // Monitorar progresso
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      // Promise para o upload
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };

        xhr.open('POST', '/api/upload/video');
        xhr.send(formData);
      });

      const result: any = await uploadPromise;
      
      console.log('🎥 Upload response:', result);
      
      if (result.success && result.videoUrl) {
        const videoUrl = result.videoUrl;
        console.log('🎥 Video URL recebida:', videoUrl);
        
        onChange(videoUrl);
        toast.success("Vídeo carregado com sucesso!");
        
        console.log('✅ Vídeo salvo com sucesso:', videoUrl);
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

  const clearVideo = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* URL Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {value && (
          <Button 
            type="button"
            variant="outline" 
            size="sm"
            onClick={clearVideo}
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
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando vídeo...</p>
            {uploadProgress > 0 && (
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Video className="w-8 h-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Clique ou arraste um vídeo aqui</p>
              <p className="text-xs text-muted-foreground">MP4, WebM, MOV até 500MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Preview */}
      {value && !uploading && (
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <div className="relative">
            <video 
              src={value} 
              controls
              className="w-full max-w-md rounded-md"
              onError={(e) => {
                console.error('Erro ao carregar vídeo:', value);
              }}
            >
              Seu navegador não suporta a tag de vídeo.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;

