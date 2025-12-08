import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OneClickCheckout,
  OneClickCheckoutProvider,
  useOneClickCheckout,
  BuyNowButton,
  PaymentMethodCard,
  SavedAddressCard,
  OneClickSummary,
  PaymentMethodsSelector,
  AddressesSelector,
  OneClickSettingsToggle,
  type SavedPaymentMethod,
  type SavedAddress,
} from './OneClickCheckout';

const mockPaymentMethods: SavedPaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'pm-2',
    type: 'paypal',
    email: 'test@example.com',
    isDefault: false,
  },
  {
    id: 'pm-3',
    type: 'card',
    last4: '5555',
    brand: 'Mastercard',
    expiryMonth: 1,
    expiryYear: 2020,
    isDefault: false,
    isExpired: true,
  },
];

const mockAddresses: SavedAddress[] = [
  {
    id: 'addr-1',
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',
    isDefault: true,
  },
  {
    id: 'addr-2',
    firstName: 'Jane',
    lastName: 'Doe',
    address1: '456 Oak Ave',
    address2: 'Apt 2B',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'United States',
    isDefault: false,
  },
];

function TestWrapper({
  children,
  paymentMethods = mockPaymentMethods,
  addresses = mockAddresses,
  onCheckout,
}: {
  children: React.ReactNode;
  paymentMethods?: SavedPaymentMethod[];
  addresses?: SavedAddress[];
  onCheckout?: () => Promise<string | null>;
}) {
  return (
    <OneClickCheckoutProvider
      initialPaymentMethods={paymentMethods}
      initialAddresses={addresses}
      onCheckout={onCheckout}
    >
      {children}
    </OneClickCheckoutProvider>
  );
}

