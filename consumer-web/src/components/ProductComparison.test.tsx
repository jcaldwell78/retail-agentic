import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  ComparisonProvider,
  useComparison,
  CompareButton,
  ComparisonBar,
  ComparisonTable,
  ComparisonCards,
  ComparisonWidget,
  type ComparableProduct,
} from './ProductComparison';
import { renderHook, act } from '@testing-library/react';

const mockProducts: ComparableProduct[] = [
  {
    id: '1',
    name: 'Product One',
    price: 99.99,
    originalPrice: 129.99,
    imageUrl: '/img1.jpg',
    rating: 4.5,
    reviewCount: 120,
    inStock: true,
    brand: 'Brand A',
    category: 'Electronics',
    attributes: {
      color: 'Black',
      size: 'Medium',
      weight: '500g',
      material: 'Plastic',
    },
  },
  {
    id: '2',
    name: 'Product Two',
    price: 149.99,
    imageUrl: '/img2.jpg',
    rating: 4.2,
    reviewCount: 85,
    inStock: true,
    brand: 'Brand B',
    category: 'Electronics',
    attributes: {
      color: 'White',
      size: 'Large',
      weight: '750g',
      material: 'Metal',
    },
  },
  {
    id: '3',
    name: 'Product Three',
    price: 79.99,
    inStock: false,
    category: 'Electronics',
    attributes: {
      color: 'Red',
      size: 'Small',
    },
  },
  {
    id: '4',
    name: 'Product Four',
    price: 199.99,
    imageUrl: '/img4.jpg',
    rating: 4.8,
    reviewCount: 200,
    inStock: true,
    brand: 'Brand C',
    category: 'Electronics',
    attributes: {
      color: 'Blue',
      size: 'Medium',
      weight: '600g',
      material: 'Aluminum',
    },
  },
  {
    id: '5',
    name: 'Product Five - Exceeds Max',
    price: 249.99,
    inStock: true,
    attributes: {},
  },
];

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ComparisonProvider>{children}</ComparisonProvider>
  </MemoryRouter>
);

describe('useComparison hook', () => {
  it('should start with empty products', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });
    expect(result.current.products).toHaveLength(0);
  });

  it('should add product', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('1');
  });

  it('should not add duplicate product', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
    });

    act(() => {
      const added = result.current.addProduct(mockProducts[0]);
      expect(added).toBe(false);
    });

    expect(result.current.products).toHaveLength(1);
  });

  it('should limit to max 4 products', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
      result.current.addProduct(mockProducts[1]);
      result.current.addProduct(mockProducts[2]);
      result.current.addProduct(mockProducts[3]);
    });

    expect(result.current.products).toHaveLength(4);
    expect(result.current.canAdd).toBe(false);

    act(() => {
      const added = result.current.addProduct(mockProducts[4]);
      expect(added).toBe(false);
    });

    expect(result.current.products).toHaveLength(4);
  });

  it('should remove product', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
      result.current.addProduct(mockProducts[1]);
    });

    act(() => {
      result.current.removeProduct('1');
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.products[0].id).toBe('2');
  });

  it('should clear all products', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
      result.current.addProduct(mockProducts[1]);
    });

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.products).toHaveLength(0);
  });

  it('should check if product is in comparison', () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addProduct(mockProducts[0]);
    });

    expect(result.current.isInComparison('1')).toBe(true);
    expect(result.current.isInComparison('2')).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useComparison());
    }).toThrow('useComparison must be used within a ComparisonProvider');
  });
});

