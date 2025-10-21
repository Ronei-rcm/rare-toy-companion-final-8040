
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserMinus,
  MessageCircle,
  Phone,
  Crown,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface Membro {
  id: string;
  nome: string;
  telefone: string;
  avatar?: string;
  role: 'admin' | 'moderador' | 'membro';
  status: 'ativo' | 'inativo' | 'banido';
  dataEntrada: string;
  ultimaAtividade: string;
  totalCompras: number;
  valorTotal: number;
}

const membrosExemplo: Membro[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '+55 11 99999-9999',
    role: 'admin',
    status: 'ativo',
    dataEntrada: '2024-01-15',
    ultimaAtividade: '2 min atrás',
    totalCompras: 5,
    valorTotal: 850.00
  },
  {
    id: '2',
    nome: 'Maria Santos',
    telefone: '+55 11 88888-8888',
    role: 'membro',
    status: 'ativo',
    dataEntrada: '2024-02-20',
    ultimaAtividade: '1 hora atrás',
    totalCompras: 3,
    valorTotal: 450.00
  },
  {
    id: '3',
    nome: 'Pedro Costa',
    telefone: '+55 11 77777-7777',
    role: 'moderador',
    status: 'ativo',
    dataEntrada: '2024-01-30',
    ultimaAtividade: '30 min atrás',
    totalCompras: 7,
    valorTotal: 1200.00
  }
];

interface GrupoMembersProps {
  grupoId: string;
  grupoNome: string;
}

const GrupoMembers = ({ grupoId, grupoNome }: GrupoMembersProps) => {
  const [membros, setMembros] = useState<Membro[]>(membrosExemplo);
  const [searchTerm, setSearchTerm] = useState('');
  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    telefone: ''
  });

  const handleAdicionarMembro = () => {
    if (!novoMembro.nome || !novoMembro.telefone) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    const novoMembroObj: Membro = {
      id: Date.now().toString(),
      nome: novoMembro.nome,
      telefone: novoMembro.telefone,
      role: 'membro',
      status: 'ativo',
      dataEntrada: new Date().toISOString().split('T')[0],
      ultimaAtividade: 'Recém adicionado',
      totalCompras: 0,
      valorTotal: 0
    };

    setMembros([...membros, novoMembroObj]);
    setNovoMembro({ nome: '', telefone: '' });
    toast.success('Membro adicionado com sucesso!');
  };

  const handleRemoverMembro = (membroId: string) => {
    setMembros(membros.filter(m => m.id !== membroId));
    toast.success('Membro removido do grupo');
  };

  const handlePromoverMembro = (membroId: string) => {
    setMembros(membros.map(m => 
      m.id === membroId 
        ? { ...m, role: m.role === 'membro' ? 'moderador' : 'admin' }
        : m
    ));
    toast.success('Membro promovido com sucesso!');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderador':
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'default',
      moderador: 'secondary',
      membro: 'outline'
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: 'default',
      inativo: 'secondary',
      banido: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const membrosFiltrados = membros.filter(membro =>
    membro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membro.telefone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Membros do Grupo</h2>
          <p className="text-muted-foreground">{grupoNome} - {membros.length} membros</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
              <DialogDescription>
                Adicione um novo membro ao grupo {grupoNome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Nome do membro"
                  value={novoMembro.nome}
                  onChange={(e) => setNovoMembro({...novoMembro, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  placeholder="+55 11 99999-9999"
                  value={novoMembro.telefone}
                  onChange={(e) => setNovoMembro({...novoMembro, telefone: e.target.value})}
                />
              </div>
              <Button onClick={handleAdicionarMembro} className="w-full">
                Adicionar Membro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membros..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline">
            Total: {membros.length}
          </Badge>
          <Badge variant="outline">
            Ativos: {membros.filter(m => m.status === 'ativo').length}
          </Badge>
        </div>
      </div>

      {/* Tabela de membros */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Compras</TableHead>
              <TableHead>Última Atividade</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membrosFiltrados.map(membro => (
              <TableRow key={membro.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={membro.avatar} />
                      <AvatarFallback>
                        {membro.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{membro.nome}</div>
                      <div className="text-sm text-muted-foreground">
                        Membro desde {new Date(membro.dataEntrada).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {membro.telefone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(membro.role)}
                    {getRoleBadge(membro.role)}
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(membro.status)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{membro.totalCompras} pedidos</div>
                    <div className="text-sm text-muted-foreground">
                      R$ {membro.valorTotal.toFixed(2)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{membro.ultimaAtividade}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar mensagem
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePromoverMembro(membro.id)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Promover
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRemoverMembro(membro.id)}
                        className="text-red-600"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GrupoMembers;
