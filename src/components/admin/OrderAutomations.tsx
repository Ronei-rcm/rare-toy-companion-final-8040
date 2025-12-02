import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Settings,
  Mail,
  Bell,
  Package,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchAdmin } from '@/utils/adminFetch';
import { motion, AnimatePresence } from 'framer-motion';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: Array<{
    type: string;
    [key: string]: any;
  }>;
  enabled: boolean;
}

const OrderAutomations: React.FC = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetchAdmin('/api/admin/automations/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data.data || []);
      } else {
        throw new Error('Erro ao carregar regras');
      }
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as regras de automação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetchAdmin(`/api/admin/automations/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (response.ok) {
        setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
        toast({
          title: 'Sucesso',
          description: `Regra ${enabled ? 'ativada' : 'desativada'}`
        });
      } else {
        throw new Error('Erro ao alterar regra');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a regra',
        variant: 'destructive'
      });
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Tem certeza que deseja remover esta regra?')) return;

    try {
      const response = await fetchAdmin(`/api/admin/automations/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
        toast({
          title: 'Sucesso',
          description: 'Regra removida'
        });
      } else {
        throw new Error('Erro ao remover regra');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover a regra',
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'create_notification': return <Bell className="h-4 w-4" />;
      case 'update_order': return <Package className="h-4 w-4" />;
      case 'update_stock': return <Package className="h-4 w-4" />;
      case 'apply_discount': return <DollarSign className="h-4 w-4" />;
      case 'assign_to_user': return <User className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      'order_created': 'Pedido Criado',
      'order_status_changed': 'Status Alterado',
      'scheduled': 'Agendado'
    };
    return labels[trigger] || trigger;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automações de Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie regras automáticas para processar pedidos
          </p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Regra
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${rule.enabled ? 'text-yellow-500' : 'text-gray-400'}`} />
                        {rule.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <Badge variant="outline">{getTriggerLabel(rule.trigger)}</Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Ações</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rule.actions.map((action, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {getActionIcon(action.type)}
                            <span className="ml-1">{action.type.replace('_', ' ')}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditingRule(rule); setIsDialogOpen(true); }}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {rules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma regra configurada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira regra de automação para começar
            </p>
            <Button onClick={() => { setEditingRule(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Editar Regra' : 'Nova Regra de Automação'}
            </DialogTitle>
            <DialogDescription>
              Configure uma regra automática para processar pedidos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Regra</Label>
              <Input
                placeholder="Ex: Notificar Cliente - Pedido Confirmado"
                defaultValue={editingRule?.name}
              />
            </div>
            <div>
              <Label>Gatilho</Label>
              <Select defaultValue={editingRule?.trigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um gatilho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_created">Pedido Criado</SelectItem>
                  <SelectItem value="order_status_changed">Status Alterado</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                A configuração completa de regras requer acesso ao backend.
                Use a API diretamente ou configure via código.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                toast({
                  title: 'Info',
                  description: 'Use a API para criar regras completas'
                });
                setIsDialogOpen(false);
              }}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderAutomations;

