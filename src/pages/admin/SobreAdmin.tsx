import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Users, 
  Award, 
  Target, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Shield,
  Zap,
  Gift,
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  GripVertical,
  Settings,
  Palette,
  Type,
  ImagePlus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  useSobreContent, 
  useUpdateSobreContent,
  useCompanyValues,
  useCreateCompanyValue,
  useUpdateCompanyValue,
  useDeleteCompanyValue,
  useTeamMembers,
  useCreateTeamMember,
  useUpdateTeamMember,
  useDeleteTeamMember,
  useCompanyStats,
  useCreateCompanyStat,
  useUpdateCompanyStat,
  useDeleteCompanyStat,
  useContactInfo,
  useCreateContactInfo,
  useUpdateContactInfo,
  useDeleteContactInfo
} from '@/hooks/useSobre';
import { uploadSobreImage, uploadTeamMemberImage } from '@/api/sobre-api';
import { CreateSobreContentData, CreateCompanyValueData, UpdateCompanyValueData, CreateTeamMemberData, UpdateTeamMemberData, CreateCompanyStatData, UpdateCompanyStatData, CreateContactInfoData, UpdateContactInfoData } from '@/types/sobre';
import { toast } from 'sonner';
import HistoriaEditor from '@/components/admin/HistoriaEditor';

