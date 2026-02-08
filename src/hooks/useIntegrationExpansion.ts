import { useState, useEffect, useCallback } from 'react';
import { integrationsApi } from '@/services/integrations-api';

interface MarketplaceIntegration {
  id: string;
  name: 'mercadolivre' | 'magazineluiza' | 'americanas' | 'submarino' | 'amazon' | 'shopee' | 'olist';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  apiKey?: string;
  lastSync?: Date;
  productsCount: number;
  ordersCount: number;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'manual';
  settings: {
    autoSync: boolean;
    priceSync: boolean;
    stockSync: boolean;
    orderSync: boolean;
    imageSync: boolean;
    descriptionSync: boolean;
  };
  errors: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
}

interface ERPIntegration {
  id: string;
  name: 'totvs' | 'sap' | 'oracle' | 'microsoft_dynamics' | 'sage' | 'contazul' | 'linx' | 'nfe_io';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  endpoint?: string;
  credentials?: {
    username: string;
    password: string;
    apiKey?: string;
    token?: string;
  };
  lastSync?: Date;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'manual';
  modules: {
    inventory: boolean;
    sales: boolean;
    customers: boolean;
    products: boolean;
    financial: boolean;
    nfe: boolean;
  };
  settings: {
    autoSync: boolean;
    conflictResolution: 'local_wins' | 'remote_wins' | 'manual';
    batchSize: number;
    retryAttempts: number;
  };
}

interface MarketingToolIntegration {
  id: string;
  name: 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'mailchimp' | 'rd_station' | 'hubspot' | 'active_campaign' | 'sendgrid' | 'hotjar' | 'google_analytics' | 'facebook_pixel';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  apiKey?: string;
  lastSync?: Date;
  features: {
    campaigns: boolean;
    audiences: boolean;
    analytics: boolean;
    automation: boolean;
    email: boolean;
    sms: boolean;
    tracking: boolean;
  };
  settings: {
    autoSync: boolean;
    dataRetention: number; // dias
    anonymizeData: boolean;
    trackConversions: boolean;
  };
}

interface IntegrationSync {
  id: string;
  integrationId: string;
  integrationType: 'marketplace' | 'erp' | 'marketing';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  itemsProcessed: number;
  itemsTotal: number;
  errors: Array<{
    item: string;
    error: string;
    timestamp: Date;
  }>;
  summary: {
    created: number;
    updated: number;
    deleted: number;
    errors: number;
  };
}

interface IntegrationMetrics {
  totalIntegrations: number;
  activeIntegrations: number;
  failedIntegrations: number;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncTime?: Date;
  dataTransferred: number; // MB
  apiCalls: number;
  errorRate: number;
}

