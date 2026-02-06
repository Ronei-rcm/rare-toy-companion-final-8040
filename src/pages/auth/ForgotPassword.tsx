import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
});

type FormData = z.infer<typeof formSchema>;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json().catch(() => ({ ok: false, error: 'parse_error' }));

      // Log detalhado para debug
      console.log('📧 Resposta do servidor:', { status: response.status, ok: response.ok, result });

      if (response.ok || result.ok) {
        setEmailSent(true);
        setSentEmail(data.email);
        
        // Em desenvolvimento, mostrar URL e token se disponível
        if (process.env.NODE_ENV === 'development' && result.resetUrl) {
          console.log('🔐 Link de reset (DESENVOLVIMENTO):', result.resetUrl);
          toast.success('Email enviado! (Desenvolvimento)', {
            description: `Link: ${result.resetUrl}`,
            duration: 10000,
          });
        } else {
          toast.success('Email enviado com sucesso!', {
            description: 'Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.',
          });
        }
      } else {
        // Em caso de erro de validação, mostrar erro específico
        if (response.status === 400 && result.error === 'invalid_email') {
          toast.error('Email inválido', {
            description: 'Por favor, verifique o email digitado.',
          });
          setIsLoading(false);
          return;
        }
        
        // Mesmo em caso de erro, não revelamos se o email existe (segurança)
        setEmailSent(true);
        setSentEmail(data.email);
        toast.info('Se o email existir, você receberá um link para redefinir sua senha.');
      }
    } catch (error: any) {
      console.error('❌ Erro ao solicitar reset de senha:', error);
      
      // Se for erro de conexão, mostrar erro específico
      if (error.message && error.message.includes('fetch')) {
        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
        });
        setIsLoading(false);
        return;
      }
      
      // Por segurança, sempre mostramos mensagem de sucesso para outros erros
      setEmailSent(true);
      setSentEmail(data.email);
      toast.info('Se o email existir, você receberá um link para redefinir sua senha.');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Enviado!
                </h2>
                
                <p className="text-sm text-gray-600 mb-6">
                  Enviamos um link de redefinição de senha para:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-900">{sentEmail}</p>
                </div>

                <Alert className="mb-6 text-left">
                  <AlertDescription className="text-sm">
                    <strong>Próximos passos:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1 text-gray-700">
                      <li>Verifique sua caixa de entrada</li>
                      <li>Clique no link recebido (válido por 1 hora)</li>
                      <li>Defina uma nova senha</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-gray-600 mb-4">
                  <p>Não recebeu o email?</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500">
                    <li>Verifique sua pasta de spam</li>
                    <li>Confirme se o email está correto</li>
                    <li>Tente novamente em alguns minutos</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    Enviar Novamente
                  </Button>
                  
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => navigate('/auth/login')}
                    className="flex-1"
                  >
                    Voltar para Login
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

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
                <Mail className="h-6 w-6 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">
                Esqueceu sua senha?
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                Digite seu email e enviaremos um link para redefinir sua senha
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10"
                            autoComplete="email"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enviaremos um link de redefinição de senha para este email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Link de Redefinição
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

export default ForgotPassword;
