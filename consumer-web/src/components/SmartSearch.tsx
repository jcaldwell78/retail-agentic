import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Types
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'brand' | 'history' | 'trending';
  image?: string;
  metadata?: {
    price?: number;
    category?: string;
    productCount?: number;
  };
}

export interface SearchFilter {
  id: string;
  label: string;
  type: 'category' | 'brand' | 'price' | 'rating' | 'custom';
  value: string | number | [number, number];
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price?: number;
  category?: string;
  brand?: string;
  rating?: number;
  relevanceScore?: number;
}

export interface SearchState {
  query: string;
  suggestions: SearchSuggestion[];
  history: string[];
  recentSearches: SearchSuggestion[];
  trendingSearches: SearchSuggestion[];
  filters: SearchFilter[];
  isLoading: boolean;
  isOpen: boolean;
  selectedIndex: number;
  results: SearchResult[];
}

export interface SearchContextType extends SearchState {
  setQuery: (query: string) => void;
  search: (query: string) => void;
  clearQuery: () => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  addFilter: (filter: SearchFilter) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedIndex: (index: number) => void;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
}

const HISTORY_KEY = 'search-history';
const MAX_HISTORY = 10;

// Context
const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Provider
export interface SearchProviderProps {
  children: ReactNode;
  onSearch?: (query: string, filters: SearchFilter[]) => void;
  fetchSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  trendingSearches?: SearchSuggestion[];
  maxHistory?: number;
}

export function SearchProvider({
  children,
  onSearch,
  fetchSuggestions,
  trendingSearches = [],
  maxHistory = MAX_HISTORY,
}: SearchProviderProps) {
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results] = useState<SearchResult[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    if (fetchSuggestions) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await fetchSuggestions(query);
          setSuggestions(results);
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    setSelectedIndex(-1);
  }, []);

  const search = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;
      addToHistory(searchQuery);
      onSearch?.(searchQuery, filters);
      setIsOpen(false);
    },
    [filters, onSearch]
  );

  const clearQuery = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setSelectedIndex(-1);
  }, []);

  const addToHistory = useCallback(
    (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
        return [trimmed, ...filtered].slice(0, maxHistory);
      });
    },
    [maxHistory]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const removeFromHistory = useCallback((searchQuery: string) => {
    setHistory((prev) => prev.filter((h) => h !== searchQuery));
  }, []);

  const addFilter = useCallback((filter: SearchFilter) => {
    setFilters((prev) => {
      const exists = prev.find((f) => f.id === filter.id);
      if (exists) {
        return prev.map((f) => (f.id === filter.id ? filter : f));
      }
      return [...prev, filter];
    });
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: SearchSuggestion) => {
      setQueryState(suggestion.text);
      search(suggestion.text);
    },
    [search]
  );

  // Generate recent searches from history
  const recentSearches: SearchSuggestion[] = history.slice(0, 5).map((text, i) => ({
    id: `history-${i}`,
    text,
    type: 'history',
  }));

  const value: SearchContextType = {
    query,
    suggestions,
    history,
    recentSearches,
    trendingSearches,
    filters,
    isLoading,
    isOpen,
    selectedIndex,
    results,
    setQuery,
    search,
    clearQuery,
    addToHistory,
    clearHistory,
    removeFromHistory,
    addFilter,
    removeFilter,
    clearFilters,
    setIsOpen,
    setSelectedIndex,
    selectSuggestion,
  };

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

// Hooks
export function useSearchHistory() {
  const { history, addToHistory, removeFromHistory, clearHistory, recentSearches } = useSearch();
  return { history, addToHistory, removeFromHistory, clearHistory, recentSearches };
}

export function useSearchFilters() {
  const { filters, addFilter, removeFilter, clearFilters } = useSearch();
  return { filters, addFilter, removeFilter, clearFilters };
}

export function useSearchSuggestions() {
  const { suggestions, isLoading, trendingSearches, recentSearches, query } = useSearch();

  // Combine and prioritize suggestions
  const allSuggestions = query.trim()
    ? suggestions
    : [...recentSearches, ...trendingSearches];

  return { suggestions: allSuggestions, isLoading };
}

