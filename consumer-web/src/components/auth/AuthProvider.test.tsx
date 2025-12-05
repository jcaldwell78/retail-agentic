import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './AuthProvider';
import type { User } from '@/lib/api';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
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

const mockAuthValue = {
  user: mockUser,
  token: 'test-token',
  loading: false,
  isAuthenticated: true,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
};

describe('AuthProvider', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuthValue);
  });

  it('should render children', () => {
    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should provide auth context to children', () => {
    const TestComponent = () => {
      const auth = useAuthContext();
      return <div>{auth.user?.email}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should provide user from auth hook', () => {
    const TestComponent = () => {
      const { user } = useAuthContext();
      return (
        <div>
          {user?.firstName} {user?.lastName}
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should provide token from auth hook', () => {
    const TestComponent = () => {
      const { token } = useAuthContext();
      return <div>{token}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('test-token')).toBeInTheDocument();
  });

  it('should provide loading state from auth hook', () => {
    const TestComponent = () => {
      const { loading } = useAuthContext();
      return <div>{loading ? 'Loading' : 'Not Loading'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Not Loading')).toBeInTheDocument();
  });

  it('should provide isAuthenticated state from auth hook', () => {
    const TestComponent = () => {
      const { isAuthenticated } = useAuthContext();
      return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Authenticated')).toBeInTheDocument();
  });

  it('should provide login function from auth hook', () => {
    const TestComponent = () => {
      const { login } = useAuthContext();
      return <div>{typeof login}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('function')).toBeInTheDocument();
  });

  it('should provide register function from auth hook', () => {
    const TestComponent = () => {
      const { register } = useAuthContext();
      return <div>{typeof register}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('function')).toBeInTheDocument();
  });

  it('should provide logout function from auth hook', () => {
    const TestComponent = () => {
      const { logout } = useAuthContext();
      return <div>{typeof logout}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('function')).toBeInTheDocument();
  });

  it('should provide updateUser function from auth hook', () => {
    const TestComponent = () => {
      const { updateUser } = useAuthContext();
      return <div>{typeof updateUser}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('function')).toBeInTheDocument();
  });
});

describe('AuthProvider - Unauthenticated State', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
  });

  it('should provide null user when not authenticated', () => {
    const TestComponent = () => {
      const { user } = useAuthContext();
      return <div>{user ? 'User exists' : 'No user'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('No user')).toBeInTheDocument();
  });

  it('should provide null token when not authenticated', () => {
    const TestComponent = () => {
      const { token } = useAuthContext();
      return <div>{token ? 'Token exists' : 'No token'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('No token')).toBeInTheDocument();
  });

  it('should provide isAuthenticated as false', () => {
    const TestComponent = () => {
      const { isAuthenticated } = useAuthContext();
      return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
  });
});

describe('AuthProvider - Loading State', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: true,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
  });

  it('should provide loading as true', () => {
    const TestComponent = () => {
      const { loading } = useAuthContext();
      return <div>{loading ? 'Loading' : 'Not Loading'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});

describe('useAuthContext - Error Handling', () => {
  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = vi.fn();

    const TestComponent = () => {
      useAuthContext();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useAuthContext must be used within AuthProvider'
    );

    console.error = consoleError;
  });
});

describe('useAuthContext - Multiple Children', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuthValue);
  });

  it('should provide context to multiple children', () => {
    const Child1 = () => {
      const { user } = useAuthContext();
      return <div>Child 1: {user?.email}</div>;
    };

    const Child2 = () => {
      const { isAuthenticated } = useAuthContext();
      return <div>Child 2: {isAuthenticated ? 'Yes' : 'No'}</div>;
    };

    render(
      <AuthProvider>
        <Child1 />
        <Child2 />
      </AuthProvider>
    );

    expect(screen.getByText('Child 1: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Child 2: Yes')).toBeInTheDocument();
  });

  it('should provide same context to nested children', () => {
    const NestedChild = () => {
      const { user } = useAuthContext();
      return <div>Nested: {user?.email}</div>;
    };

    const Parent = () => {
      return (
        <div>
          <NestedChild />
        </div>
      );
    };

    render(
      <AuthProvider>
        <Parent />
      </AuthProvider>
    );

    expect(screen.getByText('Nested: test@example.com')).toBeInTheDocument();
  });
});

describe('AuthProvider - Context Value Updates', () => {
  it('should update context when auth state changes', () => {
    const { rerender } = render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    // Change the mock return value
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, email: 'updated@example.com' },
      token: 'new-token',
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    const TestComponent = () => {
      const { user, token } = useAuthContext();
      return (
        <div>
          {user?.email} - {token}
        </div>
      );
    };

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('updated@example.com - new-token')).toBeInTheDocument();
  });
});

describe('AuthProvider - All Context Properties', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(mockAuthValue);
  });

  it('should provide all auth context properties', () => {
    const TestComponent = () => {
      const auth = useAuthContext();
      return (
        <div>
          <div data-testid="user">{auth.user?.email}</div>
          <div data-testid="token">{auth.token}</div>
          <div data-testid="loading">{String(auth.loading)}</div>
          <div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
          <div data-testid="login">{typeof auth.login}</div>
          <div data-testid="register">{typeof auth.register}</div>
          <div data-testid="logout">{typeof auth.logout}</div>
          <div data-testid="updateUser">{typeof auth.updateUser}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('token')).toHaveTextContent('test-token');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('login')).toHaveTextContent('function');
    expect(screen.getByTestId('register')).toHaveTextContent('function');
    expect(screen.getByTestId('logout')).toHaveTextContent('function');
    expect(screen.getByTestId('updateUser')).toHaveTextContent('function');
  });
});
