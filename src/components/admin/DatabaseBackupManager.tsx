import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Upload, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';

interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  modified: string;
}

export const DatabaseBackupManager: React.FC = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [backupDescription, setBackupDescription] = useState('');

  // Carregar lista de backups
  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database/backups', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar backups');
      }
      
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar backups',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  // Criar backup
  const createBackup = async () => {
    if (!confirm('Deseja criar um backup do banco de dados agora? Esta operação pode levar alguns segundos.')) {
      return;
    }

    try {
      setCreatingBackup(true);
      const response = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          description: backupDescription || undefined
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar backup');
      }

      const data = await response.json();
      
      toast({
        title: 'Backup criado com sucesso!',
        description: `Arquivo: ${data.backup.filename} (${data.backup.sizeFormatted})`,
      });

      setBackupDescription('');
      await loadBackups();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar backup',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  // Restaurar backup
  const restoreBackup = async (filename: string) => {
    if (!confirm(`ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados atuais do banco de dados com o backup "${filename}".\n\nVocê tem certeza que deseja continuar?\n\nRecomendamos criar um backup antes de restaurar.`)) {
      return;
    }

    if (!confirm('Confirmação final: Você realmente deseja restaurar este backup? Esta ação NÃO PODE ser desfeita.')) {
      return;
    }

    try {
      setRestoringBackup(filename);
      const response = await fetch('/api/admin/database/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ filename })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao restaurar backup');
      }

      toast({
        title: 'Backup restaurado com sucesso!',
        description: 'O banco de dados foi restaurado. A página será recarregada.',
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro ao restaurar backup',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRestoringBackup(null);
    }
  };

  // Deletar backup
  const deleteBackup = async (filename: string) => {
    if (!confirm(`Deseja realmente deletar o backup "${filename}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/database/backup/${filename}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar backup');
      }

      toast({
        title: 'Backup deletado',
        description: `Arquivo "${filename}" foi removido.`,
      });

      await loadBackups();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar backup',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  // Download backup
  const downloadBackup = (filename: string) => {
    const url = `/api/admin/database/backup/download/${filename}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Backup e Restauração do Banco de Dados
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie backups do banco de dados MySQL. Crie, restaure ou delete backups quando necessário.
          </p>
        </div>
        <Button
          onClick={loadBackups}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Alerta Importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">⚠️ Avisos Importantes</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Faça backups regulares do banco de dados para proteger seus dados</li>
              <li>A restauração de um backup <strong>SOBRESCREVE</strong> todos os dados atuais</li>
              <li>Crie um backup antes de restaurar um backup anterior</li>
              <li>Backups são salvos no servidor. Faça download para manter cópias seguras</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Criar Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Criar Novo Backup
          </CardTitle>
          <CardDescription>
            Crie um backup completo do banco de dados atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Descrição (opcional)
              </label>
              <Input
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Ex: Backup antes de atualização"
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uma descrição curta para identificar o propósito do backup
              </p>
            </div>
            <Button
              onClick={createBackup}
              disabled={creatingBackup}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando backup...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Criar Backup Agora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Disponíveis</CardTitle>
          <CardDescription>
            {backups.length > 0 
              ? `${backups.length} backup${backups.length !== 1 ? 's' : ''} disponível${backups.length !== 1 ? 'eis' : ''}`
              : 'Nenhum backup encontrado. Crie um backup para começar.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && backups.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum backup disponível</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="font-medium truncate">{backup.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {backup.sizeFormatted}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(backup.created)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadBackup(backup.filename)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreBackup(backup.filename)}
                      disabled={restoringBackup === backup.filename}
                      className="text-orange-600 hover:text-orange-700"
                      title="Restaurar"
                    >
                      {restoringBackup === backup.filename ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteBackup(backup.filename)}
                      className="text-red-600 hover:text-red-700"
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
