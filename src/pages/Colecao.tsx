import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Heart, ShoppingCart, Settings, Eye, EyeOff } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import CollectionManager from '@/components/admin/CollectionManager';
import collectionImage from '@/assets/vintage-collection-1.jpg';

const Colecao = () => {
  const { collections, loading, refetch } = useCollections();
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

  // Coleções de exemplo como fallback
  const colecoesExemplo = [
    {
      id: '1',
      nome: 'Safari Aventura',
      descricao: 'Explore o mundo selvagem com nossa coleção de animais da savana',
      imagem: collectionImage,
      produtos: 12,
      preco: 'R$ 89,90 - R$ 299,90',
      destaque: true,
      status: 'ativo' as const,
      tags: ['Animais', 'Natureza', 'Educativo'],
      ordem: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      nome: 'Floresta Encantada',
      descricao: 'Descubra a magia da natureza com animais da floresta',
      imagem: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=300&fit=crop',
      produtos: 8,
      preco: 'R$ 65,90 - R$ 199,90',
      destaque: false,
      status: 'ativo' as const,
      tags: ['Floresta', 'Mágico', 'Aventura'],
      ordem: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      nome: 'Sabores Artesanais',
      descricao: 'Produtos gourmet selecionados para experiências únicas',
      imagem: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop',
      produtos: 15,
      preco: 'R$ 29,90 - R$ 159,90',
      destaque: true,
      status: 'ativo' as const,
      tags: ['Gourmet', 'Artesanal', 'Premium'],
      ordem: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Usar coleções da API ou fallback
  const colecoes = loading ? [] : (collections.length > 0 ? collections : colecoesExemplo);

  return (
    <Layout>
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
                <section className="py-16 px-6">
                  <div className="container max-w-6xl mx-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Carregando coleções...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {colecoes.filter(c => c.status === 'ativo').map((colecao) => (
                          <Card key={colecao.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="relative">
                              <img 
                                src={colecao.imagem} 
                                alt={colecao.nome}
                                className="w-full h-48 object-cover"
                              />
                              {colecao.destaque && (
                                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                                  <Star className="w-3 h-3 mr-1" />
                                  Destaque
                                </Badge>
                              )}
                              <Button
                                size="icon"
                                variant="outline"
                                className="absolute top-4 right-4 bg-card/80 hover:bg-card"
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <CardContent className="p-6">
                              <h3 className="text-2xl font-bold text-foreground mb-3">
                                {colecao.nome}
                              </h3>
                              <p className="text-muted-foreground mb-4 leading-relaxed">
                                {colecao.descricao}
                              </p>
                              
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-muted-foreground">
                                  {colecao.produtos} produtos
                                </span>
                                <span className="font-semibold text-foreground">
                                  {colecao.preco}
                                </span>
                              </div>

                              {colecao.tags && colecao.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-4">
                                  {colecao.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {colecao.tags.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{colecao.tags.length - 3} mais
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              <Button className="w-full">
                                <ShoppingCart className="w-4 h-4 mr-2" />
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
                    >
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
            <section className="py-16 px-6">
              <div className="container max-w-6xl mx-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Carregando coleções...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {colecoes.filter(c => c.status === 'ativo').map((colecao) => (
                      <Card key={colecao.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                        <div className="relative">
                          <img 
                            src={colecao.imagem} 
                            alt={colecao.nome}
                            className="w-full h-48 object-cover"
                          />
                          {colecao.destaque && (
                            <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                              <Star className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            className="absolute top-4 right-4 bg-card/80 hover:bg-card"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold text-foreground mb-3">
                            {colecao.nome}
                          </h3>
                          <p className="text-muted-foreground mb-4 leading-relaxed">
                            {colecao.descricao}
                          </p>
                          
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">
                              {colecao.produtos} produtos
                            </span>
                            <span className="font-semibold text-foreground">
                              {colecao.preco}
                            </span>
                          </div>

                          {colecao.tags && colecao.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {colecao.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {colecao.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{colecao.tags.length - 3} mais
                                </span>
                              )}
                            </div>
                          )}
                          
                          <Button className="w-full">
                            <ShoppingCart className="w-4 h-4 mr-2" />
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
                >
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