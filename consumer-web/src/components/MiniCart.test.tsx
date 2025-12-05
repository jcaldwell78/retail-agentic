import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { MiniCart } from './MiniCart';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('MiniCart', () => {
  it('should not render when isOpen is false', () => {
    renderWithRouter(<MiniCart isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('mini-cart')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mini-cart')).toBeInTheDocument();
  });

  it('should display cart heading with item count', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Shopping Cart (2)')).toBeInTheDocument();
  });

  it('should render backdrop when open', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mini-cart-backdrop')).toBeInTheDocument();
  });

  it('should display close button', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mini-cart-close')).toBeInTheDocument();
  });
});

describe('MiniCart - Cart Items', () => {
  it('should display cart items', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
  });

  it('should display product prices', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    // Prices appear twice - unit price and total price
    const price9999 = screen.getAllByText('$99.99');
    const price24999 = screen.getAllByText('$249.99');

    expect(price9999.length).toBeGreaterThan(0);
    expect(price24999.length).toBeGreaterThan(0);
  });

  it('should display product quantities', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const qtyElements = screen.getAllByText(/Qty: 1/);
    expect(qtyElements).toHaveLength(2);
  });

  it('should link products to product detail page', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const productLinks = screen.getAllByRole('link', { name: 'Wireless Headphones' });
    expect(productLinks[0]).toHaveAttribute('href', '/products/1');
  });

  it('should display product images placeholder', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const placeholders = screen.getAllByText('📦');
    expect(placeholders).toHaveLength(2);
  });
});

describe('MiniCart - Subtotal Calculation', () => {
  it('should display subtotal label', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
  });

  it('should calculate and display correct subtotal', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    // 99.99 + 249.99 = 349.98
    expect(screen.getByTestId('mini-cart-subtotal')).toHaveTextContent('$349.98');
  });

  it('should display shipping note', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Shipping and taxes calculated at checkout')).toBeInTheDocument();
  });
});

describe('MiniCart - Actions', () => {
  it('should display Checkout button', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mini-cart-checkout')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cart-checkout')).toHaveTextContent('Checkout');
  });

  it('should display View Cart button', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('mini-cart-view-cart')).toBeInTheDocument();
    expect(screen.getByTestId('mini-cart-view-cart')).toHaveTextContent('View Cart');
  });

  it('should display Continue Shopping button', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const continueButton = screen.getByText('Continue Shopping');
    expect(continueButton).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    await user.click(screen.getByTestId('mini-cart-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    await user.click(screen.getByTestId('mini-cart-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /checkout and close when Checkout is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockNavigate.mockClear();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    await user.click(screen.getByTestId('mini-cart-checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should navigate to /cart and close when View Cart is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockNavigate.mockClear();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    await user.click(screen.getByTestId('mini-cart-view-cart'));
    expect(mockNavigate).toHaveBeenCalledWith('/cart');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Continue Shopping is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Continue Shopping' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MiniCart - Product Links', () => {
  it('should close cart when product link is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithRouter(<MiniCart isOpen={true} onClose={onClose} />);

    const productLink = screen.getAllByRole('link', { name: 'Wireless Headphones' })[0];
    await user.click(productLink);

    expect(onClose).toHaveBeenCalled();
  });
});

describe('MiniCart - Accessibility', () => {
  it('should have accessible close button', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const closeButton = screen.getByTestId('mini-cart-close');
    expect(closeButton).toHaveAttribute('aria-label', 'Close cart');
  });

  it('should have proper heading', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const heading = screen.getByRole('heading', { name: /Shopping Cart/ });
    expect(heading).toBeInTheDocument();
  });

  it('should have accessible product links', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const headphonesLinks = screen.getAllByRole('link', { name: 'Wireless Headphones' });
    expect(headphonesLinks.length).toBeGreaterThan(0);
  });
});

describe('MiniCart - Layout', () => {
  it('should position cart on right side', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const cart = screen.getByTestId('mini-cart');
    expect(cart).toHaveClass('fixed');
    expect(cart).toHaveClass('right-0');
  });

  it('should be full height', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const cart = screen.getByTestId('mini-cart');
    expect(cart).toHaveClass('h-full');
  });

  it('should have proper z-index', () => {
    renderWithRouter(<MiniCart isOpen={true} onClose={vi.fn()} />);
    const cart = screen.getByTestId('mini-cart');
    const backdrop = screen.getByTestId('mini-cart-backdrop');

    expect(cart).toHaveClass('z-50');
    expect(backdrop).toHaveClass('z-40');
  });
});
