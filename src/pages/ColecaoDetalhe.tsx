
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import CatalogoBrinquedos from '@/components/loja/CatalogoBrinquedos';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import { ChevronLeft, ShoppingCart, Package, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getCollection, getCollectionProducts } from '@/services/collections-api';
import { resolveImage } from '@/utils/resolveImage';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ColecaoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const animation = useScrollAnimation();

  const [colecao, setColecao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da coleção
  useEffect(() => {
    const carregarColecao = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const [colecaoData, produtosData] = await Promise.all([
          getCollection(id),
          getCollectionProducts(id)
        ]);

        setColecao({
          ...colecaoData,
          produtos: produtosData.length
        });
      } catch (err) {
        console.error('Erro ao carregar coleção:', err);
        setError('Erro ao carregar coleção');
      } finally {
        setLoading(false);
      }
    };

    carregarColecao();
  }, [id]);

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-slate-600 hover:text-orange-600">Início</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/colecao" className="text-slate-600 hover:text-orange-600">Coleções</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink className="text-orange-600 font-medium">{colecao?.nome || 'Detalhes'}</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </motion.div>

          {loading ? (
            <div className="space-y-8">
              <div className="flex gap-2 mb-6">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
                <Skeleton className="w-full md:w-1/3 h-64 rounded-lg" />
                <div className="w-full md:w-2/3 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-14" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-lg" />
              <Separator className="my-8" />
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-xl" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4 text-red-600">Erro ao carregar coleção</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : colecao ? (
            <>
              {/* Hero Section da Coleção */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-16"
              >
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => navigate('/colecao')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Voltar para Coleções
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => navigate('/loja')}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Ir para Loja
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-amber-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                    <img
                      src={resolveImage(colecao.imagem || colecao.imagem_url)}
                      alt={colecao.nome}
                      className="relative w-full h-[500px] object-cover rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-700"
                    />
                    {colecao.destaque && (
                      <div className="absolute top-6 left-6">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center shadow-lg">
                          <Star className="w-4 h-4 mr-2" />
                          Coleção em Destaque
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 text-sm font-medium mb-6">
                        <Star className="w-4 h-4 mr-2" />
                        Coleção Especial
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-6 leading-tight">
                        {colecao.nome}
                      </h1>
                      <p className="text-xl text-slate-600 leading-relaxed">
                        {colecao.descricao}
                      </p>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex items-center text-slate-600">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center mr-4">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-800">{colecao.produtos || 0}</div>
                          <div className="text-sm text-slate-500">Produtos únicos</div>
                        </div>
                      </div>
                    </div>

                    {colecao.tags && colecao.tags.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">Tags da Coleção</h3>
                        <div className="flex flex-wrap gap-3">
                          {colecao.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 text-sm font-medium rounded-full border border-orange-200 hover:shadow-md transition-all duration-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 my-12 border border-orange-100 shadow-xl"
                >
                  <div className="text-center max-w-3xl mx-auto">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Coleção Curada com Cuidado</h3>
                    <p className="text-lg text-slate-600 leading-relaxed italic">
                      "Cada peça desta coleção foi selecionada com extremo cuidado para garantir autenticidade e
                      preservar a história destes brinquedos icônicos. Ideal para colecionadores exigentes que
                      valorizam qualidade e originalidade."
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Seção de Produtos */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="space-y-8"
              >
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text text-transparent mb-4">
                    Produtos da Coleção
                  </h2>
                  <p className="text-lg text-slate-600">
                    Explore os tesouros únicos desta coleção especial
                  </p>
                </div>

                <CatalogoBrinquedos colecaoId={id} />
              </motion.div>
            </>
          ) : (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Coleção não encontrada</h1>
              <p className="text-muted-foreground mb-6">A coleção que você está procurando não existe ou foi removida.</p>
              <Button
                onClick={() => navigate('/colecao')}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Ver Todas as Coleções
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ColecaoDetalhe;
