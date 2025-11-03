/**
 * Sistema de Chat de Suporte em Tempo Real
 * Atendimento ao cliente com IA e agentes humanos
 */

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  type: 'customer' | 'agent' | 'admin';
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  department?: string;
  skills?: string[];
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'ai_suggestion';
  timestamp: string;
  isRead: boolean;
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    suggestionType?: 'quick_reply' | 'product' | 'article';
    suggestionData?: any;
  };
}

interface Conversation {
  id: string;
  customerId: string;
  agentId?: string;
  status: 'waiting' | 'active' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject?: string;
  category: 'general' | 'technical' | 'billing' | 'sales' | 'complaint' | 'suggestion';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: Message[];
  satisfaction?: {
    rating: number;
    feedback?: string;
    ratedAt: string;
  };
}

interface QuickReply {
  id: string;
  text: string;
  category: string;
  isActive: boolean;
  usageCount: number;
}

interface AIResponse {
  id: string;
  query: string;
  response: string;
  confidence: number;
  source: 'knowledge_base' | 'faq' | 'product_info' | 'general';
  suggestedActions?: Array<{
    type: 'quick_reply' | 'transfer' | 'escalate' | 'product';
    data: any;
  }>;
}

interface ChatSettings {
  autoAssign: boolean;
  maxConcurrentChats: number;
  responseTimeGoal: number; // em minutos
  workingHours: {
    start: string;
    end: string;
    timezone: string;
    days: number[]; // 0-6 (domingo-sábado)
  };
  aiEnabled: boolean;
  quickRepliesEnabled: boolean;
  fileUploadEnabled: boolean;
  maxFileSize: number; // em MB
}

class ChatSupportManager {
  private conversations: Map<string, Conversation> = new Map();
  private users: Map<string, User> = new Map();
  private quickReplies: Map<string, QuickReply> = new Map();
  private settings: ChatSettings;
  private isConnected: boolean = false;
  private socket: WebSocket | null = null;
  private messageQueue: Message[] = [];

  constructor() {
    this.settings = {
      autoAssign: true,
      maxConcurrentChats: 5,
      responseTimeGoal: 5,
      workingHours: {
        start: '09:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo',
        days: [1, 2, 3, 4, 5] // Segunda a sexta
      },
      aiEnabled: true,
      quickRepliesEnabled: true,
      fileUploadEnabled: true,
      maxFileSize: 10
    };

    this.initializeQuickReplies();
    this.connectWebSocket();
  }

  // Inicializar respostas rápidas
  private initializeQuickReplies() {
    const replies: QuickReply[] = [
      {
        id: 'greeting',
        text: 'Olá! Como posso ajudá-lo hoje?',
        category: 'greeting',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'thanks',
        text: 'Obrigado pelo contato!',
        category: 'closing',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'wait',
        text: 'Por favor, aguarde um momento enquanto verifico isso para você.',
        category: 'acknowledgment',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'transfer',
        text: 'Vou transferir você para um especialista.',
        category: 'transfer',
        isActive: true,
        usageCount: 0
      },
      {
        id: 'hours',
        text: 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.',
        category: 'hours',
        isActive: true,
        usageCount: 0
      }
    ];

    replies.forEach(reply => {
      this.quickReplies.set(reply.id, reply);
    });
  }

