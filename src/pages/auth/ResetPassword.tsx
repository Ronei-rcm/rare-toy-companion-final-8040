import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
  FormDescription,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Validação de força de senha
const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .max(100, 'Senha muito longa')
  .refine((password) => {
    // Pelo menos uma letra e um número
    return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  }, 'Senha deve conter pelo menos uma letra e um número');

const formSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Verificar força da senha em tempo real
  useEffect(() => {
    const password = form.watch('newPassword');
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] });
      return;
    }

    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  }, [form.watch('newPassword')]);

  const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
    let score = 0;
    const feedback: string[] = [];

    // Comprimento
    if (password.length >= 8) score += 1;
    else feedback.push('Use pelo menos 8 caracteres');
    
    if (password.length >= 12) score += 1;

    // Caracteres variados
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    else feedback.push('Use letras maiúsculas e minúsculas');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Adicione números');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Adicione símbolos (!@#$%...)');

    // Retornar apenas feedbacks negativos
    return { score, feedback: feedback.slice(0, 2) };
  };

  const getStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = (score: number) => {
    if (score <= 2) return 'Fraca';
    if (score <= 3) return 'Média';
    return 'Forte';
  };

  useEffect(() => {
    if (!token) {
      toast.error('Token inválido ou ausente', {
        description: 'O link de redefinição de senha é inválido ou expirou.',
      });
      navigate('/auth/recuperar-senha');
    }
  }, [token, navigate]);

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Token inválido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password: data.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        toast.success('Senha redefinida com sucesso!', {
          description: 'Você já pode fazer login com sua nova senha.',
        });
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      } else {
        const errorMessage = result.message || 'Erro ao redefinir senha. Verifique se o link ainda é válido.';
        toast.error(errorMessage);
        
        // Se token expirado, redirecionar
        if (result.error === 'expired_token' || result.error === 'invalid_token') {
          setTimeout(() => {
            navigate('/auth/recuperar-senha');
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro de conexão', {
        description: 'Não foi possível conectar ao servidor. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <Link
                to="/auth/login"
                className="inline-flex items-center text-sm text-primary hover:text-primary/80 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Link>
              
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                Redefinir Senha
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                Defina uma nova senha segura para sua conta
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            autoComplete="new-password"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      
                      {/* Indicador de força de senha */}
                      {field.value && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Força da senha:</span>
                            <span className={`font-medium ${
                              passwordStrength.score <= 2 ? 'text-red-600' :
                              passwordStrength.score <= 3 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {getStrengthLabel(passwordStrength.score)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength.score)}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          {passwordStrength.feedback.length > 0 && (
                            <ul className="text-xs text-gray-500 space-y-1">
                              {passwordStrength.feedback.map((item, idx) => (
                                <li key={idx} className="flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      <FormDescription>
                        Mínimo 6 caracteres. Use letras, números e símbolos para maior segurança.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-10 pr-10"
                            autoComplete="new-password"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {showConfirmPassword ? (
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

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    O link de redefinição expira em 1 hora. Certifique-se de definir sua senha agora.
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redefinindo...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Redefinir Senha
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Lembrou sua senha?{' '}
                <Link
                  to="/auth/login"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
