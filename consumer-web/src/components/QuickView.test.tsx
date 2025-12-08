import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  QuickViewProvider,
  QuickViewModal,
  QuickViewButton,
  QuickViewContainer,
  ImageGallery,
  VariantSelector,
  QuantitySelector,
  QuickViewTrustBadges,
  ProductCardWithQuickView,
  useQuickView,
  QuickViewProduct,
  ProductVariant,
} from './QuickView';

// Mock product data
const mockProduct: QuickViewProduct = {
  id: 'prod-1',
  name: 'Test Product',
  description: 'This is a test product description that explains the features.',
  price: 99.99,
  currency: 'USD',
  images: [
    { id: 'img-1', url: '/image1.jpg', alt: 'Image 1' },
    { id: 'img-2', url: '/image2.jpg', alt: 'Image 2' },
    { id: 'img-3', url: '/image3.jpg', alt: 'Image 3' },
  ],
  variants: [
    {
      id: 'size',
      name: 'Size',
      type: 'size',
      options: [
        { id: 's', value: 'S', label: 'Small', available: true },
        { id: 'm', value: 'M', label: 'Medium', available: true },
        { id: 'l', value: 'L', label: 'Large', available: false },
      ],
    },
    {
      id: 'color',
      name: 'Color',
      type: 'color',
      options: [
        { id: 'red', value: 'red', label: 'Red', available: true, colorHex: '#ff0000' },
        { id: 'blue', value: 'blue', label: 'Blue', available: true, colorHex: '#0000ff' },
      ],
    },
  ],
  rating: 4.5,
  reviewCount: 123,
  inStock: true,
  stockCount: 15,
  brand: 'Test Brand',
  category: 'Electronics',
};

const mockProductNoVariants: QuickViewProduct = {
  id: 'prod-2',
  name: 'Simple Product',
  description: 'A simple product without variants',
  price: 49.99,
  images: [{ id: 'img-1', url: '/image1.jpg', alt: 'Image 1' }],
  inStock: true,
};

const mockProductOutOfStock: QuickViewProduct = {
  ...mockProduct,
  id: 'prod-3',
  name: 'Out of Stock Product',
  inStock: false,
};

const mockProductWithSale: QuickViewProduct = {
  ...mockProduct,
  id: 'prod-4',
  name: 'Sale Product',
  compareAtPrice: 149.99,
};

// Test component to access context
function TestContextConsumer() {
  const { isOpen, product, openQuickView, closeQuickView } = useQuickView();
  return (
    <div>
      <span data-testid="is-open">{isOpen.toString()}</span>
      <span data-testid="product-id">{product?.id || 'null'}</span>
      <button data-testid="open-btn" onClick={() => openQuickView(mockProduct)}>Open</button>
      <button data-testid="close-btn" onClick={closeQuickView}>Close</button>
    </div>
  );
}

describe('QuickViewProvider', () => {
  it('should provide default context values', () => {
    render(
      <QuickViewProvider>
        <TestContextConsumer />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('product-id')).toHaveTextContent('null');
  });

  it('should open quick view with product', async () => {
    render(
      <QuickViewProvider>
        <TestContextConsumer />
      </QuickViewProvider>
    );

    await userEvent.click(screen.getByTestId('open-btn'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('product-id')).toHaveTextContent('prod-1');
  });

  it('should close quick view', async () => {
    render(
      <QuickViewProvider>
        <TestContextConsumer />
      </QuickViewProvider>
    );

    await userEvent.click(screen.getByTestId('open-btn'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    await userEvent.click(screen.getByTestId('close-btn'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });
});

describe('useQuickView', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestContextConsumer />);
    }).toThrow('useQuickView must be used within a QuickViewProvider');

    consoleError.mockRestore();
  });
});

