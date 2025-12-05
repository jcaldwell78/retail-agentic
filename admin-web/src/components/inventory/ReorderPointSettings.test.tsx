import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReorderPointSettings from './ReorderPointSettings';

describe('ReorderPointSettings', () => {
  it('renders reorder point settings component', () => {
    render(<ReorderPointSettings />);

    expect(screen.getByTestId('reorder-point-settings')).toBeInTheDocument();
    expect(screen.getByText('Reorder Point Settings')).toBeInTheDocument();
  });

  it('displays default products', () => {
    render(<ReorderPointSettings />);

    expect(screen.getByText('Wireless Headphones Pro')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch Series 5')).toBeInTheDocument();
    expect(screen.getByText('USB-C Cable Pack')).toBeInTheDocument();
  });

  it('displays product SKUs and suppliers', () => {
    render(<ReorderPointSettings />);

    expect(screen.getByText(/WHP-001/)).toBeInTheDocument();
    expect(screen.getByText(/AudioTech Supplies/)).toBeInTheDocument();
  });

  it('displays current stock for each product', () => {
    render(<ReorderPointSettings />);

    expect(screen.getByTestId('current-stock-p1')).toHaveTextContent('45');
    expect(screen.getByTestId('current-stock-p2')).toHaveTextContent('12');
    expect(screen.getByTestId('current-stock-p3')).toHaveTextContent('156');
  });

  it('shows low stock warning for products below reorder point', () => {
    render(<ReorderPointSettings />);

    // p2 has currentStock (12) below reorderPoint (15)
    expect(screen.getByText(/Stock below reorder point/)).toBeInTheDocument();
  });

  it('displays reorder point for each product', () => {
    render(<ReorderPointSettings />);

    const reorderPointP1 = screen.getByTestId('reorder-point-p1') as HTMLInputElement;
    expect(reorderPointP1).toHaveValue(20);
  });

  it('displays reorder quantity for each product', () => {
    render(<ReorderPointSettings />);

    const reorderQtyP1 = screen.getByTestId('reorder-quantity-p1') as HTMLInputElement;
    expect(reorderQtyP1).toHaveValue(50);
  });

  it('displays lead time for each product', () => {
    render(<ReorderPointSettings />);

    const leadTimeP1 = screen.getByTestId('lead-time-p1') as HTMLInputElement;
    expect(leadTimeP1).toHaveValue(7);
  });

  it('displays auto-reorder checkbox status', () => {
    render(<ReorderPointSettings />);

    const autoReorderP1 = screen.getByTestId('auto-reorder-p1') as HTMLInputElement;
    expect(autoReorderP1.checked).toBe(true);

    const autoReorderP2 = screen.getByTestId('auto-reorder-p2') as HTMLInputElement;
    expect(autoReorderP2.checked).toBe(false);
  });

  it('enables editing when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    const reorderPoint = screen.getByTestId('reorder-point-p1') as HTMLInputElement;
    expect(reorderPoint).toBeDisabled();

    await user.click(screen.getByTestId('edit-p1'));

    expect(reorderPoint).not.toBeDisabled();
  });

  it('allows updating reorder point when editing', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));

    const reorderPoint = screen.getByTestId('reorder-point-p1') as HTMLInputElement;
    await user.clear(reorderPoint);
    await user.type(reorderPoint, '25');

    expect(reorderPoint).toHaveValue(25);
  });

  it('allows updating reorder quantity when editing', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));

    const reorderQty = screen.getByTestId('reorder-quantity-p1') as HTMLInputElement;
    await user.clear(reorderQty);
    await user.type(reorderQty, '75');

    expect(reorderQty).toHaveValue(75);
  });

  it('allows toggling auto-reorder when editing', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));

    const autoReorder = screen.getByTestId('auto-reorder-p1') as HTMLInputElement;
    expect(autoReorder.checked).toBe(true);

    await user.click(autoReorder);
    expect(autoReorder.checked).toBe(false);
  });

  it('calls onSaveSettings when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn();

    render(<ReorderPointSettings onSaveSettings={onSaveSettings} />);

    await user.click(screen.getByTestId('edit-p1'));
    await user.click(screen.getByTestId('save-p1'));

    expect(onSaveSettings).toHaveBeenCalledWith('p1', {
      reorderPoint: 20,
      reorderQuantity: 50,
      leadTimeDays: 7,
      autoReorder: true,
    });
  });

  it('shows success message after saving', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));
    await user.click(screen.getByTestId('save-p1'));

    expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
  });

  it('disables inputs after saving', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));

    const reorderPoint = screen.getByTestId('reorder-point-p1') as HTMLInputElement;
    expect(reorderPoint).not.toBeDisabled();

    await user.click(screen.getByTestId('save-p1'));

    expect(reorderPoint).toBeDisabled();
  });

  it('allows canceling edit mode', async () => {
    const user = userEvent.setup();
    render(<ReorderPointSettings />);

    await user.click(screen.getByTestId('edit-p1'));

    const reorderPoint = screen.getByTestId('reorder-point-p1') as HTMLInputElement;
    await user.clear(reorderPoint);
    await user.type(reorderPoint, '99');

    await user.click(screen.getByText('Cancel'));

    expect(reorderPoint).toHaveValue(20); // Back to original
    expect(reorderPoint).toBeDisabled();
  });

  it('enables auto-reorder for all products with bulk action', async () => {
    const user = userEvent.setup();
    const onBulkUpdate = vi.fn();

    render(<ReorderPointSettings onBulkUpdate={onBulkUpdate} />);

    await user.click(screen.getByTestId('bulk-enable-auto'));

    expect(onBulkUpdate).toHaveBeenCalledWith([
      { productId: 'p1', settings: { autoReorder: true } },
      { productId: 'p2', settings: { autoReorder: true } },
      { productId: 'p3', settings: { autoReorder: true } },
    ]);
  });

  it('disables auto-reorder for all products with bulk action', async () => {
    const user = userEvent.setup();
    const onBulkUpdate = vi.fn();

    render(<ReorderPointSettings onBulkUpdate={onBulkUpdate} />);

    await user.click(screen.getByTestId('bulk-disable-auto'));

    expect(onBulkUpdate).toHaveBeenCalledWith([
      { productId: 'p1', settings: { autoReorder: false } },
      { productId: 'p2', settings: { autoReorder: false } },
      { productId: 'p3', settings: { autoReorder: false } },
    ]);
  });

  it('displays low stock alert count', () => {
    render(<ReorderPointSettings />);

    // Only p2 is below reorder point
    expect(screen.getByText(/1 product\(s\) currently below reorder point/)).toBeInTheDocument();
  });

  it('displays auto-reorder count', () => {
    render(<ReorderPointSettings />);

    // p1 and p3 have auto-reorder enabled
    expect(screen.getByText(/2 product\(s\) have auto-reorder enabled/)).toBeInTheDocument();
  });

  it('accepts custom initial products', () => {
    const customProducts = [
      {
        productId: 'custom-1',
        productName: 'Custom Product',
        sku: 'CUSTOM-001',
        currentStock: 100,
        reorderPoint: 50,
        reorderQuantity: 100,
        leadTimeDays: 5,
        averageDailySales: 10,
        supplier: 'Custom Supplier',
        autoReorder: true,
      },
    ];

    render(<ReorderPointSettings initialProducts={customProducts} />);

    expect(screen.getByText('Custom Product')).toBeInTheDocument();
    expect(screen.getByTestId('current-stock-custom-1')).toHaveTextContent('100');
  });
});
