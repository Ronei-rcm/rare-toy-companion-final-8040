import { useState, useEffect, useCallback, useRef } from 'react';

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'password_change' | '2fa_enabled' | '2fa_disabled' | 'permission_change' | 'data_access' | 'api_access' | 'suspicious_activity';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | 'backup_codes';
  backupCodes: string[];
  lastUsed?: Date;
  qrCode?: string;
  secret?: string;
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number; // dias
    preventReuse: number; // últimas N senhas
  };
  sessionSettings: {
    timeout: number; // minutos
    maxConcurrent: number;
    requireReauth: boolean;
  };
  twoFactorSettings: {
    required: boolean;
    methods: ('totp' | 'sms' | 'email')[];
    backupCodesCount: number;
  };
  ipWhitelist: string[];
  ipBlacklist: string[];
  rateLimiting: {
    loginAttempts: number;
    apiRequests: number;
    passwordReset: number;
    timeWindow: number; // minutos
  };
  auditLogging: {
    enabled: boolean;
    retentionDays: number;
    sensitiveData: boolean;
  };
}

interface SecurityAlert {
  id: string;
  type: 'brute_force' | 'suspicious_login' | 'data_breach' | 'unusual_activity' | 'failed_2fa' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: string[];
  source: {
    ipAddress: string;
    userAgent: string;
    location?: string;
  };
  timestamp: Date;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'lgpd' | 'pci_dss' | 'sox' | 'hipaa';
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending';
  score: number; // 0-100
  issues: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    remediation: string;
    dueDate?: Date;
  }>;
  lastAudit: Date;
  nextAudit?: Date;
  auditor?: string;
}

interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  failedLogins: number;
  successfulLogins: number;
  twoFactorAdoption: number;
  averageSessionDuration: number;
  suspiciousActivities: number;
  resolvedAlerts: number;
  pendingAlerts: number;
  complianceScore: number;
  lastUpdated: Date;
}

