import { api } from './client';
import type {
  User,
  RegisterRequest,
  AuthRequest,
  AuthResponse,
  ChangePasswordRequest,
  Address,
  OAuth2LoginRequest,
  OAuth2LoginResponse,
} from './types';

const BASE_PATH = '/api/v1/users';

/**
 * User API service
 */
export const usersApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<User> => {
    return api.post<User>(`${BASE_PATH}/register`, data);
  },

  /**
   * Authenticate user (login)
   */
  authenticate: async (data: AuthRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>(`${BASE_PATH}/authenticate`, data);
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    return api.get<User>(`${BASE_PATH}/${id}`);
  },

  /**
   * Get user by email
   */
  getByEmail: async (email: string): Promise<User> => {
    return api.get<User>(`${BASE_PATH}/email/${email}`);
  },

  /**
   * Get all users (paginated)
   */
  getAll: async (page = 0, size = 20): Promise<User[]> => {
    return api.get<User[]>(`${BASE_PATH}`, {
      params: { page, size },
    });
  },

  /**
   * Update user profile
   */
  updateProfile: async (id: string, data: Partial<User>): Promise<User> => {
    return api.put<User>(`${BASE_PATH}/${id}`, data);
  },

  /**
   * Change password
   */
  changePassword: async (
    id: string,
    data: ChangePasswordRequest
  ): Promise<void> => {
    return api.put<void>(`${BASE_PATH}/${id}/password`, data);
  },

  /**
   * Add address to user profile
   */
  addAddress: async (id: string, address: Address): Promise<User> => {
    return api.post<User>(`${BASE_PATH}/${id}/addresses`, address);
  },

  /**
   * Delete user
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`${BASE_PATH}/${id}`);
  },

  /**
   * Check if email exists
   */
  emailExists: async (email: string): Promise<boolean> => {
    return api.get<boolean>(`${BASE_PATH}/email/${email}/exists`);
  },

  /**
   * OAuth2 login (Google, Facebook)
   */
  oauth2Login: async (data: OAuth2LoginRequest): Promise<OAuth2LoginResponse> => {
    return api.post<OAuth2LoginResponse>('/api/v1/auth/oauth2/login', data);
  },
};
