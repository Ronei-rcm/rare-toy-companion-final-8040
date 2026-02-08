import { useState, useEffect } from 'react';
import { productsApi } from '@/services/products-api';

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
  faixa_etaria?: string;
  peso?: string;
  dimensoes?: string;
  material?: string;
  marca?: string;
  fornecedor?: string;
}

export function useProductDetails(productId?: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await productsApi.getProduct(productId);

        // Normalizar dados do produto
        const normalizedProduct: Product = {
          id: data.id || productId,
          nome: data.nome || '',
          preco: data.preco || 0,
          preco_original: (data as any).preco_original || (data as any).preco_antigo,
          descricao: data.descricao || '',
          imagem_url: data.imagemUrl || (data as any).imagem_url || '',
          estoque: data.estoque || 0,
          categoria: data.categoria || '',
          avaliacao: data.avaliacao,
          total_avaliacoes: data.totalAvaliacoes,
          promocao: data.promocao || false,
          destaque: data.destaque || false,
          lancamento: data.lancamento || false,
          faixa_etaria: data.faixaEtaria,
          peso: data.peso,
          dimensoes: data.dimensoes,
          material: data.material,
          marca: data.marca,
          fornecedor: data.fornecedor
        };

        setProduct(normalizedProduct);
      } catch (err: any) {
        console.error('Erro ao carregar produto:', err);
        setError(err.message || 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  return {
    product,
    loading,
    error,
    refetch: () => {
      if (productId) {
        setLoading(true);
        // O efeito cuidará do recarregamento
      }
    }
  };
}
