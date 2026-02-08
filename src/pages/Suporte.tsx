import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Headphones,
  HelpCircle,
  Package,
  CreditCard,
  Truck,
  RefreshCw,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  Info,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';
import { request } from '@/services/api-config';

interface SupportConfig {
  faqs: any[];
  contactInfo: {
    whatsapp: string;
    phone: string;
    email: string;
    workingHours: string;
  };
  storeLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    openingHours: string;
  };
}

const Suporte = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar configurações do admin
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await request<SupportConfig>('/suporte/config');
        if (data) {
          setConfig(data);
        }
      } catch (error) {
        console.error('Erro ao carregar config de suporte:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const faqs = [
    {
      id: 1,
      category: 'Pedidos',
      question: 'Como acompanhar meu pedido?',
      answer: 'Você pode acompanhar seu pedido na área "Minha Conta > Meus Pedidos". Lá você encontrará o status atualizado e código de rastreamento quando disponível.',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      id: 2,
      category: 'Pagamento',
      question: 'Quais formas de pagamento são aceitas?',
      answer: 'Aceitamos cartão de crédito, débito, PIX, boleto bancário e parceria com principais bancos. O pagamento é processado de forma segura através de nossos parceiros.',
      icon: CreditCard,
      color: 'text-green-600'
    },
    {
      id: 3,
      category: 'Entrega',
      question: 'Qual o prazo de entrega?',
      answer: 'O prazo varia de acordo com sua região. Em média: Capitais: 3-5 dias úteis, Interior: 5-10 dias úteis. Você pode consultar o prazo específico durante o checkout.',
      icon: Truck,
      color: 'text-orange-600'
    },
    {
      id: 4,
      category: 'Trocas',
      question: 'Como funciona a política de troca?',
      answer: 'Você tem até 7 dias para solicitar troca ou devolução. O produto deve estar em perfeito estado, com embalagem original. Entre em contato pelo nosso WhatsApp para iniciar o processo.',
      icon: RefreshCw,
      color: 'text-purple-600'
    },
    {
      id: 5,
      category: 'Segurança',
      question: 'Meus dados estão seguros?',
      answer: 'Sim! Utilizamos criptografia SSL e seguimos as normas da LGPD. Seus dados são protegidos e nunca compartilhados com terceiros sem sua autorização.',
      icon: Shield,
      color: 'text-red-600'
    },
    {
      id: 6,
      category: 'Conta',
      question: 'Como recuperar minha senha?',
      answer: 'Clique em "Esqueci minha senha" na tela de login. Você receberá um link por e-mail para redefinir sua senha com segurança.',
      icon: HelpCircle,
      color: 'text-indigo-600'
    },
    {
      id: 7,
      category: 'Produtos',
      question: 'Os produtos são originais?',
      answer: 'Sim! Todos os nossos produtos são 100% originais e licenciados. Trabalhamos apenas com fornecedores oficiais e confiáveis.',
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      id: 8,
      category: 'Frete',
      question: 'Tem frete grátis?',
      answer: 'Sim! Oferecemos frete grátis para compras acima de R$ 150,00 para todo o Brasil. Também temos promoções especiais em datas comemorativas.',
      icon: Truck,
      color: 'text-cyan-600'
    }
  ];

  // Dados dinâmicos do admin ou fallback para padrões
  const contactInfo = config?.contactInfo || {
    whatsapp: '5551999999999',
    phone: '(51) 99999-9999',
    email: 'suporte@muhlstore.com.br',
    workingHours: 'Seg-Sex: 9h-18h | Sáb: 9h-13h'
  };

  const storeLocation = config?.storeLocation || {
    address: 'Av. Principal, 1234',
    city: 'Porto Alegre',
    state: 'RS',
    zipCode: '90000-000',
    openingHours: 'Segunda a Sexta: 9h às 18h\nSábado: 9h às 13h\nDomingo: Fechado'
  };

  const dynamicFaqs = config?.faqs && config.faqs.length > 0 ? config.faqs : faqs;

  const contactChannels = [
    {
      title: 'WhatsApp',
      description: 'Resposta rápida em horário comercial',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => window.open(`https://wa.me/${contactInfo.whatsapp}?text=Olá! Preciso de ajuda com`, '_blank')
    },
    {
      title: 'Telefone',
      description: contactInfo.phone,
      icon: Phone,
      color: 'bg-blue-500',
      action: () => window.open(`tel:+${contactInfo.whatsapp}`)
    },
    {
      title: 'E-mail',
      description: contactInfo.email,
      icon: Mail,
      color: 'bg-purple-500',
      action: () => window.open(`mailto:${contactInfo.email}`)
    },
    {
      title: 'Horário',
      description: contactInfo.workingHours,
      icon: Clock,
      color: 'bg-orange-500',
      action: null
    }
  ];

  const quickHelp = [
    { title: 'Rastrear Pedido', icon: Package, link: '/minha-conta?tab=pedidos' },
    { title: 'Política de Trocas', icon: RefreshCw, link: '/sobre' },
    { title: 'Formas de Pagamento', icon: CreditCard, link: '/sobre' },
    { title: 'Prazos de Entrega', icon: Truck, link: '/sobre' }
  ];

  const filteredFAQs = dynamicFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envio
    setTimeout(() => {
      toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
      setFormData({ nome: '', email: '', assunto: '', mensagem: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout>
      <SEO
        title="Suporte ao Cliente | MuhlStore"
        description="Central de ajuda MuhlStore. Tire suas dúvidas, entre em contato e encontre soluções rápidas para suas necessidades."
      />

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-slate-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-fuchsia-500 to-indigo-600 py-20">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-lg mb-6">
                <Headphones className="w-10 h-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Central de Suporte
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
                Estamos aqui para ajudar! Encontre respostas rápidas ou entre em contato conosco.
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar ajuda... (ex: rastreamento, pagamento, troca)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur-sm border-0 shadow-xl"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-10 relative z-20 pb-12">
          {/* Quick Help Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickHelp.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 bg-white/90 backdrop-blur-sm border border-orange-100/70"
                  onClick={() => window.location.href = item.link}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center shadow-md text-white">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* FAQ Section */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-orange-600" />
                    Perguntas Frequentes
                  </CardTitle>
                  <CardDescription>
                    {filteredFAQs.length} {filteredFAQs.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredFAQs.map((faq) => {
                      const Icon = faq.icon;
                      return (
                        <motion.div
                          key={faq.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="border rounded-lg overflow-hidden">
                            <button
                              onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                              className="w-full p-4 text-left hover:bg-orange-50/60 transition-colors flex items-start gap-3"
                            >
                              <Icon className={`w-5 h-5 mt-0.5 ${faq.color} flex-shrink-0`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50/60">
                                    {faq.category}
                                  </Badge>
                                </div>
                                <p className="font-semibold text-gray-900">{faq.question}</p>
                              </div>
                              {openFAQ === faq.id ? (
                                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              )}
                            </button>

                            <AnimatePresence>
                              {openFAQ === faq.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="px-4 pb-4 pt-2 pl-12 text-gray-600 bg-gray-50">
                                    {faq.answer}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredFAQs.length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum resultado encontrado para "{searchQuery}"</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setSearchQuery('')}
                        >
                          Limpar busca
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-6 h-6 text-purple-600" />
                    Envie sua Mensagem
                  </CardTitle>
                  <CardDescription>
                    Não encontrou o que procurava? Entre em contato conosco!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assunto">Assunto *</Label>
                      <Input
                        id="assunto"
                        value={formData.assunto}
                        onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                        required
                        placeholder="Sobre o que você precisa de ajuda?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mensagem">Mensagem *</Label>
                      <Textarea
                        id="mensagem"
                        value={formData.mensagem}
                        onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                        required
                        placeholder="Descreva sua dúvida ou problema em detalhes..."
                        rows={6}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-gray-500 text-center">
                      Tempo médio de resposta: 24 horas úteis
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Channels */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Fale Conosco</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contactChannels.map((channel, index) => (
                    <motion.div
                      key={channel.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-4"
                        onClick={channel.action || undefined}
                        disabled={!channel.action}
                      >
                        <div className={`${channel.color} p-2 rounded-lg`}>
                          <channel.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{channel.title}</p>
                          <p className="text-xs text-gray-600">{channel.description}</p>
                        </div>
                        {channel.action && (
                          <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className="shadow-xl border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Sistema Operacional</p>
                      <p className="text-sm text-green-700 mt-1">
                        Todos os serviços funcionando normalmente
                      </p>
                      <p className="text-xs text-green-600 mt-2">
                        Última atualização: {new Date().toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Visit Us */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-600" />
                    Visite Nossa Loja
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">Endereço</p>
                      <p className="text-sm text-gray-600">
                        {storeLocation.address}<br />
                        {storeLocation.city} - {storeLocation.state}<br />
                        CEP: {storeLocation.zipCode}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium text-gray-900">Horário de Atendimento</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {storeLocation.openingHours}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Banner */}
              <Card className="shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
                <CardContent className="pt-6">
                  <Info className="w-8 h-8 mb-3" />
                  <p className="font-semibold mb-2">Dica Rápida</p>
                  <p className="text-sm text-white/90">
                    Para suporte mais rápido via WhatsApp, tenha em mãos o número do seu pedido!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Suporte;

