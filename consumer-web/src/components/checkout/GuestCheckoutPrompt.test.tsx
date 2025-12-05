import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestCheckoutPrompt from './GuestCheckoutPrompt';

describe('GuestCheckoutPrompt', () => {
  let onGuestCheckout: ReturnType<typeof vi.fn>;
  let onSignIn: ReturnType<typeof vi.fn>;
  let onCreateAccount: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onGuestCheckout = vi.fn();
    onSignIn = vi.fn();
    onCreateAccount = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByRole('heading', { name: /checkout/i, level: 1 })).toBeInTheDocument();
    });

    it('should render guest checkout section', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByRole('heading', { name: /guest checkout/i })).toBeInTheDocument();
      expect(screen.getByText(/continue as a guest/i)).toBeInTheDocument();
    });

    it('should render returning customer section', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByRole('heading', { name: /returning customer/i })).toBeInTheDocument();
    });

    it('should render email input for guest checkout', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByTestId('continue-as-guest-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('create-account-button')).toBeInTheDocument();
    });

    it('should show guest checkout benefits', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByText(/fast checkout process/i)).toBeInTheDocument();
      expect(screen.getByText(/no password required/i)).toBeInTheDocument();
    });

    it('should show account benefits', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByText(/save addresses for faster checkout/i)).toBeInTheDocument();
      expect(screen.getByText(/track orders and view history/i)).toBeInTheDocument();
    });

    it('should show terms and privacy policy links', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    });
  });

  describe('Guest Checkout Flow', () => {
    it('should allow entering email address', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should call onGuestCheckout with valid email', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test@example.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(onGuestCheckout).toHaveBeenCalledWith('test@example.com');
    });

    it('should show error for invalid email', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'invalid-email');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(onGuestCheckout).not.toHaveBeenCalled();
    });

    it('should show error for email without domain', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test@');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(onGuestCheckout).not.toHaveBeenCalled();
    });

    it('should clear error when typing valid email after error', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');

      // First, enter invalid email
      await user.type(emailInput, 'invalid');
      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.getByTestId('email-error')).toBeInTheDocument();

      // Clear and enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });

    it('should validate complex email addresses', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'user.name+tag@example.co.uk');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      expect(onGuestCheckout).toHaveBeenCalledWith('user.name+tag@example.co.uk');
    });

    it('should show order confirmation message', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByText(/we'll send your order confirmation to this email/i)).toBeInTheDocument();
    });
  });

  describe('Returning Customer Actions', () => {
    it('should call onSignIn when sign in button clicked', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onSignIn={onSignIn} />);

      const signInButton = screen.getByTestId('sign-in-button');
      await user.click(signInButton);

      expect(onSignIn).toHaveBeenCalledTimes(1);
    });

    it('should call onCreateAccount when create account button clicked', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onCreateAccount={onCreateAccount} />);

      const createAccountButton = screen.getByTestId('create-account-button');
      await user.click(createAccountButton);

      expect(onCreateAccount).toHaveBeenCalledTimes(1);
    });

    it('should not call callbacks when buttons clicked without handlers', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt />);

      const signInButton = screen.getByTestId('sign-in-button');
      const createAccountButton = screen.getByTestId('create-account-button');

      // Should not throw error
      await expect(user.click(signInButton)).resolves.not.toThrow();
      await expect(user.click(createAccountButton)).resolves.not.toThrow();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      // HTML5 validation should prevent submission
      const emailInput = screen.getByTestId('guest-email-input') as HTMLInputElement;
      expect(emailInput.validity.valid).toBe(false);
    });

    it('should accept email with subdomain', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'user@mail.example.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(onGuestCheckout).toHaveBeenCalledWith('user@mail.example.com');
    });

    it('should reject email with spaces', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test @example.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(onGuestCheckout).not.toHaveBeenCalled();
    });

    it('should reject email without @', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'testexample.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(screen.getByTestId('email-error')).toBeInTheDocument();
      expect(onGuestCheckout).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      render(<GuestCheckoutPrompt />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should mark required field with asterisk', () => {
      render(<GuestCheckoutPrompt />);
      const requiredLabel = screen.getByText('Email Address');
      expect(requiredLabel.parentElement).toContainHTML('*');
    });

    it('should have proper button text', () => {
      render(<GuestCheckoutPrompt />);
      expect(screen.getByText('Continue as Guest')).toBeInTheDocument();
      expect(screen.getByText('Sign In to Your Account')).toBeInTheDocument();
      expect(screen.getByText('Create New Account')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicking of continue button', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test@example.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);
      await user.click(continueButton);
      await user.click(continueButton);

      // Should be called only for each click
      expect(onGuestCheckout).toHaveBeenCalledTimes(3);
    });

    it('should handle empty email submission', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.click(emailInput);
      await user.tab(); // Focus out without entering anything

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      // Should not call callback with empty email
      expect(onGuestCheckout).not.toHaveBeenCalled();
    });

    it('should pass email value as entered', async () => {
      const user = userEvent.setup();
      render(<GuestCheckoutPrompt onGuestCheckout={onGuestCheckout} />);

      const emailInput = screen.getByTestId('guest-email-input');
      await user.type(emailInput, 'test@example.com');

      const continueButton = screen.getByTestId('continue-as-guest-button');
      await user.click(continueButton);

      expect(onGuestCheckout).toHaveBeenCalledWith('test@example.com');
    });
  });
});
