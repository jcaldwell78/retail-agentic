import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Types
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: SortDirection;
}

export interface FilterValue {
  min?: number;
  max?: number;
  values?: string[];
  value?: string | number | boolean;
}

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'rating' | 'color' | 'size';
  options?: FilterOption[];
  range?: {
    min: number;
    max: number;
    step?: number;
    unit?: string;
  };
}

export interface ActiveFilter {
  filterId: string;
  value: FilterValue;
}

export interface FilterSortState {
  filters: ActiveFilter[];
  sort: SortOption | null;
  availableFilters: FilterDefinition[];
  availableSorts: SortOption[];
}

export interface FilterSortContextType extends FilterSortState {
  setFilter: (filterId: string, value: FilterValue) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  toggleFilterValue: (filterId: string, value: string) => void;
  setSort: (sort: SortOption) => void;
  clearSort: () => void;
  getFilterValue: (filterId: string) => FilterValue | undefined;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

// Context
const FilterSortContext = createContext<FilterSortContextType | null>(null);

export function useFilterSort(): FilterSortContextType {
  const context = useContext(FilterSortContext);
  if (!context) {
    throw new Error('useFilterSort must be used within a FilterSortProvider');
  }
  return context;
}

// Provider
export interface FilterSortProviderProps {
  children: ReactNode;
  availableFilters: FilterDefinition[];
  availableSorts: SortOption[];
  defaultSort?: SortOption;
  onChange?: (filters: ActiveFilter[], sort: SortOption | null) => void;
}

export function FilterSortProvider({
  children,
  availableFilters,
  availableSorts,
  defaultSort,
  onChange,
}: FilterSortProviderProps) {
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [sort, setSort] = useState<SortOption | null>(defaultSort || null);

  const setFilter = useCallback(
    (filterId: string, value: FilterValue) => {
      setFilters((prev) => {
        const existing = prev.findIndex((f) => f.filterId === filterId);
        let newFilters: ActiveFilter[];
        if (existing >= 0) {
          newFilters = prev.map((f, i) => (i === existing ? { filterId, value } : f));
        } else {
          newFilters = [...prev, { filterId, value }];
        }
        onChange?.(newFilters, sort);
        return newFilters;
      });
    },
    [sort, onChange]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      setFilters((prev) => {
        const newFilters = prev.filter((f) => f.filterId !== filterId);
        onChange?.(newFilters, sort);
        return newFilters;
      });
    },
    [sort, onChange]
  );

  const clearFilters = useCallback(() => {
    setFilters([]);
    onChange?.([], sort);
  }, [sort, onChange]);

  const toggleFilterValue = useCallback(
    (filterId: string, value: string) => {
      setFilters((prev) => {
        const existing = prev.find((f) => f.filterId === filterId);
        let newFilters: ActiveFilter[];

        if (existing?.value.values) {
          const values = existing.value.values.includes(value)
            ? existing.value.values.filter((v) => v !== value)
            : [...existing.value.values, value];

          if (values.length === 0) {
            newFilters = prev.filter((f) => f.filterId !== filterId);
          } else {
            newFilters = prev.map((f) =>
              f.filterId === filterId ? { filterId, value: { values } } : f
            );
          }
        } else {
          newFilters = [...prev, { filterId, value: { values: [value] } }];
        }

        onChange?.(newFilters, sort);
        return newFilters;
      });
    },
    [sort, onChange]
  );

  const handleSetSort = useCallback(
    (newSort: SortOption) => {
      setSort(newSort);
      onChange?.(filters, newSort);
    },
    [filters, onChange]
  );

  const clearSort = useCallback(() => {
    setSort(null);
    onChange?.(filters, null);
  }, [filters, onChange]);

  const getFilterValue = useCallback(
    (filterId: string): FilterValue | undefined => {
      return filters.find((f) => f.filterId === filterId)?.value;
    },
    [filters]
  );

  const hasActiveFilters = filters.length > 0;
  const activeFilterCount = filters.reduce((count, filter) => {
    if (filter.value.values) return count + filter.value.values.length;
    if (filter.value.min !== undefined || filter.value.max !== undefined) return count + 1;
    if (filter.value.value !== undefined) return count + 1;
    return count;
  }, 0);

  const value: FilterSortContextType = {
    filters,
    sort,
    availableFilters,
    availableSorts,
    setFilter,
    removeFilter,
    clearFilters,
    toggleFilterValue,
    setSort: handleSetSort,
    clearSort,
    getFilterValue,
    hasActiveFilters,
    activeFilterCount,
  };

  return <FilterSortContext.Provider value={value}>{children}</FilterSortContext.Provider>;
}

