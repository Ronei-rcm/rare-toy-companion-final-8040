/**
 * Sistema de backup automático para dados críticos
 */

interface BackupConfig {
  enabled: boolean;
  interval: number; // em milissegundos
  maxBackups: number;
  compression: boolean;
  encryption: boolean;
  storage: 'local' | 'cloud';
}

interface BackupData {
  timestamp: number;
  version: string;
  data: any;
  size: number;
  checksum: string;
}

class BackupManager {
  private config: BackupConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private backups: BackupData[] = [];

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      enabled: true,
      interval: 30 * 60 * 1000, // 30 minutos
      maxBackups: 10,
      compression: true,
      encryption: false,
      storage: 'local',
      ...config
    };

    this.loadBackups();
    this.startAutoBackup();
  }

  // Iniciar backup automático
  startAutoBackup(): void {
    if (!this.config.enabled || this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.createBackup();
    }, this.config.interval);
  }

  // Parar backup automático
  stopAutoBackup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Criar backup manual
  async createBackup(): Promise<BackupData> {
    try {
      const timestamp = Date.now();
      const data = await this.collectData();
      const compressed = this.config.compression ? await this.compress(data) : data;
      const checksum = await this.calculateChecksum(compressed);

      const backup: BackupData = {
        timestamp,
        version: '1.0.0',
        data: compressed,
        size: JSON.stringify(compressed).length,
        checksum
      };

      this.backups.unshift(backup);
      this.cleanupOldBackups();
      this.saveBackups();

      console.log(`Backup criado: ${new Date(timestamp).toLocaleString()}`);
      return backup;
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  // Coletar dados para backup
  private async collectData(): Promise<any> {
    const data = {
      timestamp: Date.now(),
      products: await this.getProducts(),
      orders: await this.getOrders(),
      customers: await this.getCustomers(),
      categories: await this.getCategories(),
      settings: await this.getSettings(),
      users: await this.getUsers()
    };

    return data;
  }

  // Obter produtos
  private async getProducts(): Promise<any[]> {
    try {
      const response = await fetch('/api/produtos');
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  }

  // Obter pedidos
  private async getOrders(): Promise<any[]> {
    try {
      const response = await fetch('/api/pedidos');
      if (!response.ok) throw new Error('Erro ao buscar pedidos');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return [];
    }
  }

  // Obter clientes
  private async getCustomers(): Promise<any[]> {
    try {
      const response = await fetch('/api/clientes');
      if (!response.ok) throw new Error('Erro ao buscar clientes');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  }

  // Obter categorias
  private async getCategories(): Promise<any[]> {
    try {
      const response = await fetch('/api/categorias');
      if (!response.ok) throw new Error('Erro ao buscar categorias');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  }

  // Obter configurações
  private async getSettings(): Promise<any> {
    try {
      const response = await fetch('/api/configuracoes');
      if (!response.ok) throw new Error('Erro ao buscar configurações');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {};
    }
  }

  // Obter usuários
  private async getUsers(): Promise<any[]> {
    try {
      const response = await fetch('/api/usuarios');
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  // Comprimir dados
  private async compress(data: any): Promise<any> {
    // Implementação simples de compressão
    // Em produção, usar uma biblioteca como pako ou lz-string
    const jsonString = JSON.stringify(data);
    return {
      compressed: true,
      data: jsonString,
      originalSize: jsonString.length
    };
  }

  // Calcular checksum
  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Limpar backups antigos
  private cleanupOldBackups(): void {
    if (this.backups.length > this.config.maxBackups) {
      this.backups = this.backups.slice(0, this.config.maxBackups);
    }
  }

  // Salvar backups no localStorage
  private saveBackups(): void {
    try {
      localStorage.setItem('backups', JSON.stringify(this.backups));
    } catch (error) {
      console.error('Erro ao salvar backups:', error);
    }
  }

  // Carregar backups do localStorage
  private loadBackups(): void {
    try {
      const saved = localStorage.getItem('backups');
      if (saved) {
        this.backups = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      this.backups = [];
    }
  }

  // Restaurar backup
  async restoreBackup(backup: BackupData): Promise<void> {
    try {
      const data = backup.data;
      
      // Restaurar produtos
      if (data.products) {
        await this.restoreProducts(data.products);
      }

      // Restaurar pedidos
      if (data.orders) {
        await this.restoreOrders(data.orders);
      }

      // Restaurar clientes
      if (data.customers) {
        await this.restoreCustomers(data.customers);
      }

      // Restaurar categorias
      if (data.categories) {
        await this.restoreCategories(data.categories);
      }

      // Restaurar configurações
      if (data.settings) {
        await this.restoreSettings(data.settings);
      }

      console.log('Backup restaurado com sucesso');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  // Restaurar produtos
  private async restoreProducts(products: any[]): Promise<void> {
    for (const product of products) {
      try {
        await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } catch (error) {
        console.error('Erro ao restaurar produto:', product.id, error);
      }
    }
  }

  // Restaurar pedidos
  private async restoreOrders(orders: any[]): Promise<void> {
    for (const order of orders) {
      try {
        await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (error) {
        console.error('Erro ao restaurar pedido:', order.id, error);
      }
    }
  }

  // Restaurar clientes
  private async restoreCustomers(customers: any[]): Promise<void> {
    for (const customer of customers) {
      try {
        await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
      } catch (error) {
        console.error('Erro ao restaurar cliente:', customer.id, error);
      }
    }
  }

  // Restaurar categorias
  private async restoreCategories(categories: any[]): Promise<void> {
    for (const category of categories) {
      try {
        await fetch('/api/categorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category)
        });
      } catch (error) {
        console.error('Erro ao restaurar categoria:', category.id, error);
      }
    }
  }

  // Restaurar configurações
  private async restoreSettings(settings: any): Promise<void> {
    try {
      await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Erro ao restaurar configurações:', error);
    }
  }

  // Obter lista de backups
  getBackups(): BackupData[] {
    return [...this.backups];
  }

  // Obter backup mais recente
  getLatestBackup(): BackupData | null {
    return this.backups[0] || null;
  }

  // Excluir backup
  deleteBackup(timestamp: number): void {
    this.backups = this.backups.filter(backup => backup.timestamp !== timestamp);
    this.saveBackups();
  }

  // Exportar backup
  exportBackup(backup: BackupData): void {
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date(backup.timestamp).toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Importar backup
  async importBackup(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string);
          this.backups.unshift(backup);
          this.saveBackups();
          resolve(backup);
        } catch (error) {
          reject(new Error('Arquivo de backup inválido'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  }

  // Obter estatísticas
  getStats() {
    return {
      totalBackups: this.backups.length,
      totalSize: this.backups.reduce((sum, backup) => sum + backup.size, 0),
      latestBackup: this.backups[0]?.timestamp || null,
      oldestBackup: this.backups[this.backups.length - 1]?.timestamp || null,
      config: this.config
    };
  }
}

// Instância global do gerenciador de backup
export const backupManager = new BackupManager({
  enabled: true,
  interval: 30 * 60 * 1000, // 30 minutos
  maxBackups: 10,
  compression: true,
  encryption: false,
  storage: 'local'
});

export default BackupManager;
