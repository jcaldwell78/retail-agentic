import { useState, useCallback, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import type { User, AuthRequest, RegisterRequest, AuthResponse, OAuth2LoginRequest } from '@/lib/api';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  exp: number;
}

/**
 * Authentication state
 */
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Authentication hook
 * Manages user authentication state and operations
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
  });

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          loading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        // Invalid user data, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setState({
          user: null,
          token: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    } else {
      setState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials: AuthRequest) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const authResponse: AuthResponse = await usersApi.authenticate(credentials);

      // Get full user data
      const user = await usersApi.getById(authResponse.userId);
      const token = authResponse.token || 'temp-token'; // TODO: Use real JWT token

      // Save to localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        token,
        loading: false,
        isAuthenticated: true,
      });

      return user;
    } catch (error) {
      setState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const user = await usersApi.register(data);

      // Auto-login after registration
      await login({
        email: data.email,
        password: data.password,
      });

      return user;
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
  }, [login]);

  /**
   * OAuth2 login (Google, Facebook)
   */
  const oauth2Login = useCallback(async (request: OAuth2LoginRequest) => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await usersApi.oauth2Login(request);
      const token = response.token;

      // Decode JWT to get user info
      const decoded = jwtDecode<JwtPayload>(token);

      // Save token
      localStorage.setItem('auth_token', token);

      // Fetch full user data
      const user = await usersApi.getById(decoded.userId);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        token,
        loading: false,
        isAuthenticated: true,
      });

      return user;
    } catch (error) {
      setState({
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
    });
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState((prev) => ({ ...prev, user }));
  }, []);

  return {
    ...state,
    login,
    register,
    oauth2Login,
    logout,
    updateUser,
  };
}
