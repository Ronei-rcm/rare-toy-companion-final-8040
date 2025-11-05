
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useCustomerSync } from '@/hooks/useCustomerSync';
import { toast } from 'sonner';
import { Loader2, Save, User, Mail, Phone, MapPin, Lock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Schema para validação dos dados pessoais
const dadosSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  avatar_url: z.string().optional(),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
});

// Schema para alteração de senha
const senhaSchema = z.object({
  senhaAtual: z.string().min(6, 'Senha atual deve ter no mínimo 6 caracteres'),
  novaSenha: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const DadosTab = () => {
  const { user, updateUser, isLoading } = useCurrentUser();
  const { customerData, isSyncing, lastSync, syncAfterUpdate, validateBeforeSave, validation } = useCustomerSync();
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Formulário para dados pessoais
  const dadosForm = useForm<z.infer<typeof dadosSchema>>({
    resolver: zodResolver(dadosSchema),
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || '',
      avatar_url: user?.avatar_url || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      cidade: user?.cidade || '',
      estado: user?.estado || '',
      cep: user?.cep || '',
    },
  });

  // Formulário para alteração de senha
  const senhaForm = useForm<z.infer<typeof senhaSchema>>({
    resolver: zodResolver(senhaSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  // Atualizar formulário quando o usuário mudar
  React.useEffect(() => {
    if (user) {
      dadosForm.reset({
        nome: user.nome,
        email: user.email,
        avatar_url: user.avatar_url || '',
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        cep: user.cep || '',
      });
    }
  }, [user, dadosForm]);

  const onSubmitDados = async (values: z.infer<typeof dadosSchema>) => {
    if (!user) return;

    // Validar antes de salvar
    if (!validateBeforeSave(values)) {
      return;
    }

    try {
      setIsSaving(true);
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE_URL}/account/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao atualizar perfil');
      
      // Atualizar contexto
      await updateUser(data.user || values);
      
      // Sincronizar dados atualizados
      await syncAfterUpdate();
      
      toast.success('Dados atualizados e sincronizados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitSenha = async (values: z.infer<typeof senhaSchema>) => {
    try {
      setIsSaving(true);
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
      const res = await fetch(`${API_BASE_URL}/account/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senhaAtual: values.senhaAtual, novaSenha: values.novaSenha })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha ao alterar senha');
      toast.success('Senha alterada com sucesso!');
      setIsEditingPassword(false);
      senhaForm.reset();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando dados...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Dados</h2>
          <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sincronizando...</span>
            </div>
          )}
          {lastSync && !isSyncing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Atualizado {new Date(lastSync).toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncAfterUpdate()}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Avisos de validação */}
      {validation.warnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.warnings.map((warning, index) => (
                <p key={index} className="text-sm">{warning}</p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>
            Atualize suas informações de contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={dadosForm.handleSubmit(onSubmitDados)} className="space-y-4">
            <AvatarUpload
              value={dadosForm.watch('avatar_url')}
              onChange={(url) => dadosForm.setValue('avatar_url', url)}
              name={user?.nome}
              disabled={isSaving}
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  {...dadosForm.register('nome')}
                  placeholder="Seu nome completo"
                />
                {dadosForm.formState.errors.nome && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.nome.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...dadosForm.register('email')}
                  placeholder="seu@email.com"
                />
                {dadosForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...dadosForm.register('telefone')}
                  placeholder="(11) 99999-9999"
                />
                {dadosForm.formState.errors.telefone && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.telefone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  {...dadosForm.register('cep')}
                  placeholder="00000-000"
                />
                {dadosForm.formState.errors.cep && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.cep.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                {...dadosForm.register('endereco')}
                placeholder="Rua, número, bairro"
              />
              {dadosForm.formState.errors.endereco && (
                <p className="text-sm text-destructive">{dadosForm.formState.errors.endereco.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  {...dadosForm.register('cidade')}
                  placeholder="Nome da cidade"
                />
                {dadosForm.formState.errors.cidade && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.cidade.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  {...dadosForm.register('estado')}
                  placeholder="UF"
                  maxLength={2}
                />
                {dadosForm.formState.errors.estado && (
                  <p className="text-sm text-destructive">{dadosForm.formState.errors.estado.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Dados
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditingPassword ? (
            <Button onClick={() => setIsEditingPassword(true)} variant="outline">
              Alterar Senha
            </Button>
          ) : (
            <form onSubmit={senhaForm.handleSubmit(onSubmitSenha)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input
                  id="senhaAtual"
                  type="password"
                  {...senhaForm.register('senhaAtual')}
                  placeholder="Digite sua senha atual"
                />
                {senhaForm.formState.errors.senhaAtual && (
                  <p className="text-sm text-destructive">{senhaForm.formState.errors.senhaAtual.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    {...senhaForm.register('novaSenha')}
                    placeholder="Digite a nova senha"
                  />
                  {senhaForm.formState.errors.novaSenha && (
                    <p className="text-sm text-destructive">{senhaForm.formState.errors.novaSenha.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    {...senhaForm.register('confirmarSenha')}
                    placeholder="Confirme a nova senha"
                  />
                  {senhaForm.formState.errors.confirmarSenha && (
                    <p className="text-sm text-destructive">{senhaForm.formState.errors.confirmarSenha.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingPassword(false);
                    senhaForm.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DadosTab;