describe('ImageGallery', () => {
  it('should render main image', () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    expect(screen.getByTestId('main-image')).toBeInTheDocument();
    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image1.jpg');
  });

  it('should render navigation arrows when multiple images', () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    expect(screen.getByTestId('prev-image-btn')).toBeInTheDocument();
    expect(screen.getByTestId('next-image-btn')).toBeInTheDocument();
  });

  it('should not render navigation arrows for single image', () => {
    render(<ImageGallery images={[mockProduct.images[0]]} productName={mockProduct.name} />);

    expect(screen.queryByTestId('prev-image-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('next-image-btn')).not.toBeInTheDocument();
  });

  it('should navigate to next image', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    await userEvent.click(screen.getByTestId('next-image-btn'));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image2.jpg');
  });

  it('should navigate to previous image', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    // Go to second image first
    await userEvent.click(screen.getByTestId('next-image-btn'));
    await userEvent.click(screen.getByTestId('prev-image-btn'));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image1.jpg');
  });

  it('should wrap around to last image when pressing prev on first', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    await userEvent.click(screen.getByTestId('prev-image-btn'));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image3.jpg');
  });

  it('should wrap around to first image when pressing next on last', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    await userEvent.click(screen.getByTestId('next-image-btn'));
    await userEvent.click(screen.getByTestId('next-image-btn'));
    await userEvent.click(screen.getByTestId('next-image-btn'));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image1.jpg');
  });

  it('should render image counter', () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    expect(screen.getByTestId('image-counter')).toHaveTextContent('1 / 3');
  });

  it('should update image counter when navigating', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    await userEvent.click(screen.getByTestId('next-image-btn'));

    expect(screen.getByTestId('image-counter')).toHaveTextContent('2 / 3');
  });

  it('should render thumbnails', () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    expect(screen.getByTestId('thumbnail-strip')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-0')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-1')).toBeInTheDocument();
    expect(screen.getByTestId('thumbnail-2')).toBeInTheDocument();
  });

  it('should select image when clicking thumbnail', async () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    await userEvent.click(screen.getByTestId('thumbnail-2'));

    expect(screen.getByTestId('main-image')).toHaveAttribute('src', '/image3.jpg');
    expect(screen.getByTestId('image-counter')).toHaveTextContent('3 / 3');
  });

  it('should render placeholder when no images', () => {
    render(<ImageGallery images={[]} productName={mockProduct.name} />);

    expect(screen.getByTestId('no-image-placeholder')).toBeInTheDocument();
    expect(screen.getByText('No image available')).toBeInTheDocument();
  });
});

