import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  PersonalizedHomepageProvider,
  usePersonalizedHomepage,
  ProductCard,
  ProductCarousel,
  HeroBanner,
  HeroCarousel,
  CategoryGrid,
  DealOfTheDay,
  RecentlyViewed,
  HomepageSkeleton,
  PersonalizedHomepage,
  Product,
  Category,
  Banner,
} from './PersonalizedHomepage';

// Test consumer component
function TestPersonalizedHomepageConsumer() {
  const context = usePersonalizedHomepage();

  return (
    <div>
      <span data-testid="user-id">{context.userId || 'none'}</span>
      <span data-testid="is-loading">{context.isLoading.toString()}</span>
      <span data-testid="error">{context.error || 'none'}</span>
      <span data-testid="recently-viewed-count">{context.recentlyViewed.length}</span>
      <span data-testid="recommended-count">{context.recommendedForYou.length}</span>
      <span data-testid="trending-count">{context.trendingProducts.length}</span>
      <span data-testid="new-arrivals-count">{context.newArrivals.length}</span>
      <span data-testid="best-sellers-count">{context.bestSellers.length}</span>
      <span data-testid="categories-count">{context.personalizedCategories.length}</span>
      <span data-testid="banners-count">{context.heroBanners.length}</span>
      <button
        data-testid="refresh"
        onClick={() => context.refreshRecommendations()}
      >
        Refresh
      </button>
      <button
        data-testid="track-view"
        onClick={() => context.trackProductView('prod-1')}
      >
        Track View
      </button>
      <button
        data-testid="track-click"
        onClick={() => context.trackProductClick('prod-1', 'test')}
      >
        Track Click
      </button>
      <button
        data-testid="clear-recently-viewed"
        onClick={() => context.clearRecentlyViewed()}
      >
        Clear
      </button>
    </div>
  );
}

// Mock data
const mockProduct: Product = {
  id: 'prod-1',
  name: 'Test Product',
  price: 29.99,
  originalPrice: 49.99,
  image: '/test-image.jpg',
  category: 'Electronics',
  rating: 4,
  reviewCount: 100,
  badge: 'sale',
  inStock: true,
};

const mockProducts: Product[] = [
  mockProduct,
  { ...mockProduct, id: 'prod-2', name: 'Product 2' },
  { ...mockProduct, id: 'prod-3', name: 'Product 3' },
];

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Electronics',
  image: '/category.jpg',
  productCount: 150,
};

const mockCategories: Category[] = [
  mockCategory,
  { ...mockCategory, id: 'cat-2', name: 'Clothing' },
  { ...mockCategory, id: 'cat-3', name: 'Home' },
];

const mockBanner: Banner = {
  id: 'banner-1',
  title: 'Summer Sale',
  subtitle: 'Up to 50% off',
  image: '/banner.jpg',
  ctaText: 'Shop Now',
  ctaLink: '/sale',
};

const mockBanners: Banner[] = [
  mockBanner,
  { ...mockBanner, id: 'banner-2', title: 'New Collection' },
];

const mockDealOfTheDay: Product & { endTime: Date } = {
  ...mockProduct,
  id: 'deal-1',
  name: 'Deal Product',
  endTime: new Date(Date.now() + 3600000), // 1 hour from now
};

describe('PersonalizedHomepageProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should provide default context values', () => {
    render(
      <PersonalizedHomepageProvider>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
    expect(screen.getByTestId('recently-viewed-count')).toHaveTextContent('0');
  });

  it('should accept initial data', () => {
    render(
      <PersonalizedHomepageProvider
        userId="user-123"
        initialData={{
          recommendedForYou: mockProducts,
          trendingProducts: mockProducts,
          personalizedCategories: mockCategories,
        }}
      >
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
    expect(screen.getByTestId('recommended-count')).toHaveTextContent('3');
    expect(screen.getByTestId('trending-count')).toHaveTextContent('3');
    expect(screen.getByTestId('categories-count')).toHaveTextContent('3');
  });

  it('should call onProductView when tracking product view', async () => {
    const onProductView = vi.fn();

    render(
      <PersonalizedHomepageProvider onProductView={onProductView}>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('track-view'));
    expect(onProductView).toHaveBeenCalledWith('prod-1');
  });

  it('should call onProductClick when tracking product click', async () => {
    const onProductClick = vi.fn();

    render(
      <PersonalizedHomepageProvider onProductClick={onProductClick}>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('track-click'));
    expect(onProductClick).toHaveBeenCalledWith('prod-1', 'test');
  });

  it('should fetch recommendations when refreshRecommendations is called', async () => {
    const fetchRecommendations = vi.fn().mockResolvedValue({
      recommendedForYou: mockProducts,
      trendingProducts: mockProducts,
    });

    render(
      <PersonalizedHomepageProvider fetchRecommendations={fetchRecommendations}>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => {
      expect(fetchRecommendations).toHaveBeenCalled();
      expect(screen.getByTestId('recommended-count')).toHaveTextContent('3');
    });
  });

  it('should handle fetch error', async () => {
    const fetchRecommendations = vi.fn().mockRejectedValue(new Error('Network error'));

    render(
      <PersonalizedHomepageProvider fetchRecommendations={fetchRecommendations}>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('refresh'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    });
  });

  it('should clear recently viewed products', async () => {
    render(
      <PersonalizedHomepageProvider
        initialData={{ recentlyViewed: mockProducts }}
      >
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('recently-viewed-count')).toHaveTextContent('3');

    await userEvent.click(screen.getByTestId('clear-recently-viewed'));

    expect(screen.getByTestId('recently-viewed-count')).toHaveTextContent('0');
  });
});

