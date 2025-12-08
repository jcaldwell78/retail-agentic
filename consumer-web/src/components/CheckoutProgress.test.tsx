import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CheckoutProgress,
  CheckoutProgressText,
  CheckoutBreadcrumb,
  CheckoutProgressBar,
  type CheckoutStep,
} from './CheckoutProgress';

describe('CheckoutProgress', () => {
  const steps: CheckoutStep[] = ['cart', 'information', 'shipping', 'payment', 'confirmation'];

  describe('Default variant', () => {
    it('should render checkout progress', () => {
      render(<CheckoutProgress currentStep="cart" />);
      expect(screen.getByTestId('checkout-progress')).toBeInTheDocument();
    });

    it('should render all step indicators', () => {
      render(<CheckoutProgress currentStep="cart" />);
      steps.forEach((step) => {
        expect(screen.getByTestId(`step-indicator-${step}`)).toBeInTheDocument();
      });
    });

    it('should show step labels', () => {
      render(<CheckoutProgress currentStep="cart" />);
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Confirmation')).toBeInTheDocument();
    });

    it('should mark current step as active', () => {
      render(<CheckoutProgress currentStep="shipping" />);
      const shippingStep = screen.getByTestId('step-indicator-shipping');
      expect(shippingStep).toHaveAttribute('data-active', 'true');
    });

    it('should mark previous steps as completed', () => {
      render(<CheckoutProgress currentStep="shipping" />);
      expect(screen.getByTestId('step-indicator-cart')).toHaveAttribute(
        'data-completed',
        'true'
      );
      expect(screen.getByTestId('step-indicator-information')).toHaveAttribute(
        'data-completed',
        'true'
      );
    });

    it('should mark future steps as not completed', () => {
      render(<CheckoutProgress currentStep="shipping" />);
      expect(screen.getByTestId('step-indicator-payment')).toHaveAttribute(
        'data-completed',
        'false'
      );
      expect(screen.getByTestId('step-indicator-confirmation')).toHaveAttribute(
        'data-completed',
        'false'
      );
    });
  });

  describe('Step click handler', () => {
    it('should call onStepClick when clicking completed steps', async () => {
      const handleClick = vi.fn();
      render(
        <CheckoutProgress
          currentStep="shipping"
          onStepClick={handleClick}
        />
      );

      await userEvent.click(screen.getByTestId('step-indicator-cart'));
      expect(handleClick).toHaveBeenCalledWith('cart');
    });

    it('should call onStepClick when clicking current step', async () => {
      const handleClick = vi.fn();
      render(
        <CheckoutProgress
          currentStep="shipping"
          onStepClick={handleClick}
        />
      );

      await userEvent.click(screen.getByTestId('step-indicator-shipping'));
      expect(handleClick).toHaveBeenCalledWith('shipping');
    });

    it('should not call onStepClick when clicking future steps', async () => {
      const handleClick = vi.fn();
      render(
        <CheckoutProgress
          currentStep="shipping"
          onStepClick={handleClick}
        />
      );

      await userEvent.click(screen.getByTestId('step-indicator-payment'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Completed steps override', () => {
    it('should mark manually completed steps', () => {
      render(
        <CheckoutProgress
          currentStep="cart"
          completedSteps={['payment']}
        />
      );
      expect(screen.getByTestId('step-indicator-payment')).toHaveAttribute(
        'data-completed',
        'true'
      );
    });
  });

  describe('Compact variant', () => {
    it('should render compact progress', () => {
      render(<CheckoutProgress currentStep="cart" variant="compact" />);
      expect(screen.getByTestId('checkout-progress')).toBeInTheDocument();
    });

    it('should not show labels in compact mode', () => {
      render(<CheckoutProgress currentStep="cart" variant="compact" />);
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
    });
  });

  describe('Vertical variant', () => {
    it('should render vertical progress', () => {
      render(<CheckoutProgress currentStep="shipping" variant="vertical" />);
      expect(screen.getByTestId('checkout-progress-vertical')).toBeInTheDocument();
    });

    it('should show step descriptions in vertical mode', () => {
      render(<CheckoutProgress currentStep="shipping" variant="vertical" />);
      expect(screen.getByText('Choose shipping method')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      render(<CheckoutProgress currentStep="cart" />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      render(<CheckoutProgress currentStep="cart" />);
      expect(
        screen.getByRole('navigation', { name: 'Checkout progress' })
      ).toBeInTheDocument();
    });

    it('should mark current step with aria-current', () => {
      render(<CheckoutProgress currentStep="shipping" />);
      const shippingStep = screen.getByTestId('step-indicator-shipping');
      expect(shippingStep).toHaveAttribute('aria-current', 'step');
    });
  });
});

describe('CheckoutProgressText', () => {
  it('should render text progress', () => {
    render(<CheckoutProgressText currentStep="shipping" />);
    expect(screen.getByTestId('checkout-progress-text')).toBeInTheDocument();
  });

  it('should display correct step number', () => {
    render(<CheckoutProgressText currentStep="shipping" />);
    expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
  });

  it('should display current step label', () => {
    render(<CheckoutProgressText currentStep="shipping" />);
    expect(screen.getByText('Shipping')).toBeInTheDocument();
  });

  it('should update for different steps', () => {
    const { rerender } = render(<CheckoutProgressText currentStep="cart" />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();

    rerender(<CheckoutProgressText currentStep="payment" />);
    expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
  });
});

describe('CheckoutBreadcrumb', () => {
  it('should render breadcrumb navigation', () => {
    render(<CheckoutBreadcrumb currentStep="shipping" />);
    expect(screen.getByTestId('checkout-breadcrumb')).toBeInTheDocument();
  });

  it('should display all step labels', () => {
    render(<CheckoutBreadcrumb currentStep="shipping" />);
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('should have clickable completed steps', async () => {
    const handleClick = vi.fn();
    render(
      <CheckoutBreadcrumb
        currentStep="shipping"
        onStepClick={handleClick}
      />
    );

    await userEvent.click(screen.getByText('Cart'));
    expect(handleClick).toHaveBeenCalledWith('cart');
  });

  it('should have aria-current on current step', () => {
    render(<CheckoutBreadcrumb currentStep="shipping" />);
    expect(screen.getByText('Shipping')).toHaveAttribute('aria-current', 'step');
  });
});

describe('CheckoutProgressBar', () => {
  it('should render progress bar', () => {
    render(<CheckoutProgressBar currentStep="shipping" />);
    expect(screen.getByTestId('checkout-progress-bar')).toBeInTheDocument();
  });

  it('should have progressbar role', () => {
    render(<CheckoutProgressBar currentStep="shipping" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should calculate correct progress for first step', () => {
    render(<CheckoutProgressBar currentStep="cart" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('should calculate correct progress for middle step', () => {
    render(<CheckoutProgressBar currentStep="shipping" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('should calculate correct progress for last step', () => {
    render(<CheckoutProgressBar currentStep="confirmation" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('should display step labels', () => {
    render(<CheckoutProgressBar currentStep="shipping" />);
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });
});

describe('Step transitions', () => {
  it('should handle all step transitions', () => {
    const steps: CheckoutStep[] = ['cart', 'information', 'shipping', 'payment', 'confirmation'];

    const { rerender, unmount } = render(<CheckoutProgress currentStep="cart" />);

    steps.forEach((step, index) => {
      rerender(<CheckoutProgress currentStep={step} />);

      // Verify current step is active
      expect(screen.getByTestId(`step-indicator-${step}`)).toHaveAttribute(
        'data-active',
        'true'
      );

      // Verify previous steps are completed
      for (let i = 0; i < index; i++) {
        expect(screen.getByTestId(`step-indicator-${steps[i]}`)).toHaveAttribute(
          'data-completed',
          'true'
        );
      }

      // Verify future steps are not completed
      for (let i = index + 1; i < steps.length; i++) {
        expect(screen.getByTestId(`step-indicator-${steps[i]}`)).toHaveAttribute(
          'data-completed',
          'false'
        );
      }
    });

    unmount();
  });
});