describe('VariantSelector', () => {
  const mockVariants: ProductVariant[] = mockProduct.variants!;
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('should render variant options', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByTestId('variant-selector')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('should render size options as buttons', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByTestId('size-option-s')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-m')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-l')).toBeInTheDocument();
  });

  it('should render color options as color swatches', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByTestId('color-option-red')).toBeInTheDocument();
    expect(screen.getByTestId('color-option-blue')).toBeInTheDocument();
  });

  it('should call onSelectOption when clicking option', async () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    await userEvent.click(screen.getByTestId('size-option-m'));

    expect(mockOnSelect).toHaveBeenCalledWith('size', 'm');
  });

  it('should disable unavailable options', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByTestId('size-option-l')).toBeDisabled();
  });

  it('should show selected option label', () => {
    render(
      <VariantSelector
        variants={mockVariants}
        selectedOptions={{ size: 'm' }}
        onSelectOption={mockOnSelect}
      />
    );

    expect(screen.getByText(': Medium')).toBeInTheDocument();
  });

  it('should return null when no variants', () => {
    const { container } = render(
      <VariantSelector
        variants={[]}
        selectedOptions={{}}
        onSelectOption={mockOnSelect}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('QuantitySelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render quantity selector', () => {
    render(
      <QuantitySelector
        quantity={1}
        onQuantityChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('quantity-selector')).toBeInTheDocument();
    expect(screen.getByTestId('quantity-value')).toHaveTextContent('1');
  });

  it('should increase quantity', async () => {
    render(
      <QuantitySelector
        quantity={1}
        onQuantityChange={mockOnChange}
      />
    );

    await userEvent.click(screen.getByTestId('increase-quantity'));

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should decrease quantity', async () => {
    render(
      <QuantitySelector
        quantity={3}
        onQuantityChange={mockOnChange}
      />
    );

    await userEvent.click(screen.getByTestId('decrease-quantity'));

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should disable decrease button at quantity 1', () => {
    render(
      <QuantitySelector
        quantity={1}
        onQuantityChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('decrease-quantity')).toBeDisabled();
  });

  it('should disable increase button at max quantity', () => {
    render(
      <QuantitySelector
        quantity={10}
        maxQuantity={10}
        onQuantityChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('increase-quantity')).toBeDisabled();
  });

  it('should not go below 1', async () => {
    render(
      <QuantitySelector
        quantity={1}
        onQuantityChange={mockOnChange}
      />
    );

    await userEvent.click(screen.getByTestId('decrease-quantity'));

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should not exceed max quantity', async () => {
    render(
      <QuantitySelector
        quantity={5}
        maxQuantity={5}
        onQuantityChange={mockOnChange}
      />
    );

    await userEvent.click(screen.getByTestId('increase-quantity'));

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});

describe('QuickViewTrustBadges', () => {
  it('should render all trust badges', () => {
    render(<QuickViewTrustBadges />);

    expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument();
    expect(screen.getByText('Easy Returns')).toBeInTheDocument();
  });
});

describe('QuickViewModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAddToCart = vi.fn();
  const mockOnAddToWishlist = vi.fn();
  const mockOnShare = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAddToCart.mockClear();
    mockOnAddToWishlist.mockClear();
    mockOnShare.mockClear();
    mockOnViewDetails.mockClear();
  });

  it('should render modal when open', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('quick-view-modal')).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByTestId('quick-view-modal')).not.toBeInTheDocument();
  });

  it('should render product name', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('product-name')).toHaveTextContent('Test Product');
  });

  it('should render product brand', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('product-brand')).toHaveTextContent('Test Brand');
  });

  it('should render product price', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('product-price')).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toHaveTextContent('$99.99');
  });

  it('should render sale price with discount badge', () => {
    render(
      <QuickViewModal
        product={mockProductWithSale}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('33% OFF')).toBeInTheDocument();
    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });

  it('should render product description', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('product-description')).toHaveTextContent(mockProduct.description);
  });

  it('should render product rating', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('product-rating')).toBeInTheDocument();
    expect(screen.getByText('(123 reviews)')).toBeInTheDocument();
  });

  it('should render in stock status', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('stock-status')).toBeInTheDocument();
    expect(screen.getByText(/In Stock/)).toBeInTheDocument();
  });

  it('should render low stock warning', () => {
    const lowStockProduct = { ...mockProduct, stockCount: 5 };
    render(
      <QuickViewModal
        product={lowStockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Only 5 left!/)).toBeInTheDocument();
  });

  it('should render out of stock status', () => {
    render(
      <QuickViewModal
        product={mockProductOutOfStock}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should render image gallery', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });

  it('should render variant selector', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('variant-selector')).toBeInTheDocument();
  });

  it('should render quantity selector', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('quantity-selector')).toBeInTheDocument();
  });

  it('should render add to cart button', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByTestId('add-to-cart-btn')).toBeInTheDocument();
  });

  it('should disable add to cart when out of stock', () => {
    render(
      <QuickViewModal
        product={mockProductOutOfStock}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByTestId('add-to-cart-btn')).toBeDisabled();
  });

  it('should disable add to cart when variants not selected', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByTestId('add-to-cart-btn')).toBeDisabled();
  });

  it('should enable add to cart when all variants selected', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    // Select size
    await userEvent.click(screen.getByTestId('size-option-m'));
    // Select color
    await userEvent.click(screen.getByTestId('color-option-red'));

    expect(screen.getByTestId('add-to-cart-btn')).not.toBeDisabled();
  });

  it('should call onAddToCart with correct parameters', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    // Select variants
    await userEvent.click(screen.getByTestId('size-option-m'));
    await userEvent.click(screen.getByTestId('color-option-red'));

    // Add to cart
    await userEvent.click(screen.getByTestId('add-to-cart-btn'));

    expect(mockOnAddToCart).toHaveBeenCalledWith(
      mockProduct,
      1,
      { size: 'm', color: 'red' }
    );
  });

  it('should enable add to cart for products without variants', () => {
    render(
      <QuickViewModal
        product={mockProductNoVariants}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={mockOnAddToCart}
      />
    );

    expect(screen.getByTestId('add-to-cart-btn')).not.toBeDisabled();
  });

  it('should render wishlist button when handler provided', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    expect(screen.getByTestId('add-to-wishlist-btn')).toBeInTheDocument();
  });

  it('should call onAddToWishlist when clicking wishlist button', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onAddToWishlist={mockOnAddToWishlist}
      />
    );

    await userEvent.click(screen.getByTestId('add-to-wishlist-btn'));

    expect(mockOnAddToWishlist).toHaveBeenCalledWith(mockProduct);
  });

  it('should render share button when handler provided', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onShare={mockOnShare}
      />
    );

    expect(screen.getByTestId('share-btn')).toBeInTheDocument();
  });

  it('should call onShare when clicking share button', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onShare={mockOnShare}
      />
    );

    await userEvent.click(screen.getByTestId('share-btn'));

    expect(mockOnShare).toHaveBeenCalledWith(mockProduct);
  });

  it('should render view details button when handler provided', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    expect(screen.getByTestId('view-details-btn')).toBeInTheDocument();
  });

  it('should call onViewDetails when clicking view details button', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
        onViewDetails={mockOnViewDetails}
      />
    );

    await userEvent.click(screen.getByTestId('view-details-btn'));

    expect(mockOnViewDetails).toHaveBeenCalledWith(mockProduct);
  });

  it('should render trust badges', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByTestId('trust-badges')).toBeInTheDocument();
  });

  it('should update price when quantity changes', async () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    await userEvent.click(screen.getByTestId('increase-quantity'));

    expect(screen.getByTestId('product-price')).toHaveTextContent('$199.98');
  });

  it('should show adding state when adding to cart', async () => {
    const slowAddToCart = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <QuickViewModal
        product={mockProductNoVariants}
        isOpen={true}
        onClose={mockOnClose}
        onAddToCart={slowAddToCart}
      />
    );

    await userEvent.click(screen.getByTestId('add-to-cart-btn'));

    expect(screen.getByText('Adding...')).toBeInTheDocument();
  });
});

