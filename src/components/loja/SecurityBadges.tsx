import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  CreditCard, 
  Truck, 
  Phone, 
  MessageCircle, 
  Mail,
  CheckCircle,
  Star,
  Award,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecurityBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  verified?: boolean;
}

interface ContactOption {
  id: string;
  type: 'phone' | 'whatsapp' | 'email' | 'chat';
  label: string;
  value: string;
  icon: React.ReactNode;
  available?: boolean;
}

interface SecurityBadgesProps {
  className?: string;
  variant?: 'compact' | 'detailed';
}

const SecurityBadges: React.FC<SecurityBadgesProps> = ({ 
  className, 
  variant = 'detailed' 
}) => {
  const securityBadges: SecurityBadge[] = [
    {
      id: 'ssl',
      title: 'SSL Seguro',
      description: 'Conexão criptografada',
      icon: <Lock className="h-4 w-4" />,
      verified: true
    },
    {
      id: 'pci',
      title: 'PCI DSS',
      description: 'Dados protegidos',
      icon: <Shield className="h-4 w-4" />,
      verified: true
    },
    {
      id: 'payment',
      title: 'Pagamento Seguro',
      description: 'Processamento confiável',
      icon: <CreditCard className="h-4 w-4" />,
      verified: true
    },
    {
      id: 'delivery',
      title: 'Entrega Garantida',
      description: 'Rastreamento completo',
      icon: <Truck className="h-4 w-4" />,
      verified: true
    }
  ];

  const contactOptions: ContactOption[] = [
    {
      id: 'phone',
      type: 'phone',
      label: 'Telefone',
      value: '(11) 99999-9999',
      icon: <Phone className="h-4 w-4" />,
      available: true
    },
    {
      id: 'whatsapp',
      type: 'whatsapp',
      label: 'WhatsApp',
      value: '(11) 99999-9999',
      icon: <MessageCircle className="h-4 w-4" />,
      available: true
    },
    {
      id: 'email',
      type: 'email',
      label: 'E-mail',
      value: 'contato@muhlstore.com',
      icon: <Mail className="h-4 w-4" />,
      available: true
    },
    {
      id: 'chat',
      type: 'chat',
      label: 'Chat Online',
      value: 'Disponível agora',
      icon: <MessageCircle className="h-4 w-4" />,
      available: true
    }
  ];

  const handleContact = (option: ContactOption) => {
    switch (option.type) {
      case 'phone':
        window.open(`tel:${option.value}`);
        break;
      case 'whatsapp':
        window.open(`https://wa.me/5511999999999`);
        break;
      case 'email':
        window.open(`mailto:${option.value}`);
        break;
      case 'chat':
        // Implementar abertura do chat
        console.log('Abrir chat online');
        break;
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {securityBadges.slice(0, 2).map((badge) => (
          <Badge
            key={badge.id}
            variant={badge.verified ? "default" : "secondary"}
            className="flex items-center gap-1 text-xs"
          >
            {badge.icon}
            {badge.title}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selos de Segurança */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Segurança Garantida</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {securityBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <div className={cn(
                    "p-1 rounded-full",
                    badge.verified ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{badge.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {badge.description}
                    </div>
                  </div>
                  {badge.verified && (
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              ✓ Compra 100% segura e protegida
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato Rápido */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Precisa de Ajuda?</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {contactOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleContact(option)}
                  disabled={!option.available}
                  className="h-auto p-2 flex flex-col items-center gap-1"
                >
                  {option.icon}
                  <span className="text-xs">{option.label}</span>
                  {option.available && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </Button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Atendimento disponível 24/7
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Garantias */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold">Nossas Garantias</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>Produtos originais e autênticos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>Entrega rápida e rastreada</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>Troca e devolução em até 30 dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span>Suporte ao cliente especializado</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tempo de Processamento */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-800">
                Processamento Rápido
              </div>
              <div className="text-xs text-green-600">
                Pedidos processados em até 2 minutos
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Tempo real
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityBadges;
