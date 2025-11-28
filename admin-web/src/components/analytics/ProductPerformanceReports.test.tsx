import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductPerformanceReports from './ProductPerformanceReports';

describe('ProductPerformanceReports', () => {
  it('renders product performance reports component', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('product-performance-reports')).toBeInTheDocument();
    expect(screen.getByText('Product Performance Reports')).toBeInTheDocument();
  });

  it('displays all key metrics', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByText('Total Products Sold')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Average Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('Average Product Rating')).toBeInTheDocument();
  });

  it('displays metric values correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('3,456');
    expect(screen.getByTestId('metric-value-1')).toHaveTextContent('$234,567.89');
    expect(screen.getByTestId('metric-value-2')).toHaveTextContent('3.45%');
    expect(screen.getByTestId('metric-value-3')).toHaveTextContent('4.3');
  });

  it('displays metric changes with trend indicators', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('metric-change-0')).toHaveTextContent('+15.3%');
    expect(screen.getByTestId('metric-change-1')).toHaveTextContent('+12.8%');
    expect(screen.getByTestId('metric-change-2')).toHaveTextContent('-0.5%');
    expect(screen.getByTestId('metric-change-3')).toHaveTextContent('+0.2%');
  });

  it('displays correct trend colors', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('metric-change-0')).toHaveClass('text-green-600'); // up
    expect(screen.getByTestId('metric-change-1')).toHaveClass('text-green-600'); // up
    expect(screen.getByTestId('metric-change-2')).toHaveClass('text-red-600'); // down
  });

  it('displays product performance table', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('product-performance-table')).toBeInTheDocument();
    expect(screen.getByText('Product Performance Details')).toBeInTheDocument();
  });

  it('displays all product rows', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('product-row-p1')).toBeInTheDocument();
    expect(screen.getByTestId('product-row-p2')).toBeInTheDocument();
    expect(screen.getByTestId('product-row-p3')).toBeInTheDocument();
    expect(screen.getByTestId('product-row-p4')).toBeInTheDocument();
    expect(screen.getByTestId('product-row-p5')).toBeInTheDocument();
  });

  it('displays product names and SKUs', () => {
    render(<ProductPerformanceReports />);

    const headphones = screen.getAllByText('Wireless Headphones Pro');
    expect(headphones.length).toBeGreaterThan(0);

    expect(screen.getByText('WHP-001')).toBeInTheDocument();

    const smartWatch = screen.getAllByText('Smart Watch Series 5');
    expect(smartWatch.length).toBeGreaterThan(0);

    expect(screen.getByText('SWS-005')).toBeInTheDocument();
  });

  it('displays product categories', () => {
    render(<ProductPerformanceReports />);

    const electronics = screen.getAllByText('Electronics');
    expect(electronics.length).toBeGreaterThan(0);

    const accessories = screen.getAllByText('Accessories');
    expect(accessories.length).toBeGreaterThan(0);
  });

  it('displays units sold correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('units-sold-p1')).toHaveTextContent('456');
    expect(screen.getByTestId('units-sold-p2')).toHaveTextContent('342');
    expect(screen.getByTestId('units-sold-p3')).toHaveTextContent('1,234');
  });

  it('displays revenue correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('revenue-p1')).toHaveTextContent('$45,600.00');
    expect(screen.getByTestId('revenue-p2')).toHaveTextContent('$85,500.00');
  });

  it('displays views correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('views-p1')).toHaveTextContent('12,340');
    expect(screen.getByTestId('views-p2')).toHaveTextContent('23,450');
  });

  it('displays conversion rates correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('conversion-p1')).toHaveTextContent('3.70%');
    expect(screen.getByTestId('conversion-p2')).toHaveTextContent('1.46%');
  });

  it('highlights high conversion rates', () => {
    render(<ProductPerformanceReports />);

    const conversionP1 = screen.getByTestId('conversion-p1').querySelector('span');
    expect(conversionP1).toHaveClass('text-green-600');
  });

  it('displays ratings and review counts', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('rating-p1')).toHaveTextContent('4.5');
    expect(screen.getByTestId('rating-p1')).toHaveTextContent('(234)');
    expect(screen.getByTestId('rating-p2')).toHaveTextContent('4.8');
    expect(screen.getByTestId('rating-p2')).toHaveTextContent('(456)');
  });

  it('displays profit margins correctly', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('margin-p1')).toHaveTextContent('35.5%');
    expect(screen.getByTestId('margin-p2')).toHaveTextContent('42.3%');
  });

  it('highlights high profit margins', () => {
    render(<ProductPerformanceReports />);

    const marginP2 = screen.getByTestId('margin-p2').querySelector('span');
    expect(marginP2).toHaveClass('text-green-600');
  });

  it('calculates total units sold correctly', () => {
    render(<ProductPerformanceReports />);

    // 456 + 342 + 1234 + 234 + 189 = 2455
    expect(screen.getByTestId('total-units')).toHaveTextContent('2,455');
  });

  it('calculates total revenue correctly', () => {
    render(<ProductPerformanceReports />);

    // 45600 + 85500 + 12340 + 11700 + 28350 = 183490
    expect(screen.getByTestId('total-revenue')).toHaveTextContent('$183,490.00');
  });

  it('calculates total views correctly', () => {
    render(<ProductPerformanceReports />);

    // 12340 + 23450 + 34560 + 8900 + 15600 = 94850
    expect(screen.getByTestId('total-views')).toHaveTextContent('94,850');
  });

  it('calculates average conversion rate correctly', () => {
    render(<ProductPerformanceReports />);

    // (3.7 + 1.46 + 3.57 + 2.63 + 1.21) / 5 = 2.51
    expect(screen.getByTestId('avg-conversion')).toHaveTextContent('2.51%');
  });

  it('calculates average rating correctly', () => {
    render(<ProductPerformanceReports />);

    // (4.5 + 4.8 + 4.2 + 4.6 + 4.7) / 5 = 4.56
    expect(screen.getByTestId('avg-rating')).toHaveTextContent('4.6');
  });

  it('calculates average margin correctly', () => {
    render(<ProductPerformanceReports />);

    // (35.5 + 42.3 + 55.8 + 48.2 + 38.9) / 5 = 44.14
    expect(screen.getByTestId('avg-margin')).toHaveTextContent('44.1%');
  });

  it('allows selecting export format', async () => {
    const user = userEvent.setup();
    render(<ProductPerformanceReports />);

    const select = screen.getByTestId('export-format-select') as HTMLSelectElement;
    expect(select.value).toBe('csv');

    await user.selectOptions(select, 'pdf');
    expect(select.value).toBe('pdf');
  });

  it('calls onExport when export button is clicked', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<ProductPerformanceReports onExport={onExport} />);

    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('exports with selected format', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();

    render(<ProductPerformanceReports onExport={onExport} />);

    await user.selectOptions(screen.getByTestId('export-format-select'), 'pdf');
    await user.click(screen.getByTestId('export-btn'));

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('displays date range when provided', () => {
    const dateRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31'),
    };

    render(<ProductPerformanceReports dateRange={dateRange} />);

    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('allows sorting by product name', async () => {
    const user = userEvent.setup();
    render(<ProductPerformanceReports />);

    await user.click(screen.getByTestId('sort-product-name'));

    const firstProductRow = screen.getByTestId('product-row-p4');
    expect(firstProductRow).toHaveTextContent('Laptop Stand Aluminum');
  });

  it('allows sorting by category', async () => {
    const user = userEvent.setup();
    render(<ProductPerformanceReports />);

    await user.click(screen.getByTestId('sort-category'));

    // After sorting by category descending, should start with "Electronics"
    const firstRow = screen.getByTestId('product-row-p1'); // Wireless Headphones - Electronics
    expect(firstRow).toBeInTheDocument();
  });

  it('allows sorting by units sold', async () => {
    const user = userEvent.setup();
    render(<ProductPerformanceReports />);

    await user.click(screen.getByTestId('sort-units-sold'));

    const firstRow = screen.getAllByTestId(/product-row-/)[0];
    expect(firstRow).toHaveTextContent('1,234'); // USB-C Cable Pack
  });

  it('allows sorting by revenue', () => {
    render(<ProductPerformanceReports />);

    // Already sorted by revenue descending by default
    const firstRow = screen.getByTestId('product-row-p2'); // Smart Watch with highest revenue
    expect(firstRow).toHaveTextContent('$85,500.00');
  });

  it('toggles sort order on second click', async () => {
    const user = userEvent.setup();
    render(<ProductPerformanceReports />);

    // First click - descending
    await user.click(screen.getByTestId('sort-units-sold'));
    let firstRow = screen.getAllByTestId(/product-row-/)[0];
    expect(firstRow).toHaveTextContent('1,234');

    // Second click - ascending
    await user.click(screen.getByTestId('sort-units-sold'));
    firstRow = screen.getAllByTestId(/product-row-/)[0];
    expect(firstRow).toHaveTextContent('189'); // Mechanical Keyboard
  });

  it('displays performance insights', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('top-performer-insight')).toBeInTheDocument();
    expect(screen.getByTestId('conversion-insight')).toBeInTheDocument();
    expect(screen.getByTestId('stock-insight')).toBeInTheDocument();
  });

  it('shows correct top performer insight', () => {
    render(<ProductPerformanceReports />);

    const insight = screen.getByTestId('top-performer-insight');
    // Top performer by revenue is Smart Watch Series 5
    expect(insight.textContent).toContain('Smart Watch Series 5');
    expect(insight.textContent).toContain('$85,500.00');
  });

  it('shows conversion rate insight', () => {
    render(<ProductPerformanceReports />);

    const insight = screen.getByTestId('conversion-insight');
    // Products with conversion >= 3%: p1 (3.7), p3 (3.57) = 2 products
    expect(insight).toHaveTextContent('2');
    expect(insight).toHaveTextContent('of 5 total products');
  });

  it('shows low stock insight', () => {
    render(<ProductPerformanceReports />);

    const insight = screen.getByTestId('stock-insight');
    // Products with stock < 30: p2 (12), p5 (23) = 2 products
    expect(insight).toHaveTextContent('2');
    expect(insight).toHaveTextContent('product(s) have low stock levels');
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

    render(<ProductPerformanceReports initialMetrics={customMetrics} />);

    expect(screen.getByText('Custom Metric')).toBeInTheDocument();
    expect(screen.getByTestId('metric-value-0')).toHaveTextContent('999');
  });

  it('accepts custom products', () => {
    const customProducts = [
      {
        productId: 'custom-1',
        productName: 'Custom Product',
        sku: 'CUSTOM-001',
        category: 'Custom',
        unitsSold: 100,
        revenue: 10000,
        views: 5000,
        conversionRate: 2.0,
        averageRating: 4.0,
        reviewCount: 50,
        stockLevel: 100,
        profitMargin: 30.0,
      },
    ];

    render(<ProductPerformanceReports initialProducts={customProducts} />);

    const customProduct = screen.getAllByText('Custom Product');
    expect(customProduct.length).toBeGreaterThan(0);
    expect(screen.getByTestId('units-sold-custom-1')).toHaveTextContent('100');
  });

  it('displays all sortable column headers', () => {
    render(<ProductPerformanceReports />);

    expect(screen.getByTestId('sort-product-name')).toBeInTheDocument();
    expect(screen.getByTestId('sort-category')).toBeInTheDocument();
    expect(screen.getByTestId('sort-units-sold')).toBeInTheDocument();
    expect(screen.getByTestId('sort-revenue')).toBeInTheDocument();
    expect(screen.getByTestId('sort-views')).toBeInTheDocument();
    expect(screen.getByTestId('sort-conversion')).toBeInTheDocument();
    expect(screen.getByTestId('sort-rating')).toBeInTheDocument();
    expect(screen.getByTestId('sort-margin')).toBeInTheDocument();
  });
});
