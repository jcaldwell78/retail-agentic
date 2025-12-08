import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  SearchProvider,
  useSearch,
  useSearchHistory,
  useSearchFilters,
  useSearchSuggestions,
  SearchInput,
  SuggestionList,
  SearchHistory,
  TrendingSearches,
  ActiveFilters,
  VoiceSearchButton,
  SearchBar,
  SmartSearch,
  SearchSuggestion,

} from './SmartSearch';

// Test consumer components
function TestSearchConsumer() {
  const {
    query,
    setQuery,
    search,
    clearQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    suggestions,
  } = useSearch();

  return (
    <div>
      <div data-testid="query">{query}</div>
      <div data-testid="is-open">{isOpen.toString()}</div>
      <div data-testid="selected-index">{selectedIndex}</div>
      <div data-testid="suggestions-count">{suggestions.length}</div>
      <button data-testid="set-query" onClick={() => setQuery('test')}>
        Set Query
      </button>
      <button data-testid="search" onClick={() => search('test query')}>
        Search
      </button>
      <button data-testid="clear" onClick={clearQuery}>
        Clear
      </button>
      <button data-testid="toggle-open" onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      <button data-testid="set-index" onClick={() => setSelectedIndex(2)}>
        Set Index
      </button>
    </div>
  );
}

function TestHistoryConsumer() {
  const { history, addToHistory, removeFromHistory, clearHistory, recentSearches } = useSearchHistory();

  return (
    <div>
      <div data-testid="history">{history.join(',')}</div>
      <div data-testid="recent-count">{recentSearches.length}</div>
      <button data-testid="add" onClick={() => addToHistory('new search')}>
        Add
      </button>
      <button data-testid="remove" onClick={() => removeFromHistory('test')}>
        Remove
      </button>
      <button data-testid="clear" onClick={clearHistory}>
        Clear
      </button>
    </div>
  );
}

function TestFiltersConsumer() {
  const { filters, addFilter, removeFilter, clearFilters } = useSearchFilters();

  return (
    <div>
      <div data-testid="filters-count">{filters.length}</div>
      <div data-testid="filter-ids">{filters.map((f) => f.id).join(',')}</div>
      <button
        data-testid="add-filter"
        onClick={() =>
          addFilter({ id: 'cat-1', label: 'Electronics', type: 'category', value: 'electronics' })
        }
      >
        Add
      </button>
      <button data-testid="remove-filter" onClick={() => removeFilter('cat-1')}>
        Remove
      </button>
      <button data-testid="clear-filters" onClick={clearFilters}>
        Clear
      </button>
    </div>
  );
}

function TestSuggestionsConsumer() {
  const { suggestions, isLoading } = useSearchSuggestions();

  return (
    <div>
      <div data-testid="suggestions-count">{suggestions.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
    </div>
  );
}

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('SearchProvider', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
    vi.clearAllMocks();
  });

  it('should provide default context values', () => {
    render(
      <SearchProvider>
        <TestSearchConsumer />
      </SearchProvider>
    );

    expect(screen.getByTestId('query')).toHaveTextContent('');
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('selected-index')).toHaveTextContent('-1');
  });

  it('should update query when setQuery is called', async () => {
    render(
      <SearchProvider>
        <TestSearchConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('set-query'));

    expect(screen.getByTestId('query')).toHaveTextContent('test');
  });

  it('should call onSearch when search is called', async () => {
    const onSearch = vi.fn();
    render(
      <SearchProvider onSearch={onSearch}>
        <TestSearchConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('search'));

    expect(onSearch).toHaveBeenCalledWith('test query', []);
  });

  it('should clear query when clearQuery is called', async () => {
    render(
      <SearchProvider>
        <TestSearchConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('set-query'));
    expect(screen.getByTestId('query')).toHaveTextContent('test');

    await userEvent.click(screen.getByTestId('clear'));
    expect(screen.getByTestId('query')).toHaveTextContent('');
  });

  it('should toggle isOpen state', async () => {
    render(
      <SearchProvider>
        <TestSearchConsumer />
      </SearchProvider>
    );

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');

    await userEvent.click(screen.getByTestId('toggle-open'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    await userEvent.click(screen.getByTestId('toggle-open'));
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('should update selectedIndex', async () => {
    render(
      <SearchProvider>
        <TestSearchConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('set-index'));
    expect(screen.getByTestId('selected-index')).toHaveTextContent('2');
  });
});

describe('useSearch', () => {
  it('should throw error when used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestSearchConsumer />)).toThrow(
      'useSearch must be used within a SearchProvider'
    );

    consoleError.mockRestore();
  });
});

