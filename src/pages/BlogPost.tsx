import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO } from '@/components/SEO';
import {
  Calendar,
  Clock,
  User,
  Eye,
  ArrowLeft,
  Share2,
  BookOpen,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  categoria: string;
  imagem_url?: string;
  imagem_destaque?: string;
  autor: string;
  autor_avatar?: string;
  tempo_leitura: number;
  visualizacoes: number;
  destaque: boolean;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  publicado_em: string;
  created_at: string;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/blog/posts/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            navigate('/404');
            return;
          }
          throw new Error('Erro ao carregar post');
        }
        
        const data = await response.json();
        setPost(data);

        // Carregar posts relacionados da mesma categoria
        const relatedResponse = await fetch(`/api/blog/posts?categoria=${data.categoria}&limit=3`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          setRelatedPosts(relatedData.filter((p: BlogPost) => p.id !== data.id));
        }
      } catch (error) {
        console.error('Erro ao carregar post:', error);
        toast.error('Erro ao carregar post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.titulo,
        text: post?.resumo,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-6 py-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Post não encontrado</h1>
          <p className="text-muted-foreground mb-6">O post que você procura não existe ou foi removido.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <SEO
        title={post.meta_title || post.titulo}
        description={post.meta_description || post.resumo}
        keywords={post.meta_keywords || post.tags?.join(', ')}
        url={`/blog/${post.slug}`}
        type="article"
        image={post.imagem_destaque || post.imagem_url}
      />
      
      <Layout>
        <article className="min-h-screen bg-background">
          {/* Hero / Imagem Destaque */}
          {post.imagem_destaque && (
            <div className="relative h-96 w-full overflow-hidden">
              <img
                src={post.imagem_destaque}
                alt={post.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="container max-w-4xl mx-auto px-6 py-12">
            {/* Breadcrumb */}
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Home
            </Button>

            {/* Header do Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4">{post.categoria}</Badge>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {post.titulo}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6">
                {post.resumo}
              </p>

              {/* Meta Informações */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{post.autor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publicado_em)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.tempo_leitura} min de leitura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.visualizacoes} visualizações</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="ml-auto"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Conteúdo do Post */}
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-foreground
                  prose-p:text-foreground/90
                  prose-a:text-primary
                  prose-strong:text-foreground
                  prose-ul:text-foreground/90
                  prose-ol:text-foreground/90
                  prose-li:text-foreground/90
                  prose-blockquote:text-foreground/80
                  prose-blockquote:border-primary
                  prose-code:text-primary
                  prose-pre:bg-muted
                  prose-img:rounded-xl
                  prose-img:shadow-lg
                "
                dangerouslySetInnerHTML={{ __html: post.conteudo }}
              />
            </motion.div>

            {/* Posts Relacionados */}
            {relatedPosts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-16 pt-8 border-t"
              >
                <h2 className="text-2xl font-bold mb-6">Posts Relacionados</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <div
                      key={relatedPost.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                    >
                      <div className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 overflow-hidden">
                          <img
                            src={relatedPost.imagem_url || '/placeholder.svg'}
                            alt={relatedPost.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <Badge variant="outline" className="mb-2 text-xs">
                            {relatedPost.categoria}
                          </Badge>
                          <h3 className="font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {relatedPost.titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {relatedPost.resumo}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{relatedPost.tempo_leitura} min</span>
                            <span>•</span>
                            <span>{relatedPost.visualizacoes} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </article>
      </Layout>
    </>
  );
};

export default BlogPost;

