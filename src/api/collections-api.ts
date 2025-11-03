export const API = (import.meta as any).env?.VITE_API_URL || '/api';

export type Collection = {
  id: string;
  nome: string;
  descricao: string;
  imagem?: string;
  imagem_url?: string;
};

export async function getCollections(params?: {
  page?: number; pageSize?: number; q?: string; sort?: string; order?: 'ASC'|'DESC'; withMeta?: boolean;
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.pageSize) q.set('pageSize', String(params.pageSize));
  if (params?.q) q.set('q', params.q);
  if (params?.sort) q.set('sort', params.sort);
  if (params?.order) q.set('order', params.order);
  q.set('withMeta', (params?.withMeta ?? true) ? '1' : '0');

  const res = await fetch(`${API}/collections?${q.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao listar coleções');
  return res.json();
}

export async function getCollection(id: string) {
  const res = await fetch(`${API}/collections/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar coleção');
  return res.json();
}

export async function createCollection(data: any) {
  const res = await fetch(`${API}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao criar coleção');
  return res.json();
}

export async function updateCollection(id: string, data: any) {
  const res = await fetch(`${API}/collections/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar coleção');
  return res.json();
}

export async function deleteCollection(id: string) {
  const res = await fetch(`${API}/collections/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Falha ao deletar coleção');
  return res.json();
}

export async function uploadCollectionImage(id: string, file: File) {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${API}/collections/${id}/image`, { method: 'POST', body: form, credentials: 'include' });
  if (!res.ok) throw new Error('Falha no upload da imagem');
  return res.json();
}

export async function reorderCollections(ids: string[]) {
  const res = await fetch(`${API}/collections/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Falha ao reordenar coleções');
  return res.json();
}

export async function patchCollectionToggles(id: string, payload: { ativo?: boolean; destaque?: boolean }) {
  const res = await fetch(`${API}/collections/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 400 || res.status === 404) {
      // Sem suporte às colunas ou coleção não encontrada; não bloquear o fluxo
      return null;
    }
    throw new Error('Falha ao atualizar toggles da coleção');
  }
  return res.json();
}

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

export async function getCollectionProducts(collectionId: string) {
  const res = await fetch(`${API}/collections/${collectionId}/products`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao listar produtos da coleção');
  return res.json() as Promise<CollectionLink[]>;
}

export async function addCollectionProduct(collectionId: string, product_id: number, order_index?: number) {
  const res = await fetch(`${API}/collections/${collectionId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ product_id, order_index }),
  });
  if (!res.ok) throw new Error('Falha ao vincular produto');
  return res.json();
}

export async function removeCollectionProduct(collectionId: string, product_id: number) {
  const res = await fetch(`${API}/collections/${collectionId}/products/${product_id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao remover produto da coleção');
  return res.json();
}

export async function reorderCollectionProducts(collectionId: string, product_ids: Array<number | string>) {
  const res = await fetch(`${API}/collections/${collectionId}/products/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ product_ids }),
  });
  if (!res.ok) throw new Error('Falha ao reordenar produtos da coleção');
  return res.json();
}


