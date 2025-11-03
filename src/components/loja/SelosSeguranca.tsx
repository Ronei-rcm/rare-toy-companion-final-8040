import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Truck, Headphones, MessageCircle, Phone, Mail, CheckCircle, Award, CreditCard } from 'lucide-react';

interface SelosSegurancaProps {
  variant?: 'compact' | 'full';
  showContact?: boolean;
}

const SelosSeguranca = ({ variant = 'full', showContact = true }: SelosSegurancaProps) => {
  const selos = [
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Compra Segura",
      description: "SSL 256-bit",
      color: "text-green-600"
    },
    {
      icon: <Lock className="h-4 w-4" />,
      title: "Dados Protegidos",
      description: "LGPD Compliant",
      color: "text-blue-600"
    },
    {
      icon: <Truck className="h-4 w-4" />,
      title: "Entrega Garantida",
      description: "Rastreamento",
      color: "text-purple-600"
    },
    {
      icon: <Award className="h-4 w-4" />,
      title: "Qualidade",
      description: "Produtos Originais",
      color: "text-orange-600"
    }
  ];

  const contatos = [
    {
      icon: <Phone className="h-4 w-4" />,
      title: "Telefone",
      value: "(11) 99999-9999",
      action: "tel:+5511999999999"
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      title: "WhatsApp",
      value: "Chat Online",
      action: "https://wa.me/5511999999999"
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Email",
      value: "contato@muhlstore.com",
      action: "mailto:contato@muhlstore.com"
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {selos.map((selo, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {selo.icon}
            <span className="ml-1">{selo.title}</span>
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selos de Segurança */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-sm">Seus dados estão seguros</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {selos.map((selo, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={selo.color}>
                  {selo.icon}
                </div>
                <div>
                  <div className="font-medium">{selo.title}</div>
                  <div className="text-muted-foreground">{selo.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certificações */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-sm">Certificações</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-muted-foreground" />
              <span>PCI DSS</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <span>ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>LGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-3 w-3 text-muted-foreground" />
              <span>ABComm</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato Rápido */}
      {showContact && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-sm">Precisa de ajuda?</h3>
            </div>
            
            <div className="space-y-2">
              {contatos.map((contato, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto p-2 text-xs"
                  onClick={() => {
                    if (contato.action.startsWith('http')) {
                      window.open(contato.action, '_blank');
                    } else {
                      window.location.href = contato.action;
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {contato.icon}
                    <div className="text-left">
                      <div className="font-medium">{contato.title}</div>
                      <div className="text-muted-foreground">{contato.value}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Garantias */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-sm">Nossas Garantias</h3>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>30 dias para troca</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Produtos originais</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Suporte especializado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>Frete grátis acima de R$ 200</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelosSeguranca;
