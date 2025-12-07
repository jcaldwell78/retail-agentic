import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import * as orderTrackingApi from '@/lib/api/orderTracking';
import type { OrderTrackingInfo, StatusHistoryEntry } from '@/lib/api/orderTracking';

// Mock the API
vi.mock('@/lib/api/orderTracking', () => ({
  orderTrackingApi: {
    getTrackingInfo: vi.fn(),
    trackOrderByNumber: vi.fn(),
  },
}));

const mockStatusHistory: StatusHistoryEntry[] = [
  {
    status: 'PENDING',
    timestamp: '2024-01-15T10:00:00Z',
    note: 'Order created',
  },
  {
    status: 'PROCESSING',
    timestamp: '2024-01-15T14:00:00Z',
    note: 'Order is being prepared',
  },
  {
    status: 'SHIPPED',
    timestamp: '2024-01-16T09:00:00Z',
    note: 'Order shipped via UPS - Tracking: 1Z999AA10123456784',
  },
];

const mockTrackingShipped: OrderTrackingInfo = {
  orderNumber: 'ORD-20240115-0001',
  status: 'SHIPPED',
  carrier: 'UPS',
  trackingNumber: '1Z999AA10123456784',
  trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
  estimatedDeliveryDate: '2024-01-20T18:00:00Z',
  actualDeliveryDate: null,
  statusHistory: mockStatusHistory,
  orderCreatedAt: '2024-01-15T10:00:00Z',
  lastUpdatedAt: '2024-01-16T09:00:00Z',
};

const mockTrackingDelivered: OrderTrackingInfo = {
  orderNumber: 'ORD-20240115-0002',
  status: 'DELIVERED',
  carrier: 'FEDEX',
  trackingNumber: '794600111222333',
  trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=794600111222333',
  estimatedDeliveryDate: '2024-01-20T18:00:00Z',
  actualDeliveryDate: '2024-01-19T15:30:00Z',
  statusHistory: [
    ...mockStatusHistory,
    {
      status: 'DELIVERED',
      timestamp: '2024-01-19T15:30:00Z',
      note: 'Order delivered',
    },
  ],
  orderCreatedAt: '2024-01-15T10:00:00Z',
  lastUpdatedAt: '2024-01-19T15:30:00Z',
};

const mockTrackingCancelled: OrderTrackingInfo = {
  orderNumber: 'ORD-20240115-0003',
  status: 'CANCELLED',
  carrier: null,
  trackingNumber: null,
  trackingUrl: null,
  estimatedDeliveryDate: null,
  actualDeliveryDate: null,
  statusHistory: [
    {
      status: 'PENDING',
      timestamp: '2024-01-15T10:00:00Z',
      note: 'Order created',
    },
    {
      status: 'CANCELLED',
      timestamp: '2024-01-15T12:00:00Z',
      note: 'Order cancelled by customer',
    },
  ],
  orderCreatedAt: '2024-01-15T10:00:00Z',
  lastUpdatedAt: '2024-01-15T12:00:00Z',
};

