import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { ArrowRight, Star, Gamepad2, Crown, Sword, Shield } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import LazyImage from '@/components/ui/lazy-image';

const CategoriasVisuais = () => {
  const { config } = useHomeConfig();
  const { categories: categorias, isLoading: loading, error } = useCategories();
  const navigate = useNavigate();

  // Estados de loading e error
  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar categorias: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4" variant="outline">
              {config.categorias.badge}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {config.categorias.title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {config.categorias.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categorias.map((categoria, index) => (
            <motion.div
              key={categoria.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group cursor-pointer"
              onClick={() => navigate(`/loja?categoria=${categoria.nome}`)}
            >
              <div className="relative h-80 rounded-2xl overflow-hidden bg-card border hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                {/* Background Image ou Gradient */}
                {categoria.imagem_url ? (
                  <>
                    <div className="absolute inset-0">
                      <LazyImage
                        src={categoria.imagem_url}
                        alt={categoria.nome}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Overlay escuro para legibilidade */}
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
                  </>
                ) : (
                  <>
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${categoria.cor} opacity-90 group-hover:opacity-100 transition-opacity`} />

                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                    </div>
                  </>
                )}

                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between text-white">
                  <div>
                    <div className="text-4xl mb-4 drop-shadow-lg">{categoria.icon}</div>
                    <h3 className="text-xl font-bold mb-2 drop-shadow-lg">{categoria.nome}</h3>
                    <p className="text-white/90 text-sm mb-2 drop-shadow-md">{categoria.descricao}</p>

                    {/* Stats */}
                    <div className="space-y-1 mb-4">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        {categoria.quantidade} produtos
                      </Badge>
                      {categoria.avaliacaoMedia && categoria.quantidade > 0 && (
                        <div className="flex items-center gap-1 text-xs text-white/80 drop-shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{categoria.avaliacaoMedia}</span>
                        </div>
                      )}
                      {categoria.quantidade > 0 && (
                        <div className="text-xs text-white/70 drop-shadow-md">
                          R$ {categoria.precoMinimo.toFixed(2)} - R$ {categoria.precoMaximo.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium drop-shadow-md">Explorar</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform drop-shadow-md" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filtros Rápidos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-3">
            <Badge
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/loja?sort=popular')}
            >
              Mais Populares
            </Badge>
            <Badge
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/loja?sort=newest')}
            >
              Lançamentos
            </Badge>
            <Badge
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/loja?sort=price-low')}
            >
              Menor Preço
            </Badge>
            <Badge
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/loja?sort=price-high')}
            >
              Maior Preço
            </Badge>
            <Badge
              variant="outline"
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => navigate('/loja?sort=rating')}
            >
              Melhor Avaliação
            </Badge>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CategoriasVisuais;