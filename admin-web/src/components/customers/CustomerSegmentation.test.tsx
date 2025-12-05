import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomerSegmentation from './CustomerSegmentation';

describe('CustomerSegmentation', () => {
  it('renders customer segmentation component', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByTestId('customer-segmentation')).toBeInTheDocument();
    expect(screen.getByText('Customer Segmentation')).toBeInTheDocument();
  });

  it('displays default segments', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByText('VIP Customers')).toBeInTheDocument();
    expect(screen.getByText('Frequent Buyers')).toBeInTheDocument();
    expect(screen.getByText('Recent Customers')).toBeInTheDocument();
    expect(screen.getByText('Inactive Customers')).toBeInTheDocument();
  });

  it('displays segment descriptions', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByText(/High-value customers/)).toBeInTheDocument();
    expect(screen.getByText(/Customers with 5\+ orders/)).toBeInTheDocument();
  });

  it('displays segment customer counts', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByTestId('customers-vip')).toHaveTextContent('127');
    expect(screen.getByTestId('customers-frequent')).toHaveTextContent('342');
    expect(screen.getByTestId('customers-recent')).toHaveTextContent('589');
  });

  it('displays segment revenue', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByTestId('revenue-vip')).toHaveTextContent('$234,500');
    expect(screen.getByTestId('revenue-frequent')).toHaveTextContent('$156,800');
  });

  it('displays segment average order value', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByTestId('aov-vip')).toHaveTextContent('$425');
    expect(screen.getByTestId('aov-frequent')).toHaveTextContent('$185');
  });

  it('displays total segments count', () => {
    render(<CustomerSegmentation />);

    expect(screen.getByTestId('total-segments')).toHaveTextContent('4');
  });

  it('calculates total customers correctly', () => {
    render(<CustomerSegmentation />);

    // 127 + 342 + 589 + 234 = 1292
    expect(screen.getByTestId('total-customers')).toHaveTextContent('1,292');
  });

  it('calculates total revenue correctly', () => {
    render(<CustomerSegmentation />);

    // 234500 + 156800 + 98700 + 0 = 490000
    expect(screen.getByTestId('total-revenue')).toHaveTextContent('$490,000');
  });

  it('opens create segment dialog', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));

    expect(screen.getByTestId('create-segment-dialog')).toBeInTheDocument();
  });

  it('allows entering segment name', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('segment-name'), 'New Segment');

    expect(screen.getByTestId('segment-name')).toHaveValue('New Segment');
  });

  it('allows entering segment description', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('segment-description'), 'Test description');

    expect(screen.getByTestId('segment-description')).toHaveValue('Test description');
  });

  it('allows entering spending criteria', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('min-spent'), '100');
    await user.type(screen.getByTestId('max-spent'), '500');

    expect(screen.getByTestId('min-spent')).toHaveValue(100);
    expect(screen.getByTestId('max-spent')).toHaveValue(500);
  });

  it('allows entering order count criteria', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('min-orders'), '5');
    await user.type(screen.getByTestId('max-orders'), '20');

    expect(screen.getByTestId('min-orders')).toHaveValue(5);
    expect(screen.getByTestId('max-orders')).toHaveValue(20);
  });

  it('disables save when segment name is empty', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));

    const saveButton = screen.getByTestId('save-segment');
    expect(saveButton).toBeDisabled();
  });

  it('calls onCreateSegment when segment is created', async () => {
    const user = userEvent.setup();
    const onCreateSegment = vi.fn();

    render(<CustomerSegmentation onCreateSegment={onCreateSegment} />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('segment-name'), 'Test Segment');
    await user.type(screen.getByTestId('min-spent'), '1000');
    await user.click(screen.getByTestId('save-segment'));

    expect(onCreateSegment).toHaveBeenCalledWith({
      name: 'Test Segment',
      description: '',
      criteria: {
        totalSpent: {
          min: 1000,
          max: undefined,
        },
      },
      color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    });
  });

  it('closes dialog after creating segment', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    await user.type(screen.getByTestId('segment-name'), 'Test Segment');
    await user.click(screen.getByTestId('save-segment'));

    expect(screen.queryByTestId('create-segment-dialog')).not.toBeInTheDocument();
  });

  it('allows canceling segment creation', async () => {
    const user = userEvent.setup();
    render(<CustomerSegmentation />);

    await user.click(screen.getByTestId('create-segment-btn'));
    expect(screen.getByTestId('create-segment-dialog')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('create-segment-dialog')).not.toBeInTheDocument();
  });

  it('allows exporting a segment', async () => {
    const user = userEvent.setup();
    const onExportSegment = vi.fn();

    render(<CustomerSegmentation onExportSegment={onExportSegment} />);

    await user.click(screen.getByTestId('export-vip'));

    expect(onExportSegment).toHaveBeenCalledWith('vip');
  });

  it('accepts custom segments', () => {
    const customSegments = [
      {
        id: 'custom-1',
        name: 'Custom Segment',
        description: 'Test segment',
        criteria: { totalSpent: { min: 500 } },
        customerCount: 50,
        totalRevenue: 25000,
        averageOrderValue: 500,
        color: 'bg-red-100 text-red-700 border-red-300',
      },
    ];

    render(<CustomerSegmentation initialSegments={customSegments} />);

    expect(screen.getByText('Custom Segment')).toBeInTheDocument();
    expect(screen.getByTestId('customers-custom-1')).toHaveTextContent('50');
  });

  it('displays correct segment colors', () => {
    render(<CustomerSegmentation />);

    const vipSegment = screen.getByTestId('segment-vip');
    expect(vipSegment).toHaveClass('bg-purple-100');
  });
});
