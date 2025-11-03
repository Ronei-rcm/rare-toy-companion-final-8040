import { useState } from 'react';

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function useCepLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCep = async (cep: string): Promise<CepData | null> => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    // Validação básica
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Tenta ViaCEP primeiro
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data: CepData = await response.json();

      if (data.erro) {
        setError('CEP não encontrado');
        setLoading(false);
        return null;
      }

      setLoading(false);
      return data;
    } catch (err) {
      console.error('Erro ao consultar CEP:', err);
      setError('Erro ao consultar CEP. Verifique sua conexão.');
      setLoading(false);
      return null;
    }
  };

  return { lookupCep, loading, error };
}

