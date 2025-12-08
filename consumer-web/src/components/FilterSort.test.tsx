import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterSortProvider,
  useFilterSort,
  FilterPanel,
  SortDropdown,
  ActiveFiltersBar,
  MobileFilterModal,
  FilterToggleButton,
  FilterSort,
  FilterDefinition,
  SortOption,
  ActiveFilter,
} from './FilterSort';

// Test data
const testFilters: FilterDefinition[] = [
  {
    id: 'category',
    label: 'Category',
    type: 'checkbox',
    options: [
      { id: 'electronics', label: 'Electronics', count: 42 },
      { id: 'clothing', label: 'Clothing', count: 28 },
      { id: 'books', label: 'Books', count: 15, disabled: true },
    ],
  },
  {
    id: 'brand',
    label: 'Brand',
    type: 'radio',
    options: [
      { id: 'apple', label: 'Apple' },
      { id: 'samsung', label: 'Samsung' },
      { id: 'sony', label: 'Sony' },
    ],
  },
  {
    id: 'price',
    label: 'Price',
    type: 'range',
    range: { min: 0, max: 1000, step: 10, unit: '$' },
  },
  {
    id: 'rating',
    label: 'Rating',
    type: 'rating',
  },
  {
    id: 'color',
    label: 'Color',
    type: 'color',
    options: [
      { id: 'black', label: 'Black' },
      { id: 'white', label: 'White' },
      { id: 'red', label: 'Red' },
    ],
  },
  {
    id: 'size',
    label: 'Size',
    type: 'size',
    options: [
      { id: 'xs', label: 'XS' },
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'l', label: 'L', disabled: true },
    ],
  },
];

const testSorts: SortOption[] = [
  { id: 'relevance', label: 'Relevance', field: 'relevance', direction: 'desc' },
  { id: 'price-asc', label: 'Price: Low to High', field: 'price', direction: 'asc' },
  { id: 'price-desc', label: 'Price: High to Low', field: 'price', direction: 'desc' },
  { id: 'rating', label: 'Highest Rated', field: 'rating', direction: 'desc' },
  { id: 'newest', label: 'Newest', field: 'createdAt', direction: 'desc' },
];

// Test consumer component
function TestFilterSortConsumer() {
  const {
    filters,
    sort,
    setFilter,
    removeFilter,
    clearFilters,
    toggleFilterValue,
    setSort,
    clearSort,
    hasActiveFilters,
    activeFilterCount,
    getFilterValue,
  } = useFilterSort();

  return (
    <div>
      <div data-testid="filters-count">{filters.length}</div>
      <div data-testid="active-filter-count">{activeFilterCount}</div>
      <div data-testid="has-active">{hasActiveFilters.toString()}</div>
      <div data-testid="current-sort">{sort?.id || 'none'}</div>
      <div data-testid="filter-ids">{filters.map((f) => f.filterId).join(',')}</div>
      <div data-testid="category-value">{getFilterValue('category')?.values?.join(',') || 'none'}</div>
      <button data-testid="set-filter" onClick={() => setFilter('test', { value: 'value' })}>
        Set Filter
      </button>
      <button data-testid="toggle-value" onClick={() => toggleFilterValue('category', 'electronics')}>
        Toggle Electronics
      </button>
      <button data-testid="remove-filter" onClick={() => removeFilter('category')}>
        Remove
      </button>
      <button data-testid="clear-filters" onClick={clearFilters}>
        Clear
      </button>
      <button data-testid="set-sort" onClick={() => setSort(testSorts[1])}>
        Set Sort
      </button>
      <button data-testid="clear-sort" onClick={clearSort}>
        Clear Sort
      </button>
    </div>
  );
}