describe('OneClickCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OneClickCheckoutProvider', () => {
    it('should provide context values to children', () => {
      function TestComponent() {
        const context = useOneClickCheckout();
        return (
          <div>
            <span data-testid="payment-count">{context.savedPaymentMethods.length}</span>
            <span data-testid="address-count">{context.savedAddresses.length}</span>
            <span data-testid="can-use">{context.canUseOneClick.toString()}</span>
          </div>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('payment-count')).toHaveTextContent('3');
      expect(screen.getByTestId('address-count')).toHaveTextContent('2');
      expect(screen.getByTestId('can-use')).toHaveTextContent('true');
    });

    it('should throw error when used outside provider', () => {
      function TestComponent() {
        useOneClickCheckout();
        return null;
      }

      expect(() => render(<TestComponent />)).toThrow(
        'useOneClickCheckout must be used within a OneClickCheckoutProvider'
      );
    });

    it('should select default payment method and address', () => {
      function TestComponent() {
        const { selectedPaymentMethod, selectedAddress } = useOneClickCheckout();
        return (
          <div>
            <span data-testid="selected-payment">{selectedPaymentMethod?.id || 'none'}</span>
            <span data-testid="selected-address">{selectedAddress?.id || 'none'}</span>
          </div>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected-payment')).toHaveTextContent('pm-1');
      expect(screen.getByTestId('selected-address')).toHaveTextContent('addr-1');
    });

    it('should not enable one-click without payment methods', () => {
      function TestComponent() {
        const { canUseOneClick } = useOneClickCheckout();
        return <span data-testid="can-use">{canUseOneClick.toString()}</span>;
      }

      render(
        <TestWrapper paymentMethods={[]}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('can-use')).toHaveTextContent('false');
    });

    it('should not enable one-click without addresses', () => {
      function TestComponent() {
        const { canUseOneClick } = useOneClickCheckout();
        return <span data-testid="can-use">{canUseOneClick.toString()}</span>;
      }

      render(
        <TestWrapper addresses={[]}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('can-use')).toHaveTextContent('false');
    });

    it('should not count expired payment methods for one-click eligibility', () => {
      const expiredOnly: SavedPaymentMethod[] = [
        { ...mockPaymentMethods[2], isDefault: true },
      ];

      function TestComponent() {
        const { canUseOneClick } = useOneClickCheckout();
        return <span data-testid="can-use">{canUseOneClick.toString()}</span>;
      }

      render(
        <TestWrapper paymentMethods={expiredOnly}>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('can-use')).toHaveTextContent('false');
    });
  });

  describe('BuyNowButton', () => {
    it('should render buy now button', () => {
      render(
        <TestWrapper>
          <BuyNowButton />
        </TestWrapper>
      );

      expect(screen.getByTestId('buy-now-button')).toBeInTheDocument();
      expect(screen.getByText('Buy Now')).toBeInTheDocument();
    });

    it('should be disabled when one-click is not available', () => {
      render(
        <TestWrapper paymentMethods={[]}>
          <BuyNowButton />
        </TestWrapper>
      );

      expect(screen.getByTestId('buy-now-button')).toBeDisabled();
    });

    it('should call onSuccess on successful checkout', async () => {
      const onSuccess = vi.fn();
      const onCheckout = vi.fn().mockResolvedValue('order-123');

      render(
        <TestWrapper onCheckout={onCheckout}>
          <BuyNowButton onSuccess={onSuccess} productId="prod-1" quantity={2} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('buy-now-button'));

      await waitFor(() => {
        expect(onCheckout).toHaveBeenCalledWith({
          paymentMethodId: 'pm-1',
          addressId: 'addr-1',
          productId: 'prod-1',
          quantity: 2,
        });
        expect(onSuccess).toHaveBeenCalledWith('order-123');
      });
    });

    it('should call onError on failed checkout', async () => {
      const onError = vi.fn();
      const onCheckout = vi.fn().mockResolvedValue(null);

      render(
        <TestWrapper onCheckout={onCheckout}>
          <BuyNowButton onError={onError} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('buy-now-button'));

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    it('should show loading state during checkout', async () => {
      const onCheckout = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('order-123'), 100))
      );

      render(
        <TestWrapper onCheckout={onCheckout}>
          <BuyNowButton />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('buy-now-button'));

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should have accessibility label', () => {
      render(
        <TestWrapper>
          <BuyNowButton />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Buy now with one click')).toBeInTheDocument();
    });
  });

  describe('PaymentMethodCard', () => {
    it('should render card payment method', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} />
        </TestWrapper>
      );

      expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('Expires 12/25')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should render PayPal payment method', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[1]} />
        </TestWrapper>
      );

      expect(screen.getByText('PayPal (test@example.com)')).toBeInTheDocument();
    });

    it('should show expired badge for expired cards', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[2]} />
        </TestWrapper>
      );

      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('should show selected state', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} isSelected />
        </TestWrapper>
      );

      expect(screen.getByTestId('payment-method-pm-1')).toHaveAttribute('aria-selected', 'true');
    });

    it('should call onSelect when clicked', async () => {
      const onSelect = vi.fn();

      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} onSelect={onSelect} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('payment-method-pm-1'));
      expect(onSelect).toHaveBeenCalled();
    });

    it('should call onSetDefault when set default button is clicked', async () => {
      const onSetDefault = vi.fn();

      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[1]} onSetDefault={onSetDefault} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('set-default-payment-pm-2'));
      expect(onSetDefault).toHaveBeenCalled();
    });

    it('should call onRemove when remove button is clicked', async () => {
      const onRemove = vi.fn();

      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} onRemove={onRemove} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('remove-payment-pm-1'));
      expect(onRemove).toHaveBeenCalled();
    });

    it('should hide Set Default button for default method', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('set-default-payment-pm-1')).not.toBeInTheDocument();
    });
  });

  describe('SavedAddressCard', () => {
    it('should render address details', () => {
      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[0]} />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
    });

    it('should show default badge', () => {
      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[0]} />
        </TestWrapper>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should render address with address2', () => {
      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[1]} />
        </TestWrapper>
      );

      expect(screen.getByText('456 Oak Ave, Apt 2B')).toBeInTheDocument();
    });

    it('should show selected state', () => {
      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[0]} isSelected />
        </TestWrapper>
      );

      expect(screen.getByTestId('address-addr-1')).toHaveAttribute('aria-selected', 'true');
    });

    it('should call onSelect when clicked', async () => {
      const onSelect = vi.fn();

      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[0]} onSelect={onSelect} />
        </TestWrapper>
      );

      await userEvent.click(screen.getByTestId('address-addr-1'));
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('OneClickSummary', () => {
    it('should render summary when one-click is available', () => {
      render(
        <TestWrapper>
          <OneClickSummary />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-summary')).toBeInTheDocument();
      expect(screen.getByText('One-Click Checkout')).toBeInTheDocument();
    });

    it('should show disabled message when one-click is not available', () => {
      render(
        <TestWrapper paymentMethods={[]}>
          <OneClickSummary />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-summary-disabled')).toBeInTheDocument();
    });

    it('should display selected payment method', () => {
      render(
        <TestWrapper>
          <OneClickSummary />
        </TestWrapper>
      );

      expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
    });

    it('should display selected address', () => {
      render(
        <TestWrapper>
          <OneClickSummary />
        </TestWrapper>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
    });

    it('should show edit links when enabled', () => {
      const onEditPayment = vi.fn();
      const onEditAddress = vi.fn();

      render(
        <TestWrapper>
          <OneClickSummary
            showEditLinks
            onEditPayment={onEditPayment}
            onEditAddress={onEditAddress}
          />
        </TestWrapper>
      );

      expect(screen.getAllByText('Change').length).toBe(2);
    });

    it('should hide edit links when disabled', () => {
      render(
        <TestWrapper>
          <OneClickSummary showEditLinks={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Change')).not.toBeInTheDocument();
    });
  });

  describe('PaymentMethodsSelector', () => {
    it('should render all payment methods', () => {
      render(
        <TestWrapper>
          <PaymentMethodsSelector />
        </TestWrapper>
      );

      expect(screen.getByTestId('payment-methods-selector')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-pm-1')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-pm-2')).toBeInTheDocument();
      expect(screen.getByTestId('payment-method-pm-3')).toBeInTheDocument();
    });

    it('should show empty state when no payment methods', () => {
      render(
        <TestWrapper paymentMethods={[]}>
          <PaymentMethodsSelector />
        </TestWrapper>
      );

      expect(screen.getByTestId('no-payment-methods')).toBeInTheDocument();
      expect(screen.getByText('No saved payment methods')).toBeInTheDocument();
    });

    it('should select payment method on click', async () => {
      function TestComponent() {
        const { selectedPaymentMethod } = useOneClickCheckout();
        return (
          <div>
            <span data-testid="selected">{selectedPaymentMethod?.id}</span>
            <PaymentMethodsSelector />
          </div>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected')).toHaveTextContent('pm-1');

      await userEvent.click(screen.getByTestId('payment-method-pm-2'));

      expect(screen.getByTestId('selected')).toHaveTextContent('pm-2');
    });
  });

  describe('AddressesSelector', () => {
    it('should render all addresses', () => {
      render(
        <TestWrapper>
          <AddressesSelector />
        </TestWrapper>
      );

      expect(screen.getByTestId('addresses-selector')).toBeInTheDocument();
      expect(screen.getByTestId('address-addr-1')).toBeInTheDocument();
      expect(screen.getByTestId('address-addr-2')).toBeInTheDocument();
    });

    it('should show empty state when no addresses', () => {
      render(
        <TestWrapper addresses={[]}>
          <AddressesSelector />
        </TestWrapper>
      );

      expect(screen.getByTestId('no-addresses')).toBeInTheDocument();
      expect(screen.getByText('No saved addresses')).toBeInTheDocument();
    });

    it('should select address on click', async () => {
      function TestComponent() {
        const { selectedAddress } = useOneClickCheckout();
        return (
          <div>
            <span data-testid="selected">{selectedAddress?.id}</span>
            <AddressesSelector />
          </div>
        );
      }

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected')).toHaveTextContent('addr-1');

      await userEvent.click(screen.getByTestId('address-addr-2'));

      expect(screen.getByTestId('selected')).toHaveTextContent('addr-2');
    });
  });

  describe('OneClickSettingsToggle', () => {
    it('should render toggle button', () => {
      render(
        <TestWrapper>
          <OneClickSettingsToggle />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-settings')).toBeInTheDocument();
      expect(screen.getByText('One-Click Checkout')).toBeInTheDocument();
    });

    it('should show Enabled when one-click is enabled', () => {
      render(
        <TestWrapper>
          <OneClickSettingsToggle />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-toggle')).toHaveTextContent('Enabled');
    });

    it('should toggle one-click on/off', async () => {
      render(
        <TestWrapper>
          <OneClickSettingsToggle />
        </TestWrapper>
      );

      const toggle = screen.getByTestId('one-click-toggle');
      expect(toggle).toHaveTextContent('Enabled');

      await userEvent.click(toggle);
      expect(toggle).toHaveTextContent('Disabled');

      await userEvent.click(toggle);
      expect(toggle).toHaveTextContent('Enabled');
    });

    it('should have aria-pressed attribute', () => {
      render(
        <TestWrapper>
          <OneClickSettingsToggle />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-toggle')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('OneClickCheckout (main component)', () => {
    it('should render the full checkout component', () => {
      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
        />
      );

      expect(screen.getByTestId('one-click-checkout')).toBeInTheDocument();
      expect(screen.getByText('Quick Checkout')).toBeInTheDocument();
    });

    it('should display product preview', () => {
      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
          productName="Test Product"
          productPrice={29.99}
          quantity={2}
          productImage="/test.jpg"
        />
      );

      expect(screen.getByTestId('product-preview')).toBeInTheDocument();
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('$59.98')).toBeInTheDocument();
    });

    it('should include buy now button', () => {
      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
        />
      );

      expect(screen.getByTestId('buy-now-button')).toBeInTheDocument();
    });

    it('should show cancel button when onCancel is provided', () => {
      const onCancel = vi.fn();

      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
          onCancel={onCancel}
        />
      );

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();

      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
          onCancel={onCancel}
        />
      );

      await userEvent.click(screen.getByTestId('cancel-button'));
      expect(onCancel).toHaveBeenCalled();
    });

    it('should include checkout summary', () => {
      render(
        <OneClickCheckout
          paymentMethods={mockPaymentMethods}
          addresses={mockAddresses}
        />
      );

      expect(screen.getByTestId('one-click-summary')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on buy now button', () => {
      render(
        <TestWrapper>
          <BuyNowButton />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Buy now with one click')).toBeInTheDocument();
    });

    it('should have aria-selected on payment method cards', () => {
      render(
        <TestWrapper>
          <PaymentMethodCard method={mockPaymentMethods[0]} isSelected />
        </TestWrapper>
      );

      expect(screen.getByTestId('payment-method-pm-1')).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-selected on address cards', () => {
      render(
        <TestWrapper>
          <SavedAddressCard address={mockAddresses[0]} isSelected />
        </TestWrapper>
      );

      expect(screen.getByTestId('address-addr-1')).toHaveAttribute('aria-selected', 'true');
    });

    it('should have aria-pressed on settings toggle', () => {
      render(
        <TestWrapper>
          <OneClickSettingsToggle />
        </TestWrapper>
      );

      expect(screen.getByTestId('one-click-toggle')).toHaveAttribute('aria-pressed');
    });
  });

  describe('Context Actions', () => {
    it('should set default payment method', async () => {
      const onSetDefaultPaymentMethod = vi.fn();

      render(
        <OneClickCheckoutProvider
          initialPaymentMethods={mockPaymentMethods}
          initialAddresses={mockAddresses}
          onSetDefaultPaymentMethod={onSetDefaultPaymentMethod}
        >
          <PaymentMethodsSelector />
        </OneClickCheckoutProvider>
      );

      await userEvent.click(screen.getByTestId('set-default-payment-pm-2'));

      expect(onSetDefaultPaymentMethod).toHaveBeenCalledWith('pm-2');
    });

    it('should set default address', async () => {
      const onSetDefaultAddress = vi.fn();

      render(
        <OneClickCheckoutProvider
          initialPaymentMethods={mockPaymentMethods}
          initialAddresses={mockAddresses}
          onSetDefaultAddress={onSetDefaultAddress}
        >
          <AddressesSelector />
        </OneClickCheckoutProvider>
      );

      await userEvent.click(screen.getByTestId('set-default-address-addr-2'));

      expect(onSetDefaultAddress).toHaveBeenCalledWith('addr-2');
    });

    it('should remove payment method', async () => {
      const onRemovePaymentMethod = vi.fn();

      render(
        <OneClickCheckoutProvider
          initialPaymentMethods={mockPaymentMethods}
          initialAddresses={mockAddresses}
          onRemovePaymentMethod={onRemovePaymentMethod}
        >
          <PaymentMethodsSelector />
        </OneClickCheckoutProvider>
      );

      await userEvent.click(screen.getByTestId('remove-payment-pm-1'));

      expect(onRemovePaymentMethod).toHaveBeenCalledWith('pm-1');
    });

    it('should remove address', async () => {
      const onRemoveAddress = vi.fn();

      render(
        <OneClickCheckoutProvider
          initialPaymentMethods={mockPaymentMethods}
          initialAddresses={mockAddresses}
          onRemoveAddress={onRemoveAddress}
        >
          <AddressesSelector />
        </OneClickCheckoutProvider>
      );

      await userEvent.click(screen.getByTestId('remove-address-addr-1'));

      expect(onRemoveAddress).toHaveBeenCalledWith('addr-1');
    });
  });
});
