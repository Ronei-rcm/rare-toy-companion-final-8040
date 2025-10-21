import { useEffect } from 'react';

export function useFavicon(faviconUrl?: string) {
  useEffect(() => {
    if (!faviconUrl) return;

    // Remove favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());

    // Criar novo favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    link.type = faviconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png';
    
    // Adicionar ao head
    document.head.appendChild(link);

    // Cleanup function
    return () => {
      link.remove();
    };
  }, [faviconUrl]);
}

export function setFavicon(faviconUrl: string) {
  // Remove favicons existentes
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(link => link.remove());

  // Criar novo favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = faviconUrl;
  link.type = faviconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  
  // Adicionar ao head
  document.head.appendChild(link);
}
