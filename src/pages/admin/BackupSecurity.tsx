import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Database, 
  Download, 
  Upload, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Activity,
  BarChart3,
  FileText,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  WifiOff,
  Server,
  Key,
  Fingerprint,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Zap,
  Globe,
  User,
  MapPin
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupJob {
  id: string;
  name: string;
  description: string;
  backup_type: 'full' | 'incremental' | 'differential';
  source_type: 'database' | 'files' | 'both';
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  created_at: string;
}

interface BackupExecution {
  id: string;
  job_id: string;
  job_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  backup_size: number;
  file_path: string;
  checksum: string;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: string;
  user_agent: string;
  resource: string | null;
  action: string | null;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

interface AccessLog {
  id: string;
  user_id: string | null;
  ip_address: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
}

interface SystemStatus {
  system: {
    platform: string;
    arch: string;
    totalMemory: number;
    freeMemory: number;
    uptime: number;
    loadAverage: number[];
    cpuCount: number;
  };
  disk: {
    total: string;
    used: string;
    available: string;
    percentage: string;
  };
  recentBackups: BackupExecution[];
  securityStats: {
    eventsByType: any[];
    eventsBySeverity: any[];
    topIPs: any[];
    failedLogins: number;
  };
}

const BackupSecurity: React.FC = () => {
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupExecutions, setBackupExecutions] = useState<BackupExecution[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  // Formulário de criação de job
  const [jobForm, setJobForm] = useState({
    name: '',
    description: '',
    backup_type: 'full',
    source_type: 'database',
    source_config: {
      database: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'rare_toy_companion'
      },
      paths: ['/uploads', '/exports']
    },
    destination_config: {
      path: '/backups',
      compress: true
    },
    schedule_config: {
      frequency: 'daily',
      hour: 2,
      day: 1
    },
    retention_days: 30
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBackupJobs(),
        loadBackupExecutions(),
        loadSecurityEvents(),
        loadAccessLogs(),
        loadSystemStatus()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupJobs = async () => {
    try {
      const response = await fetch('/api/backup-security/backup/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBackupJobs(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar jobs de backup:', error);
    }
  };

  const loadBackupExecutions = async () => {
    try {
      const response = await fetch('/api/backup-security/backup/executions?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBackupExecutions(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar execuções de backup:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await fetch('/api/backup-security/security/events?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSecurityEvents(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos de segurança:', error);
    }
  };

  const loadAccessLogs = async () => {
    try {
      const response = await fetch('/api/backup-security/security/access-logs?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAccessLogs(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar logs de acesso:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/backup-security/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSystemStatus(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar status do sistema:', error);
    }
  };

  const createBackupJob = async () => {
    try {
      const response = await fetch('/api/backup-security/backup/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...jobForm,
          created_by: 'admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateJob(false);
        setJobForm({
          name: '',
          description: '',
          backup_type: 'full',
          source_type: 'database',
          source_config: {
            database: {
              host: 'localhost',
              user: 'root',
              password: '',
              database: 'rare_toy_companion'
            },
            paths: ['/uploads', '/exports']
          },
          destination_config: {
            path: '/backups',
            compress: true
          },
          schedule_config: {
            frequency: 'daily',
            hour: 2,
            day: 1
          },
          retention_days: 30
        });
        loadBackupJobs();
      }
    } catch (error) {
      console.error('Erro ao criar job de backup:', error);
    }
  };

  const executeBackup = async (jobId: string) => {
    try {
      const response = await fetch(`/api/backup-security/backup/jobs/${jobId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        loadBackupExecutions();
        loadBackupJobs();
      }
    } catch (error) {
      console.error('Erro ao executar backup:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">🔒 Backup e Segurança</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateJob(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Backup
          </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      {systemStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Server className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{systemStatus.system.platform}</div>
              <div className="text-sm text-gray-600">Sistema</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Cpu className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{systemStatus.system.cpuCount}</div>
              <div className="text-sm text-gray-600">CPUs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MemoryStick className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(systemStatus.system.freeMemory / 1024 / 1024 / 1024)}GB
              </div>
              <div className="text-sm text-gray-600">RAM Livre</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <HardDrive className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{systemStatus.disk.available}</div>
              <div className="text-sm text-gray-600">Disco Livre</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-pink-600">
                {formatUptime(systemStatus.system.uptime)}
              </div>
              <div className="text-sm text-gray-600">Uptime</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">
                {systemStatus.securityStats.failedLogins}
              </div>
              <div className="text-sm text-gray-600">Logins Falhados</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="backup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="encryption">Criptografia</TabsTrigger>
        </TabsList>

        <TabsContent value="backup" className="space-y-6">
          {/* Jobs de Backup */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Jobs de Backup</h2>
            <Button onClick={() => setShowCreateJob(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Job
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {backupJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{job.name}</h3>
                    <Badge variant="outline">{job.backup_type}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{job.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="font-medium">{job.source_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <Badge className={job.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {job.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {job.last_run && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Última execução:</span>
                        <span className="font-medium">
                          {format(parseISO(job.last_run), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {job.next_run && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Próxima execução:</span>
                        <span className="font-medium">
                          {format(parseISO(job.next_run), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => executeBackup(job.id)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Executar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Execuções Recentes */}
          <div>
            <h3 className="text-xl font-bold mb-4">Execuções Recentes</h3>
            <div className="space-y-2">
              {backupExecutions.map((execution) => (
                <Card key={execution.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(execution.status)}
                        <div>
                          <h4 className="font-medium">{execution.job_name}</h4>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(execution.started_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                        {execution.backup_size && (
                          <span className="text-sm text-gray-500">
                            {formatBytes(execution.backup_size)}
                          </span>
                        )}
                        {execution.duration_seconds && (
                          <span className="text-sm text-gray-500">
                            {formatDuration(execution.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                    {execution.error_message && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                        {execution.error_message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Eventos de Segurança */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Eventos de Segurança</h2>
            <div className="flex gap-2">
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {securityEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getSeverityIcon(event.severity)}
                      <div>
                        <h4 className="font-medium">{event.event_type}</h4>
                        <p className="text-sm text-gray-500">
                          {event.ip_address} • {format(parseISO(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {event.details && (
                    <div className="mt-2 p-2 bg-gray-50 text-sm rounded">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(event.details, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Logs de Acesso */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Logs de Acesso</h2>
            <div className="flex gap-2">
              <Input placeholder="Filtrar por IP..." className="w-48" />
              <Button variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {accessLogs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{log.method} {log.endpoint}</h4>
                        <p className="text-sm text-gray-500">
                          {log.ip_address} • {format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={log.status_code >= 400 ? 'destructive' : 'default'}>
                        {log.status_code}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {log.response_time_ms}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-6">
          {/* Criptografia */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Criptografia</h2>
            <Button>
              <Key className="w-4 h-4 mr-2" />
              Nova Chave
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Chaves de Criptografia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">AES-256</span>
                    <Badge variant="outline">Ativa</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">RSA-2048</span>
                    <Badge variant="outline">Ativa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Dados Criptografados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Senhas de usuários</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dados de pagamento</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Arquivos de backup</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Job */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Job de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_name">Nome</Label>
                  <Input
                    id="job_name"
                    value={jobForm.name}
                    onChange={(e) => setJobForm({...jobForm, name: e.target.value})}
                    placeholder="Nome do job"
                  />
                </div>
                <div>
                  <Label htmlFor="job_type">Tipo de Backup</Label>
                  <Select value={jobForm.backup_type} onValueChange={(value) => setJobForm({...jobForm, backup_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Completo</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                      <SelectItem value="differential">Diferencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="job_description">Descrição</Label>
                <Textarea
                  id="job_description"
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  placeholder="Descrição do job"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="source_type">Fonte</Label>
                <Select value={jobForm.source_type} onValueChange={(value) => setJobForm({...jobForm, source_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="database">Banco de Dados</SelectItem>
                    <SelectItem value="files">Arquivos</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retention_days">Retenção (dias)</Label>
                  <Input
                    id="retention_days"
                    type="number"
                    value={jobForm.retention_days}
                    onChange={(e) => setJobForm({...jobForm, retention_days: parseInt(e.target.value)})}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule_frequency">Frequência</Label>
                  <Select value={jobForm.schedule_config.frequency} onValueChange={(value) => setJobForm({...jobForm, schedule_config: {...jobForm.schedule_config, frequency: value}})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">A cada hora</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createBackupJob} className="flex-1">
                  Criar Job
                </Button>
                <Button variant="outline" onClick={() => setShowCreateJob(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BackupSecurity;