describe('FilterSortProvider', () => {
  it('should provide default context values', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
    expect(screen.getByTestId('has-active')).toHaveTextContent('false');
    expect(screen.getByTestId('current-sort')).toHaveTextContent('none');
  });

  it('should use defaultSort when provided', () => {
    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        defaultSort={testSorts[0]}
      >
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('current-sort')).toHaveTextContent('relevance');
  });

  it('should set filter', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('set-filter'));

    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('test');
  });

  it('should toggle filter value', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-value'));
    expect(screen.getByTestId('category-value')).toHaveTextContent('electronics');

    await userEvent.click(screen.getByTestId('toggle-value'));
    expect(screen.getByTestId('category-value')).toHaveTextContent('none');
  });

  it('should remove filter', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-value'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');

    await userEvent.click(screen.getByTestId('remove-filter'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should clear all filters', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('set-filter'));
    await userEvent.click(screen.getByTestId('toggle-value'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('2');

    await userEvent.click(screen.getByTestId('clear-filters'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should set sort', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('set-sort'));
    expect(screen.getByTestId('current-sort')).toHaveTextContent('price-asc');
  });

  it('should clear sort', async () => {
    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        defaultSort={testSorts[0]}
      >
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('current-sort')).toHaveTextContent('relevance');

    await userEvent.click(screen.getByTestId('clear-sort'));
    expect(screen.getByTestId('current-sort')).toHaveTextContent('none');
  });

  it('should call onChange when filters change', async () => {
    const onChange = vi.fn();

    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        onChange={onChange}
      >
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('toggle-value'));

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          filterId: 'category',
          value: { values: ['electronics'] },
        }),
      ]),
      null
    );
  });

  it('should call onChange when sort changes', async () => {
    const onChange = vi.fn();

    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        onChange={onChange}
      >
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('set-sort'));

    expect(onChange).toHaveBeenCalledWith([], testSorts[1]);
  });

  it('should calculate activeFilterCount correctly', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('0');

    // Add multiple values to one filter
    await userEvent.click(screen.getByTestId('toggle-value')); // Add electronics
    expect(screen.getByTestId('active-filter-count')).toHaveTextContent('1');
  });
});

describe('useFilterSort', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestFilterSortConsumer />)).toThrow(
      'useFilterSort must be used within a FilterSortProvider'
    );

    consoleError.mockRestore();
  });
});

describe('FilterPanel', () => {
  it('should render all filter sections', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-category')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-brand')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-price')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-rating')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-color')).toBeInTheDocument();
    expect(screen.getByTestId('filter-section-size')).toBeInTheDocument();
  });

  it('should toggle sections when collapsible', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel collapsible defaultExpanded />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filter-content-category')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('filter-toggle-category'));

    expect(screen.queryByTestId('filter-content-category')).not.toBeInTheDocument();
  });

  it('should show clear all button when filters are active', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.queryByTestId('clear-all-filters')).not.toBeInTheDocument();

    // Select a filter
    const checkbox = screen.getByTestId('filter-option-category-electronics');
    await userEvent.click(checkbox);

    expect(screen.getByTestId('clear-all-filters')).toBeInTheDocument();
  });

  it('should clear all filters when clear button clicked', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    // Select a filter
    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');

    // Clear all
    await userEvent.click(screen.getByTestId('clear-all-filters'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });
});

describe('Checkbox Filter', () => {
  it('should render checkbox options', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('checkbox-filter-category')).toBeInTheDocument();
    expect(screen.getByTestId('filter-option-category-electronics')).toBeInTheDocument();
    expect(screen.getByTestId('filter-option-category-clothing')).toBeInTheDocument();
  });

  it('should toggle checkbox selection', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    const checkbox = screen.getByTestId('filter-option-category-electronics');
    await userEvent.click(checkbox);

    expect(screen.getByTestId('category-value')).toHaveTextContent('electronics');

    await userEvent.click(checkbox);
    expect(screen.getByTestId('category-value')).toHaveTextContent('none');
  });

  it('should show count when provided', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByText('(42)')).toBeInTheDocument();
    expect(screen.getByText('(28)')).toBeInTheDocument();
  });

  it('should disable option when disabled', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filter-option-category-books')).toBeDisabled();
  });
});

describe('Radio Filter', () => {
  it('should render radio options', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('radio-filter-brand')).toBeInTheDocument();
    expect(screen.getByTestId('filter-option-brand-apple')).toBeInTheDocument();
    expect(screen.getByTestId('filter-option-brand-samsung')).toBeInTheDocument();
  });

  it('should select radio option', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    const radio = screen.getByTestId('filter-option-brand-apple');
    await userEvent.click(radio);

    expect(screen.getByTestId('filter-ids')).toHaveTextContent('brand');
  });

  it('should allow only one radio selection at a time', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    const appleRadio = screen.getByTestId('filter-option-brand-apple');
    const samsungRadio = screen.getByTestId('filter-option-brand-samsung');

    await userEvent.click(appleRadio);
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('brand');

    // Select a different option - should replace
    await userEvent.click(samsungRadio);
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('brand');
  });
});

