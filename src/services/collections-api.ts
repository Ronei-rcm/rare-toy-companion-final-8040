import { Collection, CreateCollectionData, UpdateCollectionData } from '@/types/collection';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const collectionsApi = {
  async getCollections(): Promise<Collection[]> {
    const response = await fetch(`${API_BASE_URL}/collections`);
    if (!response.ok) {
      throw new Error('Erro ao carregar coleções');
    }
    return response.json();
  },

  async getCollection(id: string): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao carregar coleção');
    }
    return response.json();
  },

  async createCollection(data: CreateCollectionData): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao criar coleção');
    }
    return response.json();
  },

  async updateCollection(id: string, data: UpdateCollectionData): Promise<Collection> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar coleção');
    }
    return response.json();
  },

  async deleteCollection(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/collections/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Erro ao deletar coleção');
    }
  },

  async reorderCollections(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/collections/reorder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Erro ao reordenar coleções');
    }
  }
};