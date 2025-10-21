import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Edit, Trash2, Home, Building, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface Endereco {
  id: string;
  tipo: 'residencial' | 'comercial' | 'outro';
  nome: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
}

const enderecoSchema = z.object({
  tipo: z.enum(['residencial', 'comercial', 'outro']),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cep: z.string().min(8, 'CEP deve ter 8 dígitos'),
  endereco: z.string().min(5, 'Endereço deve ter no mínimo 5 caracteres'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro deve ter no mínimo 2 caracteres'),
  cidade: z.string().min(2, 'Cidade deve ter no mínimo 2 caracteres'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  principal: z.boolean(),
});

const EnderecosTab = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEndereco, setEditingEndereco] = useState<Endereco | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadEnderecos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/customers/addresses`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar endereços');
      const data = await res.json();
      const mapped: Endereco[] = (Array.isArray(data) ? data : []).map((row: any) => ({
        id: row.id,
        tipo: row.tipo || 'residencial',
        nome: row.nome || '',
        cep: row.cep || '',
        endereco: row.rua || '',
        numero: row.numero || '',
        complemento: row.complemento || '',
        bairro: row.bairro || '',
        cidade: row.cidade || '',
        estado: row.estado || '',
        principal: Boolean(row.padrao),
      }));
      setEnderecos(mapped);
    } catch (e) {
      toast.error('Erro ao carregar endereços');
      setEnderecos([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadEnderecos();
  }, []);

  const form = useForm<z.infer<typeof enderecoSchema>>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      tipo: 'residencial',
      nome: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      principal: false,
    },
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'residencial':
        return <Home className="h-4 w-4" />;
      case 'comercial':
        return <Building className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'residencial':
        return 'Residencial';
      case 'comercial':
        return 'Comercial';
      default:
        return 'Outro';
    }
  };

  const handleSubmit = async (values: z.infer<typeof enderecoSchema>) => {
    setIsSaving(true);
    try {
      console.log('📝 Salvando endereço:', values);
      
      const body = {
        nome: values.nome,
        rua: values.endereco,
        numero: values.numero,
        complemento: values.complemento || null,
        bairro: values.bairro,
        cidade: values.cidade,
        estado: values.estado,
        cep: values.cep.replace(/\D/g, ''), // Remove formatação
        tipo: values.tipo,
        is_default: values.principal ? 1 : 0,
      };

      console.log('📤 Enviando dados:', body);

      if (editingEndereco) {
        const res = await fetch(`${API_BASE_URL}/customers/addresses/${editingEndereco.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('❌ Erro ao atualizar:', errorData);
          throw new Error(errorData.error || errorData.message || 'Falha ao atualizar endereço');
        }
        
        toast.success('Endereço atualizado com sucesso!');
      } else {
        const res = await fetch(`${API_BASE_URL}/customers/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('❌ Erro ao adicionar:', errorData);
          throw new Error(errorData.error || errorData.message || 'Falha ao adicionar endereço');
        }
        
        const result = await res.json();
        console.log('✅ Endereço adicionado:', result);
        toast.success('Endereço adicionado com sucesso!');
      }

      await loadEnderecos();
      setIsDialogOpen(false);
      setEditingEndereco(null);
      form.reset();
    } catch (error: any) {
      console.error('❌ Erro ao salvar endereço:', error);
      toast.error(error?.message || 'Erro ao salvar endereço');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (endereco: Endereco) => {
    setEditingEndereco(endereco);
    form.reset({
      tipo: endereco.tipo,
      nome: endereco.nome,
      cep: endereco.cep,
      endereco: endereco.endereco,
      numero: endereco.numero,
      complemento: endereco.complemento || '',
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
      principal: endereco.principal,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/addresses/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao excluir endereço');
      toast.success('Endereço excluído com sucesso!');
      await loadEnderecos();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir endereço');
    }
  };

  const handleNewAddress = () => {
    setEditingEndereco(null);
    form.reset({
      tipo: 'residencial',
      nome: '',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      principal: false,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meus Endereços</h2>
          <p className="text-muted-foreground">Gerencie seus endereços de entrega</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewAddress}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingEndereco ? 'Editar Endereço' : 'Adicionar Endereço'}
              </DialogTitle>
              <DialogDescription>
                {editingEndereco 
                  ? 'Atualize as informações do endereço.'
                  : 'Adicione um novo endereço de entrega.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Endereço</Label>
                  <Select
                    value={form.watch('tipo')}
                    onValueChange={(value) => form.setValue('tipo', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tipo && (
                    <p className="text-sm text-destructive">{form.formState.errors.tipo.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="nome">Nome do Endereço</Label>
                  <Input
                    id="nome"
                    {...form.register('nome')}
                    placeholder="Ex: Casa, Trabalho, etc."
                  />
                  {form.formState.errors.nome && (
                    <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    {...form.register('cep')}
                    placeholder="00000-000"
                  />
                  {form.formState.errors.cep && (
                    <p className="text-sm text-destructive">{form.formState.errors.cep.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={form.watch('estado')}
                    onValueChange={(value) => form.setValue('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.estado && (
                    <p className="text-sm text-destructive">{form.formState.errors.estado.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    {...form.register('cidade')}
                    placeholder="Nome da cidade"
                  />
                  {form.formState.errors.cidade && (
                    <p className="text-sm text-destructive">{form.formState.errors.cidade.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  {...form.register('endereco')}
                  placeholder="Rua, avenida, etc."
                />
                {form.formState.errors.endereco && (
                  <p className="text-sm text-destructive">{form.formState.errors.endereco.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    {...form.register('numero')}
                    placeholder="123"
                  />
                  {form.formState.errors.numero && (
                    <p className="text-sm text-destructive">{form.formState.errors.numero.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    {...form.register('bairro')}
                    placeholder="Nome do bairro"
                  />
                  {form.formState.errors.bairro && (
                    <p className="text-sm text-destructive">{form.formState.errors.bairro.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="complemento">Complemento (Opcional)</Label>
                <Input
                  id="complemento"
                  {...form.register('complemento')}
                  placeholder="Apto, bloco, etc."
                />
                {form.formState.errors.complemento && (
                  <p className="text-sm text-destructive">{form.formState.errors.complemento.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="principal"
                  checked={form.watch('principal')}
                  onCheckedChange={(checked) => form.setValue('principal', checked)}
                />
                <Label htmlFor="principal">Endereço Principal</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingEndereco ? 'Atualizar' : 'Adicionar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {(isLoading ? [] : enderecos).map((endereco) => (
          <Card key={endereco.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getTipoIcon(endereco.tipo)}
                  <CardTitle className="text-lg">{endereco.nome}</CardTitle>
                  {endereco.principal && (
                    <Badge variant="default">Principal</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(endereco)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(endereco.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm">
                  <Badge variant="secondary" className="mr-2">
                    {getTipoLabel(endereco.tipo)}
                  </Badge>
                  {endereco.endereco}, {endereco.numero}
                  {endereco.complemento && `, ${endereco.complemento}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {endereco.bairro}, {endereco.cidade} - {endereco.estado}
                </p>
                <p className="text-sm text-muted-foreground">
                  CEP: {endereco.cep}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isLoading && enderecos.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Adicione um endereço para facilitar suas compras
            </p>
            <Button onClick={handleNewAddress}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Endereço
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnderecosTab;