import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, Camera, DollarSign, Package, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface MobileProductEditProps {
  productId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MobileProductEdit({ productId, onSuccess, onCancel }: MobileProductEditProps) {
  const [produto, setProduto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}`);
      const data = await response.json();
      setProduto(data);
      if (data.imagemUrl || data.imagem_url) {
        setFotoPreview(data.imagemUrl || data.imagem_url);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const formData = new FormData();
      Object.keys(produto).forEach(key => {
        if (produto[key] !== null && produto[key] !== undefined) {
          formData.append(key, produto[key]);
        }
      });

      if (foto) {
        formData.append('imagem', foto);
      }

      const response = await fetch(`${API_BASE_URL}/produtos/${productId}`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: 'Salvo! ✅',
          description: 'Produto atualizado com sucesso',
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!produto) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
    >
      <div className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-4">
        <Card className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-2xl shadow-2xl">
          {/* Header Fixo */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-3xl md:rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Editar Produto</h2>
                <p className="text-sm text-white/90">Modo Mobile</p>
              </div>
              {onCancel && (
                <button onClick={onCancel} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Foto */}
            <div>
              <Label className="text-base mb-3 block">Foto do Produto</Label>
              <div className="relative">
                {fotoPreview ? (
                  <div className="relative group">
                    <img
                      src={fotoPreview}
                      alt="Produto"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={() => cameraInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Trocar Foto
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full h-48 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Adicionar foto</p>
                    </div>
                  </button>
                )}
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFotoChange}
                className="hidden"
              />
            </div>

            {/* Campos Essenciais (sempre visíveis) */}
            <div className="space-y-4">
              <div>
                <Label className="text-base mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  value={produto.nome || ''}
                  onChange={(e) => setProduto({ ...produto, nome: e.target.value })}
                  className="text-lg h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-base mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Preço (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={produto.preco || ''}
                    onChange={(e) => setProduto({ ...produto, preco: e.target.value })}
                    className="text-lg h-12"
                  />
                </div>

                <div>
                  <Label className="text-base mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Estoque
                  </Label>
                  <Input
                    type="number"
                    value={produto.estoque || ''}
                    onChange={(e) => setProduto({ ...produto, estoque: e.target.value })}
                    className="text-lg h-12"
                  />
                </div>
              </div>

              <div>
                <Label className="text-base mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoria
                </Label>
                <Input
                  value={produto.categoria || ''}
                  onChange={(e) => setProduto({ ...produto, categoria: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>

            {/* Campos Opcionais (Accordion para economizar espaço) */}
            <Accordion type="single" collapsible>
              <AccordionItem value="detalhes">
                <AccordionTrigger className="text-base">
                  Detalhes Adicionais (Opcional)
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={produto.descricao || ''}
                      onChange={(e) => setProduto({ ...produto, descricao: e.target.value })}
                      placeholder="Descreva o produto..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={produto.marca || ''}
                        onChange={(e) => setProduto({ ...produto, marca: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Material</Label>
                      <Input
                        value={produto.material || ''}
                        onChange={(e) => setProduto({ ...produto, material: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Produto em Destaque</Label>
                      <Switch
                        checked={produto.destaque}
                        onCheckedChange={(checked) => setProduto({ ...produto, destaque: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Em Promoção</Label>
                      <Switch
                        checked={produto.promocao}
                        onCheckedChange={(checked) => setProduto({ ...produto, promocao: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Lançamento</Label>
                      <Switch
                        checked={produto.lancamento}
                        onCheckedChange={(checked) => setProduto({ ...produto, lancamento: checked })}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Footer Fixo */}
          <div className="sticky bottom-0 border-t bg-white p-4 rounded-b-3xl md:rounded-b-2xl space-y-3">
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="w-full"
              >
                Cancelar
              </Button>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

