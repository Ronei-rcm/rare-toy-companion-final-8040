
import React, { useMemo } from 'react';
import ProdutoCard from './ProdutoCard';
import EmptyState from './EmptyState';
import { useProducts, useProductsByCollection, useFeaturedProducts, usePromotionProducts, useNewProducts } from '@/hooks/useProducts';
import { Produto } from '@/types/produto';
import { Skeleton } from '@/components/ui/skeleton';

export interface CatalogoBrinquedosProps {
  colecaoId?: string;
  filtroView?: string;
}

const CatalogoBrinquedos: React.FC<CatalogoBrinquedosProps> = ({ 
  colecaoId, 
  filtroView = 'todos' 
}) => {
  // Use appropriate hook based on filters
  const allProducts = useProducts();
  const collectionProducts = useProductsByCollection(colecaoId || '');
  const featuredProducts = useFeaturedProducts();
  const promotionProducts = usePromotionProducts();
  const newProducts = useNewProducts();

  // Select the right data source based on parameters
  const { products: rawProducts, loading, error } = useMemo(() => {
    if (colecaoId) {
      return collectionProducts;
    }
    
    switch (filtroView) {
      case 'destaques':
        return featuredProducts;
      case 'promocoes':
        return promotionProducts;
      case 'lancamentos':
        return newProducts;
      default:
        return allProducts;
    }
  }, [colecaoId, filtroView, allProducts, collectionProducts, featuredProducts, promotionProducts, newProducts]);

  const produtosFiltrados = rawProducts;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!produtosFiltrados || !Array.isArray(produtosFiltrados) || produtosFiltrados.length === 0) {
    return <EmptyState message="Nenhum produto encontrado nesta coleção." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {produtosFiltrados.map((produto) => (
        <ProdutoCard key={produto.id} produto={produto} />
      ))}
    </div>
  );
};

export default CatalogoBrinquedos;
