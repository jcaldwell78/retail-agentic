import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProductsPage from './ProductsPage';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductsPage', () => {
  it('should render the products page', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('products-page')).toBeInTheDocument();
  });

  it('should display page heading', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByRole('heading', { name: 'All Products' })).toBeInTheDocument();
  });

  it('should display product count', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('6 products found')).toBeInTheDocument();
  });

  it('should display back to home link', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('← Back to Home')).toBeInTheDocument();
    const link = screen.getByText('← Back to Home').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });
});

describe('ProductsPage - Product Display', () => {
  it('should display all products initially', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('Cotton T-Shirt')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
    expect(screen.getByText('Water Bottle')).toBeInTheDocument();
  });

  it('should display product prices', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByText('$249.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should display original prices when discounted', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('$129.99')).toBeInTheDocument();
    expect(screen.getByText('$119.99')).toBeInTheDocument();
  });

  it('should display add to cart buttons', () => {
    renderWithRouter(<ProductsPage />);
    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons).toHaveLength(6);
  });

  it('should display products in grid view by default', () => {
    renderWithRouter(<ProductsPage />);
    const productsGrid = screen.getByTestId('products-grid');
    expect(productsGrid).toHaveClass('grid');
  });
});

describe('ProductsPage - Search', () => {
  it('should display search input', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('product-search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('should filter products by search query', async () => {
    renderWithRouter(<ProductsPage />);

    const searchInput = screen.getByTestId('product-search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'headphones' } });

    await waitFor(() => {
      expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
      expect(screen.queryByText('Smart Watch')).not.toBeInTheDocument();
      expect(screen.queryByText('Cotton T-Shirt')).not.toBeInTheDocument();
    });
  });

  it('should update product count after search', async () => {
    renderWithRouter(<ProductsPage />);

    const searchInput = screen.getByTestId('product-search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'watch' } });

    await waitFor(() => {
      expect(screen.getByText('1 products found')).toBeInTheDocument();
    });
  });

  it('should show empty state when no products match search', async () => {
    renderWithRouter(<ProductsPage />);

    const searchInput = screen.getByTestId('product-search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'nonexistent product xyz' } });

    await waitFor(() => {
      expect(screen.getByText('No products found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria')).toBeInTheDocument();
    });
  });
});

describe('ProductsPage - Category Filter', () => {
  it('should display category filters', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('category-all')).toBeInTheDocument();
    expect(screen.getByTestId('category-Electronics')).toBeInTheDocument();
    expect(screen.getByTestId('category-Fashion')).toBeInTheDocument();
    expect(screen.getByTestId('category-Sports')).toBeInTheDocument();
    expect(screen.getByTestId('category-Home')).toBeInTheDocument();
  });

  it('should have all category selected by default', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('category-all')).toBeChecked();
  });

  it('should filter products by category', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    await user.click(screen.getByTestId('category-Electronics'));

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Smart Watch')).toBeInTheDocument();
    expect(screen.getByText('Laptop Stand')).toBeInTheDocument();
    expect(screen.queryByText('Cotton T-Shirt')).not.toBeInTheDocument();
    expect(screen.queryByText('Running Shoes')).not.toBeInTheDocument();
  });

  it('should update product count after category filter', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    await user.click(screen.getByTestId('category-Fashion'));

    expect(screen.getByText('1 products found')).toBeInTheDocument();
  });
});

