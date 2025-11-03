import { mysqlClient } from '@/integrations/mysql/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/mysql/types';

export type Event = Tables<"events">;
export type EventInsert = TablesInsert<"events">;
export type EventUpdate = TablesUpdate<"events">;

export const eventsService = {
  async getAll() {
    try {
      const data = await mysqlClient.select<Event>(
        'events',
        '*',
        { ativo: true },
        'data_evento ASC'
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const data = await mysqlClient.single<Event>(
        'events',
        '*',
        { id }
      );
      return data;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw error;
    }
  },

  async getUpcoming() {
    try {
      const now = new Date().toISOString();
      const data = await mysqlClient.execute<Event[]>(
        `SELECT * FROM events 
         WHERE ativo = true 
         AND data_evento >= ? 
         ORDER BY data_evento ASC 
         LIMIT 6`,
        [now]
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  async create(event: EventInsert) {
    try {
      const data = await mysqlClient.insert<Event>('events', {
        id: crypto.randomUUID(),
        titulo: event.titulo,
        descricao: event.descricao,
        data_evento: event.data_evento,
        local: event.local,
        preco: event.preco,
        numero_vagas: event.numero_vagas,
        vagas_limitadas: event.vagas_limitadas || false,
        imagem_url: event.imagem_url,
        ativo: event.ativo !== undefined ? event.ativo : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async update(id: string, event: EventUpdate) {
    try {
      await mysqlClient.update(
        'events',
        {
          ...event,
          updated_at: new Date().toISOString(),
        },
        { id }
      );
      return this.getById(id);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await mysqlClient.delete('events', { id });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Additional MySQL-specific methods
  async getEventsByDateRange(startDate: string, endDate: string) {
    try {
      const data = await mysqlClient.execute<Event[]>(
        `SELECT * FROM events 
         WHERE ativo = true 
         AND data_evento >= ? 
         AND data_evento <= ? 
         ORDER BY data_evento ASC`,
        [startDate, endDate]
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching events by date range:', error);
      throw error;
    }
  },

  async getEventsByLocation(location: string) {
    try {
      const data = await mysqlClient.select<Event>(
        'events',
        '*',
        { ativo: true, local: location },
        'data_evento ASC'
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching events by location:', error);
      throw error;
    }
  },

  async searchEvents(searchTerm: string) {
    try {
      const data = await mysqlClient.search<Event>(
        'events',
        ['titulo', 'descricao', 'local'],
        searchTerm,
        { ativo: true },
        'data_evento ASC'
      );
      return data || [];
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  async getEventsWithAvailableSpots() {
    try {
      const data = await mysqlClient.execute<Event[]>(
        `SELECT * FROM events 
         WHERE ativo = true 
         AND data_evento >= NOW() 
         AND (numero_vagas IS NULL OR numero_vagas > 0) 
         ORDER BY data_evento ASC`
      );
      return data || [];
    } catch (error) {
      console.error('Error fetching events with available spots:', error);
      throw error;
    }
  },

  async updateEventSpots(id: string, spotsUsed: number) {
    try {
      await mysqlClient.execute(
        `UPDATE events 
         SET numero_vagas = numero_vagas - ? 
         WHERE id = ? AND numero_vagas >= ?`,
        [spotsUsed, id, spotsUsed]
      );
      return true;
    } catch (error) {
      console.error('Error updating event spots:', error);
      return false;
    }
  }
};
