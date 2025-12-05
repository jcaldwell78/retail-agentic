import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import OrderHistoryPage from './OrderHistoryPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('OrderHistoryPage', () => {
  it('should render the order history page', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('order-history-page')).toBeInTheDocument();
  });

  it('should display page heading', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByRole('heading', { name: 'Order History' })).toBeInTheDocument();
  });

  it('should display page description', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByText('View and track all your orders')).toBeInTheDocument();
  });
});

describe('OrderHistoryPage - Filters', () => {
  it('should display search input', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('order-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search orders or products...')).toBeInTheDocument();
  });

  it('should display status filter dropdown', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('should have all status options in filter', () => {
    renderWithRouter(<OrderHistoryPage />);

    expect(screen.getByRole('option', { name: 'All Orders' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Processing' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Shipped' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Delivered' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cancelled' })).toBeInTheDocument();
  });

  it('should have All Orders selected by default', () => {
    renderWithRouter(<OrderHistoryPage />);
    const statusFilter = screen.getByTestId('status-filter') as HTMLSelectElement;
    expect(statusFilter.value).toBe('all');
  });
});

describe('OrderHistoryPage - Orders Display', () => {
  it('should display all orders initially', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('orders-list')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-003')).toBeInTheDocument();
  });

  it('should display order numbers', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('order-number-1')).toHaveTextContent('ORD-2024-001');
    expect(screen.getByTestId('order-number-2')).toHaveTextContent('ORD-2024-002');
    expect(screen.getByTestId('order-number-3')).toHaveTextContent('ORD-2024-003');
  });

  it('should display order statuses', () => {
    renderWithRouter(<OrderHistoryPage />);
    const deliveredElements = screen.getAllByText('Delivered');
    const shippedElements = screen.getAllByText('Shipped');
    const processingElements = screen.getAllByText('Processing');

    // Each status appears in both dropdown and order badge
    expect(deliveredElements.length).toBeGreaterThan(0);
    expect(shippedElements.length).toBeGreaterThan(0);
    expect(processingElements.length).toBeGreaterThan(0);
  });

  it('should display order dates', () => {
    renderWithRouter(<OrderHistoryPage />);
    // Dates may vary by timezone, so just check the pattern
    const placedOnTexts = screen.getAllByText(/Placed on January \d+, 2024/);
    expect(placedOnTexts).toHaveLength(3);
  });

  it('should display order totals', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByTestId('order-total-1')).toHaveTextContent('$349.98');
    expect(screen.getByTestId('order-total-2')).toHaveTextContent('$99.98');
    expect(screen.getByTestId('order-total-3')).toHaveTextContent('$89.97');
  });

  it('should display tracking numbers when available', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByText('TRK1234567890')).toBeInTheDocument();
    expect(screen.getByText('TRK0987654321')).toBeInTheDocument();
  });

  it('should display order items', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
    expect(screen.getByText('Cotton T-Shirt')).toBeInTheDocument();
  });

  it('should display shipping addresses', () => {
    renderWithRouter(<OrderHistoryPage />);
    const shippingAddressHeadings = screen.getAllByText('Shipping Address');
    expect(shippingAddressHeadings).toHaveLength(3);

    const addresses = screen.getAllByText(/123 Main St/);
    expect(addresses.length).toBeGreaterThan(0);
  });
});

describe('OrderHistoryPage - Search Functionality', () => {
  it('should filter orders by order number', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'ORD-2024-001');

    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-003')).not.toBeInTheDocument();
  });

  it('should filter orders by product name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'headphones');

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-003')).not.toBeInTheDocument();
  });

  it('should be case insensitive when searching', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'LAPTOP');

    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
  });

  it('should show empty state when no orders match search', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'nonexistent product xyz');

    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
  });
});

describe('OrderHistoryPage - Status Filter', () => {
  it('should filter orders by delivered status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'delivered');

    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-003')).not.toBeInTheDocument();
  });

  it('should filter orders by shipped status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'shipped');

    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-003')).not.toBeInTheDocument();
  });

  it('should filter orders by processing status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'processing');

    expect(screen.getByText('ORD-2024-003')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
  });

  it('should show empty state when filtering by status with no matches', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const statusFilter = screen.getByTestId('status-filter');
    await user.selectOptions(statusFilter, 'cancelled');

    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
  });

  it('should combine search and status filters', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    const statusFilter = screen.getByTestId('status-filter');

    await user.type(searchInput, 'Watch');
    await user.selectOptions(statusFilter, 'delivered');

    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument();
  });
});