export function useIntegrationExpansion() {
  const [marketplaceIntegrations, setMarketplaceIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [erpIntegrations, setErpIntegrations] = useState<ERPIntegration[]>([]);
  const [marketingIntegrations, setMarketingIntegrations] = useState<MarketingToolIntegration[]>([]);
  const [syncHistory, setSyncHistory] = useState<IntegrationSync[]>([]);
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar integrações de marketplace
  const loadMarketplaceIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await integrationsApi.marketplaces.list();
      setMarketplaceIntegrations(data);
    } catch (error) {
      console.error('Erro ao carregar integrações de marketplace:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar integrações de ERP
  const loadERPIntegrations = useCallback(async () => {
    try {
      const data = await integrationsApi.erp.list();
      setErpIntegrations(data);
    } catch (error) {
      console.error('Erro ao carregar integrações de ERP:', error);
    }
  }, []);

  // Carregar integrações de marketing
  const loadMarketingIntegrations = useCallback(async () => {
    try {
      const data = await integrationsApi.marketing.list();
      setMarketingIntegrations(data);
    } catch (error) {
      console.error('Erro ao carregar integrações de marketing:', error);
    }
  }, []);

  // Carregar histórico de sincronização
  const loadSyncHistory = useCallback(async () => {
    try {
      const data = await integrationsApi.getSyncHistory();
      setSyncHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico de sincronização:', error);
    }
  }, []);

  // Carregar métricas
  const loadMetrics = useCallback(async () => {
    try {
      const data = await integrationsApi.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  }, []);

  // Conectar marketplace
  const connectMarketplace = useCallback(async (
    marketplaceName: string,
    apiKey: string,
    settings: Partial<MarketplaceIntegration['settings']>
  ) => {
    try {
      await integrationsApi.marketplaces.connect({
        marketplace: marketplaceName,
        apiKey,
        settings: {
          autoSync: true,
          priceSync: true,
          stockSync: true,
          orderSync: true,
          imageSync: true,
          descriptionSync: true,
          ...settings
        }
      });
      await loadMarketplaceIntegrations();
      return true;
    } catch (error) {
      console.error('Erro ao conectar marketplace:', error);
    }
    return false;
  }, [loadMarketplaceIntegrations]);

  // Conectar ERP
  const connectERP = useCallback(async (
    erpName: string,
    credentials: ERPIntegration['credentials'],
    modules: Partial<ERPIntegration['modules']>
  ) => {
    try {
      await integrationsApi.erp.connect({
        erp: erpName,
        credentials,
        modules: {
          inventory: true,
          sales: true,
          customers: true,
          products: true,
          financial: false,
          nfe: false,
          ...modules
        }
      });
      await loadERPIntegrations();
      return true;
    } catch (error) {
      console.error('Erro ao conectar ERP:', error);
    }
    return false;
  }, [loadERPIntegrations]);

  // Conectar ferramenta de marketing
  const connectMarketingTool = useCallback(async (
    toolName: string,
    apiKey: string,
    features: Partial<MarketingToolIntegration['features']>
  ) => {
    try {
      await integrationsApi.marketing.connect({
        tool: toolName,
        apiKey,
        features: {
          campaigns: true,
          audiences: true,
          analytics: true,
          automation: false,
          email: true,
          sms: false,
          tracking: true,
          ...features
        }
      });
      await loadMarketingIntegrations();
      return true;
    } catch (error) {
      console.error('Erro ao conectar ferramenta de marketing:', error);
    }
    return false;
  }, [loadMarketingIntegrations]);

  // Desconectar integração
  const disconnectIntegration = useCallback(async (
    integrationId: string,
    integrationType: 'marketplace' | 'erp' | 'marketing'
  ) => {
    try {
      switch (integrationType) {
        case 'marketplace':
          await integrationsApi.marketplaces.disconnect(integrationId);
          await loadMarketplaceIntegrations();
          break;
        case 'erp':
          await integrationsApi.erp.disconnect(integrationId);
          await loadERPIntegrations();
          break;
        case 'marketing':
          await integrationsApi.marketing.disconnect(integrationId);
          await loadMarketingIntegrations();
          break;
      }
      return true;
    } catch (error) {
      console.error('Erro ao desconectar integração:', error);
    }
    return false;
  }, [loadMarketplaceIntegrations, loadERPIntegrations, loadMarketingIntegrations]);

  // Sincronizar integração
  const syncIntegration = useCallback(async (
    integrationId: string,
    integrationType: 'marketplace' | 'erp' | 'marketing',
    syncType?: 'full' | 'incremental' | 'products' | 'orders' | 'customers'
  ) => {
    try {
      setIsSyncing(true);

      let syncResult;
      switch (integrationType) {
        case 'marketplace':
          syncResult = await integrationsApi.marketplaces.sync(integrationId, syncType);
          await loadMarketplaceIntegrations();
          break;
        case 'erp':
          syncResult = await integrationsApi.erp.sync(integrationId, syncType);
          await loadERPIntegrations();
          break;
        case 'marketing':
          syncResult = await integrationsApi.marketing.sync(integrationId, syncType);
          await loadMarketingIntegrations();
          break;
      }

      await loadSyncHistory();
      return syncResult;
    } catch (error) {
      console.error('Erro ao sincronizar integração:', error);
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [loadSyncHistory, loadMarketplaceIntegrations, loadERPIntegrations, loadMarketingIntegrations]);

  // Configurar integração
  const updateIntegrationSettings = useCallback(async (
    integrationId: string,
    integrationType: 'marketplace' | 'erp' | 'marketing',
    settings: any
  ) => {
    try {
      switch (integrationType) {
        case 'marketplace':
          await integrationsApi.marketplaces.updateSettings(integrationId, settings);
          await loadMarketplaceIntegrations();
          break;
        case 'erp':
          await integrationsApi.erp.updateSettings(integrationId, settings);
          await loadERPIntegrations();
          break;
        case 'marketing':
          await integrationsApi.marketing.updateSettings(integrationId, settings);
          await loadMarketingIntegrations();
          break;
      }
      return true;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
    }
    return false;
  }, [loadMarketplaceIntegrations, loadERPIntegrations, loadMarketingIntegrations]);

  // Testar conexão
  const testConnection = useCallback(async (
    integrationId: string,
    integrationType: 'marketplace' | 'erp' | 'marketing'
  ) => {
    try {
      let result;
      switch (integrationType) {
        case 'marketplace':
          result = await integrationsApi.marketplaces.test(integrationId);
          break;
        case 'erp':
          result = await integrationsApi.erp.test(integrationId);
          break;
        case 'marketing':
          result = await integrationsApi.marketing.test(integrationId);
          break;
      }
      return result;
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
    }
    return null;
  }, []);

  // Obter logs de erro
  const getIntegrationLogs = useCallback(async (
    integrationId: string,
    integrationType: 'marketplace' | 'erp' | 'marketing',
    filters?: {
      level?: 'error' | 'warning' | 'info';
      dateFrom?: Date;
      dateTo?: Date;
    }
  ) => {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.append(key, value instanceof Date ? value.toISOString() : value.toString());
          }
        });
      }

      const qs = params.toString();
      let data;
      switch (integrationType) {
        case 'marketplace':
          data = await integrationsApi.marketplaces.logs(integrationId, qs);
          break;
        case 'erp':
          data = await integrationsApi.erp.logs(integrationId, qs);
          break;
        case 'marketing':
          data = await integrationsApi.marketing.logs(integrationId, qs);
          break;
      }
      return data;
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      return [];
    }
  }, []);

  // Executar sincronização em lote
  const runBulkSync = useCallback(async (
    integrationIds: string[],
    integrationType: 'marketplace' | 'erp' | 'marketing',
    syncType: 'full' | 'incremental' = 'incremental'
  ) => {
    try {
      setIsSyncing(true);

      const results = await integrationsApi.bulkSync({
        integrationIds,
        integrationType,
        syncType
      });

      await loadSyncHistory();
      await loadMetrics();

      return results;
    } catch (error) {
      console.error('Erro na sincronização em lote:', error);
    } finally {
      setIsSyncing(false);
    }
    return null;
  }, [loadSyncHistory, loadMetrics]);

  // Obter estatísticas
  const getIntegrationStatistics = useCallback(() => {
    const safeMarketplace = Array.isArray(marketplaceIntegrations) ? marketplaceIntegrations : [];
    const safeERP = Array.isArray(erpIntegrations) ? erpIntegrations : [];
    const safeMarketing = Array.isArray(marketingIntegrations) ? marketingIntegrations : [];
    const safeSyncHistory = Array.isArray(syncHistory) ? syncHistory : [];

    const allIntegrations = [
      ...safeMarketplace,
      ...safeERP,
      ...safeMarketing
    ];

    const activeIntegrations = allIntegrations.filter(i => i.status === 'connected').length;
    const failedIntegrations = allIntegrations.filter(i => i.status === 'error').length;

    const recentSyncs = safeSyncHistory.filter(s => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return s.startedAt >= oneDayAgo;
    });

    const successfulSyncs = recentSyncs.filter(s => s.status === 'completed').length;
    const failedSyncs = recentSyncs.filter(s => s.status === 'failed').length;

    const averageSyncTime = recentSyncs.length > 0
      ? recentSyncs.reduce((sum, sync) => {
        if (sync.completedAt) {
          return sum + (sync.completedAt.getTime() - sync.startedAt.getTime());
        }
        return sum;
      }, 0) / recentSyncs.length / 1000 // em segundos
      : 0;

    return {
      totalIntegrations: allIntegrations.length,
      activeIntegrations,
      failedIntegrations,
      recentSyncs: recentSyncs.length,
      successfulSyncs,
      failedSyncs,
      averageSyncTime: Math.round(averageSyncTime),
      successRate: recentSyncs.length > 0 ? (successfulSyncs / recentSyncs.length) * 100 : 0
    };
  }, [marketplaceIntegrations, erpIntegrations, marketingIntegrations, syncHistory]);

  // Inicializar dados
  useEffect(() => {
    loadMarketplaceIntegrations();
    loadERPIntegrations();
    loadMarketingIntegrations();
    loadSyncHistory();
    loadMetrics();
  }, [loadMarketplaceIntegrations, loadERPIntegrations, loadMarketingIntegrations, loadSyncHistory, loadMetrics]);

  return {
    // Estado
    marketplaceIntegrations,
    erpIntegrations,
    marketingIntegrations,
    syncHistory,
    metrics,
    isLoading,
    isSyncing,

    // Ações
    loadMarketplaceIntegrations,
    loadERPIntegrations,
    loadMarketingIntegrations,
    loadSyncHistory,
    loadMetrics,
    connectMarketplace,
    connectERP,
    connectMarketingTool,
    disconnectIntegration,
    syncIntegration,
    updateIntegrationSettings,
    testConnection,
    getIntegrationLogs,
    runBulkSync,

    // Utilitários
    getIntegrationStatistics
  };
}
