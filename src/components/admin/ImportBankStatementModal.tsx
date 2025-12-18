import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ImportBankStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contaId?: number;
}

interface ParsedTransaction {
  data: string;
  hora?: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conta_id?: number;
  metodo_pagamento?: string;
  origem?: string;
  categoria?: string;
  observacoes?: string;
  detalhe?: string;
}

export default function ImportBankStatementModal({
  isOpen,
  onClose,
  onSuccess,
  contaId
}: ImportBankStatementModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [formatType, setFormatType] = useState<'auto' | 'csv' | 'excel'>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    console.log('📄 Arquivo selecionado:', {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size
    });

    // Validar tipo de arquivo
    const isCSV = selectedFile.name.toLowerCase().endsWith('.csv') || 
                  selectedFile.type === 'text/csv' ||
                  selectedFile.type === 'text/plain';
    
    const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') ||
                    selectedFile.name.toLowerCase().endsWith('.xls') ||
                    selectedFile.type === 'application/vnd.ms-excel' ||
                    selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const isPDF = selectedFile.name.toLowerCase().endsWith('.pdf') ||
                  selectedFile.type === 'application/pdf';

    if (!isCSV && !isExcel && !isPDF) {
      toast.error('Por favor, selecione um arquivo CSV, Excel ou PDF (.csv, .xlsx, .xls, .pdf)');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    // Avisar se for Excel
    if (isExcel) {
      toast.info('Arquivos Excel serão suportados em breve. Por enquanto, exporte como CSV primeiro.');
      return;
    }

    // Se for PDF, processar no backend
    if (isPDF) {
      toast.info('Processando PDF do InfinitePay...');
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (contaId) {
          formData.append('conta_id', contaId.toString());
        }

        setLoading(true);
        setUploadProgress(10);
        
        const response = await fetch('/api/financial/bank-statements/import-pdf', {
          method: 'POST',
          body: formData
        });

        setUploadProgress(90);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Erro ao processar PDF';
          const suggestion = errorData.suggestion || '';
          
          if (errorMessage.includes('escaneado') || errorMessage.includes('imagem')) {
            throw new Error(`${errorMessage}\n\n💡 ${suggestion || 'Recomendação: Exporte o relatório como CSV diretamente do InfinitePay para importação automática.'}`);
          } else {
            throw new Error(errorMessage + (suggestion ? `\n\n💡 ${suggestion}` : ''));
          }
        }

        const result = await response.json();
        setUploadProgress(100);
        
        toast.success(`✅ ${result.imported || 0} transações importadas do PDF mensal!`);
        onSuccess();
        onClose();
        return;
      } catch (error: any) {
        console.error('Erro ao importar PDF:', error);
        toast.error(error.message || 'Erro ao processar PDF. Verifique se o arquivo é um relatório válido do InfinitePay.');
        setUploadProgress(0);
      } finally {
        setLoading(false);
      }
    }

    // Validar tamanho (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    // Se não for PDF, processar no frontend (CSV)
    if (!isPDF) {
      setFile(selectedFile);
      
      // Tentar fazer parse automático
      try {
        console.log('🔄 Iniciando parse do arquivo...');
        const parsed = await parseFile(selectedFile);
        console.log('✅ Parse concluído:', parsed.length, 'transações');
        
        // Log detalhado da primeira transação para debug
        if (parsed.length > 0) {
          console.log('🔍 PRIMEIRA TRANSAÇÃO PARSEADA (para verificação na tabela):', {
            data: parsed[0].data,
            hora: parsed[0].hora,
            metodo_pagamento: parsed[0].metodo_pagamento,
            origem: parsed[0].origem,
            detalhe: parsed[0].detalhe,
            descricao: parsed[0].descricao,
            tipo: parsed[0].tipo,
            valor: parsed[0].valor,
            categoria: parsed[0].categoria,
            observacoes: parsed[0].observacoes?.substring(0, 150)
          });
        }
        
        setParsedData(parsed);
        setPreviewMode(true);
        toast.success(`${parsed.length} transações encontradas!`);
      } catch (error: any) {
        console.error('❌ Erro ao fazer parse:', error);
        toast.error(error.message || 'Erro ao processar arquivo. Verifique se é um CSV válido.');
      }
    }
    // PDF já foi processado acima e retornou
  };

  // Função para corrigir problemas de codificação comuns
  const fixEncoding = (text: string): string => {
    // Corrigir problemas comuns de codificação
    return text
      .replace(/transaÃ§Ã£o/gi, 'transação')
      .replace(/DepÃ³sito/gi, 'Depósito')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã£/g, 'ã')
      .replace(/Ãµ/g, 'õ')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã¢/g, 'â')
      .replace(/Ã /g, 'à')
      .replace(/Ã§/g, 'ç');
  };

  const parseFile = async (file: File): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // Tentar diferentes codificações para resolver problemas de caracteres especiais
      const tryEncodings = ['UTF-8', 'ISO-8859-1', 'Windows-1252'];
      let encodingIndex = 0;
      let textProcessed = false;

      reader.onload = (e) => {
        try {
          let text = e.target?.result as string;
          
          if (!text || text.trim().length === 0) {
            // Se texto vazio e ainda há codificações para tentar
            if (encodingIndex < tryEncodings.length - 1) {
              encodingIndex++;
              reader.readAsText(file, tryEncodings[encodingIndex] as any);
              return;
            }
            reject(new Error('Arquivo vazio ou inválido'));
            return;
          }
          
          // Corrigir problemas de codificação
          text = fixEncoding(text);
          
          // Se já processou, não processar novamente
          if (textProcessed) return;
          textProcessed = true;
          
          // Detectar se é CSV (por nome ou tipo)
          const isCSV = file.name.toLowerCase().endsWith('.csv') || 
                       file.type === 'text/csv' ||
                       file.type === 'text/plain';
          
          const isPDF = file.name.toLowerCase().endsWith('.pdf') ||
                       file.type === 'application/pdf';
          
          if (!isCSV && !isPDF) {
            reject(new Error('Por favor, selecione um arquivo CSV ou PDF. Arquivos Excel (.xlsx, .xls) ainda não são suportados diretamente. Exporte como CSV primeiro.'));
            return;
          }
          
          // PDFs são processados no backend, não no frontend
          if (isPDF) {
            reject(new Error('PDFs devem ser processados pelo backend. Use a função de upload do modal.'));
            return;
          }

          const lines = text.split(/\r?\n/).filter(line => line.trim());
          
          console.log('📊 Total de linhas no arquivo:', lines.length);
          console.log('📄 Primeiras 3 linhas:', lines.slice(0, 3));
          
          if (lines.length === 0) {
            reject(new Error('Arquivo CSV vazio. Verifique se o arquivo foi salvo corretamente.'));
            return;
          }
          
          if (lines.length === 1) {
            const header = lines[0];
            console.log('📋 Cabeçalho detectado:', header);
            reject(new Error(
              'Arquivo CSV contém apenas cabeçalho, sem dados de transações.\n\n' +
              'Como corrigir:\n' +
              '1. Verifique se o arquivo Excel tem dados além do cabeçalho\n' +
              '2. Ao exportar, certifique-se de selecionar todas as linhas com dados\n' +
              '3. Salve como "CSV (delimitado por vírgulas)"\n\n' +
              'Formato esperado:\n' +
              'Data,Hora,Tipo de transação,Nome,Detalhe,Valor\n' +
              '2025-12-06,15:49:20,Pix,Nome da Pessoa,Recebido,30,00'
            ));
            return;
          }
          
          // Verificar se há pelo menos uma linha de dados (além do cabeçalho)
          const dataLines = lines.slice(1).filter(line => {
            // Verificar se a linha tem conteúdo válido (não apenas vírgulas ou ponto e vírgula)
            const hasContent = line.replace(/[,;]/g, '').trim().length > 0;
            return hasContent;
          });
          
          if (dataLines.length === 0) {
            reject(new Error('Nenhuma linha de dados válida encontrada. Verifique se o arquivo CSV contém transações além do cabeçalho.'));
            return;
          }
          
          console.log('✅ Linhas de dados válidas encontradas:', dataLines.length);

          const transactions: ParsedTransaction[] = [];

          // Detectar formato do arquivo (InfinitePay ou genérico)
          const header = lines[0]?.toLowerCase() || '';
          const isInfinitePayFormat = header.includes('data') && 
                                     header.includes('hora') && 
                                     header.includes('tipo de transa') &&
                                     header.includes('nome') &&
                                     header.includes('detalhe') &&
                                     header.includes('valor');

          console.log('📋 Formato detectado:', isInfinitePayFormat ? 'InfinitePay' : 'Genérico');
          console.log('📋 Cabeçalho:', header);

          // Processar linhas de dados (pular header na linha 0)
          console.log(`🔄 Processando ${lines.length - 1} linhas de dados...`);
          let linhasProcessadas = 0;
          let linhasIgnoradas = 0;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) {
              linhasIgnoradas++;
              continue;
            }

            try {
              linhasProcessadas++;
              // Detectar delimitador (vírgula ou ponto e vírgula)
              // Contar qual delimitador aparece mais
              const commaCount = (line.match(/,/g) || []).length;
              const semicolonCount = (line.match(/;/g) || []).length;
              const delimiter = semicolonCount > commaCount ? ';' : ',';
              
              // Dividir preservando valores entre aspas
              // Regex para dividir por vírgula, mas preservar strings entre aspas
              let columns: string[] = [];
              if (delimiter === ',') {
                // Dividir por vírgula, mas preservar valores entre aspas
                const regex = /(".*?"|[^,]+)(?=\s*,|\s*$)/g;
                const matches = line.match(regex);
                if (matches) {
                  columns = matches.map(col => {
                    // Remover aspas externas e espaços
                    return col.trim().replace(/^["']|["']$/g, '').trim();
                  });
                } else {
                  // Fallback: dividir simples
                  columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
                }
              } else {
                columns = line.split(delimiter).map(col => col.trim().replace(/^["']|["']$/g, ''));
              }

              if (columns.length < 4) {
                console.warn(`Linha ${i + 1} ignorada: poucas colunas (${columns.length})`);
                continue;
              }

              // Função auxiliar para extrair valor numérico de uma string (suporta sinal + ou -)
              const extractValue = (str: string): { valor: number; sinal: '+' | '-' } => {
                if (!str) return { valor: 0, sinal: '+' };
                
                // Detectar sinal no início
                const temSinalPositivo = str.trim().startsWith('+');
                const temSinalNegativo = str.trim().startsWith('-');
                const sinal: '+' | '-' = temSinalNegativo ? '-' : '+';
                
                const cleaned = str
                  .replace(/^[+\-]/g, '') // Remover sinal do início
                  .replace(/R\$/g, '')
                  .replace(/[^\d,.-]/g, '')
                  .trim();
                
                if (!cleaned || cleaned === '-' || cleaned === '0') {
                  return { valor: 0, sinal: '+' };
                }
                
                let valor = 0;
                // Formato brasileiro: 1.234,56 ou 80,00
                if (cleaned.includes('.') && cleaned.includes(',')) {
                  // Formato: 1.234,56
                  valor = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
                } else if (cleaned.includes(',')) {
                  // Formato: 80,00 ou 1234,56
                  valor = parseFloat(cleaned.replace(',', '.'));
                } else {
                  // Formato: 1234.56 ou 1234
                  valor = parseFloat(cleaned);
                }
                
                return { valor: isNaN(valor) ? 0 : valor, sinal };
              };

              let data = '';
              let hora = '';
              let tipoTransacao = '';
              let nome = '';
              let detalhe = '';
              let valorStr = '';
              let valorColIndex = -1;

              if (isInfinitePayFormat) {
                // Formato InfinitePay: Data,Hora,Tipo de transação,Nome,Detalhe,Valor (R$)
                // Exemplo: 2025-12-12,20:03:19,Pix,Pix KAUAN SELAU SZCZESNY,Recebido,"+R$ 80,00"
                data = columns[0]?.trim() || '';
                hora = columns[1]?.trim() || '';
                tipoTransacao = columns[2]?.trim() || '';
                nome = columns[3]?.trim() || '';
                detalhe = columns[4]?.trim() || '';
                valorStr = columns[5]?.trim() || '';
                valorColIndex = 5;
              } else {
                // Formato genérico - tentar detectar automaticamente
                data = columns[0]?.trim() || '';
                
                // Tentar extrair hora da primeira coluna se tiver formato "DD/MM/YYYY HH:MM"
                if (data.includes(' ')) {
                  const parts = data.split(' ');
                  if (parts.length > 1) {
                    hora = parts[1] || '';
                    data = parts[0] || '';
                  }
                }
                
                tipoTransacao = columns.length > 2 ? columns[2]?.trim() : '';
                nome = columns.length > 3 ? columns[3]?.trim() : '';
                detalhe = columns.length > 4 ? columns[4]?.trim() : '';
                
                // Procurar valor na última coluna ou em colunas posteriores
                for (let j = columns.length - 1; j >= 0; j--) {
                  const col = columns[j]?.trim() || '';
                  if (col.includes('R$') || col.match(/^[+\-]?[\d.,]+$/)) {
                    valorStr = col;
                    valorColIndex = j;
                    break;
                  }
                }
              }

              if (!data) {
                console.warn(`Linha ${i + 1} ignorada: sem data`);
                continue;
              }

              // Parse do valor
              const { valor, sinal } = extractValue(valorStr);

              if (isNaN(valor) || valor === 0) {
                console.warn(`Linha ${i + 1} ignorada: valor inválido (${valorStr})`);
                continue;
              }

              // Determinar tipo de transação
              // Para InfinitePay: usar o campo "Detalhe" (Recebido = entrada, Enviado = saída, Devolvido = entrada)
              const detalheLower = (detalhe || '').toLowerCase();
              const tipoLower = (tipoTransacao || '').toLowerCase();
              
              let isCredito = false;
              
              if (isInfinitePayFormat) {
                // Formato InfinitePay: usar campo "Detalhe" e "Tipo de transação"
                // "Depósito de vendas" sempre é entrada
                if (tipoLower.includes('depósito') || tipoLower.includes('deposito') || 
                    tipoLower.includes('vendas') || tipoLower.includes('venda')) {
                  isCredito = true;
                } else if (detalheLower.includes('recebido') || 
                          detalheLower.includes('devolvido')) {
                  isCredito = true;
                } else if (detalheLower.includes('enviado')) {
                  isCredito = false;
                } else {
                  // Se não tiver detalhe, usar sinal do valor
                  isCredito = sinal === '+';
                }
              } else {
                // Formato genérico: usar heurística
                isCredito = detalheLower.includes('recebido') || 
                           detalheLower.includes('entrada') ||
                           detalheLower.includes('credito') ||
                           detalheLower.includes('crédito') ||
                           detalheLower.includes('recebimento') ||
                           tipoLower.includes('depósito') ||
                           tipoLower.includes('deposito') ||
                           (tipoLower.includes('pix') && !detalheLower.includes('pagamento')) ||
                           sinal === '+';
              }

              const tipo = isCredito ? 'credito' : 'debito';

              // Criar descrição
              let descricao = '';
              if (isInfinitePayFormat) {
                // Formato InfinitePay: usar nome como descrição principal
                descricao = nome || tipoTransacao || 'Transação importada';
                if (detalhe) {
                  descricao = `${descricao} - ${detalhe}`;
                }
              } else {
                // Formato genérico
                descricao = nome 
                  ? `${nome}${detalhe ? ` - ${detalhe}` : ''}${tipoTransacao ? ` (${tipoTransacao})` : ''}`
                  : `${detalhe || tipoTransacao || 'Transação importada'}`;
              }
              
              descricao = descricao.substring(0, 255);

              // Preparar dados da transação com TODOS os campos do CSV
              // SEMPRE preencher todos os campos, independente do formato
              const transactionData: ParsedTransaction = {
                data: parseDate(data),
                hora: hora || undefined,
                descricao: descricao,
                valor: Math.abs(valor),
                tipo: tipo,
                conta_id: contaId,
                detalhe: detalhe || '', // Campo detalhe para exibição
                // SEMPRE preencher método e origem
                metodo_pagamento: tipoTransacao || 'PIX',
                origem: nome || 'Extrato Bancário',
                categoria: 'Outros' // Será ajustado abaixo se necessário
              };

              // Categorizar baseado no tipo de transação (para InfinitePay ou genérico)
              if (tipoLower.includes('depósito') || 
                  tipoLower.includes('deposito') ||
                  tipoLower.includes('vendas') ||
                  tipoLower.includes('venda')) {
                transactionData.categoria = 'Vendas';
              } else if (tipoLower.includes('pix')) {
                transactionData.categoria = 'Transferência';
              } else {
                transactionData.categoria = 'Outros';
              }
              
              // Adicionar observações com TODAS as informações adicionais para referência completa
              const obsParts = [];
              if (hora) obsParts.push(`Hora: ${hora}`);
              if (tipoTransacao) obsParts.push(`Tipo: ${tipoTransacao}`);
              if (nome) obsParts.push(`Nome: ${nome}`);
              if (detalhe) obsParts.push(`Detalhe: ${detalhe}`);
              obsParts.push(`Valor original: ${valorStr}`);
              obsParts.push(`Importado em: ${new Date().toLocaleString('pt-BR')}`);
              
              transactionData.observacoes = obsParts.join(' | ');
              
              // Log para debug - verificar se todos os campos estão preenchidos
              console.log('📝 Transação parseada (TODOS os campos):', {
                data: transactionData.data,
                hora: transactionData.hora || 'N/A',
                metodo_pagamento: transactionData.metodo_pagamento || 'N/A',
                origem: transactionData.origem || 'N/A',
                categoria: transactionData.categoria || 'N/A',
                tipo: transactionData.tipo,
                valor: transactionData.valor,
                detalhe: transactionData.detalhe || 'N/A',
                observacoes: transactionData.observacoes?.substring(0, 100) || 'N/A',
                // Campos originais do CSV para verificação
                csv_original: {
                  data_raw: data,
                  hora_raw: hora,
                  tipoTransacao_raw: tipoTransacao,
                  nome_raw: nome,
                  detalhe_raw: detalhe,
                  valorStr_raw: valorStr
                }
              });

              transactions.push(transactionData);
            } catch (err: any) {
              console.warn(`Erro ao processar linha ${i + 1}:`, err.message || err);
              continue;
            }
          }

          console.log(`📊 Estatísticas do parse:`);
          console.log(`   - Linhas processadas: ${linhasProcessadas}`);
          console.log(`   - Linhas ignoradas: ${linhasIgnoradas}`);
          console.log(`   - Transações válidas: ${transactions.length}`);

          if (transactions.length === 0) {
            reject(new Error('Nenhuma transação válida encontrada no arquivo. Verifique o formato do CSV.'));
            return;
          }

          console.log('✅ Transações parseadas:', transactions.length);
          resolve(transactions);
        } catch (error: any) {
          console.error('❌ Erro no parse:', error);
          reject(error instanceof Error ? error : new Error('Erro desconhecido ao processar arquivo'));
        }
      };

      reader.onerror = () => {
        console.error('❌ Erro ao ler arquivo');
        // Se ainda há codificações para tentar
        if (encodingIndex < tryEncodings.length - 1) {
          encodingIndex++;
          reader.readAsText(file, tryEncodings[encodingIndex] as any);
          return;
        }
        reject(new Error('Erro ao ler o arquivo. Tente novamente.'));
      };

      // Iniciar leitura com UTF-8
      console.log(`🔄 Tentando codificação: ${tryEncodings[encodingIndex]}`);
      reader.readAsText(file, tryEncodings[encodingIndex] as any);
    });
  };

  const parseDate = (dateStr: string): string => {
    // Tentar vários formatos de data
    // Formato esperado: 2025-12-06 (ISO) ou 06/12/2025 (brasileiro)
    try {
      if (!dateStr || dateStr.trim() === '') {
        // Se não tiver data, usar data atual
        return new Date().toISOString().split('T')[0];
      }

      const trimmed = dateStr.trim();
      
      // Formato ISO (YYYY-MM-DD) - usado pelo InfinitePay
      if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return trimmed;
      }
      
      // Formato ISO com hora (YYYY-MM-DD HH:MM:SS)
      if (trimmed.includes('-') && trimmed.includes(' ')) {
        return trimmed.split(' ')[0];
      }
      
      // Formato brasileiro DD/MM/YYYY
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          // Validar se é formato DD/MM/YYYY ou MM/DD/YYYY
          if (parseInt(day) > 12) {
            // DD/MM/YYYY
            return `${year}-${month}-${day}`;
          } else {
            // Pode ser MM/DD/YYYY, assumir DD/MM/YYYY para Brasil
            return `${year}-${month}-${day}`;
          }
        }
      }
      
      // Tentar parsear como Date e converter para ISO
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      return trimmed;
    } catch (error) {
      console.warn('Erro ao parsear data:', dateStr, error);
      // Fallback: retornar data atual
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleUpload = async () => {
    if (!file || parsedData.length === 0) {
      toast.error('Nenhum dado para importar');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactions', JSON.stringify(parsedData));
      if (contaId) {
        formData.append('conta_id', contaId.toString());
      }

      const response = await fetch('/api/financial/bank-statements/import', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao importar extrato');
      }

      const result = await response.json();
      
      toast.success(`✅ ${result.imported || parsedData.length} transações importadas com sucesso!`);
      
      // Resetar estado
      setFile(null);
      setParsedData([]);
      setPreviewMode(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast.error(error.message || 'Erro ao importar extrato');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setPreviewMode(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Debug
  useEffect(() => {
    console.log('🔍 ImportBankStatementModal - isOpen:', isOpen);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔍 Dialog onOpenChange chamado com:', open);
      if (!open) {
        handleClose();
      } else {
        console.log('🔍 Modal abrindo...');
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato Bancário
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou PDF com as movimentações bancárias.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Formatos suportados: CSV (InfinitPay) ou PDF (Relatório mensal InfinitPay)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Area */}
          {!previewMode && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <FileSpreadsheet className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Formato suportado: CSV (.csv)
                  </p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    💡 Arquivos Excel: exporte como CSV primeiro
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tamanho máximo: 10MB
                  </p>
                </div>
                {file && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Mode */}
          {previewMode && parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">
                    {parsedData.length} transações encontradas
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewMode(false);
                    resetModal();
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Trocar Arquivo
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96" style={{ minWidth: '100%' }}>
                  <table className="w-full text-sm border-collapse" style={{ minWidth: '1200px' }}>
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Data</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Hora</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Tipo Transação</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Nome</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Detalhe</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Descrição</th>
                        <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[80px]">Tipo</th>
                        <th className="p-2 text-right border-b font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((trans, index) => {
                        // Extrair detalhe das observações se não estiver direto
                        let detalheExibido = trans.detalhe || '-';
                        if (!detalheExibido || detalheExibido === '-') {
                          const detalheFromObs = trans.observacoes?.split('|').find((o: string) => o.includes('Detalhe:'))?.replace('Detalhe:', '').trim();
                          if (detalheFromObs) detalheExibido = detalheFromObs;
                        }
                        
                        // Log para debug
                        if (index === 0) {
                          console.log('🔍 Primeira transação na tabela:', {
                            data: trans.data,
                            hora: trans.hora,
                            metodo_pagamento: trans.metodo_pagamento,
                            origem: trans.origem,
                            detalhe: trans.detalhe,
                            descricao: trans.descricao,
                            tipo: trans.tipo,
                            valor: trans.valor
                          });
                        }
                        
                        return (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-2 font-medium border-r whitespace-nowrap">
                              {new Date(trans.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-2 text-gray-600 text-xs border-r whitespace-nowrap">
                              {trans.hora || '-'}
                            </td>
                            <td className="p-2 border-r">
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 font-medium whitespace-nowrap">
                                {trans.metodo_pagamento || 'N/A'}
                              </span>
                            </td>
                            <td className="p-2 border-r" title={trans.origem || 'N/A'}>
                              <div className="max-w-xs truncate text-gray-700 font-medium">
                                {trans.origem || 'N/A'}
                              </div>
                            </td>
                            <td className="p-2 border-r text-xs text-gray-600 max-w-xs">
                              <div className="truncate" title={detalheExibido}>
                                {detalheExibido}
                              </div>
                            </td>
                            <td className="p-2 border-r" title={trans.descricao}>
                              <div className="max-w-xs truncate">{trans.descricao}</div>
                            </td>
                            <td className="p-2 border-r">
                              <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                trans.tipo === 'credito' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {trans.tipo === 'credito' ? 'Crédito' : 'Débito'}
                              </span>
                            </td>
                            <td className="p-2 text-right font-semibold whitespace-nowrap">
                              <span className={trans.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}>
                                {trans.tipo === 'credito' ? '+' : '-'}R$ {trans.valor.toFixed(2).replace('.', ',')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importando transações...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            {previewMode && parsedData.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {parsedData.length} Transações
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

