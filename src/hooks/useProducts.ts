import { useState, useEffect } from 'react';
import { Produto } from '@/types/produto';
import { productsApi, CreateProductData, UpdateProductData } from '@/services/products-api';
import { productsService } from '@/services/products';
import { getCollectionProducts } from '@/api/collections-api';

export const useProducts = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar todos os produtos
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: Produto[] = [];
      try {
        data = await productsApi.getProducts();
      } catch (e) {
        data = await productsService.getProducts();
      }
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos na inicialização
  useEffect(() => {
    loadProducts();
  }, []);

  // Criar produto
  const createProduct = async (productData: CreateProductData): Promise<Produto | null> => {
    try {
      setLoading(true);
      setError(null);
      const newProduct = await productsApi.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      setError('Erro ao criar produto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar produto
  const updateProduct = async (id: string, productData: Partial<CreateProductData>): Promise<Produto | null> => {
    try {
      setLoading(true);
      setError(null);
      const updatedProduct = await productsApi.updateProduct(id, productData);
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? updatedProduct : product
        )
      );
      return updatedProduct;
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setError('Erro ao atualizar produto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Deletar produto
  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await productsApi.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      return true;
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      setError('Erro ao deletar produto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Buscar produto por ID
  const getProduct = async (id: string): Promise<Produto | null> => {
    try {
      setError(null);
      return await productsApi.getProduct(id);
    } catch (err) {
      console.error('Erro ao buscar produto:', err);
      setError('Erro ao buscar produto');
      return null;
    }
  };

  // Buscar produtos por categoria
  const getProductsByCategory = async (categoria: string): Promise<Produto[]> => {
    try {
      setError(null);
      return await productsApi.getProductsByCategory(categoria);
    } catch (err) {
      console.error('Erro ao buscar produtos por categoria:', err);
      setError('Erro ao buscar produtos por categoria');
      return [];
    }
  };

  // Buscar produtos em destaque
  const getFeaturedProducts = async (): Promise<Produto[]> => {
    try {
      setError(null);
      try {
        return await productsApi.getFeaturedProducts();
      } catch (e) {
        return await productsService.getFeaturedProducts();
      }
    } catch (err) {
      console.error('Erro ao buscar produtos em destaque:', err);
      setError('Erro ao buscar produtos em destaque');
      return [];
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    getProductsByCategory,
    getFeaturedProducts,
  };
};

// Hook dedicado para produtos em destaque, usado em seções como ProdutosDestaque
export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        let data: Produto[] = [];
        try {
          data = await productsApi.getFeaturedProducts();
        } catch (e) {
          data = await productsService.getFeaturedProducts();
        }
        if (mounted) setProducts(data);
      } catch (err) {
        console.error('Erro ao carregar produtos em destaque:', err);
        if (mounted) setError('Erro ao carregar produtos em destaque');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return { products, loading, error };
};

// Hook: produtos por coleção (via nova API)
export const useProductsByCollection = (collectionId: string) => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!collectionId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await getCollectionProducts(collectionId);
        // Transformar os dados da nova API para o formato esperado
        const produtos = data
          .filter(item => item.product) // Apenas itens com produto válido
          .map(item => ({
            id: item.product.id,
            nome: item.product.nome,
            descricao: item.product.descricao,
            preco: item.product.preco,
            categoria: item.product.categoria,
            imagemUrl: item.product.imagem_url,
            estoque: item.product.estoque,
            status: item.product.status,
            destaque: item.product.destaque,
            promocao: item.product.promocao,
            lancamento: item.product.lancamento,
            avaliacao: item.product.avaliacao,
            totalAvaliacoes: item.product.total_avaliacoes,
            faixaEtaria: item.product.faixa_etaria,
            peso: item.product.peso,
            dimensoes: item.product.dimensoes,
            material: item.product.material,
            marca: item.product.marca,
            origem: item.product.origem,
            fornecedor: item.product.fornecedor,
            codigoBarras: item.product.codigo_barras,
            dataLancamento: item.product.data_lancamento,
            createdAt: item.product.created_at,
            updatedAt: item.product.updated_at
          }));
        if (mounted) setProducts(produtos);
      } catch (err) {
        console.error('Erro ao carregar produtos da coleção:', err);
        if (mounted) setError('Erro ao carregar produtos da coleção');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [collectionId]);

  return { products, loading, error };
};

// Hook: produtos em promoção (via Supabase service)
export const usePromotionProducts = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsService.getPromotionProducts();
        if (mounted) setProducts(data);
      } catch (err) {
        console.error('Erro ao carregar produtos em promoção:', err);
        if (mounted) setError('Erro ao carregar produtos em promoção');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return { products, loading, error };
};

// Hook: novos produtos (via Supabase service)
export const useNewProducts = () => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsService.getNewProducts();
        if (mounted) setProducts(data);
      } catch (err) {
        console.error('Erro ao carregar lançamentos:', err);
        if (mounted) setError('Erro ao carregar lançamentos');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return { products, loading, error };
};

// Hook: relacionados por produto (via Supabase service)
export const useRelatedProducts = (productId: string, limit: number = 4) => {
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await productsService.getRelatedProducts(productId, limit);
        if (mounted) setProducts(data);
      } catch (err) {
        console.error('Erro ao carregar produtos relacionados:', err);
        if (mounted) setError('Erro ao carregar produtos relacionados');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [productId, limit]);

  return { products, loading, error };
};