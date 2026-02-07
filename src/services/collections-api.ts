import { Collection, CreateCollectionData, UpdateCollectionData } from '@/types/collection';
import { request } from './api-config';

export const collectionsApi = {
  async getCollections(): Promise<Collection[]> {
    return request<Collection[]>('/collections');
  },

  async getCollection(id: string): Promise<Collection> {
    return request<Collection>(`/collections/${id}`);
  },

  async createCollection(data: CreateCollectionData): Promise<Collection> {
    return request<Collection>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCollection(id: string, data: UpdateCollectionData): Promise<Collection> {
    return request<Collection>(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteCollection(id: string): Promise<void> {
    return request<void>(`/collections/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderCollections(ids: string[]): Promise<void> {
    return request<void>('/collections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    });
  }
};