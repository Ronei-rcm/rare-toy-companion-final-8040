import { request } from './api-config';

export interface CarouselItem {
  id: string;
  nome: string;
  imagem: string;
  badge: string;
  descricao: string;
  ativo: boolean;
  order_index?: number;
  button_text?: string;
  button_link?: string;
}

const BADGE_STORAGE_KEY = 'carousel_badges';

const resolveImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  const isAbsolute = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:');
  if (isAbsolute) return trimmed;

  // Se vier apenas o nome do arquivo (ex.: 1757969....jpg), assumir pasta padrão
  const looksLikeBareFile = /\.(png|jpe?g|webp|gif|svg)$/i.test(trimmed) && !trimmed.includes('/');
  const withFolder = looksLikeBareFile ? `/lovable-uploads/${trimmed}` : trimmed;

  // SEMPRE retornar URL relativa - o frontend serve as imagens
  return withFolder;
};

const normalizeItems = (items: CarouselItem[]): CarouselItem[] => {
  const badgeMap = getBadgeMap();
  return (items || []).map(item => ({
    ...item,
    imagem: resolveImageUrl(item.imagem),
    badge: badgeMap[item.id] || item.badge || 'Novo'
  }));
};

function getBadgeMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(BADGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setBadgeMap(map: Record<string, string>) {
  try {
    localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(map));
  } catch { }
}

function upsertBadge(id: string, badge: string | undefined) {
  if (!id || !badge) return;
  const map = getBadgeMap();
  map[id] = badge;
  setBadgeMap(map);
}

function removeBadge(id: string) {
  const map = getBadgeMap();
  if (map[id]) {
    delete map[id];
    setBadgeMap(map);
  }
}

// Função para análise de imagem com IA
export const analyzeImageWithAI = async (imageUrl: string): Promise<string> => {
  try {
    // This fetch call is to an external API (Hugging Face), not the application's backend.
    // The 'request' helper from api-config.ts is typically for internal API calls.
    // Therefore, this fetch call remains as is.
    const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_TOKEN || 'hf_demo'}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: imageUrl,
        parameters: {
          max_length: 100,
          min_length: 10
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    return data[0]?.generated_text || 'Imagem de produto interessante';
  } catch (error) {
    // Fallback para descrição padrão
    return 'Produto de qualidade com design atrativo';
  }
};

// Função alternativa usando análise local (sem API externa)
export const generateLocalDescription = (imageUrl: string, productName: string): string => {
  const descriptions = [
    `Produto ${productName} com design exclusivo e qualidade premium`,
    `${productName} - item colecionável com acabamento impecável`,
    `Produto ${productName} perfeito para colecionadores e entusiastas`,
    `${productName} com características únicas e alta qualidade`,
    `Item ${productName} com design atrativo e durabilidade garantida`
  ];
  const hash = imageUrl.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return descriptions[Math.abs(hash) % descriptions.length];
};

export const carouselService = {
  async getCarouselItems(): Promise<CarouselItem[]> {
    try {
      const data = await request<CarouselItem[]>('/carousel');
      return normalizeItems(data);
    } catch (error) {
      return [
        {
          id: 'fallback-1',
          nome: 'Mario Bowser',
          imagem: resolveImageUrl('/lovable-uploads/1757880030910-503030298.png'),
          badge: 'Novo',
          descricao: 'Mario Bowser - item colecionável com acabamento impecável',
          ativo: true,
          order_index: 0,
          button_text: 'Ver Produto',
          button_link: '/produto/mario-bowser'
        }
      ];
    }
  },

  async getActiveCarouselItems(): Promise<CarouselItem[]> {
    try {
      const data = await request<CarouselItem[]>('/carousel/active');
      return normalizeItems(data);
    } catch (error) {
      // Fallback: tentar buscar todos e filtrar por ativo
      try {
        const all = await carouselService.getCarouselItems();
        return normalizeItems((all || []).filter(item => item.ativo));
      } catch (inner) {
        // Último fallback estático
        return [
          {
            id: 'fallback-1',
            nome: 'Mario Bowser',
            imagem: resolveImageUrl('/lovable-uploads/1757880030910-503030298.png'),
            badge: 'Novo',
            descricao: 'Mario Bowser - item colecionável com acabamento impecável',
            ativo: true,
            order_index: 0,
            button_text: 'Ver Produto',
            button_link: '/produto/mario-bowser'
          }
        ];
      }
    }
  },

  async createCarouselItem(item: Omit<CarouselItem, 'id'>): Promise<CarouselItem | null> {
    const data = await request<CarouselItem>('/carousel', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    upsertBadge(data.id, item.badge);
    return { ...data, badge: item.badge || data.badge };
  },

  async updateCarouselItem(id: string, item: Partial<CarouselItem>): Promise<CarouselItem | null> {
    const data = await request<CarouselItem>(`/carousel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    if (item.badge) upsertBadge(id, item.badge);
    const badgeMap = getBadgeMap();
    return { ...data, badge: item.badge || badgeMap[id] || data.badge };
  },

  async deleteCarouselItem(id: string): Promise<boolean> {
    await request<void>(`/carousel/${id}`, { method: 'DELETE' });
    removeBadge(id);
    return true;
  },

  async toggleCarouselItem(id: string, ativo: boolean): Promise<CarouselItem | null> {
    return request<CarouselItem>(`/carousel/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ ativo }),
    });
  },

  async saveCarouselItems(items: CarouselItem[]): Promise<boolean> {
    await request<void>('/carousel/bulk', {
      method: 'POST',
      body: JSON.stringify(items),
    });
    return true;
  },

  async healthCheck(): Promise<{ status: string; database: string }> {
    return request<{ status: string; database: string }>('/health');
  }
};
