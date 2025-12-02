import React from 'react';
import ProductComparison from './ProductComparison';
import { useProductComparison } from '@/hooks/useProductComparison';

const ComparisonManager: React.FC = () => {
  const {
    comparisonProducts,
    removeFromComparison,
    clearComparison
  } = useProductComparison();

  return (
    <ProductComparison
      products={comparisonProducts}
      onRemove={removeFromComparison}
      onClear={clearComparison}
    />
  );
};

export default ComparisonManager;

