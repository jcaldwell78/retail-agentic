import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { User, AuthRequest, RegisterRequest, OAuth2LoginRequest } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AuthRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<User>;
  oauth2Login: (request: OAuth2LoginRequest) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication context provider
 * Wraps the app to provide authentication state and methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 * Must be used within AuthProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

export default AuthProvider;
