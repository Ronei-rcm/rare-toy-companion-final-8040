import React, { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers';
import { User, CreateUserData } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, User as UserIcon, Mail, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const UsersManager = () => {
  const { data: users, isLoading: loading, error } = useUsers();
  const { mutate: createUser } = useCreateUser();
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<CreateUserData>({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
  });

  const handleCreateUser = async () => {
    if (!formData.nome || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    createUser(formData, {
      onSuccess: () => {
        toast({
          title: "Usuário criado!",
          description: `${formData.nome} foi adicionado com sucesso.`,
        });
        setIsCreateDialogOpen(false);
        resetForm();
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao criar usuário",
          description: error.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    if (!formData.nome || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    updateUser({ id: editingUser.id, ...formData }, {
      onSuccess: () => {
        toast({
          title: "Usuário atualizado!",
          description: `${formData.nome} foi atualizado com sucesso.`,
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        resetForm();
      },
      onError: (error: any) => {
        toast({
          title: "Erro ao atualizar usuário",
          description: error.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
      },
    });
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Tem certeza que deseja deletar o usuário "${user.nome}"?`)) {
      deleteUser(user.id, {
        onSuccess: () => {
          toast({
            title: "Usuário deletado!",
            description: `${user.nome} foi removido com sucesso.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Erro ao deletar usuário",
            description: error.message || "Tente novamente mais tarde.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || '',
      endereco: user.endereco || '',
      cidade: user.cidade || '',
      estado: user.estado || '',
      cep: user.cep || '',
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
    });
  };

  // Filtrar usuários por termo de busca
  const filteredUsers = users?.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.cidade && user.cidade.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando usuários...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Erro ao carregar usuários: {error.message}
      </div>
    );
  }

  const UserForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome completo do usuário"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
          />
        </div>
        <div>
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            value={formData.cep}
            onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Textarea
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
          placeholder="Rua, número, bairro"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cidade">Cidade</Label>
          <Input
            id="cidade"
            value={formData.cidade}
            onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
            placeholder="Nome da cidade"
          />
        </div>
        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select
            value={formData.estado}
            onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map(estado => (
                <SelectItem key={estado} value={estado}>{estado}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" onClick={isEdit ? handleUpdateUser : handleCreateUser} className="w-full">
        {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para adicionar um novo usuário.
              </DialogDescription>
            </DialogHeader>
            <UserForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Input
          placeholder="Buscar usuários por nome, email ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
              {/* Avatar */}
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-primary/10">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{user.nome}</h3>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                      </div>
                      {user.telefone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-4 h-4 mr-2" />
                          {user.telefone}
                        </div>
                      )}
                      {(user.cidade || user.estado) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2" />
                          {[user.cidade, user.estado].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-1" />
                        Cadastrado em {format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        ID: {user.id.slice(0, 8)}...
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? `Não encontramos usuários para "${searchTerm}".`
              : 'Comece adicionando seu primeiro usuário.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Usuário
            </Button>
          )}
        </div>
      )}

      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Edite as informações do usuário.
              </DialogDescription>
            </DialogHeader>
            <UserForm isEdit={true} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
