import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  EmptyState,
  EmptyCart,
  EmptyWishlist,
  EmptyOrders,
  NoSearchResults,
  EmptyNotifications,
  EmptyReviews,
  EmptyQuestions,
  type EmptyStateType,
} from './EmptyState';
import { AlertCircle } from 'lucide-react';

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

describe('EmptyState', () => {
  describe('Basic rendering', () => {
    it('should render cart empty state', () => {
      renderWithRouter(<EmptyState type="cart" />);
      expect(screen.getByTestId('empty-state-cart')).toBeInTheDocument();
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('should render wishlist empty state', () => {
      renderWithRouter(<EmptyState type="wishlist" />);
      expect(screen.getByTestId('empty-state-wishlist')).toBeInTheDocument();
      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
    });

    it('should render orders empty state', () => {
      renderWithRouter(<EmptyState type="orders" />);
      expect(screen.getByTestId('empty-state-orders')).toBeInTheDocument();
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
    });

    it('should render search empty state', () => {
      renderWithRouter(<EmptyState type="search" />);
      expect(screen.getByTestId('empty-state-search')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should render notifications empty state', () => {
      renderWithRouter(<EmptyState type="notifications" />);
      expect(screen.getByTestId('empty-state-notifications')).toBeInTheDocument();
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });

    it('should render reviews empty state', () => {
      renderWithRouter(<EmptyState type="reviews" />);
      expect(screen.getByTestId('empty-state-reviews')).toBeInTheDocument();
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });

    it('should render questions empty state', () => {
      renderWithRouter(<EmptyState type="questions" />);
      expect(screen.getByTestId('empty-state-questions')).toBeInTheDocument();
      expect(screen.getByText('No questions yet')).toBeInTheDocument();
    });

    it('should render custom empty state', () => {
      renderWithRouter(
        <EmptyState
          type="custom"
          title="Custom Title"
          description="Custom description"
          icon={AlertCircle}
        />
      );
      expect(screen.getByTestId('empty-state-custom')).toBeInTheDocument();
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });
  });

  describe('Illustrations', () => {
    it('should render cart illustration', () => {
      renderWithRouter(<EmptyState type="cart" />);
      expect(screen.getByTestId('cart-illustration')).toBeInTheDocument();
    });

    it('should render wishlist illustration', () => {
      renderWithRouter(<EmptyState type="wishlist" />);
      expect(screen.getByTestId('wishlist-illustration')).toBeInTheDocument();
    });

    it('should render orders illustration', () => {
      renderWithRouter(<EmptyState type="orders" />);
      expect(screen.getByTestId('orders-illustration')).toBeInTheDocument();
    });

    it('should render search illustration', () => {
      renderWithRouter(<EmptyState type="search" />);
      expect(screen.getByTestId('search-illustration')).toBeInTheDocument();
    });

    it('should render notifications illustration', () => {
      renderWithRouter(<EmptyState type="notifications" />);
      expect(screen.getByTestId('notifications-illustration')).toBeInTheDocument();
    });

    it('should render default illustration for other types', () => {
      renderWithRouter(<EmptyState type="messages" />);
      expect(screen.getByTestId('default-illustration')).toBeInTheDocument();
    });

    it('should render custom illustration when provided', () => {
      renderWithRouter(
        <EmptyState
          type="cart"
          illustration={<div data-testid="custom-illustration">Custom</div>}
        />
      );
      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
      expect(screen.queryByTestId('cart-illustration')).not.toBeInTheDocument();
    });
  });

  describe('Custom content override', () => {
    it('should use custom title over default', () => {
      renderWithRouter(<EmptyState type="cart" title="My Custom Title" />);
      expect(screen.getByText('My Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Your cart is empty')).not.toBeInTheDocument();
    });

    it('should use custom description over default', () => {
      renderWithRouter(
        <EmptyState type="cart" description="My custom description" />
      );
      expect(screen.getByText('My custom description')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render action button with link', () => {
      renderWithRouter(<EmptyState type="cart" />);
      const actionButton = screen.getByTestId('empty-state-action');
      expect(actionButton).toBeInTheDocument();
      expect(actionButton).toHaveAttribute('href', '/products');
    });

    it('should render action button with onClick handler', async () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <EmptyState
          type="custom"
          title="Test"
          actionLabel="Click Me"
          onAction={handleClick}
        />
      );

      await userEvent.click(screen.getByTestId('empty-state-action'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render secondary button with link', () => {
      renderWithRouter(
        <EmptyState
          type="cart"
          secondaryLabel="Browse Categories"
          secondaryPath="/categories"
        />
      );
      const secondaryButton = screen.getByTestId('empty-state-secondary');
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveAttribute('href', '/categories');
    });

    it('should render secondary button with onClick handler', async () => {
      const handleClick = vi.fn();
      renderWithRouter(
        <EmptyState
          type="cart"
          secondaryLabel="Cancel"
          onSecondaryAction={handleClick}
        />
      );

      await userEvent.click(screen.getByTestId('empty-state-secondary'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not render action button when no label', () => {
      renderWithRouter(<EmptyState type="notifications" />);
      expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      renderWithRouter(<EmptyState type="cart" size="sm" />);
      expect(screen.getByTestId('empty-state-cart')).toBeInTheDocument();
    });

    it('should render medium size (default)', () => {
      renderWithRouter(<EmptyState type="cart" size="md" />);
      expect(screen.getByTestId('empty-state-cart')).toBeInTheDocument();
    });

    it('should render large size', () => {
      renderWithRouter(<EmptyState type="cart" size="lg" />);
      expect(screen.getByTestId('empty-state-cart')).toBeInTheDocument();
    });
  });

  describe('Children content', () => {
    it('should render children', () => {
      renderWithRouter(
        <EmptyState type="cart">
          <div data-testid="custom-children">Additional content</div>
        </EmptyState>
      );
      expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    });
  });

  describe('All types render correctly', () => {
    const types: EmptyStateType[] = [
      'cart',
      'wishlist',
      'orders',
      'search',
      'products',
      'payment-methods',
      'addresses',
      'notifications',
      'reviews',
      'questions',
      'messages',
      'favorites',
      'history',
    ];

    it.each(types)('should render %s type', (type) => {
      renderWithRouter(<EmptyState type={type} />);
      expect(screen.getByTestId(`empty-state-${type}`)).toBeInTheDocument();
    });
  });
});

describe('EmptyCart', () => {
  it('should render cart empty state', () => {
    renderWithRouter(<EmptyCart />);
    expect(screen.getByTestId('empty-state-cart')).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('should accept custom props', () => {
    renderWithRouter(<EmptyCart title="Custom Cart Title" />);
    expect(screen.getByText('Custom Cart Title')).toBeInTheDocument();
  });

  it('should render cart illustration', () => {
    renderWithRouter(<EmptyCart />);
    expect(screen.getByTestId('cart-illustration')).toBeInTheDocument();
  });
});

describe('EmptyWishlist', () => {
  it('should render wishlist empty state', () => {
    renderWithRouter(<EmptyWishlist />);
    expect(screen.getByTestId('empty-state-wishlist')).toBeInTheDocument();
    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
  });

  it('should render wishlist illustration', () => {
    renderWithRouter(<EmptyWishlist />);
    expect(screen.getByTestId('wishlist-illustration')).toBeInTheDocument();
  });
});

describe('EmptyOrders', () => {
  it('should render orders empty state', () => {
    renderWithRouter(<EmptyOrders />);
    expect(screen.getByTestId('empty-state-orders')).toBeInTheDocument();
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
  });

  it('should render orders illustration', () => {
    renderWithRouter(<EmptyOrders />);
    expect(screen.getByTestId('orders-illustration')).toBeInTheDocument();
  });
});

describe('NoSearchResults', () => {
  it('should render search empty state', () => {
    renderWithRouter(<NoSearchResults />);
    expect(screen.getByTestId('empty-state-search')).toBeInTheDocument();
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should show query in title when provided', () => {
    renderWithRouter(<NoSearchResults query="blue shoes" />);
    expect(screen.getByText('No results for "blue shoes"')).toBeInTheDocument();
  });

  it('should render search illustration', () => {
    renderWithRouter(<NoSearchResults />);
    expect(screen.getByTestId('search-illustration')).toBeInTheDocument();
  });
});

describe('EmptyNotifications', () => {
  it('should render notifications empty state', () => {
    renderWithRouter(<EmptyNotifications />);
    expect(screen.getByTestId('empty-state-notifications')).toBeInTheDocument();
    expect(screen.getByText('No notifications')).toBeInTheDocument();
  });

  it('should render notifications illustration', () => {
    renderWithRouter(<EmptyNotifications />);
    expect(screen.getByTestId('notifications-illustration')).toBeInTheDocument();
  });

  it('should not show action button by default', () => {
    renderWithRouter(<EmptyNotifications />);
    expect(screen.queryByTestId('empty-state-action')).not.toBeInTheDocument();
  });
});

describe('EmptyReviews', () => {
  it('should render reviews empty state', () => {
    renderWithRouter(<EmptyReviews />);
    expect(screen.getByTestId('empty-state-reviews')).toBeInTheDocument();
    expect(screen.getByText('No reviews yet')).toBeInTheDocument();
  });

  it('should show write review action', () => {
    const handleClick = vi.fn();
    renderWithRouter(<EmptyReviews onAction={handleClick} />);
    expect(screen.getByTestId('empty-state-action')).toHaveTextContent(
      'Write a Review'
    );
  });
});

describe('EmptyQuestions', () => {
  it('should render questions empty state', () => {
    renderWithRouter(<EmptyQuestions />);
    expect(screen.getByTestId('empty-state-questions')).toBeInTheDocument();
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('should show ask question action', () => {
    const handleClick = vi.fn();
    renderWithRouter(<EmptyQuestions onAction={handleClick} />);
    expect(screen.getByTestId('empty-state-action')).toHaveTextContent(
      'Ask a Question'
    );
  });
});

describe('Accessibility', () => {
  it('should have appropriate heading structure', () => {
    renderWithRouter(<EmptyState type="cart" />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Your cart is empty');
  });

  it('should have accessible links', () => {
    renderWithRouter(<EmptyState type="cart" />);
    const link = screen.getByRole('link', { name: 'Start Shopping' });
    expect(link).toHaveAttribute('href', '/products');
  });
});
