import { useEffect } from 'react';

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    if (!pageTitle) return;

    const originalTitle = document.title;
    document.title = pageTitle;

    // Cleanup function - restaurar título original
    return () => {
      document.title = originalTitle;
    };
  }, [pageTitle]);
}

export function setPageTitle(pageTitle: string) {
  document.title = pageTitle;
}