// Components
export interface SearchInputProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showClearButton?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchInput({
  placeholder = 'Search products...',
  className,
  autoFocus = false,
  size = 'md',
  showClearButton = true,
  onFocus,
  onBlur,
}: SearchInputProps) {
  const { query, setQuery, search, isOpen, setIsOpen, suggestions, selectedIndex, setSelectedIndex, selectSuggestion, clearQuery } =
    useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const totalItems = suggestions.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(selectedIndex < totalItems - 1 ? selectedIndex + 1 : 0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : totalItems - 1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex]);
          } else if (query.trim()) {
            search(query);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [suggestions, selectedIndex, setSelectedIndex, selectSuggestion, query, search, setIsOpen]
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    onFocus?.();
  }, [setIsOpen, onFocus]);

  const handleBlur = useCallback(() => {
    // Delay closing to allow click on suggestions
    setTimeout(() => {
      setIsOpen(false);
      onBlur?.();
    }, 200);
  }, [setIsOpen, onBlur]);

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg',
  };

  return (
    <div className={cn('relative', className)} data-testid="search-input-container">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn('pl-10 pr-10', sizeClasses[size])}
          aria-label="Search"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          data-testid="search-input"
        />
        {showClearButton && query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
            data-testid="clear-search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Suggestion List
export interface SuggestionListProps {
  className?: string;
  showImages?: boolean;
  showType?: boolean;
  maxItems?: number;
}

export function SuggestionList({
  className,
  showImages = true,
  showType = true,
  maxItems = 10,
}: SuggestionListProps) {
  const { suggestions, isLoading, selectedIndex, selectSuggestion, setSelectedIndex, query, recentSearches, trendingSearches, isOpen } =
    useSearch();

  if (!isOpen) return null;

  const displaySuggestions = query.trim()
    ? suggestions.slice(0, maxItems)
    : [...recentSearches, ...trendingSearches].slice(0, maxItems);

  if (displaySuggestions.length === 0 && !isLoading) {
    return null;
  }

  const typeLabels: Record<SearchSuggestion['type'], string> = {
    product: 'Product',
    category: 'Category',
    brand: 'Brand',
    history: 'Recent',
    trending: 'Trending',
  };

  const typeColors: Record<SearchSuggestion['type'], string> = {
    product: 'bg-blue-100 text-blue-800',
    category: 'bg-green-100 text-green-800',
    brand: 'bg-purple-100 text-purple-800',
    history: 'bg-gray-100 text-gray-800',
    trending: 'bg-orange-100 text-orange-800',
  };

  return (
    <div
      id="search-suggestions"
      role="listbox"
      className={cn(
        'absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 overflow-hidden',
        className
      )}
      data-testid="suggestion-list"
    >
      {isLoading ? (
        <div className="p-4 text-center text-gray-500" data-testid="suggestions-loading">
          <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <ul className="max-h-96 overflow-y-auto">
          {displaySuggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                index === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              )}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              data-testid={`suggestion-${index}`}
            >
              {showImages && suggestion.image && (
                <img
                  src={suggestion.image}
                  alt=""
                  className="w-10 h-10 object-cover rounded"
                  data-testid="suggestion-image"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{suggestion.text}</div>
                {suggestion.metadata?.category && (
                  <div className="text-sm text-gray-500">{suggestion.metadata.category}</div>
                )}
              </div>
              {showType && (
                <Badge className={cn('text-xs', typeColors[suggestion.type])} data-testid="suggestion-type">
                  {typeLabels[suggestion.type]}
                </Badge>
              )}
              {suggestion.metadata?.price !== undefined && (
                <span className="text-sm font-medium text-gray-900" data-testid="suggestion-price">
                  ${suggestion.metadata.price.toFixed(2)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Search History
export interface SearchHistoryProps {
  className?: string;
  title?: string;
  maxItems?: number;
  onSelect?: (query: string) => void;
}

export function SearchHistory({ className, title = 'Recent Searches', maxItems = 5, onSelect }: SearchHistoryProps) {
  const { history, removeFromHistory, clearHistory, search } = useSearch();

  if (history.length === 0) return null;

  const displayHistory = history.slice(0, maxItems);

  const handleSelect = (query: string) => {
    onSelect?.(query);
    search(query);
  };

  return (
    <div className={cn('space-y-2', className)} data-testid="search-history">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Clear history"
          data-testid="clear-history"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-1">
        {displayHistory.map((query, index) => (
          <li key={`history-${index}`} className="flex items-center gap-2 group">
            <button
              onClick={() => handleSelect(query)}
              className="flex-1 flex items-center gap-2 text-left text-sm text-gray-600 hover:text-gray-900 py-1"
              data-testid={`history-item-${index}`}
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {query}
            </button>
            <button
              onClick={() => removeFromHistory(query)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1"
              aria-label={`Remove "${query}" from history`}
              data-testid={`remove-history-${index}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Trending Searches
export interface TrendingSearchesProps {
  className?: string;
  title?: string;
  maxItems?: number;
}

export function TrendingSearches({ className, title = 'Trending', maxItems = 5 }: TrendingSearchesProps) {
  const { trendingSearches, selectSuggestion } = useSearch();

  if (trendingSearches.length === 0) return null;

  const displayTrending = trendingSearches.slice(0, maxItems);

  return (
    <div className={cn('space-y-2', className)} data-testid="trending-searches">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {displayTrending.map((item) => (
          <button
            key={item.id}
            onClick={() => selectSuggestion(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
            data-testid={`trending-${item.id}`}
          >
            <svg className="h-3 w-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// Active Filters
export interface ActiveFiltersProps {
  className?: string;
}

export function ActiveFilters({ className }: ActiveFiltersProps) {
  const { filters, removeFilter, clearFilters } = useSearch();

  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid="active-filters">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
          data-testid={`filter-${filter.id}`}
        >
          <span>{filter.label}</span>
          <button
            onClick={() => removeFilter(filter.id)}
            className="ml-1 p-0.5 hover:bg-gray-200 rounded"
            aria-label={`Remove ${filter.label} filter`}
            data-testid={`remove-filter-${filter.id}`}
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-xs h-6"
          data-testid="clear-all-filters"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

// Voice Search Button
export interface VoiceSearchButtonProps {
  className?: string;
  onResult?: (transcript: string) => void;
}

export function VoiceSearchButton({ className, onResult }: VoiceSearchButtonProps) {
  const { setQuery, search } = useSearch();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onResult?.(transcript);
      search(transcript);
    };

    recognition.start();
  }, [isSupported, setQuery, search, onResult]);

  if (!isSupported) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startListening}
      disabled={isListening}
      className={cn('relative', className)}
      aria-label={isListening ? 'Listening...' : 'Voice search'}
      data-testid="voice-search"
    >
      {isListening && (
        <span className="absolute inset-0 animate-ping bg-red-200 rounded-full" />
      )}
      <svg
        className={cn('h-5 w-5', isListening ? 'text-red-500' : 'text-gray-500')}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      </svg>
    </Button>
  );
}

// Search Bar (combines input and suggestions)
export interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showVoiceSearch?: boolean;
  showHistory?: boolean;
  showTrending?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchBar({
  placeholder,
  className,
  showVoiceSearch = true,
  showHistory = true,
  showTrending = true,
  size = 'md',
}: SearchBarProps) {
  const { isOpen, query } = useSearch();

  return (
    <div className={cn('relative', className)} data-testid="search-bar">
      <div className="flex items-center gap-2">
        <SearchInput placeholder={placeholder} size={size} className="flex-1" />
        {showVoiceSearch && <VoiceSearchButton />}
      </div>
      <SuggestionList />
      {isOpen && !query && (showHistory || showTrending) && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 p-4 space-y-4"
          data-testid="search-dropdown"
        >
          {showHistory && <SearchHistory />}
          {showTrending && <TrendingSearches />}
        </div>
      )}
    </div>
  );
}

// Full Search Component with filters
export interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string, filters: SearchFilter[]) => void;
  fetchSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  trendingSearches?: SearchSuggestion[];
}

export function SmartSearch({
  placeholder = 'Search products...',
  className,
  onSearch,
  fetchSuggestions,
  trendingSearches,
}: SmartSearchProps) {
  return (
    <SearchProvider
      onSearch={onSearch}
      fetchSuggestions={fetchSuggestions}
      trendingSearches={trendingSearches}
    >
      <div className={cn('space-y-3', className)} data-testid="smart-search">
        <SearchBar placeholder={placeholder} />
        <ActiveFilters />
      </div>
    </SearchProvider>
  );
}
