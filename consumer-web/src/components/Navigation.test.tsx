import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { Navigation } from './Navigation';

// Mock the hooks and components
const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/MiniCart', () => ({
  MiniCart: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="mini-cart" onClick={onClose}>Mini Cart</div> : null,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navigation - Search Autocomplete', () => {
  beforeEach(() => {
    mockNavigate.mockClear();

    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });
  });

  it('should render navigation component', () => {
    renderWithRouter(<Navigation />);
    expect(screen.getByText('Store')).toBeInTheDocument();
  });

  it('should show search button initially', () => {
    renderWithRouter(<Navigation />);
    const searchButton = screen.getByRole('button', { name: 'Search products' });
    expect(searchButton).toBeInTheDocument();
  });

  it('should show search input when search button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should filter and show search results when typing', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wireless');

    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Wireless Mouse')).toBeInTheDocument();
  });

  it('should not show results for queries less than 2 characters', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'w');

    expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
  });

  it('should show maximum of 5 results', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'e'); // Will match many products

    await waitFor(() => {
      const results = screen.queryAllByTestId(/search-result-/);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  it('should display product price and category in results', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wireless headphones');

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    });

    expect(screen.getByText(/Electronics • \$99.99/)).toBeInTheDocument();
  });

  it('should navigate to product page when result is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wireless headphones');

    await waitFor(() => {
      expect(screen.getByTestId('search-result-1')).toBeInTheDocument();
    });

    const result = screen.getByTestId('search-result-1');
    await user.click(result);

    expect(mockNavigate).toHaveBeenCalledWith('/products/1');
  });

  it('should clear search query after clicking result', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wireless');

    await waitFor(() => {
      expect(screen.getByTestId('search-result-1')).toBeInTheDocument();
    });

    const result = screen.getByTestId('search-result-1');
    await user.click(result);

    await waitFor(() => {
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('should navigate to products search page on form submit', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'wireless headphones');
    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/products?search=wireless%20headphones');
  });

  it('should not submit empty search', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    await user.keyboard('{Enter}');

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should close search when clicking outside', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    expect(screen.getByTestId('search-input')).toBeInTheDocument();

    // Click on the logo to trigger outside click
    const logo = screen.getByText('Store');
    await user.click(logo);

    await waitFor(() => {
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('should filter results case-insensitively', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'WIRELESS');

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    });
  });

  it('should update results as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');

    // Type 'smart'
    await user.type(searchInput, 'smart');
    await waitFor(() => {
      expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    });

    // Clear and type 'laptop'
    await user.clear(searchInput);
    await user.type(searchInput, 'laptop');
    await waitFor(() => {
      expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
      expect(screen.queryByText('Smart Watch')).not.toBeInTheDocument();
    });
  });

  it('should autofocus search input when opened', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveFocus();
  });

  it('should show no results when no products match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const searchButton = screen.getByRole('button', { name: 'Search products' });
    await user.click(searchButton);

    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'xyz nonexistent product');

    await waitFor(() => {
      expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
    });
  });

  it('should render cart button with item count', () => {
    renderWithRouter(<Navigation />);
    const cartButton = screen.getAllByLabelText('Shopping cart, 2 items')[0];
    expect(cartButton).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();
  });

  it('should open mini cart when cart button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const cartButton = screen.getAllByTestId('cart-button')[0];
    await user.click(cartButton);

    expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
  });

  it('should show sign in and sign up buttons when not logged in', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    renderWithRouter(<Navigation />);
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('should show logout button when logged in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      logout: vi.fn(),
    });

    renderWithRouter(<Navigation />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('should call logout when logout button is clicked', async () => {
    const mockLogout = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      logout: mockLogout,
    });

    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should toggle mobile menu', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navigation />);

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    await user.click(menuButton);

    // Mobile menu should be visible
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close menu' });
    await user.click(closeButton);

    // Mobile menu should be hidden
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  });
});
