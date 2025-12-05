import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryAdjustment from './InventoryAdjustment';

const mockItem = {
  id: '1',
  productId: 'prod-1',
  productName: 'Wireless Headphones',
  sku: 'WH-001',
  currentStock: 100,
  minStock: 10,
  maxStock: 500,
  location: 'Warehouse A',
};

describe('InventoryAdjustment', () => {
  it('renders inventory adjustment component', () => {
    render(<InventoryAdjustment item={mockItem} />);

    expect(screen.getByTestId('inventory-adjustment')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('SKU: WH-001')).toBeInTheDocument();
  });

  it('displays current stock level', () => {
    render(<InventoryAdjustment item={mockItem} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText(/Current Stock:/)).toBeInTheDocument();
  });

  it('allows selecting adjustment type', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    // Initially, 'set' should be selected (variant='default')
    const setButton = screen.getByTestId('type-set');
    expect(setButton.className).toContain('bg-primary');

    // Click 'add' button
    await user.click(screen.getByTestId('type-add'));
    const addButton = screen.getByTestId('type-add');
    expect(addButton.className).toContain('bg-primary');
    // Set button should now be outline
    expect(setButton.className).not.toContain('bg-primary');

    // Click 'subtract' button
    await user.click(screen.getByTestId('type-subtract'));
    const subtractButton = screen.getByTestId('type-subtract');
    expect(subtractButton.className).toContain('bg-primary');
    // Add button should now be outline
    expect(addButton.className).not.toContain('bg-primary');
  });

  it('calculates new stock when set type is selected', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-set'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '150');

    expect(screen.getByText('New Stock:')).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('calculates new stock when add type is selected', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-add'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '50');

    // Current: 100, Add: 50 = 150
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/\+50/)).toBeInTheDocument();
  });

  it('calculates new stock when subtract type is selected', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-subtract'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '30');

    // Current: 100, Subtract: 30 = 70
    expect(screen.getByText(/70/)).toBeInTheDocument();
    expect(screen.getByText(/-30/)).toBeInTheDocument();
  });

  it('shows warning when new stock is below minimum', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-set'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '5');

    expect(screen.getByText(/Warning.*below minimum/)).toBeInTheDocument();
  });

  it('shows notice when new stock is above maximum', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-set'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '600');

    expect(screen.getByText(/Notice.*above maximum/)).toBeInTheDocument();
  });

  it('allows selecting adjustment reason', async () => {
    render(<InventoryAdjustment item={mockItem} />);

    const select = screen.getByTestId('reason-select') as HTMLSelectElement;
    expect(select.value).toBe('correction');

    fireEvent.change(select, { target: { value: 'damage' } });
    expect(select.value).toBe('damage');
  });

  it('allows adding notes', async () => {
    const user = userEvent.setup();
    render(<InventoryAdjustment item={mockItem} />);

    const notesInput = screen.getByTestId('adjustment-notes');
    await user.type(notesInput, 'Found extra units during recount');

    expect(notesInput).toHaveValue('Found extra units during recount');
  });

  it('requires adjustment value to submit', () => {
    render(<InventoryAdjustment item={mockItem} />);

    const submitButton = screen.getByTestId('submit-adjustment');
    expect(submitButton).toBeDisabled();
  });

  it('calls onAdjust with correct data when submitted', async () => {
    const user = userEvent.setup();
    const onAdjust = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<InventoryAdjustment item={mockItem} onAdjust={onAdjust} />);

    await user.click(screen.getByTestId('type-add'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '25');

    const select = screen.getByTestId('reason-select');
    fireEvent.change(select, { target: { value: 'found' } });

    await user.click(screen.getByTestId('submit-adjustment'));

    expect(onAdjust).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-1',
        previousStock: 100,
        newStock: 125,
        delta: 25,
        reason: 'found',
        adjustedBy: 'Current User',
      })
    );

    alertSpy.mockRestore();
  });

  it('shows confirmation after successful adjustment', async () => {
    const user = userEvent.setup();

    render(<InventoryAdjustment item={mockItem} />);

    await user.click(screen.getByTestId('type-set'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '120');
    await user.click(screen.getByTestId('submit-adjustment'));

    // Confirmation should appear immediately after submit
    expect(screen.getByTestId('adjustment-confirmation')).toBeInTheDocument();
    expect(screen.getByText('Inventory Adjusted')).toBeInTheDocument();
  });

  it('calls onClose after confirmation timeout', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();

    render(<InventoryAdjustment item={mockItem} onClose={onClose} />);

    // Use fireEvent instead of userEvent to avoid async issues with fake timers
    fireEvent.click(screen.getByTestId('type-set'));
    const input = screen.getByTestId('adjustment-value');
    fireEvent.change(input, { target: { value: '120' } });
    fireEvent.click(screen.getByTestId('submit-adjustment'));

    // Advance timers past the 2000ms timeout
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('displays adjustment history if provided', () => {
    const history = [
      {
        id: '1',
        productId: 'prod-1',
        previousStock: 90,
        newStock: 100,
        delta: 10,
        reason: 'found' as const,
        adjustedBy: 'Admin User',
        timestamp: new Date('2024-01-01'),
        notes: 'Found during inventory check',
      },
    ];

    render(<InventoryAdjustment item={mockItem} adjustmentHistory={history} />);

    expect(screen.getByTestId('toggle-history')).toBeInTheDocument();
    expect(screen.getByText(/Show.*Adjustment History/)).toBeInTheDocument();
  });

  it('toggles history visibility', async () => {
    const user = userEvent.setup();
    const history = [
      {
        id: '1',
        productId: 'prod-1',
        previousStock: 90,
        newStock: 100,
        delta: 10,
        reason: 'found' as const,
        adjustedBy: 'Admin User',
        timestamp: new Date('2024-01-01'),
      },
    ];

    render(<InventoryAdjustment item={mockItem} adjustmentHistory={history} />);

    // Initially history is hidden
    expect(screen.queryByTestId('history-1')).not.toBeInTheDocument();

    // Click to show history
    await user.click(screen.getByTestId('toggle-history'));
    expect(screen.getByTestId('history-1')).toBeInTheDocument();

    // Click to hide history
    await user.click(screen.getByTestId('toggle-history'));
    expect(screen.queryByTestId('history-1')).not.toBeInTheDocument();
  });

  it('prevents negative stock values', async () => {
    const user = userEvent.setup();
    const lowStockItem = { ...mockItem, currentStock: 5 };

    render(<InventoryAdjustment item={lowStockItem} />);

    await user.click(screen.getByTestId('type-subtract'));
    const input = screen.getByTestId('adjustment-value');
    await user.type(input, '10');

    // Should show 0, not -5 in the preview
    expect(screen.getByText(/New Stock:/)).toBeInTheDocument();
    // The preview shows "New Stock: 0 (-5)" where 0 is the clamped value
    const previewSection = screen.getByText(/New Stock:/).parentElement;
    expect(previewSection).toHaveTextContent('0');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<InventoryAdjustment item={mockItem} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });
});
