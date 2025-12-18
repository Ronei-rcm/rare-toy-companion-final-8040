import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Package, Settings, Eye, AlertCircle, MessageCircle } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import CollectionManager from '@/components/admin/CollectionManager';
import { resolveImage, onImageError } from '@/utils/resolveImage';

const Colecao = () => {
  const navigate = useNavigate();
  const { collections, loading, error, refetch } = useCollections();
  const { user } = useCurrentUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Verificar se o usuário é admin (simulação - em produção viria do backend)
  useEffect(() => {
    // Por enquanto, vamos simular que o primeiro usuário é admin
    setIsAdmin(user?.id === '1' || user?.email === 'admin@exemplo.com' || localStorage.getItem('admin_token') !== null);
  }, [user]);

  // Refresh automático quando mudanças são feitas
  useEffect(() => {
    const handleStorageChange = async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    };

    window.addEventListener('collectionUpdated', handleStorageChange);
    return () => window.removeEventListener('collectionUpdated', handleStorageChange);
  }, [refetch]);

  // Normalizar dados das coleções da API
  const normalizarColecao = (colecao: any) => {
    // Mapear campos da API para o formato esperado
    const ativo = colecao.ativo !== undefined ? colecao.ativo : (colecao.status === 'ativo');
    const imagem = colecao.imagem_url || colecao.imagem || '';
    const produtos = colecao.total_produtos || colecao.produtos || 0;
    const tags = Array.isArray(colecao.tags) ? colecao.tags : (typeof colecao.tags === 'string' ? JSON.parse(colecao.tags || '[]') : []);
    
    return {
      id: colecao.id,
      nome: colecao.nome || 'Coleção sem nome',
      descricao: colecao.descricao || '',
      imagem,
      produtos,
      destaque: colecao.destaque || false,
      ativo,
      tags,
      ordem: colecao.ordem || 0,
      created_at: colecao.created_at,
      updated_at: colecao.updated_at
    };
  };

  // Normalizar todas as coleções
  const colecoesNormalizadas = collections.map(normalizarColecao);
  
  // Filtrar apenas coleções ativas
  const colecoesAtivas = colecoesNormalizadas.filter(c => c.ativo);

  // Função para navegar para detalhes da coleção
  const verColecao = (id: string) => {
    navigate(`/colecao/${id}`);
  };

  // Função para navegar para contato
  const irParaContato = () => {
    navigate('/suporte');
  };

  return (
    <Layout>
      <Helmet>
        <title>Coleções Exclusivas | Muhlstore</title>
        <meta 
          name="description" 
          content="Descubra produtos únicos e especiais, cuidadosamente selecionados para oferecer experiências extraordinárias e momentos inesquecíveis." 
        />
        <meta property="og:title" content="Coleções Exclusivas | Muhlstore" />
        <meta property="og:description" content="Descubra produtos únicos e especiais em nossas coleções exclusivas." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://muhlstore.re9suainternet.com.br/collection" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
        {isAdmin ? (
          // Modo Admin
          <div className="container mx-auto px-4 py-8">
            <Tabs defaultValue="view" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="view" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </TabsTrigger>
                <TabsTrigger value="manage" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Gerenciar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="view" className="mt-6">
                {/* Hero Section */}
                <section className="py-20 px-6">
                  <div className="container max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <h1 className="text-5xl font-bold text-foreground">
                        Nossa Coleção Exclusiva
                      </h1>
                      {isRefreshing && (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      )}
                    </div>
                    <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                      Descubra produtos únicos e especiais, cuidadosamente selecionados para oferecer 
                      experiências extraordinárias e momentos inesquecíveis.
                    </p>
                  </div>
                </section>

                {/* Collections Grid */}
                <section className="py-16 px-6" aria-label="Lista de coleções">
                  <div className="container max-w-6xl mx-auto">
                    {loading ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Card key={i} className="overflow-hidden">
                            <Skeleton className="w-full h-48" />
                            <CardContent className="p-6">
                              <Skeleton className="h-6 w-3/4 mb-3" />
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-4 w-2/3 mb-4" />
                              <Skeleton className="h-10 w-full" />
                            </CardContent>
                          </Card>
                        ))}
                        </div>
                    ) : error ? (
                      <Alert variant="destructive" className="max-w-2xl mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Erro ao carregar coleções: {error}. 
                          <Button 
                            variant="link" 
                            className="ml-2 p-0 h-auto"
                            onClick={() => refetch()}
                          >
                            Tentar novamente
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : colecoesAtivas.length === 0 ? (
                      <div className="text-center py-16">
                        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          Nenhuma coleção disponível
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Em breve teremos novas coleções exclusivas para você!
                        </p>
                        <Button onClick={() => navigate('/loja')} variant="outline">
                          Ver Produtos
                        </Button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {colecoesAtivas.map((colecao) => (
                          <Card 
                            key={colecao.id} 
                            className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                            role="article"
                            aria-label={`Coleção ${colecao.nome}`}
                          >
                            <div className="relative">
                              <img 
                                src={resolveImage(colecao.imagem)} 
                                alt={`Imagem da coleção ${colecao.nome}`}
                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={onImageError}
                                loading="lazy"
                              />
                              {colecao.destaque && (
                                <Badge 
                                  className="absolute top-4 left-4 bg-primary text-primary-foreground"
                                  aria-label="Coleção em destaque"
                                >
                                  <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                                  Destaque
                                </Badge>
                              )}
                            </div>
                            
                            <CardContent className="p-6">
                              <h3 className="text-2xl font-bold text-foreground mb-3">
                                {colecao.nome}
                              </h3>
                              {colecao.descricao && (
                                <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                                {colecao.descricao}
                              </p>
                              )}
                              
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Package className="w-4 h-4" aria-hidden="true" />
                                  {colecao.produtos} {colecao.produtos === 1 ? 'produto' : 'produtos'}
                                </span>
                              </div>

                              {colecao.tags && colecao.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4" role="list" aria-label="Tags da coleção">
                                  {colecao.tags.slice(0, 3).map(tag => (
                                    <Badge 
                                      key={tag} 
                                      variant="outline" 
                                      className="text-xs"
                                      role="listitem"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                  {colecao.tags.length > 3 && (
                                    <span className="text-xs text-muted-foreground" aria-label={`Mais ${colecao.tags.length - 3} tags`}>
                                      +{colecao.tags.length - 3} mais
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <Button 
                                className="w-full"
                                onClick={() => verColecao(colecao.id)}
                                aria-label={`Ver detalhes da coleção ${colecao.nome}`}
                              >
                                <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                                Ver Coleção
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Call to Action */}
                <section className="py-16 px-6 bg-gradient-to-r from-primary to-primary/80">
                  <div className="container max-w-4xl mx-auto text-center text-primary-foreground">
                    <h2 className="text-3xl font-bold mb-4">
                      Não encontrou o que procurava?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                      Entre em contato conosco para coleções personalizadas
                    </p>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      onClick={irParaContato}
                      aria-label="Ir para página de contato"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                      Fale Conosco
                    </Button>
                  </div>
                </section>
              </TabsContent>
              
              <TabsContent value="manage" className="mt-6">
                <CollectionManager />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          // Modo Usuário Normal
          <>
            {/* Hero Section */}
            <section className="py-20 px-6">
              <div className="container max-w-6xl mx-auto text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <h1 className="text-5xl font-bold text-foreground">
                    Nossa Coleção Exclusiva
                  </h1>
                  {isRefreshing && (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  )}
                </div>
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                  Descubra produtos únicos e especiais, cuidadosamente selecionados para oferecer 
                  experiências extraordinárias e momentos inesquecíveis.
                </p>
              </div>
            </section>

            {/* Collections Grid */}
            <section className="py-16 px-6" aria-label="Lista de coleções">
              <div className="container max-w-6xl mx-auto">
                {loading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="w-full h-48" />
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-3/4 mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3 mb-4" />
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                ) : error ? (
                  <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Erro ao carregar coleções: {error}. 
                      <Button 
                        variant="link" 
                        className="ml-2 p-0 h-auto"
                        onClick={() => refetch()}
                      >
                        Tentar novamente
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : colecoesAtivas.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Nenhuma coleção disponível
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Em breve teremos novas coleções exclusivas para você!
                    </p>
                    <Button onClick={() => navigate('/loja')} variant="outline">
                      Ver Produtos
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {colecoesAtivas.map((colecao) => (
                      <Card 
                        key={colecao.id} 
                        className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                        role="article"
                        aria-label={`Coleção ${colecao.nome}`}
                      >
                        <div className="relative">
                          <img 
                            src={resolveImage(colecao.imagem)} 
                            alt={`Imagem da coleção ${colecao.nome}`}
                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={onImageError}
                            loading="lazy"
                          />
                          {colecao.destaque && (
                            <Badge 
                              className="absolute top-4 left-4 bg-primary text-primary-foreground"
                              aria-label="Coleção em destaque"
                            >
                              <Star className="w-3 h-3 mr-1" aria-hidden="true" />
                              Destaque
                            </Badge>
                          )}
                        </div>
                        
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold text-foreground mb-3">
                            {colecao.nome}
                          </h3>
                          {colecao.descricao && (
                            <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                            {colecao.descricao}
                          </p>
                          )}
                          
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Package className="w-4 h-4" aria-hidden="true" />
                              {colecao.produtos} {colecao.produtos === 1 ? 'produto' : 'produtos'}
                            </span>
                          </div>

                          {colecao.tags && colecao.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4" role="list" aria-label="Tags da coleção">
                              {colecao.tags.slice(0, 3).map(tag => (
                                <Badge 
                                  key={tag} 
                                  variant="outline" 
                                  className="text-xs"
                                  role="listitem"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {colecao.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground" aria-label={`Mais ${colecao.tags.length - 3} tags`}>
                                  +{colecao.tags.length - 3} mais
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Button 
                            className="w-full"
                            onClick={() => verColecao(colecao.id)}
                            aria-label={`Ver detalhes da coleção ${colecao.nome}`}
                          >
                            <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                            Ver Coleção
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Call to Action */}
            <section className="py-16 px-6 bg-gradient-to-r from-primary to-primary/80">
              <div className="container max-w-4xl mx-auto text-center text-primary-foreground">
                <h2 className="text-3xl font-bold mb-4">
                  Não encontrou o que procurava?
                </h2>
                <p className="text-xl mb-8 opacity-90">
                  Entre em contato conosco para coleções personalizadas
                </p>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                  onClick={irParaContato}
                  aria-label="Ir para página de contato"
                >
                  <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                  Fale Conosco
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Colecao;