import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GuestCheckoutProvider,
  useGuestCheckout,
  EmailCollection,
  GuestInfoForm,
  ShippingAddressForm,
  ExpressCheckout,
  CreateAccountPrompt,
  GuestOrderSummary,
  GuestCheckout,
  ShippingAddress,
} from './GuestCheckout';

// Test consumer component
function TestGuestCheckoutConsumer() {
  const {
    guestInfo,
    shippingAddress,
    step,
    errors,
    isGuest,
    setGuestInfo,
    setShippingAddress,
    setStep,
    validateEmail,
    validatePhone,
    setError,
    clearErrors,
    continueAsGuest,
    goToLogin,
  } = useGuestCheckout();

  return (
    <div>
      <div data-testid="email">{guestInfo.email || 'none'}</div>
      <div data-testid="first-name">{guestInfo.firstName || 'none'}</div>
      <div data-testid="step">{step}</div>
      <div data-testid="is-guest">{isGuest.toString()}</div>
      <div data-testid="error-count">{Object.keys(errors).length}</div>
      <div data-testid="shipping-city">{shippingAddress.city || 'none'}</div>
      <button data-testid="set-email" onClick={() => setGuestInfo({ email: 'test@example.com' })}>
        Set Email
      </button>
      <button
        data-testid="set-full-info"
        onClick={() =>
          setGuestInfo({ email: 'test@example.com', firstName: 'John', lastName: 'Doe' })
        }
      >
        Set Full Info
      </button>
      <button data-testid="set-shipping" onClick={() => setShippingAddress({ city: 'New York' })}>
        Set Shipping
      </button>
      <button data-testid="set-step-shipping" onClick={() => setStep('shipping')}>
        Go to Shipping
      </button>
      <button data-testid="validate-good-email" onClick={() => validateEmail('valid@email.com')}>
        Validate Good Email
      </button>
      <button data-testid="validate-good-phone" onClick={() => validatePhone('555-123-4567')}>
        Validate Good Phone
      </button>
      <button data-testid="set-error" onClick={() => setError('test', 'Test error')}>
        Set Error
      </button>
      <button data-testid="clear-errors" onClick={clearErrors}>
        Clear Errors
      </button>
      <button data-testid="continue-as-guest" onClick={continueAsGuest}>
        Continue As Guest
      </button>
      <button data-testid="go-to-login" onClick={goToLogin}>
        Go to Login
      </button>
    </div>
  );
}

describe('GuestCheckoutProvider', () => {
  it('should provide default context values', () => {
    render(
      <GuestCheckoutProvider>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('email')).toHaveTextContent('none');
    expect(screen.getByTestId('step')).toHaveTextContent('email');
    expect(screen.getByTestId('is-guest')).toHaveTextContent('false');
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should update guest info', async () => {
    render(
      <GuestCheckoutProvider>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('set-email'));
    expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
  });

  it('should update shipping address', async () => {
    render(
      <GuestCheckoutProvider>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('set-shipping'));
    expect(screen.getByTestId('shipping-city')).toHaveTextContent('New York');
  });

  it('should change step', async () => {
    render(
      <GuestCheckoutProvider>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('set-step-shipping'));
    expect(screen.getByTestId('step')).toHaveTextContent('shipping');
  });

  it('should set and clear errors', async () => {
    render(
      <GuestCheckoutProvider>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('set-error'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('1');

    await userEvent.click(screen.getByTestId('clear-errors'));
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('should call onContinueAsGuest when continuing', async () => {
    const onContinueAsGuest = vi.fn();

    render(
      <GuestCheckoutProvider onContinueAsGuest={onContinueAsGuest}>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('set-full-info'));
    await userEvent.click(screen.getByTestId('continue-as-guest'));

    expect(onContinueAsGuest).toHaveBeenCalledWith({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: undefined,
    });
    expect(screen.getByTestId('is-guest')).toHaveTextContent('true');
    expect(screen.getByTestId('step')).toHaveTextContent('shipping');
  });

  it('should call onGoToLogin when going to login', async () => {
    const onGoToLogin = vi.fn();

    render(
      <GuestCheckoutProvider onGoToLogin={onGoToLogin}>
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('go-to-login'));

    expect(onGoToLogin).toHaveBeenCalled();
  });
});

describe('useGuestCheckout', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestGuestCheckoutConsumer />)).toThrow(
      'useGuestCheckout must be used within a GuestCheckoutProvider'
    );

    consoleError.mockRestore();
  });
});

