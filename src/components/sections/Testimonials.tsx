
import React from 'react';
import GlassCard from '@/components/ui/glass-card';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Este aplicativo transformou completamente a forma como gerencio minha coleção. A atenção aos detalhes é notável.",
    author: "Alexandre Moreira",
    role: "Colecionador de Brinquedos Vintage",
    rating: 5,
  },
  {
    quote: "O design limpo e a interface intuitiva tornam a catalogação dos meus brinquedos raros um prazer em vez de uma tarefa.",
    author: "Sarah Chen",
    role: "Entusiasta de Action Figures",
    rating: 5,
  },
  {
    quote: "Eu aprecio o pensamento que foi colocado em cada aspecto deste aplicativo. É arte funcional.",
    author: "Tiago Wilson",
    role: "Colecionador há mais de 15 anos",
    rating: 5,
  },
];

const Testimonials = () => {
  const titleAnimation = useScrollAnimation();
  
  return (
    <section className="py-20 px-6 bg-secondary/50">
      <div className="container max-w-7xl mx-auto">
        <div
          ref={titleAnimation.ref}
          className={cn(
            "text-center max-w-3xl mx-auto mb-16",
            getAnimationClass(titleAnimation.isInView)
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Amado por Colecionadores
          </h2>
          <p className="text-lg text-muted-foreground">
            Ouça o que nossa comunidade tem a dizer sobre a experiência.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialCard = ({ 
  testimonial, 
  index 
}: { 
  testimonial: { quote: string; author: string; role: string; rating: number };
  index: number;
}) => {
  const animation = useScrollAnimation();
  
  return (
    <div
      ref={animation.ref}
      className={cn(
        "transition-all duration-500",
        getAnimationClass(animation.isInView, 'slide-up')
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <GlassCard className="h-full hover-lift">
        <div className="flex flex-col h-full">
          <div className="flex mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>
          <blockquote className="mb-6 flex-grow">
            <p className="text-lg italic">{testimonial.quote}</p>
          </blockquote>
          <div>
            <p className="font-semibold">{testimonial.author}</p>
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default Testimonials;
