import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const ProtectedContent = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const HomePage = () => <div>Home Page</div>;

const renderWithRouter = (
  initialRoute = '/',
  authState = { isAuthenticated: false, loading: false }
) => {
  mockUseAuth.mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when authenticated', () => {
    renderWithRouter('/', { isAuthenticated: true, loading: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading spinner while loading', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: true });
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should not render children while loading even if authenticated', () => {
    renderWithRouter('/', { isAuthenticated: true, loading: true });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute - Custom Redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to custom path when specified', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute redirectTo="/custom-login">
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/custom-login" element={<div>Custom Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Login')).toBeInTheDocument();
  });

  it('should use default /login redirect when redirectTo not specified', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

describe('ProtectedRoute - requireAuth Prop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow unauthenticated access when requireAuth is false', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={false}>
                <div>Public Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  it('should redirect authenticated users to home when requireAuth is false', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route
            path="/login"
            element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should render children when authenticated and requireAuth is true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={true}>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect when not authenticated and requireAuth is true', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: false });
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

describe('ProtectedRoute - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading spinner with correct styling', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: true });
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('rounded-full');
    expect(spinner).toHaveClass('h-12');
    expect(spinner).toHaveClass('w-12');
    expect(spinner).toHaveClass('border-b-2');
  });

  it('should center loading spinner on screen', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: true });
    const container = document.querySelector('.min-h-screen');
    expect(container).toHaveClass('flex');
    expect(container).toHaveClass('items-center');
    expect(container).toHaveClass('justify-center');
  });

  it('should not redirect while loading', () => {
    renderWithRouter('/', { isAuthenticated: false, loading: true });
    // Should show spinner, not redirect
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute - Multiple Children', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render multiple children when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Child 1</div>
                <div>Child 2</div>
                <div>Child 3</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should not render any children when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Child 1</div>
                <div>Child 2</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Child 2')).not.toBeInTheDocument();
  });
});

describe('ProtectedRoute - Authentication State Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update when authentication state changes from loading to authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Initially loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Update to authenticated
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect when authentication state changes from loading to unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Initially loading
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Update to unauthenticated
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    rerender(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

describe('ProtectedRoute - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle requireAuth undefined as default true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect because requireAuth defaults to true
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should handle redirectTo undefined as default /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to /login by default
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should not redirect when both authenticated and requireAuth is true', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requireAuth={true}>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should not redirect when both unauthenticated and requireAuth is false', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

    render(
      <MemoryRouter initialEntries={['/public']}>
        <Routes>
          <Route
            path="/public"
            element={
              <ProtectedRoute requireAuth={false}>
                <div>Public Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });
});
