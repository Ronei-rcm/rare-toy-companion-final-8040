import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  Upload, 
  Palette, 
  Image as ImageIcon,
  Save,
  RotateCcw,
  Copy,
  Settings,
  Loader2,
  GripVertical,
  EyeOff,
  Eye as EyeOn,
  Monitor,
  Smartphone,
  Tablet,
  Layout,
  Type,
  Calendar,
  Users,
  Star,
  Target,
  MessageSquare,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useHomeConfig, HomeSectionConfig } from '@/contexts/HomeConfigContext';
import ImageUpload from './ImageUpload';
import HomePreview from './HomePreview';
import { carouselService, CarouselItem, generateLocalDescription } from '@/services/carousel-api';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';


const HomeManager = () => {
  const { toast } = useToast();
  const { config, updateConfig, updateSection, toggleSection, reorderSections, saveConfig, isLoading, resetConfig } = useHomeConfig();
  const isMountedRef = useRef(false);
  const saveDebounceRef = useRef<number | null>(null);
  
  // Estado do carrossel
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);

  // Estados de edição
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<CarouselItem>>({
    badge: 'Novo',
    ativo: true,
    button_text: 'Ver Mais',
    button_link: '#'
  });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const badgeOptions = ['Exclusivo', 'Novo', 'Limitado', 'Popular', 'Em Destaque'];

  const sectionIcons: Record<string, React.ReactNode> = {
    'hero': <Monitor className="h-4 w-4" />,
    'produtos-destaque': <Star className="h-4 w-4" />,
    'categorias': <Layout className="h-4 w-4" />,
    'personagens-colecao': <Users className="h-4 w-4" />,
    'eventos': <Calendar className="h-4 w-4" />,
    'social-proof': <Target className="h-4 w-4" />,
    'blog': <Type className="h-4 w-4" />,
    'features': <Zap className="h-4 w-4" />,
    'testimonials': <MessageSquare className="h-4 w-4" />,
    'cta': <Target className="h-4 w-4" />
  };

  const resolveImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    const trimmed = url.trim();
    const isAbsolute = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:');
    if (isAbsolute) return trimmed;
    const base = import.meta.env.VITE_API_URL || '';
    const joined = `${base.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
    return joined;
  };

  // Carregar dados do carrossel ao inicializar
  useEffect(() => {
    loadCarouselItems();
  }, []);

  // const handleDragEnd = (result: any) => {
  //   if (!result.destination) return;

  //   const items = Array.from(config.sections);
  //   const [reorderedItem] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, reorderedItem);

  //   reorderSections(items);
  // };

  // Autosave (Tema e Conteúdo) com debounce
  useEffect(() => {
    // Evitar disparar no primeiro render
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    // Debounce de 1s
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current);
    }
    saveDebounceRef.current = window.setTimeout(async () => {
      try {
        await saveConfig();
        toast({
          title: "Alterações salvas",
          description: "Configurações atualizadas automaticamente.",
        });
      } catch (err) {
        toast({
          title: "Falha ao salvar",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    }, 1000);

    return () => {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current);
      }
    };
    // Observa apenas tema e conteúdo (não o carrossel)
  }, [
    config.theme,
    config.hero,
    config.produtosDestaque,
    config.categorias,
    (config as any).personagensColecao,
    config.eventos,
    config.socialProof,
    config.blog,
    config.features,
    config.testimonials,
    config.cta,
  ]);

  const loadCarouselItems = async () => {
    try {
      setCarouselLoading(true);
      const items = await carouselService.getCarouselItems();
      setCarouselItems(items);
    } catch (error) {
      console.error('Error loading carousel items:', error);
      toast({
        title: "Erro ao carregar carrossel",
        description: "Não foi possível carregar os itens do carrossel.",
        variant: "destructive",
      });
    } finally {
      setCarouselLoading(false);
    }
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sorted = [...config.sections].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex > 0) {
      const temp = sorted[currentIndex - 1];
      sorted[currentIndex - 1] = sorted[currentIndex];
      sorted[currentIndex] = temp;
      reorderSections(sorted);
    }
    if (direction === 'down' && currentIndex < sorted.length - 1) {
      const temp = sorted[currentIndex + 1];
      sorted[currentIndex + 1] = sorted[currentIndex];
      sorted[currentIndex] = temp;
      reorderSections(sorted);
    }
  };

  const handleSaveAll = async () => {
    try {
      await saveConfig();
      toast({
        title: "Configuração salva",
        description: "Todas as configurações da home foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (newItem.nome && newItem.imagem) {
      try {
        // Gerar descrição automaticamente se não foi fornecida
        let descricao = newItem.descricao || '';
        if (!descricao && newItem.imagem) {
          descricao = generateLocalDescription(newItem.imagem, newItem.nome);
        }

        const itemData = {
          nome: newItem.nome!,
          imagem: newItem.imagem!,
          badge: newItem.badge || 'Novo',
          descricao: descricao,
          ativo: true,
          button_text: newItem.button_text || 'Ver Mais',
          button_link: newItem.button_link || '#'
        };

        const newItemResult = await carouselService.createCarouselItem(itemData);
        
        if (newItemResult) {
          setCarouselItems([...carouselItems, newItemResult]);
          setNewItem({
            badge: 'Novo',
            ativo: true,
            button_text: 'Ver Mais',
            button_link: '#'
          });
          toast({
            title: "Produto adicionado",
            description: "Novo produto foi adicionado ao carrossel.",
          });
        } else {
          throw new Error('Failed to create carousel item');
        }
      } catch (error) {
        console.error('Error adding carousel item:', error);
        toast({
          title: "Erro ao adicionar produto",
          description: "Não foi possível adicionar o produto ao carrossel.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e a imagem do produto.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const success = await carouselService.deleteCarouselItem(id);
      
      if (success) {
        setCarouselItems(carouselItems.filter(item => item.id !== id));
        toast({
          title: "Produto removido",
          description: "Produto foi removido do carrossel.",
        });
      } else {
        throw new Error('Failed to delete carousel item');
      }
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto do carrossel.",
        variant: "destructive",
      });
    }
  };

  const handleToggleItem = async (id: string) => {
    try {
      const item = carouselItems.find(item => item.id === id);
      if (!item) return;

      const updatedItem = await carouselService.toggleCarouselItem(id, !item.ativo);
      
      if (updatedItem) {
        setCarouselItems(carouselItems.map(item => 
          item.id === id ? updatedItem : item
        ));
      } else {
        throw new Error('Failed to toggle carousel item');
      }
    } catch (error) {
      console.error('Error toggling carousel item:', error);
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do produto.",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: CarouselItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleUpdateItem = async () => {
    if (editingItem) {
      try {
        const updatedItem = await carouselService.updateCarouselItem(editingItem.id, editingItem);
        
        if (updatedItem) {
          setCarouselItems(carouselItems.map(item => 
            item.id === editingItem.id ? updatedItem : item
          ));
          setEditingItem(null);
          setShowEditDialog(false);
          toast({
            title: "Produto atualizado",
            description: "As alterações foram salvas com sucesso.",
          });
        } else {
          throw new Error('Failed to update carousel item');
        }
      } catch (error) {
        console.error('Error updating carousel item:', error);
        toast({
          title: "Erro ao atualizar produto",
          description: "Não foi possível atualizar o produto.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicateItem = async (item: CarouselItem) => {
    try {
      const duplicatedItemData = {
        nome: `${item.nome} (Cópia)`,
        imagem: item.imagem,
        badge: item.badge,
        descricao: item.descricao,
        ativo: false,
        button_text: item.button_text || 'Ver Mais',
        button_link: item.button_link || '#'
      };

      const duplicatedItem = await carouselService.createCarouselItem(duplicatedItemData);
      
      if (duplicatedItem) {
        setCarouselItems([...carouselItems, duplicatedItem]);
        toast({
          title: "Produto duplicado",
          description: "Uma cópia do produto foi criada.",
        });
      } else {
        throw new Error('Failed to duplicate carousel item');
      }
    } catch (error) {
      console.error('Error duplicating carousel item:', error);
      toast({
        title: "Erro ao duplicar produto",
        description: "Não foi possível duplicar o produto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Home</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Home
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('/?r=' + Date.now(), '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Recarregar Home
          </Button>
          <Button 
            onClick={handleSaveAll}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Tudo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="sections">Seções</TabsTrigger>
          <TabsTrigger value="carousel">Carrossel</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
        </TabsList>

        {/* Gerenciamento de Seções */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Gerenciar Seções da Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {config.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                    >
                      <div className="cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 flex items-center gap-3">
                        {sectionIcons[section.id]}
                        <span className="font-medium">{section.name}</span>
                        <Badge variant={section.enabled ? "default" : "secondary"}>
                          {section.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(section.id, 'up')}
                          disabled={index === 0}
                          title="Mover para cima"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(section.id, 'down')}
                          disabled={index === config.sections.length - 1}
                          title="Mover para baixo"
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSection(section.id)}
                        >
                          {section.enabled ? (
                            <EyeOn className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contato / WhatsApp */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Configurações de Contato / WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.contact?.showWhatsAppButton !== false}
                  onCheckedChange={(checked) => updateConfig({
                    contact: { ...(config.contact || {}), showWhatsAppButton: checked }
                  })}
                />
                <Label>Mostrar botão flutuante do WhatsApp</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wa-number">Número do WhatsApp (apenas dígitos)</Label>
                  <Input
                    id="wa-number"
                    value={config.contact?.whatsappNumber || ''}
                    onChange={(e) => updateConfig({
                      contact: { ...(config.contact || {}), whatsappNumber: e.target.value.replace(/\D/g, '') }
                    })}
                    placeholder="5599999999999"
                  />
                </div>
                <div>
                  <Label htmlFor="wa-scroll">Exibir após rolar (px)</Label>
                  <Input
                    id="wa-scroll"
                    type="number"
                    value={config.contact?.showAfterScroll ?? 200}
                    onChange={(e) => updateConfig({
                      contact: { ...(config.contact || {}), showAfterScroll: Number(e.target.value || 0) }
                    })}
                    min={0}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="wa-message">Mensagem padrão</Label>
                  <Textarea
                    id="wa-message"
                    value={config.contact?.whatsappMessage || ''}
                    onChange={(e) => updateConfig({
                      contact: { ...(config.contact || {}), whatsappMessage: e.target.value }
                    })}
                    placeholder="Olá! Preciso de ajuda..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAll} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Contato
                </Button>
                <Button variant="outline" onClick={() => window.open(`https://wa.me/${(config.contact?.whatsappNumber||'').replace(/\D/g,'')}?text=${encodeURIComponent(config.contact?.whatsappMessage||'Olá!')}`,'_blank')}>
                  Testar Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carousel" className="space-y-6">
          {/* Adicionar novo item */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Produto ao Carrossel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Produto</Label>
                  <Input
                    id="nome"
                    value={newItem.nome || ''}
                    onChange={(e) => setNewItem({ ...newItem, nome: e.target.value })}
                    placeholder="Ex: Mario Jedi Master"
                  />
                </div>
                

                <div>
                  <Label htmlFor="badge">Badge</Label>
                  <Select value={newItem.badge} onValueChange={(value) => setNewItem({ ...newItem, badge: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma badge" />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeOptions.map((badge) => (
                        <SelectItem key={badge} value={badge}>{badge}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <ImageUpload
                    value={newItem.imagem || ''}
                    onChange={(imageUrl) => setNewItem({ ...newItem, imagem: imageUrl })}
                    label="Imagem do Produto"
                    placeholder="URL da imagem ou faça upload"
                  />
                </div>

              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  {newItem.imagem && newItem.nome && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const generatedDesc = generateLocalDescription(newItem.imagem!, newItem.nome!);
                        setNewItem({ ...newItem, descricao: generatedDesc });
                      }}
                    >
                      🤖 Gerar com IA
                    </Button>
                  )}
                </div>
                <Textarea
                  id="descricao"
                  value={newItem.descricao || ''}
                  onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                  placeholder="Descrição do produto... (ou clique em 'Gerar com IA')"
                />
              </div>

              <Button onClick={handleAddItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Carrossel
              </Button>
            </CardContent>
          </Card>

          {/* Lista de itens do carrossel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Produtos no Carrossel</CardTitle>
                <Button onClick={handleSaveAll} disabled={isLoading || carouselLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {carouselLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Carregando produtos do carrossel...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {carouselItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum produto encontrado no carrossel.
                    </div>
                  ) : (
                    carouselItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <img 
                        src={`${resolveImageUrl(item.imagem)}?v=${Date.now()}`} 
                        alt={item.nome}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                        }}
                      />
                      <div>
                        <h3 className="font-medium">{item.nome}</h3>
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.ativo ? "default" : "secondary"}>
                            {item.badge}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.ativo}
                        onCheckedChange={() => handleToggleItem(item.id)}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicateItem(item)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração de Conteúdo */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Configurações de Conteúdo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hero Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Seção Hero</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.hero.showCarousel}
                      onCheckedChange={(checked) => updateConfig({ 
                        hero: { ...config.hero, showCarousel: checked } 
                      })}
                    />
                    <Label>Usar carrossel no Hero</Label>
                  </div>
                  <div>
                    <Label htmlFor="hero-title">Título Principal</Label>
                    <Input
                      id="hero-title"
                      value={config.hero.title}
                      onChange={(e) => updateConfig({ 
                        hero: { ...config.hero, title: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hero-cta">Texto do Botão</Label>
                    <Input
                      id="hero-cta"
                      value={config.hero.ctaText}
                      onChange={(e) => updateConfig({ 
                        hero: { ...config.hero, ctaText: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="hero-subtitle">Subtítulo</Label>
                  <Textarea
                    id="hero-subtitle"
                    value={config.hero.subtitle}
                    onChange={(e) => updateConfig({ 
                      hero: { ...config.hero, subtitle: e.target.value } 
                    })}
                  />
                </div>
              </div>

              {/* Produtos em Destaque */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Produtos em Destaque</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="produtos-title">Título</Label>
                    <Input
                      id="produtos-title"
                      value={config.produtosDestaque.title}
                      onChange={(e) => updateConfig({ 
                        produtosDestaque: { ...config.produtosDestaque, title: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="produtos-subtitle">Subtítulo</Label>
                    <Input
                      id="produtos-subtitle"
                      value={config.produtosDestaque.subtitle}
                      onChange={(e) => updateConfig({ 
                        produtosDestaque: { ...config.produtosDestaque, subtitle: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.produtosDestaque.showPrices}
                    onCheckedChange={(checked) => updateConfig({ 
                      produtosDestaque: { ...config.produtosDestaque, showPrices: checked } 
                    })}
                  />
                  <Label>Mostrar Preços</Label>
                </div>
              </div>

              {/* Eventos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Eventos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventos-title">Título</Label>
                    <Input
                      id="eventos-title"
                      value={config.eventos.title}
                      onChange={(e) => updateConfig({ 
                        eventos: { ...config.eventos, title: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventos-subtitle">Subtítulo</Label>
                    <Input
                      id="eventos-subtitle"
                      value={config.eventos.subtitle}
                      onChange={(e) => updateConfig({ 
                        eventos: { ...config.eventos, subtitle: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.eventos.showDates}
                    onCheckedChange={(checked) => updateConfig({ 
                      eventos: { ...config.eventos, showDates: checked } 
                    })}
                  />
                  <Label>Mostrar Datas</Label>
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Call to Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cta-title">Título</Label>
                    <Input
                      id="cta-title"
                      value={config.cta.title}
                      onChange={(e) => updateConfig({ 
                        cta: { ...config.cta, title: e.target.value } 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta-button">Texto do Botão</Label>
                    <Input
                      id="cta-button"
                      value={config.cta.buttonText}
                      onChange={(e) => updateConfig({ 
                        cta: { ...config.cta, buttonText: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cta-subtitle">Subtítulo</Label>
                  <Textarea
                    id="cta-subtitle"
                    value={config.cta.subtitle}
                    onChange={(e) => updateConfig({ 
                      cta: { ...config.cta, subtitle: e.target.value } 
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Configurações de Tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cores */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Paleta de Cores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, primaryColor: e.target.value } 
                        })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.primaryColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, primaryColor: e.target.value } 
                        })}
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, secondaryColor: e.target.value } 
                        })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.secondaryColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, secondaryColor: e.target.value } 
                        })}
                        placeholder="#06B6D4"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accentColor">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={config.theme.accentColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, accentColor: e.target.value } 
                        })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.theme.accentColor}
                        onChange={(e) => updateConfig({ 
                          theme: { ...config.theme, accentColor: e.target.value } 
                        })}
                        placeholder="#F59E0B"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Background do Hero</h3>
                <div>
                  <Label htmlFor="backgroundType">Tipo de Background</Label>
                  <Select 
                    value={config.theme.backgroundType} 
                    onValueChange={(value: 'gradient' | 'solid' | 'image') => 
                      updateConfig({ 
                        theme: { ...config.theme, backgroundType: value } 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient">Gradiente</SelectItem>
                      <SelectItem value="solid">Cor Sólida</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.theme.backgroundType === 'image' ? (
                  <ImageUpload
                    value={config.theme.heroBackground}
                    onChange={(imageUrl) => updateConfig({ 
                      theme: { ...config.theme, heroBackground: imageUrl } 
                    })}
                    label="Imagem de Background"
                    placeholder="URL da imagem de fundo ou faça upload"
                  />
                ) : (
                  <div>
                    <Label htmlFor="heroBackground">CSS Background</Label>
                    <Input
                      id="heroBackground"
                      value={config.theme.heroBackground}
                      onChange={(e) => updateConfig({ 
                        theme: { ...config.theme, heroBackground: e.target.value } 
                      })}
                      placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                  </div>
                )}
              </div>

              {/* Logo */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Logo</h3>
                <ImageUpload
                  value={config.theme.logoUrl}
                  onChange={(logoUrl) => updateConfig({ 
                    theme: { ...config.theme, logoUrl } 
                  })}
                  label="Logo da Loja"
                  placeholder="URL do logo ou faça upload"
                />
              </div>

              {/* Título da Página */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Título da Página</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="pageTitle">Título que aparece na aba do navegador</Label>
                    <Input
                      id="pageTitle"
                      value={config.theme.pageTitle}
                      onChange={(e) => updateConfig({ 
                        theme: { ...config.theme, pageTitle: e.target.value } 
                      })}
                      placeholder="Ex: MuhlStore - Brinquedos Raros e Colecionáveis"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recomendado: máximo 60 caracteres para melhor exibição
                    </p>
                  </div>
                  
                  {/* Preview do título */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-xs">📄</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Preview:</strong> {config.theme.pageTitle || 'Sem título'}</p>
                        <p className="text-xs">Aparece na aba do navegador</p>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Aplicar título imediatamente
                        document.title = config.theme.pageTitle;
                        
                        toast({
                          title: "Título atualizado!",
                          description: "O título foi aplicado na aba do navegador.",
                        });
                      }}
                    >
                      Aplicar Agora
                    </Button>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Favicon</h3>
                <div className="space-y-3">
                  <ImageUpload
                    value={config.theme.faviconUrl}
                    onChange={(faviconUrl) => updateConfig({ 
                      theme: { ...config.theme, faviconUrl } 
                    })}
                    label="Favicon da Loja"
                    placeholder="URL do favicon (.ico, .png, .svg) ou faça upload"
                  />
                  
                  <p className="text-xs text-gray-500">
                    Recomendado: 32x32px ou 16x16px em formato .ico, .png ou .svg
                  </p>
                  
                  {/* Preview do favicon */}
                  {config.theme.faviconUrl && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={config.theme.faviconUrl} 
                          alt="Preview Favicon" 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="text-sm text-gray-600">
                          <p><strong>Preview:</strong> Favicon atual</p>
                          <p className="text-xs">Aparece na aba do navegador</p>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Aplicar favicon imediatamente
                          const link = document.createElement('link');
                          link.rel = 'icon';
                          link.href = config.theme.faviconUrl;
                          link.type = config.theme.faviconUrl.endsWith('.ico') ? 'image/x-icon' : 'image/png';
                          
                          // Remove favicons existentes
                          const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
                          existingFavicons.forEach(existing => existing.remove());
                          
                          // Adiciona novo
                          document.head.appendChild(link);
                          
                          toast({
                            title: "Favicon atualizado!",
                            description: "O favicon foi aplicado na aba do navegador.",
                          });
                        }}
                      >
                        Aplicar Agora
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAll} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Tema
                </Button>
                <Button variant="outline" onClick={resetConfig}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview da Home */}
      <HomePreview isOpen={showPreview} onClose={() => setShowPreview(false)} />

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Edite as informações do produto do carrossel. Todas as alterações serão salvas automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-nome">Nome do Produto</Label>
                  <Input
                    id="edit-nome"
                    value={editingItem.nome}
                    onChange={(e) => setEditingItem({ ...editingItem, nome: e.target.value })}
                  />
                </div>
                

                <div>
                  <Label htmlFor="edit-badge">Badge</Label>
                  <Select 
                    value={editingItem.badge} 
                    onValueChange={(value) => setEditingItem({ ...editingItem, badge: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {badgeOptions.map((badge) => (
                        <SelectItem key={badge} value={badge}>{badge}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <ImageUpload
                    value={editingItem.imagem}
                    onChange={(imageUrl) => setEditingItem({ ...editingItem, imagem: imageUrl })}
                    label="Imagem do Produto"
                  />
                </div>

              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  {editingItem.imagem && editingItem.nome && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const generatedDesc = generateLocalDescription(editingItem.imagem, editingItem.nome);
                        setEditingItem({ ...editingItem, descricao: generatedDesc });
                      }}
                    >
                      🤖 Gerar com IA
                    </Button>
                  )}
                </div>
                <Textarea
                  id="edit-descricao"
                  value={editingItem.descricao}
                  onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value })}
                  placeholder="Descrição do produto... (ou clique em 'Gerar com IA')"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateItem}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeManager;