import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Home, 
  Building, 
  Map,
  CheckCircle,
  AlertCircle,
  Truck,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  tipo: 'casa' | 'trabalho' | 'outro';
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const EnhancedAddressManager: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    tipo: 'casa' as 'casa' | 'trabalho' | 'outro',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    is_default: false
  });

  // Dados mockados removidos - carregar apenas endereços reais

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      // Carregar endereços reais da API
      const response = await fetch('/api/addresses', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Mapear dados da API para o formato do componente
        const mapped = (Array.isArray(data) ? data : []).map((addr: any) => ({
          id: addr.id,
          label: addr.nome || 'Endereço',
          tipo: addr.tipo || 'casa',
          cep: addr.cep || '',
          endereco: addr.endereco || addr.rua || '',
          numero: addr.numero || '',
          complemento: addr.complemento || '',
          bairro: addr.bairro || '',
          cidade: addr.cidade || '',
          estado: addr.estado || '',
          is_default: Boolean(addr.principal || addr.padrao),
          created_at: addr.created_at,
          updated_at: addr.updated_at
        }));
        setAddresses(mapped);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const body = {
        nome: formData.label,
        tipo: formData.tipo,
        cep: formData.cep.replace(/\D/g, ''),
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento || '',
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        shipping_default: formData.is_default ? 1 : 0
      };

      if (editingAddress) {
        // Atualizar endereço existente
        const response = await fetch(`/api/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao atualizar endereço');
        }
        
        toast.success('Endereço atualizado com sucesso!');
      } else {
        // Adicionar novo endereço
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erro ao adicionar endereço');
        }
        
        const result = await response.json();
        console.log('✅ Endereço salvo:', result);
        toast.success('Endereço adicionado com sucesso!');
      }
      
      // Recarregar endereços da API
      await loadAddresses();
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
    } catch (error: any) {
      console.error('❌ Erro ao salvar endereço:', error);
      toast.error(error.message || 'Erro ao salvar endereço');
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      tipo: address.tipo,
      cep: address.cep,
      endereco: address.endereco,
      numero: address.numero,
      complemento: address.complemento || '',
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      is_default: address.is_default
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
      try {
        const response = await fetch(`/api/addresses/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao excluir endereço');
        }
        
        await loadAddresses();
        toast.success('Endereço excluído com sucesso!');
      } catch (error: any) {
        console.error('❌ Erro ao excluir:', error);
        toast.error(error.message || 'Erro ao excluir endereço');
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      is_default: addr.id === id
    })));
    toast.success('Endereço padrão alterado!');
  };

  const resetForm = () => {
    setFormData({
      label: '',
      tipo: 'casa',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: 'SP',
      is_default: false
    });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'casa': return <Home className="h-4 w-4" />;
      case 'trabalho': return <Building className="h-4 w-4" />;
      default: return <Map className="h-4 w-4" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'casa': return 'Casa';
      case 'trabalho': return 'Trabalho';
      default: return 'Outro';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <MapPin className="h-6 w-6" />
            <span>Meus Endereços</span>
          </h2>
          <p className="text-muted-foreground">
            Gerencie seus endereços de entrega
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAddress(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
              </DialogTitle>
              <DialogDescription>
                {editingAddress ? 'Atualize as informações do endereço' : 'Adicione um novo endereço de entrega'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Nome do Endereço</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Ex: Casa, Trabalho, etc."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value: 'casa' | 'trabalho' | 'outro') => 
                      setFormData(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casa">Casa</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select 
                    value={formData.estado} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="Nome da cidade"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    placeholder="123"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    placeholder="Nome do bairro"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento (opcional)</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label htmlFor="is_default">Usar como endereço padrão</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAddress ? 'Atualizar' : 'Adicionar'} Endereço
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de endereços */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione um endereço para facilitar suas compras
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Endereço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={`${address.is_default ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTipoIcon(address.tipo)}
                    <CardTitle className="text-lg">{address.label}</CardTitle>
                    {address.is_default && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="font-medium">
                    {address.endereco}, {address.numero}
                    {address.complemento && ` - ${address.complemento}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.bairro}, {address.cidade} - {address.estado}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CEP: {address.cep}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getTipoLabel(address.tipo)}
                    </Badge>
                  </div>
                  
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Tornar Padrão
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informações adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900">Informações de Entrega</h4>
              <p className="text-sm text-blue-700">
                • Frete grátis para pedidos acima de R$ 99,00<br/>
                • Entrega em até 3 dias úteis para endereços padrão<br/>
                • Rastreamento disponível para todos os pedidos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAddressManager;
