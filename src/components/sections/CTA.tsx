
import React from 'react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { ArrowRight } from 'lucide-react';

const CTA = () => {
  const animation = useScrollAnimation();
  
  return (
    <section className="py-20 px-6">
      <div 
        ref={animation.ref}
        className={cn(
          "container max-w-5xl mx-auto glass-card p-12 md:p-16 rounded-2xl text-center relative overflow-hidden",
          getAnimationClass(animation.isInView)
        )}
      >
        {/* Background decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Pronto para Elevar Sua Coleção?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de colecionadores que transformaram sua experiência com nossa abordagem 
            elegante e minimalista para gerenciamento de coleções.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="font-medium">
              Começar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="font-medium">
              Contatar Vendas
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default CTA;
