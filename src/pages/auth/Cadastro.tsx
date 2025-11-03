
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
  aceitarTermos: z.boolean().refine(val => val === true, {
    message: 'Você precisa aceitar os termos e condições',
  })
}).refine(data => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

const Cadastro = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useCurrentUser() as any;
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
      aceitarTermos: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome: values.nome, email: values.email, senha: values.senha })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Falha ao criar conta');
      setUser({ id: values.email, email: values.email, nome: values.nome });
      toast.success('Conta criada com sucesso!');
      navigate('/minha-conta');
      
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md mx-auto py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Criar sua conta</h1>
            <p className="text-muted-foreground mt-2">
              Cadastre-se para acompanhar seus pedidos e comprar mais rápido
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        autoComplete="tel"
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
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aceitarTermos"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Aceito os termos e condições de uso
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
          </Form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cadastro;
