import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RefundInterface from './RefundInterface';

const mockItems = [
  {
    id: '1',
    productId: 'p1',
    productName: 'Wireless Headphones',
    quantity: 2,
    price: 99.99,
    total: 199.98,
  },
  {
    id: '2',
    productId: 'p2',
    productName: 'USB Cable',
    quantity: 3,
    price: 9.99,
    total: 29.97,
  },
];

describe('RefundInterface', () => {
  it('renders refund interface', () => {
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    expect(screen.getByTestId('refund-interface')).toBeInTheDocument();
    expect(screen.getByText('Order #12345')).toBeInTheDocument();
  });

  it('displays all order items', () => {
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('USB Cable')).toBeInTheDocument();
  });

  it('allows selecting quantity to refund', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    expect(qtyInput).toHaveValue(1);
  });

  it('calculates refund amount correctly', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '2');

    await waitFor(() => {
      expect(screen.getByText('$199.98')).toBeInTheDocument();
    });
  });

  it('allows refunding shipping cost', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const shippingCheckbox = screen.getByTestId('refund-shipping') as HTMLInputElement;
    expect(shippingCheckbox.checked).toBe(false);

    await user.click(shippingCheckbox);
    expect(shippingCheckbox.checked).toBe(true);
  });

  it('allows selecting refund reason', async () => {
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const reasonSelect = screen.getByTestId('refund-reason') as HTMLSelectElement;
    expect(reasonSelect.value).toBe('customer_request');

    await userEvent.selectOptions(reasonSelect, 'defective');
    expect(reasonSelect.value).toBe('defective');
  });

  it('allows adding notes', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const notesInput = screen.getByTestId('refund-notes');
    await user.type(notesInput, 'Customer reported defect');

    expect(notesInput).toHaveValue('Customer reported defect');
  });

  it('allows selecting refund method', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    await user.click(screen.getByTestId('method-credit'));

    // The button should have the active class
    const creditButton = screen.getByTestId('method-credit');
    expect(creditButton).toHaveClass('border-blue-600');
  });

  it('disables submit when no items selected', () => {
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const submitButton = screen.getByTestId('submit-refund');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when items are selected', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    const submitButton = screen.getByTestId('submit-refund');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onRefundSubmit with correct data', async () => {
    const user = userEvent.setup();
    const onRefundSubmit = vi.fn();

    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
        onRefundSubmit={onRefundSubmit}
      />
    );

    // Select 1 item
    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    // Check refund shipping
    await user.click(screen.getByTestId('refund-shipping'));

    // Select reason
    await userEvent.selectOptions(screen.getByTestId('refund-reason'), 'defective');

    // Add notes
    await user.type(screen.getByTestId('refund-notes'), 'Test notes');

    // Submit
    await user.click(screen.getByTestId('submit-refund'));

    await waitFor(() => {
      expect(onRefundSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: '12345',
          reason: 'defective',
          notes: 'Test notes',
          refundShipping: true,
          method: 'original',
        })
      );
    });
  });

  it('shows completion message after successful refund', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    await user.click(screen.getByTestId('submit-refund'));

    await waitFor(() => {
      expect(screen.getByTestId('refund-complete')).toBeInTheDocument();
      expect(screen.getByText('Refund Processed')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows processing state during refund', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    await user.click(screen.getByTestId('submit-refund'));

    expect(screen.getByText('Processing Refund...')).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('prevents quantity exceeding original quantity', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    const qtyInput = screen.getByTestId('qty-1') as HTMLInputElement;
    expect(qtyInput).toHaveAttribute('max', '2');
  });

  it('calculates total with shipping correctly', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    // Select 1 item (99.99)
    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');

    // Add shipping (10)
    await user.click(screen.getByTestId('refund-shipping'));

    await waitFor(() => {
      // Total should be 109.99
      expect(screen.getByText('$109.99')).toBeInTheDocument();
    });
  });

  it('displays correct refund method message in completion', async () => {
    const user = userEvent.setup();
    render(
      <RefundInterface
        orderId="12345"
        orderTotal={229.95}
        shippingCost={10}
        items={mockItems}
      />
    );

    // Select store credit
    await user.click(screen.getByTestId('method-credit'));

    // Select item and submit
    const qtyInput = screen.getByTestId('qty-1');
    await user.clear(qtyInput);
    await user.type(qtyInput, '1');
    await user.click(screen.getByTestId('submit-refund'));

    await waitFor(() => {
      expect(screen.getByText(/Store credit has been issued/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
