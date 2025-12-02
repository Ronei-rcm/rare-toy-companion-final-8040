import { supabase } from '@/integrations/supabase/client';
import { Produto } from '@/types/produto';

export interface DatabaseProduct {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  imagem_url?: string;
  categoria: string;
  estoque: number;
  status: string;
  destaque: boolean;
  promocao: boolean;
  lancamento: boolean;
  avaliacao?: number;
  total_avaliacoes?: number;
  faixa_etaria?: string;
  peso?: string;
  dimensoes?: string;
  material?: string;
  marca?: string;
  origem?: string;
  fornecedor?: string;
  codigo_barras?: string;
  data_lancamento?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCollection {
  id: string;
  nome: string;
  descricao?: string;
  imagem_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Transform database product to frontend format
const transformProduct = (dbProduct: DatabaseProduct): Produto => ({
  id: dbProduct.id,
  nome: dbProduct.nome,
  descricao: dbProduct.descricao,
  preco: Number(dbProduct.preco),
  imagemUrl: dbProduct.imagem_url || '',
  categoria: dbProduct.categoria,
  estoque: dbProduct.estoque,
  status: dbProduct.status,
  destaque: dbProduct.destaque,
  promocao: dbProduct.promocao,
  lancamento: dbProduct.lancamento,
  avaliacao: dbProduct.avaliacao ? Number(dbProduct.avaliacao) : undefined,
  totalAvaliacoes: dbProduct.total_avaliacoes,
  faixaEtaria: dbProduct.faixa_etaria,
  peso: dbProduct.peso,
  dimensoes: dbProduct.dimensoes,
  material: dbProduct.material,
  marca: dbProduct.marca,
  origem: dbProduct.origem,
  fornecedor: dbProduct.fornecedor,
  codigoBarras: dbProduct.codigo_barras,
  dataLancamento: dbProduct.data_lancamento,
  emEstoque: dbProduct.estoque > 0,
});

export const productsService = {
  // Get all products
  async getProducts(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map(transformProduct);
  },

  // Get featured products (via REST API)
  async getFeaturedProducts(): Promise<Produto[]> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/produtos?featured=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Se retornar array, usar diretamente; se retornar objeto com items, usar items
      const products = Array.isArray(data) ? data : (data.items || []);
      return products.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        preco: Number(p.preco),
        imagemUrl: p.imagemUrl || p.imagem_url || '',
        categoria: p.categoria,
        estoque: p.estoque,
        status: p.status,
        destaque: p.destaque || false,
        promocao: p.promocao || false,
        lancamento: p.lancamento || false,
        avaliacao: p.avaliacao ? Number(p.avaliacao) : undefined,
        totalAvaliacoes: p.totalAvaliacoes || p.total_avaliacoes,
        faixaEtaria: p.faixaEtaria || p.faixa_etaria,
        peso: p.peso,
        dimensoes: p.dimensoes,
        material: p.material,
        marca: p.marca,
        origem: p.origem,
        fornecedor: p.fornecedor,
        codigoBarras: p.codigoBarras || p.codigo_barras,
        dataLancamento: p.dataLancamento || p.data_lancamento,
        emEstoque: (p.estoque || 0) > 0,
      }));
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Get products on sale (via REST API)
  async getPromotionProducts(): Promise<Produto[]> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/produtos?onSale=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Se retornar array, usar diretamente; se retornar objeto com items, usar items
      const products = Array.isArray(data) ? data : (data.items || []);
      return products.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        preco: Number(p.preco),
        imagemUrl: p.imagemUrl || p.imagem_url || '',
        categoria: p.categoria,
        estoque: p.estoque,
        status: p.status,
        destaque: p.destaque || false,
        promocao: p.promocao || false,
        lancamento: p.lancamento || false,
        avaliacao: p.avaliacao ? Number(p.avaliacao) : undefined,
        totalAvaliacoes: p.totalAvaliacoes || p.total_avaliacoes,
        faixaEtaria: p.faixaEtaria || p.faixa_etaria,
        peso: p.peso,
        dimensoes: p.dimensoes,
        material: p.material,
        marca: p.marca,
        origem: p.origem,
        fornecedor: p.fornecedor,
        codigoBarras: p.codigoBarras || p.codigo_barras,
        dataLancamento: p.dataLancamento || p.data_lancamento,
        emEstoque: (p.estoque || 0) > 0,
      }));
    } catch (error) {
      console.error('Error fetching promotion products:', error);
      return [];
    }
  },

  // Get new products (via REST API)
  async getNewProducts(): Promise<Produto[]> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_BASE_URL}/produtos?novo=true`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Se retornar array, usar diretamente; se retornar objeto com items, usar items
      const products = Array.isArray(data) ? data : (data.items || []);
      return products.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        descricao: p.descricao,
        preco: Number(p.preco),
        imagemUrl: p.imagemUrl || p.imagem_url || '',
        categoria: p.categoria,
        estoque: p.estoque,
        status: p.status,
        destaque: p.destaque || false,
        promocao: p.promocao || false,
        lancamento: p.lancamento || false,
        avaliacao: p.avaliacao ? Number(p.avaliacao) : undefined,
        totalAvaliacoes: p.totalAvaliacoes || p.total_avaliacoes,
        faixaEtaria: p.faixaEtaria || p.faixa_etaria,
        peso: p.peso,
        dimensoes: p.dimensoes,
        material: p.material,
        marca: p.marca,
        origem: p.origem,
        fornecedor: p.fornecedor,
        codigoBarras: p.codigoBarras || p.codigo_barras,
        dataLancamento: p.dataLancamento || p.data_lancamento,
        emEstoque: (p.estoque || 0) > 0,
      }));
    } catch (error) {
      console.error('Error fetching new products:', error);
      return [];
    }
  },

  // Get product by ID
  async getProductById(id: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return transformProduct(data);
  },

  // Get products by collection
  async getProductsByCollection(collectionId: string): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('product_collections')
      .select(`
        products (*)
      `)
      .eq('collection_id', collectionId);

    if (error) {
      console.error('Error fetching products by collection:', error);
      return [];
    }

    return data
      .map((item: any) => item.products)
      .filter(Boolean)
      .map(transformProduct);
  },

  // Search products
  async searchProducts(searchTerm: string): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`nome.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%,descricao.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return data.map(transformProduct);
  },

  // Get related products (same category)
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Produto[]> {
    // First get the current product to know its category
    const product = await this.getProductById(productId);
    if (!product) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('categoria', product.categoria)
      .neq('id', productId)
      .limit(limit);

    if (error) {
      console.error('Error fetching related products:', error);
      return [];
    }

    return data.map(transformProduct);
  },

  // Get all collections
  async getCollections(): Promise<DatabaseCollection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching collections:', error);
      return [];
    }

    return data;
  },

  // Get carousel items
  async getCarouselItems(): Promise<DatabaseCarouselItem[]> {
    const { data, error } = await supabase
      .from('carousel_items')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching carousel items:', error);
      return [];
    }

    return data;
  },
};