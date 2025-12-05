import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
import * as useAuthModule from '../hooks/useAuth';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should render the registration page', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });

  it('should display the registration form title', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });

  it('should display the registration form description', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Enter your information to create a new account')).toBeInTheDocument();
  });
});

describe('RegisterPage - Form Fields', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should display first name input field', () => {
    renderWithRouter(<RegisterPage />);
    const firstNameInput = screen.getByLabelText('First name');
    expect(firstNameInput).toBeInTheDocument();
    expect(firstNameInput).toHaveAttribute('placeholder', 'John');
  });

  it('should display last name input field', () => {
    renderWithRouter(<RegisterPage />);
    const lastNameInput = screen.getByLabelText('Last name');
    expect(lastNameInput).toBeInTheDocument();
    expect(lastNameInput).toHaveAttribute('placeholder', 'Doe');
  });

  it('should display email input field', () => {
    renderWithRouter(<RegisterPage />);
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'name@example.com');
  });

  it('should display phone input field as optional', () => {
    renderWithRouter(<RegisterPage />);
    const phoneInput = screen.getByLabelText('Phone (optional)');
    expect(phoneInput).toBeInTheDocument();
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).not.toBeRequired();
  });

  it('should display password input field', () => {
    renderWithRouter(<RegisterPage />);
    const passwordInput = screen.getByLabelText(/^Password$/);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should display confirm password input field', () => {
    renderWithRouter(<RegisterPage />);
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should display password requirements', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('should have required attributes on mandatory inputs', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByLabelText('First name')).toBeRequired();
    expect(screen.getByLabelText('Last name')).toBeRequired();
    expect(screen.getByLabelText('Email')).toBeRequired();
    expect(screen.getByLabelText(/^Password$/)).toBeRequired();
    expect(screen.getByLabelText('Confirm password')).toBeRequired();
  });

  it('should display create account button', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
  });
});

describe('RegisterPage - Form Input', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should allow typing in first name field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const firstNameInput = screen.getByLabelText('First name');
    await user.type(firstNameInput, 'John');

    expect(firstNameInput).toHaveValue('John');
  });

  it('should allow typing in last name field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const lastNameInput = screen.getByLabelText('Last name');
    await user.type(lastNameInput, 'Doe');

    expect(lastNameInput).toHaveValue('Doe');
  });

  it('should allow typing in email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'john@example.com');

    expect(emailInput).toHaveValue('john@example.com');
  });

  it('should allow typing in phone field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const phoneInput = screen.getByLabelText('Phone (optional)');
    await user.type(phoneInput, '+1234567890');

    expect(phoneInput).toHaveValue('+1234567890');
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/^Password$/);
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should allow typing in confirm password field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    await user.type(confirmPasswordInput, 'password123');

    expect(confirmPasswordInput).toHaveValue('password123');
  });
});

describe('RegisterPage - Form Validation', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should show error when password is less than 8 characters', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'pass123');
    await user.type(screen.getByLabelText('Confirm password'), 'pass123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('should accept valid 8 character password', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password');
    await user.type(screen.getByLabelText('Confirm password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });
});

describe('RegisterPage - Form Submission', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should call register function with correct data', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Phone (optional)'), '+1234567890');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      });
    });
  });

  it('should call register without phone when not provided', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '',
      });
    });
  });

  it('should navigate to home page on successful registration', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should display error on failed registration', async () => {
    mockRegister.mockRejectedValue(new Error('Registration failed'));
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument();
    });
  });
});

describe('RegisterPage - Loading State', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should show loading state during registration', async () => {
    let resolveRegister: ((value: unknown) => void) | undefined;
    mockRegister.mockReturnValue(new Promise(resolve => { resolveRegister = resolve; }));

    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
    });

    resolveRegister();
  });

  it('should disable form inputs during loading', async () => {
    let resolveRegister: ((value: unknown) => void) | undefined;
    mockRegister.mockReturnValue(new Promise(resolve => { resolveRegister = resolve; }));

    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creating account/ })).toBeDisabled();
    });

    resolveRegister();
  });
});

describe('RegisterPage - Navigation Links', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should display sign in link', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();

    const signInLink = screen.getByText('Sign in');
    expect(signInLink).toBeInTheDocument();
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login');
  });
});

describe('RegisterPage - Accessibility', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should have proper heading structure', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  });

  it('should have properly labeled form inputs', () => {
    renderWithRouter(<RegisterPage />);

    expect(screen.getByLabelText('First name')).toHaveAttribute('id', 'firstName');
    expect(screen.getByLabelText('Last name')).toHaveAttribute('id', 'lastName');
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
    expect(screen.getByLabelText('Phone (optional)')).toHaveAttribute('id', 'phone');
    expect(screen.getByLabelText(/^Password$/)).toHaveAttribute('id', 'password');
    expect(screen.getByLabelText('Confirm password')).toHaveAttribute('id', 'confirmPassword');
  });

  it('should have accessible button', () => {
    renderWithRouter(<RegisterPage />);
    const button = screen.getByRole('button', { name: 'Create account' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should have accessible link', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('RegisterPage - Error Display', () => {
  beforeEach(() => {
    mockRegister.mockClear();
    mockNavigate.mockClear();
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: mockRegister,
      updateUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
  });

  it('should not display error initially', () => {
    renderWithRouter(<RegisterPage />);
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    expect(screen.queryByText('Password must be at least 8 characters')).not.toBeInTheDocument();
    expect(screen.queryByText('Registration failed. Please try again.')).not.toBeInTheDocument();
  });

  it('should clear error on new submission', async () => {
    mockRegister.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithRouter(<RegisterPage />);

    // First attempt with mismatched passwords
    await user.type(screen.getByLabelText('First name'), 'John');
    await user.type(screen.getByLabelText('Last name'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText(/^Password$/), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password456');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Fix password and retry
    await user.clear(screen.getByLabelText('Confirm password'));
    await user.type(screen.getByLabelText('Confirm password'), 'password123');

    // Click to submit and error should be cleared
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    // Error should be cleared during submission (setError('') is called at start of handleSubmit)
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
  });
});
