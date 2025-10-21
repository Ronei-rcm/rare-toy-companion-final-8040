
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useScrollAnimation, getAnimationClass } from '@/lib/animation';
import ProdutoInfo from '@/components/loja/ProdutoInfo';
import ProdutoImageGallery from '@/components/loja/ProdutoImageGallery';
import ProdutoAvaliacoes from '@/components/loja/ProdutoAvaliacoes';
import ProdutosRelacionados from '@/components/loja/ProdutosRelacionados';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ProdutoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const animation = useScrollAnimation();
  
  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Início</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/loja">Loja</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Produto</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </motion.div>
        
        <div className="flex gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/loja')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para Loja
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/colecao')}
          >
            <Package className="h-4 w-4 mr-1" />
            Ver Coleções
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div 
            ref={animation.ref}
            className={getAnimationClass(animation.isInView)}
          >
            <ProdutoImageGallery produtoId={id} />
          </div>
          
          <div className={getAnimationClass(animation.isInView, 'slide-up')}>
            <ProdutoInfo produtoId={id} />
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-orange-800">O que nossos clientes dizem</h2>
          <ProdutoAvaliacoes produtoId={id} />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6 text-orange-800">Você também pode gostar</h2>
          <ProdutosRelacionados produtoId={id} />
        </div>
      </div>
    </Layout>
  );
};

export default ProdutoDetalhe;
