import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentGatewaySettings, {
  PaymentGatewayConfig,
} from './PaymentGatewaySettings';

describe('PaymentGatewaySettings', () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onTestConnection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn();
    onTestConnection = vi.fn();
  });

  describe('Rendering', () => {
    it('should render the component with title', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByText('Payment Gateway Configuration')).toBeInTheDocument();
    });

    it('should render PayPal and Stripe tabs', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByTestId('paypal-tab')).toBeInTheDocument();
      expect(screen.getByTestId('stripe-tab')).toBeInTheDocument();
    });

    it('should show PayPal tab by default', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByLabelText(/enable paypal payments/i)).toBeInTheDocument();
    });

    it('should show security best practices', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByText('Security Best Practices')).toBeInTheDocument();
      expect(screen.getByText(/never share your api keys/i)).toBeInTheDocument();
    });
  });

  describe('PayPal Configuration', () => {
    it('should render PayPal configuration fields', () => {
      render(<PaymentGatewaySettings />);
      expect(screen.getByTestId('paypal-enabled')).toBeInTheDocument();
      expect(screen.getByTestId('paypal-mode')).toBeInTheDocument();
      expect(screen.getByTestId('paypal-client-id')).toBeInTheDocument();
      expect(screen.getByTestId('paypal-client-secret')).toBeInTheDocument();
    });

    it('should load existing PayPal configuration', () => {
      const config: PaymentGatewayConfig = {
        paypal: {
          enabled: true,
          mode: 'live',
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
          webhookId: 'test-webhook',
        },
      };

      render(<PaymentGatewaySettings config={config} />);

      expect(screen.getByTestId('paypal-enabled')).toBeChecked();
      expect(screen.getByTestId('paypal-mode')).toHaveValue('live');
      expect(screen.getByTestId('paypal-client-id')).toHaveValue('test-client-id');
      expect(screen.getByTestId('paypal-client-secret')).toHaveValue('test-secret');
      expect(screen.getByTestId('paypal-webhook-id')).toHaveValue('test-webhook');
    });

    it('should toggle PayPal enabled checkbox', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const checkbox = screen.getByTestId('paypal-enabled');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should change PayPal mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const modeSelect = screen.getByTestId('paypal-mode');
      expect(modeSelect).toHaveValue('sandbox');

      await user.selectOptions(modeSelect, 'live');
      expect(modeSelect).toHaveValue('live');
    });

    it('should update PayPal client ID', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const clientIdInput = screen.getByTestId('paypal-client-id');
      await user.type(clientIdInput, 'new-client-id');

      expect(clientIdInput).toHaveValue('new-client-id');
    });

    it('should toggle PayPal secret visibility', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      const secretInput = screen.getByTestId('paypal-client-secret');
      const toggleButton = screen.getByTestId('toggle-paypal-secret');

      expect(secretInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(secretInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(secretInput).toHaveAttribute('type', 'password');
    });

    it('should disable save button without required fields', () => {
      render(<PaymentGatewaySettings />);
      const saveButton = screen.getByTestId('save-paypal-button');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button with required fields', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings onSave={onSave} />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test-id');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test-secret');

      const saveButton = screen.getByTestId('save-paypal-button');
      expect(saveButton).toBeEnabled();
    });

    it('should call onSave with PayPal configuration', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings onSave={onSave} />);

      await user.click(screen.getByTestId('paypal-enabled'));
      await user.selectOptions(screen.getByTestId('paypal-mode'), 'live');
      await user.type(screen.getByTestId('paypal-client-id'), 'test-id');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test-secret');
      await user.type(screen.getByTestId('paypal-webhook-id'), 'test-webhook');

      const saveButton = screen.getByTestId('save-paypal-button');
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        paypal: {
          enabled: true,
          mode: 'live',
          clientId: 'test-id',
          clientSecret: 'test-secret',
          webhookId: 'test-webhook',
        },
        stripe: {
          enabled: false,
          mode: 'test',
          publishableKey: '',
          secretKey: '',
          webhookSecret: '',
        },
      });
    });

    it('should test PayPal connection', async () => {
      const user = userEvent.setup();
      onTestConnection.mockResolvedValue({ success: true, message: 'Connection successful' });

      render(<PaymentGatewaySettings onTestConnection={onTestConnection} />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test-id');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test-secret');

      const testButton = screen.getByTestId('test-paypal-button');
      await user.click(testButton);

      await waitFor(() => {
        expect(onTestConnection).toHaveBeenCalledWith('paypal');
        expect(screen.getByTestId('paypal-test-result')).toBeInTheDocument();
        expect(screen.getByText('Connection successful')).toBeInTheDocument();
      });
    });

    it('should show error on failed PayPal connection test', async () => {
      const user = userEvent.setup();
      onTestConnection.mockResolvedValue({ success: false, message: 'Invalid credentials' });

      render(<PaymentGatewaySettings onTestConnection={onTestConnection} />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test-id');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test-secret');

      const testButton = screen.getByTestId('test-paypal-button');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByTestId('paypal-test-result')).toBeInTheDocument();
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('should show Active badge when PayPal is enabled', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByTestId('paypal-enabled'));

      const paypalTab = screen.getByTestId('paypal-tab');
      expect(paypalTab).toHaveTextContent('Active');
    });
  });

  describe('Stripe Configuration', () => {
    it('should render Stripe configuration fields', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByTestId('stripe-tab'));

      expect(screen.getByTestId('stripe-enabled')).toBeInTheDocument();
      expect(screen.getByTestId('stripe-mode')).toBeInTheDocument();
      expect(screen.getByTestId('stripe-publishable-key')).toBeInTheDocument();
      expect(screen.getByTestId('stripe-secret-key')).toBeInTheDocument();
    });

    it('should load existing Stripe configuration', async () => {
      const user = userEvent.setup();
      const config: PaymentGatewayConfig = {
        stripe: {
          enabled: true,
          mode: 'live',
          publishableKey: 'pk_live_test',
          secretKey: 'sk_live_test',
          webhookSecret: 'whsec_test',
        },
      };

      render(<PaymentGatewaySettings config={config} />);

      await user.click(screen.getByTestId('stripe-tab'));

      expect(screen.getByTestId('stripe-enabled')).toBeChecked();
      expect(screen.getByTestId('stripe-mode')).toHaveValue('live');
      expect(screen.getByTestId('stripe-publishable-key')).toHaveValue('pk_live_test');
      expect(screen.getByTestId('stripe-secret-key')).toHaveValue('sk_live_test');
      expect(screen.getByTestId('stripe-webhook-secret')).toHaveValue('whsec_test');
    });

    it('should toggle Stripe enabled checkbox', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByTestId('stripe-tab'));

      const checkbox = screen.getByTestId('stripe-enabled');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should change Stripe mode', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByTestId('stripe-tab'));

      const modeSelect = screen.getByTestId('stripe-mode');
      expect(modeSelect).toHaveValue('test');

      await user.selectOptions(modeSelect, 'live');
      expect(modeSelect).toHaveValue('live');
    });

    it('should toggle Stripe secret visibility', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.click(screen.getByTestId('stripe-tab'));

      const secretInput = screen.getByTestId('stripe-secret-key');
      const toggleButton = screen.getByTestId('toggle-stripe-secret');

      expect(secretInput).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(secretInput).toHaveAttribute('type', 'text');
    });

    it('should call onSave with Stripe configuration', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings onSave={onSave} />);

      await user.click(screen.getByTestId('stripe-tab'));

      await user.click(screen.getByTestId('stripe-enabled'));
      await user.selectOptions(screen.getByTestId('stripe-mode'), 'live');
      await user.type(screen.getByTestId('stripe-publishable-key'), 'pk_live_test');
      await user.type(screen.getByTestId('stripe-secret-key'), 'sk_live_test');
      await user.type(screen.getByTestId('stripe-webhook-secret'), 'whsec_test');

      const saveButton = screen.getByTestId('save-stripe-button');
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        paypal: {
          enabled: false,
          mode: 'sandbox',
          clientId: '',
          clientSecret: '',
          webhookId: '',
        },
        stripe: {
          enabled: true,
          mode: 'live',
          publishableKey: 'pk_live_test',
          secretKey: 'sk_live_test',
          webhookSecret: 'whsec_test',
        },
      });
    });

    it('should test Stripe connection', async () => {
      const user = userEvent.setup();
      onTestConnection.mockResolvedValue({ success: true, message: 'Stripe connected' });

      render(<PaymentGatewaySettings onTestConnection={onTestConnection} />);

      await user.click(screen.getByTestId('stripe-tab'));

      await user.type(screen.getByTestId('stripe-publishable-key'), 'pk_test');
      await user.type(screen.getByTestId('stripe-secret-key'), 'sk_test');

      const testButton = screen.getByTestId('test-stripe-button');
      await user.click(testButton);

      await waitFor(() => {
        expect(onTestConnection).toHaveBeenCalledWith('stripe');
        expect(screen.getByTestId('stripe-test-result')).toBeInTheDocument();
        expect(screen.getByText('Stripe connected')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callbacks gracefully', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test');

      const saveButton = screen.getByTestId('save-paypal-button');
      await expect(user.click(saveButton)).resolves.not.toThrow();
    });

    it('should handle test connection error', async () => {
      const user = userEvent.setup();
      onTestConnection.mockRejectedValue(new Error('Network error'));

      render(<PaymentGatewaySettings onTestConnection={onTestConnection} />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test');

      const testButton = screen.getByTestId('test-paypal-button');
      await user.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should disable test button while testing', async () => {
      const user = userEvent.setup();
      onTestConnection.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, message: 'OK' }), 100))
      );

      render(<PaymentGatewaySettings onTestConnection={onTestConnection} />);

      await user.type(screen.getByTestId('paypal-client-id'), 'test');
      await user.type(screen.getByTestId('paypal-client-secret'), 'test');

      const testButton = screen.getByTestId('test-paypal-button');
      await user.click(testButton);

      expect(testButton).toHaveTextContent('Testing...');
      expect(testButton).toBeDisabled();

      await waitFor(() => {
        expect(testButton).toHaveTextContent('Test Connection');
      });
    });

    it('should preserve configuration when switching tabs', async () => {
      const user = userEvent.setup();
      render(<PaymentGatewaySettings />);

      // Configure PayPal
      await user.type(screen.getByTestId('paypal-client-id'), 'paypal-id');

      // Switch to Stripe
      await user.click(screen.getByTestId('stripe-tab'));
      await user.type(screen.getByTestId('stripe-publishable-key'), 'stripe-key');

      // Switch back to PayPal
      await user.click(screen.getByTestId('paypal-tab'));

      // PayPal config should be preserved
      expect(screen.getByTestId('paypal-client-id')).toHaveValue('paypal-id');
    });
  });
});
