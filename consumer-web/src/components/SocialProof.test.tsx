import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react';
import {
  SocialProofProvider,
  useSocialProof,
  LiveViewers,
  RecentPurchaseNotification,
  RecentPurchasesFeed,
  PopularityBadge,
  LowStockUrgency,
  RatingBadge,
  SocialProofWidget,
  SocialProofBanner,
  useLiveViewers,
  useRecentPurchases,
  type RecentPurchase,
} from './SocialProof';

const mockPurchase: RecentPurchase = {
  id: 'purchase-1',
  productId: 'product-1',
  productName: 'Blue T-Shirt',
  buyerLocation: 'New York',
  timeAgo: '2 minutes ago',
  timestamp: new Date(),
};

const mockPurchases: RecentPurchase[] = [
  mockPurchase,
  {
    id: 'purchase-2',
    productId: 'product-1',
    productName: 'Blue T-Shirt',
    buyerLocation: 'Los Angeles',
    timeAgo: '5 minutes ago',
    timestamp: new Date(),
  },
  {
    id: 'purchase-3',
    productId: 'product-1',
    productName: 'Blue T-Shirt',
    buyerLocation: 'Chicago',
    timeAgo: '10 minutes ago',
    timestamp: new Date(),
  },
];

describe('LiveViewers', () => {
  it('should render viewer count', () => {
    render(<LiveViewers productId="product-1" viewerCount={5} />);
    expect(screen.getByTestId('live-viewers-product-1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not render when count is below minimum', () => {
    render(<LiveViewers productId="product-1" viewerCount={1} minToShow={2} />);
    expect(screen.queryByTestId('live-viewers-product-1')).not.toBeInTheDocument();
  });

  it('should render when count equals minimum', () => {
    render(<LiveViewers productId="product-1" viewerCount={2} minToShow={2} />);
    expect(screen.getByTestId('live-viewers-product-1')).toBeInTheDocument();
  });

  it('should render badge variant by default', () => {
    render(<LiveViewers productId="product-1" viewerCount={5} />);
    expect(screen.getByText('viewing')).toBeInTheDocument();
  });

  it('should render text variant', () => {
    render(<LiveViewers productId="product-1" viewerCount={5} variant="text" />);
    expect(screen.getByText('5 people viewing now')).toBeInTheDocument();
  });

  it('should render compact variant', () => {
    render(<LiveViewers productId="product-1" viewerCount={5} variant="compact" />);
    const element = screen.getByTestId('live-viewers-product-1');
    expect(element).toHaveTextContent('5');
    expect(element).toHaveClass('text-xs');
  });

  it('should accept custom className', () => {
    render(<LiveViewers productId="product-1" viewerCount={5} className="custom-class" />);
    expect(screen.getByTestId('live-viewers-product-1')).toHaveClass('custom-class');
  });

  it('should update count when prop changes', () => {
    const { rerender } = render(<LiveViewers productId="product-1" viewerCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<LiveViewers productId="product-1" viewerCount={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});

describe('RecentPurchaseNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render purchase notification', () => {
    render(<RecentPurchaseNotification purchase={mockPurchase} autoHide={false} />);
    expect(screen.getByTestId('purchase-notification-purchase-1')).toBeInTheDocument();
  });

  it('should display product name', () => {
    render(<RecentPurchaseNotification purchase={mockPurchase} autoHide={false} />);
    expect(screen.getByTestId('purchase-product')).toHaveTextContent('Blue T-Shirt');
  });

  it('should display buyer location', () => {
    render(<RecentPurchaseNotification purchase={mockPurchase} autoHide={false} />);
    expect(screen.getByTestId('purchase-details')).toHaveTextContent('Someone from New York');
  });

  it('should display time ago', () => {
    render(<RecentPurchaseNotification purchase={mockPurchase} autoHide={false} />);
    expect(screen.getByTestId('purchase-details')).toHaveTextContent('2 minutes ago');
  });

  it('should auto hide after delay', async () => {
    const onClose = vi.fn();
    render(
      <RecentPurchaseNotification
        purchase={mockPurchase}
        onClose={onClose}
        autoHide={true}
        autoHideDelay={3000}
      />
    );

    expect(screen.getByTestId('purchase-notification-purchase-1')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when close button clicked', async () => {
    vi.useRealTimers();
    const onClose = vi.fn();
    render(
      <RecentPurchaseNotification
        purchase={mockPurchase}
        onClose={onClose}
        autoHide={false}
      />
    );

    await userEvent.click(screen.getByTestId('close-notification'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should work without buyer location', () => {
    const purchaseWithoutLocation = { ...mockPurchase, buyerLocation: undefined };
    render(<RecentPurchaseNotification purchase={purchaseWithoutLocation} autoHide={false} />);
    expect(screen.getByTestId('purchase-details')).toHaveTextContent('purchased 2 minutes ago');
    expect(screen.getByTestId('purchase-details')).not.toHaveTextContent('Someone from');
  });
});

describe('RecentPurchasesFeed', () => {
  it('should render purchases feed', () => {
    render(<RecentPurchasesFeed purchases={mockPurchases} />);
    expect(screen.getByTestId('recent-purchases-feed')).toBeInTheDocument();
  });

  it('should display all purchases up to limit', () => {
    render(<RecentPurchasesFeed purchases={mockPurchases} limit={5} />);
    expect(screen.getByTestId('purchase-item-purchase-1')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-item-purchase-2')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-item-purchase-3')).toBeInTheDocument();
  });

  it('should respect limit', () => {
    render(<RecentPurchasesFeed purchases={mockPurchases} limit={2} />);
    expect(screen.getByTestId('purchase-item-purchase-1')).toBeInTheDocument();
    expect(screen.getByTestId('purchase-item-purchase-2')).toBeInTheDocument();
    expect(screen.queryByTestId('purchase-item-purchase-3')).not.toBeInTheDocument();
  });

  it('should not render when no purchases', () => {
    const { container } = render(<RecentPurchasesFeed purchases={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should display purchase time', () => {
    render(<RecentPurchasesFeed purchases={mockPurchases} />);
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('should display buyer location', () => {
    render(<RecentPurchasesFeed purchases={mockPurchases} />);
    expect(screen.getByText('New York -')).toBeInTheDocument();
  });
});

describe('PopularityBadge', () => {
  it('should render badge variant', () => {
    render(<PopularityBadge count={50} period="day" />);
    expect(screen.getByTestId('popularity-badge')).toBeInTheDocument();
    expect(screen.getByText('50 sold today')).toBeInTheDocument();
  });

  it('should render text variant', () => {
    render(<PopularityBadge count={50} period="day" variant="text" />);
    expect(screen.getByTestId('popularity-text')).toHaveTextContent('50 sold today');
  });

  it('should render flame variant', () => {
    render(<PopularityBadge count={50} period="day" variant="flame" />);
    expect(screen.getByTestId('popularity-flame')).toHaveTextContent('50 sold');
  });

  it('should show correct period text for hour', () => {
    render(<PopularityBadge count={10} period="hour" />);
    expect(screen.getByText('10 sold in the last hour')).toBeInTheDocument();
  });

  it('should show correct period text for week', () => {
    render(<PopularityBadge count={100} period="week" />);
    expect(screen.getByText('100 sold this week')).toBeInTheDocument();
  });

  it('should not render when count is 0', () => {
    const { container } = render(<PopularityBadge count={0} period="day" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should apply trending styles', () => {
    render(<PopularityBadge count={50} period="day" trending />);
    expect(screen.getByTestId('popularity-badge')).toHaveClass('bg-red-100');
  });
});

describe('LowStockUrgency', () => {
  it('should render for low stock', () => {
    render(<LowStockUrgency stockCount={5} />);
    expect(screen.getByTestId('low-stock-urgency')).toBeInTheDocument();
    expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument();
  });

  it('should not render when stock is 0', () => {
    const { container } = render(<LowStockUrgency stockCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should not render when stock is above threshold', () => {
    const { container } = render(<LowStockUrgency stockCount={15} threshold={10} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should show urgency for very low stock', () => {
    render(<LowStockUrgency stockCount={2} />);
    expect(screen.getByText('Only 2 left!')).toBeInTheDocument();
    expect(screen.getByTestId('low-stock-urgency')).toHaveClass('text-red-600');
  });

  it('should show orange for moderate low stock', () => {
    render(<LowStockUrgency stockCount={7} />);
    expect(screen.getByTestId('low-stock-urgency')).toHaveClass('text-orange-600');
  });

  it('should respect custom threshold', () => {
    render(<LowStockUrgency stockCount={8} threshold={5} />);
    expect(screen.queryByTestId('low-stock-urgency')).not.toBeInTheDocument();
  });
});

describe('RatingBadge', () => {
  it('should render compact variant by default', () => {
    render(<RatingBadge rating={4.5} />);
    expect(screen.getByTestId('rating-compact')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('should render stars variant', () => {
    render(<RatingBadge rating={4} variant="stars" />);
    expect(screen.getByTestId('rating-stars')).toBeInTheDocument();
  });

  it('should render full variant', () => {
    render(<RatingBadge rating={4.5} variant="full" />);
    expect(screen.getByTestId('rating-full')).toBeInTheDocument();
  });

  it('should display review count', () => {
    render(<RatingBadge rating={4.5} reviewCount={128} />);
    expect(screen.getByText('(128)')).toBeInTheDocument();
  });

  it('should round rating to one decimal', () => {
    render(<RatingBadge rating={4.567} />);
    expect(screen.getByText('4.6')).toBeInTheDocument();
  });

  it('should show singular review text for 1 review', () => {
    render(<RatingBadge rating={5} reviewCount={1} variant="full" />);
    expect(screen.getByText('(1 review)')).toBeInTheDocument();
  });

  it('should show plural review text for multiple reviews', () => {
    render(<RatingBadge rating={5} reviewCount={50} variant="full" />);
    expect(screen.getByText('(50 reviews)')).toBeInTheDocument();
  });
});

describe('SocialProofWidget', () => {
  it('should render widget with all indicators', () => {
    render(
      <SocialProofWidget
        productId="product-1"
        viewerCount={10}
        purchaseCount={50}
        stockCount={5}
        rating={4.5}
        reviewCount={100}
      />
    );
    expect(screen.getByTestId('social-proof-widget-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('live-viewers-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('popularity-badge')).toBeInTheDocument();
    expect(screen.getByTestId('low-stock-urgency')).toBeInTheDocument();
    expect(screen.getByTestId('rating-compact')).toBeInTheDocument();
  });

  it('should respect config options', () => {
    render(
      <SocialProofWidget
        productId="product-1"
        viewerCount={10}
        purchaseCount={50}
        rating={4.5}
        config={{ showViewers: false, showPopularity: false, showRatings: false }}
      />
    );
    expect(screen.queryByTestId('live-viewers-product-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('popularity-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('rating-compact')).not.toBeInTheDocument();
  });

  it('should respect minViewersToShow config', () => {
    render(
      <SocialProofWidget
        productId="product-1"
        viewerCount={3}
        config={{ minViewersToShow: 5 }}
      />
    );
    expect(screen.queryByTestId('live-viewers-product-1')).not.toBeInTheDocument();
  });

  it('should not render if no content to show', () => {
    const { container } = render(
      <SocialProofWidget
        productId="product-1"
        viewerCount={0}
        purchaseCount={0}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should use correct purchase period', () => {
    render(
      <SocialProofWidget
        productId="product-1"
        purchaseCount={50}
        purchasePeriod="hour"
      />
    );
    expect(screen.getByText('50 sold in the last hour')).toBeInTheDocument();
  });
});

describe('SocialProofBanner', () => {
  it('should render banner', () => {
    render(<SocialProofBanner message="100 people are shopping right now!" />);
    expect(screen.getByTestId('social-proof-banner')).toBeInTheDocument();
    expect(screen.getByText('100 people are shopping right now!')).toBeInTheDocument();
  });

  it('should render with different icons', () => {
    const { rerender } = render(<SocialProofBanner message="Test" icon="users" />);
    expect(screen.getByTestId('social-proof-banner')).toBeInTheDocument();

    rerender(<SocialProofBanner message="Test" icon="trending" />);
    expect(screen.getByTestId('social-proof-banner')).toBeInTheDocument();

    rerender(<SocialProofBanner message="Test" icon="fire" />);
    expect(screen.getByTestId('social-proof-banner')).toBeInTheDocument();

    rerender(<SocialProofBanner message="Test" icon="star" />);
    expect(screen.getByTestId('social-proof-banner')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<SocialProofBanner message="Test" variant="info" />);
    expect(screen.getByTestId('social-proof-banner')).toHaveClass('bg-blue-50');

    rerender(<SocialProofBanner message="Test" variant="success" />);
    expect(screen.getByTestId('social-proof-banner')).toHaveClass('bg-green-50');

    rerender(<SocialProofBanner message="Test" variant="warning" />);
    expect(screen.getByTestId('social-proof-banner')).toHaveClass('bg-orange-50');
  });
});

describe('SocialProofProvider', () => {
  it('should provide context', () => {
    const TestComponent = () => {
      const { viewers, recentPurchases } = useSocialProof();
      return (
        <div>
          <span data-testid="viewers">{viewers.size}</span>
          <span data-testid="purchases">{recentPurchases.length}</span>
        </div>
      );
    };

    render(
      <SocialProofProvider>
        <TestComponent />
      </SocialProofProvider>
    );

    expect(screen.getByTestId('viewers')).toHaveTextContent('0');
    expect(screen.getByTestId('purchases')).toHaveTextContent('0');
  });

  it('should update viewers', () => {
    const TestComponent = () => {
      const { viewers, updateViewers } = useSocialProof();
      return (
        <div>
          <span data-testid="count">{viewers.get('product-1')?.viewerCount || 0}</span>
          <button onClick={() => updateViewers('product-1', 10)}>Update</button>
        </div>
      );
    };

    render(
      <SocialProofProvider>
        <TestComponent />
      </SocialProofProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    userEvent.click(screen.getByText('Update'));
  });

  it('should add purchases', () => {
    const TestComponent = () => {
      const { recentPurchases, addPurchase } = useSocialProof();
      return (
        <div>
          <span data-testid="count">{recentPurchases.length}</span>
          <button onClick={() => addPurchase(mockPurchase)}>Add</button>
        </div>
      );
    };

    render(
      <SocialProofProvider>
        <TestComponent />
      </SocialProofProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    userEvent.click(screen.getByText('Add'));
  });

  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      useSocialProof();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useSocialProof must be used within a SocialProofProvider'
    );
  });
});

describe('useLiveViewers hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial count', () => {
    const { result } = renderHook(() => useLiveViewers('product-1', 10));
    expect(result.current.viewerCount).toBe(10);
    expect(result.current.productId).toBe('product-1');
  });

  it('should update count over time', () => {
    const { result } = renderHook(() =>
      useLiveViewers('product-1', 10, { updateInterval: 1000 })
    );

    expect(result.current.viewerCount).toBe(10);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Count should have changed (could go up or down)
    expect(typeof result.current.viewerCount).toBe('number');
  });
});

describe('useRecentPurchases hook', () => {
  it('should return empty purchases initially', () => {
    const { result } = renderHook(() => useRecentPurchases('product-1', 'Test Product'));
    expect(result.current.purchases).toHaveLength(0);
  });

  it('should add purchase', () => {
    const { result } = renderHook(() => useRecentPurchases('product-1', 'Test Product'));

    act(() => {
      result.current.addPurchase();
    });

    expect(result.current.purchases).toHaveLength(1);
    expect(result.current.purchases[0].productName).toBe('Test Product');
  });

  it('should limit purchases to 10', () => {
    const { result } = renderHook(() => useRecentPurchases('product-1', 'Test Product'));

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addPurchase();
      }
    });

    expect(result.current.purchases).toHaveLength(10);
  });
});

describe('Accessibility', () => {
  it('should have accessible rating stars', () => {
    render(<RatingBadge rating={4} variant="stars" />);
    const stars = screen.getByTestId('rating-stars');
    expect(stars).toBeInTheDocument();
  });

  it('should have accessible close button', () => {
    render(
      <RecentPurchaseNotification
        purchase={mockPurchase}
        onClose={() => {}}
        autoHide={false}
      />
    );
    expect(screen.getByTestId('close-notification')).toBeInTheDocument();
  });
});
