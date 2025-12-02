import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Play, 
  Eye, 
  Loader2,
  Video as VideoIcon,
  X,
  ArrowRight
} from 'lucide-react';
import { videoGalleryService, VideoItem, getEmbedUrl } from '@/services/video-gallery-api';

interface VideoGalleryProps {
  categoria?: string;
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({ 
  categoria, 
  limit, 
  showTitle = true,
  className = '' 
}) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  console.log('🎥🎥🎥 [VideoGallery] ===== COMPONENTE INICIALIZADO =====');
  console.log('🎥 [VideoGallery] Props:', { categoria, limit, showTitle, className });

  useEffect(() => {
    console.log('🎥 [VideoGallery] useEffect executado, carregando vídeos...');
    loadVideos();
  }, [categoria]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      console.log('🎥 [VideoGallery] Carregando vídeos...');
      const data = await videoGalleryService.getActiveVideos();
      console.log('🎥 [VideoGallery] Vídeos recebidos:', data.length, data);
      
      let filtered = data;
      if (categoria) {
        filtered = data.filter(v => v.categoria === categoria);
      }
      
      if (limit) {
        filtered = filtered.slice(0, limit);
      }
      
      console.log('🎥 [VideoGallery] Vídeos filtrados:', filtered.length);
      setVideos(filtered);
    } catch (error) {
      console.error('❌ [VideoGallery] Erro ao carregar vídeos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = async (video: VideoItem) => {
    setSelectedVideo(video);
    setShowModal(true);
    
    // Increment views
    try {
      await videoGalleryService.incrementViews(video.id);
      // Update local state
      setVideos(videos.map(v => 
        v.id === video.id 
          ? { ...v, visualizacoes: (v.visualizacoes || 0) + 1 }
          : v
      ));
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando vídeos...</span>
      </div>
    );
  }

  if (videos.length === 0) {
    console.log('🎥 [VideoGallery] Nenhum vídeo encontrado, não renderizando');
    // Retornar uma mensagem em vez de null para debug
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-muted-foreground">Nenhum vídeo disponível no momento.</p>
      </div>
    );
  }
  
  console.log('🎥 [VideoGallery] Renderizando', videos.length, 'vídeos:', videos.map(v => v.titulo));

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Galeria de Vídeos</h2>
            <p className="text-muted-foreground">
              Confira nossos vídeos e conteúdos exclusivos
            </p>
          </div>
          {limit && videos.length >= limit && (
            <Link to="/videos">
              <Button variant="outline" className="flex items-center gap-2">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-video-gallery="true">
        {videos.map((video) => (
          <Card 
            key={video.id}
            data-video-gallery="true"
            className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
            onClick={() => handleVideoClick(video)}
          >
            <div className="relative aspect-video bg-muted">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-primary" fill="currentColor" />
                </div>
              </div>
              {video.duracao && (
                <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                  {formatDuration(video.duracao)}
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {video.titulo}
              </h3>
              {video.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {video.descricao}
                </p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {video.categoria && (
                    <Badge variant="outline" className="text-xs">
                      {video.categoria}
                    </Badge>
                  )}
                  {video.visualizacoes !== undefined && video.visualizacoes > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {video.visualizacoes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedVideo?.titulo}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {selectedVideo.video_url && (
                  (selectedVideo.video_url.startsWith('/lovable-uploads/') || 
                   (selectedVideo.video_url.startsWith('http') && 
                    !selectedVideo.video_url.includes('youtube') && 
                    !selectedVideo.video_url.includes('youtu.be') && 
                    !selectedVideo.video_url.includes('vimeo'))) ? (
                    <video
                      src={selectedVideo.video_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      title={selectedVideo.titulo}
                      playsInline
                      preload="metadata"
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                  ) : (
                    <iframe
                      src={getEmbedUrl(selectedVideo.video_url) + (selectedVideo.video_url.includes('youtube') || selectedVideo.video_url.includes('youtu.be') ? '?autoplay=1&rel=0' : selectedVideo.video_url.includes('vimeo') ? '?autoplay=1' : '')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedVideo.titulo}
                    />
                  )
                )}
              </div>
              {selectedVideo.descricao && (
                <p className="text-muted-foreground">
                  {selectedVideo.descricao}
                </p>
              )}
              <div className="flex gap-2">
                {selectedVideo.categoria && (
                  <Badge variant="outline">{selectedVideo.categoria}</Badge>
                )}
                {selectedVideo.duracao && (
                  <Badge variant="outline">{formatDuration(selectedVideo.duracao)}</Badge>
                )}
                {selectedVideo.visualizacoes !== undefined && (
                  <Badge variant="outline">
                    <Eye className="h-3 w-3 mr-1" />
                    {selectedVideo.visualizacoes} visualizações
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoGallery;

