import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi } from "@/services/events-api";
import { type Event, type EventInsert, type EventUpdate } from "@/types/event";
import { useToast } from "@/hooks/use-toast";

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: eventsApi.getEvents,
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsApi.getEventById(id),
    enabled: !!id,
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: eventsApi.getUpcomingEvents,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (event: EventInsert) => eventsApi.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento criado",
        description: "O evento foi criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...event }: EventUpdate & { id: string }) => 
      eventsApi.updateEvent(id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento atualizado",
        description: "O evento foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento excluído",
        description: "O evento foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento.",
        variant: "destructive",
      });
    },
  });
};

export const useFecharFeira = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, rendaTotal, participantesConfirmados }: { 
      id: string; 
      rendaTotal: number; 
      participantesConfirmados: number; 
    }) => eventsApi.fecharFeira(id, rendaTotal, participantesConfirmados),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Feira fechada com sucesso! 🎉",
        description: `Renda total: R$ ${variables.rendaTotal.toFixed(2)} | Participantes: ${variables.participantesConfirmados}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível fechar a feira.",
        variant: "destructive",
      });
    },
  });
};

export const useDuplicateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (event: EventInsert) => eventsApi.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Evento duplicado com sucesso! 📋",
        description: "O evento foi criado a partir da cópia.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o evento.",
        variant: "destructive",
      });
    },
  });
};