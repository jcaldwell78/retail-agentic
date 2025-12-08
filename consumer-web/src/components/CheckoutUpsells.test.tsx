import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  UpsellsProvider,
  useUpsells,
  UpsellProductCard,
  FrequentlyBoughtTogether,
  BundleDealCard,
  BundleDeals,
  RecommendedAddons,
  CheckoutUpsellsSummary,
  MiniUpsell,
  CheckoutUpsells,
  UpsellProduct,
  ProductBundle,
} from './CheckoutUpsells';

// Test data
const testProducts: UpsellProduct[] = [
  {
    id: 'product-1',
    name: 'Product One',
    price: 29.99,
    originalPrice: 39.99,
    image: 'https://example.com/product1.jpg',
    rating: 4.5,
    reviewCount: 150,
    inStock: true,
  },
  {
    id: 'product-2',
    name: 'Product Two',
    price: 49.99,
    image: 'https://example.com/product2.jpg',
    rating: 4.0,
    reviewCount: 85,
    badge: 'Best Seller',
    inStock: true,
  },
  {
    id: 'product-3',
    name: 'Product Three',
    price: 19.99,
    image: 'https://example.com/product3.jpg',
    inStock: false,
  },
];

const testBundles: ProductBundle[] = [
  {
    id: 'bundle-1',
    name: 'Starter Bundle',
    products: testProducts.slice(0, 2),
    bundlePrice: 69.99,
    regularPrice: 79.98,
    savings: 9.99,
    savingsPercent: 12,
  },
  {
    id: 'bundle-2',
    name: 'Complete Bundle',
    products: testProducts,
    bundlePrice: 89.99,
    regularPrice: 109.97,
    savings: 19.98,
    savingsPercent: 18,
  },
];

// Test consumer component
function TestUpsellsConsumer() {
  const {
    frequentlyBoughtTogether,
    selectedProducts,
    toggleProduct,
    selectAll,
    clearSelection,
    getTotalPrice,
    getTotalSavings,
    isProductSelected,
    addSelectedToCart,
  } = useUpsells();

  return (
    <div>
      <div data-testid="fbt-count">{frequentlyBoughtTogether.length}</div>
      <div data-testid="selected-count">{selectedProducts.length}</div>
      <div data-testid="selected-ids">{selectedProducts.join(',')}</div>
      <div data-testid="total-price">{getTotalPrice().toFixed(2)}</div>
      <div data-testid="total-savings">{getTotalSavings().toFixed(2)}</div>
      <div data-testid="is-product-1-selected">{isProductSelected('product-1').toString()}</div>
      <button data-testid="toggle-product-1" onClick={() => toggleProduct('product-1')}>
        Toggle 1
      </button>
      <button data-testid="toggle-product-2" onClick={() => toggleProduct('product-2')}>
        Toggle 2
      </button>
      <button data-testid="select-all" onClick={selectAll}>
        Select All
      </button>
      <button data-testid="clear-selection" onClick={clearSelection}>
        Clear
      </button>
      <button data-testid="add-to-cart" onClick={addSelectedToCart}>
        Add to Cart
      </button>
    </div>
  );
}

describe('UpsellsProvider', () => {
  it('should provide default context values', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('fbt-count')).toHaveTextContent('3');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00');
  });

  it('should toggle product selection', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-product-1'));
    expect(screen.getByTestId('selected-ids')).toHaveTextContent('product-1');
    expect(screen.getByTestId('is-product-1-selected')).toHaveTextContent('true');

    await userEvent.click(screen.getByTestId('toggle-product-1'));
    expect(screen.getByTestId('selected-ids')).toHaveTextContent('');
    expect(screen.getByTestId('is-product-1-selected')).toHaveTextContent('false');
  });

  it('should select all products', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('3');
    expect(screen.getByTestId('selected-ids')).toHaveTextContent('product-1,product-2,product-3');
  });

  it('should clear selection', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('select-all'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('3');

    await userEvent.click(screen.getByTestId('clear-selection'));
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('should calculate total price correctly', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-product-1'));
    expect(screen.getByTestId('total-price')).toHaveTextContent('29.99');

    await userEvent.click(screen.getByTestId('toggle-product-2'));
    expect(screen.getByTestId('total-price')).toHaveTextContent('79.98');
  });

  it('should calculate total savings correctly', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-product-1'));
    expect(screen.getByTestId('total-savings')).toHaveTextContent('10.00');
  });

  it('should call onAddToCart when adding selected products', async () => {
    const onAddToCart = vi.fn();

    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts} onAddToCart={onAddToCart}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-product-1'));
    await userEvent.click(screen.getByTestId('toggle-product-2'));
    await userEvent.click(screen.getByTestId('add-to-cart'));

    expect(onAddToCart).toHaveBeenCalledWith(['product-1', 'product-2']);
  });

  it('should not call onAddToCart when no products selected', async () => {
    const onAddToCart = vi.fn();

    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts} onAddToCart={onAddToCart}>
        <TestUpsellsConsumer />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('add-to-cart'));

    expect(onAddToCart).not.toHaveBeenCalled();
  });
});