const SobreAdmin = () => {
  // Opções de ícones para seleção
  const iconOptions = [
    { value: 'Heart', label: 'Coração' },
    { value: 'Users', label: 'Usuários' },
    { value: 'Award', label: 'Prêmio' },
    { value: 'Target', label: 'Alvo' },
    { value: 'Star', label: 'Estrela' },
    { value: 'Shield', label: 'Escudo' },
    { value: 'Zap', label: 'Raio' },
    { value: 'Gift', label: 'Presente' },
    { value: 'Clock', label: 'Relógio' },
    { value: 'TrendingUp', label: 'Tendência' },
    { value: 'Mail', label: 'Email' },
    { value: 'Phone', label: 'Telefone' },
    { value: 'MapPin', label: 'Localização' },
    { value: 'LayoutDashboard', label: 'Dashboard' },
    { value: 'Package', label: 'Pacote' },
    { value: 'ShoppingCart', label: 'Carrinho' },
    { value: 'Layers', label: 'Camadas' },
    { value: 'Calendar', label: 'Calendário' },
    { value: 'Settings', label: 'Configurações' },
    { value: 'MessageCircle', label: 'Mensagem' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Truck', label: 'Caminhão' },
    { value: 'Tag', label: 'Tag' },
    { value: 'Info', label: 'Informação' },
  ];
  const [activeTab, setActiveTab] = useState('conteudo');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Hooks para dados
  const { data: sobreContent, isLoading: loadingContent } = useSobreContent();
  const { data: valores, isLoading: loadingValores } = useCompanyValues();
  const { data: equipe, isLoading: loadingEquipe } = useTeamMembers();
  const { data: stats, isLoading: loadingStats } = useCompanyStats();
  const { data: contato, isLoading: loadingContato } = useContactInfo();

  // Hooks para mutações
  const updateSobreContent = useUpdateSobreContent();
  const createCompanyValue = useCreateCompanyValue();
  const updateCompanyValue = useUpdateCompanyValue();
  const deleteCompanyValue = useDeleteCompanyValue();
  const createTeamMember = useCreateTeamMember();
  const updateTeamMember = useUpdateTeamMember();
  const deleteTeamMember = useDeleteTeamMember();
  const createCompanyStat = useCreateCompanyStat();
  const updateCompanyStat = useUpdateCompanyStat();
  const deleteCompanyStat = useDeleteCompanyStat();
  const createContactInfo = useCreateContactInfo();
  const updateContactInfo = useUpdateContactInfo();
  const deleteContactInfo = useDeleteContactInfo();

  // Mapear ícones
  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      'Heart': Heart,
      'Users': Users,
      'Award': Award,
      'Target': Target,
      'Star': Star,
      'Shield': Shield,
      'Zap': Zap,
      'Gift': Gift,
      'Clock': Clock,
      'TrendingUp': TrendingUp,
      'Mail': Mail,
      'Phone': Phone,
      'MapPin': MapPin,
    };
    return iconMap[iconName || 'Heart'] || Heart;
  };

  const handleEdit = (item: any, type: string) => {
    setEditingItem(type);
    setFormData({ ...item });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({});
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsLoading(true);
      let result;
      
      if (editingItem === 'equipe' && formData.id) {
        // Upload específico para membro da equipe
        result = await uploadTeamMemberImage(formData.id, file);
      } else {
        // Upload geral
        result = await uploadSobreImage(file);
      }
      
      if (result.success) {
        setFormData({ ...formData, image_url: result.fullUrl });
        toast.success('Imagem enviada com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao fazer upload da imagem', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (type: string) => {
    try {
      setIsLoading(true);
      
      // Validação de campos obrigatórios
      if (type === 'valor' && !formData.title) {
        toast.error('Título é obrigatório');
        return;
      }
      if (type === 'equipe' && !formData.name) {
        toast.error('Nome é obrigatório');
        return;
      }
      if (type === 'stat' && (!formData.title || !formData.value)) {
        toast.error('Título e valor são obrigatórios');
        return;
      }
      if (type === 'contato' && (!formData.title || !formData.value)) {
        toast.error('Título e valor são obrigatórios');
        return;
      }
      if (type === 'conteudo' && !formData.section) {
        toast.error('Seção é obrigatória');
        return;
      }

      if (type === 'conteudo') {
        await updateSobreContent.mutateAsync({
          section: formData.section,
          data: formData
        });
        toast.success('Conteúdo da seção atualizado com sucesso!');
      } else if (type === 'valor') {
        if (formData.id) {
          await updateCompanyValue.mutateAsync({
            id: formData.id,
            data: formData
          });
          toast.success('Valor atualizado com sucesso!');
        } else {
          await createCompanyValue.mutateAsync(formData);
          toast.success('Valor criado com sucesso!');
        }
      } else if (type === 'equipe') {
        if (formData.id) {
          await updateTeamMember.mutateAsync({
            id: formData.id,
            data: formData
          });
          toast.success('Membro da equipe atualizado com sucesso!');
        } else {
          await createTeamMember.mutateAsync(formData);
          toast.success('Membro da equipe criado com sucesso!');
        }
      } else if (type === 'stat') {
        if (formData.id) {
          await updateCompanyStat.mutateAsync({
            id: formData.id,
            data: formData
          });
          toast.success('Estatística atualizada com sucesso!');
        } else {
          await createCompanyStat.mutateAsync(formData);
          toast.success('Estatística criada com sucesso!');
        }
      } else if (type === 'contato') {
        if (formData.id) {
          await updateContactInfo.mutateAsync({
            id: formData.id,
            data: formData
          });
          toast.success('Informação de contato atualizada com sucesso!');
        } else {
          await createContactInfo.mutateAsync(formData);
          toast.success('Informação de contato criada com sucesso!');
        }
      }
      
      setEditingItem(null);
      setFormData({});
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar item', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, type: string) => {
    try {
      if (type === 'valor') {
        await deleteCompanyValue.mutateAsync(id);
      } else if (type === 'equipe') {
        await deleteTeamMember.mutateAsync(id);
      } else if (type === 'stat') {
        await deleteCompanyStat.mutateAsync(id);
      } else if (type === 'contato') {
        await deleteContactInfo.mutateAsync(id);
      }
      toast.success('Deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar');
    }
  };

  const handleAddNew = (type: string) => {
    setEditingItem(type);
    let newFormData: any = { is_active: true, order_index: 0 };
    if (type === 'valor') {
      newFormData = { ...newFormData, title: '', description: '', icon: 'Heart', order_index: (valores?.length || 0) + 1 };
    } else if (type === 'equipe') {
      newFormData = { ...newFormData, name: '', position: '', description: '', image_url: '', order_index: (equipe?.length || 0) + 1 };
    } else if (type === 'stat') {
      newFormData = { ...newFormData, title: '', value: '', icon: 'TrendingUp', order_index: (stats?.length || 0) + 1 };
    } else if (type === 'contato') {
      newFormData = { ...newFormData, type: 'email', title: '', value: '', icon: 'Mail', order_index: (contato?.length || 0) + 1 };
    }
    setFormData(newFormData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
      {/* Header Moderno */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Gerenciar Página Sobre
                </h1>
                <p className="text-slate-600 text-sm">Edite todo o conteúdo da página Sobre</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={previewMode ? "default" : "outline"}
                onClick={() => setPreviewMode(!previewMode)}
                className="gap-2"
              >
                {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewMode ? "Editar" : "Preview"}
              </Button>
              <Badge variant="outline" className="gradient-brand-soft text-orange-700 border-orange-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Totalmente Gerenciável
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-orange-100 rounded-2xl p-1">
            <TabsTrigger 
              value="conteudo" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-xl"
            >
              <Type className="w-4 h-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger 
              value="valores"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-xl"
            >
              <Heart className="w-4 h-4 mr-2" />
              Valores
            </TabsTrigger>
            <TabsTrigger 
              value="equipe"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-xl"
            >
              <Users className="w-4 h-4 mr-2" />
              Equipe
            </TabsTrigger>
            <TabsTrigger 
              value="stats"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-xl"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger 
              value="contato"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-xl"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contato
            </TabsTrigger>
          </TabsList>

        {/* Conteúdo Geral */}
        <TabsContent value="conteudo" className="space-y-6 mt-6">
          {/* Editor especializado para Nossa História */}
          {sobreContent?.find(content => content.section === 'hero') && (
            <HistoriaEditor
              content={sobreContent.find(content => content.section === 'hero')}
              onSave={async (data) => {
                const heroContent = sobreContent?.find(content => content.section === 'hero');
                if (heroContent) {
                  await updateSobreContent.mutateAsync({
                    section: 'hero',
                    data: data
                  });
                } else {
                  // Criar novo conteúdo se não existir
                  await updateSobreContent.mutateAsync({
                    section: 'hero',
                    data: data
                  });
                }
              }}
              isLoading={updateSobreContent.isPending}
            />
          )}

          {/* Outras seções */}
          <div className="grid gap-6">
            {sobreContent?.filter(content => content.section !== 'hero').map((content) => (
              <Card key={content.id} className="bg-white/80 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl capitalize">{content.section}</CardTitle>
                        <p className="text-sm text-slate-600">Conteúdo da seção {content.section}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(content, 'conteudo')}
                      className="hover:bg-orange-50 hover:border-orange-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Título</Label>
                        <p className="text-slate-900 font-medium">{content.title || 'Não definido'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-700">Subtítulo</Label>
                        <p className="text-slate-600">{content.subtitle || 'Não definido'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {content.image_url && (
                        <div>
                          <Label className="text-sm font-medium text-slate-700">Imagem</Label>
                          <div className="mt-2">
                            <img 
                              src={content.image_url} 
                              alt="Preview" 
                              className="w-20 h-20 object-cover rounded-lg border border-orange-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Descrição</Label>
                    <p className="text-slate-600 mt-1 leading-relaxed">
                      {content.description || 'Não definido'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Valores */}
        <TabsContent value="valores" className="space-y-6 mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Valores da Empresa</CardTitle>
                    <p className="text-sm text-slate-600">Gerencie os valores e princípios da empresa</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleAddNew('valor')}
                  className="gradient-brand text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Valor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {valores?.map((valor, index) => {
                  const IconComponent = getIconComponent(valor.icon);
                  return (
                    <div 
                      key={valor.id} 
                      className="group bg-white border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center cursor-move group-hover:bg-orange-200 transition-colors">
                            <GripVertical className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-900">{valor.title}</h3>
                            <p className="text-slate-600 mt-1">{valor.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Ordem: {valor.order_index}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(valor, 'valor')}
                              className="hover:bg-orange-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(valor.id, 'valor')}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {valores?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum valor cadastrado</h3>
                    <p className="text-slate-600 mb-4">Adicione os valores da sua empresa para começar</p>
                    <Button 
                      onClick={() => handleAddNew('valor')}
                      className="gradient-brand text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Valor
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipe */}
        <TabsContent value="equipe" className="space-y-6 mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Membros da Equipe</CardTitle>
                    <p className="text-sm text-slate-600">Gerencie os membros da sua equipe</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleAddNew('equipe')}
                  className="gradient-brand text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {equipe?.map((membro, index) => (
                  <div 
                    key={membro.id} 
                    className="group bg-white border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center cursor-move group-hover:bg-orange-200 transition-colors mt-1">
                        <GripVertical className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {membro.image_url ? (
                                <img 
                                  src={membro.image_url} 
                                  alt={membro.name}
                                  className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
                                  <Users className="w-8 h-8 text-white" />
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-900">{membro.name}</h3>
                              <p className="text-orange-600 font-medium">{membro.position}</p>
                              <p className="text-slate-600 mt-2 leading-relaxed">{membro.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Ordem: {membro.order_index}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(membro, 'equipe')}
                                className="hover:bg-orange-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(membro.id, 'equipe')}
                                className="hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {equipe?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum membro cadastrado</h3>
                    <p className="text-slate-600 mb-4">Adicione os membros da sua equipe para começar</p>
                    <Button 
                      onClick={() => handleAddNew('equipe')}
                      className="gradient-brand text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Membro
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estatísticas */}
        <TabsContent value="stats" className="space-y-6 mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Estatísticas da Empresa</CardTitle>
                    <p className="text-sm text-slate-600">Gerencie as estatísticas e números da empresa</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleAddNew('stat')}
                  className="gradient-brand text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Estatística
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {stats?.map((stat, index) => {
                  const IconComponent = getIconComponent(stat.icon);
                  return (
                    <div 
                      key={stat.id} 
                      className="group bg-white border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center cursor-move group-hover:bg-orange-200 transition-colors">
                            <GripVertical className="w-4 h-4 text-orange-600" />
                          </div>
                          {stat.icon && (
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stat, 'stat')}
                            className="hover:bg-orange-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stat.id, 'stat')}
                            className="hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-orange-600 mb-2">{stat.value}</div>
                        <div className="text-lg font-semibold text-slate-900">{stat.title}</div>
                        <Badge variant="outline" className="text-xs mt-2">
                          Ordem: {stat.order_index}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {stats?.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma estatística cadastrada</h3>
                    <p className="text-slate-600 mb-4">Adicione as estatísticas da sua empresa para começar</p>
                    <Button 
                      onClick={() => handleAddNew('stat')}
                      className="gradient-brand text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Estatística
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contato */}
        <TabsContent value="contato" className="space-y-6 mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Informações de Contato</CardTitle>
                    <p className="text-sm text-slate-600">Gerencie as informações de contato da empresa</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleAddNew('contato')}
                  className="gradient-brand text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Contato
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {contato?.map((info, index) => {
                  const IconComponent = getIconComponent(info.icon);
                  return (
                    <div 
                      key={info.id} 
                      className="group bg-white border border-orange-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center cursor-move group-hover:bg-orange-200 transition-colors">
                            <GripVertical className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(info, 'contato')}
                            className="hover:bg-orange-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(info.id, 'contato')}
                            className="hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">{info.title}</h3>
                        <p className="text-slate-600 mb-3">{info.value}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {info.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Ordem: {info.order_index}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {contato?.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma informação de contato cadastrada</h3>
                    <p className="text-slate-600 mb-4">Adicione as informações de contato da sua empresa para começar</p>
                    <Button 
                      onClick={() => handleAddNew('contato')}
                      className="gradient-brand text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Informação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Modal de Edição Moderno */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-orange-100">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    {editingItem === 'conteudo' && <Type className="w-6 h-6 text-white" />}
                    {editingItem === 'valor' && <Heart className="w-6 h-6 text-white" />}
                    {editingItem === 'equipe' && <Users className="w-6 h-6 text-white" />}
                    {editingItem === 'stat' && <TrendingUp className="w-6 h-6 text-white" />}
                    {editingItem === 'contato' && <Mail className="w-6 h-6 text-white" />}
                    {editingItem === 'new' && <Plus className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editingItem === 'new' ? 'Adicionar Novo' : 'Editar'}
                    </h2>
                    <p className="text-orange-100 text-sm">
                      {editingItem === 'conteudo' ? 'Edite o conteúdo das seções da página' :
                       editingItem === 'valor' ? 'Edite os valores da empresa' :
                       editingItem === 'equipe' ? 'Edite os membros da equipe' :
                       editingItem === 'stat' ? 'Edite as estatísticas da empresa' :
                       editingItem === 'contato' ? 'Edite as informações de contato' :
                       'Adicione um novo item'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-white hover:bg-white/20 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Conteúdo do Modal */}
            <div className="p-8 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Campos Básicos */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                      {editingItem === 'equipe' ? 'Nome *' : 'Título *'}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title || formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, [editingItem === 'equipe' ? 'name' : 'title']: e.target.value })}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                      placeholder={editingItem === 'equipe' ? 'Digite o nome...' : 'Digite o título...'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="text-sm font-semibold text-slate-700">
                      {editingItem === 'equipe' ? 'Cargo/Posição' : 
                       editingItem === 'stat' ? 'Valor *' : 
                       editingItem === 'contato' ? 'Tipo' : 'Subtítulo'}
                    </Label>
                    {editingItem === 'contato' ? (
                      <select
                        id="subtitle"
                        value={formData.type || 'email'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-orange-100"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Telefone</option>
                        <option value="address">Endereço</option>
                        <option value="website">Website</option>
                        <option value="social">Rede Social</option>
                      </select>
                    ) : (
                      <Input
                        id="subtitle"
                        value={formData.subtitle || formData.position || formData.value || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [editingItem === 'equipe' ? 'position' : 
                           editingItem === 'stat' ? 'value' : 'subtitle']: e.target.value 
                        })}
                        className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                        placeholder={editingItem === 'equipe' ? 'Digite o cargo...' : 
                                   editingItem === 'stat' ? 'Digite o valor...' : 'Digite o subtítulo...'}
                      />
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                    {editingItem === 'contato' ? 'Valor/Informação *' : 'Descrição'}
                  </Label>
                  {editingItem === 'contato' ? (
                    <Input
                      id="description"
                      value={formData.value || ''}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                      placeholder="Digite o valor da informação de contato..."
                    />
                  ) : (
                    <Textarea
                      id="description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                      placeholder={editingItem === 'equipe' ? 'Digite a descrição do membro da equipe...' : 
                                 editingItem === 'valor' ? 'Digite a descrição do valor...' : 
                                 editingItem === 'stat' ? 'Digite a descrição da estatística...' : 'Digite a descrição...'}
                    />
                  )}
                </div>

                {/* Campos Específicos por Tipo */}
                {(editingItem === 'valor' || editingItem === 'stat' || editingItem === 'contato' || editingItem === 'equipe') && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="icon" className="text-sm font-semibold text-slate-700">
                        Ícone
                      </Label>
                      <select
                        id="icon"
                        value={formData.icon || 'Heart'}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-orange-100"
                      >
                        {iconOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="order_index" className="text-sm font-semibold text-slate-700">
                        Ordem
                      </Label>
                      <Input
                        id="order_index"
                        type="number"
                        value={formData.order_index || 0}
                        onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                        className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                {/* Campos Específicos para Conteúdo */}
                {editingItem === 'conteudo' && (
                  <div className="space-y-2">
                    <Label htmlFor="section" className="text-sm font-semibold text-slate-700">
                      Seção *
                    </Label>
                    <select
                      id="section"
                      value={formData.section || 'hero'}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full p-3 border border-orange-200 rounded-xl focus:border-orange-400 focus:ring-orange-100"
                    >
                      <option value="hero">Hero (Seção Principal)</option>
                      <option value="valores">Valores</option>
                      <option value="equipe">Equipe</option>
                      <option value="stats">Estatísticas</option>
                      <option value="contato">Contato</option>
                    </select>
                  </div>
                )}

                {/* URL da Imagem */}
                {(editingItem === 'equipe' || editingItem === 'conteudo') && (
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-sm font-semibold text-slate-700">
                      {editingItem === 'equipe' ? 'Foto do Membro' : 'Imagem da Seção'}
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="image_url"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="border-orange-200 focus:border-orange-400 focus:ring-orange-100"
                        placeholder={editingItem === 'equipe' ? 'https://exemplo.com/foto.jpg' : 'https://exemplo.com/imagem.jpg'}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-orange-200 hover:bg-orange-50"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isLoading ? 'Enviando...' : 'Upload'}
                      </Button>
                    </div>
                    {formData.image_url && (
                      <div className="mt-3">
                        <img 
                          src={formData.image_url} 
                          alt="Preview" 
                          className="w-24 h-24 object-cover rounded-xl border border-orange-100"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Status Ativo */}
                <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                  <Switch
                    id="is_active"
                    checked={formData.is_active || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                    {editingItem === 'conteudo' ? 'Seção ativa (visível na página)' :
                     editingItem === 'valor' ? 'Valor ativo (visível na página)' :
                     editingItem === 'equipe' ? 'Membro ativo (visível na página)' :
                     editingItem === 'stat' ? 'Estatística ativa (visível na página)' :
                     editingItem === 'contato' ? 'Informação ativa (visível na página)' :
                     'Item ativo (visível na página)'}
                  </Label>
                </div>
              </div>
            </div>
            
            {/* Footer do Modal */}
            <div className="px-8 py-6 bg-slate-50 border-t border-orange-100 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="border-orange-200 hover:bg-orange-50"
              >
                Cancelar
              </Button>
                  <Button 
                    onClick={() => handleSave(editingItem || activeTab)}
                    className="gradient-brand text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Salvando...' : 
                     editingItem && formData.id ? 'Atualizar' : 'Criar'}
                  </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SobreAdmin;
