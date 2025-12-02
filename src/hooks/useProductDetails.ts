import { useState, useEffect } from 'react';

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
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/produtos/${productId}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }

        const data = await response.json();
        
        // Normalizar dados do produto
        const normalizedProduct: Product = {
          id: data.id || productId,
          nome: data.nome || data.name || '',
          preco: parseFloat(data.preco || data.preco || 0),
          preco_original: data.preco_original || data.precoOriginal || data.preco_antigo,
          descricao: data.descricao || data.description || '',
          imagem_url: data.imagem_url || data.imagemUrl || data.imagem || '',
          estoque: parseInt(data.estoque || data.stock || 0),
          categoria: data.categoria || data.category || '',
          avaliacao: data.avaliacao || data.rating || data.avaliacao_media,
          total_avaliacoes: data.total_avaliacoes || data.totalAvaliacoes || data.reviews_count,
          promocao: data.promocao || data.onSale || false,
          destaque: data.destaque || data.featured || false,
          lancamento: data.lancamento || data.new || data.novo || false,
          faixa_etaria: data.faixa_etaria || data.ageRange || data.idade_recomendada,
          peso: data.peso || data.weight,
          dimensoes: data.dimensoes || data.dimensions,
          material: data.material || data.materials,
          marca: data.marca || data.brand,
          fornecedor: data.fornecedor || data.supplier
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

  return { product, loading, error, refetch: () => {
    if (productId) {
      setLoading(true);
      // Recarregar será feito pelo useEffect
    }
  }};
}

