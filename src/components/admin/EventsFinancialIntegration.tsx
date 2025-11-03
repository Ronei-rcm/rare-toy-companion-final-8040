import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  MapPin
} from "lucide-react";
import { format, isPast, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  titulo: string;
  data_evento: string;
  local?: string;
  feira_fechada?: boolean;
  renda_total?: number;
  participantes_confirmados?: number;
  ativo: boolean;
}

interface EventsFinancialIntegrationProps {
  events: Event[];
  totalRevenue?: number;
  averagePerEvent?: number;
}

export const EventsFinancialIntegration = ({
  events,
  totalRevenue,
  averagePerEvent
}: EventsFinancialIntegrationProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Estatísticas de eventos
  const closedEvents = events.filter(e => e.feira_fechada);
  const upcomingEvents = events.filter(e => e.ativo && isFuture(new Date(e.data_evento)));
  const todayEvents = events.filter(e => e.ativo && isToday(new Date(e.data_evento)));

  // Calcular receita total dos eventos fechados
  const eventsRevenue = closedEvents.reduce((sum, event) => sum + (event.renda_total || 0), 0);

  // Calcular média de renda por evento
  const averageRevenue = closedEvents.length > 0 
    ? eventsRevenue / closedEvents.length 
    : 0;

  // Top 3 eventos com maior renda
  const topEvents = [...closedEvents]
    .sort((a, b) => (b.renda_total || 0) - (a.renda_total || 0))
    .slice(0, 3);

  // Próximos eventos
  const nextEvents = upcomingEvents
    .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime())
    .slice(0, 3);

  const getEventStatus = (event: Event) => {
    if (event.feira_fechada) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Fechada</Badge>;
    }
    if (isToday(new Date(event.data_evento))) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Hoje</Badge>;
    }
    if (isFuture(new Date(event.data_evento))) {
      return <Badge variant="secondary" className="text-xs">Agendada</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Concluída</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Receita de Eventos</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(eventsRevenue)}
            </div>
            <p className="text-xs text-gray-500">
              {closedEvents.length} evento{closedEvents.length !== 1 ? 's' : ''} fechado{closedEvents.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Média por Evento</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(averageRevenue)}
            </div>
            <p className="text-xs text-gray-500">
              Baseado em {closedEvents.length} eventos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Próximos Eventos</span>
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {upcomingEvents.length}
            </div>
            <p className="text-xs text-gray-500">
              {todayEvents.length > 0 && `${todayEvents.length} acontecendo hoje`}
              {todayEvents.length === 0 && 'Agendados'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Eventos */}
      {topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Eventos por Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.titulo}
                      </p>
                      {getEventStatus(event)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(event.data_evento), "dd MMM yyyy", { locale: ptBR })}</span>
                      {event.participantes_confirmados && (
                        <>
                          <span>•</span>
                          <Users className="h-3 w-3" />
                          <span>{event.participantes_confirmados} pessoas</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(event.renda_total || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos Eventos */}
      {nextEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Próximos Eventos Agendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nextEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.titulo}
                        </p>
                        {isToday(new Date(event.data_evento)) && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">Hoje!</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{format(new Date(event.data_evento), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                        {event.local && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.local}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatística de Participação */}
      {closedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Participação em Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total de Participantes</span>
                  <span className="text-lg font-bold text-blue-600">
                    {closedEvents.reduce((sum, e) => sum + (e.participantes_confirmados || 0), 0)}
                  </span>
                </div>
                <Progress 
                  value={(closedEvents.reduce((sum, e) => sum + (e.participantes_confirmados || 0), 0) / (closedEvents.length * 50)) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Média de {Math.round(closedEvents.reduce((sum, e) => sum + (e.participantes_confirmados || 0), 0) / closedEvents.length)} participantes por evento
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Eventos Realizados</p>
                  <p className="text-2xl font-bold text-gray-900">{closedEvents.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Taxa de Fechamento</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((closedEvents.length / events.length) * 100)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem se não houver eventos */}
      {events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Nenhum evento registrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando seus eventos para acompanhar a receita
            </p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Criar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

