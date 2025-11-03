import { mysqlClient } from '@/integrations/mysql/client';
import { DatabaseCarouselItem } from '@/integrations/mysql/types';

export interface CarouselItem {
  id: string;
  nome: string;
  preco: string;
  precoOriginal?: string;
  imagem: string;
  badge: string;
  avaliacao: number;
  vendidos: number;
  descricao: string;
  ativo: boolean;
  order_index?: number;
}

// Transform database item to frontend format
const transformCarouselItem = (dbItem: DatabaseCarouselItem): CarouselItem => ({
  id: dbItem.id,
  nome: dbItem.titulo || '',
  preco: dbItem.preco || '',
  precoOriginal: dbItem.preco_original,
  imagem: dbItem.imagem_url || '',
  badge: dbItem.badge || 'Novo',
  avaliacao: dbItem.avaliacao || 5.0,
  vendidos: dbItem.vendidos || 0,
  descricao: dbItem.descricao || '',
  ativo: dbItem.ativo || false,
  order_index: dbItem.order_index || 0
});

// Transform frontend item to database format
const transformToDatabase = (item: CarouselItem): Partial<DatabaseCarouselItem> => ({
  id: item.id,
  titulo: item.nome,
  descricao: item.descricao,
  preco: item.preco,
  preco_original: item.precoOriginal,
  imagem_url: item.imagem,
  badge: item.badge,
  avaliacao: item.avaliacao,
  vendidos: item.vendidos,
  ativo: item.ativo,
  order_index: item.order_index || 0
});

export const carouselService = {
  // Get all carousel items
  async getCarouselItems(): Promise<CarouselItem[]> {
    try {
      const data = await mysqlClient.select<DatabaseCarouselItem>(
        'carousel_items',
        '*',
        {},
        'order_index ASC, created_at ASC'
      );
      return data.map(transformCarouselItem);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      return [];
    }
  },

  // Get active carousel items only
  async getActiveCarouselItems(): Promise<CarouselItem[]> {
    try {
      const data = await mysqlClient.select<DatabaseCarouselItem>(
        'carousel_items',
        '*',
        { ativo: true },
        'order_index ASC, created_at ASC'
      );
      return data.map(transformCarouselItem);
    } catch (error) {
      console.error('Error fetching active carousel items:', error);
      return [];
    }
  },

  // Create new carousel item
  async createCarouselItem(item: Omit<CarouselItem, 'id'>): Promise<CarouselItem | null> {
    try {
      const newId = crypto.randomUUID();
      const dbItem = transformToDatabase({ ...item, id: newId });
      
      const data = await mysqlClient.insert<DatabaseCarouselItem>('carousel_items', {
        id: newId,
        titulo: dbItem.titulo || '',
        descricao: dbItem.descricao,
        preco: dbItem.preco || '',
        preco_original: dbItem.preco_original,
        imagem_url: dbItem.imagem_url,
        badge: dbItem.badge || 'Novo',
        avaliacao: dbItem.avaliacao || 5.0,
        vendidos: dbItem.vendidos || 0,
        ativo: dbItem.ativo || true,
        order_index: dbItem.order_index || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (data) {
        return transformCarouselItem(data);
      }
      return null;
    } catch (error) {
      console.error('Error creating carousel item:', error);
      return null;
    }
  },

  // Update carousel item
  async updateCarouselItem(id: string, item: Partial<CarouselItem>): Promise<CarouselItem | null> {
    try {
      const dbItem = transformToDatabase(item as CarouselItem);
      
      const data = await mysqlClient.update<DatabaseCarouselItem>(
        'carousel_items',
        {
          ...dbItem,
          updated_at: new Date().toISOString()
        },
        { id }
      );

      if (data) {
        return transformCarouselItem(data);
      }
      return null;
    } catch (error) {
      console.error('Error updating carousel item:', error);
      return null;
    }
  },

  // Delete carousel item
  async deleteCarouselItem(id: string): Promise<boolean> {
    try {
      const result = await mysqlClient.delete('carousel_items', { id });
      return result > 0;
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      return false;
    }
  },

  // Toggle item active status
  async toggleCarouselItem(id: string, ativo: boolean): Promise<CarouselItem | null> {
    try {
      const data = await mysqlClient.update<DatabaseCarouselItem>(
        'carousel_items',
        {
          ativo,
          updated_at: new Date().toISOString()
        },
        { id }
      );

      if (data) {
        return transformCarouselItem(data);
      }
      return null;
    } catch (error) {
      console.error('Error toggling carousel item:', error);
      return null;
    }
  },

  // Update item order
  async updateCarouselItemOrder(items: { id: string; order_index: number }[]): Promise<boolean> {
    try {
      for (const item of items) {
        await mysqlClient.update<DatabaseCarouselItem>(
          'carousel_items',
          {
            order_index: item.order_index,
            updated_at: new Date().toISOString()
          },
          { id: item.id }
        );
      }
      return true;
    } catch (error) {
      console.error('Error updating carousel item order:', error);
      return false;
    }
  },

  // Save all carousel items (bulk update)
  async saveCarouselItems(items: CarouselItem[]): Promise<boolean> {
    try {
      // First, get all existing items
      const existingItems = await this.getCarouselItems();
      const existingIds = new Set(existingItems.map(item => item.id));
      const newItemIds = new Set(items.map(item => item.id));

      // Delete items that were removed
      for (const existingItem of existingItems) {
        if (!newItemIds.has(existingItem.id)) {
          await this.deleteCarouselItem(existingItem.id);
        }
      }

      // Update or create items
      for (let i = 0; i < items.length; i++) {
        const item = { ...items[i], order_index: i };
        
        if (existingIds.has(item.id)) {
          // Update existing item
          await this.updateCarouselItem(item.id, item);
        } else {
          // Create new item
          const { id, ...itemData } = item;
          await this.createCarouselItem(itemData);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving carousel items:', error);
      return false;
    }
  }
};
