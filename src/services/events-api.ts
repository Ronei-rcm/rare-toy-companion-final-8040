import { Event, EventInsert, EventUpdate } from '@/types/event';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const eventsApi = {
  // Buscar todos os eventos
  async getEvents(): Promise<Event[]> {
    try {
      console.log('🔄 Buscando eventos...');
      const response = await fetch(`${API_BASE_URL}/events`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Eventos carregados:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      throw error;
    }
  },

  // Buscar evento por ID
  async getEventById(id: string): Promise<Event> {
    try {
      console.log(`🔄 Buscando evento ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/events/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Evento encontrado:', data.titulo);
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar evento:', error);
      throw error;
    }
  },

  // Criar novo evento
  async createEvent(event: EventInsert): Promise<Event> {
    try {
      console.log('🔄 Criando evento:', event.titulo);
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Evento criado:', data.titulo);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      throw error;
    }
  },

  // Atualizar evento
  async updateEvent(id: string, event: EventUpdate): Promise<Event> {
    try {
      console.log(`🔄 Atualizando evento ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Evento atualizado:', data.titulo);
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar evento:', error);
      throw error;
    }
  },

  // Deletar evento
  async deleteEvent(id: string): Promise<void> {
    try {
      console.log(`🔄 Deletando evento ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Evento deletado');
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      throw error;
    }
  },

  // Buscar eventos próximos
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      console.log('🔄 Buscando eventos próximos...');
      const events = await eventsApi.getEvents();
      const now = new Date();
      
      const upcoming = events.filter(event => 
        event.ativo && new Date(event.data_evento) >= now
      ).slice(0, 6);
      
      console.log(`✅ ${upcoming.length} eventos próximos encontrados`);
      return upcoming;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos próximos:', error);
      throw error;
    }
  },

  // Fechar feira e registrar renda total
  async fecharFeira(id: string, rendaTotal: number, participantesConfirmados: number): Promise<void> {
    try {
      console.log(`🔄 Fechando feira do evento ID: ${id}`);
      const response = await fetch(`${API_BASE_URL}/events/${id}/fechar-feira`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          renda_total: rendaTotal,
          participantes_confirmados: participantesConfirmados
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('✅ Feira fechada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao fechar feira:', error);
      throw error;
    }
  }
};
