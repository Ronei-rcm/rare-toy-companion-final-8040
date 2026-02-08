import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ArrowRight, BookOpen, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { onImageError } from '@/utils/resolveImage';
import { request } from '@/services/api-config';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  categoria: string;
  imagem_url?: string;
  imagem_destaque?: string;
  autor: string;
  tempo_leitura: number;
  visualizacoes: number;
  destaque: boolean;
  publicado_em: string;
  tags?: string[];
}

const guiasColecionador = [
  {
    titulo: 'Como Começar sua Coleção',
    icon: '🚀',
    descricao: 'Primeiros passos para novos colecionadores'
  },
  {
    titulo: 'Cuidados e Preservação',
    icon: '🛡️',
    descricao: 'Mantenha suas peças em perfeito estado'
  },
  {
    titulo: 'Avaliação e Autenticidade',
    icon: '🔍',
    descricao: 'Como identificar peças originais'
  },
  {
    titulo: 'Investimento em Colecionáveis',
    icon: '💎',
    descricao: 'Quais peças têm potencial de valorização'
  }
];

const BlogNoticias = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await request<any>('/blog/posts?limit=3&status=publicado');
        if (data && data.posts && Array.isArray(data.posts)) {
          setPosts(data.posts);
        } else if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.warn('⚠️ [BlogNoticias] Formato de dados inesperado:', data);
          setPosts([]);
        }
      } catch (error) {
        console.error('Erro ao carregar posts do blog:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-80" />
            <div className="space-y-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!Array.isArray(posts) || posts.length === 0) {
    if (loading) return null; // Já tratado acima, mas por segurança
    return (
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum post publicado ainda</p>
        </div>
      </section>
    );
  }

  const [postDestaque, ...outrosPosts] = posts;

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
              📰 Blog & Notícias
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Fique Por Dentro do Mundo dos Colecionáveis
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Notícias, guias, lançamentos e dicas exclusivas para colecionadores
            </p>
          </motion.div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum post publicado ainda</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Artigo Principal */}
            {postDestaque && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-2"
              >
                <div
                  className="group cursor-pointer"
                  onClick={() => handlePostClick(postDestaque.slug)}
                >
                  <div className="relative h-80 rounded-2xl overflow-hidden mb-6">
                    <img
                      src={postDestaque.imagem_destaque || postDestaque.imagem_url || '/placeholder.svg'}
                      alt={postDestaque.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={onImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 hover:bg-red-600 text-white">
                        {postDestaque.categoria}
                      </Badge>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {postDestaque.titulo}
                      </h3>
                      <p className="text-white/90 mb-4">{postDestaque.resumo}</p>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(postDestaque.publicado_em)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {postDestaque.tempo_leitura} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {postDestaque.visualizacoes}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              {Array.isArray(outrosPosts) && outrosPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group cursor-pointer"
                  onClick={() => handlePostClick(post.slug)}
                >
                  <div className="bg-card border rounded-xl p-4 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={post.imagem_url || '/placeholder.svg'}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={onImageError}
                        />
                      </div>
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 text-xs">
                          {post.categoria}
                        </Badge>
                        <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">
                          {post.titulo}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {post.resumo}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatDate(post.publicado_em)}</span>
                          <span>{post.tempo_leitura} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Guias do Colecionador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8"
        >
          <div className="text-center mb-8">
            <Badge className="mb-4" variant="secondary">
              📚 Guias Essenciais
            </Badge>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Guia Completo do Colecionador
            </h3>
            <p className="text-muted-foreground">
              Tudo que você precisa saber para se tornar um expert em colecionáveis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.isArray(guiasColecionador) && guiasColecionador.map((guia, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group cursor-pointer"
              >
                <div className="bg-card border rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="text-4xl mb-4">{guia.icon}</div>
                  <h4 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {guia.titulo}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {guia.descricao}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="group">
              <BookOpen className="w-4 h-4 mr-2" />
              Ver Todos os Guias
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogNoticias;