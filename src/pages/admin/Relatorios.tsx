import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportBuilder from '@/components/admin/ReportBuilder';
import ReportTemplates from '@/components/admin/ReportTemplates';
import { 
  FileText, 
  Settings, 
  Download,
  Clock,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Relatorios = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('templates');

  const handleExport = async (config: any) => {
    // Em produção, chamaria a API
    console.log('Exportando relatório:', config);
    
    // Simular exportação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: 'Relatório exportado!',
      description: `Relatório "${config.name}" foi exportado com sucesso`
    });
  };

  const handleSchedule = async (config: any) => {
    // Em produção, chamaria a API
    console.log('Agendando relatório:', config);
    
    toast({
      title: 'Relatório agendado!',
      description: `Relatório será enviado para ${config.schedule?.email}`
    });
  };

  const handleUseTemplate = (template: any) => {
    toast({
      title: 'Template selecionado',
      description: `Template "${template.name}" foi aplicado ao construtor`
    });
    setActiveTab('builder');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">
            Crie, exporte e agende relatórios personalizados do seu negócio
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Construtor
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Agendados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <ReportTemplates onUseTemplate={handleUseTemplate} />
          </TabsContent>

          <TabsContent value="builder">
            <ReportBuilder 
              onExport={handleExport}
              onSchedule={handleSchedule}
            />
          </TabsContent>

          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Relatórios Agendados
                </CardTitle>
                <CardDescription>
                  Relatórios configurados para envio automático
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Nenhum relatório agendado</p>
                  <p className="text-sm">
                    Use o construtor para criar e agendar relatórios automáticos
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Relatorios;

