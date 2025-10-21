import { useState, useEffect } from 'react';
import { carouselService, CarouselItem } from '@/services/carousel-api';

// Dados de fallback caso a API não esteja disponível
const FALLBACK_ITEMS: CarouselItem[] = [
  {
    id: 'fallback-1',
    nome: 'Mario Bowser',
    imagem: '/lovable-uploads/1757880030910-503030298.png',
    badge: 'Novo',
    descricao: 'Mario Bowser - item colecionável com acabamento impecável',
    ativo: true,
    order_index: 0,
    button_text: 'Ver Produto',
    button_link: '/produto/mario-bowser'
  }
];

export const useCarousel = () => {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        console.log('🔄 Carregando itens do carrossel...');
        
        const data = await carouselService.getActiveCarouselItems();
        console.log('✅ Dados do carrossel carregados:', data);
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('❌ Erro ao carregar carrossel:', err);
        setError('Erro ao carregar itens do carrossel');
        console.log('📦 Usando dados de fallback');
        setItems(FALLBACK_ITEMS);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return { items, loading, error };
};