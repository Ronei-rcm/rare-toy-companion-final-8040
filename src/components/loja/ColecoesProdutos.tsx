import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCollections } from '@/hooks/useCollections';
import { Star, Package, ArrowRight, Heart, ShoppingBag, ChevronRight, Clock, Hash, Tag, Circle, Sparkles } from 'lucide-react';
import { Collection } from '@/types/collection';
import { resolveImage } from '@/utils/resolveImage';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const ColecoesProdutos = () => {
  const navigate = useNavigate();
  const { collections: colecoes, loading: isLoading } = useCollections();

  const navegarParaColecao = (id: string) => {
    navigate(`/colecao/${id}`);
  };

  const formatTimeAgo = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `há ${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `há ${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `há ${hr}h`;
    const d = Math.floor(hr / 24);
    if (d < 30) return `há ${d}d`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `há ${mo}mês` + (mo > 1 ? 'es' : '');
    const y = Math.floor(mo / 12);
    return `há ${y}a`;
  };

  const isNew = (iso?: string) => {
    if (!iso) return false;
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days <= 7; // Considera "novo" se criado nos últimos 7 dias
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent mb-2">
            Nossas Coleções Especiais
          </h2>
          <p className="text-muted-foreground">Descubra produtos únicos organizados por temas</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <motion.div 
        className="space-y-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          variants={itemVariants}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            Coleções Curadas
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-6">
            Nossas Coleções Especiais
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Descubra tesouros únicos organizados por temas especiais. Cada coleção é cuidadosamente curada para oferecer experiências únicas e memoráveis.
          </p>
        </motion.div>

        {colecoes.length === 0 ? (
          <motion.div 
            className="text-center py-20"
            variants={itemVariants}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 max-w-md mx-auto shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Nenhuma coleção encontrada</h3>
              <p className="text-slate-600">Em breve teremos coleções incríveis para você!</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
          >
            {colecoes.map((colecao: Collection, index) => (
              <motion.div
                key={colecao.id}
                variants={itemVariants}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-orange-200/50 cursor-pointer"
                     onClick={() => navegarParaColecao(colecao.id)}>
                  <div className="relative overflow-hidden">
                    <img 
                      src={resolveImage(colecao.imagem || colecao.imagem_url)} 
                      alt={colecao.nome}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Overlay Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {colecao.destaque && (
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </div>
                      )}
                      {isNew((colecao as any).created_at) && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg animate-pulse">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Novo
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                      <Button 
                        size="sm"
                        className="bg-white/90 text-orange-600 hover:bg-white hover:text-orange-700 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                      >
                        Ver Coleção
                      </Button>
                    </div>
                    
                    {/* Destaque Indicator on Hover */}
                    {colecao.destaque && (
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Em Destaque
                        </div>
                      </div>
                    )}
                  </div>
                  
                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                      {colecao.nome}
                    </h3>
                    {Array.isArray(colecao.tags) && colecao.tags.length > 0 && (
                      <Badge className="bg-white text-slate-600 border-slate-200 shadow-sm">
                        <Tag className="w-3 h-3 mr-1" /> {colecao.tags.length}
                      </Badge>
                    )}
                  </div>
                    
                    <p className="text-slate-600 mb-6 line-clamp-2 leading-relaxed">
                      {colecao.descricao}
                    </p>
                    
                    <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-6 text-slate-500">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center mr-2">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-medium">{colecao.produtos || 0} produtos</span>
                    </div>
                    <div className="hidden sm:flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-xs sm:text-sm">{formatTimeAgo((colecao as any).updated_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">A partir de</div>
                    <div className="text-lg font-bold text-orange-600">
                      {colecao.preco || 'R$ 0,00'}
                    </div>
                  </div>
                    </div>
                    
                <TooltipProvider>
                  <div className="flex items-center justify-between mb-6">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-default">
                          <div className={`w-2.5 h-2.5 rounded-full ${colecao.status === 'ativo' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                          <span className="text-xs uppercase tracking-wide text-slate-500">{colecao.status === 'ativo' ? 'Ativa' : 'Inativa'}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Visibilidade pública da coleção</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-slate-500 text-xs cursor-default">
                          <Hash className="w-3 h-3" />
                          <span>ordem {Number((colecao as any).ordem ?? 0)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Prioridade na listagem</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                {colecao.tags && colecao.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {colecao.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {colecao.tags.length > 3 && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                        +{colecao.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group/btn"
                    >
                      <span className="flex items-center justify-center">
                        <span className="group-hover/btn:scale-110 transition-transform duration-200">
                          Explorar Coleção
                        </span>
                        <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ColecoesProdutos;