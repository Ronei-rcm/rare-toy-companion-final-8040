export function resolveImage(src?: string): string {
  if (!src) return '/placeholder.png';
  if (/^https?:\/\//i.test(src)) return src; // já é absoluta
  if (src.startsWith('/')) return src; // caminho relativo - serve do frontend
  
  // FORÇA URL relativa - remove qualquer localhost:3001
  const cleanSrc = src.replace(/^https?:\/\/[^\/]+/, '');
  return `/lovable-uploads/${cleanSrc}`; // nome puro do arquivo - serve do frontend
}

/**
 * Hook para tratar erro de carregamento de imagem
 */
export function onImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  const src = img.src;
  
  // Evitar loop infinito
  if (img.src.includes('/placeholder.png') || img.dataset.errorHandled === 'true') {
    return;
  }
  
  img.dataset.errorHandled = 'true';
  console.warn(`🖼️ Imagem não encontrada: ${src.split('/').pop()}`);
  
  // Substituir por placeholder
  img.src = '/placeholder.png';
  img.alt = 'Imagem não disponível';
}

export default resolveImage;


