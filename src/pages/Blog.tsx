import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Eye, Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  imagem_destaque: string;
  autor: string;
  categoria: string;
  publicado_em: string;
  visualizacoes: number;
  tempo_leitura: number;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        'https://muhlstore.re9suainternet.com.br/api/blog/posts'
      );

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredPosts = posts.filter((post) =>
    post.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.resumo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.categoria?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
            Blog MuhlStore
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Novidades, dicas e tudo sobre o mundo dos colecionáveis
          </p>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              {searchQuery ? 'Nenhum post encontrado' : 'Nenhum post publicado ainda'}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                    {/* Image */}
                    {post.imagem_destaque && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.imagem_destaque}
                          alt={post.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {post.categoria && (
                          <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white">
                            {post.categoria}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.titulo}
                      </h3>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {post.resumo}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.publicado_em)}
                        </div>
                        {post.tempo_leitura > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.tempo_leitura} min
                          </div>
                        )}
                        {post.visualizacoes > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.visualizacoes}
                          </div>
                        )}
                      </div>

                      {/* Read More */}
                      <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                        Ler mais
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}

