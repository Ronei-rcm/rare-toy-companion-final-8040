import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Key,
  User,
  Globe,
  Database,
  FileText,
  Activity,
  Clock,
  Settings,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'network' | 'data' | 'monitoring';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastChecked: Date;
  status: 'pass' | 'fail' | 'warning';
  recommendation?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_failed' | 'suspicious_activity' | 'data_access' | 'system_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
}

interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  loginAttempts: number;
  failedLogins: number;
  lastSecurityScan: Date;
  securityScore: number;
}

const SecurityManager: React.FC = () => {
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Regras de segurança disponíveis
  const initialRules: SecurityRule[] = [
    {
      id: 'strong-passwords',
      name: 'Senhas Fortes',
      description: 'Força o uso de senhas com pelo menos 8 caracteres, números e símbolos',
      category: 'authentication',
      enabled: true,
      severity: 'high',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'two-factor-auth',
      name: 'Autenticação de Dois Fatores',
      description: 'Requer 2FA para contas administrativas',
      category: 'authentication',
      enabled: true,
      severity: 'critical',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'rate-limiting',
      name: 'Limitação de Taxa',
      description: 'Limita tentativas de login para prevenir ataques de força bruta',
      category: 'network',
      enabled: true,
      severity: 'high',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'sql-injection',
      name: 'Proteção SQL Injection',
      description: 'Protege contra ataques de injeção SQL',
      category: 'data',
      enabled: true,
      severity: 'critical',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'xss-protection',
      name: 'Proteção XSS',
      description: 'Protege contra ataques de Cross-Site Scripting',
      category: 'data',
      enabled: true,
      severity: 'high',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'session-security',
      name: 'Segurança de Sessão',
      description: 'Configurações seguras para sessões de usuário',
      category: 'authentication',
      enabled: true,
      severity: 'high',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'file-upload-security',
      name: 'Segurança de Upload',
      description: 'Valida e sanitiza arquivos enviados',
      category: 'data',
      enabled: true,
      severity: 'medium',
      lastChecked: new Date(),
      status: 'warning',
      recommendation: 'Considerar adicionar verificação de vírus'
    },
    {
      id: 'https-only',
      name: 'HTTPS Obrigatório',
      description: 'Força o uso de HTTPS em todas as comunicações',
      category: 'network',
      enabled: true,
      severity: 'critical',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'access-logging',
      name: 'Log de Acessos',
      description: 'Registra todas as tentativas de acesso ao sistema',
      category: 'monitoring',
      enabled: true,
      severity: 'medium',
      lastChecked: new Date(),
      status: 'pass'
    },
    {
      id: 'backup-encryption',
      name: 'Criptografia de Backup',
      description: 'Criptografa todos os backups do sistema',
      category: 'data',
      enabled: false,
      severity: 'high',
      lastChecked: new Date(),
      status: 'fail',
      recommendation: 'Ativar criptografia de backups'
    }
  ];

  // Eventos de segurança de exemplo
  const sampleEvents: SecurityEvent[] = [
    {
      id: '1',
      type: 'login_failed',
      severity: 'medium',
      message: 'Tentativa de login falhada para admin@example.com',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      source: '192.168.1.100',
      resolved: false
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'high',
      message: 'Múltiplas tentativas de acesso a arquivos sensíveis',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      source: '203.0.113.42',
      resolved: false
    },
    {
      id: '3',
      type: 'data_access',
      severity: 'low',
      message: 'Acesso a dados de clientes por usuário autorizado',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      source: '10.0.0.5',
      resolved: true
    },
    {
      id: '4',
      type: 'system_change',
      severity: 'medium',
      message: 'Alteração nas configurações de segurança',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      source: 'admin@system',
      resolved: true
    }
  ];

  // Métricas de exemplo
  const sampleMetrics: SecurityMetrics = {
    totalThreats: 127,
    threatsBlocked: 124,
    loginAttempts: 2456,
    failedLogins: 23,
    lastSecurityScan: new Date(),
    securityScore: 92
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRules(initialRules);
      setEvents(sampleEvents);
      setMetrics(sampleMetrics);
    } catch (error) {
      toast.error('Erro ao carregar dados de segurança');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
    
    const rule = rules.find(r => r.id === ruleId);
    toast.success(`Regra "${rule?.name}" ${rule?.enabled ? 'desativada' : 'ativada'}`);
  };

  const runSecurityScan = async () => {
    setLoading(true);
    
    // Simular verificação de segurança
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Atualizar status das regras
    setRules(prev => prev.map(rule => ({
      ...rule,
      lastChecked: new Date(),
      status: Math.random() > 0.1 ? 'pass' : 'warning' as 'pass' | 'warning'
    })));
    
    // Atualizar métricas
    setMetrics(prev => prev ? {
      ...prev,
      lastSecurityScan: new Date(),
      securityScore: Math.min(100, prev.securityScore + Math.floor(Math.random() * 5))
    } : null);
    
    setLoading(false);
    toast.success('Verificação de segurança concluída!');
  };

  const resolveEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, resolved: true }
        : event
    ));
    toast.success('Evento marcado como resolvido');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Key className="h-4 w-4" />;
      case 'authorization': return <User className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'monitoring': return <Activity className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login_failed': return <User className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'data_access': return <Database className="h-4 w-4" />;
      case 'system_change': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !rules.length) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Gerenciador de Segurança</span>
          </h2>
          <p className="text-muted-foreground">
            Monitore e gerencie a segurança do sistema
          </p>
        </div>
        <Button onClick={runSecurityScan} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Verificar Segurança
        </Button>
      </div>

      {/* Métricas de Segurança */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score de Segurança</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.securityScore}/100</p>
                </div>
                <Shield className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.securityScore >= 90 ? 'Excelente' : metrics.securityScore >= 80 ? 'Bom' : 'Precisa melhorar'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ameaças Bloqueadas</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.threatsBlocked}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {metrics.totalThreats} tentativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Logins Falhados</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.failedLogins}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {metrics.loginAttempts} tentativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Verificação</p>
                  <p className="text-sm font-bold">{metrics.lastSecurityScan.toLocaleTimeString()}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor((Date.now() - metrics.lastSecurityScan.getTime()) / 60000)} min atrás
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regras de Segurança */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Regras de Segurança</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(rule.status)}
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(rule.severity)}>
                    {rule.severity}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(rule.category)}
                    <span className="text-sm capitalize">{rule.category}</span>
                  </div>
                  
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>

                {rule.recommendation && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {rule.recommendation}
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Última verificação: {rule.lastChecked.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Eventos de Segurança */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Eventos de Segurança Recentes</h3>
        
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {events.map((event) => (
                <div key={event.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getEventIcon(event.type)}
                      <div>
                        <p className="font-medium">{event.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Origem: {event.source}</span>
                          <span>{event.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                      
                      {!event.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveEvent(event.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolver
                        </Button>
                      )}
                      
                      {event.resolved && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolvido
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Ações de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <Download className="h-4 w-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Exportar Logs</p>
                <p className="text-xs text-muted-foreground">Baixar logs de segurança</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <Upload className="h-4 w-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Importar Configurações</p>
                <p className="text-xs text-muted-foreground">Carregar configurações de segurança</p>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4">
              <FileText className="h-4 w-4 mr-2" />
              <div className="text-left">
                <p className="font-medium">Relatório de Segurança</p>
                <p className="text-xs text-muted-foreground">Gerar relatório detalhado</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityManager;