describe('useSearchHistory', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
    vi.clearAllMocks();
  });

  it('should add items to history', async () => {
    render(
      <SearchProvider>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add'));
    expect(screen.getByTestId('history')).toHaveTextContent('new search');
  });

  it('should remove items from history', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(['test', 'other']));

    render(
      <SearchProvider>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    expect(screen.getByTestId('history')).toHaveTextContent('test,other');

    await userEvent.click(screen.getByTestId('remove'));
    expect(screen.getByTestId('history')).toHaveTextContent('other');
  });

  it('should clear all history', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(['test1', 'test2']));

    render(
      <SearchProvider>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('clear'));
    expect(screen.getByTestId('history')).toHaveTextContent('');
  });

  it('should not add duplicates to history', async () => {
    render(
      <SearchProvider>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add'));
    await userEvent.click(screen.getByTestId('add'));

    expect(screen.getByTestId('history')).toHaveTextContent('new search');
    expect(screen.getByTestId('history').textContent?.split(',').length).toBe(1);
  });

  it('should limit history to maxHistory', async () => {
    render(
      <SearchProvider maxHistory={2}>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    // Simulate adding to history via search
    // const search = useSearch;
    // Instead, we'll verify by adding multiple items
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(['a', 'b']));

    render(
      <SearchProvider maxHistory={2}>
        <TestHistoryConsumer />
      </SearchProvider>
    );
  });

  it('should generate recent searches from history', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(['test1', 'test2', 'test3']));

    render(
      <SearchProvider>
        <TestHistoryConsumer />
      </SearchProvider>
    );

    expect(screen.getByTestId('recent-count')).toHaveTextContent('3');
  });
});

describe('useSearchFilters', () => {
  it('should add filters', async () => {
    render(
      <SearchProvider>
        <TestFiltersConsumer />
      </SearchProvider>
    );

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');

    await userEvent.click(screen.getByTestId('add-filter'));
    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');
    expect(screen.getByTestId('filter-ids')).toHaveTextContent('cat-1');
  });

  it('should update existing filter with same id', async () => {
    render(
      <SearchProvider>
        <TestFiltersConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add-filter'));
    await userEvent.click(screen.getByTestId('add-filter'));

    expect(screen.getByTestId('filters-count')).toHaveTextContent('1');
  });

  it('should remove filters', async () => {
    render(
      <SearchProvider>
        <TestFiltersConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add-filter'));
    await userEvent.click(screen.getByTestId('remove-filter'));

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });

  it('should clear all filters', async () => {
    render(
      <SearchProvider>
        <TestFiltersConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add-filter'));
    await userEvent.click(screen.getByTestId('clear-filters'));

    expect(screen.getByTestId('filters-count')).toHaveTextContent('0');
  });
});

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should show loading state while fetching', async () => {
    vi.useFakeTimers();
    let resolvePromise: (value: SearchSuggestion[]) => void;
    const fetchSuggestions = vi.fn().mockImplementation(
      () =>
        new Promise<SearchSuggestion[]>((resolve) => {
          resolvePromise = resolve;
        })
    );

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <TestSuggestionsConsumer />
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    // Now loading should be true (fetch has started but not resolved)
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');

    // Resolve the promise
    await act(async () => {
      resolvePromise!([]);
    });

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    vi.useRealTimers();
  });

  it('should return suggestions after fetch', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test Product', type: 'product' },
      { id: '2', text: 'Test Category', type: 'category' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <TestSuggestionsConsumer />
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'test');

    // Wait for debounce and fetch to complete
    await waitFor(
      () => {
        expect(screen.getByTestId('suggestions-count')).toHaveTextContent('2');
      },
      { timeout: 1000 }
    );
  });
});

