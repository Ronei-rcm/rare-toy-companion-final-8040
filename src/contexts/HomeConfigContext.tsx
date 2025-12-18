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
    { id: 'video-gallery', name: 'Galeria de Vídeos', enabled: true, order: 6 },
    { id: 'social-proof', name: 'Prova Social', enabled: true, order: 7 },
    { id: 'blog', name: 'Blog/Notícias', enabled: true, order: 8 },
    { id: 'features', name: 'Recursos', enabled: true, order: 9 },
    { id: 'testimonials', name: 'Depoimentos', enabled: true, order: 10 },
    { id: 'cta', name: 'Call to Action', enabled: true, order: 11 },
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
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configuração salva ANTES de aplicar favicon/title
  useEffect(() => {
    const savedConfig = localStorage.getItem('homeConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Garantir que sections seja sempre um array válido
        if (!parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
          console.warn('Configuração de sections inválida detectada. Resetando para padrão.');
          parsed.sections = defaultConfig.sections;
          // Salvar a configuração corrigida
          localStorage.setItem('homeConfig', JSON.stringify({ ...defaultConfig, ...parsed }));
        }
        
        // Garantir que a seção video-gallery exista e esteja habilitada se houver vídeos
        const videoGallerySection = parsed.sections?.find((s: HomeSectionConfig) => s.id === 'video-gallery');
        if (!videoGallerySection) {
          // Adicionar seção se não existir
          parsed.sections.push({ id: 'video-gallery', name: 'Galeria de Vídeos', enabled: true, order: 6 });
          console.log('✅ Seção video-gallery adicionada à configuração');
        } else {
          // Verificar se há vídeos e habilitar automaticamente
          fetch('/api/videos/active').catch(e => {
            if (e instanceof TypeError || e.message?.includes('Failed to fetch')) {
              console.warn('⚠️ Erro de conexão ao carregar vídeos. Continuando sem vídeos.');
              return { ok: false, json: () => Promise.resolve({ videos: [] }) };
            }
            throw e;
          })
            .then(res => res.json())
            .then(videos => {
              if (videos && videos.length > 0 && !videoGallerySection.enabled) {
                videoGallerySection.enabled = true;
                parsed.sections = parsed.sections.map((s: HomeSectionConfig) => 
                  s.id === 'video-gallery' ? videoGallerySection : s
                );
                localStorage.setItem('homeConfig', JSON.stringify({ ...defaultConfig, ...parsed }));
                console.log('✅ Seção video-gallery habilitada automaticamente (há vídeos disponíveis)');
                setConfig({ ...defaultConfig, ...parsed });
              }
            })
            .catch(() => {
              // Se falhar, apenas usar a configuração salva
            });
        }
        
        setConfig({ ...defaultConfig, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar configuração da home:', error);
        // Limpar localStorage corrupto e resetar
        localStorage.removeItem('homeConfig');
        setConfig(defaultConfig);
      }
    }
    setIsLoading(false);
  }, []);

  // Aplicar favicon e título dinamicamente
  useFavicon(config.theme.faviconUrl);
  usePageTitle(config.theme.pageTitle);

  const updateConfig = (updates: Partial<HomeConfig>) => {
    console.log('🔄 updateConfig chamado com:', updates);
    if (updates.theme) {
      console.log('🎨 Atualizando tema:', {
        heroBackground: updates.theme.heroBackground,
        logoUrl: updates.theme.logoUrl,
        faviconUrl: updates.theme.faviconUrl
      });
    }
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      console.log('📝 Nova configuração:', {
        heroBackground: newConfig.theme?.heroBackground,
        logoUrl: newConfig.theme?.logoUrl,
        faviconUrl: newConfig.theme?.faviconUrl
      });
      return newConfig;
    });
  };

  const updateSection = (sectionId: string, updates: Partial<HomeSectionConfig>) => {
    setConfig(prev => {
      if (!prev.sections || !Array.isArray(prev.sections)) {
        return prev;
      }
      return {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId ? { ...section, ...updates } : section
        )
      };
    });
  };

  const toggleSection = (sectionId: string) => {
    setConfig(prev => {
      if (!prev.sections || !Array.isArray(prev.sections)) {
        return prev;
      }
      return {
        ...prev,
        sections: prev.sections.map(section =>
          section.id === sectionId ? { ...section, enabled: !section.enabled } : section
        )
      };
    });
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
      console.log('💾 Salvando configuração da home...');
      console.log('📋 Config antes de salvar:', {
        heroBackground: config.theme?.heroBackground,
        logoUrl: config.theme?.logoUrl,
        faviconUrl: config.theme?.faviconUrl
      });
      
      // Salvar no localStorage (em produção, salvaria na API)
      localStorage.setItem('homeConfig', JSON.stringify(config));
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Configuração da home salva:', {
        heroBackground: config.theme?.heroBackground,
        logoUrl: config.theme?.logoUrl,
        faviconUrl: config.theme?.faviconUrl,
        fullConfig: config
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Garantir que config sempre tenha a estrutura correta
  const safeConfig = {
    ...defaultConfig,
    ...config,
    sections: config.sections && Array.isArray(config.sections) 
      ? config.sections 
      : defaultConfig.sections
  };

  return (
    <HomeConfigContext.Provider value={{
      config: safeConfig,
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