const mockTrackingPending: OrderTrackingInfo = {
  orderNumber: 'ORD-20240115-0004',
  status: 'PENDING',
  carrier: null,
  trackingNumber: null,
  trackingUrl: null,
  estimatedDeliveryDate: null,
  actualDeliveryDate: null,
  statusHistory: [
    {
      status: 'PENDING',
      timestamp: '2024-01-15T10:00:00Z',
      note: 'Order created',
    },
  ],
  orderCreatedAt: '2024-01-15T10:00:00Z',
  lastUpdatedAt: '2024-01-15T10:00:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('OrderTrackingTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockResolvedValue(mockTrackingShipped);
    vi.mocked(orderTrackingApi.orderTrackingApi.trackOrderByNumber).mockResolvedValue(mockTrackingShipped);
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching data', () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      expect(screen.getByTestId('order-tracking-loading')).toBeInTheDocument();
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should display error state when loading fails', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockRejectedValue(
        new Error('Network error')
      );

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Unable to load tracking')).toBeInTheDocument();
    });

    it('should allow retry on error', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTrackingShipped);

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-error')).toBeInTheDocument();
      });

      await userEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-timeline')).toBeInTheDocument();
      });
    });
  });

  describe('Timeline Display', () => {
    it('should render the tracking timeline', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-timeline')).toBeInTheDocument();
      });

      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-20240115-0001')).toBeInTheDocument();
    });

    it('should display all status steps', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline-step-pending')).toBeInTheDocument();
      });

      expect(screen.getByTestId('timeline-step-processing')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-step-shipped')).toBeInTheDocument();
      expect(screen.getByTestId('timeline-step-delivered')).toBeInTheDocument();
    });

    it('should show "Current" badge on active status', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByText('Current')).toBeInTheDocument();
      });
    });

    it('should display status history notes', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByText('Order created')).toBeInTheDocument();
      });

      expect(screen.getByText('Order is being prepared')).toBeInTheDocument();
      expect(screen.getByText(/Order shipped via UPS/)).toBeInTheDocument();
    });
  });

  describe('Shipping Information', () => {
    it('should display shipping info card when tracking is available', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('shipping-info-card')).toBeInTheDocument();
      });

      expect(screen.getByText('Shipping Information')).toBeInTheDocument();
      expect(screen.getByText('UPS')).toBeInTheDocument();
      expect(screen.getByText('1Z999AA10123456784')).toBeInTheDocument();
    });

    it('should display tracking link when trackingUrl is available', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('tracking-link')).toBeInTheDocument();
      });

      const trackingLink = screen.getByTestId('tracking-link');
      expect(trackingLink).toHaveAttribute('href', 'https://www.ups.com/track?tracknum=1Z999AA10123456784');
      expect(trackingLink).toHaveAttribute('target', '_blank');
    });

    it('should display estimated delivery date', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
      });
    });

    it('should not show shipping info when no carrier/tracking', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockResolvedValue(mockTrackingPending);

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-timeline')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('shipping-info-card')).not.toBeInTheDocument();
    });
  });

  describe('Delivered Status', () => {
    it('should display actual delivery date when delivered', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockResolvedValue(mockTrackingDelivered);

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByText('Delivered On')).toBeInTheDocument();
      });
    });

    it('should show all steps as completed when delivered', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockResolvedValue(mockTrackingDelivered);

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline-step-delivered')).toBeInTheDocument();
      });
    });
  });

  describe('Cancelled Status', () => {
    it('should display cancelled status', async () => {
      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockResolvedValue(mockTrackingCancelled);

      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('timeline-step-cancelled')).toBeInTheDocument();
      });

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should render compact timeline when compact prop is true', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" compact />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-compact')).toBeInTheDocument();
      });

      expect(screen.getByTestId('compact-timeline')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    it('should call getTrackingInfo with orderId', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-123" />);

      await waitFor(() => {
        expect(orderTrackingApi.orderTrackingApi.getTrackingInfo).toHaveBeenCalledWith('order-123');
      });
    });

    it('should call trackOrderByNumber with orderNumber and email', async () => {
      renderWithRouter(
        <OrderTrackingTimeline orderNumber="ORD-123" email="test@example.com" />
      );

      await waitFor(() => {
        expect(orderTrackingApi.orderTrackingApi.trackOrderByNumber).toHaveBeenCalledWith(
          'ORD-123',
          'test@example.com'
        );
      });
    });
  });

  describe('Refresh', () => {
    it('should have a refresh button', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('refresh-tracking-button')).toBeInTheDocument();
      });
    });

    it('should refresh tracking data when refresh button is clicked', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('order-tracking-timeline')).toBeInTheDocument();
      });

      vi.mocked(orderTrackingApi.orderTrackingApi.getTrackingInfo).mockClear();

      await userEvent.click(screen.getByTestId('refresh-tracking-button'));

      await waitFor(() => {
        expect(orderTrackingApi.orderTrackingApi.getTrackingInfo).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Last Updated', () => {
    it('should display last updated timestamp', async () => {
      renderWithRouter(<OrderTrackingTimeline orderId="order-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });
});
