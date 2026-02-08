import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Users, ShoppingBag, TrendingUp, MapPin, Clock } from 'lucide-react';
import { useSocialProof } from '@/hooks/useSocialProof';
import LazyImage from '@/components/ui/lazy-image';

const SocialProof = () => {
  const { stats, comprasRecentes, loading, error } = useSocialProof();
  const [compraAtual, setCompraAtual] = useState(0);

  useEffect(() => {
    if (comprasRecentes.length > 0) {
      const interval = setInterval(() => {
        setCompraAtual((prev) => (prev + 1) % comprasRecentes.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [comprasRecentes]);

  // Estados de loading e error
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar dados: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container max-w-7xl mx-auto px-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats ? `${Math.floor(stats.totalAvaliacoes / 10)}K+` : '12.5K+'}
            </div>
            <div className="text-sm text-muted-foreground">Colecionadores</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats ? `${stats.produtosAtivos}+` : '8.2K+'}
            </div>
            <div className="text-sm text-muted-foreground">Produtos Ativos</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats ? stats.avaliacaoMedia || '4.9' : '4.9'}/5
            </div>
            <div className="text-sm text-muted-foreground">Avaliação Média</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats ? `${stats.totalCategorias}+` : '350+'}
            </div>
            <div className="text-sm text-muted-foreground">Categorias</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Produtos em Destaque */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Badge className="mb-4" variant="secondary">
                ⭐ Produtos em Destaque
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Nossos Produtos Mais Populares
              </h3>
              <p className="text-muted-foreground">
                Veja os produtos que nossos clientes mais amam
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Array.isArray(comprasRecentes) ? comprasRecentes : []).slice(0, 4).map((compra, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-xl overflow-hidden bg-card border">
                    <LazyImage
                      src={compra.imagemUrl || '/src/assets/mario-starwars-hero.jpg'}
                      alt={compra.produto || 'Produto'}
                      className="w-full aspect-square object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {typeof compra.cliente === 'string'
                              ? compra.cliente.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase()
                              : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-sm font-medium">{compra.cliente || 'Colecionador'}</span>
                      </div>
                      <p className="text-white/90 text-xs mb-1">{compra.produto || 'Item Raro'}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-white/80 text-xs text-nowrap">R$ {(compra.preco || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Atividade em Tempo Real */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Badge className="mb-4" variant="secondary">
                🔴 Atividade ao Vivo
              </Badge>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Últimas Compras
              </h3>
              <p className="text-muted-foreground">
                Veja o que outros colecionadores estão comprando agora
              </p>
            </div>

            <div className="space-y-4">
              {(Array.isArray(comprasRecentes) ? comprasRecentes : []).map((compra, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{
                    opacity: compraAtual === index ? 1 : 0.5,
                    scale: compraAtual === index ? 1.02 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-lg border ${compraAtual === index ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LazyImage
                        src={compra.imagemUrl || '/src/assets/mario-starwars-hero.jpg'}
                        alt={compra.produto || 'Produto'}
                        className="w-12 h-12 rounded-lg object-cover"
                        sizes="48px"
                      />
                      <div>
                        <div className="font-medium text-foreground">{compra.cliente || 'Colecionador'}</div>
                        <div className="text-sm text-muted-foreground">comprou {compra.produto || 'um item'}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {compra.cidade || 'Brasil'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground text-nowrap">
                        <Clock className="w-3 h-3" />
                        {compra.tempoAtras || 5} min atrás
                      </div>
                      {compraAtual === index && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1 ml-auto" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sistema de Pontos Preview */}
            <div className="mt-8 p-6 bg-card border rounded-xl">
              <div className="text-center">
                <Badge className="mb-3">🏆 Sistema de Pontos</Badge>
                <h4 className="font-bold text-foreground mb-2">Torne-se um Colecionador VIP</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ganhe pontos a cada compra e desbloqueie benefícios exclusivos
                </p>
                <div className="flex justify-center space-x-4 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-bronze rounded-full mx-auto mb-1"></div>
                    <div>Bronze</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-400 rounded-full mx-auto mb-1"></div>
                    <div>Prata</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-yellow-400 rounded-full mx-auto mb-1"></div>
                    <div>Ouro</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;