
import React, { useState } from 'react';
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
import { useCurrentUser } from '@/contexts/CurrentUserContext'; // Keep this import for now, as useUser is not defined in the original context
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/services/auth-api';
import { cartApi } from '@/services/cart-api';

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'), // Renamed 'senha' to 'password'
});

const Login = () => { // Changed to named export for consistency with original file
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get('redirect') || '/minha-conta';
  const { setUser } = useCurrentUser();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null); // New state
  const [loading, setLoading] = useState(false); // New state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '', // Renamed 'senha' to 'password'
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({
        email: values.email,
        password: values.password
      });

      if (data.success && data.user) {
        setUser(data.user);
        toast.success('Login realizado com sucesso!');

        // Sincronizar carrinho
        try {
          await cartApi.sync();
        } catch (e) {
          console.log('Aviso: Não foi possível sincronizar carrinho:', e);
        }

        // Verificar checkout rápido ou redirecionamento
        const urlParams = new URLSearchParams(window.location.search);
        const isCheckoutRapido = urlParams.get('checkout') === 'rapido';

        if (isCheckoutRapido) {
          navigate('/carrinho?checkout=rapido');
        } else {
          navigate(redirectTo);
        }
      } else {
        const errorMsg = data.message || 'Falha no login';
        setError(errorMsg);
        toast.error(errorMsg);
      }

    } catch (error: any) {
      console.error('Erro no login:', error);
      const errorMsg = error.message || 'Falha no login';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
