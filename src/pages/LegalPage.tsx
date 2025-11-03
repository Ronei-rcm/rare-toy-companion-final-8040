import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { SEO } from '@/components/SEO';

interface LegalPageData {
  id: number;
  slug: string;
  title: string;
  content: string;
  meta_description: string;
  updated_at: string;
}

const LegalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState<LegalPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Extrair slug do pathname (ex: /privacy -> privacy)
  const slug = location.pathname.replace('/', '');

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(`/api/legal-pages/${slug}`);
        
        if (!response.ok) {
          setError(true);
          return;
        }
        
        const data = await response.json();
        setPage(data);
      } catch (err) {
        console.error('Erro ao carregar página:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !page) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-6 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Página não encontrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                A página que você está procurando não existe ou foi removida.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para a Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title={page.title}
        description={page.meta_description}
      />
      <div className="container max-w-4xl mx-auto px-6 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="prose prose-slate max-w-none">
          <CardContent className="pt-6">
            <div 
              dangerouslySetInnerHTML={{ __html: page.content }}
              className="legal-content"
            />
            
            <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
              Última atualização: {new Date(page.updated_at).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <style>{`
        .legal-content h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: hsl(var(--foreground));
        }
        .legal-content h2 {
          font-size: 1.875rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }
        .legal-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
        }
        .legal-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
          color: hsl(var(--muted-foreground));
        }
        .legal-content ul, .legal-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .legal-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
        }
        .legal-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .legal-content a:hover {
          text-decoration: none;
        }
        .legal-content strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
      `}</style>
    </Layout>
  );
};

export default LegalPage;