describe('EmailCollection', () => {
  it('should render email collection form', () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('email-collection')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('continue-button')).toBeInTheDocument();
  });

  it('should show login link by default', () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('login-link')).toBeInTheDocument();
  });

  it('should hide login link when showCreateAccountOption is false', () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection showCreateAccountOption={false} />
      </GuestCheckoutProvider>
    );

    expect(screen.queryByTestId('login-link')).not.toBeInTheDocument();
  });

  it('should show error for empty email', async () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('continue-button'));

    expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
  });

  it('should show error for invalid email', async () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    const input = screen.getByTestId('email-input');
    fireEvent.change(input, { target: { value: 'invalid-email' } });

    const form = input.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Please enter a valid email');
    });
  });

  it('should call onSubmit with valid email', async () => {
    const onSubmit = vi.fn();

    render(
      <GuestCheckoutProvider>
        <EmailCollection onSubmit={onSubmit} />
      </GuestCheckoutProvider>
    );

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.click(screen.getByTestId('continue-button'));

    expect(onSubmit).toHaveBeenCalledWith('test@example.com');
  });

  it('should call goToLogin when login link clicked', async () => {
    const onGoToLogin = vi.fn();

    render(
      <GuestCheckoutProvider onGoToLogin={onGoToLogin}>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('login-link'));

    expect(onGoToLogin).toHaveBeenCalled();
  });
});

describe('GuestInfoForm', () => {
  it('should render guest info form', () => {
    render(
      <GuestCheckoutProvider>
        <GuestInfoForm />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('guest-info-form')).toBeInTheDocument();
    expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('phone-input')).toBeInTheDocument();
  });

  it('should show error for missing first name', async () => {
    render(
      <GuestCheckoutProvider>
        <GuestInfoForm />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required');
  });

  it('should show error for missing last name', async () => {
    render(
      <GuestCheckoutProvider>
        <GuestInfoForm />
      </GuestCheckoutProvider>
    );

    await userEvent.type(screen.getByTestId('first-name-input'), 'John');
    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    expect(screen.getByTestId('last-name-error')).toHaveTextContent('Last name is required');
  });

  it('should show error for invalid phone', async () => {
    render(
      <GuestCheckoutProvider>
        <GuestInfoForm />
      </GuestCheckoutProvider>
    );

    await userEvent.type(screen.getByTestId('first-name-input'), 'John');
    await userEvent.type(screen.getByTestId('last-name-input'), 'Doe');
    await userEvent.type(screen.getByTestId('phone-input'), '123');
    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    expect(screen.getByTestId('phone-error')).toHaveTextContent('Please enter a valid phone number');
  });

  it('should call onSubmit with valid info', async () => {
    const onSubmit = vi.fn();

    render(
      <GuestCheckoutProvider>
        <GuestInfoForm onSubmit={onSubmit} />
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    // Set email first (required by form)
    await userEvent.click(screen.getByTestId('set-email'));

    await userEvent.type(screen.getByTestId('first-name-input'), 'John');
    await userEvent.type(screen.getByTestId('last-name-input'), 'Doe');
    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: undefined,
    });
  });
});

