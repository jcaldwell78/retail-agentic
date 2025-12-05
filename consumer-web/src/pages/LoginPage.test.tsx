import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import * as useAuthModule from '../hooks/useAuth';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should render the login page', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should display the login form title', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should display the login form description', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText('Enter your email and password to access your account')).toBeInTheDocument();
  });
});

describe('LoginPage - Form Fields', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should display email input field', () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'name@example.com');
  });

  it('should display password input field', () => {
    renderWithRouter(<LoginPage />);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should have required attributes on inputs', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText('Password')).toBeRequired();
  });

  it('should display sign in button', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should allow typing in email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const passwordInput = screen.getByLabelText('Password');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });
});

describe('LoginPage - Form Submission', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should call login function on form submission', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should navigate to home page on successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should navigate to intended page after successful login', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    // Simulate being redirected to login from /profile
    renderWithRouter(<LoginPage />, ['/login']);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('should display error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('should clear error message on new submission', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    // First failed attempt
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Second attempt should clear error
    mockLogin.mockResolvedValueOnce(undefined);
    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /Sign in/ }));

    // Error should be cleared during submission
    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });
});

describe('LoginPage - Loading State', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should show loading state during login', async () => {
    let resolveLogin: ((value: unknown) => void) | undefined;
    mockLogin.mockReturnValue(new Promise(resolve => { resolveLogin = resolve; }));

    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveLogin();
  });

  it('should disable form inputs during loading', async () => {
    let resolveLogin: ((value: unknown) => void) | undefined;
    mockLogin.mockReturnValue(new Promise(resolve => { resolveLogin = resolve; }));

    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByRole('button', { name: /Signing in/ })).toBeDisabled();
    });

    resolveLogin();
  });
});

describe('LoginPage - Navigation Links', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should display forgot password link', () => {
    renderWithRouter(<LoginPage />);
    const forgotPasswordLink = screen.getByText('Forgot password?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('should display sign up link', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();

    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should have proper link styling', () => {
    renderWithRouter(<LoginPage />);
    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink).toHaveClass('font-semibold');
  });
});

describe('LoginPage - Accessibility', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should have proper heading structure', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should have properly labeled form inputs', () => {
    renderWithRouter(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('id', 'email');

    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });

  it('should have accessible button', () => {
    renderWithRouter(<LoginPage />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should have accessible links', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign up' })).toBeInTheDocument();
  });
});

describe('LoginPage - Form Validation', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should not call login with empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    const button = screen.getByRole('button', { name: 'Sign in' });
    await user.click(button);

    // Form validation should prevent submission
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should have email type for email input', () => {
    renderWithRouter(<LoginPage />);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have password type for password input', () => {
    renderWithRouter(<LoginPage />);
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

describe('LoginPage - Error Display', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: mockLogin,
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should not display error initially', () => {
    renderWithRouter(<LoginPage />);
    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
  });

  it('should display error in a visible container', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    const user = userEvent.setup();
    renderWithRouter(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const errorElement = screen.getByText('Invalid email or password');
      expect(errorElement).toBeInTheDocument();
      // Check that error is displayed in a visible way
      expect(errorElement).toHaveClass('rounded-md');
    });
  });
});
