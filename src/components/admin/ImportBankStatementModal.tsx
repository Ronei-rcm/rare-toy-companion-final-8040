import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useAutoCategorization } from '@/services/AutoCategorizationService';

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
  valor_bruto?: number;
  tipo: 'entrada' | 'saida';
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
  const [contas, setContas] = useState<any[]>([]);
  const [selectedContaId, setSelectedContaId] = useState<string | null>(contaId?.toString() || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<Map<number, { categoria: string; confidence: number }>>(new Map());

  useEffect(() => {
    const fetchContas = async () => {
      try {
        const response = await fetch('/api/financial/contas');
        if (response.ok) {
          const data = await response.json();
          setContas(data.contas || []);
          // Se não tiver contaId vinda por prop e houver contas, seleciona a primeira
          if (!contaId && data.contas && data.contas.length > 0 && !selectedContaId) {
            setSelectedContaId(data.contas[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Erro ao buscar contas:', error);
      }
    };

    if (isOpen) {
      fetchContas();
      setSelectedContaId(contaId?.toString() || null);
      carregarTransacoes();
    }
  }, [isOpen, contaId]);

  // Carregar transações para o serviço de categorização
  const carregarTransacoes = async () => {
    try {
      const response = await fetch('/api/financial/transactions');
      if (response.ok) {
        const data = await response.json();
        setAllTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  // Inicializar serviço de categorização
  const { suggestCategory } = useAutoCategorization(allTransactions);

  // Gerar sugestões quando parsedData mudar
  useEffect(() => {
    if (parsedData.length > 0 && allTransactions.length > 0) {
      const suggestions = new Map<number, { categoria: string; confidence: number }>();

      parsedData.forEach((trans, index) => {
        const suggestion = suggestCategory(trans.descricao, trans.tipo);
        if (suggestion && suggestion.confidence >= 0.5) { // Mínimo 50% de confiança
          suggestions.set(index, {
            categoria: suggestion.categoria,
            confidence: suggestion.confidence
          });
        }
      });

      setCategorySuggestions(suggestions);

      if (suggestions.size > 0) {
        toast.success(`${suggestions.size} sugestões de categoria geradas!`);
      }
    }
  }, [parsedData, allTransactions]);

  // Aplicar sugestão de categoria
  const aplicarSugestao = (index: number) => {
    const suggestion = categorySuggestions.get(index);
    if (suggestion) {
      const newData = [...parsedData];
      newData[index] = { ...newData[index], categoria: suggestion.categoria };
      setParsedData(newData);

      // Remover sugestão após aplicar
      const newSuggestions = new Map(categorySuggestions);
      newSuggestions.delete(index);
      setCategorySuggestions(newSuggestions);

      toast.success('Categoria aplicada!');
    }
  };

  // Aplicar todas as sugestões
  const aplicarTodasSugestoes = () => {
    const newData = [...parsedData];
    let count = 0;

    categorySuggestions.forEach((suggestion, index) => {
      newData[index] = { ...newData[index], categoria: suggestion.categoria };
      count++;
    });

    setParsedData(newData);
    setCategorySuggestions(new Map());
    toast.success(`${count} categorias aplicadas!`);
  };

  const handleFileSelect = async (selectedFile: File) => {
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
        const parsed = await parseFile(selectedFile);
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
      .replace(/Ã-quido/gi, 'líquido')
      .replace(/LÃ-quido/gi, 'Líquido')
      .replace(/DÃ©bito/gi, 'Débito')
      .replace(/CrÃ©dito/gi, 'Crédito')
      .replace(/transaÃ§Ã£o/gi, 'transação')
      .replace(/DepÃ³sito/gi, 'Depósito')
      .replace(/CartÃ£o/gi, 'Cartão')
      .replace(/MÃªs/gi, 'Mês')
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
      .replace(/Ã /g, 'à');
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

          if (lines.length === 0) {
            reject(new Error('Arquivo CSV vazio. Verifique se o arquivo foi salvo corretamente.'));
            return;
          }

          if (lines.length === 1) {
            const header = lines[0];
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

          const transactions: ParsedTransaction[] = [];

          // Helper: dividir linha CSV em colunas (vírgula, preservando aspas)
          const splitCsvLine = (line: string, delim: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === delim && !inQuotes) {
                result.push(current.trim().replace(/^["']|["']$/g, '').trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim().replace(/^["']|["']$/g, '').trim());
            return result;
          };

          // Detectar formato do arquivo (InfinitePay, Relatório CSV ou genérico com Valor/Líquido)
          const headerLine = lines[0] || '';
          const headerLower = headerLine.toLowerCase();
          const isInfinitePayFormat = headerLower.includes('data') &&
            headerLower.includes('hora') &&
            headerLower.includes('tipo de transa') &&
            headerLower.includes('nome') &&
            headerLower.includes('detalhe') &&
            headerLower.includes('valor');
          // Formato "Relatório CSV - InfinitePay": pode ter "Data e hora", "Valor bruto", "Valor líquido", "Descrição", etc.
          const isRelatorioFormat = (headerLower.includes('relatório') || headerLower.includes('relatorio')) ||
            (headerLower.includes('valor') && (headerLower.includes('líquido') || headerLower.includes('liquido') || headerLower.includes('bruto')));

          // Para CSV com colunas nomeadas: detectar "Valor (R$)" e "Líquido (R$)" (e variantes de encoding)
          const commaCountH = (headerLine.match(/,/g) || []).length;
          const semicolonCountH = (headerLine.match(/;/g) || []).length;
          const delimiterHeader = semicolonCountH > commaCountH ? ';' : ',';
          const headerColumns = splitCsvLine(headerLine, delimiterHeader);
          const normalizeHeaderName = (name: string) =>
            name.toLowerCase()
              .replace(/\s+/g, ' ')
              .replace(/Ã­/g, 'í').replace(/Ã£o/g, 'ão').replace(/Ã§/g, 'ç')
              .replace(/Ã©/g, 'é').replace(/Ã /g, 'à')
              .replace(/lÃ./g, 'li').replace(/lÃ-/g, 'li').replace(/lÃ­/g, 'li');
          const headerNamesNorm = headerColumns.map(normalizeHeaderName);
          const idxLiquido = headerNamesNorm.findIndex(n =>
            (n.includes('liquido') || n.includes('líquido')) && (n.includes('r$') || n.includes('valor') || n.length < 20)
          );
          const idxValor = headerNamesNorm.findIndex(n =>
            n.includes('valor') && (n.includes('r$') || n.includes('(r$)')) && !n.includes('liquido') && !n.includes('líquido')
          );
          const hasValorLiquidoColumns = idxLiquido >= 0 || idxValor >= 0;

          // Processar linhas de dados (pular header na linha 0)
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            try {
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

              // Função auxiliar para extrair valor numérico (suporta BR, US, centavos e corrige valores absurdos)
              const extractValue = (str: string): { valor: number; sinal: '+' | '-' } => {
                if (!str) return { valor: 0, sinal: '+' };
                // Valor líquido pode vir composto: "57,21 '-0,79" — usar só o primeiro número
                let strVal = str.trim();
                // Extrair valor e sinal de forma robusta
                const strRaw = strVal.trim();

                // Detectar sinal: '-' ou parênteses '(100,00)' ou '("-100,00")'
                const isNegative = strRaw.startsWith('-') ||
                  (strRaw.startsWith('(') && strRaw.endsWith(')')) ||
                  strRaw.includes('"-') ||
                  strRaw.includes('(-');

                const sinal: '+' | '-' = isNegative ? '-' : '+';

                // Normalizar: remover R$, aspas, espaços, parênteses, manter apenas dígitos e separadores
                let cleaned = strRaw
                  .replace(/R\$/gi, '')
                  .replace(/["'()]/g, '')
                  .replace(/\s/g, '')
                  .replace(/[^\d,.]/g, '')
                  .trim();

                if (!cleaned || cleaned === '0') return { valor: 0, sinal: '+' };

                let valor = 0;
                const temVirgula = cleaned.includes(',');
                const temPonto = cleaned.includes('.');
                // BR: 1.234,56 ou 80,00 — vírgula é decimal
                if (temPonto && temVirgula) {
                  const br = cleaned.replace(/\./g, '').replace(',', '.');
                  valor = parseFloat(br);
                } else if (temVirgula) {
                  valor = parseFloat(cleaned.replace(',', '.'));
                } else if (temPonto) {
                  // US: 1,234.56 — ponto é decimal; vírgulas são milhares
                  valor = parseFloat(cleaned.replace(/,/g, ''));
                } else {
                  // Só dígitos: pode ser inteiro em reais ou em centavos
                  const num = parseFloat(cleaned);
                  valor = num;
                }

                if (isNaN(valor)) return { valor: 0, sinal: '+' };
                // Corrigir valores absurdos (> 10M): relatórios às vezes vêm em centavos ou com decimal errado
                const LIMITE_RAZOAVEL = 10_000_000;
                if (valor > LIMITE_RAZOAVEL) {
                  for (const div of [100, 1000, 10000, 100000]) {
                    const corrigido = valor / div;
                    if (corrigido <= LIMITE_RAZOAVEL && corrigido >= 0.01) {
                      valor = Math.round(corrigido * 100) / 100;
                      break;
                    }
                  }
                }
                return { valor, sinal };
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
                data = columns[0]?.trim() || '';
                hora = columns[1]?.trim() || '';
                tipoTransacao = columns[2]?.trim() || '';
                nome = columns[3]?.trim() || '';
                detalhe = columns[4]?.trim() || '';
                valorStr = columns[5]?.trim() || '';
                valorColIndex = 5;
              } else if (hasValorLiquidoColumns && (idxLiquido >= 0 || idxValor >= 0)) {
                // CSV com colunas Valor (R$) e Líquido (R$): preferir Líquido como valor da transação
                valorStr = (idxLiquido >= 0 && columns[idxLiquido]?.trim()) ? columns[idxLiquido].trim() : (columns[idxValor]?.trim() || '');
                valorColIndex = idxLiquido >= 0 ? idxLiquido : idxValor;
                const idxData = headerNamesNorm.findIndex(n => n.includes('data') && (n.includes('hora') || n.includes('e hora')));
                const idxHora = headerNamesNorm.findIndex(n => n === 'hora' || n.includes('hora'));
                const idxTipo = headerNamesNorm.findIndex(n => n.includes('meio') || n.includes('tipo') || n.includes('bandeira'));
                const idxNome = headerNamesNorm.findIndex(n => n.includes('origem') || n.includes('nome') || n.includes('par') || n.includes('descri'));
                const idxDetalhe = headerNamesNorm.findIndex(n => n.includes('detalhe') || n.includes('descri'));
                if (idxData >= 0 && columns[idxData]) {
                  const dataHora = columns[idxData].trim();
                  if (dataHora.includes(' ')) {
                    const [d, h] = dataHora.split(/\s+/);
                    data = (d || '').trim();
                    hora = (h || '').trim();
                  } else {
                    data = dataHora;
                  }
                } else {
                  data = columns[0]?.trim() || '';
                  if (data.includes(' ')) {
                    const parts = data.split(/\s+/);
                    data = parts[0] || '';
                    hora = parts[1] || '';
                  }
                }
                if (idxTipo >= 0 && columns[idxTipo]) tipoTransacao = columns[idxTipo].trim();
                if (idxNome >= 0 && columns[idxNome]) nome = columns[idxNome].trim();
                if (idxDetalhe >= 0 && columns[idxDetalhe]) detalhe = columns[idxDetalhe].trim();
              } else {
                // Formato genérico - tentar detectar automaticamente
                data = columns[0]?.trim() || '';
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
                for (let j = columns.length - 1; j >= 0; j--) {
                  const col = columns[j]?.trim() || '';
                  if (col.includes('R$') || col.match(/^[+\-]?[\d.,\s']+$/)) {
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

              // Parse do valor (líquido quando há coluna Líquido)
              const { valor, sinal } = extractValue(valorStr);

              if (isNaN(valor) || valor === 0) {
                console.warn(`Linha ${i + 1} ignorada: valor inválido (${valorStr})`);
                continue;
              }

              // Quando há Valor (R$) e Líquido (R$), calcular taxa e guardar valor_bruto para a transação
              let taxaValor = 0;
              let valorBrutoNum: number | undefined;
              if (hasValorLiquidoColumns && idxLiquido >= 0 && idxValor >= 0 && idxValor !== idxLiquido) {
                const valorBrutoStr = columns[idxValor]?.trim() || '';
                const { valor: valorBruto } = extractValue(valorBrutoStr);
                if (!isNaN(valorBruto) && valorBruto > 0) {
                  valorBrutoNum = Math.abs(valorBruto);
                  taxaValor = Math.round((valorBrutoNum - Math.abs(valor)) * 100) / 100;
                  if (taxaValor < 0) taxaValor = 0;
                }
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
                // Formato genérico/Relatório: usar heurística expandida
                const isExplicitoSaida = detalheLower.includes('enviado') ||
                  detalheLower.includes('saída') ||
                  detalheLower.includes('saida') ||
                  detalheLower.includes('pagamento');

                const isExplicitoEntrada = detalheLower.includes('recebido') ||
                  detalheLower.includes('entrada') ||
                  detalheLower.includes('entrada') ||
                  detalheLower.includes('recebimento') ||
                  detalheLower.includes('devolvido');

                const isVendaMeio = tipoLower.includes('débito') ||
                  tipoLower.includes('debito') ||
                  tipoLower.includes('crédito') ||
                  tipoLower.includes('credito') ||
                  tipoLower.includes('depósito') ||
                  tipoLower.includes('deposito');

                if (isExplicitoSaida) {
                  isCredito = false;
                } else if (isExplicitoEntrada || isVendaMeio || (valorBrutoNum && valorBrutoNum > 0)) {
                  isCredito = true;
                } else {
                  // Fallback final pelo sinal
                  isCredito = sinal === '+';
                }
              }

              const tipo = isCredito ? 'entrada' : 'saida';

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
                ...(valorBrutoNum != null && valorBrutoNum > 0 && { valor_bruto: valorBrutoNum }),
                tipo: tipo,
                conta_id: contaId,
                detalhe: detalhe || '',
                metodo_pagamento: tipoTransacao || 'PIX',
                origem: nome || 'Extrato Bancário',
                categoria: 'Outros'
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
              if (hasValorLiquidoColumns && idxLiquido >= 0) obsParts.push('Usado: Valor Líquido (R$)');
              if (taxaValor > 0) obsParts.push(`Taxa (R$): ${taxaValor.toFixed(2).replace('.', ',')}`);
              obsParts.push(`Importado em: ${new Date().toLocaleString('pt-BR')}`);

              transactionData.observacoes = obsParts.join(' | ');

              // Se tiver conta selecionada no estado, aplica à transação
              if (selectedContaId) {
                transactionData.conta_id = parseInt(selectedContaId);
              }

              transactions.push(transactionData);
            } catch (err: any) {
              console.warn(`Erro ao processar linha ${i + 1}:`, err.message || err);
              continue;
            }
          }

          if (transactions.length === 0) {
            reject(new Error('Nenhuma transação válida encontrada no arquivo. Verifique o formato do CSV.'));
            return;
          }

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
      if (trimmed.includes('/') || (trimmed.includes('.') && trimmed.split('.').length === 3)) {
        const separator = trimmed.includes('/') ? '/' : '.';
        const parts = trimmed.split(separator);
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          let year = parts[2];
          if (year.includes(' ')) year = year.split(' ')[0]; // Limpar se vier com hora

          return `${year}-${month}-${day}`;
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
      // Atualizar conta_id em todas as transações antes de enviar
      const finalData = parsedData.map(tx => ({
        ...tx,
        conta_id: selectedContaId ? parseInt(selectedContaId) : tx.conta_id
      }));
      formData.append('transactions', JSON.stringify(finalData));
      if (selectedContaId) {
        formData.append('conta_id', selectedContaId);
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
      const totalEnviadas = parsedData.length;
      const importadas = result.imported ?? 0;
      const jaExistiam = result.skippedDuplicates ?? 0;
      const erros = result.errors ?? [];

      if (importadas < totalEnviadas && erros.length > 0) {
        toast.warning(
          `${importadas} importadas, ${jaExistiam} já existiam. ${erros.length} falha(s).`,
          { description: erros.slice(0, 3).join(' • ') }
        );
      } else if (jaExistiam > 0 && importadas > 0) {
        toast.success(`✅ ${importadas} importada(s), ${jaExistiam} já existiam (não duplicadas).`);
      } else if (jaExistiam === totalEnviadas) {
        toast.info(`ℹ️ Todas as ${totalEnviadas} transações já estavam no sistema (nada novo importado).`);
      } else if (importadas === totalEnviadas) {
        toast.success(`✅ Todas as ${importadas} transações foram importadas com sucesso!`);
      } else {
        toast.success(`✅ ${importadas} transação(ões) importada(s) com sucesso!`);
      }

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
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      {/* Posição forçada por inline para não depender de zoom/parent: sempre centralizado no viewport */}
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-6 data-[state=open]:!translate-x-[-50%] data-[state=open]:!translate-y-[-50%] data-[state=closed]:!translate-x-[-50%] data-[state=closed]:!translate-y-[-50%]"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="flex-shrink-0">
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

        <div className="flex flex-col flex-1 min-h-0 space-y-4 py-4">
          {/* Área rolável: upload ou tabela */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
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

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="conta-select" className="text-sm font-medium whitespace-nowrap">Conta destino:</Label>
                      <Select
                        value={selectedContaId || ""}
                        onValueChange={(val) => setSelectedContaId(val)}
                      >
                        <SelectTrigger id="conta-select" className="w-[200px] h-9">
                          <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent>
                          {contas.map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.nome} {c.banco ? `(${c.banco})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {categorySuggestions.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={aplicarTodasSugestoes}
                        className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Aplicar {categorySuggestions.size} Sugestões
                      </Button>
                    )}

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
                          <th className="p-2 text-right border-b font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Valor Bruto (R$)</th>
                          <th className="p-2 text-right border-b font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">Valor Líquido (R$)</th>
                          <th className="p-2 text-left border-b font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Categoria</th>
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
                                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${trans.tipo === 'entrada'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  {trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                </span>
                              </td>
                              <td className="p-2 text-right text-gray-600 whitespace-nowrap">
                                {trans.valor_bruto != null ? (
                                  <>R$ {trans.valor_bruto.toFixed(2).replace('.', ',')}</>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold whitespace-nowrap">
                                <span className={trans.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                  {trans.tipo === 'entrada' ? '+' : '-'}R$ {trans.valor.toFixed(2).replace('.', ',')}
                                </span>
                              </td>
                              <td className="p-2">
                                {categorySuggestions.has(index) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => aplicarSugestao(index)}
                                    className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 text-xs h-7"
                                  >
                                    ⚡ {categorySuggestions.get(index)!.categoria} ({Math.round(categorySuggestions.get(index)!.confidence * 100)}%)
                                  </Button>
                                ) : trans.categoria ? (
                                  <span className="text-xs text-gray-600">{trans.categoria}</span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
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
          </div>

          {/* Actions - sempre visível no rodapé do modal */}
          <div className="flex flex-shrink-0 justify-end gap-2 pt-4 border-t bg-background">
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

