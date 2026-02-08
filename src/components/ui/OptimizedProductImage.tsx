import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getProductImage } from '@/utils/imageUtils';
import { MOCK_PRODUCTS } from '@/services/fallback-data';

interface OptimizedProductImageProps {
  produto: any;
  alt: string;
  className?: string;
  aspectRatio?: number;
  showSkeleton?: boolean;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente otimizado para exibir imagens de produtos
 * - Lazy loading automático
 * - Skeleton/placeholder durante carregamento
 * - Fallback inteligente para imagem base64 (MOCK_PRODUCTS)
 * - Suporte a diferentes aspect ratios
 */
const OptimizedProductImage: React.FC<OptimizedProductImageProps> = ({
  produto,
  alt,
  className,
  aspectRatio = 1,
  showSkeleton = true,
  priority = false,
  sizes,
  onLoad,
  onError,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const imageUrl = getProductImage(produto);
  const isPlaceholder = imageUrl === '/placeholder.svg';

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Se deu erro na imagem principal, tenta achar o fallback no MOCK_PRODUCTS
    if (!usedFallback) {
      const fallbackProduct = MOCK_PRODUCTS.find(p => p.id === produto?.id || p.nome === produto?.nome);
      if (fallbackProduct && fallbackProduct.imagemUrl && fallbackProduct.imagemUrl !== imageUrl) {
        console.warn(`⚠️ Imagem falhou para "${produto.nome}". Usando fallback SVG.`);
        setUsedFallback(true);
        // O re-render vai pegar o novo src abaixo
        return;
      }
    }

    console.error(`❌ Falha definitiva ao carregar imagem: ${imageUrl}`);
    setImageError(true);
    onError?.();
  };

  // Determinar qual fonte usar
  let finalSrc = imageUrl;
  if (imageError) {
    finalSrc = '/placeholder.svg';
  } else if (usedFallback) {
    // Tenta pegar do mock
    const fallback = MOCK_PRODUCTS.find(p => p.id === produto?.id || p.nome === produto?.nome);
    if (fallback?.imagemUrl) {
      finalSrc = fallback.imagemUrl;
    }
  }

  return (
    <div
      className={cn('relative overflow-hidden bg-muted', className)}
      style={{ aspectRatio }}
    >
      {/* Skeleton loader */}
      {showSkeleton && !imageLoaded && !imageError && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Imagem principal */}
      <img
        src={finalSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
          (isPlaceholder || imageError) && 'object-contain p-4',
          className
        )}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
      />

      {/* Badge de promoção */}
      {produto?.promocao && imageLoaded && !imageError && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            PROMO
          </div>
        </div>
      )}

      {/* Badge de lançamento */}
      {produto?.lancamento && imageLoaded && !imageError && (
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            NOVO
          </div>
        </div>
      )}

      {/* Badge de estoque baixo */}
      {produto?.estoque !== undefined && produto.estoque > 0 && produto.estoque <= 5 && imageLoaded && !imageError && (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            Últimas unidades
          </div>
        </div>
      )}

      {/* Fora de estoque */}
      {produto?.estoque === 0 && imageLoaded && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg">
            Esgotado
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedProductImage;

