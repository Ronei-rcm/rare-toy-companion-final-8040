import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCepLookup } from '@/hooks/useCepLookup';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

interface ClienteForm {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  cep: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  tags: string[];
  notas: string;
}

interface ClienteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClienteForm;
  setFormData: React.Dispatch<React.SetStateAction<ClienteForm>>;
  onSubmit: () => void;
  title: string;
  description?: string;
}

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const ClienteFormDialog: React.FC<ClienteFormDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  title,
  description
}) => {
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const [consultandoCep, setConsultandoCep] = useState(false);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value;
    
    // Atualiza o campo CEP
    setFormData(prev => ({ ...prev, cep }));
    
    // Busca CEP quando tiver 8 dígitos
    if (cep.replace(/\D/g, '').length === 8) {
      setConsultandoCep(true);
      const cepData = await lookupCep(cep);
      setConsultandoCep(false);
      
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          endereco: cepData.logradouro || '',
          bairro: cepData.bairro || '',
          cidade: cepData.localidade || '',
          estado: cepData.uf || '',
          cep: cepData.cep || cep
        }));
        toast.success('Endereço preenchido automaticamente!');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Nome */}
          <div className="col-span-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Nome completo"
              required
            />
          </div>

          {/* Email */}
          <div className="col-span-1">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
              required
            />
          </div>

          {/* Telefone */}
          <div className="col-span-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* CEP com busca automática */}
          <div className="col-span-1">
            <Label htmlFor="cep" className="flex items-center gap-2">
              CEP
              {consultandoCep && (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              )}
              {!consultandoCep && (
                <MapPin className="h-3 w-3 text-muted-foreground" />
              )}
            </Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>

          {/* Estado */}
          <div className="col-span-1">
            <Label htmlFor="estado">Estado</Label>
            <Select
              value={formData.estado}
              onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {estados.map(estado => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cidade */}
          <div className="col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
              placeholder="Cidade"
            />
          </div>

          {/* Endereço */}
          <div className="col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              placeholder="Rua, avenida..."
            />
          </div>

          {/* Bairro */}
          <div className="col-span-1">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              placeholder="Bairro"
            />
          </div>

          {/* Complemento */}
          <div className="col-span-1">
            <Label htmlFor="complemento">Complemento</Label>
            <Input
              id="complemento"
              value={formData.complemento || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
              placeholder="Apartamento, bloco..."
            />
          </div>

          {/* Status */}
          <div className="col-span-1">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'ativo' | 'inativo' | 'bloqueado') => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="col-span-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Observações sobre o cliente..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