  // Conectar WebSocket
  private connectWebSocket() {
    try {
      this.socket = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/chat');
      
      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('💬 Chat conectado');
        this.processMessageQueue();
      };

      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        console.log('💬 Chat desconectado');
        // Tentar reconectar após 5 segundos
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
      };
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
    }
  }

  // Processar fila de mensagens
  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  // Enviar mensagem via WebSocket
  private sendMessage(message: Message) {
    if (this.isConnected && this.socket) {
      this.socket.send(JSON.stringify({
        type: 'message',
        data: message
      }));
    } else {
      this.messageQueue.push(message);
    }
  }

  // Manipular mensagem do WebSocket
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'message':
        this.handleIncomingMessage(data.data);
        break;
      case 'user_status':
        this.handleUserStatusUpdate(data.data);
        break;
      case 'typing':
        this.handleTypingIndicator(data.data);
        break;
      case 'ai_response':
        this.handleAIResponse(data.data);
        break;
    }
  }

  // Manipular mensagem recebida
  private handleIncomingMessage(message: Message) {
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.lastMessageAt = message.timestamp;
      conversation.updatedAt = new Date().toISOString();
    }
  }

  // Manipular atualização de status do usuário
  private handleUserStatusUpdate(data: any) {
    const user = this.users.get(data.userId);
    if (user) {
      user.status = data.status;
      user.lastSeen = data.lastSeen;
    }
  }

  // Manipular indicador de digitação
  private handleTypingIndicator(data: any) {
    // Implementar indicador de digitação
    console.log(`${data.userName} está digitando...`);
  }

  // Manipular resposta da IA
  private handleAIResponse(data: AIResponse) {
    // Implementar resposta da IA
    console.log('Resposta da IA:', data);
  }

  // Criar nova conversa
  async createConversation(customerId: string, subject?: string, category: string = 'general'): Promise<string> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const conversation: Conversation = {
      id: conversationId,
      customerId,
      status: 'waiting',
      priority: 'medium',
      subject,
      category: category as any,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messages: []
    };

    this.conversations.set(conversationId, conversation);

    // Atribuir agente automaticamente se configurado
    if (this.settings.autoAssign) {
      await this.assignAgent(conversationId);
    }

    return conversationId;
  }

  // Atribuir agente
  async assignAgent(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    // Encontrar agente disponível
    const availableAgents = Array.from(this.users.values())
      .filter(user => 
        user.type === 'agent' && 
        user.status === 'online' &&
        this.getAgentActiveChats(user.id) < this.settings.maxConcurrentChats
      );

    if (availableAgents.length > 0) {
      const agent = availableAgents[0];
      conversation.agentId = agent.id;
      conversation.status = 'active';
      conversation.updatedAt = new Date().toISOString();

      // Notificar agente
      this.sendMessage({
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        senderId: 'system',
        senderName: 'Sistema',
        content: `Nova conversa atribuída: ${conversation.subject || 'Sem assunto'}`,
        type: 'system',
        timestamp: new Date().toISOString(),
        isRead: false
      });

      return true;
    }

    return false;
  }

  // Obter conversas ativas do agente
  private getAgentActiveChats(agentId: string): number {
    return Array.from(this.conversations.values())
      .filter(conv => conv.agentId === agentId && conv.status === 'active').length;
  }

  // Enviar mensagem
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<boolean> {
    const fullMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const conversation = this.conversations.get(message.conversationId);
    if (!conversation) return false;

    // Adicionar mensagem à conversa
    conversation.messages.push(fullMessage);
    conversation.lastMessageAt = fullMessage.timestamp;
    conversation.updatedAt = new Date().toISOString();

    // Enviar via WebSocket
    this.sendMessage(fullMessage);

    // Processar com IA se habilitado
    if (this.settings.aiEnabled && message.senderId !== 'ai') {
      this.processWithAI(conversation, fullMessage);
    }

    return true;
  }

  // Processar com IA
  private async processWithAI(conversation: Conversation, message: Message) {
    try {
      const aiResponse = await this.getAIResponse(message.content, conversation);
      
      if (aiResponse && aiResponse.confidence > 0.7) {
        // Enviar resposta da IA
        await this.sendMessage({
          conversationId: conversation.id,
          senderId: 'ai',
          senderName: 'Assistente IA',
          content: aiResponse.response,
          type: 'ai_suggestion',
          metadata: {
            suggestionType: 'quick_reply',
            suggestionData: aiResponse.suggestedActions
          }
        });
      }
    } catch (error) {
      console.error('Erro ao processar com IA:', error);
    }
  }

  // Obter resposta da IA
  private async getAIResponse(query: string, conversation: Conversation): Promise<AIResponse | null> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          conversationId: conversation.id,
          category: conversation.category,
          context: conversation.messages.slice(-5).map(m => m.content)
        })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erro ao obter resposta da IA:', error);
    }

    return null;
  }

  // Obter conversas do usuário
  getUserConversations(userId: string, status?: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(conv => 
        conv.customerId === userId || conv.agentId === userId
      )
      .filter(conv => !status || conv.status === status)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  // Obter conversas em espera
  getWaitingConversations(): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(conv => conv.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Marcar mensagem como lida
  markMessageAsRead(messageId: string): boolean {
    const conversation = Array.from(this.conversations.values())
      .find(conv => conv.messages.some(msg => msg.id === messageId));
    
    if (conversation) {
      const message = conversation.messages.find(msg => msg.id === messageId);
      if (message) {
        message.isRead = true;
        return true;
      }
    }
    
    return false;
  }

  // Fechar conversa
  async closeConversation(conversationId: string, reason?: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    conversation.status = 'closed';
    conversation.updatedAt = new Date().toISOString();

    // Enviar mensagem de fechamento
    await this.sendMessage({
      conversationId,
      senderId: 'system',
      senderName: 'Sistema',
      content: reason || 'Conversa encerrada',
      type: 'system'
    });

    return true;
  }

  // Avaliar atendimento
  async rateConversation(conversationId: string, rating: number, feedback?: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    conversation.satisfaction = {
      rating,
      feedback,
      ratedAt: new Date().toISOString()
    };

    return true;
  }

  // Obter estatísticas do chat
  getChatStats(): {
    totalConversations: number;
    activeConversations: number;
    waitingConversations: number;
    averageResponseTime: number;
    satisfactionRate: number;
    totalMessages: number;
  } {
    const conversations = Array.from(this.conversations.values());
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const waitingConversations = conversations.filter(c => c.status === 'waiting').length;
    const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
    
    const ratedConversations = conversations.filter(c => c.satisfaction);
    const satisfactionRate = ratedConversations.length > 0 
      ? ratedConversations.reduce((sum, c) => sum + (c.satisfaction?.rating || 0), 0) / ratedConversations.length
      : 0;

    return {
      totalConversations: conversations.length,
      activeConversations,
      waitingConversations,
      averageResponseTime: 0, // Implementar cálculo
      satisfactionRate,
      totalMessages
    };
  }

  // Obter respostas rápidas
  getQuickReplies(category?: string): QuickReply[] {
    return Array.from(this.quickReplies.values())
      .filter(reply => reply.isActive && (!category || reply.category === category));
  }

  // Usar resposta rápida
  useQuickReply(replyId: string): QuickReply | null {
    const reply = this.quickReplies.get(replyId);
    if (reply) {
      reply.usageCount++;
    }
    return reply || null;
  }

  // Verificar se está online
  isOnline(): boolean {
    return this.isConnected;
  }

  // Obter configurações
  getSettings(): ChatSettings {
    return { ...this.settings };
  }

  // Atualizar configurações
  updateSettings(newSettings: Partial<ChatSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }
}

// Instância global do chat
export const chatSupport = new ChatSupportManager();

// Hook para usar chat em componentes React
export const useChatSupport = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(chatSupport.isOnline());
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const createConversation = useCallback(async (
    customerId: string, 
    subject?: string, 
    category: string = 'general'
  ) => {
    setLoading(true);
    setError(null);

    try {
      const conversationId = await chatSupport.createConversation(customerId, subject, category);
      return conversationId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conversa');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    metadata?: any
  ) => {
    try {
      const success = await chatSupport.sendMessage({
        conversationId,
        senderId,
        senderName,
        content,
        type,
        metadata
      });
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      return false;
    }
  }, []);

  const getUserConversations = useCallback((userId: string, status?: string) => {
    return chatSupport.getUserConversations(userId, status);
  }, []);

  const getQuickReplies = useCallback((category?: string) => {
    return chatSupport.getQuickReplies(category);
  }, []);

  const getChatStats = useCallback(() => {
    return chatSupport.getChatStats();
  }, []);

  return {
    isConnected,
    conversations,
    loading,
    error,
    createConversation,
    sendMessage,
    getUserConversations,
    getQuickReplies,
    getChatStats
  };
};

export default ChatSupportManager;
