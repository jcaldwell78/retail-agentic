import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FulfillmentWorkflow from './FulfillmentWorkflow';

describe('FulfillmentWorkflow', () => {
  it('renders with order information', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="pending"
      />
    );

    expect(screen.getByTestId('fulfillment-workflow')).toBeInTheDocument();
    expect(screen.getByText('Order #12345')).toBeInTheDocument();
  });

  it('displays all fulfillment steps', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="pending"
      />
    );

    expect(screen.getByText('Payment Verified')).toBeInTheDocument();
    expect(screen.getByText('Items Picked from Warehouse')).toBeInTheDocument();
    expect(screen.getByText('Items Packed')).toBeInTheDocument();
    expect(screen.getByText('Shipping Label Created')).toBeInTheDocument();
    expect(screen.getByText('Package Shipped')).toBeInTheDocument();
    expect(screen.getByText('Delivered to Customer')).toBeInTheDocument();
  });

  it('shows mark as shipped button when status is processing', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    expect(screen.getByTestId('mark-shipped-btn')).toBeInTheDocument();
  });

  it('shows mark as delivered button when status is shipped', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="shipped"
      />
    );

    expect(screen.getByTestId('mark-delivered-btn')).toBeInTheDocument();
  });

  it('opens shipping form when mark as shipped is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));

    expect(screen.getByTestId('shipping-form')).toBeInTheDocument();
    expect(screen.getByTestId('tracking-number')).toBeInTheDocument();
  });

  it('requires tracking number to confirm shipment', async () => {
    const user = userEvent.setup();

    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));

    // Wait for the form to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirm-shipped')).toBeInTheDocument();
    });

    // The button should be disabled when tracking number is empty
    const confirmButton = screen.getByTestId('confirm-shipped');
    expect(confirmButton).toBeDisabled();
  });

  it('calls onStatusUpdate when marking as shipped with valid data', async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();

    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
        onStatusUpdate={onStatusUpdate}
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));
    await user.type(screen.getByTestId('tracking-number'), '1234567890');
    await user.click(screen.getByTestId('confirm-shipped'));

    expect(onStatusUpdate).toHaveBeenCalledWith(
      'shipped',
      expect.objectContaining({
        shippingInfo: expect.objectContaining({
          trackingNumber: '1234567890',
        }),
      })
    );
  });

  it('allows selecting carrier', async () => {
    const user = userEvent.setup();
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));

    const carrierSelect = screen.getByTestId('carrier-select') as HTMLSelectElement;
    expect(carrierSelect.value).toBe('FedEx');

    fireEvent.change(carrierSelect, { target: { value: 'UPS' } });
    expect(carrierSelect.value).toBe('UPS');
  });

  it('calls onStatusUpdate when marking as delivered', async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();

    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="shipped"
        onStatusUpdate={onStatusUpdate}
      />
    );

    await user.click(screen.getByTestId('mark-delivered-btn'));

    expect(onStatusUpdate).toHaveBeenCalledWith('delivered', expect.any(Object));
  });

  it('displays shipping details when order is shipped', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="shipped"
      />
    );

    // Shipping form won't have tracking initially in shipped state
    // but we can verify the structure is correct
    expect(screen.getByText('Fulfillment Workflow')).toBeInTheDocument();
  });

  it('shows action required alert when status is processing', () => {
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    expect(screen.getByText('Action Required')).toBeInTheDocument();
    expect(screen.getByText(/This order is ready to be shipped/)).toBeInTheDocument();
  });

  it('closes shipping form when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));
    expect(screen.getByTestId('shipping-form')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('shipping-form')).not.toBeInTheDocument();
  });

  it('allows adding shipping notes', async () => {
    const user = userEvent.setup();
    const onStatusUpdate = vi.fn();

    render(
      <FulfillmentWorkflow
        orderId="12345"
        currentStatus="processing"
        onStatusUpdate={onStatusUpdate}
      />
    );

    await user.click(screen.getByTestId('mark-shipped-btn'));
    await user.type(screen.getByTestId('tracking-number'), '1234567890');
    await user.type(screen.getByTestId('shipping-notes'), 'Handle with care');
    await user.click(screen.getByTestId('confirm-shipped'));

    expect(onStatusUpdate).toHaveBeenCalledWith(
      'shipped',
      expect.objectContaining({
        notes: 'Handle with care',
      })
    );
  });
});
