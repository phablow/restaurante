import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthSession, UserRole } from '@/types/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  users: Omit<User, 'password'>[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<Omit<User, 'id' | 'password'>>) => void;
  deleteUser: (id: string) => void;
  changePassword: (userId: string, newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar sessão e buscar usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setSession(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar perfil e roles do usuário
  const loadUserProfile = async (userId: string) => {
    try {
      // Buscar usuário autenticado para pegar email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Se não encontrar perfil, criar automaticamente
      if (profileError || !profile) {
        if (authUser) {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            profile = newProfile;
          }
        }
      }

      if (profile) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        const userRole = roles?.find(r => r.role === 'admin') ? 'admin' : 'user';
        
        const authSession: AuthSession = {
          user: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: userRole as UserRole,
            createdAt: profile.created_at,
            active: true,
          },
          token: userId,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        };

        setSession(authSession);
      } else {
        console.error('Não foi possível carregar ou criar o perfil do usuário');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar lista de usuários (apenas admin)
  useEffect(() => {
    if (session?.user.role === 'admin') {
      loadUsers();
    }
  }, [session]);

  const loadUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            const { data: roles } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id);

            const userRole = roles?.find(r => r.role === 'admin') ? 'admin' : 'user';

            return {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: userRole as UserRole,
              createdAt: profile.created_at,
              active: true,
            };
          })
        );

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Email ou senha incorretos');
        return false;
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        toast.success(`Bem-vindo(a)!`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao fazer login');
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    toast.info('Sessão encerrada');
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem adicionar usuários');
      return;
    }

    try {
      // Usar sign up em vez de admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      });

      if (authError || !authData.user) {
        console.error('Erro ao criar usuário:', authError);
        toast.error('Erro ao criar usuário: ' + (authError?.message || 'Desconhecido'));
        return;
      }

      // Criar perfil (pode já estar criado pelo trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        toast.error('Erro ao criar perfil');
        return;
      }

      // Criar role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: userData.role,
        });

      if (roleError) {
        console.error('Erro ao definir permissões:', roleError);
        toast.error('Erro ao definir permissões');
        return;
      }

      await loadUsers();
      toast.success('Usuário criado com sucesso! Verifique o email para confirmar.');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
    }
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id' | 'password'>>) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem editar usuários');
      return;
    }

    try {
      // Atualizar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
        })
        .eq('id', id);

      if (profileError) {
        toast.error('Erro ao atualizar perfil');
        return;
      }

      // Atualizar role se necessário
      if (updates.role) {
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', id);

        await supabase
          .from('user_roles')
          .insert({
            user_id: id,
            role: updates.role,
          });
      }

      await loadUsers();
      toast.success('Usuário atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem deletar usuários');
      return;
    }

    if (id === session.user.id) {
      toast.error('Você não pode deletar sua própria conta');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar usuário');
        return;
      }

      await loadUsers();
      toast.success('Usuário deletado!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
    }
  };

  const changePassword = async (userId: string, newPassword: string) => {
    if (!session?.user || session.user.role !== 'admin') {
      toast.error('Apenas administradores podem alterar senhas');
      return;
    }

    try {
      // Como não temos acesso admin, vamos criar uma nota para o usuário resetar
      toast.info('Recurso disponível apenas com acesso admin do Supabase');
      toast.info('O usuário pode resetar sua senha no login');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAdmin: session?.user.role === 'admin',
        users,
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
