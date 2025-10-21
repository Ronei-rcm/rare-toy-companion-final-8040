/**
 * Utilitários para tratamento de imagens do carrinho e produtos
 */

const PLACEHOLDER_IMAGE = '/placeholder.svg';
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

/**
 * Normaliza URL de imagem para garantir que sempre tenhamos uma URL válida
 */
export function normalizeImageUrl(imageUrl: any): string {
  // Casos inválidos
  if (!imageUrl || 
      imageUrl === 'null' || 
      imageUrl === 'undefined' || 
      imageUrl === '' ||
      typeof imageUrl !== 'string') {
    return PLACEHOLDER_IMAGE;
  }

  // Já é uma URL completa (http:// ou https://)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Caminho relativo - garantir que comece com /
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  // Se for upload interno, usar caminho direto
  if (normalizedPath.includes('/lovable-uploads/') || normalizedPath.includes('/uploads/')) {
    return normalizedPath;
  }

  return normalizedPath;
}

/**
 * Extrai URL de imagem de um produto, considerando múltiplas variações de campo
 */
export function getProductImage(produto: any): string {
  const possibleFields = [
    'imagemUrl',
    'imagem_url', 
    'image_url',
    'imageUrl',
    'img_url',
    'foto',
    'picture'
  ];

  for (const field of possibleFields) {
    if (produto[field]) {
      return normalizeImageUrl(produto[field]);
    }
  }

  return PLACEHOLDER_IMAGE;
}

/**
 * Gera srcset para imagens responsivas
 */
export function generateSrcSet(imageUrl: string): string {
  if (imageUrl === PLACEHOLDER_IMAGE || imageUrl.startsWith('http')) {
    return '';
  }

  // Para uploads locais, podemos criar variantes (se implementarmos resize no backend)
  return `${imageUrl} 1x, ${imageUrl} 2x`;
}

/**
 * Pré-carrega uma imagem para evitar flickering
 */
export async function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Componente de imagem otimizada para produtos do carrinho
 */
export interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}
