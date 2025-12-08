'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Bookmark, ShoppingCart, Trash2, MoveRight, Clock, ArrowRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface SavedItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  quantity: number;
  savedAt: number;
  variant?: string;
  inStock?: boolean;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  quantity: number;
  variant?: string;
}

interface SaveForLaterState {
  // State
  savedItems: SavedItem[];
  isLoading: boolean;

  // Actions
  saveForLater: (item: CartItem) => void;
  moveToCart: (itemId: string) => void;
  removeFromSaved: (itemId: string) => void;
  getSavedItem: (productId: string) => SavedItem | undefined;
  isItemSaved: (productId: string) => boolean;
  clearSaved: () => void;
  updateSavedItemQuantity: (itemId: string, quantity: number) => void;
}

interface SaveForLaterProviderProps {
  children: ReactNode;
  onMoveToCart?: (item: SavedItem) => void;
  onSaveForLater?: (item: CartItem) => void;
  onRemove?: (itemId: string) => void;
  initialItems?: SavedItem[];
  storageKey?: string;
}

// ============================================================================
// Context
// ============================================================================

const SaveForLaterContext = createContext<SaveForLaterState | null>(null);

export function useSaveForLater(): SaveForLaterState {
  const context = useContext(SaveForLaterContext);
  if (!context) {
    throw new Error('useSaveForLater must be used within a SaveForLaterProvider');
  }
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimeSince(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'just now';
}

function loadFromStorage(key: string): SavedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, items: SavedItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage full or unavailable
  }
}

// ============================================================================
// Provider Component
// ============================================================================

export function SaveForLaterProvider({
  children,
  onMoveToCart,
  onSaveForLater,
  onRemove,
  initialItems = [],
  storageKey = 'saved-for-later',
}: SaveForLaterProviderProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    const stored = loadFromStorage(storageKey);
    return stored.length > 0 ? stored : initialItems;
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveForLater = useCallback(
    (item: CartItem) => {
      setIsLoading(true);

      const savedItem: SavedItem = {
        id: `saved-${item.productId}-${Date.now()}`,
        productId: item.productId,
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        variant: item.variant,
        savedAt: Date.now(),
        inStock: true,
      };

      setSavedItems((prev) => {
        // Don't add duplicates - update quantity instead
        const existingIndex = prev.findIndex((i) => i.productId === item.productId);
        let newItems: SavedItem[];

        if (existingIndex >= 0) {
          newItems = [...prev];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
            savedAt: Date.now(),
          };
        } else {
          newItems = [...prev, savedItem];
        }

        saveToStorage(storageKey, newItems);
        return newItems;
      });

      onSaveForLater?.(item);
      setIsLoading(false);
    },
    [onSaveForLater, storageKey]
  );

  const moveToCart = useCallback(
    (itemId: string) => {
      setIsLoading(true);

      const item = savedItems.find((i) => i.id === itemId);
      if (item) {
        setSavedItems((prev) => {
          const newItems = prev.filter((i) => i.id !== itemId);
          saveToStorage(storageKey, newItems);
          return newItems;
        });
        onMoveToCart?.(item);
      }

      setIsLoading(false);
    },
    [savedItems, onMoveToCart, storageKey]
  );

  const removeFromSaved = useCallback(
    (itemId: string) => {
      setSavedItems((prev) => {
        const newItems = prev.filter((i) => i.id !== itemId);
        saveToStorage(storageKey, newItems);
        return newItems;
      });
      onRemove?.(itemId);
    },
    [onRemove, storageKey]
  );

  const getSavedItem = useCallback(
    (productId: string) => {
      return savedItems.find((i) => i.productId === productId);
    },
    [savedItems]
  );

  const isItemSaved = useCallback(
    (productId: string) => {
      return savedItems.some((i) => i.productId === productId);
    },
    [savedItems]
  );

  const clearSaved = useCallback(() => {
    setSavedItems([]);
    saveToStorage(storageKey, []);
  }, [storageKey]);

  const updateSavedItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) return;

      setSavedItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveToStorage(storageKey, newItems);
        return newItems;
      });
    },
    [storageKey]
  );

  const value: SaveForLaterState = {
    savedItems,
    isLoading,
    saveForLater,
    moveToCart,
    removeFromSaved,
    getSavedItem,
    isItemSaved,
    clearSaved,
    updateSavedItemQuantity,
  };

  return <SaveForLaterContext.Provider value={value}>{children}</SaveForLaterContext.Provider>;
}