describe('ShippingAddressForm', () => {
  it('should render shipping address form', () => {
    render(
      <GuestCheckoutProvider>
        <ShippingAddressForm />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('shipping-address-form')).toBeInTheDocument();
    expect(screen.getByTestId('shipping-first-name')).toBeInTheDocument();
    expect(screen.getByTestId('address1-input')).toBeInTheDocument();
    expect(screen.getByTestId('city-input')).toBeInTheDocument();
  });

  it('should show saved addresses when available', () => {
    const savedAddresses: ShippingAddress[] = [
      {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      },
    ];

    render(
      <GuestCheckoutProvider savedAddresses={savedAddresses}>
        <ShippingAddressForm />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('saved-addresses')).toBeInTheDocument();
    expect(screen.getByTestId('saved-address-0')).toBeInTheDocument();
  });

  it('should select saved address when clicked', async () => {
    const savedAddresses: ShippingAddress[] = [
      {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      },
    ];

    render(
      <GuestCheckoutProvider savedAddresses={savedAddresses}>
        <ShippingAddressForm />
        <TestGuestCheckoutConsumer />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('saved-address-0'));

    expect(screen.getByTestId('shipping-city')).toHaveTextContent('New York');
  });

  it('should show error for missing address', async () => {
    render(
      <GuestCheckoutProvider>
        <ShippingAddressForm />
      </GuestCheckoutProvider>
    );

    await userEvent.type(screen.getByTestId('shipping-first-name'), 'John');
    await userEvent.type(screen.getByTestId('shipping-last-name'), 'Doe');
    await userEvent.click(screen.getByTestId('continue-to-payment'));

    expect(screen.getByTestId('address1-error')).toHaveTextContent('Address is required');
  });

  it('should call onSubmit with valid address', async () => {
    const onSubmit = vi.fn();

    render(
      <GuestCheckoutProvider>
        <ShippingAddressForm onSubmit={onSubmit} />
      </GuestCheckoutProvider>
    );

    await userEvent.type(screen.getByTestId('shipping-first-name'), 'John');
    await userEvent.type(screen.getByTestId('shipping-last-name'), 'Doe');
    await userEvent.type(screen.getByTestId('address1-input'), '123 Main St');
    await userEvent.type(screen.getByTestId('city-input'), 'New York');
    await userEvent.type(screen.getByTestId('state-input'), 'NY');
    await userEvent.type(screen.getByTestId('postal-code-input'), '10001');
    await userEvent.type(screen.getByTestId('country-input'), 'USA');
    await userEvent.click(screen.getByTestId('continue-to-payment'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      })
    );
  });
});

