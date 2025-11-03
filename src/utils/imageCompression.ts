/**
 * Utilitários para compressão e otimização de imagens
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 a 1.0
  format?: 'jpeg' | 'png' | 'webp';
  maxSizeKB?: number;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

/**
 * Comprime uma imagem com as opções especificadas
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 500
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = async () => {
      try {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Converter para blob com qualidade especificada
        const mimeType = `image/${format}`;
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha ao comprimir imagem'));
          }, mimeType, quality);
        });

        // Verificar se o tamanho está dentro do limite
        const sizeKB = blob.size / 1024;
        let finalBlob = blob;

        if (sizeKB > maxSizeKB) {
          // Ajustar qualidade para atingir o tamanho desejado
          const newQuality = Math.max(0.1, (maxSizeKB / sizeKB) * quality);
          finalBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Falha ao comprimir imagem'));
            }, mimeType, newQuality);
          });
        }

        // Criar arquivo comprimido
        const compressedFile = new File([finalBlob], file.name, {
          type: mimeType,
          lastModified: Date.now()
        });

        const result: CompressionResult = {
          compressedFile,
          originalSize: file.size,
          compressedSize: finalBlob.size,
          compressionRatio: (file.size - finalBlob.size) / file.size,
          dimensions: {
            original: { width: img.width, height: img.height },
            compressed: { width, height }
          }
        };

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const promises = files.map(file => compressImage(file, options));
  return Promise.all(promises);
}

/**
 * Otimiza uma imagem para web (formato WebP com fallback)
 */
export async function optimizeForWeb(
  file: File,
  options: CompressionOptions = {}
): Promise<{ webp: File; fallback: File }> {
  const webpOptions = { ...options, format: 'webp' as const };
  const jpegOptions = { ...options, format: 'jpeg' as const };

  const [webpResult, jpegResult] = await Promise.all([
    compressImage(file, webpOptions),
    compressImage(file, jpegOptions)
  ]);

  return {
    webp: webpResult.compressedFile,
    fallback: jpegResult.compressedFile
  };
}

/**
 * Gera thumbnail de uma imagem
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<File> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg'
  }).then(result => result.compressedFile);
}

/**
 * Verifica se uma imagem precisa de compressão
 */
export function needsCompression(file: File, maxSizeKB: number = 500): boolean {
  const sizeKB = file.size / 1024;
  return sizeKB > maxSizeKB;
}

/**
 * Calcula o tamanho ideal para uma imagem baseado no uso
 */
export function getOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  useCase: 'thumbnail' | 'gallery' | 'hero' | 'product'
): { width: number; height: number } {
  const presets = {
    thumbnail: { maxWidth: 200, maxHeight: 200 },
    gallery: { maxWidth: 800, maxHeight: 600 },
    hero: { maxWidth: 1920, maxHeight: 1080 },
    product: { maxWidth: 1200, maxHeight: 1200 }
  };

  const preset = presets[useCase];
  const ratio = Math.min(preset.maxWidth / originalWidth, preset.maxHeight / originalHeight);
  
  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}

/**
 * Converte bytes para formato legível
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Valida se um arquivo é uma imagem válida
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Obtém as dimensões de uma imagem
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
