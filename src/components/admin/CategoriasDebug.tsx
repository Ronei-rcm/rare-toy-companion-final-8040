import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  icon: string;
  cor: string;
  ativo: boolean;
}

export function CategoriasDebug() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string>('');
  const [editNome, setEditNome] = useState<string>('');
  const [editDescricao, setEditDescricao] = useState<string>('');

  // Debug: Log quando editId muda
  React.useEffect(() => {
    console.log('🔄 editId mudou para:', editId);
  }, [editId]);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando categorias...');
      
      const response = await fetch('/api/categorias/gerenciaveis', {
        credentials: 'include'
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erro na resposta:', error);
        throw new Error(error.error || 'Erro ao buscar categorias');
      }

      const data = await response.json();
      console.log('✅ Dados recebidos:', data);
      setCategorias(data);
      toast.success(`✅ ${data.length} categorias carregadas!`);
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('❌ Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const editarCategoria = async () => {
    if (!editId || !editNome) {
      toast.error('ID e nome são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Editando categoria ID:', editId);
      console.log('🔄 Dados:', { nome: editNome, descricao: editDescricao });
      
      const response = await fetch(`/api/categorias/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nome: editNome,
          descricao: editDescricao
        })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erro na resposta:', error);
        throw new Error(error.error || 'Erro ao editar categoria');
      }

      const data = await response.json();
      console.log('✅ Categoria editada:', data);
      toast.success('✅ Categoria editada com sucesso!');
      
      // Recarregar lista
      carregarCategorias();
      
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('❌ Erro ao editar categoria');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      setLoading(true);
      console.log('🔄 Toggle status categoria ID:', id);
      
      const response = await fetch(`/api/categorias/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao alterar status');
      }

      const data = await response.json();
      console.log('✅ Status alterado:', data);
      toast.success('✅ Status alterado!');
      
      // Recarregar lista
      carregarCategorias();
      
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('❌ Erro ao alterar status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Debug Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={carregarCategorias} disabled={loading}>
            {loading ? 'Carregando...' : 'Carregar Categorias'}
          </Button>

          {categorias.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Categorias Carregadas:</h3>
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-4 p-3 border rounded">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{cat.nome}</p>
                    <p className="text-sm text-gray-600">{cat.descricao}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        console.log('🖱️ Botão Editar clicado para categoria:', cat.id, cat.nome);
                        setEditId(cat.id.toString());
                        setEditNome(cat.nome);
                        setEditDescricao(cat.descricao);
                        console.log('✅ Estados atualizados - editId:', cat.id.toString());
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStatus(cat.id)}
                    >
                      {cat.ativo ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editId && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Editar Categoria ID: {editId}</h3>
              <p className="text-sm text-gray-500">Debug: editId = "{editId}", editNome = "{editNome}"</p>
              <div className="flex gap-2">
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-1"
                />
                <Input
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Descrição"
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    console.log('🖱️ Botão Salvar clicado');
                    console.log('📝 Dados atuais:', { editId, editNome, editDescricao });
                    editarCategoria();
                  }} 
                  disabled={loading}
                >
                  Salvar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditId('');
                    setEditNome('');
                    setEditDescricao('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
