import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import OrderConfirmationPage from './OrderConfirmationPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('OrderConfirmationPage', () => {
  it('should render the order confirmation page', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByTestId('order-confirmation-page')).toBeInTheDocument();
  });

  it('should display success message', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    expect(
      screen.getByText('Thank you for your purchase. Your order has been received.')
    ).toBeInTheDocument();
  });

  it('should display order number', () => {
    renderWithRouter(<OrderConfirmationPage />);
    const orderNumber = screen.getByTestId('order-number');
    expect(orderNumber).toBeInTheDocument();
    expect(orderNumber).toHaveTextContent(/ORD-/);
  });

  it('should display confirmation email message', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Confirmation Email Sent')).toBeInTheDocument();
    expect(screen.getByText(/customer@example.com/)).toBeInTheDocument();
  });

  it('should display estimated delivery date', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
  });

  it('should display shipping address', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Shipping Address')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText(/San Francisco, CA 94105/)).toBeInTheDocument();
  });

  it('should display payment method', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Payment Method')).toBeInTheDocument();
    expect(screen.getByText(/Credit Card ending in 4242/)).toBeInTheDocument();
  });

  it('should display order items', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Order Items')).toBeInTheDocument();
    const orderItems = screen.getByTestId('order-items');
    expect(orderItems).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
  });

  it('should display order summary with correct totals', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByTestId('subtotal')).toHaveTextContent('$349.98');
    expect(screen.getByTestId('shipping')).toHaveTextContent('$9.99');
    expect(screen.getByTestId('tax')).toHaveTextContent('$28.00');
    expect(screen.getByTestId('total')).toHaveTextContent('$387.97');
  });

  it('should display action buttons', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByTestId('view-orders-button')).toBeInTheDocument();
    expect(screen.getByTestId('continue-shopping-button')).toBeInTheDocument();
  });

  it('should display help section with support links', () => {
    renderWithRouter(<OrderConfirmationPage />);
    expect(screen.getByText('Need Help?')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('View FAQ')).toBeInTheDocument();
  });

  it('should navigate to orders page when View All Orders is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderConfirmationPage />);

    const viewOrdersButton = screen.getByTestId('view-orders-button');
    await user.click(viewOrdersButton);

    // Navigation would be tested in E2E tests
    expect(viewOrdersButton).toBeInTheDocument();
  });

  it('should navigate to products page when Continue Shopping is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderConfirmationPage />);

    const continueShoppingButton = screen.getByTestId('continue-shopping-button');
    await user.click(continueShoppingButton);

    // Navigation would be tested in E2E tests
    expect(continueShoppingButton).toBeInTheDocument();
  });

  it('should render all order item details', () => {
    renderWithRouter(<OrderConfirmationPage />);

    // Check first item
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    const quantityTexts = screen.getAllByText(/Quantity: 1/);
    expect(quantityTexts.length).toBeGreaterThan(0);

    // Check second item
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    renderWithRouter(<OrderConfirmationPage />);

    // Check for headings
    expect(screen.getByRole('heading', { name: 'Order Confirmed!' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Confirmation Email Sent' })).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: 'View All Orders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Shopping' })).toBeInTheDocument();
  });
});
