import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { request } from '@/services/api-config';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const redirectTo = searchParams.get('redirect') || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Tentando login admin:', formData.email);

      const data = await request('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (data.ok) {
        // Salvar dados do usuário no localStorage
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        localStorage.setItem('admin_token', data.token);

        console.log('✅ Login admin bem-sucedido:', data.user);

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.nome}!`
        });

        // Se for necessário trocar a senha, abrir diálogo
        if (data.user?.change_required) {
          setShowPwdDialog(true);
        } else {
          navigate(redirectTo);
        }
      } else {
        console.error('❌ Erro no login admin:', data);
        setError(data.message || 'Email ou senha incorretos. Tente novamente.');
        toast({
          title: "Erro no login",
          description: data.message || "Credenciais inválidas.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erro na requisição de login:', error);
      setError(error.message || 'Erro de conexão. Tente novamente.');
      toast({
        title: "Erro no login",
        description: error.message || "Não foi possível conectar ao servidor.",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    try {
      const email = formData.email || prompt('Digite seu email de administrador:') || '';
      if (!email) return;
      await request('/admin/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      toast({ title: 'Verifique o link de reset', description: 'Link gerado e registrado nos logs do servidor.' });
    } catch (e: any) {
      toast({ title: 'Erro ao solicitar reset', description: e.message || 'Tente novamente', variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo de 6 caracteres', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Senhas não coincidem', variant: 'destructive' });
      return;
    }
    try {
      await request('/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword })
      });
      setShowPwdDialog(false);
      setNewPassword('');
      setConfirmNewPassword('');
      toast({ title: 'Senha alterada com sucesso' });
      navigate(redirectTo);
    } catch (e: any) {
      toast({ title: 'Erro ao alterar senha', description: e.message || 'Tente novamente', variant: 'destructive' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showExamples = (import.meta as any).env?.MODE !== 'production' && ((import.meta as any).env?.VITE_SHOW_ADMIN_HINTS ?? 'true') !== 'false';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Login Administrativo
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Acesse o painel de administração da loja
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar como Admin'}
            </Button>

            <div className="mt-2 text-center">
              <button type="button" onClick={handleForgotPassword} className="text-sm text-orange-600 hover:text-orange-700">
                Esqueci minha senha
              </button>
            </div>
          </form>

          {showExamples && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3 text-center font-medium">
                ✨ Usuários Disponíveis:
              </p>
              <div className="space-y-2">
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-3 rounded-md border border-orange-200">
                  <p className="text-xs text-gray-700 font-medium mb-1">👤 Admin Exemplo</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Email:</strong> admin@exemplo.com</p>
                    <p><strong>Senha:</strong> admin123</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-md border border-blue-200">
                  <p className="text-xs text-gray-700 font-medium mb-1">👤 Administrador Principal</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Email:</strong> admin@muhlstore.com</p>
                    <p><strong>Senha:</strong> admin123</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-md border border-green-200">
                  <p className="text-xs text-gray-700 font-medium mb-1">👤 Ronei Cesar (Dono)</p>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Email:</strong> roneinetslim@gmail.com</p>
                    <p><strong>Senha:</strong> admin123</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              ← Voltar para a Loja
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de troca de senha obrigatória */}
      <Dialog open={showPwdDialog} onOpenChange={setShowPwdDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Defina uma nova senha</DialogTitle>
            <DialogDescription>
              Por segurança, é necessário definir uma nova senha para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <Label>Confirmar Nova Senha</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPwdDialog(false)}>Cancelar</Button>
            <Button onClick={handleChangePassword}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLogin;
