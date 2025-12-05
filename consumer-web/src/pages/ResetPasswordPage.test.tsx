import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from './ResetPasswordPage';

const renderWithRouter = (initialRoute = '/reset-password?token=abc123') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ResetPasswordPage', () => {
  it('should render the reset password page with token', () => {
    renderWithRouter();
    expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
  });

  it('should display page heading', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('should display page description', () => {
    renderWithRouter();
    expect(screen.getByText('Enter your new password below')).toBeInTheDocument();
  });
});

describe('ResetPasswordPage - Invalid Token', () => {
  it('should show error message when no token is provided', () => {
    renderWithRouter('/reset-password');

    expect(screen.getByRole('heading', { name: 'Invalid Reset Link' })).toBeInTheDocument();
    expect(screen.getByText('This password reset link is invalid or has expired.')).toBeInTheDocument();
  });

  it('should display Request New Link button when no token', () => {
    renderWithRouter('/reset-password');

    const requestNewLinkButton = screen.getByText('Request New Link');
    expect(requestNewLinkButton).toBeInTheDocument();
    expect(requestNewLinkButton.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('should show error icon when no token', () => {
    renderWithRouter('/reset-password');

    const errorIcon = screen.getByRole('heading', { name: 'Invalid Reset Link' })
      .closest('div')
      ?.parentElement
      ?.querySelector('svg');
    expect(errorIcon).toBeInTheDocument();
  });
});

describe('ResetPasswordPage - Form', () => {
  it('should display reset password form', () => {
    renderWithRouter();
    expect(screen.getByTestId('reset-password-form')).toBeInTheDocument();
  });

  it('should display password input field', () => {
    renderWithRouter();
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('placeholder', 'Enter new password');
  });

  it('should display confirm password input field', () => {
    renderWithRouter();
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('placeholder', 'Confirm new password');
  });

  it('should have password label', () => {
    renderWithRouter();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
  });

  it('should have confirm password label', () => {
    renderWithRouter();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('should have required attributes on inputs', () => {
    renderWithRouter();
    expect(screen.getByTestId('password-input')).toBeRequired();
    expect(screen.getByTestId('confirm-password-input')).toBeRequired();
  });

  it('should display password requirements hint', () => {
    renderWithRouter();
    expect(screen.getByText('Must be at least 8 characters long')).toBeInTheDocument();
  });

  it('should display submit button', () => {
    renderWithRouter();
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Reset Password');
  });

  it('should allow typing in password fields', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');

    await user.type(passwordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');

    expect(passwordInput).toHaveValue('newpassword123');
    expect(confirmPasswordInput).toHaveValue('newpassword123');
  });

  it('should have Back to Login link', () => {
    renderWithRouter();
    const backLink = screen.getByText('← Back to Login');
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', '/login');
  });
});

describe('ResetPasswordPage - Form Validation', () => {
  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'short');
    await user.type(screen.getByTestId('confirm-password-input'), 'short');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.type(screen.getByTestId('confirm-password-input'), 'different123');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should clear error when valid input is provided', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    // First, trigger an error
    await user.type(screen.getByTestId('password-input'), 'short');
    await user.type(screen.getByTestId('confirm-password-input'), 'short');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();

    // Now provide valid input
    await user.clear(screen.getByTestId('password-input'));
    await user.clear(screen.getByTestId('confirm-password-input'));
    await user.type(screen.getByTestId('password-input'), 'validpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'validpassword123');
    await user.click(screen.getByTestId('submit-button'));

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
    });
  });

  it('should not submit form with invalid password', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'short');
    await user.type(screen.getByTestId('confirm-password-input'), 'short');
    await user.click(screen.getByTestId('submit-button'));

    // Should not show success state
    expect(screen.queryByText('Password Reset Successful!')).not.toBeInTheDocument();
  });
});

describe('ResetPasswordPage - Form Submission', () => {
  it('should show loading state when submitting', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Resetting...')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('should disable inputs during submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('password-input')).toBeDisabled();
    expect(screen.getByTestId('confirm-password-input')).toBeDisabled();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('should display success message after submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Password Reset Successful!' })).toBeInTheDocument();
    });
  });

  it('should show redirect message after success', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
    });
  });

  it('should show success icon after submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const successIcon = screen.getByRole('heading', { name: 'Password Reset Successful!' })
        .closest('div')
        ?.parentElement
        ?.querySelector('svg');
      expect(successIcon).toBeInTheDocument();
    });
  });
});

describe('ResetPasswordPage - Success State', () => {
  it('should display confirmation message in success state', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Your password has been reset successfully.')).toBeInTheDocument();
    });
  });

  it('should hide form after successful submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('reset-password-form')).not.toBeInTheDocument();
    });
  });
});

describe('ResetPasswordPage - Accessibility', () => {
  it('should have proper heading structure', () => {
    renderWithRouter();
    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('should have properly labeled form inputs', () => {
    renderWithRouter();

    const passwordInput = screen.getByLabelText('New Password');
    expect(passwordInput).toHaveAttribute('id', 'password');

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    expect(confirmPasswordInput).toHaveAttribute('id', 'confirmPassword');
  });

  it('should have accessible submit button', () => {
    renderWithRouter();
    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have accessible link in error state', () => {
    renderWithRouter('/reset-password');
    const requestLink = screen.getByRole('link', { name: 'Request New Link' });
    expect(requestLink).toHaveAttribute('href', '/forgot-password');
  });
});

describe('ResetPasswordPage - Error Display', () => {
  it('should not display error initially', () => {
    renderWithRouter();
    expect(screen.queryByText('Password must be at least 8 characters long')).not.toBeInTheDocument();
    expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
  });

  it('should display error in a visible container', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'short');
    await user.type(screen.getByTestId('confirm-password-input'), 'short');
    await user.click(screen.getByTestId('submit-button'));

    const errorElement = screen.getByText('Password must be at least 8 characters long');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveClass('text-red-600');
  });
});

describe('ResetPasswordPage - Loading State', () => {
  it('should show Resetting... text during submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Resetting...')).toBeInTheDocument();
  });

  it('should disable all form elements during submission', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), 'newpassword123');
    await user.type(screen.getByTestId('confirm-password-input'), 'newpassword123');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('password-input')).toBeDisabled();
    expect(screen.getByTestId('confirm-password-input')).toBeDisabled();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });
});

describe('ResetPasswordPage - Password Requirements', () => {
  it('should display password hint text', () => {
    renderWithRouter();
    expect(screen.getByText('Must be at least 8 characters long')).toBeInTheDocument();
  });

  it('should accept password with exactly 8 characters', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), '12345678');
    await user.type(screen.getByTestId('confirm-password-input'), '12345678');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Password Reset Successful!' })).toBeInTheDocument();
    });
  });

  it('should reject password with 7 characters', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByTestId('password-input'), '1234567');
    await user.type(screen.getByTestId('confirm-password-input'), '1234567');
    await user.click(screen.getByTestId('submit-button'));

    expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument();
  });
});
