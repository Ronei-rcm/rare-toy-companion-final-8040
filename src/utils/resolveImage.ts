export function resolveImage(src?: string): string {
  if (!src) return '/placeholder.png';
  if (/^https?:\/\//i.test(src)) return src; // já é absoluta
  if (src.startsWith('/')) return src; // caminho relativo - serve do frontend
  
  // FORÇA URL relativa - remove qualquer localhost:3001
  const cleanSrc = src.replace(/^https?:\/\/[^\/]+/, '');
  return `/lovable-uploads/${cleanSrc}`; // nome puro do arquivo - serve do frontend
}

export default resolveImage;