export function useSecurityEnhancement() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Array<() => void>>([]);

  // Carregar eventos de segurança
  const loadSecurityEvents = useCallback(async (filters?: {
    type?: string;
    severity?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value instanceof Date ? value.toISOString() : value.toString());
          }
        });
      }

      const response = await fetch(`/api/security/events?${params.toString()}`);
      const data = await response.json();
      setSecurityEvents(data);
    } catch (error) {
      console.error('Erro ao carregar eventos de segurança:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar alertas de segurança
  const loadSecurityAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/security/alerts');
      const data = await response.json();
      setSecurityAlerts(data);
    } catch (error) {
      console.error('Erro ao carregar alertas de segurança:', error);
    }
  }, []);

  // Carregar relatórios de compliance
  const loadComplianceReports = useCallback(async () => {
    try {
      const response = await fetch('/api/security/compliance');
      const data = await response.json();
      setComplianceReports(data);
    } catch (error) {
      console.error('Erro ao carregar relatórios de compliance:', error);
    }
  }, []);

  // Carregar configurações de segurança
  const loadSecuritySettings = useCallback(async () => {
    try {
      const response = await fetch('/api/security/settings');
      const data = await response.json();
      setSecuritySettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações de segurança:', error);
    }
  }, []);

  // Carregar métricas de segurança
  const loadSecurityMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/security/metrics');
      const data = await response.json();
      setSecurityMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas de segurança:', error);
    }
  }, []);

  // Registrar evento de segurança
  const logSecurityEvent = useCallback(async (eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>) => {
    try {
      const response = await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...eventData,
          timestamp: new Date(),
          resolved: false
        })
      });

      if (response.ok) {
        const newEvent = await response.json();
        setSecurityEvents(prev => [newEvent, ...prev]);
        
        // Verificar se precisa gerar alerta
        if (eventData.severity === 'high' || eventData.severity === 'critical') {
          await generateSecurityAlert(eventData);
        }
        
        return newEvent;
      }
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
    return null;
  }, []);

  // Gerar alerta de segurança
  const generateSecurityAlert = useCallback(async (eventData: any) => {
    try {
      const alertTypes = {
        'failed_login': 'brute_force',
        'suspicious_activity': 'suspicious_login',
        'permission_change': 'privilege_escalation',
        'data_access': 'unusual_activity'
      };

      const alertType = alertTypes[eventData.type as keyof typeof alertTypes] || 'unusual_activity';
      
      const alert: Omit<SecurityAlert, 'id'> = {
        type: alertType,
        severity: eventData.severity,
        title: `Alerta de Segurança: ${eventData.type}`,
        description: eventData.description,
        affectedUsers: eventData.userId ? [eventData.userId] : [],
        source: {
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          location: eventData.location ? `${eventData.location.city}, ${eventData.location.country}` : undefined
        },
        timestamp: new Date(),
        status: 'new',
        metadata: eventData.metadata
      };

      const response = await fetch('/api/security/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      if (response.ok) {
        const newAlert = await response.json();
        setSecurityAlerts(prev => [newAlert, ...prev]);
        return newAlert;
      }
    } catch (error) {
      console.error('Erro ao gerar alerta de segurança:', error);
    }
    return null;
  }, []);

  // Resolver alerta
  const resolveAlert = useCallback(async (alertId: string, resolution: string, resolvedBy: string) => {
    try {
      const response = await fetch(`/api/security/alerts/${alertId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution,
          resolvedBy
        })
      });

      if (response.ok) {
        setSecurityAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'resolved' as const, resolution, resolvedBy }
            : alert
        ));
        return true;
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
    return false;
  }, []);

  // Configurar 2FA
  const setupTwoFactor = useCallback(async (method: 'totp' | 'sms' | 'email') => {
    try {
      const response = await fetch('/api/security/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Registrar evento
        await logSecurityEvent({
          type: '2fa_enabled',
          ipAddress: '127.0.0.1', // Será preenchido pelo backend
          userAgent: navigator.userAgent,
          severity: 'medium',
          description: `2FA habilitado usando ${method}`
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao configurar 2FA:', error);
    }
    return null;
  }, [logSecurityEvent]);

  // Verificar código 2FA
  const verifyTwoFactor = useCallback(async (code: string, method: 'totp' | 'sms' | 'email') => {
    try {
      const response = await fetch('/api/security/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, method })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Registrar evento
        await logSecurityEvent({
          type: 'login',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          severity: 'low',
          description: `Login com 2FA usando ${method}`
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao verificar 2FA:', error);
      
      // Registrar evento de falha
      await logSecurityEvent({
        type: 'failed_login',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        severity: 'medium',
        description: `Falha na verificação 2FA usando ${method}`
      });
    }
    return null;
  }, [logSecurityEvent]);

  // Gerar códigos de backup
  const generateBackupCodes = useCallback(async () => {
    try {
      const response = await fetch('/api/security/2fa/backup-codes', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Registrar evento
        await logSecurityEvent({
          type: '2fa_enabled',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          severity: 'medium',
          description: 'Códigos de backup 2FA gerados'
        });

        return data;
      }
    } catch (error) {
      console.error('Erro ao gerar códigos de backup:', error);
    }
    return null;
  }, [logSecurityEvent]);

  // Atualizar configurações de segurança
  const updateSecuritySettings = useCallback(async (settings: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/security/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSecuritySettings(updatedSettings);
        
        // Registrar evento
        await logSecurityEvent({
          type: 'permission_change',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          severity: 'medium',
          description: 'Configurações de segurança atualizadas'
        });

        return true;
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
    return false;
  }, [logSecurityEvent]);

  // Executar auditoria de compliance
  const runComplianceAudit = useCallback(async (type: 'gdpr' | 'lgpd' | 'pci_dss' | 'sox' | 'hipaa') => {
    try {
      const response = await fetch('/api/security/compliance/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const report = await response.json();
        setComplianceReports(prev => [report, ...prev]);
        
        // Registrar evento
        await logSecurityEvent({
          type: 'data_access',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          severity: 'medium',
          description: `Auditoria de compliance ${type} executada`
        });

        return report;
      }
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
    }
    return null;
  }, [logSecurityEvent]);

  // Bloquear IP
  const blockIP = useCallback(async (ipAddress: string, reason: string) => {
    try {
      const response = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress, reason })
      });

      if (response.ok) {
        // Registrar evento
        await logSecurityEvent({
          type: 'suspicious_activity',
          ipAddress,
          userAgent: 'System',
          severity: 'high',
          description: `IP bloqueado: ${reason}`
        });

        return true;
      }
    } catch (error) {
      console.error('Erro ao bloquear IP:', error);
    }
    return false;
  }, [logSecurityEvent]);

  // Desbloquear IP
  const unblockIP = useCallback(async (ipAddress: string) => {
    try {
      const response = await fetch('/api/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress })
      });

      if (response.ok) {
        // Registrar evento
        await logSecurityEvent({
          type: 'permission_change',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          severity: 'medium',
          description: `IP desbloqueado: ${ipAddress}`
        });

        return true;
      }
    } catch (error) {
      console.error('Erro ao desbloquear IP:', error);
    }
    return false;
  }, [logSecurityEvent]);

  // Exportar logs de auditoria
  const exportAuditLogs = useCallback(async (filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    eventType?: string;
    severity?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value instanceof Date ? value.toISOString() : value.toString());
          }
        });
      }

      const response = await fetch(`/api/security/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    }
    return false;
  }, []);

  // Iniciar monitoramento em tempo real
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Monitorar eventos em tempo real
    monitoringIntervalRef.current = setInterval(async () => {
      await Promise.all([
        loadSecurityEvents(),
        loadSecurityAlerts(),
        loadSecurityMetrics()
      ]);
    }, 30000); // A cada 30 segundos

    // WebSocket para eventos em tempo real (se disponível)
    if ('WebSocket' in window) {
      try {
        const ws = new WebSocket('ws://localhost:3001/security-events');
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'security_event') {
            setSecurityEvents(prev => [data.event, ...prev]);
          } else if (data.type === 'security_alert') {
            setSecurityAlerts(prev => [data.alert, ...prev]);
          }
        };

        ws.onclose = () => {
          // Reconectar após 5 segundos
          setTimeout(() => {
            if (isMonitoring) {
              startMonitoring();
            }
          }, 5000);
        };

        eventListenersRef.current.push(() => ws.close());
      } catch (error) {
        console.warn('WebSocket não disponível, usando polling');
      }
    }
  }, [isMonitoring, loadSecurityEvents, loadSecurityAlerts, loadSecurityMetrics]);

  // Parar monitoramento
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }

    eventListenersRef.current.forEach(cleanup => cleanup());
    eventListenersRef.current = [];
  }, []);

  // Obter estatísticas de segurança
  const getSecurityStatistics = useCallback(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const safeSecurityEvents = Array.isArray(securityEvents) ? securityEvents : [];
    const safeSecurityAlerts = Array.isArray(securityAlerts) ? securityAlerts : [];
    const safeComplianceReports = Array.isArray(complianceReports) ? complianceReports : [];

    const events24h = safeSecurityEvents.filter(e => e.timestamp >= last24h);
    const events7d = safeSecurityEvents.filter(e => e.timestamp >= last7d);
    const criticalAlerts = safeSecurityAlerts.filter(a => a.severity === 'critical' && a.status === 'new');
    const highAlerts = safeSecurityAlerts.filter(a => a.severity === 'high' && a.status === 'new');

    return {
      totalEvents: safeSecurityEvents.length,
      eventsLast24h: events24h.length,
      eventsLast7d: events7d.length,
      criticalAlerts: criticalAlerts.length,
      highAlerts: highAlerts.length,
      totalAlerts: safeSecurityAlerts.length,
      resolvedAlerts: safeSecurityAlerts.filter(a => a.status === 'resolved').length,
      complianceScore: safeComplianceReports.length > 0 
        ? Math.round(safeComplianceReports.reduce((sum, r) => sum + r.score, 0) / safeComplianceReports.length)
        : 0,
      lastUpdated: now
    };
  }, [securityEvents, securityAlerts, complianceReports]);

  // Inicializar dados
  useEffect(() => {
    loadSecurityEvents();
    loadSecurityAlerts();
    loadComplianceReports();
    loadSecuritySettings();
    loadSecurityMetrics();
  }, [loadSecurityEvents, loadSecurityAlerts, loadComplianceReports, loadSecuritySettings, loadSecurityMetrics]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    // Estado
    securityEvents,
    securityAlerts,
    complianceReports,
    securitySettings,
    securityMetrics,
    isLoading,
    isMonitoring,
    
    // Ações
    loadSecurityEvents,
    loadSecurityAlerts,
    loadComplianceReports,
    loadSecuritySettings,
    loadSecurityMetrics,
    logSecurityEvent,
    generateSecurityAlert,
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
    
    // Utilitários
    getSecurityStatistics
  };
}
