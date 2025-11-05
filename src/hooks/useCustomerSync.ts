import { useEffect, useState, useCallback } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { toast } from 'sonner';

interface CustomerData {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  data_nascimento?: string;
  avatar_url?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  created_at?: string;
  updated_at?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

/**
 * Hook para sincronizar e validar dados do cliente
 * Garante que os dados estejam sempre atualizados e válidos
 */
export function useCustomerSync() {
  const { user, updateUser } = useCurrentUser();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: []
  });

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Função auxiliar para validar CPF
  const isValidCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  // Validar dados do cliente
  const validateCustomerData = useCallback((data: Partial<CustomerData>): ValidationResult => {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];

    // Validar email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Email inválido';
    }

    // Validar telefone (formato brasileiro)
    if (data.telefone) {
      const phone = data.telefone.replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 11) {
        errors.telefone = 'Telefone inválido. Use o formato (11) 99999-9999';
      }
    }

    // Validar CEP
    if (data.cep) {
      const cep = data.cep.replace(/\D/g, '');
      if (cep.length !== 8) {
        errors.cep = 'CEP inválido. Use o formato 00000-000';
      }
    }

    // Validar CPF
    if (data.cpf) {
      const cpf = data.cpf.replace(/\D/g, '');
      if (cpf.length !== 11) {
        errors.cpf = 'CPF inválido';
      } else if (!isValidCPF(cpf)) {
        errors.cpf = 'CPF inválido';
      }
    }

    // Validar nome
    if (data.nome && data.nome.length < 3) {
      errors.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    // Avisos (não bloqueiam, mas alertam)
    if (!data.telefone) {
      warnings.push('Telefone não cadastrado. Recomendamos adicionar para facilitar o contato.');
    }
    if (!data.endereco || !data.cidade || !data.estado) {
      warnings.push('Endereço incompleto. Complete para facilitar entregas.');
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }, []);

  // Buscar dados completos do cliente
  const fetchCustomerData = useCallback(async (forceRefresh = false): Promise<CustomerData | null> => {
    if (!user?.id && !user?.email) return null;

    try {
      setIsSyncing(true);
      
      // Tentar buscar por ID primeiro
      let response = await fetch(`${API_BASE_URL}/customers/${user.id}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=60'
        }
      });

      // Se não encontrar, tentar por email
      if (!response.ok && user.email) {
        response = await fetch(`${API_BASE_URL}/customers/by-email/${encodeURIComponent(user.email)}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': forceRefresh ? 'no-cache' : 'max-age=60'
          }
        });
      }

      if (response.ok) {
        const data = await response.json();
        const customer: CustomerData = {
          id: data.id || user.id,
          nome: data.nome || user.nome || '',
          email: data.email || user.email || '',
          telefone: data.telefone || data.phone || '',
          cpf: data.cpf || '',
          data_nascimento: data.data_nascimento || data.birth_date || '',
          avatar_url: data.avatar_url || data.avatar || user.avatar_url || '',
          endereco: data.endereco || data.address || '',
          cidade: data.cidade || data.city || '',
          estado: data.estado || data.state || '',
          cep: data.cep || data.postal_code || '',
          created_at: data.created_at,
          updated_at: data.updated_at
        };

        // Validar dados
        const validationResult = validateCustomerData(customer);
        setValidation(validationResult);

        setCustomerData(customer);
        setLastSync(new Date());

        // Atualizar contexto do usuário com dados completos
        await updateUser(customer);

        // Mostrar avisos se houver
        if (validationResult.warnings.length > 0 && forceRefresh) {
          validationResult.warnings.forEach(warning => {
            toast.warning(warning, { duration: 5000 });
          });
        }

        return customer;
      }
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsSyncing(false);
    }

    return null;
  }, [user, API_BASE_URL, updateUser, validateCustomerData]);

  // Sincronizar dados periodicamente
  useEffect(() => {
    if (!user) return;

    // Buscar dados iniciais
    fetchCustomerData();

    // Sincronizar a cada 5 minutos se houver conexão
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchCustomerData(true);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Sincronizar quando a página voltar a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchCustomerData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Sincronizar quando voltar online
    const handleOnline = () => {
      fetchCustomerData(true);
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, fetchCustomerData]);

  // Sincronizar dados após atualizações
  const syncAfterUpdate = useCallback(async () => {
    await fetchCustomerData(true);
    toast.success('Dados sincronizados com sucesso!');
  }, [fetchCustomerData]);

  // Validar dados antes de salvar
  const validateBeforeSave = useCallback((data: Partial<CustomerData>): boolean => {
    const validationResult = validateCustomerData(data);
    setValidation(validationResult);

    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      toast.error(firstError || 'Dados inválidos');
      return false;
    }

    if (validationResult.warnings.length > 0) {
      // Mostrar avisos mas não bloquear
      validationResult.warnings.forEach(warning => {
        toast.warning(warning, { duration: 4000 });
      });
    }

    return true;
  }, [validateCustomerData]);

  return {
    customerData,
    isSyncing,
    lastSync,
    validation,
    fetchCustomerData,
    syncAfterUpdate,
    validateBeforeSave,
    isValidating: false
  };
}

