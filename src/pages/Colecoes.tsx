
import React, { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import ColecoesProdutos from '@/components/loja/ColecoesProdutos';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star, Package, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Colecoes = () => {
  const animation = useScrollAnimation();
  const navigate = useNavigate();

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          
          <div className="relative container mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 text-center lg:text-left"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 text-sm font-medium mb-6">
                  <Star className="w-4 h-4 mr-2" />
                  Coleções Premium
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-6 leading-tight">
                  Coleções Especiais
                </h1>
                <p className="text-xl text-slate-600 mb-8 max-w-2xl leading-relaxed">
                  Descubra tesouros únicos organizados por temas especiais. 
                  Cada peça conta uma história extraordinária.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => navigate('/loja')}
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Explorar Loja
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    Ver Catálogo
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="w-80 h-80 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl transform rotate-6"></div>
                  <div className="absolute inset-2 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-2">3+</h3>
                      <p className="text-slate-600">Coleções Ativas</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="container mx-auto px-4 py-16"
        >
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Curação Especializada</h3>
              <p className="text-slate-600 text-sm">Cada item é cuidadosamente selecionado por especialistas</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Autenticidade Garantida</h3>
              <p className="text-slate-600 text-sm">Todos os produtos passam por rigorosa verificação</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">História Preservada</h3>
              <p className="text-slate-600 text-sm">Mantemos viva a memória dos brinquedos icônicos</p>
            </div>
          </div>
        </motion.div>
        
        {/* Collections Section */}
        <div 
          className={getAnimationClass(animation.isInView)} 
          ref={animation.ref}
        >
          <ColecoesProdutos />
        </div>
      </div>
    </Layout>
  );
};

export default Colecoes;
