import React from 'react';
import Layout from '@/components/layout/Layout';
import VideoGallery from '@/components/VideoGallery';
import { SEO } from '@/components/SEO';

const Videos = () => {
  return (
    <>
      <SEO
        title="Galeria de Vídeos - MuhlStore"
        description="Confira nossa galeria de vídeos com conteúdos exclusivos, lançamentos, eventos e muito mais sobre brinquedos raros e colecionáveis."
        keywords="vídeos, galeria, brinquedos raros, colecionáveis, eventos, lançamentos"
        url="/videos"
        type="website"
      />
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Galeria de Vídeos</h1>
            <p className="text-lg text-muted-foreground">
              Explore nossa coleção de vídeos com conteúdos exclusivos, lançamentos, eventos e muito mais
            </p>
          </div>
          <VideoGallery showTitle={false} />
        </div>
      </Layout>
    </>
  );
};

export default Videos;

