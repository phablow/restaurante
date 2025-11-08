export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: string;
  active: boolean;
}

export interface AuthSession {
  user: Omit<User, 'password'>;
  token: string;
  expiresAt: string;
}
