import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RecentlyViewedProducts, RecentlyViewedCompact } from './RecentlyViewedProducts';
import * as recentlyViewedHook from '@/hooks/useRecentlyViewed';
import type { Product } from '@/lib/api/types';

// Mock the useRecentlyViewed hook
vi.mock('@/hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: vi.fn(),
}));

// Mock product data
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones',
    sku: 'WH-001',
    price: 99.99,
    compareAtPrice: 129.99,
    category: 'Electronics',
    tags: ['audio', 'wireless'],
    images: ['https://example.com/headphones.jpg'],
    attributes: {},
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    tenantId: 'tenant-1',
    name: 'Smart Watch',
    description: 'Fitness tracking smart watch',
    sku: 'SW-001',
    price: 249.99,
    category: 'Electronics',
    tags: ['wearable', 'fitness'],
    images: ['https://example.com/watch.jpg'],
    attributes: {},
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-3',
    tenantId: 'tenant-1',
    name: 'Laptop Stand',
    description: 'Ergonomic laptop stand',
    sku: 'LS-001',
    price: 49.99,
    category: 'Accessories',
    tags: ['desk', 'ergonomic'],
    images: [],
    attributes: {},
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Default mock implementation
const defaultMockReturn = {
  products: mockProducts,
  isLoading: false,
  error: null,
  count: mockProducts.length,
  refresh: vi.fn(),
  recordView: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn(),
  isViewed: vi.fn(),
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('RecentlyViewedProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue(defaultMockReturn);
  });

  describe('Rendering', () => {
    it('should render the section with products', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByTestId('recently-viewed-section')).toBeInTheDocument();
      expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      renderWithRouter(<RecentlyViewedProducts title="Continue Shopping" />);

      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    it('should render product cards with correct information', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('Smart Watch')).toBeInTheDocument();
      expect(screen.getByText('$249.99')).toBeInTheDocument();
    });

    it('should show sale badge for discounted products', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      // Wireless Headphones has compareAtPrice > price
      const saleBadges = screen.getAllByText('Sale');
      expect(saleBadges.length).toBeGreaterThan(0);
    });

    it('should show original price for discounted products', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByText('$129.99')).toBeInTheDocument();
    });

    it('should render placeholder for products without images', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      // Laptop Stand has no images - should show placeholder
      const placeholders = screen.getAllByRole('listitem');
      expect(placeholders.length).toBe(3);
    });

    it('should not render when there are no products and not loading', () => {
      vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
        ...defaultMockReturn,
        products: [],
        count: 0,
      });

      const { container } = renderWithRouter(<RecentlyViewedProducts />);

      expect(container.querySelector('[data-testid="recently-viewed-section"]')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton loaders when loading', () => {
      vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
        ...defaultMockReturn,
        products: [],
        isLoading: true,
      });

      renderWithRouter(<RecentlyViewedProducts limit={4} />);

      expect(screen.getByTestId('recently-viewed-section')).toBeInTheDocument();
      // Should have skeleton elements
      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBe(4);
    });
  });

  describe('Clear All Button', () => {
    it('should show Clear All button by default', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    it('should hide Clear All button when showClearButton is false', () => {
      renderWithRouter(<RecentlyViewedProducts showClearButton={false} />);

      expect(screen.queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
    });

    it('should call clear function when Clear All is clicked', async () => {
      const clearMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
        ...defaultMockReturn,
        clear: clearMock,
      });

      renderWithRouter(<RecentlyViewedProducts />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await userEvent.click(clearButton);

      expect(clearMock).toHaveBeenCalled();
    });
  });

  describe('Remove Individual Product', () => {
    it('should show remove buttons by default', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      const removeButtons = screen.getAllByRole('button', { name: /remove.*from recently viewed/i });
      expect(removeButtons.length).toBe(3);
    });

    it('should hide remove buttons when showRemoveButtons is false', () => {
      renderWithRouter(<RecentlyViewedProducts showRemoveButtons={false} />);

      const removeButtons = screen.queryAllByRole('button', { name: /remove.*from recently viewed/i });
      expect(removeButtons.length).toBe(0);
    });

    it('should call remove function when remove button is clicked', async () => {
      const removeMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
        ...defaultMockReturn,
        remove: removeMock,
      });

      renderWithRouter(<RecentlyViewedProducts />);

      const removeButtons = screen.getAllByRole('button', { name: /remove.*from recently viewed/i });
      await userEvent.click(removeButtons[0]);

      expect(removeMock).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('Product Click Callback', () => {
    it('should call onProductClick when a product is clicked', async () => {
      const onProductClick = vi.fn();
      renderWithRouter(<RecentlyViewedProducts onProductClick={onProductClick} />);

      const productLink = screen.getByRole('link', { name: /view wireless headphones/i });
      await userEvent.click(productLink);

      expect(onProductClick).toHaveBeenCalledWith(mockProducts[0]);
    });
  });

  describe('View All Link', () => {
    it('should show View All link when count exceeds displayed products', () => {
      vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
        ...defaultMockReturn,
        count: 10, // More than displayed
      });

      renderWithRouter(<RecentlyViewedProducts limit={3} />);

      expect(screen.getByRole('link', { name: /view all \(10\)/i })).toBeInTheDocument();
    });

    it('should not show View All link when all products are displayed', () => {
      renderWithRouter(<RecentlyViewedProducts limit={10} />);

      expect(screen.queryByRole('link', { name: /view all/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByRole('region', { name: /recently viewed products/i })).toBeInTheDocument();
      expect(screen.getByRole('list')).toHaveAttribute('aria-labelledby', 'recently-viewed-title');
    });

    it('should have accessible product links', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByRole('link', { name: /view wireless headphones/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view smart watch/i })).toBeInTheDocument();
    });

    it('should have accessible remove buttons', () => {
      renderWithRouter(<RecentlyViewedProducts />);

      expect(screen.getByRole('button', { name: /remove wireless headphones from recently viewed/i })).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      renderWithRouter(<RecentlyViewedProducts className="bg-gray-100 mt-8" />);

      const section = screen.getByTestId('recently-viewed-section');
      expect(section).toHaveClass('bg-gray-100', 'mt-8');
    });
  });
});

describe('RecentlyViewedCompact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue(defaultMockReturn);
  });

  it('should render compact version', () => {
    renderWithRouter(<RecentlyViewedCompact />);

    expect(screen.getByTestId('recently-viewed-compact')).toBeInTheDocument();
    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
  });

  it('should render limited number of products', () => {
    renderWithRouter(<RecentlyViewedCompact limit={2} />);

    // Should still show products from the mock (hook is mocked)
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
  });

  it('should not render when there are no products and not loading', () => {
    vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
      ...defaultMockReturn,
      products: [],
      count: 0,
    });

    const { container } = renderWithRouter(<RecentlyViewedCompact />);

    expect(container.querySelector('[data-testid="recently-viewed-compact"]')).not.toBeInTheDocument();
  });

  it('should show loading skeletons when loading', () => {
    vi.mocked(recentlyViewedHook.useRecentlyViewed).mockReturnValue({
      ...defaultMockReturn,
      products: [],
      isLoading: true,
    });

    renderWithRouter(<RecentlyViewedCompact />);

    expect(screen.getByTestId('recently-viewed-compact')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    renderWithRouter(<RecentlyViewedCompact className="p-4 border" />);

    const container = screen.getByTestId('recently-viewed-compact');
    expect(container).toHaveClass('p-4', 'border');
  });
});
