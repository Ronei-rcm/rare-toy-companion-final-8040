import { useState, useEffect, useCallback } from 'react';

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_original?: number;
  descricao?: string;
  imagem_url?: string;
  estoque: number;
  categoria?: string;
  avaliacao?: number;
  total_avaliacoes?: number;
  promocao?: boolean;
  destaque?: boolean;
  lancamento?: boolean;
}

const MAX_COMPARISON = 4;
const STORAGE_KEY = 'product_comparison';

export function useProductComparison() {
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const products = JSON.parse(stored);
        setComparisonProducts(products);
      }
    } catch (error) {
      console.error('Erro ao carregar comparação:', error);
    }
  }, []);

  // Salvar no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonProducts));
    } catch (error) {
      console.error('Erro ao salvar comparação:', error);
    }
  }, [comparisonProducts]);

  const addToComparison = useCallback((product: Product) => {
    setComparisonProducts(prev => {
      // Verificar se já está na lista
      if (prev.some(p => p.id === product.id)) {
        return prev;
      }
      
      // Verificar limite
      if (prev.length >= MAX_COMPARISON) {
        return prev;
      }
      
      return [...prev, product];
    });
  }, []);

  const removeFromComparison = useCallback((productId: string) => {
    setComparisonProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
  }, []);

  const isInComparison = useCallback((productId: string) => {
    return comparisonProducts.some(p => p.id === productId);
  }, [comparisonProducts]);

  const canAddMore = comparisonProducts.length < MAX_COMPARISON;

  return {
    comparisonProducts,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    canAddMore,
    count: comparisonProducts.length,
    maxCount: MAX_COMPARISON
  };
}

