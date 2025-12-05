import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import CheckoutPage from './CheckoutPage';

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

describe('CheckoutPage', () => {
  it('should render the checkout page', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
  });

  it('should display checkout heading', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('should display order summary', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
  });

  it('should display cart items in summary', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('Wireless Headphones')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Smart Watch')[0]).toBeInTheDocument();
  });
});

describe('CheckoutPage - Progress Steps', () => {
  it('should display all checkout steps', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing').length).toBeGreaterThan(0);
    expect(screen.getByText('Delivery')).toBeInTheDocument();
    expect(screen.getAllByText('Payment').length).toBeGreaterThan(0);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('should highlight current step', () => {
    renderWithRouter(<CheckoutPage />);
    const shippingStep = screen.getByTestId('step-shipping');
    expect(shippingStep).toHaveClass('bg-blue-600');
  });
});

describe('CheckoutPage - Shipping Form', () => {
  it('should display shipping address form', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByRole('heading', { name: 'Shipping Address' })).toBeInTheDocument();
    expect(screen.getByTestId('shipping-form')).toBeInTheDocument();
  });

  it('should display all shipping form fields', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByTestId('fullName')).toBeInTheDocument();
    expect(screen.getByTestId('email')).toBeInTheDocument();
    expect(screen.getByTestId('phone')).toBeInTheDocument();
    expect(screen.getByTestId('address')).toBeInTheDocument();
    expect(screen.getByTestId('city')).toBeInTheDocument();
    expect(screen.getByTestId('state')).toBeInTheDocument();
    expect(screen.getByTestId('zipCode')).toBeInTheDocument();
    expect(screen.getByTestId('country')).toBeInTheDocument();
  });

  it('should allow typing in shipping form fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');

    expect(screen.getByTestId('fullName')).toHaveValue('John Doe');
    expect(screen.getByTestId('email')).toHaveValue('john@example.com');
    expect(screen.getByTestId('phone')).toHaveValue('5551234567');
  });

  it('should display back to cart button', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByTestId('back-to-cart')).toBeInTheDocument();
  });

  it('should navigate to cart when back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    await user.click(screen.getByTestId('back-to-cart'));
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
  });

  it('should advance to billing step on form submission', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');

    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Billing Address' })).toBeInTheDocument();
    });
  });
});

describe('CheckoutPage - Billing Form', () => {
  it('should display same as shipping checkbox', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    // Fill shipping form
    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('same-as-shipping')).toBeInTheDocument();
      expect(screen.getByTestId('same-as-shipping')).toBeChecked();
    });
  });

  it('should show billing fields when same as shipping is unchecked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    // Fill shipping form
    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('same-as-shipping')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('same-as-shipping'));

    expect(screen.getByTestId('billing-fullName')).toBeInTheDocument();
    expect(screen.getByTestId('billing-address')).toBeInTheDocument();
    expect(screen.getByTestId('billing-city')).toBeInTheDocument();
  });

  it('should allow going back to shipping step', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    // Fill shipping form
    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('back-to-shipping')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('back-to-shipping'));

    expect(screen.getByRole('heading', { name: 'Shipping Address' })).toBeInTheDocument();
  });
});

describe('CheckoutPage - Shipping Method', () => {
  it('should display shipping method options', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    // Navigate to shipping method step
    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('back-to-shipping')).toBeInTheDocument();
    });

    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Delivery Method' })).toBeInTheDocument();
      expect(screen.getByTestId('shipping-standard')).toBeInTheDocument();
      expect(screen.getByTestId('shipping-express')).toBeInTheDocument();
      expect(screen.getByTestId('shipping-overnight')).toBeInTheDocument();
    });
  });

  it('should select shipping method', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CheckoutPage />);

    // Navigate to shipping method step
    await user.type(screen.getByTestId('fullName'), 'John Doe');
    await user.type(screen.getByTestId('email'), 'john@example.com');
    await user.type(screen.getByTestId('phone'), '5551234567');
    await user.type(screen.getByTestId('address'), '123 Main St');
    await user.type(screen.getByTestId('city'), 'San Francisco');
    await user.type(screen.getByTestId('state'), 'CA');
    await user.type(screen.getByTestId('zipCode'), '94102');
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);
    await waitFor(() => screen.getByTestId('back-to-shipping'));
    await user.click(screen.getAllByTestId('continue-to-payment')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('shipping-express')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('shipping-express'));

    const expressOption = screen.getByTestId('shipping-express');
    expect(expressOption).toHaveClass('border-blue-600');
  });
});

describe('CheckoutPage - Order Summary', () => {
  it('should display subtotal', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('$349.98').length).toBeGreaterThan(0);
  });

  it('should display shipping cost', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('$9.99').length).toBeGreaterThan(0);
  });

  it('should display tax', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('$28.00').length).toBeGreaterThan(0);
  });

  it('should display total', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getAllByText('$387.97').length).toBeGreaterThan(0);
  });

  it('should display security badge', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByText('Secure SSL encrypted checkout')).toBeInTheDocument();
  });
});

describe('CheckoutPage - Accessibility', () => {
  it('should have proper heading structure', () => {
    renderWithRouter(<CheckoutPage />);
    expect(screen.getByRole('heading', { name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shipping Address' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
  });

  it('should have required field indicators', () => {
    renderWithRouter(<CheckoutPage />);
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });
});
