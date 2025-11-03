import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  Phone, 
  Mail, 
  Clock, 
  MapPin,
  MessageCircle,
  HelpCircle,
  Settings,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  icon: string;
  color: string;
  order: number;
}

interface ContactInfo {
  whatsapp: string;
  phone: string;
  email: string;
  workingHours: string;
}

interface StoreLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  openingHours: string;
}

const SuporteAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    whatsapp: '5551999999999',
    phone: '(51) 99999-9999',
    email: 'suporte@muhlstore.com.br',
    workingHours: 'Seg-Sex: 9h-18h | Sáb: 9h-13h'
  });
  const [storeLocation, setStoreLocation] = useState<StoreLocation>({
    address: 'Av. Principal, 1234',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90000-000',
    openingHours: 'Segunda a Sexta: 9h às 18h\nSábado: 9h às 13h\nDomingo: Fechado'
  });
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [newFAQ, setNewFAQ] = useState<Partial<FAQ>>({
    category: '',
    question: '',
    answer: '',
    icon: 'Package',
    color: 'text-blue-600',
    order: 0
  });

  const iconOptions = [
    { value: 'Package', label: '📦 Pedidos' },
    { value: 'CreditCard', label: '💳 Pagamento' },
    { value: 'Truck', label: '🚚 Entrega' },
    { value: 'RefreshCw', label: '🔄 Trocas' },
    { value: 'Shield', label: '🛡️ Segurança' },
    { value: 'HelpCircle', label: '❓ Conta' },
    { value: 'CheckCircle', label: '✅ Produtos' },
    { value: 'Gift', label: '🎁 Frete' }
  ];

  const colorOptions = [
    { value: 'text-blue-600', label: 'Azul' },
    { value: 'text-green-600', label: 'Verde' },
    { value: 'text-orange-600', label: 'Laranja' },
    { value: 'text-purple-600', label: 'Roxo' },
    { value: 'text-red-600', label: 'Vermelho' },
    { value: 'text-indigo-600', label: 'Índigo' },
    { value: 'text-emerald-600', label: 'Esmeralda' },
    { value: 'text-cyan-600', label: 'Ciano' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar FAQs
      const faqResponse = await fetch('/api/admin/suporte/faqs', {
        credentials: 'include'
      });
      if (faqResponse.ok) {
        const data = await faqResponse.json();
        setFaqs(data.faqs || []);
      }

      // Carregar informações de contato
      const contactResponse = await fetch('/api/admin/suporte/contact', {
        credentials: 'include'
      });
      if (contactResponse.ok) {
        const data = await contactResponse.json();
        if (data.contact) setContactInfo(data.contact);
      }

      // Carregar localização
      const locationResponse = await fetch('/api/admin/suporte/location', {
        credentials: 'include'
      });
      if (locationResponse.ok) {
        const data = await locationResponse.json();
        if (data.location) setStoreLocation(data.location);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/suporte/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ faqs })
      });

      if (response.ok) {
        toast.success('FAQs salvos com sucesso!');
      } else {
        toast.error('Erro ao salvar FAQs');
      }
    } catch (error) {
      toast.error('Erro ao salvar FAQs');
    } finally {
      setLoading(false);
    }
  };

  const saveContactInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/suporte/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactInfo)
      });

      if (response.ok) {
        toast.success('Informações de contato salvas!');
      } else {
        toast.error('Erro ao salvar contato');
      }
    } catch (error) {
      toast.error('Erro ao salvar contato');
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/suporte/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(storeLocation)
      });

      if (response.ok) {
        toast.success('Localização salva!');
      } else {
        toast.error('Erro ao salvar localização');
      }
    } catch (error) {
      toast.error('Erro ao salvar localização');
    } finally {
      setLoading(false);
    }
  };

  const addFAQ = () => {
    if (!newFAQ.question || !newFAQ.answer || !newFAQ.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const faq: FAQ = {
      id: Date.now(),
      category: newFAQ.category!,
      question: newFAQ.question!,
      answer: newFAQ.answer!,
      icon: newFAQ.icon || 'Package',
      color: newFAQ.color || 'text-blue-600',
      order: faqs.length
    };

    setFaqs([...faqs, faq]);
    setNewFAQ({
      category: '',
      question: '',
      answer: '',
      icon: 'Package',
      color: 'text-blue-600',
      order: 0
    });
    toast.success('FAQ adicionado! Não esqueça de salvar.');
  };

  const updateFAQ = (id: number, updates: Partial<FAQ>) => {
    setFaqs(faqs.map(faq => faq.id === id ? { ...faq, ...updates } : faq));
  };

  const deleteFAQ = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este FAQ?')) {
      setFaqs(faqs.filter(faq => faq.id !== id));
      toast.success('FAQ removido! Não esqueça de salvar.');
    }
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const newFaqs = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= faqs.length) return;
    
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
    
    newFaqs.forEach((faq, idx) => {
      faq.order = idx;
    });
    
    setFaqs(newFaqs);
    toast.info('Ordem alterada! Não esqueça de salvar.');
  };

  if (loading && faqs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          Configurar Página de Suporte
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie FAQs, informações de contato e dados da loja
        </p>
      </div>

      <Tabs defaultValue="faqs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faqs">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Phone className="w-4 h-4 mr-2" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="location">
            <MapPin className="w-4 h-4 mr-2" />
            Localização
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          {/* Add New FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Adicionar Nova FAQ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Input
                    value={newFAQ.category}
                    onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })}
                    placeholder="ex: Pedidos, Pagamento..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <select
                    value={newFAQ.icon}
                    onChange={(e) => setNewFAQ({ ...newFAQ, icon: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pergunta *</Label>
                  <Input
                    value={newFAQ.question}
                    onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    placeholder="Como acompanhar meu pedido?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <select
                    value={newFAQ.color}
                    onChange={(e) => setNewFAQ({ ...newFAQ, color: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Resposta *</Label>
                <Textarea
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                  placeholder="Você pode acompanhar seu pedido na área..."
                  rows={4}
                />
              </div>

              <Button onClick={addFAQ} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar FAQ
              </Button>
            </CardContent>
          </Card>

          {/* FAQ List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>FAQs Cadastrados ({faqs.length})</CardTitle>
                <CardDescription>Gerencie as perguntas frequentes</CardDescription>
              </div>
              <Button onClick={saveFAQs} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Todos
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma FAQ cadastrada ainda</p>
                </div>
              ) : (
                faqs.map((faq, index) => (
                  <motion.div
                    key={faq.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{faq.category}</Badge>
                          <Badge className={faq.color}>{faq.icon}</Badge>
                        </div>
                        <p className="font-semibold">{faq.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveFAQ(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveFAQ(index, 'down')}
                          disabled={index === faqs.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFAQ(faq.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Informações de Contato
              </CardTitle>
              <CardDescription>
                Configure os canais de atendimento ao cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    WhatsApp (com código do país)
                  </Label>
                  <Input
                    id="whatsapp"
                    value={contactInfo.whatsapp}
                    onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                    placeholder="5551999999999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: 55 + DDD + Número (sem espaços)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone (formatado)
                  </Label>
                  <Input
                    id="phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="(51) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder="suporte@suaempresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingHours">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Horário de Atendimento
                  </Label>
                  <Input
                    id="workingHours"
                    value={contactInfo.workingHours}
                    onChange={(e) => setContactInfo({ ...contactInfo, workingHours: e.target.value })}
                    placeholder="Seg-Sex: 9h-18h | Sáb: 9h-13h"
                  />
                </div>
              </div>

              <Separator />

              <Button onClick={saveContactInfo} className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Informações de Contato
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Localização da Loja
              </CardTitle>
              <CardDescription>
                Configure o endereço e horário de funcionamento da loja física
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={storeLocation.address}
                  onChange={(e) => setStoreLocation({ ...storeLocation, address: e.target.value })}
                  placeholder="Av. Principal, 1234"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={storeLocation.city}
                    onChange={(e) => setStoreLocation({ ...storeLocation, city: e.target.value })}
                    placeholder="Porto Alegre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={storeLocation.state}
                    onChange={(e) => setStoreLocation({ ...storeLocation, state: e.target.value })}
                    placeholder="RS"
                    maxLength={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={storeLocation.zipCode}
                    onChange={(e) => setStoreLocation({ ...storeLocation, zipCode: e.target.value })}
                    placeholder="90000-000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingHours">Horário de Funcionamento</Label>
                <Textarea
                  id="openingHours"
                  value={storeLocation.openingHours}
                  onChange={(e) => setStoreLocation({ ...storeLocation, openingHours: e.target.value })}
                  placeholder="Segunda a Sexta: 9h às 18h&#10;Sábado: 9h às 13h&#10;Domingo: Fechado"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use quebras de linha para separar os dias
                </p>
              </div>

              <Separator />

              <Button onClick={saveLocation} className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Localização
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Pré-visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Endereço Completo:</p>
                <p className="text-gray-700">
                  {storeLocation.address}<br />
                  {storeLocation.city} - {storeLocation.state}<br />
                  CEP: {storeLocation.zipCode}
                </p>
                <Separator className="my-3" />
                <p className="font-semibold">Horário de Funcionamento:</p>
                <pre className="text-gray-700 whitespace-pre-wrap font-sans">
                  {storeLocation.openingHours}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuporteAdmin;

