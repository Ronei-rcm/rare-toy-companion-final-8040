
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/sections/Hero';
import ProdutosDestaque from '@/components/sections/ProdutosDestaque';
import CategoriasVisuais from '@/components/sections/CategoriasVisuais';
import PersonagensColecao from '@/components/sections/PersonagensColecao';
import SocialProof from '@/components/sections/SocialProof';
import BlogNoticias from '@/components/sections/BlogNoticias';
import Features from '@/components/sections/Features';
import Testimonials from '@/components/sections/Testimonials';
import CTA from '@/components/sections/CTA';
import { EventosDestaque } from '@/components/sections/EventosDestaque';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { SEO } from '@/components/SEO';

const Index = () => {
  const { config } = useHomeConfig();

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Renderizar seções baseado na configuração
  const renderSection = (sectionId: string, Component: React.ComponentType) => {
    // Proteção: verifica se config e config.sections existem
    if (!config || !config.sections || !Array.isArray(config.sections)) {
      return null;
    }
    const section = config.sections.find(s => s.id === sectionId);
    if (!section || !section.enabled) return null;
    return <Component key={sectionId} />;
  };

  return (
    <>
      <SEO
        title="MuhlStore - Loja de Brinquedos Raros e Colecionáveis"
        description="Descubra os melhores brinquedos raros, colecionáveis e exclusivos do Brasil. Action figures, bonecos vintage, itens de coleção e muito mais. Pagamento facilitado e entrega rápida."
        keywords="brinquedos raros, colecionáveis, action figures, vintage toys, brinquedos antigos, itens de coleção, bonecos raros, loja de brinquedos"
        url="/"
        type="website"
      />
      <Layout>
        {renderSection('hero', Hero)}
        {renderSection('produtos-destaque', ProdutosDestaque)}
        {renderSection('categorias', CategoriasVisuais)}
        {renderSection('personagens-colecao', PersonagensColecao)}
        {renderSection('eventos', EventosDestaque)}
        {renderSection('social-proof', SocialProof)}
        {renderSection('blog', BlogNoticias)}
        {renderSection('features', Features)}
        {renderSection('testimonials', Testimonials)}
        {renderSection('cta', CTA)}
      </Layout>
    </>
  );
};

export default Index;
