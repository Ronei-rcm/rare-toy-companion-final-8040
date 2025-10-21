import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowRight, Sparkles, TrendingUp, Shield, Zap, ChevronRight, Clock, Star, Heart, Gift } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const Eventos = () => {
  const { data: events, isLoading } = useEvents();

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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Eventos Especiais
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight">
                Nossos Eventos
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Participe dos nossos eventos especiais e descubra o mundo dos brinquedos vintage e colecionáveis.
                Conecte-se com outros apaixonados e viva experiências únicas.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Próximos Eventos
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Eventos Favoritos
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">12+</h3>
              <p className="text-slate-600 text-sm">Eventos por Mês</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">500+</h3>
              <p className="text-slate-600 text-sm">Participantes Ativos</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">4.9</h3>
              <p className="text-slate-600 text-sm">Avaliação Média</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">100%</h3>
              <p className="text-slate-600 text-sm">Experiências Únicas</p>
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
              Próximos Eventos
            </h2>
            <p className="text-lg text-slate-600">
              Descubra experiências únicas e conecte-se com outros apaixonados por brinquedos
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-3xl" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-orange-200/50">
                    {event.imagem_url && (
                      <div className="relative overflow-hidden">
                        <img
                          src={event.imagem_url}
                          alt={event.titulo}
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Price Badge */}
                        <div className="absolute top-4 left-4">
                          {event.preco && event.preco > 0 ? (
                            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
                              R$ {event.preco.toFixed(2).replace(".", ",")}
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                              <Gift className="w-3 h-3 mr-1" />
                              Gratuito
                            </Badge>
                          )}
                        </div>
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                          <Button 
                            size="sm"
                            className="bg-white/90 text-orange-600 hover:bg-white hover:text-orange-700 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                          {event.titulo}
                        </h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-default">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span className="text-xs text-slate-500">Ativo</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Evento disponível para inscrição</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {event.descricao && (
                        <p className="text-slate-600 mb-6 line-clamp-3 leading-relaxed">
                          {event.descricao}
                        </p>
                      )}

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center text-slate-500">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <span className="font-medium">
                            {format(new Date(event.data_evento), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        {event.local && (
                          <div className="flex items-center text-slate-500">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center mr-3">
                              <MapPin className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="font-medium">{event.local}</span>
                          </div>
                        )}

                        {event.vagas_limitadas && event.numero_vagas && (
                          <div className="flex items-center text-slate-500">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center mr-3">
                              <Users className="h-4 w-4 text-yellow-600" />
                            </div>
                            <span className="font-medium">{event.numero_vagas} vagas disponíveis</span>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group/btn"
                      >
                        <span className="flex items-center justify-center">
                          <span className="group-hover/btn:scale-110 transition-transform duration-200">
                            Saiba Mais
                          </span>
                          <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="h-10 w-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhum evento disponível</h3>
                <p className="text-slate-600">Fique de olho! Em breve teremos novos eventos incríveis para você.</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* CTA Section */}
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
          
          <div className="relative container mx-auto px-4 py-20 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Não Perca Nada
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Fique por Dentro dos Eventos
              </h2>
              <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
                Receba notificações sobre novos eventos e seja o primeiro a saber sobre as melhores oportunidades.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  Favoritar Eventos
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Adicionar ao Calendário
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Eventos;