describe('QuickViewButton', () => {
  it('should render default button', () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('quick-view-btn')).toBeInTheDocument();
    expect(screen.getByText('Quick View')).toBeInTheDocument();
  });

  it('should render icon button', () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} variant="icon" />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('quick-view-icon-btn')).toBeInTheDocument();
  });

  it('should render overlay button', () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} variant="overlay" />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('quick-view-overlay-btn')).toBeInTheDocument();
  });

  it('should open quick view on click', async () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} />
        <TestContextConsumer />
      </QuickViewProvider>
    );

    await userEvent.click(screen.getByTestId('quick-view-btn'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('product-id')).toHaveTextContent('prod-1');
  });

  it('should accept custom className', () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} className="custom-class" />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('quick-view-btn')).toHaveClass('custom-class');
  });
});

describe('QuickViewContainer', () => {
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    mockOnAddToCart.mockClear();
  });

  it('should render children', () => {
    render(
      <QuickViewContainer>
        <div data-testid="child">Child content</div>
      </QuickViewContainer>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render modal when product is opened', async () => {
    function TestComponent() {
      const { openQuickView } = useQuickView();
      return (
        <button onClick={() => openQuickView(mockProduct)} data-testid="trigger">
          Open
        </button>
      );
    }

    render(
      <QuickViewContainer>
        <TestComponent />
      </QuickViewContainer>
    );

    await userEvent.click(screen.getByTestId('trigger'));

    expect(screen.getByTestId('quick-view-modal')).toBeInTheDocument();
  });

  it('should pass handlers to modal', async () => {
    function TestComponent() {
      const { openQuickView } = useQuickView();
      return (
        <button onClick={() => openQuickView(mockProductNoVariants)} data-testid="trigger">
          Open
        </button>
      );
    }

    render(
      <QuickViewContainer onAddToCart={mockOnAddToCart}>
        <TestComponent />
      </QuickViewContainer>
    );

    await userEvent.click(screen.getByTestId('trigger'));
    await userEvent.click(screen.getByTestId('add-to-cart-btn'));

    expect(mockOnAddToCart).toHaveBeenCalled();
  });
});

