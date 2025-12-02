import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff,
  Play,
  Loader2,
  GripVertical,
  ExternalLink,
  Video as VideoIcon,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { videoGalleryService, VideoItem, getEmbedUrl, getThumbnailUrl, extractVideoId } from '@/services/video-gallery-api';
import ImageUpload from './ImageUpload';
import VideoUpload from './VideoUpload';

const VideoGalleryManager = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newVideo, setNewVideo] = useState<Partial<VideoItem>>({
    titulo: '',
    descricao: '',
    video_url: '',
    thumbnail_url: '',
    categoria: '',
    duracao: 0,
    is_active: true,
    ordem: 0
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const categorias = ['Destaque', 'Tutorial', 'Apresentação', 'Review', 'Evento', 'Outros'];

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await videoGalleryService.getVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Erro ao carregar vídeos",
        description: "Não foi possível carregar a galeria de vídeos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!newVideo.titulo || !newVideo.video_url) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e a URL do vídeo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Auto-detect thumbnail if not provided and it's YouTube/Vimeo
      let thumbnailUrl = newVideo.thumbnail_url;
      if (!thumbnailUrl && newVideo.video_url) {
        const autoThumbnail = getThumbnailUrl(newVideo.video_url);
        if (autoThumbnail) {
          thumbnailUrl = autoThumbnail;
        }
      }

      const videoData: Omit<VideoItem, 'id' | 'created_at' | 'updated_at'> = {
        titulo: newVideo.titulo!,
        descricao: newVideo.descricao || '',
        video_url: newVideo.video_url!,
        thumbnail_url: thumbnailUrl || '',
        categoria: newVideo.categoria || '',
        duracao: newVideo.duracao || 0,
        ordem: videos.length,
        is_active: newVideo.is_active ?? true,
        visualizacoes: 0
      };

      const created = await videoGalleryService.createVideo(videoData);
      
      if (created) {
        setVideos([...videos, created]);
        setNewVideo({
          titulo: '',
          descricao: '',
          video_url: '',
          thumbnail_url: '',
          categoria: '',
          duracao: 0,
          is_active: true,
          ordem: 0
        });
        setShowAddDialog(false);
        toast({
          title: "Vídeo adicionado",
          description: "O vídeo foi adicionado à galeria com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Erro ao adicionar vídeo",
        description: "Não foi possível adicionar o vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo || !editingVideo.titulo || !editingVideo.video_url) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título e a URL do vídeo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Auto-detect thumbnail if not provided and it's YouTube/Vimeo
      let thumbnailUrl = editingVideo.thumbnail_url;
      if (!thumbnailUrl && editingVideo.video_url) {
        const autoThumbnail = getThumbnailUrl(editingVideo.video_url);
        if (autoThumbnail) {
          thumbnailUrl = autoThumbnail;
        }
      }

      const updated = await videoGalleryService.updateVideo(editingVideo.id, {
        ...editingVideo,
        thumbnail_url: thumbnailUrl || editingVideo.thumbnail_url
      });
      
      if (updated) {
        setVideos(videos.map(v => v.id === updated.id ? updated : v));
        setEditingVideo(null);
        setShowEditDialog(false);
        toast({
          title: "Vídeo atualizado",
          description: "O vídeo foi atualizado com sucesso.",
        });
      }
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Erro ao atualizar vídeo",
        description: "Não foi possível atualizar o vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      const success = await videoGalleryService.deleteVideo(id);
      
      if (success) {
        setVideos(videos.filter(v => v.id !== id));
        toast({
          title: "Vídeo removido",
          description: "O vídeo foi removido da galeria.",
        });
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Erro ao remover vídeo",
        description: "Não foi possível remover o vídeo.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVideo = async (id: string) => {
    try {
      const video = videos.find(v => v.id === id);
      if (!video) return;

      const updated = await videoGalleryService.toggleVideo(id, !video.is_active);
      
      if (updated) {
        setVideos(videos.map(v => v.id === id ? updated : v));
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do vídeo.",
        variant: "destructive",
      });
    }
  };


  const openEditDialog = (video: VideoItem) => {
    setEditingVideo({ ...video });
    setShowEditDialog(true);
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Galeria de Vídeos</h2>
          <p className="text-muted-foreground">
            Gerencie os vídeos exibidos na galeria
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Vídeo</DialogTitle>
              <DialogDescription>
                Adicione um novo vídeo à galeria. Suporta YouTube, Vimeo e URLs diretas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={newVideo.titulo}
                  onChange={(e) => setNewVideo({ ...newVideo, titulo: e.target.value })}
                  placeholder="Título do vídeo"
                />
              </div>
              <div>
                <Label htmlFor="video_url">URL do Vídeo ou Upload *</Label>
                <div className="space-y-2">
                  <Input
                    id="video_url"
                    value={newVideo.video_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setNewVideo({ ...newVideo, video_url: url });
                      // Auto-detect thumbnail for YouTube/Vimeo
                      if (!newVideo.thumbnail_url && url) {
                        const autoThumbnail = getThumbnailUrl(url);
                        if (autoThumbnail) {
                          setNewVideo({ ...newVideo, video_url: url, thumbnail_url: autoThumbnail });
                        }
                      }
                    }}
                    placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                  />
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                  <VideoUpload
                    value={newVideo.video_url?.startsWith('/lovable-uploads/') ? newVideo.video_url : ''}
                    onChange={(url) => {
                      setNewVideo({ ...newVideo, video_url: url });
                    }}
                    label=""
                    placeholder=""
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Suporta YouTube, Vimeo, URLs diretas ou upload de vídeo (até 500MB)
                </p>
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={newVideo.descricao}
                  onChange={(e) => setNewVideo({ ...newVideo, descricao: e.target.value })}
                  placeholder="Descrição do vídeo"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <select
                    id="categoria"
                    value={newVideo.categoria || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, categoria: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="duracao">Duração (segundos)</Label>
                  <Input
                    id="duracao"
                    type="number"
                    value={newVideo.duracao || 0}
                    onChange={(e) => setNewVideo({ ...newVideo, duracao: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label>Thumbnail</Label>
                <div className="flex gap-2">
                  <Input
                    value={newVideo.thumbnail_url || ''}
                    onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })}
                    placeholder="URL da thumbnail ou faça upload"
                    className="flex-1"
                  />
                  <ImageUpload
                    value={newVideo.thumbnail_url || ''}
                    onChange={(url) => {
                      setNewVideo({ ...newVideo, thumbnail_url: url });
                      setUploadingThumbnail(false);
                    }}
                  />
                </div>
                {newVideo.thumbnail_url && (
                  <img 
                    src={newVideo.thumbnail_url} 
                    alt="Thumbnail preview" 
                    className="mt-2 w-32 h-20 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={newVideo.is_active ?? true}
                  onCheckedChange={(checked) => setNewVideo({ ...newVideo, is_active: checked })}
                />
                <Label htmlFor="is_active">Vídeo ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddVideo}>
                Adicionar Vídeo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum vídeo adicionado ainda.</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Vídeo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <Card key={video.id} className={!video.is_active ? 'opacity-60' : ''}>
              <div className="relative">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.titulo}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                    <VideoIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {!video.is_active && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    Inativo
                  </Badge>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-t-lg">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(video.video_url, '_blank')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Assistir
                  </Button>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{video.titulo}</CardTitle>
                {video.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.descricao}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {video.categoria && (
                    <Badge variant="outline">{video.categoria}</Badge>
                  )}
                  {video.duracao && (
                    <Badge variant="outline">{formatDuration(video.duracao)}</Badge>
                  )}
                  {video.visualizacoes !== undefined && (
                    <Badge variant="outline">{video.visualizacoes} visualizações</Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(video)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVideo(video.id)}
                  >
                    {video.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Vídeo</DialogTitle>
            <DialogDescription>
              Edite as informações do vídeo
            </DialogDescription>
          </DialogHeader>
          {editingVideo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_titulo">Título *</Label>
                <Input
                  id="edit_titulo"
                  value={editingVideo.titulo}
                  onChange={(e) => setEditingVideo({ ...editingVideo, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_video_url">URL do Vídeo ou Upload *</Label>
                <div className="space-y-2">
                  <Input
                    id="edit_video_url"
                    value={editingVideo.video_url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingVideo({ ...editingVideo, video_url: url });
                      // Auto-detect thumbnail for YouTube/Vimeo
                      if (!editingVideo.thumbnail_url && url) {
                        const autoThumbnail = getThumbnailUrl(url);
                        if (autoThumbnail) {
                          setEditingVideo({ ...editingVideo, video_url: url, thumbnail_url: autoThumbnail });
                        }
                      }
                    }}
                  />
                  <div className="text-center text-sm text-muted-foreground">ou</div>
                  <VideoUpload
                    value={editingVideo.video_url?.startsWith('/lovable-uploads/') ? editingVideo.video_url : ''}
                    onChange={(url) => {
                      setEditingVideo({ ...editingVideo, video_url: url });
                    }}
                    label=""
                    placeholder=""
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Suporta YouTube, Vimeo, URLs diretas ou upload de vídeo (até 500MB)
                </p>
              </div>
              <div>
                <Label htmlFor="edit_descricao">Descrição</Label>
                <Textarea
                  id="edit_descricao"
                  value={editingVideo.descricao || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, descricao: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_categoria">Categoria</Label>
                  <select
                    id="edit_categoria"
                    value={editingVideo.categoria || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, categoria: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit_duracao">Duração (segundos)</Label>
                  <Input
                    id="edit_duracao"
                    type="number"
                    value={editingVideo.duracao || 0}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duracao: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Thumbnail</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingVideo.thumbnail_url || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail_url: e.target.value })}
                    className="flex-1"
                  />
                  <ImageUpload
                    value={editingVideo.thumbnail_url || ''}
                    onChange={(url) => {
                      setEditingVideo({ ...editingVideo, thumbnail_url: url });
                      setUploadingThumbnail(false);
                    }}
                  />
                </div>
                {editingVideo.thumbnail_url && (
                  <img 
                    src={editingVideo.thumbnail_url} 
                    alt="Thumbnail preview" 
                    className="mt-2 w-32 h-20 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  checked={editingVideo.is_active}
                  onCheckedChange={(checked) => setEditingVideo({ ...editingVideo, is_active: checked })}
                />
                <Label htmlFor="edit_is_active">Vídeo ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateVideo}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoGalleryManager;

