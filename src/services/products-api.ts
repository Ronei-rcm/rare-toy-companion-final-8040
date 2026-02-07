import { Produto } from '@/types/produto';
import { API_BASE_URL, handleApiResponse } from './api-config';

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
      const response = await fetch(`${API_BASE_URL}/produtos`, { credentials: 'include' });

      const data = await handleApiResponse<Produto[]>(response, 'Erro ao buscar produtos');
      console.log('✅ Produtos carregados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
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

    const url = `${API_BASE_URL}/produtos?${qs.toString()}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await handleApiResponse<any>(response);
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
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, { credentials: 'include' });

      const data = await handleApiResponse<Produto>(response, 'Erro ao buscar produto');
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
      const response = await fetch(`${API_BASE_URL}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await handleApiResponse<Produto>(response, 'Erro ao criar produto');
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
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const data = await handleApiResponse<Produto>(response, 'Erro ao atualizar produto');
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
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
        method: 'DELETE',
      });

      await handleApiResponse<void>(response, 'Erro ao deletar produto');

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
      const response = await fetch(`${API_BASE_URL}/produtos/categoria/${encodeURIComponent(categoria)}`);

      const data = await handleApiResponse<Produto[]>(response, 'Erro ao buscar produtos por categoria');
      console.log('✅ Produtos por categoria carregados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos por categoria:', error);
      throw error;
    }
  },

  // Buscar produtos em destaque
  async getFeaturedProducts(): Promise<Produto[]> {
    try {
      console.log('🔄 Buscando produtos em destaque...');
      const response = await fetch(`${API_BASE_URL}/produtos/destaque`);

      const data = await handleApiResponse<Produto[]>(response, 'Erro ao buscar produtos em destaque');
      console.log('✅ Produtos em destaque carregados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar produtos em destaque:', error);
      throw error;
    }
  },
};
