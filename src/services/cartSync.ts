/**
 * Sistema de Sincronização Inteligente de Carrinho
 * Sincronização em tempo real entre dispositivos e sessões
 */

interface SyncEvent {
  id: string;
  type: 'add' | 'remove' | 'update' | 'clear' | 'merge';
  cartId: string;
  userId?: string;
  sessionId?: string;
  data: any;
  timestamp: string;
  deviceId: string;
  version: number;
}

interface SyncConflict {
  cartId: string;
  localVersion: number;
  remoteVersion: number;
  localChanges: SyncEvent[];
  remoteChanges: SyncEvent[];
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  browser: string;
  lastSeen: string;
  isOnline: boolean;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: string;
  pendingChanges: number;
  conflicts: SyncConflict[];
  devices: DeviceInfo[];
  syncInProgress: boolean;
}

class CartSyncManager {
  private events: Map<string, SyncEvent> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private devices: Map<string, DeviceInfo> = new Map();
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private deviceId: string;

  constructor() {
    this.deviceId = this.generateDeviceId();
    this.initializeSync();
    this.setupEventListeners();
  }

  // Gerar ID único do dispositivo
  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('muhlstore-device-id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('muhlstore-device-id', deviceId);
    }
    return deviceId;
  }

  // Inicializar sincronização
  private initializeSync() {
    this.registerDevice();
    this.startPeriodicSync();
    this.syncOnVisibilityChange();
  }

  // Configurar listeners de eventos
  private setupEventListeners() {
    // Online/Offline
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Beforeunload - salvar estado
    window.addEventListener('beforeunload', () => {
      this.saveStateToStorage();
    });

    // Visibility change - sincronizar quando voltar
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingChanges();
      }
    });

    // Storage events - sincronização entre abas
    window.addEventListener('storage', (e) => {
      if (e.key === 'muhlstore-cart-sync') {
        this.handleStorageSync(e.newValue);
      }
    });
  }

  // Registrar dispositivo
  private async registerDevice() {
    const deviceInfo: DeviceInfo = {
      id: this.deviceId,
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      os: this.getOS(),
      browser: this.getBrowser(),
      lastSeen: new Date().toISOString(),
      isOnline: this.isOnline
    };

    this.devices.set(this.deviceId, deviceInfo);

    try {
      await fetch('/api/cart/sync/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(deviceInfo)
      });
    } catch (error) {
      console.error('Erro ao registrar dispositivo:', error);
    }
  }

  // Obter nome do dispositivo
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'Dispositivo Móvel';
    }
    return 'Computador';
  }

  // Obter tipo do dispositivo
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/iPad|Android.*Tablet/.test(userAgent)) {
      return 'tablet';
    }
    if (/Mobile|Android|iPhone/.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Obter sistema operacional
  private getOS(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // Obter navegador
  private getBrowser(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  // Iniciar sincronização periódica
  private startPeriodicSync() {
    // Sincronizar a cada 30 segundos quando online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingChanges();
      }
    }, 30000);
  }

  // Sincronizar na mudança de visibilidade
  private syncOnVisibilityChange() {
    let lastSync = 0;
    const syncDelay = 5000; // 5 segundos

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        const now = Date.now();
        if (now - lastSync > syncDelay) {
          this.syncPendingChanges();
          lastSync = now;
        }
      }
    });
  }

  // Sincronizar mudanças pendentes
  async syncPendingChanges(): Promise<boolean> {
    if (this.syncInProgress || !this.isOnline) return false;

    this.syncInProgress = true;
    this.retryCount = 0;

    try {
      const pendingEvents = this.getPendingEvents();
      if (pendingEvents.length === 0) {
        return true;
      }

      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          deviceId: this.deviceId,
          events: pendingEvents
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.handleSyncResponse(result);
        this.clearPendingEvents();
        return true;
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      this.handleSyncError();
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Obter eventos pendentes
  private getPendingEvents(): SyncEvent[] {
    return Array.from(this.events.values())
      .filter(event => !event.timestamp || this.isEventPending(event))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // Verificar se evento está pendente
  private isEventPending(event: SyncEvent): boolean {
    // Implementar lógica para verificar se evento foi sincronizado
    return true;
  }

  // Manipular resposta da sincronização
  private handleSyncResponse(result: any) {
    if (result.conflicts && result.conflicts.length > 0) {
      this.handleConflicts(result.conflicts);
    }

    if (result.events && result.events.length > 0) {
      this.applyRemoteEvents(result.events);
    }

    if (result.devices && result.devices.length > 0) {
      this.updateDevices(result.devices);
    }
  }

  // Manipular conflitos
  private handleConflicts(conflicts: SyncConflict[]) {
    conflicts.forEach(conflict => {
      this.conflicts.set(conflict.cartId, conflict);
      this.resolveConflict(conflict);
    });
  }

  // Resolver conflito automaticamente
  private resolveConflict(conflict: SyncConflict) {
    // Estratégia de resolução automática
    const localTime = new Date(conflict.localChanges[0]?.timestamp || 0).getTime();
    const remoteTime = new Date(conflict.remoteChanges[0]?.timestamp || 0).getTime();

    if (localTime > remoteTime) {
      conflict.resolution = 'local';
    } else if (remoteTime > localTime) {
      conflict.resolution = 'remote';
    } else {
      conflict.resolution = 'merge';
    }

    this.applyConflictResolution(conflict);
  }

  // Aplicar resolução de conflito
  private applyConflictResolution(conflict: SyncConflict) {
    switch (conflict.resolution) {
      case 'local':
        this.applyLocalChanges(conflict.localChanges);
        break;
      case 'remote':
        this.applyRemoteChanges(conflict.remoteChanges);
        break;
      case 'merge':
        this.mergeChanges(conflict.localChanges, conflict.remoteChanges);
        break;
    }
  }

  // Aplicar mudanças locais
  private applyLocalChanges(changes: SyncEvent[]) {
    // Implementar aplicação de mudanças locais
    console.log('Aplicando mudanças locais:', changes);
  }

  // Aplicar mudanças remotas
  private applyRemoteChanges(changes: SyncEvent[]) {
    // Implementar aplicação de mudanças remotas
    console.log('Aplicando mudanças remotas:', changes);
  }

  // Mesclar mudanças
  private mergeChanges(localChanges: SyncEvent[], remoteChanges: SyncEvent[]) {
    // Implementar lógica de merge inteligente
    console.log('Mesclando mudanças:', { localChanges, remoteChanges });
  }

  // Aplicar eventos remotos
  private applyRemoteEvents(events: SyncEvent[]) {
    events.forEach(event => {
      this.events.set(event.id, event);
      this.applyEvent(event);
    });
  }

  // Aplicar evento
  private applyEvent(event: SyncEvent) {
    // Implementar aplicação de evento específico
    console.log('Aplicando evento:', event);
  }

  // Atualizar dispositivos
  private updateDevices(devices: DeviceInfo[]) {
    devices.forEach(device => {
      this.devices.set(device.id, device);
    });
  }

  // Manipular erro de sincronização
  private handleSyncError() {
    this.retryCount++;
    if (this.retryCount < this.maxRetries) {
      // Tentar novamente após delay exponencial
      const delay = Math.pow(2, this.retryCount) * 1000;
      setTimeout(() => {
        this.syncPendingChanges();
      }, delay);
    }
  }

  // Limpar eventos pendentes
  private clearPendingEvents() {
    // Implementar limpeza de eventos sincronizados
  }

  // Salvar estado no storage
  private saveStateToStorage() {
    const state = {
      events: Array.from(this.events.values()),
      conflicts: Array.from(this.conflicts.values()),
      devices: Array.from(this.devices.values()),
      lastSync: new Date().toISOString()
    };

    localStorage.setItem('muhlstore-cart-sync', JSON.stringify(state));
  }

  // Carregar estado do storage
  private loadStateFromStorage() {
    try {
      const state = localStorage.getItem('muhlstore-cart-sync');
      if (state) {
        const parsed = JSON.parse(state);
        this.events = new Map(parsed.events?.map((e: SyncEvent) => [e.id, e]) || []);
        this.conflicts = new Map(parsed.conflicts?.map((c: SyncConflict) => [c.cartId, c]) || []);
        this.devices = new Map(parsed.devices?.map((d: DeviceInfo) => [d.id, d]) || []);
      }
    } catch (error) {
      console.error('Erro ao carregar estado:', error);
    }
  }

  // Manipular sincronização via storage
  private handleStorageSync(newValue: string | null) {
    if (newValue) {
      try {
        const state = JSON.parse(newValue);
        this.applyRemoteEvents(state.events || []);
      } catch (error) {
        console.error('Erro ao processar sincronização via storage:', error);
      }
    }
  }

  // Registrar evento de sincronização
  registerEvent(type: SyncEvent['type'], cartId: string, data: any) {
    const event: SyncEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      cartId,
      data,
      timestamp: new Date().toISOString(),
      deviceId: this.deviceId,
      version: 1
    };

    this.events.set(event.id, event);
    this.saveStateToStorage();

    // Sincronizar imediatamente se online
    if (this.isOnline) {
      this.syncPendingChanges();
    }
  }

  // Obter status da sincronização
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: this.getLastSyncTime(),
      pendingChanges: this.getPendingEvents().length,
      conflicts: Array.from(this.conflicts.values()),
      devices: Array.from(this.devices.values()),
      syncInProgress: this.syncInProgress
    };
  }

  // Obter tempo da última sincronização
  private getLastSyncTime(): string {
    const lastEvent = Array.from(this.events.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return lastEvent?.timestamp || new Date().toISOString();
  }

  // Forçar sincronização
  async forceSync(): Promise<boolean> {
    return await this.syncPendingChanges();
  }

  // Limpar dados de sincronização
  clearSyncData() {
    this.events.clear();
    this.conflicts.clear();
    localStorage.removeItem('muhlstore-cart-sync');
  }

  // Destruir instância
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.saveStateToStorage();
  }
}

// Instância global
export const cartSync = new CartSyncManager();

// Hook para usar sincronização
export const useCartSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const updateSyncStatus = useCallback(() => {
    setSyncStatus(cartSync.getSyncStatus());
  }, []);

  const forceSync = useCallback(async () => {
    setLoading(true);
    try {
      const success = await cartSync.forceSync();
      updateSyncStatus();
      return success;
    } finally {
      setLoading(false);
    }
  }, [updateSyncStatus]);

  const registerEvent = useCallback((type: SyncEvent['type'], cartId: string, data: any) => {
    cartSync.registerEvent(type, cartId, data);
    updateSyncStatus();
  }, [updateSyncStatus]);

  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, [updateSyncStatus]);

  return {
    syncStatus,
    loading,
    forceSync,
    registerEvent,
    isOnline: syncStatus?.isOnline || false,
    pendingChanges: syncStatus?.pendingChanges || 0,
    conflicts: syncStatus?.conflicts || [],
    devices: syncStatus?.devices || []
  };
};

export default CartSyncManager;
