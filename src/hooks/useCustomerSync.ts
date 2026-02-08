import { useEffect, useState, useCallback } from 'react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { toast } from 'sonner';
import { customerApi } from '@/services/customer-api';

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

  const isValidCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const validateCustomerData = useCallback((data: Partial<CustomerData>): ValidationResult => {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Email inválido';
    if (data.telefone) {
      const phone = data.telefone.replace(/\D/g, '');
      if (phone.length < 10 || phone.length > 11) errors.telefone = 'Telefone inválido';
    }
    if (data.cep && data.cep.replace(/\D/g, '').length !== 8) errors.cep = 'CEP inválido';
    if (data.cpf) {
      const cpf = data.cpf.replace(/\D/g, '');
      if (cpf.length !== 11 || !isValidCPF(cpf)) errors.cpf = 'CPF inválido';
    }
    if (data.nome && data.nome.length < 3) errors.nome = 'Nome curto';
    if (!data.telefone) warnings.push('Telefone não cadastrado');
    if (!data.endereco || !data.cidade || !data.estado) warnings.push('Endereço incompleto');

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }, []);

  const fetchCustomerData = useCallback(async (forceRefresh = false): Promise<CustomerData | null> => {
    if (!user?.id && !user?.email) return null;
    try {
      setIsSyncing(true);
      let data;
      try {
        data = await customerApi.getCustomerById(user.id!, forceRefresh);
      } catch (e) {
        if (user.email) data = await customerApi.getCustomerByEmail(user.email, forceRefresh);
        else throw e;
      }

      if (data) {
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

        const validationResult = validateCustomerData(customer);
        setValidation(validationResult);
        setCustomerData(customer);
        setLastSync(new Date());
        await updateUser(customer);

        if (validationResult.warnings.length > 0 && forceRefresh) {
          validationResult.warnings.forEach(w => toast.warning(w));
        }
        return customer;
      }
    } catch (error) {
      console.error('Erro de sincronização:', error);
      toast.error('Erro ao sincronizar perfil');
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [user, updateUser, validateCustomerData]);

  useEffect(() => {
    if (!user) return;
    fetchCustomerData();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) fetchCustomerData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, fetchCustomerData]);

  const syncAfterUpdate = useCallback(async () => {
    await fetchCustomerData(true);
    toast.success('Sincronizado');
  }, [fetchCustomerData]);

  const validateBeforeSave = useCallback((data: Partial<CustomerData>): boolean => {
    const v = validateCustomerData(data);
    setValidation(v);
    if (!v.isValid) {
      toast.error(Object.values(v.errors)[0] || 'Dados inválidos');
      return false;
    }
    v.warnings.forEach(w => toast.warning(w));
    return true;
  }, [validateCustomerData]);

  return {
    customerData, isSyncing, lastSync, validation,
    fetchCustomerData, syncAfterUpdate, validateBeforeSave, isValidating: false
  };
}