// Components
export interface FilterPanelProps {
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function FilterPanel({ className, collapsible = true, defaultExpanded = true }: FilterPanelProps) {
  const { availableFilters, hasActiveFilters, clearFilters, activeFilterCount } = useFilterSort();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(availableFilters.map((f) => [f.id, defaultExpanded]))
  );

  const toggleSection = (id: string) => {
    if (collapsible) {
      setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="filter-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="clear-all-filters">
            Clear all ({activeFilterCount})
          </Button>
        )}
      </div>

      {availableFilters.map((filter) => (
        <div key={filter.id} className="border-b pb-4" data-testid={`filter-section-${filter.id}`}>
          <button
            className="flex items-center justify-between w-full py-2 font-medium text-left"
            onClick={() => toggleSection(filter.id)}
            aria-expanded={expandedSections[filter.id]}
            data-testid={`filter-toggle-${filter.id}`}
          >
            {filter.label}
            {collapsible && (
              <svg
                className={cn('h-4 w-4 transition-transform', expandedSections[filter.id] && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {expandedSections[filter.id] && (
            <div className="mt-2" data-testid={`filter-content-${filter.id}`}>
              {filter.type === 'checkbox' && <CheckboxFilter filter={filter} />}
              {filter.type === 'radio' && <RadioFilter filter={filter} />}
              {filter.type === 'range' && <RangeFilter filter={filter} />}
              {filter.type === 'rating' && <RatingFilter filter={filter} />}
              {filter.type === 'color' && <ColorFilter filter={filter} />}
              {filter.type === 'size' && <SizeFilter filter={filter} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Checkbox Filter
interface FilterComponentProps {
  filter: FilterDefinition;
}

function CheckboxFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, toggleFilterValue } = useFilterSort();
  const currentValue = getFilterValue(filter.id);
  const selectedValues = currentValue?.values || [];

  return (
    <div className="space-y-2" data-testid={`checkbox-filter-${filter.id}`}>
      {filter.options?.map((option) => (
        <label
          key={option.id}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="checkbox"
            checked={selectedValues.includes(option.id)}
            onChange={() => !option.disabled && toggleFilterValue(filter.id, option.id)}
            disabled={option.disabled}
            className="rounded border-gray-300"
            data-testid={`filter-option-${filter.id}-${option.id}`}
          />
          <span className="text-sm">{option.label}</span>
          {option.count !== undefined && (
            <span className="text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
}

// Radio Filter
function RadioFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, setFilter, removeFilter } = useFilterSort();
  const currentValue = getFilterValue(filter.id)?.value as string | undefined;

  const handleChange = (value: string) => {
    if (currentValue === value) {
      removeFilter(filter.id);
    } else {
      setFilter(filter.id, { value });
    }
  };

  return (
    <div className="space-y-2" data-testid={`radio-filter-${filter.id}`}>
      {filter.options?.map((option) => (
        <label
          key={option.id}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            option.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            type="radio"
            name={filter.id}
            checked={currentValue === option.id}
            onChange={() => !option.disabled && handleChange(option.id)}
            disabled={option.disabled}
            className="border-gray-300"
            data-testid={`filter-option-${filter.id}-${option.id}`}
          />
          <span className="text-sm">{option.label}</span>
          {option.count !== undefined && (
            <span className="text-xs text-gray-500">({option.count})</span>
          )}
        </label>
      ))}
    </div>
  );
}

// Range Filter
function RangeFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, setFilter } = useFilterSort();
  const currentValue = getFilterValue(filter.id);
  const range = filter.range || { min: 0, max: 100, step: 1 };

  const [localMin, setLocalMin] = useState<string>(currentValue?.min?.toString() || '');
  const [localMax, setLocalMax] = useState<string>(currentValue?.max?.toString() || '');

  const applyRange = useCallback(() => {
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;
    if (min !== undefined || max !== undefined) {
      setFilter(filter.id, { min, max });
    }
  }, [localMin, localMax, filter.id, setFilter]);

  return (
    <div className="space-y-3" data-testid={`range-filter-${filter.id}`}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={`Min${range.unit ? ` (${range.unit})` : ''}`}
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          min={range.min}
          max={range.max}
          step={range.step}
          className="w-full"
          data-testid={`range-min-${filter.id}`}
        />
        <span className="text-gray-400">-</span>
        <Input
          type="number"
          placeholder={`Max${range.unit ? ` (${range.unit})` : ''}`}
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          min={range.min}
          max={range.max}
          step={range.step}
          className="w-full"
          data-testid={`range-max-${filter.id}`}
        />
      </div>
      <Button size="sm" variant="outline" onClick={applyRange} className="w-full" data-testid={`range-apply-${filter.id}`}>
        Apply
      </Button>
    </div>
  );
}

// Rating Filter
function RatingFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, setFilter, removeFilter } = useFilterSort();
  const currentValue = getFilterValue(filter.id)?.value as number | undefined;

  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className="space-y-2" data-testid={`rating-filter-${filter.id}`}>
      {ratings.map((rating) => (
        <label key={rating} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={`rating-${filter.id}`}
            checked={currentValue === rating}
            onChange={() => {
              if (currentValue === rating) {
                removeFilter(filter.id);
              } else {
                setFilter(filter.id, { value: rating });
              }
            }}
            className="border-gray-300"
            data-testid={`rating-option-${filter.id}-${rating}`}
          />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={cn('h-4 w-4', i < rating ? 'text-yellow-400' : 'text-gray-300')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-sm text-gray-600 ml-1">& up</span>
          </div>
        </label>
      ))}
    </div>
  );
}

// Color Filter
function ColorFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, toggleFilterValue } = useFilterSort();
  const currentValue = getFilterValue(filter.id);
  const selectedValues = currentValue?.values || [];

  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#EAB308',
    purple: '#A855F7',
    pink: '#EC4899',
    orange: '#F97316',
    gray: '#6B7280',
    brown: '#92400E',
    navy: '#1E3A8A',
  };

  return (
    <div className="flex flex-wrap gap-2" data-testid={`color-filter-${filter.id}`}>
      {filter.options?.map((option) => {
        const color = colorMap[option.id.toLowerCase()] || option.id;
        const isSelected = selectedValues.includes(option.id);

        return (
          <button
            key={option.id}
            onClick={() => toggleFilterValue(filter.id, option.id)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300',
              option.disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ backgroundColor: color }}
            title={option.label}
            disabled={option.disabled}
            aria-label={`${option.label}${isSelected ? ' (selected)' : ''}`}
            data-testid={`color-option-${filter.id}-${option.id}`}
          />
        );
      })}
    </div>
  );
}

// Size Filter
function SizeFilter({ filter }: FilterComponentProps) {
  const { getFilterValue, toggleFilterValue } = useFilterSort();
  const currentValue = getFilterValue(filter.id);
  const selectedValues = currentValue?.values || [];

  return (
    <div className="flex flex-wrap gap-2" data-testid={`size-filter-${filter.id}`}>
      {filter.options?.map((option) => {
        const isSelected = selectedValues.includes(option.id);

        return (
          <button
            key={option.id}
            onClick={() => !option.disabled && toggleFilterValue(filter.id, option.id)}
            className={cn(
              'px-3 py-1.5 border rounded text-sm font-medium transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400',
              option.disabled && 'opacity-50 cursor-not-allowed bg-gray-100'
            )}
            disabled={option.disabled}
            aria-pressed={isSelected}
            data-testid={`size-option-${filter.id}-${option.id}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Sort Dropdown
export interface SortDropdownProps {
  className?: string;
}

export function SortDropdown({ className }: SortDropdownProps) {
  const { availableSorts, sort, setSort } = useFilterSort();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)} data-testid="sort-dropdown">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-testid="sort-button"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span>{sort?.label || 'Sort by'}</span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-50"
          role="listbox"
          data-testid="sort-options"
        >
          {availableSorts.map((option) => (
            <button
              key={option.id}
              role="option"
              aria-selected={sort?.id === option.id}
              className={cn(
                'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg',
                sort?.id === option.id && 'bg-blue-50 text-blue-700'
              )}
              onClick={() => {
                setSort(option);
                setIsOpen(false);
              }}
              data-testid={`sort-option-${option.id}`}
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {sort?.id === option.id && (
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Active Filters Display
export interface ActiveFiltersBarProps {
  className?: string;
}

export function ActiveFiltersBar({ className }: ActiveFiltersBarProps) {
  const { filters, removeFilter, clearFilters, availableFilters, hasActiveFilters, toggleFilterValue } = useFilterSort();

  if (!hasActiveFilters) return null;

  const getFilterLabel = (filterId: string): string => {
    return availableFilters.find((f) => f.id === filterId)?.label || filterId;
  };

  const getOptionLabel = (filterId: string, optionId: string): string => {
    const filter = availableFilters.find((f) => f.id === filterId);
    return filter?.options?.find((o) => o.id === optionId)?.label || optionId;
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} data-testid="active-filters-bar">
      <span className="text-sm text-gray-600">Active filters:</span>
      {filters.map((filter) => {
        const filterLabel = getFilterLabel(filter.filterId);

        if (filter.value.values) {
          return filter.value.values.map((value) => (
            <Badge
              key={`${filter.filterId}-${value}`}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`active-filter-${filter.filterId}-${value}`}
            >
              <span className="text-xs text-gray-500">{filterLabel}:</span>
              <span>{getOptionLabel(filter.filterId, value)}</span>
              <button
                onClick={() => {
                  const currentValues = filter.value.values || [];
                  if (currentValues.length === 1) {
                    removeFilter(filter.filterId);
                  } else {
                    toggleFilterValue(filter.filterId, value);
                  }
                }}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                aria-label={`Remove ${filterLabel}: ${getOptionLabel(filter.filterId, value)}`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Badge>
          ));
        }

        if (filter.value.min !== undefined || filter.value.max !== undefined) {
          const rangeText =
            filter.value.min !== undefined && filter.value.max !== undefined
              ? `${filter.value.min} - ${filter.value.max}`
              : filter.value.min !== undefined
              ? `≥ ${filter.value.min}`
              : `≤ ${filter.value.max}`;

          return (
            <Badge
              key={filter.filterId}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`active-filter-${filter.filterId}`}
            >
              <span className="text-xs text-gray-500">{filterLabel}:</span>
              <span>{rangeText}</span>
              <button
                onClick={() => removeFilter(filter.filterId)}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                aria-label={`Remove ${filterLabel} filter`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Badge>
          );
        }

        if (filter.value.value !== undefined) {
          const valueDisplay =
            typeof filter.value.value === 'number'
              ? `${filter.value.value}+`
              : String(filter.value.value);

          return (
            <Badge
              key={filter.filterId}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
              data-testid={`active-filter-${filter.filterId}`}
            >
              <span className="text-xs text-gray-500">{filterLabel}:</span>
              <span>{valueDisplay}</span>
              <button
                onClick={() => removeFilter(filter.filterId)}
                className="ml-1 p-0.5 hover:bg-gray-200 rounded"
                aria-label={`Remove ${filterLabel} filter`}
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Badge>
          );
        }

        return null;
      })}
      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs" data-testid="clear-all-active-filters">
        Clear all
      </Button>
    </div>
  );
}

// Mobile Filter Modal
export interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
}

export function MobileFilterModal({ isOpen, onClose, onApply }: MobileFilterModalProps) {
  const { hasActiveFilters, activeFilterCount, clearFilters } = useFilterSort();

  if (!isOpen) return null;

  const handleApply = () => {
    onApply?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" data-testid="mobile-filter-modal">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Filters & Sort</h2>
          <button onClick={onClose} aria-label="Close" data-testid="close-modal">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="font-medium mb-3">Sort</h3>
            <SortDropdown className="w-full" />
          </div>
          <FilterPanel collapsible />
        </div>

        <div className="p-4 border-t flex items-center gap-3">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="flex-1" data-testid="modal-clear-filters">
              Clear ({activeFilterCount})
            </Button>
          )}
          <Button onClick={handleApply} className="flex-1" data-testid="modal-apply-filters">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

// Filter Toggle Button (for mobile)
export interface FilterToggleButtonProps {
  className?: string;
  onClick: () => void;
}

export function FilterToggleButton({ className, onClick }: FilterToggleButtonProps) {
  const { activeFilterCount, hasActiveFilters } = useFilterSort();

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn('flex items-center gap-2', className)}
      data-testid="filter-toggle-button"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
      <span>Filters</span>
      {hasActiveFilters && (
        <Badge variant="secondary" className="ml-1">
          {activeFilterCount}
        </Badge>
      )}
    </Button>
  );
}

// Main Component
export interface FilterSortProps {
  availableFilters: FilterDefinition[];
  availableSorts: SortOption[];
  defaultSort?: SortOption;
  onChange?: (filters: ActiveFilter[], sort: SortOption | null) => void;
  className?: string;
  showMobileToggle?: boolean;
}

export function FilterSort({
  availableFilters,
  availableSorts,
  defaultSort,
  onChange,
  className,
  showMobileToggle = true,
}: FilterSortProps) {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  return (
    <FilterSortProvider
      availableFilters={availableFilters}
      availableSorts={availableSorts}
      defaultSort={defaultSort}
      onChange={onChange}
    >
      <div className={cn('space-y-4', className)} data-testid="filter-sort">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          <ActiveFiltersBar />
          <SortDropdown />
        </div>

        {/* Mobile Layout */}
        {showMobileToggle && (
          <div className="md:hidden flex items-center gap-2">
            <FilterToggleButton onClick={() => setMobileModalOpen(true)} className="flex-1" />
            <SortDropdown />
          </div>
        )}

        {/* Mobile Modal */}
        <MobileFilterModal isOpen={mobileModalOpen} onClose={() => setMobileModalOpen(false)} />
      </div>
    </FilterSortProvider>
  );
}
