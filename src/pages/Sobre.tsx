import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Users, Award, Target, Mail, Phone, MapPin, Sparkles, TrendingUp, Shield, Zap, ChevronRight, Star, Gift, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSobreContent, useCompanyValues, useTeamMembers, useCompanyStats, useContactInfo } from '@/hooks/useSobre';
import { resolveImage } from '@/utils/resolveImage';

const Sobre = () => {
  // Buscar dados da API
  const { data: sobreContent, isLoading: loadingContent } = useSobreContent();
  const { data: valores, isLoading: loadingValores } = useCompanyValues();
  const { data: equipe, isLoading: loadingEquipe } = useTeamMembers();
  const { data: stats, isLoading: loadingStats } = useCompanyStats();
  const { data: contato, isLoading: loadingContato } = useContactInfo();

  // Buscar conteúdo específico das seções
  const heroContent = sobreContent?.find(item => item.section === 'hero');
  const valoresContent = sobreContent?.find(item => item.section === 'valores');
  const equipeContent = sobreContent?.find(item => item.section === 'equipe');
  const statsContent = sobreContent?.find(item => item.section === 'stats');
  const contatoContent = sobreContent?.find(item => item.section === 'contato');

  // Mapear ícones para os valores
  const getIconComponent = (iconName?: string) => {
    const iconMap: { [key: string]: any } = {
      'Heart': Heart,
      'Users': Users,
      'Award': Award,
      'Target': Target,
      'Star': Star,
      'Shield': Shield,
      'Zap': Zap,
      'Gift': Gift,
      'Clock': Clock,
      'TrendingUp': TrendingUp,
      'Mail': Mail,
      'Phone': Phone,
      'MapPin': MapPin,
    };
    return iconMap[iconName || 'Heart'] || Heart;
  };

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
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full gradient-brand-soft text-orange-700 text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Nossa História
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gradient-brand mb-6 leading-tight">
                  {heroContent?.title || 'Nossa História'}
                </h1>
                <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                  {heroContent?.description || 'A MuhlStore nasceu do sonho de conectar pessoas através de brinquedos únicos e especiais. Desde 2020, nossa missão é descobrir e compartilhar tesouros de brinquedos raros e seminovos de todo o Brasil.'}
                </p>
                {heroContent?.subtitle && (
                  <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                    {heroContent.subtitle}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg"
                    className="gradient-brand text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Gift className="h-5 w-5 mr-2" />
                    Conheça Nossos Produtos
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Nossa Missão
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <img 
                  src={heroContent?.image_url ? resolveImage(heroContent.image_url) : "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=600&h=400&fit=crop"} 
                  alt={heroContent?.title || "Nossa loja"}
                  className="relative rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-orange-100">
                  <div className="text-3xl font-bold text-orange-600">1000+</div>
                  <div className="text-orange-500 font-medium">Clientes Felizes</div>
                </div>
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-2xl shadow-xl">
                  <div className="text-2xl font-bold">4+</div>
                  <div className="text-sm opacity-90">Anos de Experiência</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Valores */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full gradient-brand-soft text-orange-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Nossos Valores
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
              {valoresContent?.title || 'Nossos Valores'}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {valoresContent?.description || 'Os princípios que guiam cada decisão e ação em nossa jornada'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {loadingValores ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 h-64 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              valores?.map((valor, index) => {
                const IconComponent = getIconComponent(valor.icon);
                return (
                  <motion.div
                    key={valor.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                    className="group"
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-orange-200/50 text-center p-8 h-full">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-orange-600 transition-colors duration-300">
                        {valor.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {valor.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Equipe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/60 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4 py-16">
            <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full gradient-brand-soft text-orange-700 text-sm font-medium mb-6">
                <Users className="w-4 h-4 mr-2" />
                Nossa Equipe
              </div>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
              {equipeContent?.title || 'Nossa Equipe'}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              {equipeContent?.description || 'Conheça as pessoas apaixonadas que tornam a MuhlStore especial'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loadingEquipe ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-8 h-80 animate-pulse">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : (
              equipe?.map((membro, index) => (
                <motion.div
                  key={membro.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-orange-200/50 text-center p-8 h-full">
                    <div className="relative mb-6">
                      <img 
                        src={membro.image_url ? resolveImage(membro.image_url) : "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face"} 
                        alt={membro.name}
                        className="w-24 h-24 rounded-full mx-auto object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {membro.name}
                    </h3>
                    <p className="text-orange-600 font-medium mb-4">
                      {membro.position}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {membro.description}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            </div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                {statsContent?.title || 'Nossos Números'}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {statsContent?.subtitle || 'Números que Impressionam'}
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                {statsContent?.description || 'Resultados que mostram nosso compromisso com a excelência'}
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 text-center text-white">
              {loadingStats ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 animate-pulse">
                    <div className="h-12 bg-white/30 rounded mb-2"></div>
                    <div className="h-6 bg-white/30 rounded"></div>
                  </div>
                ))
              ) : (
                stats?.map((stat, index) => {
                  const IconComponent = getIconComponent(stat.icon);
                  return (
                    <motion.div
                      key={stat.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                      className="group"
                    >
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/30 transition-all duration-300">
                        {stat.icon && (
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div className="text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                          {stat.value}
                        </div>
                        <div className="text-xl opacity-90">{stat.title}</div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Contato */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="container mx-auto px-4 py-20"
        >
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full gradient-brand-soft text-orange-700 text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Entre em Contato
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
              {contatoContent?.title || 'Entre em Contato'}
            </h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
              {contatoContent?.description || 'Estamos aqui para ajudar! Entre em contato conosco e tire suas dúvidas.'}
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {loadingContato ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/20 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-2xl mx-auto mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))
              ) : (
                contato?.map((info, index) => {
                  const IconComponent = getIconComponent(info.icon);
                  return (
                    <motion.div
                      key={info.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
                      className="group"
                    >
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 hover:border-orange-200/50">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{info.title}</h3>
                        <p className="text-slate-600">{info.value}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="gradient-brand text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Heart className="h-5 w-5 mr-2" />
                Fale Conosco
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Sobre;