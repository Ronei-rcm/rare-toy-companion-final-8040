import { request } from './api-config';
import { useState, useCallback, useEffect } from 'react';

/**
 * Sistema Avançado de Perfil de Cliente
 * Gestão completa de dados, preferências e histórico
 */

interface CustomerProfile {
  id: string;
  personalInfo: {
    nome: string;
    email: string;
    telefone?: string;
    dataNascimento?: string;
    genero?: 'masculino' | 'feminino' | 'outro' | 'prefiro_nao_informar';
    cpf?: string;
    rg?: string;
  };
  addresses: Array<{
    id: string;
    tipo: 'residencial' | 'comercial' | 'cobranca' | 'entrega';
    principal: boolean;
    endereco: {
      cep: string;
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      estado: string;
      pais: string;
    };
    contato?: {
      nome: string;
      telefone: string;
    };
    instrucoes?: string;
    ativo: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  preferences: {
    comunicacao: {
      email: boolean;
      sms: boolean;
      push: boolean;
      whatsapp: boolean;
    };
    marketing: {
      promocoes: boolean;
      novidades: boolean;
      lancamentos: boolean;
      ofertas_personalizadas: boolean;
    };
    privacidade: {
      dados_terceiros: boolean;
      analytics: boolean;
      cookies: boolean;
    };
    idioma: 'pt-BR' | 'en-US' | 'es-ES';
    moeda: 'BRL' | 'USD' | 'EUR';
    timezone: string;
  };
  interests: {
    categorias: string[];
    marcas: string[];
    faixasPreco: {
      min: number;
      max: number;
    };
    tiposProduto: string[];
    ocasioes: string[];
  };
  social: {
    redesSociais: Array<{
      plataforma: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
      username: string;
      conectado: boolean;
    }>;
    compartilhamento: boolean;
    reviews: boolean;
  };
  loyalty: {
    nivel: 'bronze' | 'prata' | 'ouro' | 'platina' | 'diamante';
    pontos: number;
    pontosExpiracao: number;
    totalCompras: number;
    valorTotalGasto: number;
    dataUltimaCompra?: string;
    streakCompras: number;
    streakMaximo: number;
  };
  behavior: {
    frequenciaVisitas: 'baixa' | 'media' | 'alta';
    horarioPreferido: string;
    dispositivoPreferido: 'mobile' | 'desktop' | 'tablet';
    navegadorPreferido: string;
    tempoMedioSessao: number;
    paginasFavoritas: string[];
    produtosVisualizados: string[];
    produtosComprados: string[];
    produtosAbandonados: string[];
  };
  security: {
    ultimoLogin?: string;
    ultimoLoginIp?: string;
    dispositivosConectados: Array<{
      id: string;
      nome: string;
      tipo: string;
      ultimoAcesso: string;
      ativo: boolean;
    }>;
    autenticacao2FA: boolean;
    metodo2FA?: 'sms' | 'email' | 'app';
    senhaAlteradaEm?: string;
  };
  metadata: {
    fonteCadastro: 'site' | 'app' | 'facebook' | 'google' | 'indicacao';
    campanhaOrigem?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    userAgent?: string;
    ipCadastro?: string;
    dataCadastro: string;
    dataUltimaAtualizacao: string;
    versao: string;
  };
}

interface CustomerStats {
  totalCompras: number;
  valorTotalGasto: number;
  ticketMedio: number;
  frequenciaCompras: number;
  produtosFavoritos: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    ultimaCompra: string;
  }>;
  categoriasPreferidas: Array<{
    categoria: string;
    quantidade: number;
    valor: number;
  }>;
  marcasPreferidas: Array<{
    marca: string;
    quantidade: number;
    valor: number;
  }>;
  sazonalidade: {
    mesMaisAtivo: string;
    diaSemanaPreferido: string;
    horarioPreferido: string;
  };
  comportamento: {
    taxaAbandonoCarrinho: number;
    tempoMedioDecisao: number;
    produtosComparados: number;
    reviewsEscritas: number;
    compartilhamentos: number;
  };
}

