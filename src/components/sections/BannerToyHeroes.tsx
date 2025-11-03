
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import bannerImage from '@/assets/mario-starwars-banner.jpg';

const BannerToyHeroes = () => {
  const bannerAnimation = useScrollAnimation();

  return (
    <section className="relative py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/20 rounded-full blur-3xl" />
      
      <div 
        ref={bannerAnimation.ref}
        className={cn(
          "container mx-auto px-4",
          getAnimationClass(bannerAnimation.isInView)
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-amber-500/90 to-yellow-400/90 z-10" />
          
          {/* Imagem de fundo */}
          <div className="h-80 md:h-96 lg:h-[500px] relative">
            <img 
              src={bannerImage} 
              alt="Mario Bros Star Wars Action Figures Collection" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Conteúdo do banner */}
          <div className="absolute inset-0 z-20 flex items-center">
            <div className="container mx-auto px-8">
              <div className="max-w-2xl">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-8"
                >
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Coleção Limitada
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg mb-4 leading-tight">
                    Heróis da Galáxia dos Cogumelos!
                  </h2>
                  <p className="text-white/90 text-xl leading-relaxed drop-shadow-md">
                    Mario Jedi, Luigi Rebelde e Princesa Leia Peach! Action figures raras do crossover mais épico da história!
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Link to="/loja">
                    <Button 
                      size="lg" 
                      className="bg-white text-orange-600 hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Star className="mr-2 h-5 w-5" />
                      Explorar Coleção
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/colecao">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Ver Coleções
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Badges flutuantes */}
          <div className="absolute top-6 right-6 z-30">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
              <Star className="w-4 h-4 mr-2 inline" />
              Edição Limitada
            </div>
          </div>
          
          <div className="absolute bottom-6 right-6 z-30">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-2 text-sm font-bold shadow-lg">
              <Zap className="w-4 h-4 mr-2 inline" />
              Exclusivo
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BannerToyHeroes;