describe('CompareButton', () => {
  it('should render compare button', () => {
    render(<CompareButton product={mockProducts[0]} />, { wrapper });
    expect(screen.getByTestId('compare-button-1')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
  });

  it('should add product when clicked', async () => {
    render(<CompareButton product={mockProducts[0]} />, { wrapper });

    await userEvent.click(screen.getByTestId('compare-button-1'));

    expect(screen.getByText('Remove from Compare')).toBeInTheDocument();
  });

  it('should remove product when clicked twice', async () => {
    render(<CompareButton product={mockProducts[0]} />, { wrapper });

    await userEvent.click(screen.getByTestId('compare-button-1'));
    await userEvent.click(screen.getByTestId('compare-button-1'));

    expect(screen.getByText('Compare')).toBeInTheDocument();
  });

  it('should render icon variant', () => {
    render(<CompareButton product={mockProducts[0]} variant="icon" />, { wrapper });
    const button = screen.getByTestId('compare-button-1');
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Compare')).not.toBeInTheDocument();
  });

  it('should be disabled when max products reached', async () => {
    function TestComponent() {
      const { addProduct } = useComparison();
      // Pre-add 4 products
      return (
        <>
          <button
            onClick={() => {
              addProduct(mockProducts[0]);
              addProduct(mockProducts[1]);
              addProduct(mockProducts[2]);
              addProduct(mockProducts[3]);
            }}
            data-testid="add-all"
          >
            Add All
          </button>
          <CompareButton product={mockProducts[4]} />
        </>
      );
    }

    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-all'));

    const compareButton = screen.getByTestId('compare-button-5');
    expect(compareButton).toBeDisabled();
  });
});

describe('ComparisonBar', () => {
  function TestComponent() {
    const { addProduct } = useComparison();
    return (
      <>
        <button
          onClick={() => addProduct(mockProducts[0])}
          data-testid="add-product"
        >
          Add
        </button>
        <ComparisonBar />
      </>
    );
  }

  it('should not render when no products', () => {
    render(<ComparisonBar />, { wrapper });
    expect(screen.queryByTestId('comparison-bar')).not.toBeInTheDocument();
  });

  it('should render when products added', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    expect(screen.getByTestId('comparison-bar')).toBeInTheDocument();
  });

  it('should display product count', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    expect(screen.getByText('1 items')).toBeInTheDocument();
  });

  it('should display product in bar', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    expect(screen.getByTestId('bar-product-1')).toBeInTheDocument();
    expect(screen.getByText('Product One')).toBeInTheDocument();
  });

  it('should remove product from bar', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));
    await userEvent.click(screen.getByTestId('bar-remove-1'));

    expect(screen.queryByTestId('comparison-bar')).not.toBeInTheDocument();
  });

  it('should clear all products', async () => {
    function TestMultiple() {
      const { addProduct } = useComparison();
      return (
        <>
          <button
            onClick={() => {
              addProduct(mockProducts[0]);
              addProduct(mockProducts[1]);
            }}
            data-testid="add-products"
          >
            Add
          </button>
          <ComparisonBar />
        </>
      );
    }

    render(<TestMultiple />, { wrapper });

    await userEvent.click(screen.getByTestId('add-products'));
    await userEvent.click(screen.getByTestId('clear-comparison'));

    expect(screen.queryByTestId('comparison-bar')).not.toBeInTheDocument();
  });

  it('should have view comparison link', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    const link = screen.getByTestId('view-comparison');
    expect(link).toHaveAttribute('href', '/compare');
  });
});

describe('ComparisonTable', () => {
  it('should render empty state when no products', () => {
    render(<ComparisonTable products={[]} />, { wrapper });
    expect(screen.getByTestId('comparison-empty')).toBeInTheDocument();
    expect(screen.getByText('No products to compare')).toBeInTheDocument();
  });

  it('should render table with products', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  it('should display product headers', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('header-1')).toBeInTheDocument();
    expect(screen.getByTestId('header-2')).toBeInTheDocument();
  });

  it('should display product prices', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('price-1')).toHaveTextContent('$99.99');
    expect(screen.getByTestId('price-2')).toHaveTextContent('$149.99');
  });

  it('should display original price when available', () => {
    render(
      <ComparisonTable products={[mockProducts[0]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('price-1')).toHaveTextContent('$129.99');
  });

  it('should display ratings', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('rating-1')).toHaveTextContent('4.5');
    expect(screen.getByTestId('rating-2')).toHaveTextContent('4.2');
  });

  it('should display stock status', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[2]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('stock-1')).toHaveTextContent('In Stock');
    expect(screen.getByTestId('stock-3')).toHaveTextContent('Out of Stock');
  });

  it('should display brands', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('brand-1')).toHaveTextContent('Brand A');
    expect(screen.getByTestId('brand-2')).toHaveTextContent('Brand B');
  });

  it('should display attributes', () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('attr-color-1')).toHaveTextContent('Black');
    expect(screen.getByTestId('attr-color-2')).toHaveTextContent('White');
  });

  it('should toggle show differences only', async () => {
    render(
      <ComparisonTable products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );

    const toggleButton = screen.getByTestId('toggle-differences');
    expect(toggleButton).toHaveTextContent('Show Differences Only');

    await userEvent.click(toggleButton);

    expect(toggleButton).toHaveTextContent('Show All');
  });

  it('should remove product from table', async () => {
    function TestComponent() {
      const { addProduct, products } = useComparison();
      return (
        <>
          <button
            onClick={() => {
              addProduct(mockProducts[0]);
              addProduct(mockProducts[1]);
            }}
            data-testid="add-products"
          >
            Add
          </button>
          <ComparisonTable />
          <span data-testid="count">{products.length}</span>
        </>
      );
    }

    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-products'));
    await userEvent.click(screen.getByTestId('remove-1'));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('should call onAddToCart when add to cart clicked', async () => {
    const handleAddToCart = vi.fn();
    render(
      <ComparisonTable
        products={[mockProducts[0]]}
        onAddToCart={handleAddToCart}
      />,
      { wrapper }
    );

    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(handleAddToCart).toHaveBeenCalledWith(mockProducts[0]);
  });

  it('should disable add to cart for out of stock', () => {
    render(
      <ComparisonTable products={[mockProducts[2]]} />,
      { wrapper }
    );

    const addButton = screen.getByTestId('action-3').querySelector('button');
    expect(addButton).toBeDisabled();
  });
});

