import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface InfiniteTapConfig {
  handle?: string; // InfinitePay handle (opcional)
  doc_number?: string; // CNPJ/CPF sem pontos (opcional)
  amount: number; // Valor em centavos (ex: 100 = R$ 1,00)
  payment_method: 'credit' | 'debit';
  installments?: number; // Número de parcelas (se credit)
  order_id: string; // ID do pedido gerado pelo sistema
  result_url: string; // Deeplink de retorno
  app_client_referrer: string; // Nome do app (ex: "MuhlStore")
}

interface InfiniteTapResult {
  order_id: string;
  nsu: string; // Transaction identifier (UUID)
  aut: string; // Authorization code
  card_brand: string; // Bandeira do cartão
  user_id: string;
  access_id: string;
  handle: string;
  merchant_document: string;
  warning?: string; // Apenas em caso de erro
}

export function useInfiniteTap() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionResult, setTransactionResult] = useState<InfiniteTapResult | null>(null);

  /**
   * Gera o deeplink do InfiniteTap para iniciar uma transação
   * Baseado na documentação oficial: https://www.infinitepay.io/desenvolvedores#codeSetupBlock
   */
  const generateTapDeeplink = useCallback((config: InfiniteTapConfig): string => {
    const baseUrl = 'infinitepay://tap';
    const params = new URLSearchParams();

    // Parâmetros opcionais de validação
    if (config.handle) params.append('handle', config.handle);
    if (config.doc_number) params.append('doc_number', config.doc_number);
    
    // Parâmetros obrigatórios
    params.append('amount', String(config.amount)); // Valor em centavos (int)
    params.append('payment_method', config.payment_method); // "credit" ou "debit"
    
    // Parcelas (obrigatório se payment_method = "credit")
    if (config.payment_method === 'credit') {
      params.append('installments', String(config.installments || 1));
    }
    
    params.append('order_id', config.order_id); // ID do pedido gerado pelo sistema
    params.append('result_url', config.result_url); // Deeplink de retorno (deve ser interno do app)
    params.append('app_client_referrer', config.app_client_referrer); // Nome do app (ex: "MuhlStore")
    
    // iOS specific - força o deeplink no iOS
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      params.append('af_force_deeplink', 'true');
    }

    const deeplink = `${baseUrl}?${params.toString()}`;
    console.log('🔗 [InfiniteTap] Deeplink gerado conforme documentação oficial:', deeplink);
    return deeplink;
  }, []);

  /**
   * Inicia uma transação InfiniteTap
   */
  const initiateTapTransaction = useCallback(async (
    amount: number,
    paymentMethod: 'credit' | 'debit',
    orderId: string,
    installments?: number,
    handle?: string,
    docNumber?: string
  ) => {
    try {
      setIsProcessing(true);
      setTransactionResult(null);

      // IMPORTANTE: result_url deve ser um deeplink interno do app, não uma URL HTTP
      // Exemplo: muhlstore://infinitetap/result?order_id=123
      // Isso permite que o InfinitePay retorne para o app após a transação
      const resultUrl = `muhlstore://infinitetap/result?order_id=${orderId}`;

      const config: InfiniteTapConfig = {
        handle, // Opcional: InfinitePay handle do comerciante
        doc_number: docNumber, // Opcional: CNPJ/CPF sem pontos
        amount: Math.round(amount * 100), // Converter para centavos (int)
        payment_method: paymentMethod, // "credit" ou "debit"
        installments: paymentMethod === 'credit' ? (installments || 1) : undefined, // Obrigatório se credit
        order_id: orderId, // ID do pedido gerado pelo sistema
        result_url: resultUrl, // Deeplink de retorno (deve ser interno)
        app_client_referrer: 'MuhlStore' // Nome do app para identificação
      };

      const deeplink = generateTapDeeplink(config);
      
      console.log('🔗 [InfiniteTap] Deeplink gerado:', deeplink);
      console.log('📋 [InfiniteTap] Config:', config);

      // Tentar abrir o app InfinitePay
      window.location.href = deeplink;

      // Verificar se o app foi aberto (timeout de 2 segundos)
      setTimeout(() => {
        // Se ainda estiver na mesma página, o app pode não estar instalado
        toast({
          title: 'App InfinitePay não encontrado',
          description: 'Por favor, instale o app InfinitePay para usar o InfiniteTap',
          variant: 'destructive'
        });
        setIsProcessing(false);
      }, 2000);

    } catch (error: any) {
      console.error('❌ [InfiniteTap] Erro ao iniciar transação:', error);
      toast({
        title: 'Erro ao iniciar pagamento',
        description: error.message || 'Não foi possível iniciar o pagamento',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  }, [generateTapDeeplink, toast]);

  /**
   * Processa o resultado retornado pelo InfiniteTap
   * Baseado na documentação oficial: https://www.infinitepay.io/desenvolvedores#codeSetupBlock
   * 
   * Parâmetros de sucesso:
   * - order_id: ID do pedido fornecido
   * - nsu: Transaction identifier (UUID format)
   * - aut: Authorization code (pode conter letras)
   * - card_brand: Bandeira do cartão (mastercard, visa, elo, etc)
   * - user_id: Internal user identifier
   * - access_id: Internal access/session identifier
   * - handle: User handle for identification
   * - merchant_document: CNPJ se aplicável
   * 
   * Parâmetros de erro:
   * - Todos os acima + warning: Mensagem de erro
   */
  const processTapResult = useCallback((urlParams: URLSearchParams): InfiniteTapResult | null => {
    try {
      const result: InfiniteTapResult = {
        order_id: urlParams.get('order_id') || '',
        nsu: urlParams.get('nsu') || '',
        aut: urlParams.get('aut') || '',
        card_brand: urlParams.get('card_brand') || '',
        user_id: urlParams.get('user_id') || '',
        access_id: urlParams.get('access_id') || '',
        handle: urlParams.get('handle') || '',
        merchant_document: urlParams.get('merchant_document') || ''
      };

      // Verificar se há warning (indica erro)
      const warning = urlParams.get('warning');
      if (warning) {
        result.warning = warning;
        console.warn('⚠️ [InfiniteTap] Transação com warning:', warning);
      }

      // Validar campos obrigatórios conforme documentação
      if (!result.order_id) {
        console.error('❌ [InfiniteTap] order_id não encontrado no resultado');
        return null;
      }

      if (!result.nsu) {
        console.error('❌ [InfiniteTap] nsu não encontrado no resultado');
        return null;
      }

      console.log('✅ [InfiniteTap] Resultado processado:', result);
      setTransactionResult(result);
      return result;
    } catch (error) {
      console.error('❌ [InfiniteTap] Erro ao processar resultado:', error);
      return null;
    }
  }, []);

  /**
   * Verifica se o InfinitePay está instalado
   */
  const checkAppInstalled = useCallback((): boolean => {
    // Tentar detectar se o app está instalado
    // Isso é uma aproximação, não é 100% confiável
    return true; // Assumimos que está instalado, o erro virá na tentativa de abrir
  }, []);

  return {
    isProcessing,
    transactionResult,
    initiateTapTransaction,
    processTapResult,
    generateTapDeeplink,
    checkAppInstalled
  };
}

