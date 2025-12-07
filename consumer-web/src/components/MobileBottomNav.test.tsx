import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  MobileBottomNav,
  MobileBottomNavSpacer,
  MobileExpandedNav,
  type NavItem,
} from './MobileBottomNav';
import { Home, ShoppingCart, User } from 'lucide-react';

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
  );
};

const customNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'cart', label: 'Cart', icon: ShoppingCart, path: '/cart', showBadge: true },
  { id: 'account', label: 'Account', icon: User, path: '/profile' },
];

describe('MobileBottomNav', () => {
  describe('Rendering', () => {
    it('should render the navigation bar', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument();
    });

    it('should render default navigation items', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-categories')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-cart')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-wishlist')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-account')).toBeInTheDocument();
    });

    it('should render custom navigation items', () => {
      renderWithRouter(<MobileBottomNav items={customNavItems} />);
      expect(screen.getByTestId('nav-item-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-cart')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-account')).toBeInTheDocument();
      expect(screen.queryByTestId('nav-item-categories')).not.toBeInTheDocument();
    });

    it('should render labels', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Wishlist')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  describe('Active state', () => {
    it('should highlight home when on home page', () => {
      renderWithRouter(<MobileBottomNav />, ['/']);
      const homeItem = screen.getByTestId('nav-item-home');
      expect(homeItem).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight cart when on cart page', () => {
      renderWithRouter(<MobileBottomNav />, ['/cart']);
      const cartItem = screen.getByTestId('nav-item-cart');
      expect(cartItem).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight account when on profile page', () => {
      renderWithRouter(<MobileBottomNav />, ['/profile']);
      const accountItem = screen.getByTestId('nav-item-account');
      expect(accountItem).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight categories for product paths', () => {
      renderWithRouter(<MobileBottomNav />, ['/products/123']);
      const categoriesItem = screen.getByTestId('nav-item-categories');
      expect(categoriesItem).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Badge', () => {
    it('should show cart badge when cartItemCount > 0', () => {
      renderWithRouter(<MobileBottomNav cartItemCount={3} />);
      expect(screen.getByTestId('nav-badge-cart')).toBeInTheDocument();
      expect(screen.getByTestId('nav-badge-cart')).toHaveTextContent('3');
    });

    it('should not show cart badge when cartItemCount is 0', () => {
      renderWithRouter(<MobileBottomNav cartItemCount={0} />);
      expect(screen.queryByTestId('nav-badge-cart')).not.toBeInTheDocument();
    });

    it('should show "99+" when count exceeds 99', () => {
      renderWithRouter(<MobileBottomNav cartItemCount={150} />);
      expect(screen.getByTestId('nav-badge-cart')).toHaveTextContent('99+');
    });

    it('should show custom badge on items with badge property', () => {
      const itemsWithBadge: NavItem[] = [
        { id: 'notifications', label: 'Alerts', icon: Home, path: '/alerts', badge: 5, showBadge: true },
      ];
      renderWithRouter(<MobileBottomNav items={itemsWithBadge} />);
      expect(screen.getByTestId('nav-badge-notifications')).toHaveTextContent('5');
    });
  });

  describe('Accessibility', () => {
    it('should have navigation role', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have aria-label', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(
        screen.getByRole('navigation', { name: 'Mobile navigation' })
      ).toBeInTheDocument();
    });

    it('should have aria-current on active item', () => {
      renderWithRouter(<MobileBottomNav />, ['/cart']);
      expect(screen.getByTestId('nav-item-cart')).toHaveAttribute(
        'aria-current',
        'page'
      );
    });
  });

  describe('Links', () => {
    it('should have correct href for each item', () => {
      renderWithRouter(<MobileBottomNav />);
      expect(screen.getByTestId('nav-item-home')).toHaveAttribute('href', '/');
      expect(screen.getByTestId('nav-item-cart')).toHaveAttribute('href', '/cart');
      expect(screen.getByTestId('nav-item-account')).toHaveAttribute(
        'href',
        '/profile'
      );
    });
  });
});

describe('MobileBottomNavSpacer', () => {
  it('should render spacer element', () => {
    render(<MobileBottomNavSpacer />);
    expect(screen.getByTestId('mobile-nav-spacer')).toBeInTheDocument();
  });

  it('should have aria-hidden attribute', () => {
    render(<MobileBottomNavSpacer />);
    expect(screen.getByTestId('mobile-nav-spacer')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });
});

describe('MobileExpandedNav', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    renderWithRouter(<MobileExpandedNav isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByTestId('mobile-expanded-nav')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('mobile-expanded-nav')).toBeInTheDocument();
  });

  it('should render menu items', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('expanded-nav-orders')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-nav-wishlist')).toBeInTheDocument();
    expect(screen.getByTestId('expanded-nav-settings')).toBeInTheDocument();
  });

  it('should render backdrop', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('mobile-nav-backdrop')).toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('mobile-nav-backdrop'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when menu item is clicked', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId('expanded-nav-orders'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct links', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('expanded-nav-orders')).toHaveAttribute(
      'href',
      '/orders'
    );
    expect(screen.getByTestId('expanded-nav-wishlist')).toHaveAttribute(
      'href',
      '/wishlist'
    );
    expect(screen.getByTestId('expanded-nav-settings')).toHaveAttribute(
      'href',
      '/settings'
    );
  });

  it('should have menu role', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should have menuitem role for items', () => {
    renderWithRouter(<MobileExpandedNav isOpen={true} onClose={mockOnClose} />);
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });
});
