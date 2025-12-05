import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkOrderOperations from './BulkOrderOperations';

const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    total: 199.99,
    status: 'pending' as const,
    date: new Date('2024-01-15'),
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    customerName: 'Jane Smith',
    total: 299.99,
    status: 'processing' as const,
    date: new Date('2024-01-16'),
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    customerName: 'Bob Johnson',
    total: 99.99,
    status: 'shipped' as const,
    date: new Date('2024-01-17'),
  },
];

describe('BulkOrderOperations', () => {
  it('renders bulk operations component', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set()}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('bulk-order-operations')).toBeInTheDocument();
  });

  it('displays all orders', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set()}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();
  });

  it('shows empty state when no orders', () => {
    render(
      <BulkOrderOperations
        orders={[]}
        selectedOrders={new Set()}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByText('No orders to display')).toBeInTheDocument();
  });

  it('allows selecting individual orders', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );

    await user.click(screen.getByTestId('select-1'));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1']));
  });

  it('allows deselecting orders', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={onSelectionChange}
      />
    );

    await user.click(screen.getByTestId('select-1'));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('allows selecting all orders', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );

    await user.click(screen.getByTestId('select-all'));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2', '3']));
  });

  it('allows deselecting all orders', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1', '2', '3'])}
        onSelectionChange={onSelectionChange}
      />
    );

    await user.click(screen.getByTestId('select-all'));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it('shows bulk action buttons when orders are selected', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('export-btn')).toBeInTheDocument();
    expect(screen.getByTestId('status-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tag-btn')).toBeInTheDocument();
    expect(screen.getByTestId('ship-btn')).toBeInTheDocument();
    expect(screen.getByTestId('delete-btn')).toBeInTheDocument();
  });

  it('hides bulk action buttons when no orders selected', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set()}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.queryByTestId('export-btn')).not.toBeInTheDocument();
  });

  it('shows selected count', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1', '2'])}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByText('2 order(s) selected')).toBeInTheDocument();
  });

  it('calls onBulkAction for export', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('export-btn'));

    expect(onBulkAction).toHaveBeenCalledWith('export', ['1'], undefined);
  });

  it('opens status dialog when update status clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('status-btn'));

    expect(screen.getByTestId('status-dialog')).toBeInTheDocument();
  });

  it('allows updating status in dialog', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1', '2'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('status-btn'));

    const shippedRadio = screen.getByLabelText('Shipped');
    await user.click(shippedRadio);

    await user.click(screen.getByTestId('confirm-status'));

    await waitFor(() => {
      expect(onBulkAction).toHaveBeenCalledWith(
        'update_status',
        ['1', '2'],
        { status: 'shipped' }
      );
    });
  });

  it('opens tag dialog when add tag clicked', async () => {
    const user = userEvent.setup();

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('tag-btn'));

    expect(screen.getByTestId('tag-dialog')).toBeInTheDocument();
  });

  it('allows adding tags', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('tag-btn'));
    await user.type(screen.getByTestId('tag-input'), 'urgent');
    await user.click(screen.getByTestId('confirm-tag'));

    await waitFor(() => {
      expect(onBulkAction).toHaveBeenCalledWith(
        'add_tag',
        ['1'],
        { tag: 'urgent' }
      );
    });
  });

  it('calls onBulkAction for mark shipped with confirmation', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('ship-btn'));

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(onBulkAction).toHaveBeenCalledWith('mark_shipped', ['1'], undefined);
    });

    confirmSpy.mockRestore();
  });

  it('calls onBulkAction for delete with confirmation', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1', '2'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('delete-btn'));

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete 2 order(s)?');
    await waitFor(() => {
      expect(onBulkAction).toHaveBeenCalledWith('delete', ['1', '2'], undefined);
    });

    confirmSpy.mockRestore();
  });

  it('does not delete if confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onBulkAction = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('delete-btn'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(onBulkAction).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('clears selection after successful bulk action', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const onBulkAction = vi.fn().mockResolvedValue(undefined);

    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={onSelectionChange}
        onBulkAction={onBulkAction}
      />
    );

    await user.click(screen.getByTestId('export-btn'));

    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });
  });

  it('disables tag confirm when input is empty', async () => {
    const user = userEvent.setup();
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
      />
    );

    await user.click(screen.getByTestId('tag-btn'));

    const confirmButton = screen.getByTestId('confirm-tag');
    expect(confirmButton).toBeDisabled();
  });

  it('highlights selected orders', () => {
    render(
      <BulkOrderOperations
        orders={mockOrders}
        selectedOrders={new Set(['1'])}
        onSelectionChange={vi.fn()}
      />
    );

    const orderRow = screen.getByTestId('order-1');
    expect(orderRow).toHaveClass('bg-blue-50');
  });
});
