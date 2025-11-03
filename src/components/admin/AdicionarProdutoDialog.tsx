import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Package, Settings, Image } from 'lucide-react';
import ImageUpload from '@/components/admin/ImageUpload';

// Definir o schema de validação com zod
const produtoSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  preco: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'O preço deve ser um número maior que zero',
  }),
  estoque: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'O estoque deve ser um número maior ou igual a zero',
  }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  idadeRecomendada: z.string().min(1, { message: 'Selecione uma faixa etária' }),
});

// Opções de categorias
const categorias = [
  { value: 'bonecos', label: 'Bonecos de Ação' },
  { value: 'educativos', label: 'Brinquedos Educativos' },
  { value: 'pelucias', label: 'Pelúcias' },
  { value: 'carros', label: 'Carrinhos' },
  { value: 'jogos', label: 'Jogos de Tabuleiro' },
  { value: 'quebra-cabecas', label: 'Quebra-Cabeças' },
];

// Opções de faixa etária
const faixasEtarias = [
  { value: '0-2', label: '0 a 2 anos' },
  { value: '3-5', label: '3 a 5 anos' },
  { value: '6-8', label: '6 a 8 anos' },
  { value: '9-12', label: '9 a 12 anos' },
  { value: '13+', label: '13+ anos' },
];

interface AdicionarProdutoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdicionarProdutoDialog = ({ open, onOpenChange }: AdicionarProdutoDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basico');

  // Inicializar o formulário com react-hook-form e zod
  const form = useForm<z.infer<typeof produtoSchema>>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      preco: '',
      estoque: '',
      categoria: '',
      idadeRecomendada: '',
    },
  });

  // Função de envio do formulário
  function onSubmit(values: z.infer<typeof produtoSchema>) {
    // Converter valores numéricos
    const produtoData = {
      ...values,
      preco: Number(values.preco),
      estoque: Number(values.estoque),
    };
    
    console.log(produtoData);
    
    toast({
      title: 'Produto adicionado com sucesso!',
      description: 'O produto foi cadastrado no sistema.',
    });
    
    // Fechar o diálogo e resetar o formulário
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo produto de forma organizada.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basico" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="imagem" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagem
                </TabsTrigger>
                <TabsTrigger value="detalhes" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="descricao" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Descrição
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Básico */}
              <TabsContent value="basico" className="space-y-3 mt-4">
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.value} value={categoria.value}>
                                {categoria.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estoque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Tab Imagem */}
              <TabsContent value="imagem" className="space-y-3 mt-4">
                <FormField
                  control={form.control}
                  name="imagemUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem do Produto</FormLabel>
                      <FormControl>
                        <ImageUpload
                          label=""
                          placeholder="Cole uma URL ou faça upload"
                          onChange={(url) => {
                            form.setValue('imagemUrl' as any, url as any, { shouldDirty: true });
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Formatos suportados: JPG, PNG, WEBP. Tamanho máximo: 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              {/* Tab Detalhes */}
              <TabsContent value="detalhes" className="space-y-3 mt-4">
                <div className="grid grid-cols-1 gap-3">
                  <FormField
                    control={form.control}
                    name="idadeRecomendada"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Faixa Etária *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a faixa etária" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {faixasEtarias.map((faixa) => (
                              <SelectItem key={faixa.value} value={faixa.value}>
                                {faixa.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Informações Adicionais</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Campos opcionais
                      </p>
                    </div>
                    
                    <Input placeholder="Marca (opcional)" className="h-8" />
                    <Input placeholder="Material (opcional)" className="h-8" />
                    <Input placeholder="Dimensões (opcional)" className="h-8" />
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab Descrição */}
              <TabsContent value="descricao" className="space-y-3 mt-4">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Produto *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva o produto..." 
                          className="resize-none h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Mínimo de 10 caracteres.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-between items-center pt-3 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <div className="flex gap-2">
                {activeTab !== 'basico' && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => {
                      const tabs = ['basico', 'imagem', 'detalhes', 'descricao'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                  >
                    Anterior
                  </Button>
                )}
                {activeTab !== 'descricao' ? (
                  <Button 
                    type="button" 
                    onClick={() => {
                      const tabs = ['basico', 'imagem', 'detalhes', 'descricao'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button type="submit">Salvar Produto</Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AdicionarProdutoDialog;