interface CustomerActivity {
  id: string;
  tipo: 'login' | 'logout' | 'visualizacao' | 'adicionar_carrinho' | 'remover_carrinho' | 'compra' | 'avaliacao' | 'compartilhamento' | 'busca' | 'filtro';
  descricao: string;
  dados: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  dispositivo?: string;
}

class CustomerProfileManager {
  private profiles: Map<string, CustomerProfile> = new Map();
  private activities: Map<string, CustomerActivity[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  // Inicializar sistema
  private async initialize() {
    if (this.isInitialized) return;

    try {
      await this.loadProfiles();
      this.isInitialized = true;
      console.log('👤 Sistema de perfil de cliente inicializado');
    } catch (error) {
      console.error('Erro ao inicializar perfil de cliente:', error);
    }
  }

  // Carregar perfis existentes
  private async loadProfiles() {
    try {
      const profiles = await request<CustomerProfile[]>('/customers/profiles');
      profiles.forEach((profile: CustomerProfile) => {
        this.profiles.set(profile.id, profile);
      });
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  }

  // Obter perfil completo
  async getProfile(customerId: string): Promise<CustomerProfile | null> {
    await this.initialize();

    let profile = this.profiles.get(customerId);

    if (!profile) {
      // Tentar carregar do servidor
      try {
        profile = await request<CustomerProfile>(`/customers/${customerId}/profile`);
        this.profiles.set(customerId, profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }

    return profile || null;
  }

  // Criar/atualizar perfil
  async saveProfile(profile: CustomerProfile): Promise<boolean> {
    try {
      await request(`/api/customers/${profile.id}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profile)
      });

      this.profiles.set(profile.id, profile);
      return true;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      return false;
    }
  }

  // Atualizar informações pessoais
  async updatePersonalInfo(customerId: string, personalInfo: Partial<CustomerProfile['personalInfo']>): Promise<boolean> {
    const profile = await this.getProfile(customerId);
    if (!profile) return false;

    profile.personalInfo = { ...profile.personalInfo, ...personalInfo };
    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();

    return await this.saveProfile(profile);
  }

  // Adicionar endereço
  async addAddress(customerId: string, address: Omit<CustomerProfile['addresses'][0], 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    const profile = await this.getProfile(customerId);
    if (!profile) return null;

    const newAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Se for o primeiro endereço ou marcado como principal, definir como principal
    if (profile.addresses.length === 0 || newAddress.principal) {
      profile.addresses.forEach(addr => addr.principal = false);
      newAddress.principal = true;
    }

    profile.addresses.push(newAddress);
    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();

    const success = await this.saveProfile(profile);
    return success ? newAddress.id : null;
  }

  // Atualizar endereço
  async updateAddress(customerId: string, addressId: string, updates: Partial<CustomerProfile['addresses'][0]>): Promise<boolean> {
    const profile = await this.getProfile(customerId);
    if (!profile) return false;

    const addressIndex = profile.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) return false;

    profile.addresses[addressIndex] = {
      ...profile.addresses[addressIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Se marcado como principal, desmarcar outros
    if (updates.principal) {
      profile.addresses.forEach((addr, index) => {
        if (index !== addressIndex) addr.principal = false;
      });
    }

    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();
    return await this.saveProfile(profile);
  }

  // Remover endereço
  async removeAddress(customerId: string, addressId: string): Promise<boolean> {
    const profile = await this.getProfile(customerId);
    if (!profile) return false;

    const addressIndex = profile.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) return false;

    const wasPrincipal = profile.addresses[addressIndex].principal;
    profile.addresses.splice(addressIndex, 1);

    // Se era o principal, definir outro como principal
    if (wasPrincipal && profile.addresses.length > 0) {
      profile.addresses[0].principal = true;
    }

    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();
    return await this.saveProfile(profile);
  }

  // Atualizar preferências
  async updatePreferences(customerId: string, preferences: Partial<CustomerProfile['preferences']>): Promise<boolean> {
    const profile = await this.getProfile(customerId);
    if (!profile) return false;

    profile.preferences = { ...profile.preferences, ...preferences };
    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();

    return await this.saveProfile(profile);
  }

  // Atualizar interesses
  async updateInterests(customerId: string, interests: Partial<CustomerProfile['interests']>): Promise<boolean> {
    const profile = await this.getProfile(customerId);
    if (!profile) return false;

    profile.interests = { ...profile.interests, ...interests };
    profile.metadata.dataUltimaAtualizacao = new Date().toISOString();

    return await this.saveProfile(profile);
  }

  // Registrar atividade
  async logActivity(customerId: string, activity: Omit<CustomerActivity, 'id' | 'timestamp'>): Promise<void> {
    const newActivity: CustomerActivity = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    if (!this.activities.has(customerId)) {
      this.activities.set(customerId, []);
    }

    this.activities.get(customerId)!.push(newActivity);

    // Manter apenas últimas 1000 atividades
    const activities = this.activities.get(customerId)!;
    if (activities.length > 1000) {
      activities.splice(0, activities.length - 1000);
    }

    // Enviar para servidor
    try {
      await request(`/customers/${customerId}/activities`, {
        method: 'POST',
        body: JSON.stringify(newActivity)
      });
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }

  // Obter atividades
  getActivities(customerId: string, limit: number = 50): CustomerActivity[] {
    const activities = this.activities.get(customerId) || [];
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Obter estatísticas
  async getStats(customerId: string): Promise<CustomerStats | null> {
    try {
      return await request<CustomerStats>(`/api/customers/${customerId}/stats`);
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }

  // Obter recomendações personalizadas
  async getRecommendations(customerId: string, limit: number = 10): Promise<any[]> {
    try {
      return await request<any[]>(`/api/customers/${customerId}/recommendations?limit=${limit}`);
    } catch (error) {
      console.error('Erro ao obter recomendações:', error);
      return [];
    }
  }

  // Exportar dados do cliente
  async exportData(customerId: string): Promise<{
    profile: CustomerProfile;
    activities: CustomerActivity[];
    stats: CustomerStats | null;
  } | null> {
    const profile = await this.getProfile(customerId);
    if (!profile) return null;

    const activities = this.getActivities(customerId, 1000);
    const stats = await this.getStats(customerId);

    return { profile, activities, stats };
  }

  // Deletar conta (GDPR)
  async deleteAccount(customerId: string): Promise<boolean> {
    try {
      await request(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });

      this.profiles.delete(customerId);
      this.activities.delete(customerId);
      return true;
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      return false;
    }
  }
}

// Instância global
export const customerProfile = new CustomerProfileManager();

// Hook para usar perfil de cliente
export const useCustomerProfile = (customerId?: string) => {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const profileData = await customerProfile.getProfile(id);
      setProfile(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<CustomerProfile>) => {
    if (!profile) return false;

    setLoading(true);
    setError(null);

    try {
      const updatedProfile = { ...profile, ...updates };
      const success = await customerProfile.saveProfile(updatedProfile);
      if (success) {
        setProfile(updatedProfile);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const logActivity = useCallback(async (activity: Omit<CustomerActivity, 'id' | 'timestamp'>) => {
    if (!customerId) return;
    await customerProfile.logActivity(customerId, activity);
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      loadProfile(customerId);
    }
  }, [customerId, loadProfile]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    logActivity,
    getActivities: (limit?: number) => customerId ? customerProfile.getActivities(customerId, limit) : [],
    getStats: () => customerId ? customerProfile.getStats(customerId) : null,
    getRecommendations: (limit?: number) => customerId ? customerProfile.getRecommendations(customerId, limit) : []
  };
};

export default CustomerProfileManager;
