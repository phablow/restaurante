import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthSession, UserRole } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  session: AuthSession | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  users: Omit<User, 'password'>[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id' | 'password'>>) => void;
  deleteUser: (id: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuário admin padrão
const INITIAL_ADMIN: User = {
  id: 'admin-001',
  email: 'admin@admin.com',
  password: 'admin123',
  name: 'Administrador',
  role: 'admin',
  createdAt: new Date().toISOString(),
  active: true,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Verificar se não expirou
      if (new Date(parsed.expiresAt) > new Date()) {
        return parsed;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('users');
    if (stored) {
      return JSON.parse(stored);
    }
    return [INITIAL_ADMIN];
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem('auth_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('auth_session');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password && u.active);
    
    if (!user) {
      toast.error('Email ou senha incorretos');
      return false;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8); // 8 horas de sessão

    const newSession: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        active: user.active,
      },
      token: crypto.randomUUID(),
      expiresAt: expiresAt.toISOString(),
    };

    setSession(newSession);
    toast.success(`Bem-vindo(a), ${user.name}!`);
    return true;
  };

  const logout = () => {
    setSession(null);
    toast.info('Sessão encerrada');
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem adicionar usuários');
      return;
    }

    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      toast.error('Email já cadastrado');
      return;
    }

    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);
    toast.success('Usuário criado com sucesso!');
  };

  const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'password'>>) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem editar usuários');
      return;
    }

    setUsers(prev =>
      prev.map(user => {
        if (user.id === id) {
          const updated = { ...user, ...updates };
          
          // Se estamos atualizando o próprio usuário logado, atualizar sessão
          if (session.user.id === id) {
            setSession({
              ...session,
              user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
                createdAt: updated.createdAt,
                active: updated.active,
              },
            });
          }
          
          return updated;
        }
        return user;
      })
    );
    
    toast.success('Usuário atualizado!');
  };

  const deleteUser = (id: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem deletar usuários');
      return;
    }

    if (id === session.user.id) {
      toast.error('Você não pode deletar sua própria conta');
      return;
    }

    setUsers(prev => prev.filter(user => user.id !== id));
    toast.success('Usuário deletado!');
  };

  const changePassword = (userId: string, newPassword: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem alterar senhas');
      return;
    }

    setUsers(prev =>
      prev.map(user => (user.id === userId ? { ...user, password: newPassword } : user))
    );
    
    toast.success('Senha alterada com sucesso!');
  };

  const usersWithoutPassword = users.map(({ password, ...user }) => user);

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAdmin: session?.user.role === 'admin',
        users: usersWithoutPassword,
        addUser,
        updateUser,
        deleteUser,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