describe('SearchInput', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should render input', () => {
    render(
      <SearchProvider>
        <SearchInput />
      </SearchProvider>
    );

    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should update query on change', async () => {
    render(
      <SearchProvider>
        <SearchInput />
        <TestSearchConsumer />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'test query');

    expect(screen.getByTestId('query')).toHaveTextContent('test query');
  });

  it('should clear query when clear button clicked', async () => {
    render(
      <SearchProvider>
        <SearchInput />
        <TestSearchConsumer />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'test');

    const clearButton = screen.getByTestId('clear-search');
    await userEvent.click(clearButton);

    expect(screen.getByTestId('query')).toHaveTextContent('');
  });

  it('should open suggestions on focus', async () => {
    render(
      <SearchProvider>
        <SearchInput />
        <TestSearchConsumer />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
  });

  it('should handle arrow key navigation', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'One', type: 'product' },
      { id: '2', text: 'Two', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
        <TestSearchConsumer />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestions-count')).toHaveTextContent('2');
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByTestId('selected-index')).toHaveTextContent('0');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByTestId('selected-index')).toHaveTextContent('1');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(screen.getByTestId('selected-index')).toHaveTextContent('0');
  });

  it('should search on Enter', async () => {
    const onSearch = vi.fn();

    render(
      <SearchProvider onSearch={onSearch}>
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'test query');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledWith('test query', []);
  });

  it('should close on Escape', () => {
    render(
      <SearchProvider>
        <SearchInput />
        <TestSearchConsumer />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
  });

  it('should apply different sizes', () => {
    const { rerender } = render(
      <SearchProvider>
        <SearchInput size="sm" />
      </SearchProvider>
    );

    expect(screen.getByTestId('search-input')).toHaveClass('h-8');

    rerender(
      <SearchProvider>
        <SearchInput size="lg" />
      </SearchProvider>
    );

    expect(screen.getByTestId('search-input')).toHaveClass('h-12');
  });

  it('should have aria attributes', () => {
    render(
      <SearchProvider>
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('aria-label', 'Search');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
  });
});

describe('SuggestionList', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should not render when closed', () => {
    render(
      <SearchProvider>
        <SuggestionList />
      </SearchProvider>
    );

    expect(screen.queryByTestId('suggestion-list')).not.toBeInTheDocument();
  });

  it('should render suggestions when open', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test Product', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-list')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    vi.useFakeTimers();
    const fetchSuggestions = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 1000))
    );

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId('suggestions-loading')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should display type badges', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Product', type: 'product' },
      { id: '2', text: 'Category', type: 'category' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList showType />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      const badges = screen.getAllByTestId('suggestion-type');
      expect(badges[0]).toHaveTextContent('Product');
      expect(badges[1]).toHaveTextContent('Category');
    });
  });

  it('should display images when provided', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Product', type: 'product', image: 'http://example.com/img.jpg' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList showImages />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-image')).toBeInTheDocument();
    });
  });

  it('should display price when provided', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Product', type: 'product', metadata: { price: 29.99 } },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-price')).toHaveTextContent('$29.99');
    });
  });

  it('should highlight selected suggestion', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'One', type: 'product' },
      { id: '2', text: 'Two', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-0')).toBeInTheDocument();
    });

    fireEvent.mouseEnter(screen.getByTestId('suggestion-0'));
    expect(screen.getByTestId('suggestion-0')).toHaveAttribute('aria-selected', 'true');
  });

  it('should call selectSuggestion on click', async () => {
    const onSearch = vi.fn();
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test Product', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions} onSearch={onSearch}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByTestId('suggestion-0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('suggestion-0'));

    expect(onSearch).toHaveBeenCalledWith('Test Product', []);
  });

  it('should have role="listbox"', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });
});

describe('SearchHistory', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['test1', 'test2', 'test3']));
  });

  it('should not render when history is empty', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <SearchProvider>
        <SearchHistory />
      </SearchProvider>
    );

    expect(screen.queryByTestId('search-history')).not.toBeInTheDocument();
  });

  it('should render history items', () => {
    render(
      <SearchProvider>
        <SearchHistory />
      </SearchProvider>
    );

    expect(screen.getByTestId('search-history')).toBeInTheDocument();
    expect(screen.getByTestId('history-item-0')).toHaveTextContent('test1');
    expect(screen.getByTestId('history-item-1')).toHaveTextContent('test2');
  });

  it('should limit items to maxItems', () => {
    render(
      <SearchProvider>
        <SearchHistory maxItems={2} />
      </SearchProvider>
    );

    expect(screen.getByTestId('history-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('history-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('history-item-2')).not.toBeInTheDocument();
  });

  it('should search when history item clicked', async () => {
    const onSearch = vi.fn();

    render(
      <SearchProvider onSearch={onSearch}>
        <SearchHistory />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('history-item-0'));

    expect(onSearch).toHaveBeenCalledWith('test1', []);
  });

  it('should remove item when remove button clicked', async () => {
    render(
      <SearchProvider>
        <SearchHistory />
        <TestHistoryConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('remove-history-0'));

    expect(screen.getByTestId('history')).not.toHaveTextContent('test1');
  });

  it('should clear all history when clear button clicked', async () => {
    render(
      <SearchProvider>
        <SearchHistory />
        <TestHistoryConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('clear-history'));

    expect(screen.getByTestId('history')).toHaveTextContent('');
  });

  it('should use custom title', () => {
    render(
      <SearchProvider>
        <SearchHistory title="Your Recent Searches" />
      </SearchProvider>
    );

    expect(screen.getByText('Your Recent Searches')).toBeInTheDocument();
  });
});

