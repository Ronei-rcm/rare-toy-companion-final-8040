
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirect') || '/minha-conta';
  const { setUser } = useCurrentUser() as any;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: values.email, senha: values.senha })
      });
      
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const errorMessage = data.message || 
          (data.error === 'usuario_nao_encontrado' 
            ? 'Email não encontrado. Verifique suas credenciais ou crie uma conta.' 
            : data.error === 'credenciais_invalidas'
            ? 'Email ou senha incorretos. Verifique suas credenciais.'
            : 'Login inválido');
        throw new Error(errorMessage);
      }
      
      const userData = await resp.json();
      
      // Buscar dados completos do usuário
      const userResp = await fetch(`${API_BASE_URL}/customers/by-email/${values.email}`, {
        credentials: 'include'
      });
      
      let fullUserData = { id: values.email, email: values.email, nome: values.email };
      if (userResp.ok) {
        const customerData = await userResp.json();
        fullUserData = {
          id: customerData.id || values.email,
          email: customerData.email || values.email,
          nome: customerData.nome || customerData.email || values.email,
          telefone: customerData.telefone,
          endereco: customerData.endereco,
          cep: customerData.cep,
          cidade: customerData.cidade,
          estado: customerData.estado
        };
      }
      
      setUser(fullUserData);
      toast.success('Login realizado com sucesso!');
      
      // Sincronizar carrinho após login
      try {
        await fetch(`${API_BASE_URL}/cart/sync`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (e) {
        console.log('Aviso: Não foi possível sincronizar carrinho:', e);
      }
      
      // Verificar se é checkout rápido
      const urlParams = new URLSearchParams(window.location.search);
      const isCheckoutRapido = urlParams.get('checkout') === 'rapido';
      
      if (isCheckoutRapido) {
        navigate('/carrinho?checkout=rapido');
      } else {
        navigate(redirectTo);
      }
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Falha no login');
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Entrar na conta</h1>
            <p className="text-muted-foreground mt-2">
              Faça login para acessar sua conta e verificar seus pedidos
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        autoComplete="email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        autoComplete="current-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-center justify-between">
                <Link to="/auth/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueceu sua senha?
                </Link>
              </div>
              
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </Form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não tem uma conta?{' '}
              <Link to="/auth/cadastro" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