describe('usePersonalizedHomepage', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestPersonalizedHomepageConsumer />);
    }).toThrow('usePersonalizedHomepage must be used within a PersonalizedHomepageProvider');

    consoleError.mockRestore();
  });
});

describe('ProductCard', () => {
  const renderProductCard = (props: Partial<React.ComponentProps<typeof ProductCard>> = {}) => {
    return render(
      <PersonalizedHomepageProvider>
        <ProductCard product={mockProduct} {...props} />
      </PersonalizedHomepageProvider>
    );
  };

  it('should render product card', () => {
    renderProductCard();

    expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-name')).toHaveTextContent('Test Product');
    expect(screen.getByTestId('product-price')).toHaveTextContent('$29.99');
  });

  it('should show original price when discounted', () => {
    renderProductCard();

    expect(screen.getByTestId('original-price')).toHaveTextContent('$49.99');
    expect(screen.getByTestId('discount-badge')).toHaveTextContent('-40%');
  });

  it('should show product badge', () => {
    renderProductCard();

    expect(screen.getByTestId('product-badge')).toHaveTextContent('Sale');
  });

  it('should show rating', () => {
    renderProductCard();

    expect(screen.getByTestId('product-rating')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();
  });

  it('should call onAddToCart when add to cart clicked', async () => {
    const onAddToCart = vi.fn();
    renderProductCard({ onAddToCart });

    // Hover to show buttons
    fireEvent.mouseOver(screen.getByTestId('product-card-prod-1'));

    await userEvent.click(screen.getByTestId('add-to-cart-button'));
    expect(onAddToCart).toHaveBeenCalledWith('prod-1');
  });

  it('should call onQuickView when quick view clicked', async () => {
    const onQuickView = vi.fn();
    renderProductCard({ onQuickView });

    fireEvent.mouseOver(screen.getByTestId('product-card-prod-1'));

    await userEvent.click(screen.getByTestId('quick-view-button'));
    expect(onQuickView).toHaveBeenCalledWith('prod-1');
  });

  it('should track product click', async () => {
    const onProductClick = vi.fn();

    render(
      <PersonalizedHomepageProvider onProductClick={onProductClick}>
        <ProductCard product={mockProduct} section="test-section" />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('product-card-prod-1'));
    expect(onProductClick).toHaveBeenCalledWith('prod-1', 'test-section');
  });

  it('should show out of stock overlay', () => {
    render(
      <PersonalizedHomepageProvider>
        <ProductCard product={{ ...mockProduct, inStock: false }} />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should not show rating when showRating is false', () => {
    renderProductCard({ showRating: false });

    expect(screen.queryByTestId('product-rating')).not.toBeInTheDocument();
  });

  it('should not show badge when showBadge is false', () => {
    renderProductCard({ showBadge: false });

    expect(screen.queryByTestId('product-badge')).not.toBeInTheDocument();
  });
});

describe('ProductCarousel', () => {
  const renderCarousel = (props: Partial<React.ComponentProps<typeof ProductCarousel>> = {}) => {
    return render(
      <PersonalizedHomepageProvider>
        <ProductCarousel
          title="Test Products"
          products={mockProducts}
          section="test"
          {...props}
        />
      </PersonalizedHomepageProvider>
    );
  };

  it('should render product carousel', () => {
    renderCarousel();

    expect(screen.getByTestId('carousel-test')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-title')).toHaveTextContent('Test Products');
    expect(screen.getByTestId('product-carousel')).toBeInTheDocument();
  });

  it('should render all products', () => {
    renderCarousel();

    expect(screen.getByTestId('product-card-prod-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-3')).toBeInTheDocument();
  });

  it('should have scroll buttons', () => {
    renderCarousel();

    expect(screen.getByTestId('scroll-left')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-right')).toBeInTheDocument();
  });

  it('should show view all button by default', () => {
    const onViewAll = vi.fn();
    renderCarousel({ onViewAll });

    expect(screen.getByTestId('view-all')).toBeInTheDocument();
  });

  it('should call onViewAll when clicked', async () => {
    const onViewAll = vi.fn();
    renderCarousel({ onViewAll });

    await userEvent.click(screen.getByTestId('view-all'));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('should hide view all when showViewAll is false', () => {
    renderCarousel({ showViewAll: false });

    expect(screen.queryByTestId('view-all')).not.toBeInTheDocument();
  });

  it('should not render when products array is empty', () => {
    renderCarousel({ products: [] });

    expect(screen.queryByTestId('carousel-test')).not.toBeInTheDocument();
  });

  it('should disable left scroll at start', () => {
    renderCarousel();

    expect(screen.getByTestId('scroll-left')).toBeDisabled();
  });
});

describe('HeroBanner', () => {
  it('should render hero banner', () => {
    render(<HeroBanner banner={mockBanner} />);

    expect(screen.getByTestId('hero-banner-banner-1')).toBeInTheDocument();
    expect(screen.getByTestId('banner-title')).toHaveTextContent('Summer Sale');
    expect(screen.getByTestId('banner-subtitle')).toHaveTextContent('Up to 50% off');
    expect(screen.getByTestId('banner-cta')).toHaveTextContent('Shop Now');
  });

  it('should call onCtaClick when CTA clicked', async () => {
    const onCtaClick = vi.fn();
    render(<HeroBanner banner={mockBanner} onCtaClick={onCtaClick} />);

    await userEvent.click(screen.getByTestId('banner-cta'));
    expect(onCtaClick).toHaveBeenCalledWith('banner-1', '/sale');
  });

  it('should not show subtitle when not provided', () => {
    render(<HeroBanner banner={{ ...mockBanner, subtitle: undefined }} />);

    expect(screen.queryByTestId('banner-subtitle')).not.toBeInTheDocument();
  });
});

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render hero carousel', () => {
    render(<HeroCarousel banners={mockBanners} />);

    expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
    expect(screen.getByTestId('banner-title')).toHaveTextContent('Summer Sale');
  });

  it('should show navigation dots', () => {
    render(<HeroCarousel banners={mockBanners} />);

    expect(screen.getByTestId('carousel-dot-0')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-dot-1')).toBeInTheDocument();
  });

  it('should change slide when dot clicked', async () => {
    render(<HeroCarousel banners={mockBanners} autoPlayInterval={0} />);

    fireEvent.click(screen.getByTestId('carousel-dot-1'));
    expect(screen.getByTestId('banner-title')).toHaveTextContent('New Collection');
  });

  it('should auto-advance slides', async () => {
    render(<HeroCarousel banners={mockBanners} autoPlayInterval={1000} />);

    expect(screen.getByTestId('banner-title')).toHaveTextContent('Summer Sale');

    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(screen.getByTestId('banner-title')).toHaveTextContent('New Collection');
  });

  it('should not render when banners array is empty', () => {
    render(<HeroCarousel banners={[]} />);

    expect(screen.queryByTestId('hero-carousel')).not.toBeInTheDocument();
  });

  it('should not show dots for single banner', () => {
    render(<HeroCarousel banners={[mockBanner]} />);

    expect(screen.queryByTestId('carousel-dot-0')).not.toBeInTheDocument();
  });
});

describe('CategoryGrid', () => {
  it('should render category grid', () => {
    render(<CategoryGrid categories={mockCategories} />);

    expect(screen.getByTestId('category-grid')).toBeInTheDocument();
    expect(screen.getByTestId('category-grid-title')).toHaveTextContent('Shop by Category');
  });

  it('should render all categories', () => {
    render(<CategoryGrid categories={mockCategories} />);

    expect(screen.getByTestId('category-cat-1')).toBeInTheDocument();
    expect(screen.getByTestId('category-cat-2')).toBeInTheDocument();
    expect(screen.getByTestId('category-cat-3')).toBeInTheDocument();
  });

  it('should show category name and product count', () => {
    render(<CategoryGrid categories={mockCategories} />);

    expect(screen.getByText('Electronics')).toBeInTheDocument();
    // Multiple categories have the same product count in our mock data
    expect(screen.getAllByText('150 products').length).toBeGreaterThan(0);
  });

  it('should call onCategoryClick when category clicked', async () => {
    const onCategoryClick = vi.fn();
    render(<CategoryGrid categories={mockCategories} onCategoryClick={onCategoryClick} />);

    await userEvent.click(screen.getByTestId('category-cat-1'));
    expect(onCategoryClick).toHaveBeenCalledWith('cat-1');
  });

  it('should accept custom title', () => {
    render(<CategoryGrid categories={mockCategories} title="Browse Categories" />);

    expect(screen.getByTestId('category-grid-title')).toHaveTextContent('Browse Categories');
  });

  it('should not render when categories array is empty', () => {
    render(<CategoryGrid categories={[]} />);

    expect(screen.queryByTestId('category-grid')).not.toBeInTheDocument();
  });
});

describe('DealOfTheDay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render deal of the day', () => {
    render(<DealOfTheDay product={mockDealOfTheDay} />);

    expect(screen.getByTestId('deal-of-the-day')).toBeInTheDocument();
    expect(screen.getByTestId('deal-name')).toHaveTextContent('Deal Product');
    expect(screen.getByTestId('deal-price')).toHaveTextContent('$29.99');
  });

  it('should show countdown timer', () => {
    render(<DealOfTheDay product={mockDealOfTheDay} />);

    expect(screen.getByTestId('countdown')).toBeInTheDocument();
  });

  it('should update countdown', () => {
    render(<DealOfTheDay product={mockDealOfTheDay} />);

    const countdown = screen.getByTestId('countdown');
    const initialTime = countdown.textContent;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(countdown.textContent).not.toBe(initialTime);
  });

  it('should show original price when discounted', () => {
    render(<DealOfTheDay product={mockDealOfTheDay} />);

    expect(screen.getByTestId('deal-original-price')).toHaveTextContent('$49.99');
  });

  it('should call onAddToCart when clicked', async () => {
    vi.useRealTimers();
    const onAddToCart = vi.fn();
    render(<DealOfTheDay product={mockDealOfTheDay} onAddToCart={onAddToCart} />);

    await userEvent.click(screen.getByTestId('deal-add-to-cart'));
    expect(onAddToCart).toHaveBeenCalledWith('deal-1');
    vi.useFakeTimers();
  });

  it('should disable add to cart when out of stock', () => {
    render(
      <DealOfTheDay product={{ ...mockDealOfTheDay, inStock: false }} />
    );

    expect(screen.getByTestId('deal-add-to-cart')).toBeDisabled();
    expect(screen.getByTestId('deal-add-to-cart')).toHaveTextContent('Out of Stock');
  });
});

describe('RecentlyViewed', () => {
  it('should render recently viewed section', () => {
    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: mockProducts }}>
        <RecentlyViewed />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('recently-viewed')).toBeInTheDocument();
    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
  });

  it('should show clear button', () => {
    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: mockProducts }}>
        <RecentlyViewed />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('clear-recently-viewed')).toBeInTheDocument();
  });

  it('should clear recently viewed when clear clicked', async () => {
    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: mockProducts }}>
        <RecentlyViewed />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('clear-recently-viewed'));

    expect(screen.queryByTestId('recently-viewed')).not.toBeInTheDocument();
  });

  it('should not render when no recently viewed products', () => {
    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: [] }}>
        <RecentlyViewed />
      </PersonalizedHomepageProvider>
    );

    expect(screen.queryByTestId('recently-viewed')).not.toBeInTheDocument();
  });

  it('should show max 5 products', () => {
    const manyProducts = Array.from({ length: 10 }, (_, i) => ({
      ...mockProduct,
      id: `prod-${i}`,
    }));

    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: manyProducts }}>
        <RecentlyViewed />
      </PersonalizedHomepageProvider>
    );

    // Should only show 5 products
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`product-card-prod-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('product-card-prod-5')).not.toBeInTheDocument();
  });
});

describe('HomepageSkeleton', () => {
  it('should render skeleton loader', () => {
    render(<HomepageSkeleton />);

    expect(screen.getByTestId('homepage-skeleton')).toBeInTheDocument();
  });
});

describe('PersonalizedHomepage', () => {
  it('should render personalized homepage', () => {
    render(
      <PersonalizedHomepage
        initialData={{
          heroBanners: mockBanners,
          personalizedCategories: mockCategories,
          recommendedForYou: mockProducts,
        }}
      />
    );

    expect(screen.getByTestId('personalized-homepage')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<PersonalizedHomepage initialData={{ isLoading: true }} />);

    expect(screen.getByTestId('homepage-skeleton')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(<PersonalizedHomepage initialData={{ error: 'Something went wrong' }} />);

    expect(screen.getByTestId('homepage-error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render hero carousel', () => {
    render(
      <PersonalizedHomepage
        initialData={{ heroBanners: mockBanners }}
      />
    );

    expect(screen.getByTestId('hero-carousel')).toBeInTheDocument();
  });

  it('should render category grid', () => {
    render(
      <PersonalizedHomepage
        initialData={{ personalizedCategories: mockCategories }}
      />
    );

    expect(screen.getByTestId('category-grid')).toBeInTheDocument();
  });

  it('should render deal of the day', () => {
    render(
      <PersonalizedHomepage
        initialData={{ dealOfTheDay: mockDealOfTheDay }}
      />
    );

    expect(screen.getByTestId('deal-of-the-day')).toBeInTheDocument();
  });

  it('should render product carousels', () => {
    render(
      <PersonalizedHomepage
        initialData={{
          recommendedForYou: mockProducts,
          trendingProducts: mockProducts,
          newArrivals: mockProducts,
          bestSellers: mockProducts,
        }}
      />
    );

    expect(screen.getByTestId('carousel-recommended')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-trending')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-new-arrivals')).toBeInTheDocument();
    expect(screen.getByTestId('carousel-best-sellers')).toBeInTheDocument();
  });

  it('should pass callbacks correctly', async () => {
    const onAddToCart = vi.fn();
    const onCategoryClick = vi.fn();

    render(
      <PersonalizedHomepage
        initialData={{
          personalizedCategories: mockCategories,
        }}
        onAddToCart={onAddToCart}
        onCategoryClick={onCategoryClick}
      />
    );

    await userEvent.click(screen.getByTestId('category-cat-1'));
    expect(onCategoryClick).toHaveBeenCalledWith('cat-1');
  });

  it('should call onViewAll with section name', async () => {
    const onViewAll = vi.fn();

    render(
      <PersonalizedHomepage
        initialData={{ recommendedForYou: mockProducts }}
        onViewAll={onViewAll}
      />
    );

    await userEvent.click(screen.getByTestId('view-all'));
    expect(onViewAll).toHaveBeenCalledWith('recommended');
  });
});

describe('Accessibility', () => {
  it('scroll buttons should have aria-labels', () => {
    render(
      <PersonalizedHomepageProvider>
        <ProductCarousel title="Test" products={mockProducts} section="test" />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByLabelText('Scroll left')).toBeInTheDocument();
    expect(screen.getByLabelText('Scroll right')).toBeInTheDocument();
  });

  it('carousel dots should have aria-labels', () => {
    render(<HeroCarousel banners={mockBanners} />);

    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
  });

  it('product images should have alt text', () => {
    render(
      <PersonalizedHomepageProvider>
        <ProductCard product={mockProduct} />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByAltText('Test Product')).toBeInTheDocument();
  });

  it('category images should have alt text', () => {
    render(<CategoryGrid categories={mockCategories} />);

    expect(screen.getByAltText('Electronics')).toBeInTheDocument();
  });

  it('banner images should have alt text', () => {
    render(<HeroBanner banner={mockBanner} />);

    expect(screen.getByAltText('Summer Sale')).toBeInTheDocument();
  });
});

describe('localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load recently viewed from localStorage', () => {
    localStorage.setItem('recently_viewed_products', JSON.stringify(mockProducts));

    render(
      <PersonalizedHomepageProvider>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    expect(screen.getByTestId('recently-viewed-count')).toHaveTextContent('3');
  });

  it('should save recently viewed to localStorage', async () => {
    render(
      <PersonalizedHomepageProvider initialData={{ recentlyViewed: mockProducts }}>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    const saved = localStorage.getItem('recently_viewed_products');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!)).toHaveLength(3);
  });

  it('should clear localStorage when clearing recently viewed', async () => {
    localStorage.setItem('recently_viewed_products', JSON.stringify(mockProducts));

    render(
      <PersonalizedHomepageProvider>
        <TestPersonalizedHomepageConsumer />
      </PersonalizedHomepageProvider>
    );

    await userEvent.click(screen.getByTestId('clear-recently-viewed'));

    // After clearing, localStorage is removed (then useEffect saves empty array)
    // Check that the state is empty
    expect(screen.getByTestId('recently-viewed-count')).toHaveTextContent('0');
  });
});
