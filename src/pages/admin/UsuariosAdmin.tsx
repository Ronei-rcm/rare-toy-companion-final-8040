import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Key,
  Eye,
  EyeOff,
  Crown,
  User,
  Lock,
  Unlock,
  Calendar,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Interfaces
interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: 'admin' | 'gerente' | 'operador' | 'viewer';
  status: 'ativo' | 'inativo' | 'bloqueado';
  avatar?: string;
  criadoEm: Date;
  ultimoAcesso?: Date;
  permissoes: string[];
}

interface UsuarioForm {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  confirmarSenha: string;
  role: 'admin' | 'gerente' | 'operador' | 'viewer';
  status: 'ativo' | 'inativo';
  permissoes: string[];
}

const UsuariosAdmin = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Seleções
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);
  
  // Form
  const [formData, setFormData] = useState<UsuarioForm>({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    role: 'viewer',
    status: 'ativo',
    permissoes: []
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Permissões disponíveis
  const permissoesDisponiveis = [
    { id: 'produtos', label: 'Gerenciar Produtos' },
    { id: 'pedidos', label: 'Gerenciar Pedidos' },
    { id: 'clientes', label: 'Gerenciar Clientes' },
    { id: 'financeiro', label: 'Visualizar Financeiro' },
    { id: 'relatorios', label: 'Gerar Relatórios' },
    { id: 'configuracoes', label: 'Configurações' },
    { id: 'usuarios', label: 'Gerenciar Usuários' },
    { id: 'colecoes', label: 'Gerenciar Coleções' },
  ];

  // Carregar usuários
  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/usuarios`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.map((u: any) => ({
          ...u,
          criadoEm: new Date(u.created_at),
          ultimoAcesso: u.last_access ? new Date(u.last_access) : undefined,
          permissoes: u.permissoes ? JSON.parse(u.permissoes) : []
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários
  const filteredUsuarios = usuarios.filter(usuario => {
    const matchSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'all' || usuario.role === filterRole;
    const matchStatus = filterStatus === 'all' || usuario.status === filterStatus;
    
    return matchSearch && matchRole && matchStatus;
  });

  // Estatísticas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.status === 'ativo').length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    inativos: usuarios.filter(u => u.status === 'inativo').length,
  };

  // Funções CRUD
  const handleAddUsuario = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      senha: '',
      confirmarSenha: '',
      role: 'viewer',
      status: 'ativo',
      permissoes: []
    });
    setShowAddDialog(true);
  };

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone || '',
      senha: '',
      confirmarSenha: '',
      role: usuario.role,
      status: usuario.status === 'bloqueado' ? 'inativo' : usuario.status,
      permissoes: usuario.permissoes
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    // Validações
    if (!formData.nome || !formData.email) {
      toast.error('Preencha nome e email');
      return;
    }

    if (showAddDialog && (!formData.senha || formData.senha !== formData.confirmarSenha)) {
      toast.error('As senhas não coincidem');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return;
    }

    try {
      const url = showEditDialog && selectedUsuario
        ? `${API_BASE_URL}/admin/usuarios/${selectedUsuario.id}`
        : `${API_BASE_URL}/admin/usuarios`;
      
      const method = showEditDialog ? 'PUT' : 'POST';
      
      const payload = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: formData.role,
        status: formData.status,
        permissoes: JSON.stringify(formData.permissoes),
        ...(formData.senha && { senha: formData.senha })
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(showEditDialog ? 'Usuário atualizado!' : 'Usuário criado!');
        setShowAddDialog(false);
        setShowEditDialog(false);
        loadUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleDeleteUsuario = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!usuarioToDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/usuarios/${usuarioToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Usuário excluído!');
        setShowDeleteDialog(false);
        loadUsuarios();
      } else {
        toast.error('Erro ao excluir usuário');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const togglePermissao = (permissaoId: string) => {
    setFormData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(p => p !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }));
  };

  // Helpers de UI
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { label: 'Admin', class: 'bg-purple-500 text-white' },
      gerente: { label: 'Gerente', class: 'bg-blue-500 text-white' },
      operador: { label: 'Operador', class: 'bg-green-500 text-white' },
      viewer: { label: 'Visualizador', class: 'bg-gray-500 text-white' }
    };
    return badges[role as keyof typeof badges] || badges.viewer;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: { label: 'Ativo', class: 'bg-green-500 text-white' },
      inativo: { label: 'Inativo', class: 'bg-gray-500 text-white' },
      bloqueado: { label: 'Bloqueado', class: 'bg-red-500 text-white' }
    };
    return badges[status as keyof typeof badges] || badges.inativo;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle completo de acessos ao painel administrativo
          </p>
        </div>
        <Button onClick={handleAddUsuario} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <Crown className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inativos}</p>
              </div>
              <UserX className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {filteredUsuarios.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{usuario.nome}</p>
                            {usuario.role === 'admin' && (
                              <Badge variant="outline" className="mt-1">
                                <Crown className="w-3 h-3 mr-1" />
                                Super Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {usuario.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {usuario.telefone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {usuario.telefone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadge(usuario.role).class}>
                          {getRoleBadge(usuario.role).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(usuario.status).class}>
                          {getStatusBadge(usuario.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {format(usuario.criadoEm, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {usuario.ultimoAcesso ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Activity className="w-4 h-4" />
                            {format(usuario.ultimoAcesso, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUsuario(usuario)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteUsuario(usuario)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={() => {
        setShowAddDialog(false);
        setShowEditDialog(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showEditDialog ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showEditDialog ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog
                ? 'Atualize as informações do usuário'
                : 'Preencha os dados para criar um novo usuário'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dados Básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="João Silva"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Senha (apenas ao criar) */}
            {showAddDialog && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Cargo e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Cargo *</Label>
                <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="gerente">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Gerente
                      </div>
                    </SelectItem>
                    <SelectItem value="operador">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Operador
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Visualizador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        Ativo
                      </div>
                    </SelectItem>
                    <SelectItem value="inativo">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Inativo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissões */}
            <div>
              <Label className="mb-3 block">Permissões Específicas</Label>
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {permissoesDisponiveis.map((permissao) => (
                      <div key={permissao.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <Label htmlFor={`perm-${permissao.id}`} className="cursor-pointer">
                          {permissao.label}
                        </Label>
                        <Switch
                          id={`perm-${permissao.id}`}
                          checked={formData.permissoes.includes(permissao.id)}
                          onCheckedChange={() => togglePermissao(permissao.id)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              {showEditDialog ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário{' '}
              <span className="font-semibold text-gray-900">"{usuarioToDelete?.nome}"</span>?
              <br /><br />
              <span className="text-red-600 font-medium">⚠️ Esta ação não pode ser desfeita!</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsuariosAdmin;

