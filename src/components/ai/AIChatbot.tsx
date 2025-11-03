import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  Settings,
  MessageSquare,
  Brain,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  isHelpful?: boolean;
}

interface AIChatbotProps {
  userId?: string;
  sessionId?: string;
  placeholder?: string;
  showHeader?: boolean;
  maxHeight?: string;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({
  userId,
  sessionId = 'anonymous',
  placeholder = 'Digite sua mensagem...',
  showHeader = true,
  maxHeight = '400px',
  onMessageSent,
  onMessageReceived
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalMessages: 0,
    helpfulResponses: 0,
    intentsDetected: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Mensagem de boas-vindas
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'bot',
      content: 'Olá! Sou o assistente virtual da MuhlStore. Como posso ajudar você hoje? Posso falar sobre produtos, preços, entrega, devoluções e muito mais!',
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    if (onMessageSent) {
      onMessageSent(userMessage);
    }

    try {
      const response = await fetch('/api/ml/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: userId,
          sessionId: sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Simular delay de digitação
        setTimeout(() => {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            content: data.data.response,
            timestamp: new Date(),
            intent: data.data.intent,
            confidence: data.data.confidence
          };

          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          setIsLoading(false);

          if (onMessageReceived) {
            onMessageReceived(botMessage);
          }

          // Atualizar estatísticas
          setSessionStats(prev => ({
            totalMessages: prev.totalMessages + 1,
            helpfulResponses: prev.helpfulResponses,
            intentsDetected: prev.intentsDetected + (data.data.intent ? 1 : 0)
          }));
        }, 1000 + Math.random() * 1000);
      } else {
        throw new Error(data.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        timestamp: new Date(),
        intent: 'error',
        confidence: 0.1
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isHelpful }
          : msg
      )
    );

    if (isHelpful) {
      setSessionStats(prev => ({
        ...prev,
        helpfulResponses: prev.helpfulResponses + 1
      }));
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      type: 'bot',
      content: 'Olá! Sou o assistente virtual da MuhlStore. Como posso ajudar você hoje?',
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0
    }]);
    setSessionStats({
      totalMessages: 0,
      helpfulResponses: 0,
      intentsDetected: 0
    });
  };

  const getIntentColor = (intent: string) => {
    const colors: { [key: string]: string } = {
      'price_inquiry': 'bg-blue-100 text-blue-800',
      'stock_inquiry': 'bg-green-100 text-green-800',
      'shipping_inquiry': 'bg-purple-100 text-purple-800',
      'return_inquiry': 'bg-orange-100 text-orange-800',
      'discount_inquiry': 'bg-pink-100 text-pink-800',
      'help_request': 'bg-yellow-100 text-yellow-800',
      'gratitude': 'bg-emerald-100 text-emerald-800',
      'error': 'bg-red-100 text-red-800',
      'greeting': 'bg-indigo-100 text-indigo-800'
    };
    return colors[intent] || 'bg-gray-100 text-gray-800';
  };

  const getIntentName = (intent: string) => {
    const names: { [key: string]: string } = {
      'price_inquiry': 'Consulta de Preço',
      'stock_inquiry': 'Consulta de Estoque',
      'shipping_inquiry': 'Consulta de Entrega',
      'return_inquiry': 'Consulta de Devolução',
      'discount_inquiry': 'Consulta de Desconto',
      'help_request': 'Solicitação de Ajuda',
      'gratitude': 'Agradecimento',
      'error': 'Erro',
      'greeting': 'Saudação'
    };
    return names[intent] || 'Geral';
  };

  return (
    <Card className="w-full">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Assistente IA</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Brain className="w-3 h-3 mr-1" />
                    Inteligente
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Tempo Real
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Área de Mensagens */}
        <ScrollArea style={{ height: maxHeight }} className="p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-blue-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Mensagem */}
                  <div className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Metadados da mensagem */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      
                      {message.intent && message.intent !== 'greeting' && (
                        <Badge className={`text-xs ${getIntentColor(message.intent)}`}>
                          {getIntentName(message.intent)}
                        </Badge>
                      )}
                      
                      {message.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(message.confidence * 100)}% confiança
                        </Badge>
                      )}
                    </div>

                    {/* Feedback para mensagens do bot */}
                    {message.type === 'bot' && message.intent !== 'greeting' && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500">Útil?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            message.isHelpful === true ? 'text-green-600' : 'text-gray-400'
                          }`}
                          onClick={() => handleFeedback(message.id, true)}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${
                            message.isHelpful === false ? 'text-red-600' : 'text-gray-400'
                          }`}
                          onClick={() => handleFeedback(message.id, false)}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de digitação */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">Digitando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Área de Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Estatísticas da Sessão */}
          {sessionStats.totalMessages > 0 && (
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{sessionStats.totalMessages} mensagens</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                <span>{sessionStats.helpfulResponses} úteis</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                <span>{sessionStats.intentsDetected} intenções</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;
