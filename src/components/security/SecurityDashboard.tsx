import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff,
  Lock,
  Unlock,
  Key,
  Smartphone,
  Mail,
  MessageSquare,
  Globe,
  MapPin,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Settings,
  BarChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Database,
  FileText,
  Search,
  Calendar,
  Bell,
  Zap,
  Target,
  Flag,
  Ban,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Monitor,
  Server,
  Wifi,
  WifiOff,
  Loader2,
  Info,
  AlertCircle,
  ShieldCheck,
  ShieldX,
  UserCheck,
  UserX,
  Fingerprint,
  QrCode,
  Code,
  FileDownload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSecurityEnhancement } from '@/hooks/useSecurityEnhancement';
import { toast } from 'sonner';

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  
  const {
    securityEvents,
    securityAlerts,
    complianceReports,
    securitySettings,
    securityMetrics,
    isLoading,
    isMonitoring,
    loadSecurityEvents,
    resolveAlert,
    setupTwoFactor,
    verifyTwoFactor,
    generateBackupCodes,
    updateSecuritySettings,
    runComplianceAudit,
    blockIP,
    unblockIP,
    exportAuditLogs,
    startMonitoring,
    stopMonitoring,
    getSecurityStatistics
  } = useSecurityEnhancement();

  const statistics = getSecurityStatistics();

  const handleResolveAlert = async (alertId: string) => {
    const resolution = prompt('Descreva a resolução do alerta:');
    if (resolution) {
      const result = await resolveAlert(alertId, resolution, 'current_user');
      if (result) {
        toast.success('Alerta resolvido com sucesso!');
      } else {
        toast.error('Erro ao resolver alerta');
      }
    }
  };

  const handleBlockIP = async (ipAddress: string) => {
    const reason = prompt('Motivo do bloqueio:');
    if (reason) {
      const result = await blockIP(ipAddress, reason);
      if (result) {
        toast.success('IP bloqueado com sucesso!');
      } else {
        toast.error('Erro ao bloquear IP');
      }
    }
  };

  const handleUnblockIP = async (ipAddress: string) => {
    const result = await unblockIP(ipAddress);
    if (result) {
      toast.success('IP desbloqueado com sucesso!');
    } else {
      toast.error('Erro ao desbloquear IP');
    }
  };

  const handleExportLogs = async () => {
    const result = await exportAuditLogs();
    if (result) {
      toast.success('Logs exportados com sucesso!');
      setShowExportDialog(false);
    } else {
      toast.error('Erro ao exportar logs');
    }
  };

  const handleRunAudit = async (type: string) => {
    const result = await runComplianceAudit(type as any);
    if (result) {
      toast.success(`Auditoria ${type} executada com sucesso!`);
    } else {
      toast.error('Erro ao executar auditoria');
    }
  };

  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'investigating': return <Eye className="w-4 h-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'false_positive': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'failed_login': return <UserX className="w-4 h-4 text-red-500" />;
      case '2fa_enabled': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'password_change': return <Key className="w-4 h-4 text-purple-500" />;
      case 'suspicious_activity': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Segurança</h1>
          <p className="text-gray-600 mt-1">Monitoramento e proteção em tempo real</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          >
            {isMonitoring ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Parar Monitoramento
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Iniciar Monitoramento
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.eventsLast24h}</p>
                <p className="text-xs text-blue-600">{statistics.totalEvents} total</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Críticos</p>
                <p className="text-2xl font-bold text-red-600">{statistics.criticalAlerts}</p>
                <p className="text-xs text-orange-600">{statistics.highAlerts} altos</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score Compliance</p>
                <p className="text-2xl font-bold text-green-600">{statistics.complianceScore}%</p>
                <p className="text-xs text-gray-600">{complianceReports.length} relatórios</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {isMonitoring ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-xs text-gray-600">
                  {statistics.resolvedAlerts} alertas resolvidos
                </p>
              </div>
              <div className={`p-3 rounded-full ${isMonitoring ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isMonitoring ? (
                  <Monitor className="w-6 h-6 text-green-600" />
                ) : (
                  <WifiOff className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="2fa">2FA</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de eventos por tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Tipo (Últimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    securityEvents.reduce((acc, event) => {
                      acc[event.type] = (acc[event.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEventIcon(type)}
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(count / securityEvents.length) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status de segurança */}
            <Card>
              <CardHeader>
                <CardTitle>Status de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Monitoramento</span>
                    <Badge variant={isMonitoring ? "default" : "secondary"}>
                      {isMonitoring ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>2FA Obrigatório</span>
                    <Badge variant={securitySettings?.twoFactorSettings.required ? "default" : "secondary"}>
                      {securitySettings?.twoFactorSettings.required ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Rate Limiting</span>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Auditoria</span>
                    <Badge variant={securitySettings?.auditLogging.enabled ? "default" : "secondary"}>
                      {securitySettings?.auditLogging.enabled ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>IPs Bloqueados</span>
                    <Badge variant="destructive">
                      {securitySettings?.ipBlacklist.length || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(alert.status)}
                      <div>
                        <h4 className="font-semibold">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos */}
        <TabsContent value="events" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Log de Eventos de Segurança</h3>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar eventos..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">Críticos</SelectItem>
                  <SelectItem value="high">Altos</SelectItem>
                  <SelectItem value="medium">Médios</SelectItem>
                  <SelectItem value="low">Baixos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando eventos...</span>
              </div>
            ) : (
              securityEvents.slice(0, 50).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.type)}
                          <div>
                            <h4 className="font-semibold capitalize">
                              {event.type.replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {event.ipAddress}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(event.timestamp).toLocaleString('pt-BR')}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location.city}, {event.location.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(event.severity)}>
                            {event.severity}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Alertas de Segurança</h3>
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="investigating">Investigando</SelectItem>
                  <SelectItem value="resolved">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {securityAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(alert.status)}
                        <h4 className="text-lg font-semibold">{alert.title}</h4>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">
                          {alert.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{alert.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <span>{alert.source.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(alert.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                        {alert.source.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.source.location}</span>
                          </div>
                        )}
                      </div>

                      {alert.affectedUsers.length > 0 && (
                        <div className="mt-3">
                          <span className="text-sm font-medium">Usuários afetados: </span>
                          <span className="text-sm text-gray-600">{alert.affectedUsers.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAlertExpansion(alert.id)}
                      >
                        {expandedAlerts.has(alert.id) ? 'Menos' : 'Mais'}
                      </Button>
                      
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolver
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockIP(alert.source.ipAddress)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  <AnimatePresence>
                    {expandedAlerts.has(alert.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-semibold mb-2">Detalhes da Fonte</h5>
                            <div className="space-y-1 text-sm">
                              <p><strong>IP:</strong> {alert.source.ipAddress}</p>
                              <p><strong>User Agent:</strong> {alert.source.userAgent}</p>
                              {alert.source.location && (
                                <p><strong>Localização:</strong> {alert.source.location}</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold mb-2">Metadados</h5>
                            <div className="space-y-1 text-sm">
                              {alert.metadata && Object.entries(alert.metadata).map(([key, value]) => (
                                <p key={key}><strong>{key}:</strong> {String(value)}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {alert.resolution && (
                          <div className="mt-4">
                            <h5 className="font-semibold mb-2">Resolução</h5>
                            <p className="text-sm text-gray-600">{alert.resolution}</p>
                            {alert.resolvedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Resolvido por: {alert.resolvedBy}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Relatórios de Compliance</h3>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleRunAudit('gdpr')}>
                <FileText className="w-4 h-4 mr-2" />
                GDPR
              </Button>
              <Button onClick={() => handleRunAudit('lgpd')}>
                <FileText className="w-4 h-4 mr-2" />
                LGPD
              </Button>
              <Button onClick={() => handleRunAudit('pci_dss')}>
                <FileText className="w-4 h-4 mr-2" />
                PCI DSS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{report.type.toUpperCase()}</CardTitle>
                    <Badge variant={
                      report.status === 'compliant' ? 'default' :
                      report.status === 'non_compliant' ? 'destructive' :
                      report.status === 'partial' ? 'secondary' : 'outline'
                    }>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{report.score}%</div>
                      <div className="text-sm text-gray-600">Score de Compliance</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Última auditoria:</span>
                        <span>{new Date(report.lastAudit).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {report.nextAudit && (
                        <div className="flex justify-between text-sm">
                          <span>Próxima auditoria:</span>
                          <span>{new Date(report.nextAudit).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      {report.auditor && (
                        <div className="flex justify-between text-sm">
                          <span>Auditor:</span>
                          <span>{report.auditor}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Problemas:</span>
                        <Badge variant="destructive">{report.issues.length}</Badge>
                      </div>
                      <Progress value={report.score} className="h-2" />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 2FA */}
        <TabsContent value="2fa" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Autenticação de Dois Fatores</h3>
            <Button onClick={() => setShowTwoFactorDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Configurar 2FA
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  TOTP (Google Authenticator)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Escaneie o QR code com seu app autenticador
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Configurar TOTP
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Code className="w-4 h-4 mr-2" />
                      Códigos de Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  SMS/Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>SMS</span>
                      <Badge variant="secondary">Não configurado</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Email</span>
                      <Badge variant="secondary">Não configurado</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Configurar SMS
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Configurar Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações atuais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Atuais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>2FA Obrigatório</span>
                  <Badge variant={securitySettings?.twoFactorSettings.required ? "default" : "secondary"}>
                    {securitySettings?.twoFactorSettings.required ? "Sim" : "Não"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Métodos Permitidos</span>
                  <div className="flex gap-1">
                    {securitySettings?.twoFactorSettings.methods.map((method) => (
                      <Badge key={method} variant="outline" className="text-xs">
                        {method.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Códigos de Backup</span>
                  <Badge variant="outline">
                    {securitySettings?.twoFactorSettings.backupCodesCount} códigos
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar 2FA</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-24 h-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Escaneie o QR code com seu app autenticador
              </p>
            </div>
            
            <div className="space-y-2">
              <Input placeholder="Digite o código de 6 dígitos" />
              <Button className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Verificar e Ativar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Logs de Auditoria</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" />
                <Input type="date" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Formato</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleExportLogs}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
