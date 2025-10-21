import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Star, MapPin, Clock, Award, Eye, Heart, Users, Sparkles, TrendingUp, Shield, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MarketplaceSeller {
  id: string;
  nome: string;
  descricao: string;
  especialidade: string;
  categoria: string;
  imagem_perfil?: string;
  imagem_capa?: string;
  avaliacao: number;
  total_vendas: number;
  total_produtos: number;
  localizacao?: string;
  tempo_resposta: string;
  destaque: boolean;
  verificado: boolean;
  tags?: string[];
  certificacoes?: string[];
}

const Mercado = () => {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [sellers, setSellers] = useState<MarketplaceSeller[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar vendedores do banco
  useEffect(() => {
    const loadSellers = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (categoria !== 'todos') params.append('categoria', categoria);
        
        const response = await fetch(`/api/marketplace/sellers?${params}`);
        if (!response.ok) throw new Error('Erro ao carregar vendedores');
        
        const data = await response.json();
        setSellers(data);
      } catch (error) {
        console.error('Erro ao carregar vendedores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSellers();
  }, [categoria]);

  const categorias = [
    { value: 'todos', label: 'Todas as especialidades' },
    { value: 'vintage', label: 'Brinquedos Vintage' },
    { value: 'trens', label: 'Trens Antigos' },
    { value: 'pelucia', label: 'Pelúcias Colecionáveis' },
    { value: 'carrinhos', label: 'Carrinhos Miniatura' },
    { value: 'bonecas', label: 'Bonecas Clássicas' },
    { value: 'jogos', label: 'Jogos Retro' }
  ];

  const colecionadoresFiltrados = sellers.filter(seller => {
    const matchBusca = seller.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      seller.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                      (seller.especialidade && seller.especialidade.toLowerCase().includes(busca.toLowerCase()));
    return matchBusca;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 via-amber-500/5 to-yellow-400/10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full gradient-brand-soft text-orange-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Marketplace Premium
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gradient-brand mb-6 leading-tight">
                Mercado de Colecionadores
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Conecte-se com especialistas em brinquedos vintage e descubra peças únicas,
                raras e colecionáveis com história e autenticidade garantida.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Badge className="gradient-brand-soft text-orange-700 border-orange-200 px-4 py-2 text-sm font-medium">
                    <Award className="w-4 h-4 mr-2" />
                    Peças Certificadas
                  </Badge>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200 px-4 py-2 text-sm font-medium">
                    <Eye className="w-4 h-4 mr-2" />
                    Avaliação Especializada
                  </Badge>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200 px-4 py-2 text-sm font-medium">
                    <Heart className="w-4 h-4 mr-2" />
                    Raridades Únicas
                  </Badge>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button 
                  size="lg"
                  className="gradient-brand text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Explorar Colecionadores
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Tornar-se Vendedor
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">4+</h3>
              <p className="text-slate-600 text-sm">Colecionadores Ativos</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">1,260+</h3>
              <p className="text-slate-600 text-sm">Vendas Realizadas</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">546+</h3>
              <p className="text-slate-600 text-sm">Itens Disponíveis</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">4.8</h3>
              <p className="text-slate-600 text-sm">Avaliação Média</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white/80 backdrop-blur-sm border border-orange-100"
        >
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar colecionadores, especialidades..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 bg-white/80 border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                />
              </div>

              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-full md:w-48 bg-white/80 border-orange-200 focus:border-orange-400">
                  <Filter className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Collectors Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
              Nossos Colecionadores
            </h2>
            <p className="text-lg text-slate-600">
              Especialistas certificados em brinquedos raros e vintage
            </p>
          </div>

          {colecionadoresFiltrados.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum colecionador encontrado</h3>
                <p className="text-slate-600">Tente ajustar os filtros de busca</p>
              </div>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {colecionadoresFiltrados.map((colecionador, index) => (
                <motion.div
                  key={colecionador.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-orange-200/50">
                    <div className="relative overflow-hidden">
                      <img 
                        src={colecionador.imagem_capa || colecionador.imagem_perfil || '/placeholder.svg'} 
                        alt={colecionador.nome}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Overlay Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {colecionador.verificado && (
                          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
                            <Shield className="w-3 h-3 mr-1" />
                            Verificado
                          </div>
                        )}
                        {colecionador.destaque && (
                          <div className="gradient-brand text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
                            <Award className="w-3 h-3 mr-1" />
                            Premium
                          </div>
                        )}
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{colecionador.avaliacao}</span>
                        </div>
                      </div>
                      
                      {/* Speciality Badge */}
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        {colecionador.especialidade}
                      </div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                        <Button 
                          size="sm"
                          className="bg-white/90 text-orange-600 hover:bg-white hover:text-orange-700 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                        >
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                          {colecionador.nome}
                        </h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-default">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span className="text-xs text-slate-500">Online</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Status de disponibilidade</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <p className="text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                        {colecionador.descricao}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div className="flex items-center text-slate-500">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center mr-3">
                            <MapPin className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="font-medium">{colecionador.localizacao}</span>
                        </div>
                        <div className="flex items-center text-slate-500">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center mr-3">
                            <Clock className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="font-medium">Responde em {colecionador.tempoResposta}</span>
                        </div>
                        <div className="flex items-center text-slate-500">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-yellow-600" />
                          </div>
                          <span className="font-medium">{colecionador.vendas} vendas</span>
                        </div>
                        <div className="flex items-center text-slate-500">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center mr-3">
                            <Eye className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium">{colecionador.produtos} itens</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-6">
                        <Badge className="bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200">
                          {categorias.find(c => c.value === colecionador.categoria)?.label}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                            <Heart className="w-3 h-3" />
                          </Button>
                          <Button size="sm" className="gradient-brand text-white">
                            Ver Coleção
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Junte-se à Comunidade
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Seja um Colecionador Certificado
              </h2>
              <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
                Junte-se à nossa comunidade de especialistas e compartilhe sua paixão por brinquedos raros.
                Conecte-se com outros colecionadores e descubra tesouros únicos.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Tornar-se Colecionador
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Vender Minha Coleção
                </Button>
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/80">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Certificação Premium</h3>
                  <p className="text-sm">Validação de autenticidade e qualidade</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Comunidade Ativa</h3>
                  <p className="text-sm">Conecte-se com outros especialistas</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">Paixão Compartilhada</h3>
                  <p className="text-sm">Descubra tesouros únicos e raros</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Mercado;