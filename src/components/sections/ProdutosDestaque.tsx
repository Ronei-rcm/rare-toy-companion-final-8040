import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Heart, ShoppingCart, Eye, Zap, Check } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { useCart } from '@/contexts/CartContext';
import LazyImage from '@/components/ui/lazy-image';
import usePerformance from '@/hooks/usePerformance';

const ProdutosDestaque = () => {
  const { products: produtosDestaque, loading, error } = useFeaturedProducts();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config } = useHomeConfig();
  const { addToCart } = useCart();
  const { shouldReduceAnimations, shouldUseLazyLoading } = usePerformance();
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const handleAddToCart = async (produto: any) => {
    setAddingToCart(produto.id);
    
    // Simular delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 800));
    
    addToCart(produto);
    setAddingToCart(null);
    setAddedToCart(produto.id);
    
    toast({
      title: '🎉 Produto adicionado!',
      description: `${produto.nome} foi adicionado ao carrinho.`,
    });

    // Reset do estado após 2 segundos
    setTimeout(() => setAddedToCart(null), 2000);
  };

  const handleViewProduct = (id: string) => {
    navigate(`/produto/${id}`);
  };

  const handleQuickView = (produto: any) => {
    // Implementar modal de visualização rápida
    toast({
      title: 'Visualização Rápida',
      description: `Abrindo detalhes de ${produto.nome}...`,
    });
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              {config.produtosDestaque.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {config.produtosDestaque.title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {config.produtosDestaque.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-card border rounded-2xl p-6">
                <Skeleton className="aspect-square rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4" variant="secondary">
              {config.produtosDestaque.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {config.produtosDestaque.title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {config.produtosDestaque.subtitle}
            </p>
          </motion.div>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="-ml-1">
            {produtosDestaque.map((produto, index) => (
              <CarouselItem key={produto.id} className="pl-1 md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={shouldReduceAnimations ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceAnimations ? {} : { opacity: 1, y: 0 }}
                  transition={shouldReduceAnimations ? {} : { delay: index * 0.1, duration: 0.5 }}
                  className="h-full"
                  onMouseEnter={() => setHoveredProduct(produto.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="group relative bg-card border rounded-2xl p-6 h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden">
                    {/* Background Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Badge */}
                    <motion.div 
                      className="absolute top-4 left-4 z-10"
                      initial={shouldReduceAnimations ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                      animate={shouldReduceAnimations ? {} : { scale: 1, rotate: 0 }}
                      transition={shouldReduceAnimations ? {} : { delay: index * 0.1 + 0.2, duration: 0.5, type: "spring" }}
                    >
                      <Badge 
                        className={`
                          ${produto.promocao ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' : ''}
                          ${produto.lancamento ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30' : ''}
                          ${!produto.promocao && !produto.lancamento ? 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30' : ''}
                          text-white font-semibold
                        `}
                      >
                        {produto.promocao ? '🔥 Promoção' : produto.lancamento ? '✨ Novo' : '⭐ Destaque'}
                      </Badge>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                      <motion.button 
                        className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                      </motion.button>
                      
                      <motion.button 
                        className="p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickView(produto)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground hover:text-blue-500 transition-colors" />
                      </motion.button>
                    </div>

                    {/* Imagem */}
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-muted">
                      <LazyImage
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                        priority={index < 3} // Primeiras 3 imagens têm prioridade
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        placeholder={
                          <Skeleton className="w-full h-full rounded-xl" />
                        }
                      />
                      
                      {/* Overlay com informações rápidas */}
                      <AnimatePresence>
                        {hoveredProduct === produto.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                          >
                            <div className="text-center text-white">
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl font-bold mb-2"
                              >
                                {produto.nome}
                              </motion.div>
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg font-semibold text-primary"
                              >
                                R$ {produto.preco.toFixed(2)}
                              </motion.div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Avaliação */}
                    <motion.div 
                      className="flex items-center gap-1 mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                    >
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.4 + i * 0.1, duration: 0.3 }}
                          >
                            <Star 
                              className={`w-4 h-4 ${i < Math.floor(produto.avaliacao || 4.5) ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                            />
                          </motion.div>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground ml-1">
                        {produto.avaliacao || 4.5} ({produto.totalAvaliacoes || 50})
                      </span>
                    </motion.div>

                    {/* Info */}
                    <motion.h3 
                      className="font-bold text-lg mb-2 group-hover:text-primary transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.5, duration: 0.4 }}
                    >
                      {produto.nome}
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-muted-foreground mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.6, duration: 0.4 }}
                    >
                      {produto.descricao || `${produto.marca} - ${produto.categoria}`}
                    </motion.p>

                    {/* Preço */}
                    <motion.div 
                      className="flex items-center gap-2 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.7, duration: 0.4 }}
                    >
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                      {produto.promocao && (
                        <motion.span 
                          className="text-sm text-muted-foreground line-through"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.8, duration: 0.3, type: "spring" }}
                        >
                          R$ {(produto.preco * 1.3).toFixed(2)}
                        </motion.span>
                      )}
                    </motion.div>

                    {/* Ações */}
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.8, duration: 0.4 }}
                    >
                      <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300" 
                          size="sm"
                          disabled={produto.estoque === 0 || addingToCart === produto.id}
                          onClick={() => handleAddToCart(produto)}
                        >
                          <AnimatePresence mode="wait">
                            {addingToCart === produto.id ? (
                              <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <Zap className="w-4 h-4" />
                                </motion.div>
                                Adicionando...
                              </motion.div>
                            ) : addedToCart === produto.id ? (
                              <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Adicionado!
                              </motion.div>
                            ) : (
                              <motion.div
                                key="normal"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex items-center gap-2"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                {produto.estoque > 0 ? 'Adicionar' : 'Esgotado'}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-2 hover:border-primary hover:bg-primary/10 transition-all duration-300"
                          onClick={() => handleViewProduct(produto.id)}
                        >
                          Ver Mais
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default ProdutosDestaque;