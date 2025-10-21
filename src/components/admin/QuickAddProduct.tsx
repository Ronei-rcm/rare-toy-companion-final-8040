import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Zap, Save, X, Check, Plus, DollarSign, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface QuickAddProductProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Categoria {
  id: number;
  nome: string;
  slug: string;
  icon: string;
  ativo: boolean;
}

export function QuickAddProduct({ onSuccess, onCancel }: QuickAddProductProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('1');
  const [categoria, setCategoria] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  // Carregar categorias do banco de dados
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        setLoadingCategorias(true);
        const response = await fetch('/api/categorias', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar categorias');
        }
        
        const categorias = await response.json();
        console.log('📡 Categorias recebidas da API:', categorias);
        
        // Mapear categorias para o formato esperado
        const categoriasFormatadas = categorias.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          slug: cat.slug,
          icon: cat.icon || '📦',
          ativo: cat.ativo !== false // Se não tem campo ativo, considerar como ativa
        }));
        
        console.log('✅ Categorias formatadas:', categoriasFormatadas.length);
        setCategoriasDisponiveis(categoriasFormatadas);
      } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        // Fallback para categorias estáticas em caso de erro
        setCategoriasDisponiveis([
          { id: 1, nome: 'Action Figures', slug: 'action-figures', icon: '🦸', ativo: true },
          { id: 2, nome: 'Bonecos', slug: 'bonecos', icon: '🤖', ativo: true },
          { id: 3, nome: 'Carrinhos', slug: 'carrinhos', icon: '🚗', ativo: true },
          { id: 4, nome: 'Pelúcias', slug: 'pelucias', icon: '🧸', ativo: true },
          { id: 5, nome: 'Jogos', slug: 'jogos', icon: '🎮', ativo: true },
          { id: 6, nome: 'Colecionáveis', slug: 'colecionaveis', icon: '💎', ativo: true },
          { id: 7, nome: 'Vintage', slug: 'vintage', icon: '⭐', ativo: true },
          { id: 8, nome: 'Outros', slug: 'outros', icon: '📦', ativo: true }
        ]);
      } finally {
        setLoadingCategorias(false);
      }
    };

    carregarCategorias();
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'A foto deve ter no máximo 10MB',
          variant: 'destructive',
        });
        return;
      }

      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // Validações mínimas
    if (!nome.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome do produto',
        variant: 'destructive',
      });
      return;
    }

    if (!isDraft && !preco) {
      toast({
        title: 'Preço obrigatório',
        description: 'Digite o preço do produto',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('preco', preco || '0');
      formData.append('estoque', estoque);
      formData.append('categoria', categoria || 'Outros');
      formData.append('status', isDraft ? 'rascunho' : 'ativo');
      formData.append('quick_add', 'true'); // Flag para identificar cadastro rápido

      if (foto) {
        formData.append('imagem', foto);
      }

      const response = await fetch(`${API_BASE_URL}/produtos/quick-add`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar produto');
      }

      const result = await response.json();

      toast({
        title: isDraft ? 'Rascunho salvo! 📝' : 'Produto cadastrado! ✅',
        description: isDraft 
          ? 'Complete depois em "Produtos"' 
          : `${nome} foi adicionado ao catálogo`,
      });

      // Limpar formulário
      setNome('');
      setPreco('');
      setEstoque('1');
      setCategoria('');
      setFoto(null);
      setFotoPreview('');
      setStep(1);

      onSuccess?.();
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro ao cadastrar',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
    >
      <Card className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-3xl md:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Cadastro Rápido</h2>
                <p className="text-sm text-white/90">Modo Mobile-First 📱</p>
              </div>
            </div>
            {onCancel && (
              <button onClick={onCancel} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Foto */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-1">Foto do Produto</h3>
                  <p className="text-sm text-muted-foreground">Tire ou selecione uma foto</p>
                </div>

                {/* Preview ou placeholder */}
                <div className="relative">
                  {fotoPreview ? (
                    <div className="relative group">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => {
                          setFoto(null);
                          setFotoPreview('');
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl flex items-center justify-center border-2 border-dashed border-purple-300">
                      <div className="text-center">
                        <Camera className="w-16 h-16 text-purple-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Sem foto ainda</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de captura */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    onClick={handleCameraCapture}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    <Camera className="w-5 h-5" />
                    Tirar Foto
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Galeria
                  </Button>
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />

                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  className="w-full"
                >
                  {fotoPreview ? 'Continuar' : 'Pular (adicionar depois)'}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Dados básicos */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-1">Dados do Produto</h3>
                  <p className="text-sm text-muted-foreground">Informações essenciais</p>
                </div>

                {/* Nome */}
                <div>
                  <Label className="text-base mb-2 block">
                    Nome do Produto <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Action Figure Batman"
                    className="text-lg h-12"
                    autoFocus
                  />
                </div>

                {/* Preço */}
                <div>
                  <Label className="text-base mb-2 block">
                    Preço (R$) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="0.00"
                      className="text-lg h-12 pl-10"
                    />
                  </div>
                </div>

                {/* Estoque */}
                <div>
                  <Label className="text-base mb-2 block">Quantidade em Estoque</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={estoque}
                      onChange={(e) => setEstoque(e.target.value)}
                      placeholder="1"
                      className="text-lg h-12 pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setStep(3)}
                    disabled={!nome || !preco}
                    className="flex-1"
                  >
                    Continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Categoria e Finalizar */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-1">Quase lá!</h3>
                  <p className="text-sm text-muted-foreground">Selecione a categoria</p>
                </div>

                {/* Categorias dinâmicas do banco de dados */}
                {loadingCategorias ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    <span className="ml-2 text-sm text-muted-foreground">Carregando categorias...</span>
                  </div>
                ) : categoriasDisponiveis.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {console.log('🎨 Renderizando categorias:', categoriasDisponiveis.length, categoriasDisponiveis)}
                    {categoriasDisponiveis.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoria(cat.nome)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          categoria === cat.nome
                            ? 'border-purple-600 bg-purple-50 text-purple-900'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <p className="font-medium">{cat.nome}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      ⚠️ Nenhuma categoria encontrada
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Digite uma categoria abaixo ou adicione categorias no painel admin
                    </p>
                  </div>
                )}

                {/* Categoria customizada */}
                <div>
                  <Label className="text-sm mb-2 block">Ou digite outra:</Label>
                  <Input
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Digite a categoria..."
                    className="h-12"
                  />
                  {categoria && !categoriasDisponiveis.some(cat => cat.nome.toLowerCase() === categoria.toLowerCase()) && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Esta categoria será criada automaticamente se não existir
                      </p>
                    </div>
                  )}
                </div>

                {/* Resumo */}
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <p className="text-sm font-medium mb-3">📋 Resumo:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Produto:</span>
                      <span className="font-medium">{nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-medium text-green-600">R$ {preco}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estoque:</span>
                      <span className="font-medium">{estoque} un.</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Categoria:</span>
                      <div className="flex items-center gap-2">
                        {categoria && categoriasDisponiveis.find(cat => cat.nome === categoria)?.icon && (
                          <span className="text-lg">{categoriasDisponiveis.find(cat => cat.nome === categoria)?.icon}</span>
                        )}
                        <span className="font-medium">{categoria || 'Não definida'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Foto:</span>
                      <span className="font-medium">{foto ? '✅ Sim' : '❌ Não'}</span>
                    </div>
                  </div>
                </Card>

                {/* Botões finais */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting || !categoria}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Cadastrar e Publicar
                      </>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Salvar como Rascunho
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="w-full"
                  >
                    Voltar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Dicas */}
        <div className="border-t bg-gray-50 p-4 rounded-b-3xl md:rounded-b-2xl">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <span>💡</span>
            <div>
              <p className="font-medium mb-1">Dica Pro:</p>
              {step === 1 && <p>Use a câmera do celular para cadastro ultra-rápido!</p>}
              {step === 2 && <p>Preço e nome são obrigatórios. O resto você completa depois.</p>}
              {step === 3 && <p>Salve como rascunho se quiser adicionar mais detalhes depois.</p>}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

