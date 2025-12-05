import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from './ForgotPasswordPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ForgotPasswordPage', () => {
  it('should render the forgot password page', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
  });

  it('should display page heading', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
  });

  it('should display page description', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByText("Enter your email and we'll send you a reset link")).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage - Form', () => {
  it('should display forgot password form', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
  });

  it('should display email input field', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('placeholder', 'Enter your email');
  });

  it('should have email label', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('should have required attribute on email input', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toBeRequired();
  });

  it('should display submit button', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
  });

  it('should allow typing in email field', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should have Back to Login link', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const backLink = screen.getAllByText('← Back to Login')[0];
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should have Sign up link', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();

    const signUpLink = screen.getByText('Sign up');
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
  });
});

describe('ForgotPasswordPage - Form Submission', () => {
  it('should show loading state when submitting', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });

  it('should display success message after submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Email Sent!' })).toBeInTheDocument();
    });
  });

  it('should display confirmation message with email address', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/We've sent a password reset link to/)).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should change page description after submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Check your email for reset instructions')).toBeInTheDocument();
    });
  });
});

describe('ForgotPasswordPage - Success State', () => {
  it('should display success icon', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const successIcon = screen.getByRole('heading', { name: 'Email Sent!' })
        .closest('div')
        ?.querySelector('svg');
      expect(successIcon).toBeInTheDocument();
    });
  });

  it('should display spam folder notice', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/Check your spam folder/)).toBeInTheDocument();
    });
  });

  it('should display try again button', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('try again')).toBeInTheDocument();
    });
  });

  it('should display Back to Login button in success state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const backToLoginButton = screen.getAllByText('Back to Login')[0];
      expect(backToLoginButton).toBeInTheDocument();
      expect(backToLoginButton.closest('a')).toHaveAttribute('href', '/login');
    });
  });

  it('should reset form when try again is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Email Sent!' })).toBeInTheDocument();
    });

    // Click try again
    await user.click(screen.getByText('try again'));

    // Should show form again
    expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });
});

describe('ForgotPasswordPage - Form Validation', () => {
  it('should have email input type', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have required attribute', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const emailInput = screen.getByTestId('email-input');
    expect(emailInput).toBeRequired();
  });
});

describe('ForgotPasswordPage - Navigation Links', () => {
  it('should have properly labeled email input', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('id', 'email');
  });

  it('should have accessible Back to Login link', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const backLinks = screen.getAllByRole('link');
    const backToLoginLink = backLinks.find(link => link.textContent === '← Back to Login');
    expect(backToLoginLink).toBeTruthy();
    expect(backToLoginLink).toHaveAttribute('href', '/login');
  });

  it('should have accessible Sign up link', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const signUpLink = screen.getByRole('link', { name: 'Sign up' });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });
});

describe('ForgotPasswordPage - Accessibility', () => {
  it('should have proper heading structure', () => {
    renderWithRouter(<ForgotPasswordPage />);
    expect(screen.getByRole('heading', { name: 'Forgot Password?' })).toBeInTheDocument();
  });

  it('should have accessible submit button', () => {
    renderWithRouter(<ForgotPasswordPage />);
    const submitButton = screen.getByRole('button', { name: 'Send Reset Link' });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should disable inputs during loading', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    // Inputs should be disabled during loading
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});

describe('ForgotPasswordPage - Loading State', () => {
  it('should show Sending... text during submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('should disable form during submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-button');

    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});

describe('ForgotPasswordPage - Success Message Details', () => {
  it('should display full success instructions', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/Please check your inbox and follow the instructions/)).toBeInTheDocument();
    });
  });

  it('should show email address in success message', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ForgotPasswordPage />);

    const testEmail = 'user@example.com';
    await user.type(screen.getByTestId('email-input'), testEmail);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(testEmail)).toBeInTheDocument();
    });
  });
});
