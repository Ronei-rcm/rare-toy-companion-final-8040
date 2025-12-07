import React, { useState, useRef } from 'react';
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
    // Validar tipo de arquivo
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    const isValidType = validTypes.some(type => selectedFile.type === type) ||
      selectedFile.name.endsWith('.csv') ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls');

    if (!isValidType) {
      toast.error('Por favor, selecione um arquivo CSV ou Excel (.csv, .xlsx, .xls)');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setFile(selectedFile);
    
    // Tentar fazer parse automático
    try {
      const parsed = await parseFile(selectedFile);
      setParsedData(parsed);
      setPreviewMode(true);
      toast.success(`${parsed.length} transações encontradas!`);
    } catch (error) {
      console.error('Erro ao fazer parse:', error);
      toast.error('Erro ao processar arquivo. Verifique o formato.');
    }
  };

  const parseFile = async (file: File): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          
          // Se for CSV
          if (file.name.endsWith('.csv') || file.type === 'text/csv') {
            const lines = text.split('\n').filter(line => line.trim());
            const transactions: ParsedTransaction[] = [];

            // Pular header (linha 1)
            for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              // Detectar delimitador (vírgula ou ponto e vírgula)
              const delimiter = line.includes(';') ? ';' : ',';
              const columns = line.split(delimiter);

              if (columns.length >= 4) {
                try {
                  // Padrão: Data, Hora, Tipo, Nome, Detalhe, Valor
                  const data = columns[0]?.trim() || '';
                  const hora = columns[1]?.trim() || '';
                  const tipo = columns[2]?.trim() || '';
                  const nome = columns[3]?.trim() || '';
                  const detalhe = columns[4]?.trim() || '';
                  const valorStr = columns[5]?.trim() || '';

                  // Parse do valor
                  const valor = parseFloat(
                    valorStr
                      .replace('R$', '')
                      .replace('.', '')
                      .replace(',', '.')
                      .trim()
                  );

                  if (isNaN(valor) || !data) continue;

                  // Determinar tipo de transação
                  const tipoTransacao = detalhe.toLowerCase().includes('recebido') || 
                                       detalhe.toLowerCase().includes('entrada') ||
                                       detalhe.toLowerCase().includes('credito')
                    ? 'credito' 
                    : 'debito';

                  transactions.push({
                    data: parseDate(data),
                    hora: hora || undefined,
                    descricao: `${tipo} ${nome}`.trim(),
                    valor: Math.abs(valor),
                    tipo: tipoTransacao,
                    conta_id: contaId
                  });
                } catch (err) {
                  console.warn(`Erro ao processar linha ${i + 1}:`, err);
                  continue;
                }
              }
            }

            resolve(transactions);
          } else {
            reject(new Error('Formato não suportado. Use CSV.'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        reader.readAsText(file, 'UTF-8');
      } else {
        reject(new Error('Apenas arquivos CSV são suportados no momento'));
      }
    });
  };

  const parseDate = (dateStr: string): string => {
    // Tentar vários formatos de data
    // Formato esperado: 2025-12-06 ou 06/12/2025
    try {
      if (dateStr.includes('-')) {
        // Formato ISO
        return dateStr.split(' ')[0]; // Remove hora se houver
      } else if (dateStr.includes('/')) {
        // Formato brasileiro DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      return dateStr;
    } catch {
      return dateStr;
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
  React.useEffect(() => {
    console.log('🔍 ImportBankStatementModal - isOpen:', isOpen);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log('🔍 Dialog onOpenChange chamado com:', open);
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Extrato Bancário
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou Excel com as movimentações bancárias
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
                accept=".csv,.xlsx,.xls"
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
                    Formatos suportados: CSV, Excel (.xlsx, .xls)
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
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Data</th>
                        <th className="p-2 text-left">Descrição</th>
                        <th className="p-2 text-left">Tipo</th>
                        <th className="p-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 20).map((trans, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-2">{trans.data}</td>
                          <td className="p-2">{trans.descricao}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              trans.tipo === 'credito' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {trans.tipo === 'credito' ? 'Crédito' : 'Débito'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-semibold">
                            R$ {trans.valor.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 20 && (
                    <div className="p-2 bg-gray-50 text-center text-sm text-gray-600">
                      ... e mais {parsedData.length - 20} transações
                    </div>
                  )}
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

