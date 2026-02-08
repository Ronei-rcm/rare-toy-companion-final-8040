import { useState, useEffect, useCallback, useRef } from 'react';
import { securityApi } from '@/services/security-api';

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

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number;
    preventReuse: number;
  };
  sessionSettings: {
    timeout: number;
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
    timeWindow: number;
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
  score: number;
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

  const monitoringIntervalRef = useRef<any>(null);
  const eventListenersRef = useRef<Array<() => void>>([]);

  // Carregar eventos de segurança
  const loadSecurityEvents = useCallback(async (filters?: any) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value instanceof Date ? value.toISOString() : String(value));
        });
      }
      const data = await securityApi.getEvents(params.toString());
      setSecurityEvents(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar eventos de segurança:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar alertas de segurança
  const loadSecurityAlerts = useCallback(async () => {
    try {
      const data = await securityApi.getAlerts();
      setSecurityAlerts(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      return [];
    }
  }, []);

  // Carregar relatórios de compliance
  const loadComplianceReports = useCallback(async () => {
    try {
      const data = await securityApi.getCompliance();
      setComplianceReports(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar conformidade:', error);
      return [];
    }
  }, []);

  // Carregar configurações de segurança
  const loadSecuritySettings = useCallback(async () => {
    try {
      const data = await securityApi.getSettings();
      setSecuritySettings(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }
  }, []);

  // Carregar métricas de segurança
  const loadSecurityMetrics = useCallback(async () => {
    try {
      const data = await securityApi.getMetrics();
      setSecurityMetrics(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return null;
    }
  }, []);

  // Registrar evento de segurança
  const logSecurityEvent = useCallback(async (eventData: any) => {
    try {
      const data = await securityApi.logEvent({
        ...eventData,
        timestamp: new Date(),
        resolved: false
      });
      if (data) {
        setSecurityEvents(prev => [data, ...prev]);
        return data;
      }
    } catch (error) {
      console.error('Erro ao registrar evento:', error);
    }
    return null;
  }, []);

  // Resolver alerta
  const resolveAlert = useCallback(async (alertId: string, resolution: string, resolvedBy: string) => {
    try {
      const data = await securityApi.resolveAlert(alertId, {
        status: 'resolved',
        resolution,
        resolvedBy
      });
      if (data) {
        setSecurityAlerts(prev => prev.map(alert =>
          alert.id === alertId
            ? { ...alert, status: 'resolved', resolution, assignedTo: resolvedBy }
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
      const data = await securityApi.twoFactor.setup({ method });
      await logSecurityEvent({
        type: '2fa_enabled',
        severity: 'medium',
        description: `2FA habilitado usando ${method}`
      });
      return data;
    } catch (error) {
      console.error('Erro ao configurar 2FA:', error);
      return null;
    }
  }, [logSecurityEvent]);

  // Verificar código 2FA
  const verifyTwoFactor = useCallback(async (code: string, method: string) => {
    try {
      const data = await securityApi.twoFactor.verify({ code, method });
      await logSecurityEvent({
        type: 'login',
        severity: 'low',
        description: `Login com 2FA usando ${method}`
      });
      return data;
    } catch (error) {
      console.error('Erro ao verificar 2FA:', error);
      return null;
    }
  }, [logSecurityEvent]);

  // Gerar códigos de backup
  const generateBackupCodes = useCallback(async () => {
    try {
      const data = await securityApi.twoFactor.getBackupCodes({});
      await logSecurityEvent({
        type: '2fa_enabled',
        severity: 'medium',
        description: 'Códigos de backup 2FA gerados'
      });
      return data;
    } catch (error) {
      console.error('Erro ao gerar códigos de backup:', error);
      return null;
    }
  }, [logSecurityEvent]);

  // Atualizar configurações
  const updateSecuritySettings = useCallback(async (settings: Partial<SecuritySettings>) => {
    try {
      const updated = await securityApi.updateSettings(settings);
      setSecuritySettings(updated);
      await logSecurityEvent({
        type: 'permission_change',
        severity: 'medium',
        description: 'Configurações de segurança atualizadas'
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      return false;
    }
  }, [logSecurityEvent]);

  // Auditoria de compliance
  const runComplianceAudit = useCallback(async (type: string) => {
    try {
      const report = await securityApi.runAudit({ type });
      setComplianceReports(prev => [report, ...prev]);
      await logSecurityEvent({
        type: 'data_access',
        severity: 'medium',
        description: `Auditoria de compliance ${type} executada`
      });
      return report;
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
      return null;
    }
  }, [logSecurityEvent]);

  // Bloquear IP
  const blockIP = useCallback(async (ipAddress: string, reason: string) => {
    try {
      const success = await securityApi.ipManagement.block({ ipAddress, reason });
      if (success) {
        await logSecurityEvent({
          type: 'suspicious_activity',
          ipAddress,
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
      const success = await securityApi.ipManagement.unblock({ ipAddress });
      if (success) {
        await logSecurityEvent({
          type: 'permission_change',
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

  // Exportar logs
  const exportAuditLogs = useCallback(async (filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value instanceof Date ? value.toISOString() : String(value));
        });
      }
      const blob = await securityApi.exportData(params.toString());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      return false;
    }
  }, []);

  // Monitoramento
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    setIsMonitoring(true);
    monitoringIntervalRef.current = setInterval(async () => {
      await Promise.all([
        loadSecurityEvents(),
        loadSecurityAlerts(),
        loadSecurityMetrics()
      ]);
    }, 30000);
  }, [isMonitoring, loadSecurityEvents, loadSecurityAlerts, loadSecurityMetrics]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    eventListenersRef.current.forEach(cleanup => cleanup());
    eventListenersRef.current = [];
  }, []);

  const getSecurityStatistics = useCallback(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const safeEvents = Array.isArray(securityEvents) ? securityEvents : [];
    const safeAlerts = Array.isArray(securityAlerts) ? securityAlerts : [];

    const events24h = safeEvents.filter(e => new Date(e.timestamp) >= last24h);
    const criticalAlerts = safeAlerts.filter(a => a.severity === 'critical' && a.status === 'new');

    return {
      totalEvents: safeEvents.length,
      eventsLast24h: events24h.length,
      criticalAlerts: criticalAlerts.length,
      totalAlerts: safeAlerts.length,
      lastUpdated: now
    };
  }, [securityEvents, securityAlerts]);

  useEffect(() => {
    loadSecurityEvents();
    loadSecurityAlerts();
    loadComplianceReports();
    loadSecuritySettings();
    loadSecurityMetrics();
  }, [loadSecurityEvents, loadSecurityAlerts, loadComplianceReports, loadSecuritySettings, loadSecurityMetrics]);

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  return {
    securityEvents,
    securityAlerts,
    complianceReports,
    securitySettings,
    securityMetrics,
    isLoading,
    isMonitoring,
    loadSecurityEvents,
    loadSecurityAlerts,
    loadComplianceReports,
    loadSecuritySettings,
    loadSecurityMetrics,
    logSecurityEvent,
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
  };
}
