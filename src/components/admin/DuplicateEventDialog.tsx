import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useDuplicateEvent } from "@/hooks/useEvents";
import type { Event } from "@/types/event";
import { format, addDays, setHours, setMinutes, getDay } from "date-fns";
import { Copy, Calendar } from "lucide-react";

interface DuplicateEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Função para calcular o próximo sábado
const getNextSaturday = (fromDate: Date): Date => {
  const daysUntilSaturday = (6 - getDay(fromDate) + 7) % 7 || 7;
  return addDays(fromDate, daysUntilSaturday);
};

export const DuplicateEventDialog = ({ event, open, onOpenChange }: DuplicateEventDialogProps) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_evento: "",
    hora_evento: "",
    local: "",
    numero_vagas: 0,
    vagas_limitadas: false,
    imagem_url: "",
    ativo: true,
  });

  const [sugestaoProximoSabado, setSugestaoProximoSabado] = useState<Date | null>(null);

  const duplicateEvent = useDuplicateEvent();

  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.data_evento);
      
      // Calcular próximo sábado baseado na data do evento original
      const proximoSabado = getNextSaturday(new Date());
      setSugestaoProximoSabado(proximoSabado);

      // Manter o mesmo horário do evento original
      const horaOriginal = format(eventDate, "HH:mm");
      const dataProximoSabado = format(proximoSabado, "yyyy-MM-dd");

      setFormData({
        titulo: event.titulo,
        descricao: event.descricao || "",
        data_evento: dataProximoSabado,
        hora_evento: horaOriginal,
        local: event.local || "",
        numero_vagas: event.numero_vagas || 0,
        vagas_limitadas: event.vagas_limitadas,
        imagem_url: event.imagem_url || "",
        ativo: true, // Sempre ativo por padrão
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combinar data e hora
    const [hours, minutes] = formData.hora_evento.split(":");
    const dataCompleta = setMinutes(
      setHours(new Date(formData.data_evento), parseInt(hours)),
      parseInt(minutes)
    );

    duplicateEvent.mutate(
      {
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        data_evento: dataCompleta.toISOString(),
        local: formData.local || undefined,
        numero_vagas: formData.vagas_limitadas ? formData.numero_vagas : undefined,
        vagas_limitadas: formData.vagas_limitadas,
        imagem_url: formData.imagem_url || undefined,
        ativo: formData.ativo,
        feira_fechada: false, // Sempre criar como não fechada
        renda_total: undefined,
        participantes_confirmados: undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const usarProximoSabado = () => {
    if (sugestaoProximoSabado) {
      setFormData(prev => ({
        ...prev,
        data_evento: format(sugestaoProximoSabado, "yyyy-MM-dd")
      }));
    }
  };

  const usarProximaSemana = () => {
    const dataAtual = new Date(formData.data_evento || new Date());
    const proximaSemana = addDays(dataAtual, 7);
    setFormData(prev => ({
      ...prev,
      data_evento: format(proximaSemana, "yyyy-MM-dd")
    }));
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Duplicar Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sugestões de Data */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Sugestões de Data
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={usarProximoSabado}
                className="text-xs"
              >
                Próximo Sábado ({sugestaoProximoSabado && format(sugestaoProximoSabado, "dd/MM/yyyy")})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={usarProximaSemana}
                className="text-xs"
              >
                +7 dias (Próxima Semana)
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título do Evento *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_evento">Data do Evento *</Label>
              <Input
                id="data_evento"
                type="date"
                value={formData.data_evento}
                onChange={(e) => setFormData({ ...formData, data_evento: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="hora_evento">Horário *</Label>
              <Input
                id="hora_evento"
                type="time"
                value={formData.hora_evento}
                onChange={(e) => setFormData({ ...formData, hora_evento: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              placeholder="Ex: Rua da Redenção, 123"
            />
          </div>

          <div>
            <Label htmlFor="imagem_url">URL da Imagem</Label>
            <Input
              id="imagem_url"
              type="url"
              value={formData.imagem_url}
              onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="vagas_limitadas" className="cursor-pointer">
                Vagas Limitadas
              </Label>
              <p className="text-xs text-muted-foreground">
                Definir número máximo de vagas
              </p>
            </div>
            <Switch
              id="vagas_limitadas"
              checked={formData.vagas_limitadas}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, vagas_limitadas: checked })
              }
            />
          </div>

          {formData.vagas_limitadas && (
            <div>
              <Label htmlFor="numero_vagas">Número de Vagas</Label>
              <Input
                id="numero_vagas"
                type="number"
                min="1"
                value={formData.numero_vagas}
                onChange={(e) =>
                  setFormData({ ...formData, numero_vagas: parseInt(e.target.value) })
                }
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="ativo" className="cursor-pointer">
                Evento Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                Visível no site para os clientes
              </p>
            </div>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={duplicateEvent.isPending}
              className="flex-1"
            >
              {duplicateEvent.isPending ? "Duplicando..." : "Duplicar Evento"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

