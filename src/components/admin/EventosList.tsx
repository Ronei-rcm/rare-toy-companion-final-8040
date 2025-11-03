import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Edit, Trash2, Plus, DollarSign, CheckCircle, Copy, RefreshCw, ExternalLink } from "lucide-react";
import { useEvents, useDeleteEvent, useFecharFeira } from "@/hooks/useEvents";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddEventDialog } from "./AddEventDialog";
import { EditEventDialog } from "./EditEventDialog";
import { DuplicateEventDialog } from "./DuplicateEventDialog";
import type { Event } from "@/types/event";

export const EventosList = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [duplicatingEvent, setDuplicatingEvent] = useState<Event | null>(null);
  const [fecharFeiraDialog, setFecharFeiraDialog] = useState<Event | null>(null);
  const [rendaTotal, setRendaTotal] = useState("");
  const [participantesConfirmados, setParticipantesConfirmados] = useState("");
  
  const { data: events, isLoading } = useEvents();
  const deleteEvent = useDeleteEvent();
  const fecharFeira = useFecharFeira();
  const { toast } = useToast();

  const handleDeleteEvent = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      deleteEvent.mutate(id);
    }
  };

  const handleFecharFeira = () => {
    if (!fecharFeiraDialog) return;
    
    const renda = parseFloat(rendaTotal) || 0;
    const participantes = parseInt(participantesConfirmados) || 0;
    
    fecharFeira.mutate({
      id: fecharFeiraDialog.id,
      rendaTotal: renda,
      participantesConfirmados: participantes
    }, {
      onSuccess: () => {
        setFecharFeiraDialog(null);
        setRendaTotal("");
        setParticipantesConfirmados("");
      }
    });
  };

  const handleSyncEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/google/sync-event/${eventId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Evento sincronizado com Google Calendar!');
        if (data.eventUrl) {
          window.open(data.eventUrl, '_blank');
        }
      } else {
        toast.error(data.message || 'Erro ao sincronizar evento');
      }
    } catch (error) {
      console.error('Erro ao sincronizar evento:', error);
      toast.error('Erro ao sincronizar evento');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Eventos</h2>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Eventos</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Evento
        </Button>
      </div>

      <div className="grid gap-4">
        {events && Array.isArray(events) && events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex">
              {/* Miniatura da imagem */}
              {event.imagem_url && (
                <div className="w-32 h-32 flex-shrink-0">
                  <img
                    src={event.imagem_url}
                    alt={event.titulo}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{event.titulo}</CardTitle>
                    
                    <div className="flex items-center gap-4 mb-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.data_evento), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </div>
                      {event.local && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.local}
                        </div>
                      )}
                    </div>

                    {event.descricao && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {event.descricao}
                      </p>
                    )}
                    
                    <div className="flex gap-2 flex-wrap">
                      {event.vagas_limitadas && event.numero_vagas && (
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {event.numero_vagas} vagas
                        </Badge>
                      )}

                      <Badge variant={event.ativo ? "default" : "destructive"}>
                        {event.ativo ? "Ativo" : "Inativo"}
                      </Badge>

                      {event.feira_fechada && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Feira Fechada
                        </Badge>
                      )}

                      {event.feira_fechada && event.renda_total && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800">
                          <DollarSign className="w-3 h-3 mr-1" />
                          R$ {event.renda_total.toFixed(2).replace(".", ",")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!event.feira_fechada && event.ativo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFecharFeiraDialog(event)}
                        className="text-green-600 hover:text-green-700"
                        title="Fechar Feira"
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncEvent(event.id)}
                      className="text-purple-600 hover:text-purple-700"
                      title="Sincronizar com Google Calendar"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDuplicatingEvent(event)}
                      className="text-blue-600 hover:text-blue-700"
                      title="Duplicar Evento"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingEvent(event)}
                      title="Editar Evento"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Excluir Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {events && Array.isArray(events) && events.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro evento
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Evento
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddEventDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
        />
      )}

      {duplicatingEvent && (
        <DuplicateEventDialog
          event={duplicatingEvent}
          open={!!duplicatingEvent}
          onOpenChange={(open) => !open && setDuplicatingEvent(null)}
        />
      )}

      {/* Dialog para fechar feira */}
      <Dialog open={!!fecharFeiraDialog} onOpenChange={() => setFecharFeiraDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Feira</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Evento</Label>
              <p className="text-sm font-medium">{fecharFeiraDialog?.titulo}</p>
            </div>

            <div>
              <Label htmlFor="renda-total">Renda Total (R$)</Label>
              <Input
                id="renda-total"
                type="number"
                step="0.01"
                value={rendaTotal}
                onChange={(e) => setRendaTotal(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="participantes">Participantes Confirmados</Label>
              <Input
                id="participantes"
                type="number"
                value={participantesConfirmados}
                onChange={(e) => setParticipantesConfirmados(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleFecharFeira}
                disabled={fecharFeira.isPending}
                className="flex-1"
              >
                {fecharFeira.isPending ? "Fechando..." : "Fechar Feira"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setFecharFeiraDialog(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};