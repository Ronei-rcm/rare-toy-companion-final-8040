import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
  showPlaceholder?: boolean;
  enableWebP?: boolean;
  enableAVIF?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

interface ImageState {
  loaded: boolean;
  error: boolean;
  loading: boolean;
  inView: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  blurDataURL,
  priority = false,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  onLoad,
  onError,
  fallback,
  showPlaceholder = true,
  enableWebP = true,
  enableAVIF = false,
  compressionLevel = 'medium'
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<ImageState>({
    loaded: false,
    error: false,
    loading: false,
    inView: false
  });

  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [showFullSize, setShowFullSize] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Gerar URLs otimizadas baseadas no formato suportado
  const generateOptimizedSrc = useCallback((originalSrc: string) => {
    if (!originalSrc) return originalSrc;

    // Se for uma URL externa ou data URL, retornar como está
    if (originalSrc.startsWith('http') || originalSrc.startsWith('data:')) {
      return originalSrc;
    }

    // Detectar formato suportado pelo navegador
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let format = 'jpeg';
    let qualityParam = quality;

    // Verificar suporte a AVIF (mais eficiente)
    if (enableAVIF && canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
      format = 'avif';
      qualityParam = Math.min(quality + 10, 100); // AVIF é mais eficiente
    }
    // Verificar suporte a WebP
    else if (enableWebP && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      format = 'webp';
      qualityParam = Math.min(quality + 5, 100);
    }

    // Adicionar parâmetros de otimização
    const url = new URL(originalSrc, window.location.origin);
    
    // Parâmetros de otimização
    url.searchParams.set('format', format);
    url.searchParams.set('quality', qualityParam.toString());
    
    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    
    // Parâmetros de compressão
    switch (compressionLevel) {
      case 'low':
        url.searchParams.set('compress', '1');
        break;
      case 'medium':
        url.searchParams.set('compress', '2');
        break;
      case 'high':
        url.searchParams.set('compress', '3');
        break;
    }

    return url.toString();
  }, [enableAVIF, enableWebP, quality, width, height, compressionLevel]);

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!imgRef.current || priority) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageState(prev => ({ ...prev, inView: true }));
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Carregar imagem quando entrar na viewport
  useEffect(() => {
    if (priority || imageState.inView) {
      const optimizedSrc = generateOptimizedSrc(src);
      setCurrentSrc(optimizedSrc);
      setImageState(prev => ({ ...prev, loading: true }));
    }
  }, [src, priority, imageState.inView, generateOptimizedSrc]);

  const handleLoad = useCallback(() => {
    setImageState({
      loaded: true,
      error: false,
      loading: false,
      inView: imageState.inView
    });
    onLoad?.();
  }, [onLoad, imageState.inView]);

  const handleError = useCallback(() => {
    setImageState({
      loaded: false,
      error: true,
      loading: false,
      inView: imageState.inView
    });
    onError?.();
  }, [onError, imageState.inView]);

  const handleToggleFullSize = useCallback(() => {
    setShowFullSize(!showFullSize);
  }, [showFullSize]);

  // Renderizar fallback se erro
  if (imageState.error && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder/Loading */}
      <AnimatePresence>
        {showPlaceholder && !imageState.loaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
            style={{ width, height }}
          >
            {imageState.loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Imagem Principal */}
      <motion.img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          imageState.loaded ? 'opacity-100' : 'opacity-0',
          showFullSize ? 'cursor-zoom-out' : 'cursor-zoom-in'
        )}
        style={{ 
          width: showFullSize ? 'auto' : width,
          height: showFullSize ? 'auto' : height,
          maxWidth: showFullSize ? '90vw' : undefined,
          maxHeight: showFullSize ? '90vh' : undefined
        }}
        loading={priority ? 'eager' : loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleToggleFullSize}
      />

      {/* Blur placeholder */}
      {blurDataURL && !imageState.loaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          style={{ width, height }}
        />
      )}

      {/* Overlay de erro */}
      {imageState.error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ width, height }}
        >
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Erro ao carregar imagem</p>
          </div>
        </motion.div>
      )}

      {/* Controles de zoom */}
      {imageState.loaded && !showFullSize && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          onClick={handleToggleFullSize}
        >
          <Eye className="w-4 h-4" />
        </motion.button>
      )}

      {/* Modal de imagem em tamanho real */}
      <AnimatePresence>
        {showFullSize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={handleToggleFullSize}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentSrc}
                alt={alt}
                className="max-w-full max-h-full object-contain"
              />
              <button
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                onClick={handleToggleFullSize}
              >
                <EyeOff className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook para pré-carregar imagens
export function useImagePreloader() {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (srcs: string[]): Promise<void[]> => {
    return Promise.all(srcs.map(preloadImage));
  }, [preloadImage]);

  return { preloadImage, preloadImages };
}

// Componente para carregamento progressivo de imagens
export function ProgressiveImage({ 
  src, 
  alt, 
  className,
  ...props 
}: OptimizedImageProps) {
  const [lowResSrc, setLowResSrc] = useState<string>('');
  const [highResSrc, setHighResSrc] = useState<string>('');

  useEffect(() => {
    // Gerar versão de baixa resolução
    const lowResUrl = new URL(src, window.location.origin);
    lowResUrl.searchParams.set('quality', '20');
    lowResUrl.searchParams.set('w', '100');
    setLowResSrc(lowResUrl.toString());

    // Gerar versão de alta resolução
    const highResUrl = new URL(src, window.location.origin);
    highResUrl.searchParams.set('quality', '85');
    setHighResSrc(highResUrl.toString());
  }, [src]);

  return (
    <div className={cn('relative', className)}>
      {/* Imagem de baixa resolução (blur) */}
      {lowResSrc && (
        <img
          src={lowResSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
        />
      )}
      
      {/* Imagem de alta resolução */}
      <OptimizedImage
        src={highResSrc}
        alt={alt}
        {...props}
        showPlaceholder={false}
      />
    </div>
  );
}
