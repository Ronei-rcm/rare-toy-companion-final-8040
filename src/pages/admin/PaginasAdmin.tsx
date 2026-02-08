import React, { useState, useEffect } from 'react';
import { request } from '@/services/api-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  RefreshCw,
  Eye,
  FileText,
  Plus,
  Trash2,
  Edit,
  Search,
  Copy,
  Code,
  Layout,
  FileCode,
  Sparkles,
  Undo,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface LegalPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const PaginasAdmin = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('editor');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    meta_description: '',
    is_published: true
  });
  const [history, setHistory] = useState<string[]>([]);

  // Templates prontos
  const templates = {
    privacidade: `<h1>Política de Privacidade</h1>

<p>Na MuhlStore, sua privacidade é nossa prioridade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.</p>

<h2>1. Informações que Coletamos</h2>
<p>Coletamos as seguintes informações quando você utiliza nosso site:</p>
<ul>
  <li>Nome completo</li>
  <li>Endereço de e-mail</li>
  <li>Número de telefone</li>
  <li>Endereço de entrega</li>
  <li>Informações de pagamento (processadas de forma segura)</li>
</ul>

<h2>2. Como Usamos Suas Informações</h2>
<p>Utilizamos suas informações para:</p>
<ul>
  <li>Processar e entregar seus pedidos</li>
  <li>Enviar atualizações sobre seu pedido</li>
  <li>Melhorar nossos serviços e experiência do usuário</li>
  <li>Enviar comunicações de marketing (com seu consentimento)</li>
</ul>

<h2>3. Compartilhamento de Dados</h2>
<p>Não vendemos suas informações pessoais. Compartilhamos dados apenas com:</p>
<ul>
  <li>Prestadores de serviços de pagamento</li>
  <li>Empresas de logística para entrega</li>
  <li>Autoridades legais, quando exigido por lei</li>
</ul>

<h2>4. Seus Direitos (LGPD)</h2>
<p>Você tem direito a:</p>
<ul>
  <li>Acessar seus dados pessoais</li>
  <li>Corrigir informações incorretas</li>
  <li>Solicitar exclusão de dados</li>
  <li>Revogar consentimentos</li>
  <li>Portabilidade de dados</li>
</ul>

<h2>5. Segurança</h2>
<p>Implementamos medidas de segurança para proteger suas informações, incluindo criptografia SSL, firewalls e acesso restrito.</p>

<h2>6. Cookies</h2>
<p>Utilizamos cookies para melhorar sua experiência. Você pode gerenciar cookies nas configurações do seu navegador.</p>

<h2>7. Contato</h2>
<p>Para exercer seus direitos ou esclarecer dúvidas:</p>
<p><strong>E-mail:</strong> privacidade@muhlstore.com.br</p>
<p><strong>Telefone:</strong> (51) 99999-9999</p>

<p className="mt-8 text-sm"><strong>Última atualização:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>`,

    termos: `<h1>Termos de Serviço</h1>

<p>Bem-vindo à MuhlStore. Ao utilizar nossos serviços, você concorda com estes termos.</p>

<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar e usar este site, você aceita estar vinculado a estes Termos de Serviço e todas as leis aplicáveis.</p>

<h2>2. Uso do Serviço</h2>
<p>Você concorda em usar nosso site apenas para fins legais e de maneira que não:</p>
<ul>
  <li>Viole direitos de terceiros</li>
  <li>Seja fraudulenta ou maliciosa</li>
  <li>Infrinja propriedade intelectual</li>
</ul>

<h2>3. Conta de Usuário</h2>
<p>Você é responsável por:</p>
<ul>
  <li>Manter sua senha segura</li>
  <li>Fornecer informações precisas</li>
  <li>Notificar sobre uso não autorizado</li>
</ul>

<h2>4. Pedidos e Pagamentos</h2>
<p>Todos os pedidos estão sujeitos a:</p>
<ul>
  <li>Disponibilidade de estoque</li>
  <li>Confirmação de pagamento</li>
  <li>Verificação de dados</li>
</ul>

<h2>5. Entrega</h2>
<p>Prazos de entrega são estimativas. Não nos responsabilizamos por atrasos de terceiros.</p>

<h2>6. Trocas e Devoluções</h2>
<p>Você tem 7 dias para solicitar troca ou devolução, conforme Código de Defesa do Consumidor.</p>

<h2>7. Propriedade Intelectual</h2>
<p>Todo conteúdo do site (textos, imagens, logos) é protegido por direitos autorais e não pode ser reproduzido sem permissão.</p>

<h2>8. Limitação de Responsabilidade</h2>
<p>Não nos responsabilizamos por danos indiretos, incidentais ou consequentes.</p>

<h2>9. Modificações</h2>
<p>Reservamos o direito de modificar estes termos a qualquer momento. Alterações entram em vigor imediatamente após publicação.</p>

<h2>10. Lei Aplicável</h2>
<p>Estes termos são regidos pelas leis brasileiras. Foro: Comarca de Porto Alegre/RS.</p>`,

    faq: `<h1>Perguntas Frequentes (FAQ)</h1>

<p>Encontre respostas rápidas para as dúvidas mais comuns sobre a MuhlStore.</p>

<h2>📦 Pedidos e Entregas</h2>

<h3>Como faço um pedido?</h3>
<p>Navegue pelo catálogo, adicione produtos ao carrinho e finalize a compra. Aceitamos pagamento via PIX, cartão de crédito e boleto.</p>

<h3>Qual o prazo de entrega?</h3>
<p>O prazo varia conforme sua localização:</p>
<ul>
  <li>Região Sul: 3-7 dias úteis</li>
  <li>Região Sudeste: 5-10 dias úteis</li>
  <li>Demais regiões: 7-15 dias úteis</li>
</ul>

<h3>Como rastreio meu pedido?</h3>
<p>Acesse "Minha Conta" → "Meus Pedidos" e clique em "Rastrear". Você também receberá o código por e-mail.</p>

<h2>💳 Pagamentos</h2>

<h3>Quais formas de pagamento aceitam?</h3>
<ul>
  <li>PIX (aprovação instantânea)</li>
  <li>Cartão de crédito (até 12x)</li>
  <li>Boleto bancário (1-2 dias para compensar)</li>
</ul>

<h3>Meu pagamento foi recusado, o que fazer?</h3>
<p>Verifique os dados do cartão, limite disponível e tente novamente. Se persistir, entre em contato com seu banco.</p>

<h2>🔄 Trocas e Devoluções</h2>

<h3>Posso trocar ou devolver?</h3>
<p>Sim! Você tem 7 dias corridos após receber o produto para solicitar troca ou devolução, conforme CDC.</p>

<h3>Como solicitar troca?</h3>
<p>Acesse "Minha Conta" → "Meus Pedidos" → "Solicitar Troca" ou entre em contato pelo WhatsApp.</p>

<h3>Quem paga o frete da devolução?</h3>
<p>Se o produto tiver defeito: nós pagamos. Se for arrependimento: cliente paga.</p>

<h2>🛡️ Segurança</h2>

<h3>Meus dados estão seguros?</h3>
<p>Sim! Usamos criptografia SSL e não armazenamos dados de cartão. Confira nossa <a href="/privacy">Política de Privacidade</a>.</p>

<h2>📞 Suporte</h2>

<h3>Como entro em contato?</h3>
<ul>
  <li>WhatsApp: (51) 99999-9999</li>
  <li>E-mail: suporte@muhlstore.com.br</li>
  <li>Horário: Seg-Sex 9h-18h, Sáb 9h-13h</li>
</ul>`
  };

  const htmlBlocks = {
    titulo: '<h2>Novo Título</h2>',
    paragrafo: '<p>Seu texto aqui.</p>',
    lista: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>',
    destaque: '<div class="bg-blue-50 p-4 rounded border-l-4 border-blue-500">\n  <strong>Importante:</strong> Informação em destaque.\n</div>',
    link: '<a href="https://exemplo.com" class="text-primary hover:underline">Texto do Link</a>',
    divisor: '<hr class="my-6 border-t">',
    citacao: '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600">\n  "Citação ou texto importante"\n</blockquote>',
    tabela: '<table class="w-full border-collapse">\n  <thead>\n    <tr class="bg-gray-100">\n      <th class="border p-2">Coluna 1</th>\n      <th class="border p-2">Coluna 2</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td class="border p-2">Dado 1</td>\n      <td class="border p-2">Dado 2</td>\n    </tr>\n  </tbody>\n</table>'
  };

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      setFormData({
        title: selectedPage.title,
        content: selectedPage.content,
        meta_description: selectedPage.meta_description || '',
        is_published: selectedPage.is_published
      });
      // Salvar no histórico
      setHistory([selectedPage.content]);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await request<LegalPage[]>('/admin/legal-pages');
      if (data) {
        setPages(data);
        if (!selectedPage && data.length > 0) {
          setSelectedPage(data[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar páginas:', error);
      toast.error('Erro ao carregar páginas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPage) return;

    try {
      setLoading(true);
      await request(`/admin/legal-pages/${selectedPage.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      toast.success('✅ Página salva com sucesso!');
      loadPages();
    } catch (error: any) {
      toast.error(error.message || '❌ Erro ao salvar página');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setActiveTab('preview');
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(formData.content);
    toast.success('📋 HTML copiado!');
  };

  const handleInsertBlock = (blockHtml: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + blockHtml
    }));
    toast.success('✅ Bloco inserido!');
  };

  const handleApplyTemplate = (templateName: keyof typeof templates) => {
    if (confirm('Isso substituirá todo o conteúdo atual. Continuar?')) {
      setFormData(prev => ({
        ...prev,
        content: templates[templateName]
      }));
      toast.success('✅ Template aplicado!');
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousContent = newHistory[newHistory.length - 1];
      setFormData(prev => ({ ...prev, content: previousContent }));
      setHistory(newHistory);
      toast.success('↩️ Desfeito!');
    }
  };

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && pages.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Gerenciar Páginas
          </h1>
          <p className="text-muted-foreground mt-2">
            Editor avançado com templates, preview e blocos HTML reutilizáveis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {pages.filter(p => p.is_published).length} Publicadas
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {pages.filter(p => !p.is_published).length} Rascunhos
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Lista de Páginas */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Páginas</CardTitle>
            <CardDescription>Selecione para editar</CardDescription>

            {/* Busca */}
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredPages.map(page => (
              <button
                key={page.id}
                onClick={() => setSelectedPage(page)}
                className={`w-full text-left p-3 rounded-lg transition-all ${selectedPage?.id === page.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted hover:bg-muted/80'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{page.title}</span>
                  {page.is_published ? (
                    <Badge variant="outline" className="text-xs">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Rascunho</Badge>
                  )}
                </div>
                <span className="text-xs opacity-75">/{page.slug}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Editor Principal */}
        <Card className="lg:col-span-3">
          {selectedPage ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedPage.title}
                      {formData.is_published && (
                        <Badge variant="default" className="text-xs">Publicado</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>/{selectedPage.slug}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {history.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndo}
                        title="Desfazer (Ctrl+Z)"
                      >
                        <Undo className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyHTML}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar HTML
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="editor">
                      <Code className="w-4 h-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                      <Layout className="w-4 h-4 mr-2" />
                      Templates
                    </TabsTrigger>
                    <TabsTrigger value="blocos">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Blocos
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB: Editor */}
                  <TabsContent value="editor" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título da Página</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Política de Privacidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta">Meta Descrição (SEO)</Label>
                      <Input
                        id="meta"
                        value={formData.meta_description}
                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                        placeholder="Descrição para mecanismos de busca"
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Ideal: 120-160 caracteres
                        </span>
                        <span className={formData.meta_description.length > 160 ? 'text-red-500' : 'text-muted-foreground'}>
                          {formData.meta_description.length}/160
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Conteúdo (HTML)</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => {
                          setFormData({ ...formData, content: e.target.value });
                          setHistory(prev => [...prev, e.target.value]);
                        }}
                        rows={25}
                        className="font-mono text-sm bg-gray-50"
                        placeholder="Cole ou escreva o HTML aqui..."
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Linhas: {formData.content.split('\n').length} |
                          Caracteres: {formData.content.length}
                        </span>
                        <span>
                          Ctrl+Z para desfazer
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <Switch
                        id="published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                      <Label htmlFor="published" className="cursor-pointer">
                        Página publicada (visível no site)
                      </Label>
                    </div>

                    <Separator />

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>📅 Criado em: {new Date(selectedPage.created_at).toLocaleString('pt-BR')}</p>
                      <p>🔄 Última atualização: {new Date(selectedPage.updated_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </TabsContent>

                  {/* TAB: Preview */}
                  <TabsContent value="preview" className="space-y-4">
                    <div className="bg-white p-6 rounded-lg border min-h-[600px]">
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.content }}
                        className="prose prose-slate max-w-none legal-content"
                      />
                    </div>

                    <style>{`
                      .legal-content h1 {
                        font-size: 2.25rem;
                        font-weight: 700;
                        margin-bottom: 1.5rem;
                        color: #1a202c;
                      }
                      .legal-content h2 {
                        font-size: 1.875rem;
                        font-weight: 600;
                        margin-top: 2rem;
                        margin-bottom: 1rem;
                        color: #2d3748;
                      }
                      .legal-content h3 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-top: 1.5rem;
                        margin-bottom: 0.75rem;
                        color: #4a5568;
                      }
                      .legal-content p {
                        margin-bottom: 1rem;
                        line-height: 1.75;
                        color: #4a5568;
                      }
                      .legal-content ul, .legal-content ol {
                        margin-bottom: 1rem;
                        padding-left: 1.5rem;
                      }
                      .legal-content li {
                        margin-bottom: 0.5rem;
                      }
                      .legal-content a {
                        color: #3182ce;
                        text-decoration: underline;
                      }
                      .legal-content strong {
                        font-weight: 600;
                        color: #1a202c;
                      }
                    `}</style>
                  </TabsContent>

                  {/* TAB: Templates */}
                  <TabsContent value="templates" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Escolha um template pronto para começar rapidamente
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleApplyTemplate('privacidade')}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-blue-500" />
                            Privacidade
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Template completo de Política de Privacidade com LGPD
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleApplyTemplate('termos')}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-green-500" />
                            Termos
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Termos de Serviço completos para e-commerce
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleApplyTemplate('faq')}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-purple-500" />
                            FAQ
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Perguntas Frequentes organizadas por categoria
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* TAB: Blocos */}
                  <TabsContent value="blocos" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Clique em um bloco para inseri-lo no final do conteúdo
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(htmlBlocks).map(([key, value]) => (
                        <Button
                          key={key}
                          variant="outline"
                          className="h-auto flex-col items-start p-3 text-left"
                          onClick={() => handleInsertBlock(value)}
                        >
                          <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                          <code className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {value.substring(0, 30)}...
                          </code>
                        </Button>
                      ))}
                    </div>

                    <Separator />

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">💡 Dica</h3>
                      <p className="text-sm text-blue-800">
                        Você pode combinar blocos para criar layouts complexos.
                        Todos os blocos usam classes Tailwind CSS para estilização.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Selecione uma página para editar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaginasAdmin;
