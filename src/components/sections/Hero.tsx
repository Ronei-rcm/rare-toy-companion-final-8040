
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Sparkles, Star } from 'lucide-react';
import { useCarousel } from '@/hooks/useCarousel';
import { useState, useEffect } from 'react';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { motion, AnimatePresence } from 'framer-motion';
import MobileCarousel from '@/components/ui/mobile-carousel';
// import useAccessibility from '@/hooks/useAccessibility';
import heroImage from '@/assets/mario-starwars-hero.jpg';

const Hero = () => {
  const titleAnimation = useScrollAnimation();
  const subtitleAnimation = useScrollAnimation();
  const ctaAnimation = useScrollAnimation();
  const { items: carouselItems, loading: isLoading } = useCarousel();
  const { config } = useHomeConfig();
  // const { announce, generateId, prefersReducedMotion, announcementRef } = useAccessibility({
  //   announceChanges: true,
  //   focusManagement: true
  // });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Autoplay do carrossel (apenas desktop)
  useEffect(() => {
    if (carouselItems && carouselItems.length > 1 && !isMobile) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
      }, 5000); // Mudar slide a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [carouselItems, isMobile]);

  // As imagens do carrossel já vêm normalizadas pelo serviço; usar direto

  const nextSlide = () => {
    if (carouselItems && carouselItems.length > 0) {
      const newSlide = (currentSlide + 1) % carouselItems.length;
      setCurrentSlide(newSlide);
      announce(`Slide ${newSlide + 1} de ${carouselItems.length}: ${carouselItems[newSlide].nome}`);
    }
  };

  const prevSlide = () => {
    if (carouselItems && carouselItems.length > 0) {
      const newSlide = (currentSlide - 1 + carouselItems.length) % carouselItems.length;
      setCurrentSlide(newSlide);
      announce(`Slide ${newSlide + 1} de ${carouselItems.length}: ${carouselItems[newSlide].nome}`);
    }
  };

  const goToSlide = (index: number) => {
    if (carouselItems && carouselItems.length > 0) {
      setCurrentSlide(index);
      announce(`Slide ${index + 1} de ${carouselItems.length}: ${carouselItems[index].nome}`);
    }
  };

  if (isLoading) {
    return (
      <section className="relative pt-28 pb-20 bg-background">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-16 w-3/4 mx-auto mb-6" />
            <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  const currentItem = carouselItems?.[currentSlide];
  
  // Debug logs removidos

  // Renderizar carrossel mobile
  if (isMobile && carouselItems && carouselItems.length > 0) {
    return (
      <section className="relative pt-20 pb-16 bg-background overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-10 left-5 w-48 h-48 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-5 w-64 h-64 bg-secondary/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <MobileCarousel
            autoPlay={true}
            autoPlayInterval={6000}
            showDots={true}
            showArrows={false}
            onSlideChange={setCurrentSlide}
            className="mb-8"
          >
            {carouselItems.map((item, index) => (
              <div key={index} className="text-center px-4">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-6"
                >
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      {item.nome}
                    </span>
                  </h1>
                  <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                    {item.descricao}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="relative mb-8"
                >
                  <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                    
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-muted">
                      <img 
                        src={`${item.imagem}?v=${Date.now()}`} 
                        alt={item.nome} 
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="space-y-3"
                >
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white font-semibold shadow-xl"
                    onClick={() => window.location.href = item.button_link || config.hero.ctaLink}
                  >
                    {item.button_text || config.hero.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="w-full bg-background/80 backdrop-blur-sm border-2 hover:bg-primary/10 hover:border-primary"
                    onClick={() => window.location.href = '/loja'}
                  >
                    Explorar Coleção
                  </Button>
                </motion.div>
              </div>
            ))}
          </MobileCarousel>
        </div>
      </section>
    );
  }

  return (
    <section className="relative pt-28 pb-20 bg-background overflow-hidden" role="banner">
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container max-w-6xl mx-auto px-6 relative z-10">
        {currentItem ? (
          <div className="relative">
            {/* Floating Elements */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-10 -left-10 text-6xl opacity-20"
            >
              <Sparkles className="text-primary" />
            </motion.div>
            
            <motion.div
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute -top-5 -right-10 text-4xl opacity-20"
            >
              <Star className="text-secondary" />
            </motion.div>

            {/* Carousel Navigation */}
            {carouselItems && carouselItems.length > 1 && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg"
                    onClick={prevSlide}
                    aria-label="Slide anterior"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg"
                    onClick={nextSlide}
                    aria-label="Próximo slide"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </motion.div>
              </>
            )}

            <div className="text-center mb-16">
              <motion.div 
                ref={titleAnimation.ref} 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-8"
              >
                <motion.h1 
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
                  >
                    {config.hero.showCarousel ? currentItem.nome : config.hero.title}
                  </motion.span>
                </motion.h1>
                {(config.hero.showCarousel ? currentItem.descricao : config.hero.subtitle) && (
                  <motion.p 
                    className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    {config.hero.showCarousel ? currentItem.descricao : config.hero.subtitle}
                  </motion.p>
                )}
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div 
              ref={subtitleAnimation.ref}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              className="flex justify-center mb-20"
            >
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                
                <div className="relative w-full max-w-5xl aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl bg-muted">
                  <motion.img 
                    src={`${currentItem.imagem}?v=${Date.now()}`} 
                    alt={currentItem.nome} 
                    className="h-full w-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    whileHover={{ scale: 1.05 }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                    }}
                  />
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-xl"
                    >
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* CTA Principal */}
            {(config.hero.showCarousel ? currentItem.button_text && currentItem.button_link : config.hero.ctaText) && (
              <motion.div 
                ref={ctaAnimation.ref}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.6 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                    onClick={() => window.location.href = config.hero.showCarousel ? currentItem.button_link! : config.hero.ctaLink}
                  >
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6, duration: 0.4 }}
                    >
                      {config.hero.showCarousel ? currentItem.button_text : config.hero.ctaText}
                    </motion.span>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.8, duration: 0.4 }}
                      className="ml-2"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
                
                {/* Secondary CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="mt-4"
                >
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-background/80 backdrop-blur-sm border-2 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                    onClick={() => window.location.href = '/loja'}
                  >
                    Explorar Coleção Completa
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Slide Indicators */}
            {carouselItems && carouselItems.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="flex justify-center mt-8 space-x-3"
                role="tablist"
                aria-label="Navegação do carrossel"
              >
                {carouselItems.map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-300 cursor-pointer",
                      index === currentSlide 
                        ? "bg-primary shadow-lg shadow-primary/50" 
                        : "bg-primary/30 hover:bg-primary/50"
                    )}
                    onClick={() => goToSlide(index)}
                    role="tab"
                    aria-selected={index === currentSlide}
                    aria-label={`Ir para slide ${index + 1}: ${item.nome}`}
                    tabIndex={index === currentSlide ? 0 : -1}
                  />
                ))}
              </motion.div>
            )}
          </div>
        ) : (
          // Fallback to default content when no carousel items
          <div className="text-center mb-16">
            <div 
              ref={titleAnimation.ref} 
              className={cn("mb-8", getAnimationClass(titleAnimation.isInView, 'fade'))}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                {config.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {config.hero.subtitle}
              </p>
            </div>
            
            <div 
              ref={subtitleAnimation.ref}
              className={cn(
                "flex justify-center mb-20",
                getAnimationClass(subtitleAnimation.isInView, 'slide-up')
              )}
            >
              <img 
                src={heroImage} 
                alt="Hero Image" 
                className="w-full max-w-md rounded-2xl shadow-2xl"
              />
            </div>
            
            <div 
              ref={ctaAnimation.ref}
              className={cn(
                "text-center",
                getAnimationClass(ctaAnimation.isInView, 'slide-up')
              )}
            >
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                onClick={() => window.location.href = config.hero.ctaLink}
              >
                {config.hero.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default Hero;