describe('ProductsPage - Sorting', () => {
  it('should display sort dropdown', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
  });

  it('should have featured as default sort', () => {
    renderWithRouter(<ProductsPage />);
    const sortSelect = screen.getByTestId('sort-select') as HTMLSelectElement;
    expect(sortSelect.value).toBe('featured');
  });

  it('should sort products by price low to high', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    const sortSelect = screen.getByTestId('sort-select');
    await user.selectOptions(sortSelect, 'price-low');

    const products = screen.getAllByRole('heading', { level: 3 });
    expect(products[0]).toHaveTextContent('Water Bottle'); // $19.99
    expect(products[1]).toHaveTextContent('Cotton T-Shirt'); // $29.99
  });

  it('should sort products by price high to low', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    const sortSelect = screen.getByTestId('sort-select');
    await user.selectOptions(sortSelect, 'price-high');

    const products = screen.getAllByRole('heading', { level: 3 });
    expect(products[0]).toHaveTextContent('Smart Watch'); // $249.99
    expect(products[1]).toHaveTextContent('Wireless Headphones'); // $99.99
  });

  it('should sort products by name', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    const sortSelect = screen.getByTestId('sort-select');
    await user.selectOptions(sortSelect, 'name');

    const products = screen.getAllByRole('heading', { level: 3 });
    expect(products[0]).toHaveTextContent('Cotton T-Shirt');
    expect(products[1]).toHaveTextContent('Laptop Stand');
  });
});

describe('ProductsPage - View Mode', () => {
  it('should display view mode toggle buttons', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('grid-view-button')).toBeInTheDocument();
    expect(screen.getByTestId('list-view-button')).toBeInTheDocument();
  });

  it('should switch to list view', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    await user.click(screen.getByTestId('list-view-button'));

    const productsGrid = screen.getByTestId('products-grid');
    expect(productsGrid).not.toHaveClass('grid');
    expect(productsGrid).toHaveClass('space-y-4');
  });

  it('should switch back to grid view', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProductsPage />);

    await user.click(screen.getByTestId('list-view-button'));
    await user.click(screen.getByTestId('grid-view-button'));

    const productsGrid = screen.getByTestId('products-grid');
    expect(productsGrid).toHaveClass('grid');
  });
});

describe('ProductsPage - Filters', () => {
  it('should display filters section', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
  });

  it('should display price range filters', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('Under $50')).toBeInTheDocument();
    expect(screen.getByText('$50 - $100')).toBeInTheDocument();
    expect(screen.getByText('$100 - $200')).toBeInTheDocument();
    expect(screen.getByText('Over $200')).toBeInTheDocument();
  });

  it('should display clear filters button', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup({ delay: null });
    renderWithRouter(<ProductsPage />);

    // Apply filters
    let searchInput = screen.getByTestId('product-search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'headphones' } });

    await waitFor(() => {
      expect(screen.getByText('1 products found')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('category-Electronics'));

    // Clear filters
    await user.click(screen.getByText('Clear Filters'));

    await waitFor(() => {
      expect(screen.getByText('6 products found')).toBeInTheDocument();
      searchInput = screen.getByTestId('product-search-input') as HTMLInputElement;
      expect(searchInput).toHaveValue('');
      expect(screen.getByTestId('category-all')).toBeChecked();
    });
  });
});

describe('ProductsPage - Quick View', () => {
  it('should display quick view buttons on products', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByTestId('quick-view-1')).toBeInTheDocument();
    expect(screen.getByTestId('quick-view-2')).toBeInTheDocument();
  });
});

describe('ProductsPage - Pagination', () => {
  it('should display pagination controls', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should have previous button disabled', () => {
    renderWithRouter(<ProductsPage />);
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('should have next button disabled', () => {
    renderWithRouter(<ProductsPage />);
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });
});

describe('ProductsPage - Accessibility', () => {
  it('should have proper heading structure', () => {
    renderWithRouter(<ProductsPage />);
    expect(screen.getByRole('heading', { name: 'All Products' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
  });

  it('should have accessible search input', () => {
    renderWithRouter(<ProductsPage />);
    const searchInput = screen.getByTestId('product-search-input');
    expect(searchInput).toHaveAttribute('type', 'search');
  });

  it('should have accessible category radio buttons', () => {
    renderWithRouter(<ProductsPage />);
    const allCategory = screen.getByTestId('category-all');
    expect(allCategory).toHaveAttribute('type', 'radio');
    expect(allCategory).toHaveAttribute('name', 'category');
  });
});
