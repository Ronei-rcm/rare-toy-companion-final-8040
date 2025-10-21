import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFavicon } from '@/hooks/useFavicon';
import { usePageTitle } from '@/hooks/usePageTitle';

export interface HomeSectionConfig {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  data?: any;
}

export interface HomeConfig {
  sections: HomeSectionConfig[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundType: 'gradient' | 'solid' | 'image';
    heroBackground: string;
    logoUrl: string;
    faviconUrl: string;
    pageTitle: string;
  };
  contact?: {
    whatsappNumber: string;
    whatsappMessage: string;
    showWhatsAppButton: boolean;
    showAfterScroll: number;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    showCarousel: boolean;
  };
  produtosDestaque: {
    title: string;
    subtitle: string;
    maxItems: number;
    showPrices: boolean;
  };
  categorias: {
    title: string;
    subtitle: string;
    maxItems: number;
  };
  personagensColecao?: {
    title: string;
    subtitle: string;
    maxItems?: number;
  };
  eventos: {
    title: string;
    subtitle: string;
    maxItems: number;
    showDates: boolean;
  };
  socialProof: {
    title: string;
    subtitle: string;
    showStats: boolean;
    stats: Array<{
      number: string;
      label: string;
    }>;
  };
  blog: {
    title: string;
    subtitle: string;
    maxItems: number;
    showDates: boolean;
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  testimonials: {
    title: string;
    subtitle: string;
    maxItems: number;
  };
  cta: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    backgroundImage?: string;
  };
}

const defaultConfig: HomeConfig = {
  sections: [
    { id: 'hero', name: 'Hero/Carrossel', enabled: true, order: 1 },
    { id: 'produtos-destaque', name: 'Produtos em Destaque', enabled: true, order: 2 },
    { id: 'categorias', name: 'Categorias', enabled: true, order: 3 },
    { id: 'personagens-colecao', name: 'Personagens da Coleção', enabled: true, order: 4 },
    { id: 'eventos', name: 'Eventos', enabled: true, order: 5 },
    { id: 'social-proof', name: 'Prova Social', enabled: true, order: 6 },
    { id: 'blog', name: 'Blog/Notícias', enabled: true, order: 7 },
    { id: 'features', name: 'Recursos', enabled: true, order: 8 },
    { id: 'testimonials', name: 'Depoimentos', enabled: true, order: 9 },
    { id: 'cta', name: 'Call to Action', enabled: true, order: 10 },
  ],
  theme: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#06B6D4',
    accentColor: '#F59E0B',
    backgroundType: 'gradient',
    heroBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    logoUrl: '/assets/muhlstore-mario-starwars-logo-CJrUMncO.png',
    faviconUrl: '/favicon.ico',
    pageTitle: 'MuhlStore - Brinquedos Raros e Colecionáveis'
  },
  hero: {
    title: 'Bem-vindo à MuhlStore Galaxy',
    subtitle: 'Descubra coleções incríveis de action figures, bonecos e muito mais!',
    ctaText: 'Explorar Coleções',
    ctaLink: '/loja',
    showCarousel: true
  },
  produtosDestaque: {
    title: 'Produtos em Destaque',
    subtitle: 'Nossas melhores ofertas e lançamentos',
    maxItems: 8,
    showPrices: true
  },
  categorias: {
    title: 'Nossas Categorias',
    subtitle: 'Encontre exatamente o que você procura',
    maxItems: 6
  },
  personagensColecao: {
    title: 'Personagens da Coleção',
    subtitle: 'Conheça nossos personagens favoritos e complete sua coleção.',
    maxItems: 10
  },
  eventos: {
    title: 'Próximos Eventos',
    subtitle: 'Participe dos nossos eventos especiais',
    maxItems: 3,
    showDates: true
  },
  socialProof: {
    title: 'Por que escolher a MuhlStore?',
    subtitle: 'Números que comprovam nossa qualidade',
    showStats: true,
    stats: [
      { number: '10k+', label: 'Clientes Satisfeitos' },
      { number: '5k+', label: 'Produtos Disponíveis' },
      { number: '99%', label: 'Avaliação Positiva' },
      { number: '24/7', label: 'Suporte Atendimento' }
    ]
  },
  blog: {
    title: 'Últimas Notícias',
    subtitle: 'Fique por dentro das novidades',
    maxItems: 3,
    showDates: true
  },
  features: {
    title: 'Nossos Diferenciais',
    subtitle: 'Tudo que você precisa para sua coleção',
    items: [
      {
        icon: '🚚',
        title: 'Frete Grátis',
        description: 'Para compras acima de R$ 100'
      },
      {
        icon: '🔒',
        title: 'Compra Segura',
        description: 'Seus dados protegidos'
      },
      {
        icon: '💎',
        title: 'Produtos Originais',
        description: '100% autênticos'
      },
      {
        icon: '⚡',
        title: 'Entrega Rápida',
        description: 'Receba em até 3 dias'
      }
    ]
  },
  testimonials: {
    title: 'O que nossos clientes dizem',
    subtitle: 'Depoimentos reais de quem já comprou',
    maxItems: 6
  },
  cta: {
    title: 'Pronto para começar sua coleção?',
    subtitle: 'Explore nossa loja e encontre seus personagens favoritos',
    buttonText: 'Ver Produtos',
    buttonLink: '/loja',
    backgroundImage: ''
  },
  contact: {
    whatsappNumber: '5551999999999',
    whatsappMessage: 'Olá! Preciso de ajuda na MuhlStore.',
    showWhatsAppButton: true,
    showAfterScroll: 200
  }
};

interface HomeConfigContextType {
  config: HomeConfig;
  updateConfig: (config: Partial<HomeConfig>) => void;
  updateSection: (sectionId: string, updates: Partial<HomeSectionConfig>) => void;
  toggleSection: (sectionId: string) => void;
  reorderSections: (sections: HomeSectionConfig[]) => void;
  resetConfig: () => void;
  isLoading: boolean;
  saveConfig: () => Promise<void>;
}

const HomeConfigContext = createContext<HomeConfigContextType | undefined>(undefined);

export function HomeConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HomeConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(false);

  // Aplicar favicon e título dinamicamente
  useFavicon(config.theme.faviconUrl);
  usePageTitle(config.theme.pageTitle);

  // Carregar configuração salva
  useEffect(() => {
    const savedConfig = localStorage.getItem('homeConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configuração da home:', error);
      }
    }
  }, []);

  const updateConfig = (updates: Partial<HomeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateSection = (sectionId: string, updates: Partial<HomeSectionConfig>) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const toggleSection = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, enabled: !section.enabled } : section
      )
    }));
  };

  const reorderSections = (sections: HomeSectionConfig[]) => {
    setConfig(prev => ({
      ...prev,
      sections: sections.map((section, index) => ({ ...section, order: index + 1 }))
    }));
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.removeItem('homeConfig');
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      // Salvar no localStorage (em produção, salvaria na API)
      localStorage.setItem('homeConfig', JSON.stringify(config));
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Configuração da home salva:', config);
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HomeConfigContext.Provider value={{
      config,
      updateConfig,
      updateSection,
      toggleSection,
      reorderSections,
      resetConfig,
      isLoading,
      saveConfig
    }}>
      {children}
    </HomeConfigContext.Provider>
  );
}

export function useHomeConfig() {
  const context = useContext(HomeConfigContext);
  if (context === undefined) {
    throw new Error('useHomeConfig must be used within a HomeConfigProvider');
  }
  return context;
}
