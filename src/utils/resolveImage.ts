export function resolveImage(src?: string): string {
  if (!src) return '/placeholder.png';
  if (/^https?:\/\//i.test(src)) return src; // já é absoluta
  if (src.startsWith('/')) return src; // caminho relativo - serve do frontend


  // FORÇA URL relativa - remove qualquer origem absoluta
  const cleanSrc = src.replace(/^https?:\/\/[^\/]+/, '');
  return `/lovable-uploads/${cleanSrc}`; // nome puro do arquivo - serve do frontend
}

/**
 * Hook para tratar erro de carregamento de imagem
 * Trata 404s silenciosamente e substitui por placeholder
 */
export function onImageError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget;
  const src = img.src;

  // Evitar loop infinito
  if (img.src.includes('/placeholder') || img.dataset.errorHandled === 'true') {
    return;
  }

  img.dataset.errorHandled = 'true';

  // Não logar 404s - são esperados quando imagens não existem
  // Silenciosamente substituir por placeholder

  // Tentar usar placeholder.svg primeiro, depois placeholder.png
  const placeholderSrc = '/placeholder.svg';
  img.src = placeholderSrc;
  img.alt = 'Imagem não disponível';

  // Se o placeholder.svg também falhar, tentar placeholder.png
  const handlePlaceholderError = () => {
    if (img.src !== '/placeholder.png') {
      img.src = '/placeholder.png';
    }
  };

  img.onerror = handlePlaceholderError;
}

export default resolveImage;


