import { Collection, CreateCollectionData, UpdateCollectionData } from '@/types/collection';

import { API_BASE_URL, handleApiResponse } from './api-config';

export const collectionsApi = {
  async getCollections(): Promise<Collection[]> {
    const response = await fetch(`${API_BASE_URL}/collections`, { credentials: 'include' });
    return handleApiResponse<Collection[]>(response, 'Erro ao carregar coleções');
  },

  async getCollection(id: string): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, { credentials: 'include' });
    return handleApiResponse<Collection>(response, 'Erro ao carregar coleção');
  },

  async createCollection(data: CreateCollectionData): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleApiResponse<Collection>(response, 'Erro ao criar coleção');
  },

  async updateCollection(id: string, data: UpdateCollectionData): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    return handleApiResponse<Collection>(response, 'Erro ao atualizar coleção');
  },

  async deleteCollection(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    await handleApiResponse<void>(response, 'Erro ao deletar coleção');
  },

  async reorderCollections(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/collections/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
      credentials: 'include'
    });
    await handleApiResponse<void>(response, 'Erro ao reordenar coleções');
  }
};