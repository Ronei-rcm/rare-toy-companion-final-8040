
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import CatalogoBrinquedos from '@/components/loja/CatalogoBrinquedos';
import CategoriasFilter from '@/components/loja/CategoriasFilter';
import AdvancedProductFilters from '@/components/loja/AdvancedProductFilters';
import QuickSearchBar from '@/components/loja/QuickSearchBar';
import ComparisonManager from '@/components/loja/ComparisonManager';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Star, Gift, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
                Catálogo Premium
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight">
                Catálogo de Brinquedos
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Descubra nossa coleção exclusiva de brinquedos para todas as idades e interesses.
                Cada peça é cuidadosamente selecionada para oferecer diversão e qualidade.
              </p>
              
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 pt-2 pb-6" />

        {/* Barra de Busca + Filtros inline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-white/90 backdrop-blur-sm border border-orange-100/70 shadow-sm"
        >
          <div className="container mx-auto px-4 py-5">
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <QuickSearchBar 
                  placeholder="Buscar produtos, categorias, marcas..."
                  className="w-full"
                />
              </div>
              <div className="w-full lg:w-72">
                <AdvancedProductFilters
                  categories={['Bonecos de Ação', 'Carrinhos', 'Bonecas', 'Jogos', 'Colecionáveis']}
                  onFiltersChange={(filters) => {
                    // Implementar lógica de filtros
                    console.log('Filtros aplicados:', filters);
                  }}
                  maxPrice={10000}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filtros e Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/90 backdrop-blur-sm border border-orange-100/70 shadow-sm rounded-none lg:rounded-none"
        >
          <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveView}>
              <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-4 bg-white border border-orange-100 rounded-xl shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]">
                <TabsTrigger 
                  value="todos" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg"
                >
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="destaques" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg"
                >
                  <Star className="mr-1 h-3 w-3" />
                  Destaques
                </TabsTrigger>
                <TabsTrigger 
                  value="promocoes" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg"
                >
                  <Gift className="mr-1 h-3 w-3" />
                  Promoções
                </TabsTrigger>
                <TabsTrigger 
                  value="lancamentos" 
                  className="flex items-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white rounded-lg"
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
          <main className="w-full">
            <CatalogoBrinquedos filtroView={activeView} />
          </main>
        </motion.div>
      </div>

      {/* Gerenciador de Comparação */}
      <ComparisonManager />
    </Layout>
  );
};

export default Loja;
