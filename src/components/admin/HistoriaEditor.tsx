import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Upload, 
  Image as ImageIcon, 
  Eye, 
  Edit, 
  X,
  Plus,
  Trash2,
  Move,
  Palette,
  Type,
  Sparkles,
  Gift,
  Heart,
  Target,
  Star,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoriaEditorProps {
  content?: {
    id?: string;
    section: string;
    title?: string;
    subtitle?: string;
    description?: string;
    image_url?: string;
    metadata?: any;
  };
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

interface ButtonConfig {
  id: string;
  text: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'outline';
  action: string;
  color: string;
}

const HistoriaEditor: React.FC<HistoriaEditorProps> = ({ 
  content, 
  onSave, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    title: content?.title || 'Nossa História',
    subtitle: content?.subtitle || '',
    description: content?.description || 'A MuhlStore nasceu do sonho de conectar pessoas através de brinquedos únicos e especiais. Desde 2020, nossa missão é descobrir e compartilhar tesouros de brinquedos raros e seminovos de todo o Brasil.',
    image_url: content?.image_url || '',
    badge_text: content?.metadata?.badge_text || 'Nossa História',
    badge_icon: content?.metadata?.badge_icon || 'Sparkles',
    show_badge: content?.metadata?.show_badge !== false,
    buttons: content?.metadata?.buttons || [
      {
        id: '1',
        text: 'Conheça Nossos Produtos',
        icon: 'Gift',
        variant: 'primary',
        action: '/loja',
        color: 'orange'
      },
      {
        id: '2',
        text: 'Nossa Missão',
        icon: 'Heart',
        variant: 'outline',
        action: '/about',
        color: 'orange'
      }
    ]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opções de ícones
  const iconOptions = [
    { value: 'Sparkles', label: 'Sparkles', icon: Sparkles },
    { value: 'Gift', label: 'Presente', icon: Gift },
    { value: 'Heart', label: 'Coração', icon: Heart },
    { value: 'Target', label: 'Alvo', icon: Target },
    { value: 'Star', label: 'Estrela', icon: Star },
    { value: 'Zap', label: 'Raio', icon: Zap },
    { value: 'Wand2', label: 'Varinha', icon: Wand2 },
  ];

  // Opções de cores
  const colorOptions = [
    { value: 'orange', label: 'Laranja', class: 'bg-orange-500 hover:bg-orange-600' },
    { value: 'blue', label: 'Azul', class: 'bg-blue-500 hover:bg-blue-600' },
    { value: 'green', label: 'Verde', class: 'bg-green-500 hover:bg-green-600' },
    { value: 'purple', label: 'Roxo', class: 'bg-purple-500 hover:bg-purple-600' },
    { value: 'pink', label: 'Rosa', class: 'bg-pink-500 hover:bg-pink-600' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleButtonChange = (buttonId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.map(btn => 
        btn.id === buttonId ? { ...btn, [field]: value } : btn
      )
    }));
  };

  const addButton = () => {
    const newButton: ButtonConfig = {
      id: Date.now().toString(),
      text: 'Novo Botão',
      icon: 'Gift',
      variant: 'primary',
      action: '/',
      color: 'orange'
    };
    
    setFormData(prev => ({
      ...prev,
      buttons: [...prev.buttons, newButton]
    }));
  };

  const removeButton = (buttonId: string) => {
    setFormData(prev => ({
      ...prev,
      buttons: prev.buttons.filter(btn => btn.id !== buttonId)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/sobre/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro no upload');

      const result = await response.json();
      handleInputChange('image_url', result.image_url);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar imagem');
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    try {
      const saveData = {
        section: 'hero',
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        image_url: formData.image_url,
        metadata: {
          badge_text: formData.badge_text,
          badge_icon: formData.badge_icon,
          show_badge: formData.show_badge,
          buttons: formData.buttons
        }
      };

      await onSave(saveData);
      setIsEditing(false);
      toast.success('Seção "Nossa História" salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar seção');
      console.error('Save error:', error);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      'Sparkles': Sparkles,
      'Gift': Gift,
      'Heart': Heart,
      'Target': Target,
      'Star': Star,
      'Zap': Zap,
      'Wand2': Wand2,
    };
    return iconMap[iconName] || Sparkles;
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'orange': 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500',
      'blue': 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
      'green': 'bg-green-500 hover:bg-green-600 text-white border-green-500',
      'purple': 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500',
      'pink': 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500',
    };
    return colorMap[color] || colorMap['orange'];
  };

  if (previewMode) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview - Nossa História
          </CardTitle>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(false)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20 p-8 rounded-lg">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                {formData.show_badge && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                    {React.createElement(getIconComponent(formData.badge_icon), { className: "w-4 h-4 mr-2" })}
                    {formData.badge_text}
                  </div>
                )}
                <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6 leading-tight">
                  {formData.title}
                </h1>
                <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                  {formData.description}
                </p>
                {formData.subtitle && (
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    {formData.subtitle}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  {formData.buttons.map((button) => {
                    const IconComponent = getIconComponent(button.icon);
                    return (
                      <Button
                        key={button.id}
                        variant={button.variant === 'primary' ? 'default' : 'outline'}
                        className={button.variant === 'primary' ? getColorClass(button.color) : 'border-orange-500 text-orange-600 hover:bg-orange-50'}
                        onClick={() => window.open(button.action, '_blank')}
                      >
                        <IconComponent className="w-4 h-4 mr-2" />
                        {button.text}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="relative">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Nossa História"
                    className="w-full h-96 object-cover rounded-xl shadow-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-200 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>Nenhuma imagem selecionada</p>
                    </div>
                  </div>
                )}
                {/* Badges de estatísticas */}
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
                  4+ Anos de Experiência
                </div>
                <div className="absolute bottom-4 left-4 bg-white text-orange-600 px-3 py-2 rounded-lg text-sm font-medium shadow-md">
                  1000+ Clientes Felizes
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Editor - Nossa História
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Badge Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Badge da Seção</Label>
            <Switch
              checked={formData.show_badge}
              onCheckedChange={(checked) => handleInputChange('show_badge', checked)}
            />
          </div>
          
          {formData.show_badge && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="badge_text">Texto do Badge</Label>
                <Input
                  id="badge_text"
                  value={formData.badge_text}
                  onChange={(e) => handleInputChange('badge_text', e.target.value)}
                  placeholder="Nossa História"
                />
              </div>
              <div>
                <Label htmlFor="badge_icon">Ícone do Badge</Label>
                <select
                  id="badge_icon"
                  value={formData.badge_icon}
                  onChange={(e) => handleInputChange('badge_icon', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Text Content */}
        <div className="space-y-4">
          <Label htmlFor="title" className="text-base font-medium">Título Principal</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Nossa História"
            className="text-lg"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="description" className="text-base font-medium">Descrição Principal</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descreva a história da sua empresa..."
            rows={4}
            className="text-base"
          />
        </div>

        <div className="space-y-4">
          <Label htmlFor="subtitle" className="text-base font-medium">Subtítulo (Opcional)</Label>
          <Textarea
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
            placeholder="Texto adicional..."
            rows={2}
          />
        </div>

        <Separator />

        {/* Image Upload */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Imagem Principal</Label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploadingImage ? 'Enviando...' : 'Upload de Imagem'}
            </Button>
            
            {formData.image_url && (
              <div className="flex items-center gap-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('image_url', '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Buttons Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Botões de Ação</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addButton}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Botão
            </Button>
          </div>

          <AnimatePresence>
            {formData.buttons.map((button, index) => (
              <motion.div
                key={button.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 border rounded-lg bg-gray-50 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Botão {index + 1}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeButton(button.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Texto do Botão</Label>
                    <Input
                      value={button.text}
                      onChange={(e) => handleButtonChange(button.id, 'text', e.target.value)}
                      placeholder="Texto do botão"
                    />
                  </div>
                  <div>
                    <Label>URL de Destino</Label>
                    <Input
                      value={button.action}
                      onChange={(e) => handleButtonChange(button.id, 'action', e.target.value)}
                      placeholder="/loja"
                    />
                  </div>
                  <div>
                    <Label>Ícone</Label>
                    <select
                      value={button.icon}
                      onChange={(e) => handleButtonChange(button.id, 'icon', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {iconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Estilo</Label>
                    <select
                      value={button.variant}
                      onChange={(e) => handleButtonChange(button.id, 'variant', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="primary">Primário</option>
                      <option value="outline">Contorno</option>
                      <option value="secondary">Secundário</option>
                    </select>
                  </div>
                </div>

                {button.variant === 'primary' && (
                  <div>
                    <Label>Cor</Label>
                    <div className="flex gap-2 mt-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleButtonChange(button.id, 'color', color.value)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            button.color === color.value ? 'border-gray-800' : 'border-gray-300'
                          } ${color.class}`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoriaEditor;
