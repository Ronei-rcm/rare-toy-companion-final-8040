/**
 * Handler para processar retorno do InfiniteTap
 * Baseado na documentação oficial: https://www.infinitepay.io/desenvolvedores#codeSetupBlock
 */
import { ordersApi } from '@/services/orders-api';

interface InfiniteTapResult {
  order_id: string;
  nsu: string; // Transaction identifier (UUID format)
  aut: string; // Authorization code
  card_brand: string; // Bandeira do cartão
  user_id: string;
  access_id: string;
  handle: string;
  merchant_document: string;
  warning?: string; // Apenas em caso de erro
}

/**
 * Processa o resultado retornado pelo InfiniteTap via deeplink
 * Chamado quando o InfinitePay retorna para o app após a transação
 */
export function processInfiniteTapReturn(url: string): InfiniteTapResult | null {
  try {
    // Extrair parâmetros da URL
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const result: InfiniteTapResult = {
      order_id: params.get('order_id') || '',
      nsu: params.get('nsu') || '',
      aut: params.get('aut') || '',
      card_brand: params.get('card_brand') || '',
      user_id: params.get('user_id') || '',
      access_id: params.get('access_id') || '',
      handle: params.get('handle') || '',
      merchant_document: params.get('merchant_document') || ''
    };

    // Verificar se há warning (indica erro)
    const warning = params.get('warning');
    if (warning) {
      result.warning = warning;
      console.warn('⚠️ [InfiniteTap] Transação com warning:', warning);
    }

    // Validar campos obrigatórios
    if (!result.order_id || !result.nsu) {
      console.error('❌ [InfiniteTap] Resultado inválido - campos obrigatórios faltando');
      return null;
    }

    console.log('✅ [InfiniteTap] Resultado processado:', result);
    return result;
  } catch (error) {
    console.error('❌ [InfiniteTap] Erro ao processar retorno:', error);
    return null;
  }
}

/**
 * Verifica se a URL atual é um retorno do InfiniteTap
 */
export function isInfiniteTapReturn(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'muhlstore:' && urlObj.pathname.includes('infinitetap');
  } catch {
    return false;
  }
}

/**
 * Envia o resultado da transação para o backend
 */
export async function sendTapResultToBackend(result: InfiniteTapResult): Promise<boolean> {
  try {
    const data = await ordersApi.getInfiniteTapResult(result.order_id);
    console.log('✅ [InfiniteTap] Resultado enviado ao backend:', data);
    return true;
  } catch (error) {
    console.error('❌ [InfiniteTap] Erro ao enviar resultado ao backend:', error);
    return false;
  }
}

