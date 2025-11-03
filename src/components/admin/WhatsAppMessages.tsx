import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  User, 
  Clock, 
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

interface WhatsAppMessage {
  id: number;
  whatsapp_id: string;
  from_phone: string;
  from_name: string;
  to_phone?: string;
  message_type: string;
  message_text: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  status?: string;
}

const WhatsAppMessages = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [sendMessage, setSendMessage] = useState({
    to: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    loadMessages();
  }, [pagination.page]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/whatsapp/messages?page=${pagination.page}&limit=${pagination.limit}`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!sendMessage.to || !sendMessage.message) {
      toast.error('Número e mensagem são obrigatórios');
      return;
    }

    try {
      setIsSending(true);
      const res = await fetch(`${API_BASE_URL}/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(sendMessage)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setSendMessage({ to: '', message: '' });
        loadMessages(); // Recarregar mensagens
      } else {
        throw new Error('Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.from_phone.includes(searchTerm) || 
                         message.from_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message_text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterDirection === 'all' || message.direction === filterDirection;
    
    return matchesSearch && matchesFilter;
  });

  const formatPhone = (phone: string) => {
    // Formatar número de telefone para exibição
    if (phone.length === 13 && phone.startsWith('55')) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Enviar Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Mensagem
          </CardTitle>
          <CardDescription>
            Envie mensagens diretamente via WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="send-to">Número do WhatsApp</Label>
              <Input
                id="send-to"
                placeholder="5511999999999"
                value={sendMessage.to}
                onChange={(e) => setSendMessage({ ...sendMessage, to: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Formato: código do país + DDD + número (ex: 5511999999999)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-message">Mensagem</Label>
              <Textarea
                id="send-message"
                rows={3}
                placeholder="Digite sua mensagem..."
                value={sendMessage.message}
                onChange={(e) => setSendMessage({ ...sendMessage, message: e.target.value })}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSendMessage} 
            disabled={isSending || !sendMessage.to || !sendMessage.message}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Enviar Mensagem
          </Button>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Mensagens WhatsApp
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadMessages}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, nome ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterDirection === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDirection('all')}
              >
                Todas
              </Button>
              <Button
                variant={filterDirection === 'incoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDirection('incoming')}
              >
                Recebidas
              </Button>
              <Button
                variant={filterDirection === 'outgoing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDirection('outgoing')}
              >
                Enviadas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map((message) => (
                <div key={message.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={message.direction === 'incoming' ? 'default' : 'secondary'}>
                          {message.direction === 'incoming' ? 'Recebida' : 'Enviada'}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {formatPhone(message.from_phone)}
                        </div>
                        {message.from_name && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            {message.from_name}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm mb-2">{message.message_text}</p>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppMessages;
