import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/admin/ImageUpload";
import { useUpdateEvent } from "@/hooks/useEvents";
import type { Event } from "@/types/event";

interface EditEventDialogProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditEventDialog = ({ event, open, onOpenChange }: EditEventDialogProps) => {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    local: "",
    imagem_url: "",
    vagas_limitadas: false,
    numero_vagas: "",
    ativo: true,
  });

  const updateEvent = useUpdateEvent();

  useEffect(() => {
    if (event) {
      // Função para formatar data para datetime-local
      const formatDateTimeLocal = (dateString: string | undefined) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Usar data_inicio se disponível, senão usar data_evento (compatibilidade)
      const dataInicio = event.data_inicio || event.data_evento;
      const dataFim = event.data_fim || "";

      setFormData({
        titulo: event.titulo,
        descricao: event.descricao || "",
        data_inicio: formatDateTimeLocal(dataInicio),
        data_fim: formatDateTimeLocal(dataFim),
        local: event.local || "",
        imagem_url: event.imagem_url || "",
        vagas_limitadas: event.vagas_limitadas || false,
        numero_vagas: event.numero_vagas ? event.numero_vagas.toString() : "",
        ativo: event.ativo,
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que data_inicio foi preenchida
    if (!formData.data_inicio) {
      alert('Por favor, preencha a data de início do evento.');
      return;
    }

    // Validar que data_fim não é anterior a data_inicio
    if (formData.data_fim && formData.data_fim < formData.data_inicio) {
      alert('A data de término não pode ser anterior à data de início.');
      return;
    }
    
    updateEvent.mutate({
      id: event.id,
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim || null, // NULL = evento de 1 dia
      data_evento: formData.data_inicio, // Mantido para compatibilidade
      local: formData.local || null,
      imagem_url: formData.imagem_url || null,
      vagas_limitadas: formData.vagas_limitadas,
      numero_vagas: formData.vagas_limitadas && formData.numero_vagas 
        ? parseInt(formData.numero_vagas) 
        : null,
      ativo: formData.ativo,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Edite as informações do evento. Todas as alterações serão salvas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="data_inicio">Data e Hora de Início *</Label>
              <Input
                id="data_inicio"
                type="datetime-local"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data e Hora de Término (Opcional)</Label>
              <Input
                id="data_fim"
                type="datetime-local"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                min={formData.data_inicio || undefined}
                placeholder="Deixe em branco para evento de 1 dia"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco se o evento durar apenas 1 dia
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Centro de Convenções"
              />
            </div>


            <div className="col-span-2">
              <ImageUpload
                label="Imagem do Evento"
                value={formData.imagem_url}
                onChange={(url) => setFormData({ ...formData, imagem_url: url })}
                placeholder="Faça upload ou insira a URL da imagem"
              />
            </div>

            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="vagas_limitadas"
                  checked={formData.vagas_limitadas}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, vagas_limitadas: checked })
                  }
                />
                <Label htmlFor="vagas_limitadas">Vagas limitadas</Label>
              </div>

              {formData.vagas_limitadas && (
                <div>
                  <Label htmlFor="numero_vagas">Número de Vagas</Label>
                  <Input
                    id="numero_vagas"
                    type="number"
                    value={formData.numero_vagas}
                    onChange={(e) => setFormData({ ...formData, numero_vagas: e.target.value })}
                    placeholder="Ex: 50"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, ativo: checked })
                  }
                />
                <Label htmlFor="ativo">Evento ativo</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateEvent.isPending}>
              {updateEvent.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};