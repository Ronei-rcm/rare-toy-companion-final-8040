
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import CatalogoBrinquedos from '@/components/loja/CatalogoBrinquedos';
import CategoriasFilter from '@/components/loja/CategoriasFilter';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Package, Gift, Star, Clock, Sparkles, TrendingUp, Shield, Zap, ChevronRight, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import BannerToyHeroes from '@/components/sections/BannerToyHeroes';

const Loja = () => {
  const [activeView, setActiveView] = useState("todos");
  const navigate = useNavigate();
  
  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const animation = useScrollAnimation();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
        <BannerToyHeroes />
        
        {/* Hero Section da Loja */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-amber-500/3 to-yellow-400/5"></div>
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Loja Premium
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight">
                Catálogo de Brinquedos
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Descubra nossa coleção exclusiva de brinquedos para todas as idades e interesses.
                Cada peça é cuidadosamente selecionada para oferecer diversão e qualidade.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Button 
                    onClick={() => navigate('/colecao')}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Ver Coleções Especiais
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
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Produtos em Destaque
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
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">500+</h3>
              <p className="text-slate-600 text-sm">Produtos Disponíveis</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">4.9</h3>
              <p className="text-slate-600 text-sm">Avaliação Média</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">50+</h3>
              <p className="text-slate-600 text-sm">Categorias</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">100%</h3>
              <p className="text-slate-600 text-sm">Garantia de Qualidade</p>
            </div>
          </div>
        </motion.div>

        {/* Filtros e Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/80 backdrop-blur-sm border border-orange-100"
        >
          <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveView}>
              <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 bg-white/80 border border-orange-200">
                <TabsTrigger 
                  value="todos" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="destaques" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Destaques
                </TabsTrigger>
                <TabsTrigger 
                  value="promocoes" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <Gift className="mr-1 h-3 w-3" />
                  Promoções
                </TabsTrigger>
                <TabsTrigger 
                  value="lancamentos" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  Lançamentos
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>
        
        {/* Conteúdo Principal */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="container mx-auto px-4 py-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <CategoriasFilter />
            </aside>
            
            <main className="lg:col-span-3">
              <CatalogoBrinquedos filtroView={activeView} />
            </main>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Loja;
