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

  // Get featured products
  async getFeaturedProducts(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('destaque', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }

    return data.map(transformProduct);
  },

  // Get products on sale
  async getPromotionProducts(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('promocao', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotion products:', error);
      return [];
    }

    return data.map(transformProduct);
  },

  // Get new products
  async getNewProducts(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('lancamento', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching new products:', error);
      return [];
    }

    return data.map(transformProduct);
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