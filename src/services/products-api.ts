import { Produto } from '@/types/produto';
import { request, ApiError } from './api-config';
import { MOCK_PRODUCTS } from './fallback-data';

export interface CreateProductData {
  nome: string;
  descricao?: string;
  preco: number;
  imagemUrl?: string;
  imagens?: string[];
  categoria: string;
  estoque: number;
  status?: 'ativo' | 'inativo' | 'esgotado';
  destaque?: boolean;
  promocao?: boolean;
  lancamento?: boolean;
  novo?: boolean;
  seminovo?: boolean;
  avaliacao?: number;
  totalAvaliacoes?: number;
  faixaEtaria?: string;
  peso?: string;
  dimensoes?: string;
  material?: string;
  marca?: string;
  origem?: string;
  fornecedor?: string;
  codigoBarras?: string;
  dataLancamento?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}

export const productsApi = {
  // Buscar todos os produtos
  async getProducts(): Promise<Produto[]> {
    try {
      console.log('🔄 Buscando produtos...');
      const data = await request<any>('/produtos');
      if (Array.isArray(data)) return data;
      if (data && data.items && Array.isArray(data.items)) return data.items;
      if (data && data.data && Array.isArray(data.data)) return data.data;
      if (data && data.produtos && Array.isArray(data.produtos)) return data.produtos;
      console.warn('⚠️ [productsApi] Resposta de produtos inesperada:', data);
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);

      // Se for erro de CORS, usar dados mockados
      if (error instanceof ApiError && error.data?.corsError) {
        console.warn('📦 Usando dados mockados de produtos (CORS bloqueado)');
        return MOCK_PRODUCTS as unknown as Produto[];
      }

      throw error;
    }
  },

  // Buscar produtos paginados (admin)
  async getProductsPaged(params: {
    page: number;
    pageSize: number;
    search?: string;
    categoria?: string;
    sort?: 'created_at_desc' | 'created_at_asc' | 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc';
    inStock?: boolean;
    onSale?: boolean;
    featured?: boolean;
    novo?: boolean;
  }): Promise<{ items: Produto[]; total: number; page: number; pageSize: number }> {
    const qs = new URLSearchParams();
    qs.set('page', String(params.page));
    qs.set('pageSize', String(params.pageSize));
    if (params.search) qs.set('search', params.search);
    if (params.categoria) qs.set('categoria', params.categoria);
    if (params.sort) qs.set('sort', params.sort);
    if (params.inStock) qs.set('inStock', 'true');
    if (params.onSale) qs.set('onSale', 'true');
    if (params.featured) qs.set('featured', 'true');
    if (params.novo) qs.set('novo', 'true');

    const data = await request<any>(`/produtos?${qs.toString()}`);
    // Se o backend retornar array (fallback), embrulhar no formato paginado
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: params.page,
        pageSize: params.pageSize,
      };
    }
    return data;
  },

  // Buscar produto por ID
  async getProduct(id: string): Promise<Produto> {
    try {
      console.log('🔄 Buscando produto:', id);
      const data = await request<Produto>(`/produtos/${id}`);
      console.log('✅ Produto carregado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar produto:', error);
      throw error;
    }
  },

  // Criar novo produto
  async createProduct(productData: CreateProductData): Promise<Produto> {
    try {
      console.log('🔄 Criando produto:', productData.nome);
      const data = await request<Produto>('/produtos', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      console.log('✅ Produto criado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar produto:', error);
      throw error;
    }
  },

  // Atualizar produto
  async updateProduct(id: string, productData: Partial<CreateProductData>): Promise<Produto> {
    try {
      console.log('🔄 Atualizando produto:', id);
      const data = await request<Produto>(`/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      console.log('✅ Produto atualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Deletar produto
  async deleteProduct(id: string): Promise<void> {
    try {
      console.log('🔄 Deletando produto:', id);
      await request<void>(`/produtos/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ Produto deletado:', id);
    } catch (error) {
      console.error('❌ Erro ao deletar produto:', error);
      throw error;
    }
  },

  // Buscar produtos por categoria
  async getProductsByCategory(categoria: string): Promise<Produto[]> {
    try {
      console.log('🔄 Buscando produtos por categoria:', categoria);
      const data = await request<any>(`/produtos/categoria/${encodeURIComponent(categoria)}`);
      if (Array.isArray(data)) return data;
      if (data && data.items && Array.isArray(data.items)) return data.items;
      if (data && data.data && Array.isArray(data.data)) return data.data;
      if (data && data.produtos && Array.isArray(data.produtos)) return data.produtos;
      console.warn('⚠️ [productsApi] Resposta por categoria inesperada:', data);
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar produtos por categoria:', error);
      throw error;
    }
  },

  // Buscar produtos em destaque
  async getFeaturedProducts(): Promise<Produto[]> {
    try {
      console.log('🔄 Buscando produtos em destaque...');
      const data = await request<any>('/produtos/destaque');
      if (Array.isArray(data)) return data;
      if (data && data.items && Array.isArray(data.items)) return data.items;
      if (data && data.data && Array.isArray(data.data)) return data.data;
      if (data && data.produtos && Array.isArray(data.produtos)) return data.produtos;
      console.warn('⚠️ [productsApi] Resposta de destaque inesperada:', data);
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar produtos em destaque:', error);
      throw error;
    }
  },
};
