import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryReports from './InventoryReports';

describe('InventoryReports', () => {
  it('renders inventory reports component', () => {
    render(<InventoryReports />);

    expect(screen.getByTestId('inventory-reports')).toBeInTheDocument();
    expect(screen.getByText('Inventory Reports')).toBeInTheDocument();
  });

  it('displays summary metrics', () => {
    render(<InventoryReports />);

    expect(screen.getByTestId('total-skus')).toHaveTextContent('1,247');
    expect(screen.getByTestId('total-value')).toHaveTextContent('$234,567.89');
    expect(screen.getByTestId('low-stock')).toHaveTextContent('34');
    expect(screen.getByTestId('out-of-stock')).toHaveTextContent('12');
    expect(screen.getByTestId('overstock')).toHaveTextContent('45');
    expect(screen.getByTestId('avg-turnover')).toHaveTextContent('4.5x');
  });

  it('displays stock movement table', () => {
    render(<InventoryReports />);

    expect(screen.getByTestId('movement-table')).toBeInTheDocument();
    expect(screen.getByTestId('movement-2024-01')).toBeInTheDocument();
    expect(screen.getByTestId('movement-2024-05')).toBeInTheDocument();
  });

  it('displays correct stock movement data', () => {
    render(<InventoryReports />);

    const movement = screen.getByTestId('movement-2024-01');
    expect(movement).toHaveTextContent('+500'); // Received
    expect(movement).toHaveTextContent('-450'); // Sold
    expect(movement).toHaveTextContent('-10'); // Adjusted
    expect(movement).toHaveTextContent('1540'); // Ending balance
  });

  it('displays product inventory details', () => {
    render(<InventoryReports />);

    expect(screen.getByTestId('product-table')).toBeInTheDocument();
    expect(screen.getByText('PROD-001')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('displays product status badges', () => {
    render(<InventoryReports />);

    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('out')).toBeInTheDocument();
    expect(screen.getByText('overstock')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('displays product turnover rates', () => {
    render(<InventoryReports />);

    const product = screen.getByTestId('product-PROD-001');
    expect(product).toHaveTextContent('6.2x');
  });

  it('displays days of supply', () => {
    render(<InventoryReports />);

    const product = screen.getByTestId('product-PROD-001');
    expect(product).toHaveTextContent('12 days');
  });

  it('allows selecting export format', async () => {
    const user = userEvent.setup();
    render(<InventoryReports />);

    const formatSelect = screen.getByTestId('format-select') as HTMLSelectElement;
    expect(formatSelect.value).toBe('csv');

    await user.selectOptions(formatSelect, 'pdf');
    expect(formatSelect.value).toBe('pdf');
  });

  it('calls onExportReport with selected format', async () => {
    const user = userEvent.setup();
    const onExportReport = vi.fn();

    render(<InventoryReports onExportReport={onExportReport} />);

    await user.selectOptions(screen.getByTestId('format-select'), 'pdf');
    await user.click(screen.getByTestId('export-btn'));

    expect(onExportReport).toHaveBeenCalledWith('pdf');
  });

  it('allows selecting date range', async () => {
    const user = userEvent.setup();
    render(<InventoryReports />);

    const dateFrom = screen.getByTestId('date-from') as HTMLInputElement;
    const dateTo = screen.getByTestId('date-to') as HTMLInputElement;

    await user.type(dateFrom, '2024-01-01');
    await user.type(dateTo, '2024-12-31');

    expect(dateFrom.value).toBe('2024-01-01');
    expect(dateTo.value).toBe('2024-12-31');
  });

  it('disables generate button when dates are not selected', () => {
    render(<InventoryReports />);

    const generateBtn = screen.getByTestId('generate-btn');
    expect(generateBtn).toBeDisabled();
  });

  it('enables generate button when both dates are selected', async () => {
    const user = userEvent.setup();
    render(<InventoryReports />);

    await user.type(screen.getByTestId('date-from'), '2024-01-01');
    await user.type(screen.getByTestId('date-to'), '2024-12-31');

    const generateBtn = screen.getByTestId('generate-btn');
    expect(generateBtn).not.toBeDisabled();
  });

  it('calls onGenerateReport with date range', async () => {
    const user = userEvent.setup();
    const onGenerateReport = vi.fn();

    render(<InventoryReports onGenerateReport={onGenerateReport} />);

    await user.type(screen.getByTestId('date-from'), '2024-01-01');
    await user.type(screen.getByTestId('date-to'), '2024-12-31');
    await user.click(screen.getByTestId('generate-btn'));

    expect(onGenerateReport).toHaveBeenCalledWith({
      from: '2024-01-01',
      to: '2024-12-31',
    });
  });

  it('displays attention needed insight', () => {
    render(<InventoryReports />);

    expect(screen.getByText('Attention Needed')).toBeInTheDocument();
    expect(screen.getByText(/12 products are out of stock/)).toBeInTheDocument();
  });

  it('displays overstock alert insight', () => {
    render(<InventoryReports />);

    expect(screen.getByText('Overstock Alert')).toBeInTheDocument();
    expect(screen.getByText(/45 products have excess inventory/)).toBeInTheDocument();
  });

  it('displays performance insight', () => {
    render(<InventoryReports />);

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText(/Average turnover rate of 4.5x/)).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<InventoryReports />);

    expect(screen.getByTestId('total-value')).toHaveTextContent('$234,567.89');
    const product = screen.getByTestId('product-PROD-001');
    expect(product).toHaveTextContent('$499.95');
  });

  it('shows zero value for out of stock products', () => {
    render(<InventoryReports />);

    const outOfStockProduct = screen.getByTestId('product-PROD-002');
    expect(outOfStockProduct).toHaveTextContent('$0.00');
    expect(outOfStockProduct).toHaveTextContent('0 days');
  });

  it('displays positive adjustment with plus sign', () => {
    render(<InventoryReports />);

    const movement = screen.getByTestId('movement-2024-02');
    expect(movement).toHaveTextContent('+5');
  });

  it('displays negative adjustment with minus sign', () => {
    render(<InventoryReports />);

    const movement = screen.getByTestId('movement-2024-01');
    expect(movement).toHaveTextContent('-10');
  });

  it('indicates healthy performance when turnover >= 4', () => {
    render(<InventoryReports />);

    expect(screen.getByText(/indicates healthy inventory movement/)).toBeInTheDocument();
  });
});
