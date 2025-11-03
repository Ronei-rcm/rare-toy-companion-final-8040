import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cleanBrokenImages } from '@/utils/cleanBrokenImages';

export const ClearCacheButton = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      
      // Limpar imagens quebradas
      const cleaned = cleanBrokenImages();
      
      // Limpar todo o cache do navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast.success(
        cleaned 
          ? '✅ Cache limpo e imagens quebradas removidas!' 
          : '✅ Cache limpo com sucesso!',
        {
          description: 'Recarregue a página para aplicar as mudanças',
          duration: 5000,
        }
      );
      
      // Recarregar página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache', {
        description: 'Tente novamente ou limpe o cache manualmente pelo navegador',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearCache}
      disabled={isClearing}
      className="gap-2"
    >
      {isClearing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Limpando...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Limpar Cache
        </>
      )}
    </Button>
  );
};