// ============================================================================
// Save For Later Button
// ============================================================================

interface SaveForLaterButtonProps {
  item: CartItem;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onSaved?: () => void;
}

export function SaveForLaterButton({
  item,
  className,
  variant = 'ghost',
  size = 'sm',
  onSaved,
}: SaveForLaterButtonProps) {
  const { saveForLater, isItemSaved, isLoading } = useSaveForLater();

  const isSaved = isItemSaved(item.productId);

  const handleClick = () => {
    if (!isSaved) {
      saveForLater(item);
      onSaved?.();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-1', className)}
      onClick={handleClick}
      disabled={isLoading || isSaved}
      data-testid="save-for-later-button"
      aria-label={isSaved ? 'Already saved for later' : 'Save for later'}
    >
      <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} aria-hidden="true" />
      {isSaved ? 'Saved' : 'Save for Later'}
    </Button>
  );
}

// ============================================================================
// Saved Item Card
// ============================================================================

interface SavedItemCardProps {
  item: SavedItem;
  className?: string;
  showTimestamp?: boolean;
  onMoveToCart?: () => void;
  onRemove?: () => void;
}

export function SavedItemCard({
  item,
  className,
  showTimestamp = true,
  onMoveToCart,
  onRemove,
}: SavedItemCardProps) {
  const { moveToCart, removeFromSaved, updateSavedItemQuantity, isLoading } = useSaveForLater();

  const handleMoveToCart = () => {
    moveToCart(item.id);
    onMoveToCart?.();
  };

  const handleRemove = () => {
    removeFromSaved(item.id);
    onRemove?.();
  };

  const hasDiscount = item.originalPrice && item.originalPrice > item.price;
  const discountPercent = hasDiscount
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  return (
    <div
      className={cn(
        'flex gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900',
        !item.inStock && 'opacity-60',
        className
      )}
      data-testid={`saved-item-${item.id}`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20 relative">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded"
            data-testid={`saved-item-image-${item.id}`}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
        )}
        {!item.inStock && (
          <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center">
            <span className="text-xs text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium text-gray-900 dark:text-gray-100 truncate"
          data-testid={`saved-item-name-${item.id}`}
        >
          {item.name}
        </h3>

        {item.variant && <p className="text-sm text-gray-500 mt-0.5">{item.variant}</p>}

        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold" data-testid={`saved-item-price-${item.id}`}>
            ${item.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-500 line-through">${item.originalPrice!.toFixed(2)}</span>
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                -{discountPercent}%
              </span>
            </>
          )}
        </div>

        {showTimestamp && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1" data-testid={`saved-item-timestamp-${item.id}`}>
            <Clock className="h-3 w-3" aria-hidden="true" />
            Saved {formatTimeSince(item.savedAt)}
          </p>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Qty:</span>
          <select
            value={item.quantity}
            onChange={(e) => updateSavedItemQuantity(item.id, parseInt(e.target.value, 10))}
            className="text-sm border rounded px-2 py-1"
            data-testid={`saved-item-quantity-${item.id}`}
            disabled={!item.inStock}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            onClick={handleMoveToCart}
            disabled={isLoading || !item.inStock}
            className="gap-1"
            data-testid={`move-to-cart-${item.id}`}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Move to Cart
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            data-testid={`remove-saved-${item.id}`}
            aria-label="Remove from saved items"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Saved Items List
// ============================================================================

interface SavedItemsListProps {
  className?: string;
  showTimestamp?: boolean;
  emptyMessage?: string;
  onMoveToCart?: (item: SavedItem) => void;
  onRemove?: (itemId: string) => void;
}

export function SavedItemsList({
  className,
  showTimestamp = true,
  emptyMessage = 'No items saved for later',
  onMoveToCart,
  onRemove,
}: SavedItemsListProps) {
  const { savedItems, clearSaved } = useSaveForLater();

  if (savedItems.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} data-testid="saved-items-empty">
        <Bookmark className="h-12 w-12 mx-auto text-gray-300 mb-3" aria-hidden="true" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="saved-items-list">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bookmark className="h-5 w-5" aria-hidden="true" />
          Saved for Later
          <span className="text-sm font-normal text-gray-500" data-testid="saved-items-count">
            ({savedItems.length} {savedItems.length === 1 ? 'item' : 'items'})
          </span>
        </h2>
        {savedItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearSaved} data-testid="clear-all-saved">
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {savedItems.map((item) => (
          <SavedItemCard
            key={item.id}
            item={item}
            showTimestamp={showTimestamp}
            onMoveToCart={() => onMoveToCart?.(item)}
            onRemove={() => onRemove?.(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Saved Items Summary
// ============================================================================

interface SavedItemsSummaryProps {
  className?: string;
  maxItems?: number;
  onViewAll?: () => void;
}

export function SavedItemsSummary({ className, maxItems = 3, onViewAll }: SavedItemsSummaryProps) {
  const { savedItems } = useSaveForLater();

  if (savedItems.length === 0) {
    return null;
  }

  const displayItems = savedItems.slice(0, maxItems);
  const remainingCount = savedItems.length - maxItems;

  return (
    <div className={cn('bg-gray-50 dark:bg-gray-800 rounded-lg p-4', className)} data-testid="saved-items-summary">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium flex items-center gap-2">
          <Bookmark className="h-4 w-4" aria-hidden="true" />
          Saved for Later
          <span className="text-sm text-gray-500">({savedItems.length})</span>
        </h3>
        {onViewAll && (
          <Button variant="link" size="sm" onClick={onViewAll} className="gap-1" data-testid="view-all-saved">
            View All
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="w-12 h-12 rounded overflow-hidden bg-white border"
            data-testid={`summary-item-${item.id}`}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Inline Save Button (for cart item rows)
// ============================================================================

interface InlineSaveButtonProps {
  item: CartItem;
  className?: string;
  onSaved?: () => void;
}

export function InlineSaveButton({ item, className, onSaved }: InlineSaveButtonProps) {
  const { saveForLater, isItemSaved, isLoading } = useSaveForLater();

  const isSaved = isItemSaved(item.productId);

  const handleClick = () => {
    if (!isSaved) {
      saveForLater(item);
      onSaved?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isSaved}
      className={cn(
        'text-sm text-gray-600 hover:text-primary flex items-center gap-1 transition-colors',
        isSaved && 'text-primary cursor-not-allowed',
        isLoading && 'opacity-50',
        className
      )}
      data-testid="inline-save-button"
      aria-label={isSaved ? 'Already saved for later' : 'Save for later'}
    >
      <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} aria-hidden="true" />
      {isSaved ? 'Saved' : 'Save for Later'}
    </button>
  );
}

// ============================================================================
// Move to Saved Confirmation Toast
// ============================================================================

interface SavedToastProps {
  item: SavedItem;
  className?: string;
  onUndo?: () => void;
  onViewSaved?: () => void;
  onDismiss?: () => void;
}

export function SavedToast({ item, className, onUndo, onViewSaved, onDismiss }: SavedToastProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-4',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="saved-toast"
    >
      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
        <Bookmark className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" data-testid="saved-toast-title">
          Saved for Later
        </p>
        <p className="text-sm text-gray-500 truncate" data-testid="saved-toast-message">
          {item.name}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onUndo && (
          <Button size="sm" variant="ghost" onClick={onUndo} data-testid="saved-toast-undo">
            Undo
          </Button>
        )}
        {onViewSaved && (
          <Button size="sm" variant="outline" onClick={onViewSaved} className="gap-1" data-testid="saved-toast-view">
            View Saved
            <MoveRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Dismiss"
            data-testid="saved-toast-dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Cart Item with Save Option
// ============================================================================

interface CartItemWithSaveProps {
  item: CartItem;
  className?: string;
  onRemove?: () => void;
  onQuantityChange?: (quantity: number) => void;
  onSaved?: () => void;
}

export function CartItemWithSave({
  item,
  className,
  onRemove,
  onQuantityChange,
  onSaved,
}: CartItemWithSaveProps) {
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div
      className={cn('flex gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900', className)}
      data-testid={`cart-item-${item.id}`}
    >
      {/* Product Image */}
      <div className="flex-shrink-0 w-20 h-20">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>

        {item.variant && <p className="text-sm text-gray-500 mt-0.5">{item.variant}</p>}

        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold">${item.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 line-through">${item.originalPrice!.toFixed(2)}</span>
          )}
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-600">Qty:</span>
          <select
            value={item.quantity}
            onChange={(e) => onQuantityChange?.(parseInt(e.target.value, 10))}
            className="text-sm border rounded px-2 py-1"
            data-testid={`cart-item-quantity-${item.id}`}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <InlineSaveButton item={item} onSaved={onSaved} />
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 flex items-center gap-1"
              data-testid={`remove-cart-item-${item.id}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Line Total */}
      <div className="text-right">
        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
}