describe('Range Filter', () => {
  it('should render range inputs', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('range-filter-price')).toBeInTheDocument();
    expect(screen.getByTestId('range-min-price')).toBeInTheDocument();
    expect(screen.getByTestId('range-max-price')).toBeInTheDocument();
    expect(screen.getByTestId('range-apply-price')).toBeInTheDocument();
  });

  it('should apply range filter when button clicked', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.type(screen.getByTestId('range-min-price'), '100');
    await userEvent.type(screen.getByTestId('range-max-price'), '500');
    await userEvent.click(screen.getByTestId('range-apply-price'));

    expect(screen.getByTestId('filter-ids')).toHaveTextContent('price');
  });
});

describe('Rating Filter', () => {
  it('should render rating options', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('rating-filter-rating')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-rating-5')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-rating-4')).toBeInTheDocument();
    expect(screen.getByTestId('rating-option-rating-1')).toBeInTheDocument();
  });

  it('should select rating', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('rating-option-rating-4'));
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('rating');
  });
});

describe('Color Filter', () => {
  it('should render color options', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('color-filter-color')).toBeInTheDocument();
    expect(screen.getByTestId('color-option-color-black')).toBeInTheDocument();
    expect(screen.getByTestId('color-option-color-white')).toBeInTheDocument();
  });

  it('should toggle color selection', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('color-option-color-black'));
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('color');
  });

  it('should have aria-label with selection state', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    const blackButton = screen.getByTestId('color-option-color-black');
    expect(blackButton).toHaveAttribute('aria-label', 'Black');

    await userEvent.click(blackButton);
    expect(blackButton).toHaveAttribute('aria-label', 'Black (selected)');
  });
});

describe('Size Filter', () => {
  it('should render size options', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('size-filter-size')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-size-xs')).toBeInTheDocument();
    expect(screen.getByTestId('size-option-size-m')).toBeInTheDocument();
  });

  it('should toggle size selection', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('size-option-size-m'));
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('size');
  });

  it('should have aria-pressed attribute', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    const sizeButton = screen.getByTestId('size-option-size-m');
    expect(sizeButton).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(sizeButton);
    expect(sizeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should disable option when disabled', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('size-option-size-l')).toBeDisabled();
  });
});

describe('SortDropdown', () => {
  it('should render sort button', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('sort-button')).toBeInTheDocument();
  });

  it('should show default text when no sort selected', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('sort-button')).toHaveTextContent('Sort by');
  });

  it('should show current sort label', () => {
    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        defaultSort={testSorts[0]}
      >
        <SortDropdown />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('sort-button')).toHaveTextContent('Relevance');
  });

  it('should open dropdown when clicked', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    expect(screen.queryByTestId('sort-options')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('sort-button'));

    expect(screen.getByTestId('sort-options')).toBeInTheDocument();
  });

  it('should render all sort options', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('sort-button'));

    expect(screen.getByTestId('sort-option-relevance')).toBeInTheDocument();
    expect(screen.getByTestId('sort-option-price-asc')).toBeInTheDocument();
    expect(screen.getByTestId('sort-option-price-desc')).toBeInTheDocument();
  });

  it('should select sort and close dropdown', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
        <TestFilterSortConsumer />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('sort-button'));
    await userEvent.click(screen.getByTestId('sort-option-price-asc'));

    expect(screen.getByTestId('current-sort')).toHaveTextContent('price-asc');
    expect(screen.queryByTestId('sort-options')).not.toBeInTheDocument();
  });

  it('should have aria-haspopup and aria-expanded', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    const button = screen.getByTestId('sort-button');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should have role="listbox" on options container', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <SortDropdown />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('sort-button'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

describe('ActiveFiltersBar', () => {
  it('should not render when no filters active', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <ActiveFiltersBar />
      </FilterSortProvider>
    );

    expect(screen.queryByTestId('active-filters-bar')).not.toBeInTheDocument();
  });

  it('should render when filters are active', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <ActiveFiltersBar />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    expect(screen.getByTestId('active-filters-bar')).toBeInTheDocument();
    expect(screen.getByTestId('active-filter-category-electronics')).toBeInTheDocument();
  });

  it('should show filter label and value', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <ActiveFiltersBar />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    const badge = screen.getByTestId('active-filter-category-electronics');
    expect(badge).toHaveTextContent('Category:');
    expect(badge).toHaveTextContent('Electronics');
  });

  it('should show clear all button', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <ActiveFiltersBar />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    expect(screen.getByTestId('clear-all-active-filters')).toBeInTheDocument();
  });
});