describe('ProductCardWithQuickView', () => {
  it('should render product card', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('product-card-quick-view')).toBeInTheDocument();
  });

  it('should render product name', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should render product price', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should render quick view button on hover', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByTestId('product-card-quick-view-btn')).toBeInTheDocument();
  });

  it('should open quick view when clicking button', async () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
        <TestContextConsumer />
      </QuickViewProvider>
    );

    await userEvent.click(screen.getByTestId('product-card-quick-view-btn'));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
  });

  it('should render out of stock badge', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProductOutOfStock} />
      </QuickViewProvider>
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should render sale badge', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProductWithSale} />
      </QuickViewProvider>
    );

    expect(screen.getByText('Sale')).toBeInTheDocument();
  });

  it('should render product rating', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProduct} />
      </QuickViewProvider>
    );

    expect(screen.getByText('4.5 (123)')).toBeInTheDocument();
  });

  it('should render compare at price for sale items', () => {
    render(
      <QuickViewProvider>
        <ProductCardWithQuickView product={mockProductWithSale} />
      </QuickViewProvider>
    );

    expect(screen.getByText('$149.99')).toBeInTheDocument();
  });
});

describe('Price Calculation', () => {
  it('should apply price modifiers from selected options', async () => {
    const productWithPriceModifiers: QuickViewProduct = {
      ...mockProductNoVariants,
      variants: [
        {
          id: 'size',
          name: 'Size',
          type: 'size',
          options: [
            { id: 's', value: 'S', label: 'Small', available: true, priceModifier: 0 },
            { id: 'l', value: 'L', label: 'Large', available: true, priceModifier: 10 },
          ],
        },
      ],
    };

    render(
      <QuickViewModal
        product={productWithPriceModifiers}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Base price
    expect(screen.getByTestId('product-price')).toHaveTextContent('$49.99');

    // Select large size with +$10 modifier
    await userEvent.click(screen.getByTestId('size-option-l'));

    expect(screen.getByTestId('product-price')).toHaveTextContent('$59.99');
  });
});

describe('Accessibility', () => {
  it('should have proper aria labels on navigation buttons', () => {
    render(<ImageGallery images={mockProduct.images} productName={mockProduct.name} />);

    expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
    expect(screen.getByLabelText('Next image')).toBeInTheDocument();
  });

  it('should have aria-pressed on variant options', () => {
    render(
      <VariantSelector
        variants={mockProduct.variants!}
        selectedOptions={{ size: 'm' }}
        onSelectOption={vi.fn()}
      />
    );

    expect(screen.getByTestId('size-option-m')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('size-option-s')).toHaveAttribute('aria-pressed', 'false');
  });

  it('should have proper aria label on wishlist button', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={vi.fn()}
        onAddToWishlist={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Add to wishlist')).toBeInTheDocument();
  });

  it('should have proper aria label on share button', () => {
    render(
      <QuickViewModal
        product={mockProduct}
        isOpen={true}
        onClose={vi.fn()}
        onShare={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Share product')).toBeInTheDocument();
  });

  it('should have proper aria labels on quantity buttons', () => {
    render(<QuantitySelector quantity={1} onQuantityChange={vi.fn()} />);

    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
  });

  it('should have aria label on quick view button', () => {
    render(
      <QuickViewProvider>
        <QuickViewButton product={mockProduct} variant="icon" />
      </QuickViewProvider>
    );

    expect(screen.getByLabelText('Quick view Test Product')).toBeInTheDocument();
  });
});