describe('ComparisonCards', () => {
  it('should render empty state when no products', () => {
    render(<ComparisonCards products={[]} />, { wrapper });
    expect(screen.getByTestId('comparison-cards-empty')).toBeInTheDocument();
  });

  it('should render cards with products', () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('comparison-cards')).toBeInTheDocument();
  });

  it('should show navigation dots', () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );
    expect(screen.getByTestId('dot-1')).toBeInTheDocument();
    expect(screen.getByTestId('dot-2')).toBeInTheDocument();
  });

  it('should navigate to next product', async () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );

    expect(screen.getByTestId('card-1')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('next-product'));

    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('should navigate to previous product', async () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );

    await userEvent.click(screen.getByTestId('next-product'));
    await userEvent.click(screen.getByTestId('prev-product'));

    expect(screen.getByTestId('card-1')).toBeInTheDocument();
  });

  it('should navigate via dots', async () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );

    await userEvent.click(screen.getByTestId('dot-2'));

    expect(screen.getByTestId('card-2')).toBeInTheDocument();
  });

  it('should call onAddToCart when add to cart clicked', async () => {
    const handleAddToCart = vi.fn();
    render(
      <ComparisonCards
        products={[mockProducts[0]]}
        onAddToCart={handleAddToCart}
      />,
      { wrapper }
    );

    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    expect(handleAddToCart).toHaveBeenCalledWith(mockProducts[0]);
  });
});

describe('ComparisonWidget', () => {
  function TestComponent() {
    const { addProduct } = useComparison();
    return (
      <>
        <button
          onClick={() => addProduct(mockProducts[0])}
          data-testid="add-product"
        >
          Add
        </button>
        <ComparisonWidget />
      </>
    );
  }

  it('should render widget', () => {
    render(<ComparisonWidget />, { wrapper });
    expect(screen.getByTestId('comparison-widget')).toBeInTheDocument();
  });

  it('should show empty message when no products', () => {
    render(<ComparisonWidget />, { wrapper });
    expect(screen.getByTestId('widget-empty')).toBeInTheDocument();
  });

  it('should display products in widget', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    expect(screen.getByTestId('widget-product-1')).toBeInTheDocument();
  });

  it('should remove product from widget', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    const removeButton = screen.getByLabelText('Remove Product One');
    await userEvent.click(removeButton);

    expect(screen.getByTestId('widget-empty')).toBeInTheDocument();
  });

  it('should have compare link', async () => {
    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add-product'));

    expect(screen.getByRole('link', { name: 'Compare' })).toHaveAttribute(
      'href',
      '/compare'
    );
  });
});

describe('Accessibility', () => {
  it('should have accessible remove buttons', async () => {
    function TestComponent() {
      const { addProduct } = useComparison();
      return (
        <>
          <button onClick={() => addProduct(mockProducts[0])} data-testid="add">
            Add
          </button>
          <ComparisonBar />
        </>
      );
    }

    render(<TestComponent />, { wrapper });

    await userEvent.click(screen.getByTestId('add'));

    expect(
      screen.getByRole('button', { name: 'Remove Product One from comparison' })
    ).toBeInTheDocument();
  });

  it('should have accessible navigation in cards', () => {
    render(
      <ComparisonCards products={[mockProducts[0], mockProducts[1]]} />,
      { wrapper }
    );

    expect(
      screen.getByRole('button', { name: 'Next product' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View Product One' })
    ).toBeInTheDocument();
  });
});