describe('OrderHistoryPage - Order Actions', () => {
  it('should display View Details button for all orders', () => {
    renderWithRouter(<OrderHistoryPage />);
    const viewDetailsButtons = screen.getAllByText('View Details');
    expect(viewDetailsButtons).toHaveLength(3);
  });

  it('should display Track Package button for orders with tracking numbers', () => {
    renderWithRouter(<OrderHistoryPage />);
    const trackPackageButtons = screen.getAllByText('Track Package');
    expect(trackPackageButtons).toHaveLength(2); // ORD-2024-001 and ORD-2024-002
  });

  it('should display Buy Again button for delivered orders', () => {
    renderWithRouter(<OrderHistoryPage />);
    const buyAgainButtons = screen.getAllByText('Buy Again');
    expect(buyAgainButtons).toHaveLength(1); // Only ORD-2024-001 is delivered
  });

  it('should display Leave Review button for delivered orders', () => {
    renderWithRouter(<OrderHistoryPage />);
    const leaveReviewButtons = screen.getAllByText('Leave Review');
    expect(leaveReviewButtons).toHaveLength(1); // Only ORD-2024-001 is delivered
  });

  it('should display Download Invoice button for all orders', () => {
    renderWithRouter(<OrderHistoryPage />);
    const downloadInvoiceButtons = screen.getAllByText('Download Invoice');
    expect(downloadInvoiceButtons).toHaveLength(3);
  });

  it('should not display Cancel Order button for non-pending orders', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
  });
});

describe('OrderHistoryPage - Empty States', () => {
  it('should show no orders message when searching returns no results', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'xyz123');

    expect(screen.getByText('No orders found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
  });

  it('should not show Start Shopping button when filters are active', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'xyz123');

    expect(screen.queryByText('Start Shopping')).not.toBeInTheDocument();
  });
});

describe('OrderHistoryPage - Pagination', () => {
  it('should display pagination controls', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should have Previous button disabled', () => {
    renderWithRouter(<OrderHistoryPage />);
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('should have Next button disabled', () => {
    renderWithRouter(<OrderHistoryPage />);
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('should not display pagination when no orders are shown', async () => {
    const user = userEvent.setup();
    renderWithRouter(<OrderHistoryPage />);

    const searchInput = screen.getByTestId('order-search-input');
    await user.type(searchInput, 'xyz123');

    const previousButtons = screen.queryAllByText('Previous');
    expect(previousButtons).toHaveLength(0);
  });
});

describe('OrderHistoryPage - Product Links', () => {
  it('should link product names to product detail pages', () => {
    renderWithRouter(<OrderHistoryPage />);
    const productLinks = screen.getAllByRole('link', { name: 'Wireless Headphones' });
    expect(productLinks.length).toBeGreaterThan(0);
    expect(productLinks[0]).toHaveAttribute('href', '/products/1');
  });
});

describe('OrderHistoryPage - Accessibility', () => {
  it('should have proper heading structure', () => {
    renderWithRouter(<OrderHistoryPage />);
    expect(screen.getByRole('heading', { name: 'Order History' })).toBeInTheDocument();
  });

  it('should have accessible search input', () => {
    renderWithRouter(<OrderHistoryPage />);
    const searchInput = screen.getByTestId('order-search-input');
    expect(searchInput).toHaveAttribute('placeholder', 'Search orders or products...');
  });

  it('should have accessible status filter', () => {
    renderWithRouter(<OrderHistoryPage />);
    const statusFilter = screen.getByTestId('status-filter');
    expect(statusFilter.tagName).toBe('SELECT');
  });
});

describe('OrderHistoryPage - Order Item Details', () => {
  it('should display item quantities', () => {
    renderWithRouter(<OrderHistoryPage />);
    // Quantity 1 appears twice (Wireless Headphones and Smart Watch)
    const quantity1 = screen.getAllByText('Quantity: 1');
    expect(quantity1).toHaveLength(2);
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 3')).toBeInTheDocument();
  });

  it('should display item prices', () => {
    renderWithRouter(<OrderHistoryPage />);
    // Some prices appear multiple times (as item price and subtotal)
    const price9999 = screen.getAllByText('$99.99');
    expect(price9999.length).toBeGreaterThan(0);

    const price24999 = screen.getAllByText('$249.99');
    expect(price24999.length).toBeGreaterThan(0);

    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should calculate and display item subtotals', () => {
    renderWithRouter(<OrderHistoryPage />);
    // Laptop Stand: 2 x $49.99 = $99.98
    // Cotton T-Shirt: 3 x $29.99 = $89.97
    // These amounts appear as both order totals and item subtotals
    const amount9998 = screen.getAllByText('$99.98');
    const amount8997 = screen.getAllByText('$89.97');

    expect(amount9998.length).toBeGreaterThan(0);
    expect(amount8997.length).toBeGreaterThan(0);
  });
});

describe('OrderHistoryPage - Status Colors', () => {
  it('should apply correct color classes to status badges', () => {
    renderWithRouter(<OrderHistoryPage />);

    // Get all elements with these texts, filter to find the badge (span with rounded-full class)
    const deliveredElements = screen.getAllByText('Delivered');
    const deliveredBadge = deliveredElements.find(el => el.classList.contains('rounded-full'));
    expect(deliveredBadge).toHaveClass('bg-green-100');
    expect(deliveredBadge).toHaveClass('text-green-800');

    const shippedElements = screen.getAllByText('Shipped');
    const shippedBadge = shippedElements.find(el => el.classList.contains('rounded-full'));
    expect(shippedBadge).toHaveClass('bg-purple-100');
    expect(shippedBadge).toHaveClass('text-purple-800');

    const processingElements = screen.getAllByText('Processing');
    const processingBadge = processingElements.find(el => el.classList.contains('rounded-full'));
    expect(processingBadge).toHaveClass('bg-blue-100');
    expect(processingBadge).toHaveClass('text-blue-800');
  });
});