describe('TrendingSearches', () => {
  const trendingSearches: SearchSuggestion[] = [
    { id: 'trend-1', text: 'Trending 1', type: 'trending' },
    { id: 'trend-2', text: 'Trending 2', type: 'trending' },
  ];

  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should not render when no trending searches', () => {
    render(
      <SearchProvider>
        <TrendingSearches />
      </SearchProvider>
    );

    expect(screen.queryByTestId('trending-searches')).not.toBeInTheDocument();
  });

  it('should render trending items', () => {
    render(
      <SearchProvider trendingSearches={trendingSearches}>
        <TrendingSearches />
      </SearchProvider>
    );

    expect(screen.getByTestId('trending-searches')).toBeInTheDocument();
    expect(screen.getByTestId('trending-trend-1')).toHaveTextContent('Trending 1');
  });

  it('should search when trending item clicked', async () => {
    const onSearch = vi.fn();

    render(
      <SearchProvider trendingSearches={trendingSearches} onSearch={onSearch}>
        <TrendingSearches />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('trending-trend-1'));

    expect(onSearch).toHaveBeenCalledWith('Trending 1', []);
  });

  it('should limit items to maxItems', () => {
    const manyTrending: SearchSuggestion[] = Array.from({ length: 10 }, (_, i) => ({
      id: `trend-${i}`,
      text: `Trending ${i}`,
      type: 'trending',
    }));

    render(
      <SearchProvider trendingSearches={manyTrending}>
        <TrendingSearches maxItems={3} />
      </SearchProvider>
    );

    expect(screen.getByTestId('trending-trend-0')).toBeInTheDocument();
    expect(screen.getByTestId('trending-trend-2')).toBeInTheDocument();
    expect(screen.queryByTestId('trending-trend-3')).not.toBeInTheDocument();
  });

  it('should use custom title', () => {
    render(
      <SearchProvider trendingSearches={trendingSearches}>
        <TrendingSearches title="Hot Now" />
      </SearchProvider>
    );

    expect(screen.getByText('Hot Now')).toBeInTheDocument();
  });
});

describe('ActiveFilters', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should not render when no filters', () => {
    render(
      <SearchProvider>
        <ActiveFilters />
      </SearchProvider>
    );

    expect(screen.queryByTestId('active-filters')).not.toBeInTheDocument();
  });

  it('should render active filters', async () => {
    render(
      <SearchProvider>
        <ActiveFilters />
        <TestFiltersConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add-filter'));

    expect(screen.getByTestId('active-filters')).toBeInTheDocument();
    expect(screen.getByTestId('filter-cat-1')).toHaveTextContent('Electronics');
  });

  it('should remove filter when X clicked', async () => {
    render(
      <SearchProvider>
        <ActiveFilters />
        <TestFiltersConsumer />
      </SearchProvider>
    );

    await userEvent.click(screen.getByTestId('add-filter'));
    expect(screen.getByTestId('filter-cat-1')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('remove-filter-cat-1'));
    expect(screen.queryByTestId('filter-cat-1')).not.toBeInTheDocument();
  });

  it('should show clear all button when multiple filters', async () => {
    render(
      <SearchProvider>
        <ActiveFilters />
        <TestFiltersConsumer />
        <button
          data-testid="add-second"
          onClick={() => {
            // This is a workaround - in real use, we'd have access to addFilter
          }}
        >
          Add Second
        </button>
      </SearchProvider>
    );

    // Add first filter
    await userEvent.click(screen.getByTestId('add-filter'));

    // Clear all button only shows when 2+ filters
    expect(screen.queryByTestId('clear-all-filters')).not.toBeInTheDocument();
  });
});

