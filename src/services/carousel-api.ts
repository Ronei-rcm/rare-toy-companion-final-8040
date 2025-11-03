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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
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
  } catch {}
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
      const response = await fetch(`${API_BASE_URL}/carousel`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/carousel/active`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
    try {
      const response = await fetch(`${API_BASE_URL}/carousel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CarouselItem = await response.json();
      upsertBadge(data.id, item.badge);
      return { ...data, badge: item.badge || data.badge };
    } catch (error) {
      throw error;
    }
  },

  async updateCarouselItem(id: string, item: Partial<CarouselItem>): Promise<CarouselItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousel/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: CarouselItem = await response.json();
      if (item.badge) upsertBadge(id, item.badge);
      const badgeMap = getBadgeMap();
      return { ...data, badge: item.badge || badgeMap[id] || data.badge };
    } catch (error) {
      throw error;
    }
  },

  async deleteCarouselItem(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousel/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      removeBadge(id);
      return true;
    } catch (error) {
      throw error;
    }
  },

  async toggleCarouselItem(id: string, ativo: boolean): Promise<CarouselItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousel/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async saveCarouselItems(items: CarouselItem[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/carousel/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      throw error;
    }
  },

  async healthCheck(): Promise<{ status: string; database: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
};
