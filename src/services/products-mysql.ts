import { mysqlClient } from '@/integrations/mysql/client';
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
    try {
      const data = await mysqlClient.select<DatabaseProduct>(
        'products',
        '*',
        { status: 'ativo' },
        'created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Get featured products
  async getFeaturedProducts(): Promise<Produto[]> {
    try {
      const data = await mysqlClient.select<DatabaseProduct>(
        'products',
        '*',
        { destaque: true, status: 'ativo' },
        'created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Get products on sale
  async getPromotionProducts(): Promise<Produto[]> {
    try {
      const data = await mysqlClient.select<DatabaseProduct>(
        'products',
        '*',
        { promocao: true, status: 'ativo' },
        'created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error fetching promotion products:', error);
      return [];
    }
  },

  // Get new products
  async getNewProducts(): Promise<Produto[]> {
    try {
      const data = await mysqlClient.select<DatabaseProduct>(
        'products',
        '*',
        { lancamento: true, status: 'ativo' },
        'created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error fetching new products:', error);
      return [];
    }
  },

  // Get product by ID
  async getProductById(id: string): Promise<Produto | null> {
    try {
      const data = await mysqlClient.single<DatabaseProduct>(
        'products',
        '*',
        { id, status: 'ativo' }
      );
      return data ? transformProduct(data) : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get products by collection
  async getProductsByCollection(collectionId: string): Promise<Produto[]> {
    try {
      const data = await mysqlClient.join<DatabaseProduct>(
        'products',
        'product_collections',
        'products.id = product_collections.product_id',
        'products.*',
        { 'product_collections.collection_id': collectionId, 'products.status': 'ativo' },
        'products.created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error fetching products by collection:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(searchTerm: string): Promise<Produto[]> {
    try {
      const data = await mysqlClient.search<DatabaseProduct>(
        'products',
        ['nome', 'categoria', 'descricao'],
        searchTerm,
        { status: 'ativo' },
        'created_at DESC'
      );
      return data.map(transformProduct);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Get related products (same category)
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Produto[]> {
    try {
      // First get the current product to know its category
      const product = await this.getProductById(productId);
      if (!product) return [];

      const data = await mysqlClient.select<DatabaseProduct>(
        'products',
        '*',
        { categoria: product.categoria, status: 'ativo' },
        'created_at DESC',
        limit + 1 // Get one extra to filter out the current product
      );

      // Filter out the current product and limit results
      return data
        .filter(p => p.id !== productId)
        .slice(0, limit)
        .map(transformProduct);
    } catch (error) {
      console.error('Error fetching related products:', error);
      return [];
    }
  },

  // Get all collections
  async getCollections(): Promise<DatabaseCollection[]> {
    try {
      const data = await mysqlClient.select<DatabaseCollection>(
        'collections',
        '*',
        undefined,
        'created_at DESC'
      );
      return data;
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  // Get carousel items
  async getCarouselItems(): Promise<DatabaseCarouselItem[]> {
    try {
      const data = await mysqlClient.select<DatabaseCarouselItem>(
        'carousel_items',
        '*',
        { active: true },
        'order_index ASC'
      );
      return data;
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      return [];
    }
  },

  // Create product (admin function)
  async createProduct(product: Partial<DatabaseProduct>): Promise<Produto | null> {
    try {
      const data = await mysqlClient.insert<DatabaseProduct>('products', {
        id: crypto.randomUUID(),
        nome: product.nome || '',
        descricao: product.descricao,
        preco: product.preco || 0,
        imagem_url: product.imagem_url,
        categoria: product.categoria || '',
        estoque: product.estoque || 0,
        status: product.status || 'ativo',
        destaque: product.destaque || false,
        promocao: product.promocao || false,
        lancamento: product.lancamento || false,
        avaliacao: product.avaliacao,
        total_avaliacoes: product.total_avaliacoes || 0,
        faixa_etaria: product.faixa_etaria,
        peso: product.peso,
        dimensoes: product.dimensoes,
        material: product.material,
        marca: product.marca,
        origem: product.origem,
        fornecedor: product.fornecedor,
        codigo_barras: product.codigo_barras,
        data_lancamento: product.data_lancamento,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return transformProduct(data);
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  },

  // Update product (admin function)
  async updateProduct(id: string, product: Partial<DatabaseProduct>): Promise<Produto | null> {
    try {
      await mysqlClient.update(
        'products',
        {
          ...product,
          updated_at: new Date().toISOString(),
        },
        { id }
      );
      return this.getProductById(id);
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  },

  // Delete product (admin function)
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await mysqlClient.delete('products', { id });
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  },
};