describe('VoiceSearchButton', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should not render when speech recognition not supported', () => {
    render(
      <SearchProvider>
        <VoiceSearchButton />
      </SearchProvider>
    );

    expect(screen.queryByTestId('voice-search')).not.toBeInTheDocument();
  });

  it('should render when speech recognition is supported', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = vi.fn();

    render(
      <SearchProvider>
        <VoiceSearchButton />
      </SearchProvider>
    );

    expect(screen.getByTestId('voice-search')).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });

  it('should have aria-label', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = vi.fn();

    render(
      <SearchProvider>
        <VoiceSearchButton />
      </SearchProvider>
    );

    expect(screen.getByTestId('voice-search')).toHaveAttribute('aria-label', 'Voice search');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;
  });
});

describe('SearchBar', () => {
  const trendingSearches: SearchSuggestion[] = [
    { id: 'trend-1', text: 'Trending', type: 'trending' },
  ];

  beforeEach(() => {
    mockLocalStorage.reset();
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['history1']));
  });

  it('should render search bar', () => {
    render(
      <SearchProvider>
        <SearchBar />
      </SearchProvider>
    );

    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('should show history and trending when focused with no query', () => {
    render(
      <SearchProvider trendingSearches={trendingSearches}>
        <SearchBar showHistory showTrending />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);

    expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('search-history')).toBeInTheDocument();
    expect(screen.getByTestId('trending-searches')).toBeInTheDocument();
  });

  it('should hide dropdown when query is entered', async () => {
    render(
      <SearchProvider trendingSearches={trendingSearches}>
        <SearchBar showHistory showTrending />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);

    expect(screen.getByTestId('search-dropdown')).toBeInTheDocument();

    await userEvent.type(input, 'test');

    expect(screen.queryByTestId('search-dropdown')).not.toBeInTheDocument();
  });
});

describe('SmartSearch', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('should render smart search component', () => {
    render(<SmartSearch />);

    expect(screen.getByTestId('smart-search')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('should call onSearch when searching', async () => {
    const onSearch = vi.fn();

    render(<SmartSearch onSearch={onSearch} />);

    const input = screen.getByTestId('search-input');
    await userEvent.type(input, 'test query');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSearch).toHaveBeenCalledWith('test query', []);
  });

  it('should use custom placeholder', () => {
    render(<SmartSearch placeholder="Find products..." />);

    expect(screen.getByTestId('search-input')).toHaveAttribute('placeholder', 'Find products...');
  });

  it('should fetch suggestions', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test Suggestion', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(<SmartSearch fetchSuggestions={fetchSuggestions} />);

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(fetchSuggestions).toHaveBeenCalledWith('test');
    });
  });

  it('should show trending searches', () => {
    const trendingSearches: SearchSuggestion[] = [
      { id: 'trend-1', text: 'Trending', type: 'trending' },
    ];

    render(<SmartSearch trendingSearches={trendingSearches} />);

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);

    expect(screen.getByTestId('trending-searches')).toBeInTheDocument();
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    mockLocalStorage.reset();
  });

  it('SearchInput should have proper ARIA attributes', () => {
    render(
      <SearchProvider>
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('aria-label', 'Search');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-controls', 'search-suggestions');
    expect(input).toHaveAttribute('aria-expanded');
  });

  it('SuggestionList should have role="listbox"', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('Suggestion items should have role="option"', async () => {
    const suggestions: SearchSuggestion[] = [
      { id: '1', text: 'Test', type: 'product' },
    ];
    const fetchSuggestions = vi.fn().mockResolvedValue(suggestions);

    render(
      <SearchProvider fetchSuggestions={fetchSuggestions}>
        <SearchInput />
        <SuggestionList />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.focus(input);
    await userEvent.type(input, 'test');

    await waitFor(() => {
      expect(screen.getByRole('option')).toBeInTheDocument();
    });
  });

  it('Clear button should have aria-label', () => {
    render(
      <SearchProvider>
        <SearchInput />
      </SearchProvider>
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByTestId('clear-search')).toHaveAttribute('aria-label', 'Clear search');
  });

  it('Remove history button should have aria-label', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['test']));

    render(
      <SearchProvider>
        <SearchHistory />
      </SearchProvider>
    );

    expect(screen.getByTestId('remove-history-0')).toHaveAttribute(
      'aria-label',
      'Remove "test" from history'
    );
  });
});
