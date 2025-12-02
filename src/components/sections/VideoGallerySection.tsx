import React, { useEffect } from 'react';
import VideoGallery from '@/components/VideoGallery';

const VideoGallerySection: React.FC = () => {
  useEffect(() => {
    console.log('🎥🎥🎥 [VideoGallerySection] ===== SEÇÃO RENDERIZADA =====');
    console.log('🎥 [VideoGallerySection] Componente montado com sucesso');
  }, []);

  console.log('🎥 [VideoGallerySection] Renderizando componente...');

  return (
    <section 
      className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/30"
      data-video-gallery-section="true"
    >
      <div className="container mx-auto px-4">
        <VideoGallery showTitle={true} limit={6} />
      </div>
    </section>
  );
};

export default VideoGallerySection;

