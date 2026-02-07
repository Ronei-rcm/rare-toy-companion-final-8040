export interface VideoItem {
  id: string;
  titulo: string;
  descricao?: string;
  video_url: string;
  thumbnail_url?: string;
  categoria?: string;
  duracao?: number;
  ordem?: number;
  is_active: boolean;
  visualizacoes?: number;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const resolveVideoUrl = (url: string | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  // Se já for URL absoluta (http/https), retornar como está
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Se começar com /, já é relativa ao domínio, retornar como está
  if (trimmed.startsWith('/')) return trimmed;
  // Caso contrário, adicionar / no início
  return '/' + trimmed;
};

const resolveThumbnailUrl = (url: string | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  // Se já for URL absoluta (http/https) ou data URI, retornar como está
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  // Se começar com /, já é relativa ao domínio, retornar como está
  if (trimmed.startsWith('/')) return trimmed;
  // Caso contrário, adicionar / no início
  return '/' + trimmed;
};

const normalizeVideos = (videos: any[]): VideoItem[] => {
  if (!videos || !Array.isArray(videos)) {
    console.warn('⚠️ [video-gallery-api] normalizeVideos recebeu dados inválidos:', videos);
    return [];
  }
  const normalized = videos.map(video => ({
    id: video.id,
    titulo: video.title || video.titulo,
    descricao: video.description || video.descricao,
    video_url: resolveVideoUrl(video.videoUrl || video.video_url),
    thumbnail_url: resolveThumbnailUrl(video.thumbnailUrl || video.thumbnail_url),
    categoria: video.category || video.categoria,
    duracao: video.duration || video.duracao,
    ordem: video.order || video.ordem,
    is_active: (video.isActive !== undefined ? video.isActive : video.is_active) ?? true,
    visualizacoes: video.views || video.visualizacoes,
    created_at: video.createdAt || video.created_at,
    updated_at: video.updatedAt || video.updated_at
  }));
  console.log('🎥 [video-gallery-api] Normalizados', normalized.length, 'vídeos');
  return normalized;
};

// Extract video ID from YouTube/Vimeo URLs
export const extractVideoId = (url: string): string | null => {
  if (!url) return null;

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Vimeo pattern
  const vimeoPattern = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoPattern);
  if (vimeoMatch && vimeoMatch[1]) {
    return vimeoMatch[1];
  }

  return null;
};

// Get embed URL for YouTube/Vimeo
export const getEmbedUrl = (url: string): string => {
  const videoId = extractVideoId(url);
  if (!videoId) return url;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes('vimeo.com')) {
    return `https://player.vimeo.com/video/${videoId}`;
  }

  return url;
};

// Get thumbnail URL for YouTube/Vimeo
export const getThumbnailUrl = (url: string): string => {
  const videoId = extractVideoId(url);
  if (!videoId) return '';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Tentar maxresdefault primeiro, se falhar, usar hqdefault (sempre disponível)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  if (url.includes('vimeo.com')) {
    return `https://vumbnail.com/${videoId}.jpg`;
  }

  return '';
};

export const videoGalleryService = {
  async getVideos(): Promise<VideoItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return normalizeVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
  },

  async getActiveVideos(): Promise<VideoItem[]> {
    try {
      console.log('🎥 [video-gallery-api] Buscando vídeos ativos...');
      const response = await fetch(`${API_BASE_URL}/videos/active`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('🎥 [video-gallery-api] Dados recebidos:', data);
      const normalized = normalizeVideos(data);
      console.log('🎥 [video-gallery-api] Vídeos normalizados:', normalized.length, normalized);
      return normalized;
    } catch (error) {
      console.error('❌ [video-gallery-api] Erro ao buscar vídeos ativos:', error);
      return [];
    }
  },

  async getVideo(id: string): Promise<VideoItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return normalizeVideos([data])[0] || null;
    } catch (error) {
      console.error('Error fetching video:', error);
      return null;
    }
  },

  async createVideo(video: Omit<VideoItem, 'id' | 'created_at' | 'updated_at'>): Promise<VideoItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: VideoItem = await response.json();
      return normalizeVideos([data])[0] || null;
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  },

  async updateVideo(id: string, video: Partial<VideoItem>): Promise<VideoItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: VideoItem = await response.json();
      return normalizeVideos([data])[0] || null;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  },

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  async toggleVideo(id: string, is_active: boolean): Promise<VideoItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return normalizeVideos([data])[0] || null;
    } catch (error) {
      console.error('Error toggling video:', error);
      throw error;
    }
  },

  async saveVideos(videos: VideoItem[]): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videos),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (error) {
      console.error('Error saving videos:', error);
      throw error;
    }
  },

  async incrementViews(id: string): Promise<VideoItem | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${id}/increment-views`, {
        method: 'PUT',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return normalizeVideos([data])[0] || null;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return null;
    }
  }
};

