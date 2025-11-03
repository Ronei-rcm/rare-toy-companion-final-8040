import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  MapPin, Plus, Edit, Trash2, Home, Briefcase, Star, 
  Navigation, Map, Search, AlertCircle, CheckCircle, 
  Clock, Truck, Zap, Target, Globe, Smartphone 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AddressManagerProps {
  userId: string;
}

const AddressManager: React.FC<AddressManagerProps> = ({ userId }) => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: 'Casa',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    is_default: false,
  });
  
  const [cepValidation, setCepValidation] = useState({
    isValid: false,
    isLoading: false,
    error: '',
    suggestions: [] as any[],
  });
  
  const [addressSuggestions, setAddressSuggestions] = useState([] as any[]);
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const [deliveryEstimate, setDeliveryEstimate] = useState<any>(null);
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/addresses`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    try {
      const url = editingAddress
        ? `${API_BASE_URL}/customers/${userId}/addresses/${editingAddress.id}`
        : `${API_BASE_URL}/customers/${userId}/addresses`;

      const method = editingAddress ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: editingAddress ? 'Endereço atualizado!' : 'Endereço adicionado!',
          description: 'Suas informações foram salvas com sucesso',
        });
        setIsDialogOpen(false);
        setEditingAddress(null);
        resetForm();
        loadAddresses();
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/${userId}/addresses/${addressId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setAddresses(addresses.filter((a) => a.id !== addressId));
        toast({
          title: 'Endereço excluído',
          description: 'O endereço foi removido com sucesso',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o endereço',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/${userId}/addresses/${addressId}/set-default`,
        {
          method: 'PATCH',
          credentials: 'include',
        }
      );

      if (response.ok) {
        loadAddresses();
        toast({
          title: 'Endereço padrão atualizado',
          description: 'Este endereço será usado como padrão nos pedidos',
        });
      }
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      cep: address.cep,
      endereco: address.endereco,
      numero: address.numero,
      complemento: address.complemento || '',
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      is_default: address.is_default,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      label: 'Casa',
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      is_default: false,
    });
  };

  const validateCep = (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  };

  const handleCepChange = (value: string) => {
    // Formatar CEP automaticamente
    const cleanCep = value.replace(/\D/g, '');
    const formattedCep = cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
    
    setFormData({ ...formData, cep: formattedCep });
    
    if (cleanCep.length === 8) {
      handleCepBlur(cleanCep);
    } else {
      setCepValidation({ isValid: false, isLoading: false, error: '', suggestions: [] });
    }
  };

  const handleCepBlur = async (cep?: string) => {
    const cepToValidate = cep || formData.cep.replace(/\D/g, '');
    
    if (!validateCep(cepToValidate)) {
      setCepValidation({ 
        isValid: false, 
        isLoading: false, 
        error: 'CEP inválido', 
        suggestions: [] 
      });
      return;
    }

    setCepValidation({ ...cepValidation, isLoading: true, error: '' });

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepToValidate}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepValidation({ 
          isValid: false, 
          isLoading: false, 
          error: 'CEP não encontrado', 
          suggestions: [] 
        });
      } else {
        setFormData({
          ...formData,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        });
        
        setCepValidation({ 
          isValid: true, 
          isLoading: false, 
          error: '', 
          suggestions: [] 
        });

        // Buscar estimativa de entrega
        await fetchDeliveryEstimate(data.localidade, data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepValidation({ 
        isValid: false, 
        isLoading: false, 
        error: 'Erro ao validar CEP', 
        suggestions: [] 
      });
    }
  };

  const fetchDeliveryEstimate = async (cidade: string, estado: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cidade, estado }),
      });

      if (response.ok) {
        const data = await response.json();
        setDeliveryEstimate(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estimativa de entrega:', error);
    }
  };

  const getAddressSuggestions = async (query: string) => {
    if (query.length < 3) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/address-suggestions?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddressSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  };

  const handleAddressSelect = (suggestion: any) => {
    setFormData({
      ...formData,
      endereco: suggestion.endereco,
      bairro: suggestion.bairro,
      cidade: suggestion.cidade,
      estado: suggestion.estado,
      cep: suggestion.cep,
    });
    setAddressSuggestions([]);
  };

  const getAddressIcon = (label: string) => {
    if (label.toLowerCase().includes('casa')) return <Home className="w-4 h-4" />;
    if (label.toLowerCase().includes('trabalho')) return <Briefcase className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meus Endereços</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingAddress(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Label */}
              <div className="space-y-2">
                <Label>Identificação</Label>
                <div className="flex gap-2">
                  {['Casa', 'Trabalho', 'Outro'].map((label) => (
                    <Button
                      key={label}
                      variant={formData.label === label ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, label })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    className={cepValidation.error ? 'border-red-500' : cepValidation.isValid ? 'border-green-500' : ''}
                  />
                  {cepValidation.isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {cepValidation.isValid && !cepValidation.isLoading && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                  {cepValidation.error && !cepValidation.isLoading && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                  )}
                </div>
                {cepValidation.error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {cepValidation.error}
                  </p>
                )}
                {cepValidation.isValid && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    CEP válido! Endereço preenchido automaticamente.
                  </p>
                )}
              </div>

              {/* Endereço */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <div className="relative">
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => {
                        setFormData({ ...formData, endereco: e.target.value });
                        getAddressSuggestions(e.target.value);
                      }}
                      placeholder="Rua, Avenida..."
                    />
                    {addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => handleAddressSelect(suggestion)}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">{suggestion.endereco}</p>
                                <p className="text-sm text-gray-500">{suggestion.bairro}, {suggestion.cidade} - {suggestion.estado}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="123"
                  />
                </div>
              </div>

              {/* Complemento e Bairro */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento (opcional)</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Apto, Bloco..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
              </div>

              {/* Cidade e Estado */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    maxLength={2}
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Estimativa de Entrega */}
              {deliveryEstimate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Estimativa de Entrega</h4>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>Prazo: {deliveryEstimate.days} dias úteis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      <span>Frete: R$ {deliveryEstimate.freight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>Região: {deliveryEstimate.region}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mapa */}
              {formData.cidade && formData.estado && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Localização no Mapa</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMap(!showMap)}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      {showMap ? 'Ocultar Mapa' : 'Ver Mapa'}
                    </Button>
                  </div>
                  {showMap && (
                    <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <div className="text-center text-gray-500">
                        <Globe className="w-8 h-8 mx-auto mb-2" />
                        <p>Mapa interativo</p>
                        <p className="text-sm">{formData.cidade}, {formData.estado}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Endereço padrão */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Usar como endereço padrão
                </Label>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveAddress} className="flex-1">
                  Salvar Endereço
                </Button>
                <Button
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingAddress(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Endereços */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione um endereço para facilitar suas compras
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address, index) => (
            <motion.div
              key={address.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={address.is_default ? 'border-2 border-primary' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getAddressIcon(address.label)}
                      <h3 className="font-semibold">{address.label}</h3>
                      {address.is_default && (
                        <Badge variant="default" className="gap-1">
                          <Star className="w-3 h-3 fill-white" />
                          Padrão
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{address.endereco}, {address.numero}</p>
                    {address.complemento && <p>{address.complemento}</p>}
                    <p>{address.bairro}</p>
                    <p>{address.cidade} - {address.estado}</p>
                    <p>CEP: {address.cep}</p>
                  </div>

                  {/* Informações Inteligentes */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Navigation className="w-3 h-3" />
                      <span>Distância: 2.3 km do centro</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <Truck className="w-3 h-3" />
                      <span>Entrega: 1-2 dias úteis</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-purple-600">
                      <Zap className="w-3 h-3" />
                      <span>Frete: R$ 8,90</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Definir Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.endereco}, ${address.numero}, ${address.cidade}, ${address.estado}`)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Navegar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const addressText = `${address.endereco}, ${address.numero}, ${address.bairro}, ${address.cidade} - ${address.estado}, CEP: ${address.cep}`;
                        navigator.clipboard.writeText(addressText);
                        toast({
                          title: 'Endereço copiado!',
                          description: 'Endereço copiado para a área de transferência',
                        });
                      }}
                    >
                      <Smartphone className="w-3 h-3 mr-1" />
                      Copiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressManager;
