import { Event, EventInsert, EventUpdate } from '@/types/event';
import { request } from './api-config';

export const eventsApi = {
  // Buscar todos os eventos
  async getEvents(): Promise<Event[]> {
    console.log('🔄 Buscando eventos...');
    const data = await request<Event[]>('/events');
    console.log('✅ Eventos carregados:', data.length);
    return data;
  },

  // Buscar evento por ID
  async getEventById(id: string): Promise<Event> {
    console.log(`🔄 Buscando evento ID: ${id}`);
    const data = await request<Event>(`/events/${id}`);
    console.log('✅ Evento encontrado:', data.titulo);
    return data;
  },

  // Criar novo evento
  async createEvent(event: EventInsert): Promise<Event> {
    console.log('🔄 Criando evento:', event.titulo);
    const data = await request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
    console.log('✅ Evento criado:', data.titulo);
    return data;
  },

  // Atualizar evento
  async updateEvent(id: string, event: EventUpdate): Promise<Event> {
    console.log(`🔄 Atualizando evento ID: ${id}`);
    const data = await request<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
    console.log('✅ Evento atualizado:', data.titulo);
    return data;
  },

  // Deletar evento
  async deleteEvent(id: string): Promise<void> {
    console.log(`🔄 Deletando evento ID: ${id}`);
    await request<void>(`/events/${id}`, {
      method: 'DELETE',
    });
    console.log('✅ Evento deletado');
  },

  // Buscar eventos próximos
  async getUpcomingEvents(): Promise<Event[]> {
    console.log('🔄 Buscando eventos próximos...');
    const events = await eventsApi.getEvents();
    const now = new Date();

    const upcoming = events.filter(event =>
      event.ativo && new Date(event.data_evento) >= now
    ).slice(0, 6);

    console.log(`✅ ${upcoming.length} eventos próximos encontrados`);
    return upcoming;
  },

  // Fechar feira e registrar renda total
  async fecharFeira(id: string, rendaTotal: number, participantesConfirmados: number): Promise<void> {
    console.log(`🔄 Fechando feira do evento ID: ${id}`);
    await request<void>(`/events/${id}/fechar-feira`, {
      method: 'POST',
      body: JSON.stringify({
        renda_total: rendaTotal,
        participantes_confirmados: participantesConfirmados
      }),
    });
    console.log('✅ Feira fechada com sucesso');
  }
};