describe('MobileFilterModal', () => {
  it('should not render when closed', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={false} onClose={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.queryByTestId('mobile-filter-modal')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('mobile-filter-modal')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const onClose = vi.fn();

    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={onClose} />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('close-modal'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onApply and onClose when apply button clicked', async () => {
    const onClose = vi.fn();
    const onApply = vi.fn();

    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={onClose} onApply={onApply} />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('modal-apply-filters'));

    expect(onApply).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('should show clear button when filters active', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.queryByTestId('modal-clear-filters')).not.toBeInTheDocument();

    // Add a filter
    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    expect(screen.getByTestId('modal-clear-filters')).toBeInTheDocument();
  });

  it('should contain FilterPanel and SortDropdown', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filter-panel')).toBeInTheDocument();
    expect(screen.getByTestId('sort-dropdown')).toBeInTheDocument();
  });
});

describe('FilterToggleButton', () => {
  it('should render button', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterToggleButton onClick={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();
    expect(screen.getByTestId('filter-toggle-button')).toHaveTextContent('Filters');
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();

    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterToggleButton onClick={onClick} />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('filter-toggle-button'));

    expect(onClick).toHaveBeenCalled();
  });

  it('should show badge with active filter count', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
        <FilterToggleButton onClick={() => {}} />
      </FilterSortProvider>
    );

    // Initially no badge
    expect(screen.queryByText('1')).not.toBeInTheDocument();

    // Add a filter
    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    // Now should show count
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('FilterSort', () => {
  it('should render main component', () => {
    render(
      <FilterSort availableFilters={testFilters} availableSorts={testSorts} />
    );

    expect(screen.getByTestId('filter-sort')).toBeInTheDocument();
  });

  it('should show mobile toggle button', () => {
    render(
      <FilterSort availableFilters={testFilters} availableSorts={testSorts} showMobileToggle />
    );

    expect(screen.getByTestId('filter-toggle-button')).toBeInTheDocument();
  });

  it('should call onChange when filters change', async () => {
    const onChange = vi.fn();

    render(
      <FilterSort
        availableFilters={testFilters}
        availableSorts={testSorts}
        onChange={onChange}
        showMobileToggle
      />
    );

    // Open mobile modal
    await userEvent.click(screen.getByTestId('filter-toggle-button'));

    // Add a filter
    await userEvent.click(screen.getByTestId('filter-option-category-electronics'));

    expect(onChange).toHaveBeenCalled();
  });

  it('should render sort dropdown', () => {
    render(
      <FilterSort availableFilters={testFilters} availableSorts={testSorts} />
    );

    // There might be multiple sort dropdowns (desktop + mobile), verify at least one exists
    expect(screen.getAllByTestId('sort-dropdown').length).toBeGreaterThan(0);
  });

  it('should use defaultSort', () => {
    render(
      <FilterSort
        availableFilters={testFilters}
        availableSorts={testSorts}
        defaultSort={testSorts[0]}
      />
    );

    // There might be multiple sort buttons (desktop + mobile), get the first one
    expect(screen.getAllByTestId('sort-button')[0]).toHaveTextContent('Relevance');
  });
});

describe('Accessibility', () => {
  it('FilterPanel should have toggle with aria-expanded', async () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel collapsible defaultExpanded />
      </FilterSortProvider>
    );

    const toggle = screen.getByTestId('filter-toggle-category');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('SortDropdown should have proper ARIA attributes', async () => {
    render(
      <FilterSortProvider
        availableFilters={testFilters}
        availableSorts={testSorts}
        defaultSort={testSorts[0]}
      >
        <SortDropdown />
      </FilterSortProvider>
    );

    await userEvent.click(screen.getByTestId('sort-button'));

    const options = screen.getByTestId('sort-options');
    expect(options).toHaveAttribute('role', 'listbox');

    const selectedOption = screen.getByTestId('sort-option-relevance');
    expect(selectedOption).toHaveAttribute('role', 'option');
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });

  it('ColorFilter should have aria-labels', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('color-option-color-black')).toHaveAttribute('aria-label', 'Black');
  });

  it('SizeFilter should have aria-pressed', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <FilterPanel />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('size-option-size-m')).toHaveAttribute('aria-pressed', 'false');
  });

  it('MobileFilterModal close button should have aria-label', () => {
    render(
      <FilterSortProvider availableFilters={testFilters} availableSorts={testSorts}>
        <MobileFilterModal isOpen={true} onClose={() => {}} />
      </FilterSortProvider>
    );

    expect(screen.getByTestId('close-modal')).toHaveAttribute('aria-label', 'Close');
  });
});