describe('useUpsells', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestUpsellsConsumer />)).toThrow(
      'useUpsells must be used within an UpsellsProvider'
    );

    consoleError.mockRestore();
  });
});

describe('UpsellProductCard', () => {
  const product = testProducts[0];

  it('should render product details', () => {
    render(<UpsellProductCard product={product} />);

    expect(screen.getByTestId(`upsell-product-${product.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`product-name-${product.id}`)).toHaveTextContent('Product One');
    expect(screen.getByTestId(`product-price-${product.id}`)).toHaveTextContent('$29.99');
    expect(screen.getByTestId(`product-image-${product.id}`)).toBeInTheDocument();
  });

  it('should show original price when discounted', () => {
    render(<UpsellProductCard product={product} />);

    expect(screen.getByTestId(`original-price-${product.id}`)).toHaveTextContent('$39.99');
  });

  it('should show discount badge', () => {
    render(<UpsellProductCard product={product} />);

    expect(screen.getByTestId(`discount-badge-${product.id}`)).toHaveTextContent('-25%');
  });

  it('should show product badge', () => {
    render(<UpsellProductCard product={testProducts[1]} />);

    expect(screen.getByTestId(`product-badge-${testProducts[1].id}`)).toHaveTextContent('Best Seller');
  });

  it('should show rating', () => {
    render(<UpsellProductCard product={product} />);

    expect(screen.getByTestId(`product-rating-${product.id}`)).toBeInTheDocument();
    expect(screen.getByText('(150)')).toBeInTheDocument();
  });

  it('should show checkbox when selectable', () => {
    render(<UpsellProductCard product={product} selectable />);

    expect(screen.getByTestId(`select-product-${product.id}`)).toBeInTheDocument();
  });

  it('should call onSelect when clicked in selectable mode', async () => {
    const onSelect = vi.fn();
    render(<UpsellProductCard product={product} selectable onSelect={onSelect} />);

    await userEvent.click(screen.getByTestId(`upsell-product-${product.id}`));

    expect(onSelect).toHaveBeenCalled();
  });

  it('should show selected state', () => {
    render(<UpsellProductCard product={product} selectable selected />);

    expect(screen.getByTestId(`select-product-${product.id}`)).toBeChecked();
    expect(screen.getByTestId(`upsell-product-${product.id}`)).toHaveClass('border-blue-500');
  });

  it('should show add to cart button in non-selectable mode', () => {
    const onAddToCart = vi.fn();
    render(<UpsellProductCard product={product} onAddToCart={onAddToCart} />);

    expect(screen.getByTestId(`add-to-cart-${product.id}`)).toBeInTheDocument();
  });

  it('should call onAddToCart when button clicked', async () => {
    const onAddToCart = vi.fn();
    render(<UpsellProductCard product={product} onAddToCart={onAddToCart} />);

    await userEvent.click(screen.getByTestId(`add-to-cart-${product.id}`));

    expect(onAddToCart).toHaveBeenCalled();
  });

  it('should show out of stock overlay', () => {
    render(<UpsellProductCard product={testProducts[2]} />);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should disable add to cart when out of stock', () => {
    render(<UpsellProductCard product={testProducts[2]} onAddToCart={() => {}} />);

    expect(screen.getByTestId(`add-to-cart-${testProducts[2].id}`)).toBeDisabled();
  });

  it('should apply different sizes', () => {
    const { rerender } = render(<UpsellProductCard product={product} size="sm" />);
    expect(screen.getByTestId(`upsell-product-${product.id}`)).toHaveClass('w-32');

    rerender(<UpsellProductCard product={product} size="lg" />);
    expect(screen.getByTestId(`upsell-product-${product.id}`)).toHaveClass('w-48');
  });
});

describe('FrequentlyBoughtTogether', () => {
  it('should not render when no products', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={[]}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('frequently-bought-together')).not.toBeInTheDocument();
  });

  it('should render products with plus separators', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('frequently-bought-together')).toBeInTheDocument();
    expect(screen.getAllByTestId('plus-separator')).toHaveLength(2);
  });

  it('should show select all and clear buttons', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('select-all-fbt')).toBeInTheDocument();
  });

  it('should show clear button when products selected', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('clear-selection-fbt')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('select-all-fbt'));

    expect(screen.getByTestId('clear-selection-fbt')).toBeInTheDocument();
  });

  it('should show total when products selected', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('select-all-fbt'));

    expect(screen.getByTestId('fbt-total')).toBeInTheDocument();
    expect(screen.getByTestId('add-selected-to-cart')).toBeInTheDocument();
  });

  it('should select product when clicked', async () => {
    const onAddToCart = vi.fn();
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts} onAddToCart={onAddToCart}>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('upsell-product-product-1'));
    await userEvent.click(screen.getByTestId('add-selected-to-cart'));

    expect(onAddToCart).toHaveBeenCalledWith(['product-1']);
  });

  it('should show loading state', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts} isLoading>
        <FrequentlyBoughtTogether />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('fbt-loading')).toBeInTheDocument();
  });

  it('should use custom title', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <FrequentlyBoughtTogether title="Complete the Look" />
      </UpsellsProvider>
    );

    expect(screen.getByText('Complete the Look')).toBeInTheDocument();
  });
});

describe('BundleDealCard', () => {
  const bundle = testBundles[0];

  it('should render bundle details', () => {
    render(<BundleDealCard bundle={bundle} />);

    expect(screen.getByTestId(`bundle-${bundle.id}`)).toBeInTheDocument();
    expect(screen.getByText('Starter Bundle')).toBeInTheDocument();
    expect(screen.getByTestId(`bundle-price-${bundle.id}`)).toHaveTextContent('$69.99');
    expect(screen.getByTestId(`bundle-savings-${bundle.id}`)).toHaveTextContent('Save $9.99 (12%)');
  });

  it('should render product images', () => {
    render(<BundleDealCard bundle={bundle} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('should call onAdd when add button clicked', async () => {
    const onAdd = vi.fn();
    render(<BundleDealCard bundle={bundle} onAdd={onAdd} />);

    await userEvent.click(screen.getByTestId(`add-bundle-${bundle.id}`));

    expect(onAdd).toHaveBeenCalled();
  });
});

describe('BundleDeals', () => {
  it('should not render when no bundles', () => {
    render(
      <UpsellsProvider bundles={[]}>
        <BundleDeals />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('bundle-deals')).not.toBeInTheDocument();
  });

  it('should render all bundles', () => {
    render(
      <UpsellsProvider bundles={testBundles}>
        <BundleDeals />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('bundle-deals')).toBeInTheDocument();
    expect(screen.getByTestId('bundle-bundle-1')).toBeInTheDocument();
    expect(screen.getByTestId('bundle-bundle-2')).toBeInTheDocument();
  });

  it('should call onAddBundleToCart when bundle added', async () => {
    const onAddBundleToCart = vi.fn();
    render(
      <UpsellsProvider bundles={testBundles} onAddBundleToCart={onAddBundleToCart}>
        <BundleDeals />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('add-bundle-bundle-1'));

    expect(onAddBundleToCart).toHaveBeenCalledWith('bundle-1');
  });

  it('should show loading state', () => {
    render(
      <UpsellsProvider bundles={testBundles} isLoading>
        <BundleDeals />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('bundles-loading')).toBeInTheDocument();
  });

  it('should use custom title', () => {
    render(
      <UpsellsProvider bundles={testBundles}>
        <BundleDeals title="Save with Bundles" />
      </UpsellsProvider>
    );

    expect(screen.getByText('Save with Bundles')).toBeInTheDocument();
  });
});

describe('RecommendedAddons', () => {
  it('should not render when no products', () => {
    render(
      <UpsellsProvider recommendedAddons={[]}>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('recommended-addons')).not.toBeInTheDocument();
  });

  it('should render products', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('recommended-addons')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-product-product-1')).toBeInTheDocument();
  });

  it('should show scroll buttons', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('scroll-left')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-right')).toBeInTheDocument();
  });

  it('should call onAddToCart when product added', async () => {
    const onAddToCart = vi.fn();
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons onAddToCart={onAddToCart} />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('add-to-cart-product-1'));

    expect(onAddToCart).toHaveBeenCalledWith('product-1');
  });

  it('should show loading state', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts} isLoading>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('addons-loading')).toBeInTheDocument();
  });

  it('should use custom title', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons title="Customers Also Bought" />
      </UpsellsProvider>
    );

    expect(screen.getByText('Customers Also Bought')).toBeInTheDocument();
  });

  it('should have scroll buttons with aria-labels', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('scroll-left')).toHaveAttribute('aria-label', 'Scroll left');
    expect(screen.getByTestId('scroll-right')).toHaveAttribute('aria-label', 'Scroll right');
  });
});

describe('CheckoutUpsellsSummary', () => {
  it('should not render when no products', () => {
    render(
      <UpsellsProvider>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('checkout-upsells-summary')).not.toBeInTheDocument();
  });

  it('should render summary items', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('checkout-upsells-summary')).toBeInTheDocument();
    expect(screen.getByTestId('summary-item-product-1')).toBeInTheDocument();
  });

  it('should limit items to maxItems', () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <CheckoutUpsellsSummary maxItems={2} />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('summary-item-product-1')).toBeInTheDocument();
    expect(screen.getByTestId('summary-item-product-2')).toBeInTheDocument();
    expect(screen.queryByTestId('summary-item-product-3')).not.toBeInTheDocument();
  });

  it('should toggle product selection', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('summary-checkbox-product-1'));

    expect(screen.getByTestId('summary-total')).toBeInTheDocument();
  });

  it('should show add to order button when products selected', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    expect(screen.queryByTestId('summary-add-to-cart')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('summary-checkbox-product-1'));

    expect(screen.getByTestId('summary-add-to-cart')).toBeInTheDocument();
  });

  it('should call onAddToCart when add button clicked', async () => {
    const onAddToCart = vi.fn();
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts} onAddToCart={onAddToCart}>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    await userEvent.click(screen.getByTestId('summary-checkbox-product-1'));
    await userEvent.click(screen.getByTestId('summary-add-to-cart'));

    expect(onAddToCart).toHaveBeenCalledWith(['product-1']);
  });
});

describe('MiniUpsell', () => {
  const product = testProducts[0];

  it('should render mini upsell', () => {
    render(<MiniUpsell product={product} onAdd={() => {}} />);

    expect(screen.getByTestId('mini-upsell')).toBeInTheDocument();
    expect(screen.getByText('Product One')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should call onAdd when add button clicked', async () => {
    const onAdd = vi.fn();
    render(<MiniUpsell product={product} onAdd={onAdd} />);

    await userEvent.click(screen.getByTestId('mini-upsell-add'));

    expect(onAdd).toHaveBeenCalled();
  });

  it('should show dismiss button when onDismiss provided', () => {
    render(<MiniUpsell product={product} onAdd={() => {}} onDismiss={() => {}} />);

    expect(screen.getByTestId('mini-upsell-dismiss')).toBeInTheDocument();
  });

  it('should not show dismiss button when onDismiss not provided', () => {
    render(<MiniUpsell product={product} onAdd={() => {}} />);

    expect(screen.queryByTestId('mini-upsell-dismiss')).not.toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button clicked', async () => {
    const onDismiss = vi.fn();
    render(<MiniUpsell product={product} onAdd={() => {}} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByTestId('mini-upsell-dismiss'));

    expect(onDismiss).toHaveBeenCalled();
  });

  it('dismiss button should have aria-label', () => {
    render(<MiniUpsell product={product} onAdd={() => {}} onDismiss={() => {}} />);

    expect(screen.getByTestId('mini-upsell-dismiss')).toHaveAttribute('aria-label', 'Dismiss');
  });
});

describe('CheckoutUpsells', () => {
  it('should render main component', () => {
    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
      />
    );

    expect(screen.getByTestId('checkout-upsells')).toBeInTheDocument();
  });

  it('should render full layout', () => {
    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
        layout="full"
      />
    );

    expect(screen.getByTestId('frequently-bought-together')).toBeInTheDocument();
    expect(screen.getByTestId('bundle-deals')).toBeInTheDocument();
    expect(screen.getByTestId('recommended-addons')).toBeInTheDocument();
  });

  it('should render compact layout', () => {
    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
        layout="compact"
      />
    );

    expect(screen.getByTestId('frequently-bought-together')).toBeInTheDocument();
    expect(screen.queryByTestId('bundle-deals')).not.toBeInTheDocument();
    expect(screen.getByTestId('recommended-addons')).toBeInTheDocument();
  });

  it('should render summary layout', () => {
    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
        layout="summary"
      />
    );

    expect(screen.queryByTestId('frequently-bought-together')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bundle-deals')).not.toBeInTheDocument();
    expect(screen.queryByTestId('recommended-addons')).not.toBeInTheDocument();
    expect(screen.getByTestId('checkout-upsells-summary')).toBeInTheDocument();
  });

  it('should pass callbacks correctly', async () => {
    const onAddToCart = vi.fn();
    const onAddBundleToCart = vi.fn();
    const onAddSingleProduct = vi.fn();

    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
        onAddToCart={onAddToCart}
        onAddBundleToCart={onAddBundleToCart}
        onAddSingleProduct={onAddSingleProduct}
      />
    );

    // Test FBT add to cart
    await userEvent.click(screen.getByTestId('select-all-fbt'));
    await userEvent.click(screen.getByTestId('add-selected-to-cart'));
    expect(onAddToCart).toHaveBeenCalled();

    // Test bundle add
    await userEvent.click(screen.getByTestId('add-bundle-bundle-1'));
    expect(onAddBundleToCart).toHaveBeenCalledWith('bundle-1');
  });

  it('should show loading state', () => {
    render(
      <CheckoutUpsells
        frequentlyBoughtTogether={testProducts}
        recommendedAddons={testProducts}
        bundles={testBundles}
        isLoading
      />
    );

    expect(screen.getByTestId('fbt-loading')).toBeInTheDocument();
    expect(screen.getByTestId('bundles-loading')).toBeInTheDocument();
    expect(screen.getByTestId('addons-loading')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  it('UpsellProductCard should have checkbox for selection', () => {
    render(<UpsellProductCard product={testProducts[0]} selectable />);

    expect(screen.getByTestId(`select-product-${testProducts[0].id}`)).toHaveAttribute('type', 'checkbox');
  });

  it('RecommendedAddons scroll buttons should have aria-labels', () => {
    render(
      <UpsellsProvider recommendedAddons={testProducts}>
        <RecommendedAddons />
      </UpsellsProvider>
    );

    expect(screen.getByTestId('scroll-left')).toHaveAttribute('aria-label', 'Scroll left');
    expect(screen.getByTestId('scroll-right')).toHaveAttribute('aria-label', 'Scroll right');
  });

  it('MiniUpsell dismiss should have aria-label', () => {
    render(<MiniUpsell product={testProducts[0]} onAdd={() => {}} onDismiss={() => {}} />);

    expect(screen.getByTestId('mini-upsell-dismiss')).toHaveAttribute('aria-label', 'Dismiss');
  });

  it('CheckoutUpsellsSummary should have checkboxes', async () => {
    render(
      <UpsellsProvider frequentlyBoughtTogether={testProducts}>
        <CheckoutUpsellsSummary />
      </UpsellsProvider>
    );

    const checkbox = screen.getByTestId('summary-checkbox-product-1');
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });
});
