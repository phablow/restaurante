import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onShowUserManagement?: () => void;
}

export const Header = ({ onShowUserManagement }: HeaderProps) => {
  const { session, logout, isAdmin } = useAuth();

  if (!session) return null;

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">GF</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Gestão Financeira</h1>
            <p className="text-xs text-muted-foreground">Sistema de Controle</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="text-right">
              <p className="text-sm font-medium">{session.user.name}</p>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? 'Admin' : 'Usuário'}
              </Badge>
            </div>
          </div>

          {isAdmin && onShowUserManagement && (
            <Button variant="outline" size="sm" onClick={onShowUserManagement}>
              <Users className="mr-2 h-4 w-4" />
              Usuários
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
};
