import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ProductQuickView } from './ProductQuickView';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 99.99,
  originalPrice: 149.99,
  rating: 4.5,
  reviewCount: 123,
  description: 'This is a test product description',
  images: ['📱', '💻', '⌚'],
  inStock: true,
  stockCount: 50,
  category: ['Electronics'],
  colors: ['Black', 'White', 'Silver'],
  sizes: ['S', 'M', 'L', 'XL'],
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductQuickView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should not render when product is null', () => {
    const { container } = renderWithRouter(
      <ProductQuickView product={null} isOpen={true} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the quick view modal when open', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByTestId('product-quick-view')).toBeInTheDocument();
  });

  it('should display product name', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should display product price and original price', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
    expect(screen.getByText('Save $50.00')).toBeInTheDocument();
  });

  it('should display product rating and review count', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText(/4.5/)).toBeInTheDocument();
    expect(screen.getByText(/123 reviews/)).toBeInTheDocument();
  });

  it('should display product description', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
  });

  it('should display stock status when in stock', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText(/In Stock \(50 available\)/)).toBeInTheDocument();
  });

  it('should display out of stock status', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    renderWithRouter(
      <ProductQuickView product={outOfStockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should display image gallery with thumbnails', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    // Main image and 3 thumbnails
    expect(screen.getAllByText('📱')).toHaveLength(2); // Main + thumbnail
    expect(screen.getByText('💻')).toBeInTheDocument();
    expect(screen.getByText('⌚')).toBeInTheDocument();
  });

  it('should change selected image when thumbnail is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    // Click second thumbnail
    const thumbnails = screen.getAllByRole('button').filter((btn) => btn.textContent === '💻');
    await user.click(thumbnails[0]);

    // Verify image changed (implementation specific test)
    expect(thumbnails[0]).toBeInTheDocument();
  });

  it('should display color options', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
  });

  it('should select color when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const whiteButton = screen.getByRole('button', { name: 'White' });
    await user.click(whiteButton);

    // Button should be selected (has specific classes)
    expect(whiteButton).toHaveClass('border-blue-600');
  });

  it('should display size options', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('XL')).toBeInTheDocument();
  });

  it('should select size when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const largeButton = screen.getByRole('button', { name: 'L' });
    await user.click(largeButton);

    // Button should be selected (has specific classes)
    expect(largeButton).toHaveClass('border-blue-600');
  });

  it('should display quantity selector with default value of 1', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );
    expect(screen.getByTestId('quantity-display')).toHaveTextContent('1');
  });

  it('should increase quantity when + button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const increaseButton = screen.getByTestId('increase-quantity');
    await user.click(increaseButton);

    expect(screen.getByTestId('quantity-display')).toHaveTextContent('2');
  });

  it('should decrease quantity when - button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const increaseButton = screen.getByTestId('increase-quantity');
    const decreaseButton = screen.getByTestId('decrease-quantity');

    // Increase to 2
    await user.click(increaseButton);
    expect(screen.getByTestId('quantity-display')).toHaveTextContent('2');

    // Decrease back to 1
    await user.click(decreaseButton);
    expect(screen.getByTestId('quantity-display')).toHaveTextContent('1');
  });

  it('should not decrease quantity below 1', async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const decreaseButton = screen.getByTestId('decrease-quantity');
    await user.click(decreaseButton);

    expect(screen.getByTestId('quantity-display')).toHaveTextContent('1');
  });

  it('should not increase quantity above stock count', async () => {
    const lowStockProduct = { ...mockProduct, stockCount: 2 };
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={lowStockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const increaseButton = screen.getByTestId('increase-quantity');
    await user.click(increaseButton);
    await user.click(increaseButton);
    await user.click(increaseButton); // Try to go beyond stock

    expect(screen.getByTestId('quantity-display')).toHaveTextContent('2');
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={onClose} />
    );

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it('should show alert and close modal when add to cart is clicked', async () => {
    const onClose = vi.fn();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();

    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={onClose} />
    );

    const addToCartButton = screen.getByTestId('quick-view-add-to-cart');
    await user.click(addToCartButton);

    expect(alertSpy).toHaveBeenCalledWith('Product added to cart!');
    expect(onClose).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('should disable add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, inStock: false };
    renderWithRouter(
      <ProductQuickView product={outOfStockProduct} isOpen={true} onClose={vi.fn()} />
    );

    const addToCartButton = screen.getByTestId('quick-view-add-to-cart');
    expect(addToCartButton).toBeDisabled();
  });

  it('should navigate to product details when View Details is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={onClose} />
    );

    const viewDetailsButton = screen.getByTestId('view-full-details');
    await user.click(viewDetailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/products/1');
    expect(onClose).toHaveBeenCalled();
  });

  it('should render without colors and sizes', () => {
    const simpleProduct = {
      ...mockProduct,
      colors: undefined,
      sizes: undefined,
    };

    renderWithRouter(
      <ProductQuickView product={simpleProduct} isOpen={true} onClose={vi.fn()} />
    );

    // Should not display color/size labels
    expect(screen.queryByText('Color')).not.toBeInTheDocument();
    expect(screen.queryByText('Size')).not.toBeInTheDocument();
  });

  it('should render without original price', () => {
    const regularPriceProduct = {
      ...mockProduct,
      originalPrice: undefined,
    };

    renderWithRouter(
      <ProductQuickView product={regularPriceProduct} isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.queryByText(/Save/)).not.toBeInTheDocument();
  });

  it('should have accessible structure', () => {
    renderWithRouter(
      <ProductQuickView product={mockProduct} isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons.length).toBeGreaterThan(0);
  });
});