describe('ExpressCheckout', () => {
  it('should render express checkout buttons', () => {
    render(
      <GuestCheckoutProvider>
        <ExpressCheckout />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('express-checkout')).toBeInTheDocument();
    expect(screen.getByTestId('paypal-button')).toBeInTheDocument();
    expect(screen.getByTestId('apple-pay-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-pay-button')).toBeInTheDocument();
  });

  it('should hide buttons when disabled', () => {
    render(
      <GuestCheckoutProvider>
        <ExpressCheckout showPayPal={false} showApplePay={false} showGooglePay={false} />
      </GuestCheckoutProvider>
    );

    expect(screen.queryByTestId('paypal-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('apple-pay-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('google-pay-button')).not.toBeInTheDocument();
  });

  it('should show shop pay when enabled', () => {
    render(
      <GuestCheckoutProvider>
        <ExpressCheckout showShopPay />
      </GuestCheckoutProvider>
    );

    expect(screen.getByTestId('shop-pay-button')).toBeInTheDocument();
  });

  it('should call onPayPal when PayPal clicked', async () => {
    const onPayPal = vi.fn();

    render(
      <GuestCheckoutProvider>
        <ExpressCheckout onPayPal={onPayPal} />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('paypal-button'));

    expect(onPayPal).toHaveBeenCalled();
  });

  it('should call onApplePay when Apple Pay clicked', async () => {
    const onApplePay = vi.fn();

    render(
      <GuestCheckoutProvider>
        <ExpressCheckout onApplePay={onApplePay} />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('apple-pay-button'));

    expect(onApplePay).toHaveBeenCalled();
  });

  it('should call onGooglePay when Google Pay clicked', async () => {
    const onGooglePay = vi.fn();

    render(
      <GuestCheckoutProvider>
        <ExpressCheckout onGooglePay={onGooglePay} />
      </GuestCheckoutProvider>
    );

    await userEvent.click(screen.getByTestId('google-pay-button'));

    expect(onGooglePay).toHaveBeenCalled();
  });
});

describe('CreateAccountPrompt', () => {
  it('should render create account prompt', () => {
    render(<CreateAccountPrompt />);

    expect(screen.getByTestId('create-account-prompt')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
  });

  it('should show email when provided', () => {
    render(<CreateAccountPrompt email="test@example.com" />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should show error for short password', async () => {
    render(<CreateAccountPrompt />);

    await userEvent.type(screen.getByTestId('password-input'), 'short');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'short');
    await userEvent.click(screen.getByTestId('create-account-button'));

    expect(screen.getByTestId('password-error')).toHaveTextContent(
      'Password must be at least 8 characters'
    );
  });

  it('should show error for mismatched passwords', async () => {
    render(<CreateAccountPrompt />);

    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'different123');
    await userEvent.click(screen.getByTestId('create-account-button'));

    expect(screen.getByTestId('password-error')).toHaveTextContent('Passwords do not match');
  });

  it('should call onCreateAccount with valid password', async () => {
    const onCreateAccount = vi.fn();

    render(<CreateAccountPrompt onCreateAccount={onCreateAccount} />);

    await userEvent.type(screen.getByTestId('password-input'), 'password123');
    await userEvent.type(screen.getByTestId('confirm-password-input'), 'password123');
    await userEvent.click(screen.getByTestId('create-account-button'));

    expect(onCreateAccount).toHaveBeenCalledWith('password123');
  });

  it('should call onSkip when skip clicked', async () => {
    const onSkip = vi.fn();

    render(<CreateAccountPrompt onSkip={onSkip} />);

    await userEvent.click(screen.getByTestId('skip-button'));

    expect(onSkip).toHaveBeenCalled();
  });
});

describe('GuestOrderSummary', () => {
  const items = [
    { id: 'item-1', name: 'Product 1', quantity: 2, price: 29.99, image: 'https://example.com/img.jpg' },
    { id: 'item-2', name: 'Product 2', quantity: 1, price: 49.99 },
  ];

  it('should render order summary', () => {
    render(
      <GuestOrderSummary items={items} subtotal={109.97} shipping={5.99} tax={10.0} total={125.96} />
    );

    expect(screen.getByTestId('guest-order-summary')).toBeInTheDocument();
    expect(screen.getByTestId('summary-item-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('summary-item-item-2')).toBeInTheDocument();
  });

  it('should display correct subtotal', () => {
    render(<GuestOrderSummary items={items} subtotal={109.97} total={109.97} />);

    expect(screen.getByTestId('subtotal')).toHaveTextContent('$109.97');
  });

  it('should display shipping cost', () => {
    render(<GuestOrderSummary items={items} subtotal={100} shipping={9.99} total={109.99} />);

    expect(screen.getByTestId('shipping')).toHaveTextContent('$9.99');
  });

  it('should display free shipping', () => {
    render(<GuestOrderSummary items={items} subtotal={100} shipping={0} total={100} />);

    expect(screen.getByTestId('shipping')).toHaveTextContent('Free');
  });

  it('should display tax', () => {
    render(<GuestOrderSummary items={items} subtotal={100} tax={8.5} total={108.5} />);

    expect(screen.getByTestId('tax')).toHaveTextContent('$8.50');
  });

  it('should display promo discount', () => {
    render(
      <GuestOrderSummary
        items={items}
        subtotal={100}
        promoCode="SAVE10"
        promoDiscount={10}
        total={90}
      />
    );

    expect(screen.getByTestId('promo-discount')).toHaveTextContent('-$10.00');
    expect(screen.getByText('Promo (SAVE10)')).toBeInTheDocument();
  });

  it('should display total', () => {
    render(<GuestOrderSummary items={items} subtotal={100} shipping={10} tax={8} total={118} />);

    expect(screen.getByTestId('total')).toHaveTextContent('$118.00');
  });
});

describe('GuestCheckout', () => {
  it('should render guest checkout component', () => {
    render(<GuestCheckout />);

    expect(screen.getByTestId('guest-checkout')).toBeInTheDocument();
  });

  it('should show express checkout by default', () => {
    render(<GuestCheckout />);

    expect(screen.getByTestId('express-checkout')).toBeInTheDocument();
  });

  it('should hide express checkout when disabled', () => {
    render(<GuestCheckout showExpressCheckout={false} />);

    expect(screen.queryByTestId('express-checkout')).not.toBeInTheDocument();
  });

  it('should show email collection step initially', () => {
    render(<GuestCheckout />);

    expect(screen.getByTestId('email-collection')).toBeInTheDocument();
  });

  it('should progress to info step after email', async () => {
    render(<GuestCheckout />);

    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.click(screen.getByTestId('continue-button'));

    expect(screen.getByTestId('guest-info-form')).toBeInTheDocument();
  });

  it('should progress to shipping step after info', async () => {
    const onContinueAsGuest = vi.fn();
    render(<GuestCheckout onContinueAsGuest={onContinueAsGuest} />);

    // Email step
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.click(screen.getByTestId('continue-button'));

    // Info step
    await userEvent.type(screen.getByTestId('first-name-input'), 'John');
    await userEvent.type(screen.getByTestId('last-name-input'), 'Doe');
    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    expect(screen.getByTestId('shipping-address-form')).toBeInTheDocument();
    expect(onContinueAsGuest).toHaveBeenCalled();
  });

  it('should call onShippingSubmit when shipping form submitted', async () => {
    const onShippingSubmit = vi.fn();
    render(<GuestCheckout onShippingSubmit={onShippingSubmit} />);

    // Progress to shipping
    await userEvent.type(screen.getByTestId('email-input'), 'test@example.com');
    await userEvent.click(screen.getByTestId('continue-button'));
    await userEvent.type(screen.getByTestId('first-name-input'), 'John');
    await userEvent.type(screen.getByTestId('last-name-input'), 'Doe');
    await userEvent.click(screen.getByTestId('continue-to-shipping'));

    // Fill shipping form
    await userEvent.type(screen.getByTestId('shipping-first-name'), 'John');
    await userEvent.type(screen.getByTestId('shipping-last-name'), 'Doe');
    await userEvent.type(screen.getByTestId('address1-input'), '123 Main St');
    await userEvent.type(screen.getByTestId('city-input'), 'New York');
    await userEvent.type(screen.getByTestId('state-input'), 'NY');
    await userEvent.type(screen.getByTestId('postal-code-input'), '10001');
    await userEvent.type(screen.getByTestId('country-input'), 'USA');
    await userEvent.click(screen.getByTestId('continue-to-payment'));

    expect(onShippingSubmit).toHaveBeenCalled();
  });

  it('should call onGoToLogin when login clicked', async () => {
    const onGoToLogin = vi.fn();
    render(<GuestCheckout onGoToLogin={onGoToLogin} />);

    await userEvent.click(screen.getByTestId('login-link'));

    expect(onGoToLogin).toHaveBeenCalled();
  });

  it('should pass express checkout callbacks', async () => {
    const onPayPal = vi.fn();
    const onApplePay = vi.fn();
    const onGooglePay = vi.fn();

    render(
      <GuestCheckout onPayPal={onPayPal} onApplePay={onApplePay} onGooglePay={onGooglePay} />
    );

    await userEvent.click(screen.getByTestId('paypal-button'));
    expect(onPayPal).toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('apple-pay-button'));
    expect(onApplePay).toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('google-pay-button'));
    expect(onGooglePay).toHaveBeenCalled();
  });
});

describe('Accessibility', () => {
  it('EmailCollection should have label for email input', () => {
    render(
      <GuestCheckoutProvider>
        <EmailCollection />
      </GuestCheckoutProvider>
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('GuestInfoForm should have labels for all inputs', () => {
    render(
      <GuestCheckoutProvider>
        <GuestInfoForm />
      </GuestCheckoutProvider>
    );

    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument();
  });

  it('ShippingAddressForm should have labels for all inputs', () => {
    render(
      <GuestCheckoutProvider>
        <ShippingAddressForm />
      </GuestCheckoutProvider>
    );

    expect(screen.getByLabelText(/^Address \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
    expect(screen.getByLabelText(/State/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postal Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/)).toBeInTheDocument();
  });

  it('CreateAccountPrompt should have labels for password inputs', () => {
    render(<CreateAccountPrompt />);

    expect(screen.getByLabelText('Create Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });
});
