import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHomeConfig } from "@/contexts/HomeConfigContext";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { useUpcomingEvents } from "@/hooks/useEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export const EventosDestaque = () => {
  const { data: events, isLoading } = useUpcomingEvents();
  const { config } = useHomeConfig();

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-background/50 to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background/50 to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{config.eventos.title}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {config.eventos.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {events.slice(0, 3).map((event) => (
            <Card key={event.id} className="group hover:shadow-lg transition-all duration-300">
              {event.imagem_url && (
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={event.imagem_url}
                    alt={event.titulo}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    {event.preco && event.preco > 0 ? (
                      <Badge className="bg-primary/90 text-primary-foreground">
                        R$ {event.preco.toFixed(2).replace(".", ",")}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/90 text-white">
                        Gratuito
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {event.titulo}
                </h3>

                {event.descricao && (
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {event.descricao}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(event.data_evento), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>

                  {event.local && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.local}
                    </div>
                  )}

                  {event.vagas_limitadas && event.numero_vagas && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {event.numero_vagas} vagas disponíveis
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Saiba Mais
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {events.length > 3 && (
          <div className="text-center">
            <Button asChild size="lg">
              <Link to="/eventos">
                Ver Todos os Eventos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};