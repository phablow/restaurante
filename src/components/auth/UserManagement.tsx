import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Edit, Trash2, Key } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { toast } from 'sonner';

export const UserManagement = () => {
  const { users, addUser, updateUser, deleteUser, changePassword } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as UserRole,
    active: true,
  });

  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'user' as UserRole,
    active: true,
  });

  const [newPassword, setNewPassword] = useState('');

  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      toast.error('Preencha todos os campos');
      return;
    }

    addUser(newUser);
    setNewUser({ email: '', password: '', name: '', role: 'user', active: true });
    setIsAddDialogOpen(false);
  };

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditUser({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
      });
      setSelectedUserId(userId);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (!editUser.name || !editUser.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    updateUser(selectedUserId, editUser);
    setIsEditDialogOpen(false);
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    changePassword(selectedUserId, newPassword);
    setNewPassword('');
    setIsPasswordDialogOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      deleteUser(userId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciamento de Usuários</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="usuario@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Ativo</Label>
                  <Switch
                    checked={newUser.active}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                  />
                </div>

                <Button onClick={handleAddUser} className="w-full">
                  Adicionar Usuário
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? 'default' : 'destructive'}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(user.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setIsPasswordDialogOpen(true);
                      }}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(v) => setEditUser({ ...editUser, role: v as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch
                  checked={editUser.active}
                  onCheckedChange={(checked) => setEditUser({ ...editUser, active: checked })}
                />
              </div>

              <Button onClick={handleSaveEdit} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Senha */}
        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Senha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <Button onClick={handleChangePassword} className="w-full">
                Alterar Senha
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
