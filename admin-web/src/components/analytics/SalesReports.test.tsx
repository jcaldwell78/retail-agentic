import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SalesReports from './SalesReports';

describe('SalesReports', () => {
  it('renders sales reports component', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('sales-reports')).toBeInTheDocument();
    expect(screen.getByText('Sales Reports')).toBeInTheDocument();
  });

  it('displays all key metrics', () => {
    render(<SalesReports />);

    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Average Order Value')).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
  });

  it('displays metric values correctly', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('$125,840.50');
    expect(screen.getByTestId('metric-value-1')).toHaveTextContent('1,248');
    expect(screen.getByTestId('metric-value-2')).toHaveTextContent('$100.83');
    expect(screen.getByTestId('metric-value-3')).toHaveTextContent('892');
  });

  it('displays metric changes with trend indicators', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('metric-change-0')).toHaveTextContent('+12.5%');
    expect(screen.getByTestId('metric-change-1')).toHaveTextContent('+8.3%');
    expect(screen.getByTestId('metric-change-2')).toHaveTextContent('+3.2%');
    expect(screen.getByTestId('metric-change-3')).toHaveTextContent('-2.1%');
  });

  it('displays sales trend table', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('sales-trend-table')).toBeInTheDocument();
    expect(screen.getByText('Sales Trend')).toBeInTheDocument();
  });

  it('displays sales data rows', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('sales-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('sales-row-1')).toBeInTheDocument();
  });

  it('calculates total sales correctly', () => {
    render(<SalesReports />);

    const totalSales = screen.getByTestId('total-sales');
    expect(totalSales).toBeInTheDocument();
    // 12500 + 15200 + 13800 + 16400 + 14900 + 18200 + 19600 = 110600
    expect(totalSales).toHaveTextContent('$110,600.00');
  });

  it('calculates total orders correctly', () => {
    render(<SalesReports />);

    const totalOrders = screen.getByTestId('total-orders');
    expect(totalOrders).toBeInTheDocument();
    // 125 + 142 + 131 + 156 + 138 + 167 + 178 = 1037
    expect(totalOrders).toHaveTextContent('1037');
  });

  it('calculates total customers correctly', () => {
    render(<SalesReports />);

    const totalCustomers = screen.getByTestId('total-customers');
    expect(totalCustomers).toBeInTheDocument();
    // 89 + 102 + 95 + 112 + 98 + 124 + 131 = 751
    expect(totalCustomers).toHaveTextContent('751');
  });

  it('displays top products table', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('top-products-table')).toBeInTheDocument();
    expect(screen.getByText('Top Products by Revenue')).toBeInTheDocument();
  });

  it('displays top products with rankings', () => {
    render(<SalesReports />);

    expect(screen.getByText('Wireless Headphones Pro')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch Series 5')).toBeInTheDocument();
    expect(screen.getByText('USB-C Cable Pack')).toBeInTheDocument();
  });

  it('displays product revenue correctly', () => {
    render(<SalesReports />);

    expect(screen.getByText('$23,400.00')).toBeInTheDocument();
    expect(screen.getByText('$56,700.00')).toBeInTheDocument();
  });

  it('allows selecting export format', async () => {
    const user = userEvent.setup();
    render(<SalesReports />);

    const select = screen.getByTestId('export-format-select') as HTMLSelectElement;
    expect(select.value).toBe('csv');

    await user.selectOptions(select, 'pdf');
    expect(select.value).toBe('pdf');
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<SalesReports onExport={onExport} />);

    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('exports with selected format', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<SalesReports onExport={onExport} />);

    await user.selectOptions(screen.getByTestId('export-format-select'), 'pdf');
    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('displays date range when provided', () => {
    const dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    };

    render(<SalesReports dateRange={dateRange} />);

    // Date format varies by locale, just check the dates are shown
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('accepts custom metrics', () => {
    const customMetrics = [
      {
        label: 'Custom Metric',
        value: 999,
        change: 5.5,
        trend: 'up' as const,
        format: 'number' as const,
      },
    ];

    render(<SalesReports initialMetrics={customMetrics} />);

    expect(screen.getByText('Custom Metric')).toBeInTheDocument();
    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('999');
  });

  it('accepts custom sales data', () => {
    const customSalesData = [
      { date: '2024-02-01', sales: 1000, orders: 10, customers: 5 },
      { date: '2024-02-02', sales: 2000, orders: 20, customers: 10 },
    ];

    render(<SalesReports initialSalesData={customSalesData} />);

    // Total should be 3000
    expect(screen.getByTestId('total-sales')).toHaveTextContent('$3,000.00');
    expect(screen.getByTestId('total-orders')).toHaveTextContent('30');
  });

  it('accepts custom top products', () => {
    const customTopProducts = [
      {
        productId: 'custom-1',
        productName: 'Custom Product',
        unitsSold: 100,
        revenue: 10000,
        averagePrice: 100,
      },
    ];

    render(<SalesReports initialTopProducts={customTopProducts} />);

    expect(screen.getByText('Custom Product')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<SalesReports />);

    // Check various currency formats
    const metrics = screen.getAllByTestId(/metric-value-/);
    expect(metrics[0]).toHaveTextContent('$125,840.50'); // Revenue
    expect(metrics[2]).toHaveTextContent('$100.83'); // AOV
  });

  it('formats number values correctly', () => {
    render(<SalesReports />);

    expect(screen.getByTestId('metric-value-1')).toHaveTextContent('1,248'); // Orders
    expect(screen.getByTestId('metric-value-3')).toHaveTextContent('892'); // Customers
  });

  it('displays correct trend indicators', () => {
    render(<SalesReports />);

    // Should have up arrows for positive changes
    const upTrends = screen.getAllByTestId(/metric-change-[0-2]/);
    upTrends.forEach((trend) => {
      expect(trend).toHaveClass('text-green-600');
    });

    // Should have down arrow for negative change
    const downTrend = screen.getByTestId('metric-change-3');
    expect(downTrend).toHaveClass('text-red-600');
  });

  it('displays export button with download icon', () => {
    render(<SalesReports />);

    const exportBtn = screen.getByTestId('export-btn');
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toHaveTextContent('Export');
  });

  it('displays product rankings correctly', () => {
    render(<SalesReports />);

    const productRows = screen.getAllByTestId(/product-row-/);
    expect(productRows).toHaveLength(5);
  });
});
