import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { usersApi } from '@/lib/api';
import type { User, AuthResponse } from '@/lib/api';
import type { Mock } from 'vitest';

// Mock the usersApi
vi.mock('@/lib/api', () => ({
  usersApi: {
    authenticate: vi.fn(),
    register: vi.fn(),
    getById: vi.fn(),
  },
}));

const mockUser: User = {
  id: '1',
  tenantId: 'tenant-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  status: 'ACTIVE',
  addresses: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockAuthResponse: AuthResponse = {
  userId: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  token: 'test-token',
};

describe('useAuth', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock = {};
  });

  it('should load auth state from localStorage on mount', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('stored-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle no stored auth on mount', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle invalid stored user data', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = 'invalid-json';

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });
});

describe('useAuth - login', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.clearAllMocks();
  });

  it('should login successfully', async () => {
    (usersApi.authenticate as Mock).mockResolvedValue(mockAuthResponse);
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let returnedUser: User | undefined;
    await act(async () => {
      returnedUser = await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(returnedUser).toEqual(mockUser);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should save credentials to localStorage on login', async () => {
    (usersApi.authenticate as Mock).mockResolvedValue(mockAuthResponse);
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should call API with correct credentials', async () => {
    (usersApi.authenticate as Mock).mockResolvedValue(mockAuthResponse);
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    await act(async () => {
      await result.current.login(credentials);
    });

    expect(usersApi.authenticate).toHaveBeenCalledWith(credentials);
    expect(usersApi.getById).toHaveBeenCalledWith('1');
  });

  it('should handle login error', async () => {
    const mockError = new Error('Authentication failed');
    (usersApi.authenticate as Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.login({
          email: 'test@example.com',
          password: 'wrong-password',
        })
      ).rejects.toThrow('Authentication failed');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should set loading during login', async () => {
    (usersApi.authenticate as Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAuthResponse), 100))
    );
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.loading).toBe(true);
  });
});

describe('useAuth - register', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.clearAllMocks();
  });

  it('should register successfully', async () => {
    (usersApi.register as Mock).mockResolvedValue(mockUser);
    (usersApi.authenticate as Mock).mockResolvedValue(mockAuthResponse);
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should auto-login after registration', async () => {
    (usersApi.register as Mock).mockResolvedValue(mockUser);
    (usersApi.authenticate as Mock).mockResolvedValue(mockAuthResponse);
    (usersApi.getById as Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(usersApi.register).toHaveBeenCalledWith(registerData);
    expect(usersApi.authenticate).toHaveBeenCalledWith({
      email: registerData.email,
      password: registerData.password,
    });
  });

  it('should handle registration error', async () => {
    const mockError = new Error('Registration failed');
    (usersApi.register as Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.register({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Registration failed');
    });

    expect(result.current.loading).toBe(false);
  });
});

describe('useAuth - logout', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.clearAllMocks();
  });

  it('should logout successfully', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should remove credentials from localStorage on logout', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });
});

describe('useAuth - updateUser', () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    vi.clearAllMocks();
  });

  it('should update user data', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const updatedUser = {
      ...mockUser,
      firstName: 'Updated',
      lastName: 'Name',
    };

    act(() => {
      result.current.updateUser(updatedUser);
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it('should save updated user to localStorage', async () => {
    localStorageMock['auth_token'] = 'stored-token';
    localStorageMock['user'] = JSON.stringify(mockUser);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    const updatedUser = {
      ...mockUser,
      firstName: 'Updated',
    };

    act(() => {
      result.current.updateUser(updatedUser);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
  });
});

describe('useAuth - function types', () => {
  it('should provide all required functions', async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.updateUser).toBe('function');
  });
});
