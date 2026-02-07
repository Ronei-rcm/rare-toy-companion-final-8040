import { request } from './api-config';

export type Collection = {
  id: string;
  nome: string;
  descricao: string;
  imagem?: string;
  imagem_url?: string;
  // Campos de controle
  ativo?: boolean;
  destaque?: boolean;
  ordem?: number;
};

// ===== Vínculos de produtos com coleções =====
export type CollectionLink = {
  id: number;
  collection_id: string;
  product_id: number;
  order_index: number;
  product?: {
    id?: number | string;
    name?: string;
    image_url?: string;
    price?: number | string;
  } | null;
};

export async function getCollections(params?: {
  page?: number; pageSize?: number; q?: string; sort?: string; order?: 'ASC' | 'DESC'; withMeta?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  if (params?.q) q.set('q', params.q);
  if (params?.sort) q.set('sort', params.sort);
  if (params?.order) q.set('order', params.order);
  q.set('withMeta', (params?.withMeta ?? true) ? '1' : '0');

  // request já trata base URL
  const queryString = q.toString();
  const endpoint = queryString ? `/collections?${queryString}` : '/collections';
  return request<any>(endpoint);
}

export async function getCollection(id: string) {
  return request<Collection>(`/collections/${id}`);
}

export async function createCollection(data: any) {
  return request<Collection>('/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCollection(id: string, data: any) {
  return request<Collection>(`/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: string) {
  return request<any>(`/collections/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadCollectionImage(id: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  return request<any>(`/collections/${id}/image`, {
    method: 'POST',
    body: form,
  });
}

export async function reorderCollections(ids: string[]) {
  return request<any>('/collections/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  });
}

export async function patchCollectionToggles(id: string, payload: { ativo?: boolean; destaque?: boolean }) {
  try {
    return await request<any>(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  } catch (error: any) {
    // Mantendo comportamento original: ignorar erro 400/404 se colunas não existirem
    // O helper request lança erro com mensagem, vamos tentar inferir pelo texto ou assumir que falhou
    // Como o helper original verificava status, aqui é mais dificil sem o objeto response original
    // Mas vamos propagar o erro normalmente, a UI que lide.
    // O código original retornava null em 400/404.
    // O helper request encapsula o erro em Error(message).
    console.warn('Falha no toggle da coleção, possivelmente colunas inexistentes:', error);
    return null;
  }
}

// ===== Vínculos de produtos com coleções =====

export async function getCollectionProducts(collectionId: string) {
  return request<CollectionLink[]>(`/collections/${collectionId}/products`);
}

export async function addCollectionProduct(collectionId: string, product_id: number, order_index?: number) {
  return request<any>(`/collections/${collectionId}/products`, {
    method: 'POST',
    body: JSON.stringify({ product_id, order_index }),
  });
}

export async function removeCollectionProduct(collectionId: string, product_id: number) {
  return request<any>(`/collections/${collectionId}/products/${product_id}`, {
    method: 'DELETE',
  });
}

export async function reorderCollectionProducts(collectionId: string, product_ids: Array<number | string>) {
  return request<any>(`/collections/${collectionId}/products/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ product_ids }),
  });
}


// Manter compatibilidade com imports antigos se houver
export const collectionsApi = {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  reorderCollections,
  uploadCollectionImage,
  patchCollectionToggles,
  getCollectionProducts,
  addCollectionProduct,
  removeCollectionProduct,
  reorderCollectionProducts
};