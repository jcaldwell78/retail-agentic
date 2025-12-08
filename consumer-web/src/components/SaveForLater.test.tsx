import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SaveForLaterProvider,
  useSaveForLater,
  SaveForLaterButton,
  SavedItemCard,
  SavedItemsList,
  SavedItemsSummary,
  InlineSaveButton,
  SavedToast,
  CartItemWithSave,
} from './SaveForLater';

// Mock localStorage
const localStorageMock = (() => {
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
    _reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test data
const mockCartItem = {
  id: 'cart-1',
  productId: 'prod-1',
  name: 'Wireless Headphones',
  price: 99.99,
  originalPrice: 129.99,
  imageUrl: '/img/headphones.jpg',
  quantity: 1,
  variant: 'Black',
};

// const mockCartItem2 = {
//   id: 'cart-2',
//   productId: 'prod-2',
//   name: 'Phone Case',
//   price: 19.99,
//   quantity: 2,
// };

const mockSavedItem = {
  id: 'saved-prod-1-123',
  productId: 'prod-1',
  name: 'Wireless Headphones',
  price: 99.99,
  originalPrice: 129.99,
  imageUrl: '/img/headphones.jpg',
  quantity: 1,
  variant: 'Black',
  savedAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
  inStock: true,
};

const mockSavedItem2 = {
  id: 'saved-prod-2-456',
  productId: 'prod-2',
  name: 'Phone Case',
  price: 19.99,
  quantity: 2,
  savedAt: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
  inStock: true,
};

const mockSavedItemOutOfStock = {
  id: 'saved-prod-3-789',
  productId: 'prod-3',
  name: 'USB Cable',
  price: 9.99,
  quantity: 1,
  savedAt: Date.now(),
  inStock: false,
};

// Helper component to expose context values for testing
function TestConsumer() {
  const state = useSaveForLater();
  return (
    <div>
      <span data-testid="saved-count">{state.savedItems.length}</span>
      <span data-testid="is-loading">{String(state.isLoading)}</span>
      <button data-testid="clear-btn" onClick={state.clearSaved}>
        Clear
      </button>
      <button data-testid="save-item-btn" onClick={() => state.saveForLater(mockCartItem)}>
        Save Item
      </button>
      <span data-testid="is-saved">{String(state.isItemSaved(mockCartItem.productId))}</span>
    </div>
  );
}

describe('SaveForLater', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock._reset();
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  describe('SaveForLaterProvider', () => {
    it('should provide context values', () => {
      render(
        <SaveForLaterProvider>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestConsumer />)).toThrow(
        'useSaveForLater must be used within a SaveForLaterProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should save item for later', () => {
      render(
        <SaveForLaterProvider>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');

      fireEvent.click(screen.getByTestId('save-item-btn'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');
      expect(screen.getByTestId('is-saved')).toHaveTextContent('true');
    });

    it('should call onSaveForLater callback', () => {
      const onSaveForLater = vi.fn();

      render(
        <SaveForLaterProvider onSaveForLater={onSaveForLater}>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('save-item-btn'));

      expect(onSaveForLater).toHaveBeenCalledWith(mockCartItem);
    });

    it('should clear all saved items', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId('clear-btn'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');
    });

    it('should load initial items', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem, mockSavedItem2]}>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('2');
    });

    it('should persist to localStorage', () => {
      render(
        <SaveForLaterProvider storageKey="test-saved">
          <TestConsumer />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('save-item-btn'));

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-saved',
        expect.stringContaining(mockCartItem.productId)
      );
    });

    it('should not add duplicate items', () => {
      render(
        <SaveForLaterProvider>
          <TestConsumer />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('save-item-btn'));
      fireEvent.click(screen.getByTestId('save-item-btn'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');
    });
  });

  describe('SaveForLaterButton', () => {
    it('should render button', () => {
      render(
        <SaveForLaterProvider>
          <SaveForLaterButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('save-for-later-button')).toBeInTheDocument();
      expect(screen.getByTestId('save-for-later-button')).toHaveTextContent('Save for Later');
    });

    it('should save item when clicked', () => {
      render(
        <SaveForLaterProvider>
          <TestConsumer />
          <SaveForLaterButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('save-for-later-button'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');
    });

    it('should show saved state', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SaveForLaterButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      const button = screen.getByTestId('save-for-later-button');
      expect(button).toHaveTextContent('Saved');
      expect(button).toBeDisabled();
    });

    it('should call onSaved callback', () => {
      const onSaved = vi.fn();

      render(
        <SaveForLaterProvider>
          <SaveForLaterButton item={mockCartItem} onSaved={onSaved} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('save-for-later-button'));

      expect(onSaved).toHaveBeenCalled();
    });
  });

  describe('SavedItemCard', () => {
    it('should render item details', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`saved-item-${mockSavedItem.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`saved-item-name-${mockSavedItem.id}`)).toHaveTextContent('Wireless Headphones');
      expect(screen.getByTestId(`saved-item-price-${mockSavedItem.id}`)).toHaveTextContent('$99.99');
    });

    it('should display image', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`saved-item-image-${mockSavedItem.id}`)).toBeInTheDocument();
    });

    it('should display timestamp', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} showTimestamp />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`saved-item-timestamp-${mockSavedItem.id}`)).toBeInTheDocument();
    });

    it('should show discount badge', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByText('-23%')).toBeInTheDocument();
    });

    it('should have Move to Cart button', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`move-to-cart-${mockSavedItem.id}`)).toBeInTheDocument();
    });

    it('should have Remove button', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`remove-saved-${mockSavedItem.id}`)).toBeInTheDocument();
    });

    it('should move item to cart', () => {
      const onMoveToCart = vi.fn();

      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]} onMoveToCart={onMoveToCart}>
          <TestConsumer />
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId(`move-to-cart-${mockSavedItem.id}`));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');
      expect(onMoveToCart).toHaveBeenCalled();
    });

    it('should remove item', () => {
      const onRemove = vi.fn();

      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]} onRemove={onRemove}>
          <TestConsumer />
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId(`remove-saved-${mockSavedItem.id}`));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');
      expect(onRemove).toHaveBeenCalledWith(mockSavedItem.id);
    });

    it('should show out of stock state', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItemOutOfStock]}>
          <SavedItemCard item={mockSavedItemOutOfStock} />
        </SaveForLaterProvider>
      );

      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
      expect(screen.getByTestId(`move-to-cart-${mockSavedItemOutOfStock.id}`)).toBeDisabled();
    });

    it('should update quantity', () => {
      // Use a custom consumer to verify state updates
      const QuantityChecker = () => {
        const { savedItems } = useSaveForLater();
        const item = savedItems.find(i => i.id === mockSavedItem.id);
        return <span data-testid="current-quantity">{item?.quantity || 0}</span>;
      };

      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <QuantityChecker />
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('current-quantity')).toHaveTextContent('1');

      const select = screen.getByTestId(`saved-item-quantity-${mockSavedItem.id}`);
      fireEvent.change(select, { target: { value: '3' } });

      expect(screen.getByTestId('current-quantity')).toHaveTextContent('3');
    });
  });

  describe('SavedItemsList', () => {
    it('should render empty state', () => {
      render(
        <SaveForLaterProvider>
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-items-empty')).toBeInTheDocument();
      expect(screen.getByText('No items saved for later')).toBeInTheDocument();
    });

    it('should render list of items', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem, mockSavedItem2]}>
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-items-list')).toBeInTheDocument();
      expect(screen.getByTestId(`saved-item-${mockSavedItem.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`saved-item-${mockSavedItem2.id}`)).toBeInTheDocument();
    });

    it('should display item count', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem, mockSavedItem2]}>
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-items-count')).toHaveTextContent('(2 items)');
    });

    it('should have Clear All button', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('clear-all-saved')).toBeInTheDocument();
    });

    it('should clear all items', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem, mockSavedItem2]}>
          <TestConsumer />
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-count')).toHaveTextContent('2');

      fireEvent.click(screen.getByTestId('clear-all-saved'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('0');
    });

    it('should use custom empty message', () => {
      render(
        <SaveForLaterProvider>
          <SavedItemsList emptyMessage="Your wishlist is empty" />
        </SaveForLaterProvider>
      );

      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
    });
  });

  describe('SavedItemsSummary', () => {
    it('should not render when no items', () => {
      render(
        <SaveForLaterProvider>
          <SavedItemsSummary />
        </SaveForLaterProvider>
      );

      expect(screen.queryByTestId('saved-items-summary')).not.toBeInTheDocument();
    });

    it('should render summary', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem, mockSavedItem2]}>
          <SavedItemsSummary />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-items-summary')).toBeInTheDocument();
    });

    it('should display item thumbnails', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemsSummary />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`summary-item-${mockSavedItem.id}`)).toBeInTheDocument();
    });

    it('should respect maxItems prop', () => {
      const items = [mockSavedItem, mockSavedItem2, mockSavedItemOutOfStock];

      render(
        <SaveForLaterProvider initialItems={items}>
          <SavedItemsSummary maxItems={2} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`summary-item-${mockSavedItem.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`summary-item-${mockSavedItem2.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`summary-item-${mockSavedItemOutOfStock.id}`)).not.toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });

    it('should have View All button when callback provided', () => {
      const onViewAll = vi.fn();

      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemsSummary onViewAll={onViewAll} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('view-all-saved')).toBeInTheDocument();
    });

    it('should call onViewAll when clicked', () => {
      const onViewAll = vi.fn();

      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemsSummary onViewAll={onViewAll} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('view-all-saved'));

      expect(onViewAll).toHaveBeenCalled();
    });
  });

  describe('InlineSaveButton', () => {
    it('should render button', () => {
      render(
        <SaveForLaterProvider>
          <InlineSaveButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('inline-save-button')).toBeInTheDocument();
    });

    it('should save item when clicked', () => {
      render(
        <SaveForLaterProvider>
          <TestConsumer />
          <InlineSaveButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('inline-save-button'));

      expect(screen.getByTestId('saved-count')).toHaveTextContent('1');
    });

    it('should show saved state', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <InlineSaveButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('inline-save-button')).toHaveTextContent('Saved');
    });

    it('should call onSaved callback', () => {
      const onSaved = vi.fn();

      render(
        <SaveForLaterProvider>
          <InlineSaveButton item={mockCartItem} onSaved={onSaved} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('inline-save-button'));

      expect(onSaved).toHaveBeenCalled();
    });
  });

  describe('SavedToast', () => {
    it('should render toast', () => {
      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-toast')).toBeInTheDocument();
      expect(screen.getByTestId('saved-toast-title')).toHaveTextContent('Saved for Later');
      expect(screen.getByTestId('saved-toast-message')).toHaveTextContent(mockSavedItem.name);
    });

    it('should have role alert', () => {
      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have Undo button when callback provided', () => {
      const onUndo = vi.fn();

      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} onUndo={onUndo} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-toast-undo')).toBeInTheDocument();
    });

    it('should call onUndo when clicked', () => {
      const onUndo = vi.fn();

      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} onUndo={onUndo} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('saved-toast-undo'));

      expect(onUndo).toHaveBeenCalled();
    });

    it('should have View Saved button when callback provided', () => {
      const onViewSaved = vi.fn();

      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} onViewSaved={onViewSaved} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-toast-view')).toBeInTheDocument();
    });

    it('should have dismiss button when callback provided', () => {
      const onDismiss = vi.fn();

      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} onDismiss={onDismiss} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-toast-dismiss')).toBeInTheDocument();
    });
  });

  describe('CartItemWithSave', () => {
    it('should render cart item', () => {
      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`cart-item-${mockCartItem.id}`)).toBeInTheDocument();
      expect(screen.getByText(mockCartItem.name)).toBeInTheDocument();
    });

    it('should have inline save button', () => {
      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('inline-save-button')).toBeInTheDocument();
    });

    it('should have remove button', () => {
      const onRemove = vi.fn();

      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} onRemove={onRemove} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`remove-cart-item-${mockCartItem.id}`)).toBeInTheDocument();
    });

    it('should call onRemove when clicked', () => {
      const onRemove = vi.fn();

      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} onRemove={onRemove} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId(`remove-cart-item-${mockCartItem.id}`));

      expect(onRemove).toHaveBeenCalled();
    });

    it('should have quantity selector', () => {
      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`cart-item-quantity-${mockCartItem.id}`)).toBeInTheDocument();
    });

    it('should call onQuantityChange when changed', () => {
      const onQuantityChange = vi.fn();

      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} onQuantityChange={onQuantityChange} />
        </SaveForLaterProvider>
      );

      const select = screen.getByTestId(`cart-item-quantity-${mockCartItem.id}`);
      fireEvent.change(select, { target: { value: '3' } });

      expect(onQuantityChange).toHaveBeenCalledWith(3);
    });

    it('should call onSaved when item saved', () => {
      const onSaved = vi.fn();

      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={mockCartItem} onSaved={onSaved} />
        </SaveForLaterProvider>
      );

      fireEvent.click(screen.getByTestId('inline-save-button'));

      expect(onSaved).toHaveBeenCalled();
    });

    it('should display line total', () => {
      const itemWithQty = { ...mockCartItem, quantity: 2 };

      render(
        <SaveForLaterProvider>
          <CartItemWithSave item={itemWithQty} />
        </SaveForLaterProvider>
      );

      // 99.99 * 2 = 199.98
      expect(screen.getByText('$199.98')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on save button', () => {
      render(
        <SaveForLaterProvider>
          <SaveForLaterButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('save-for-later-button')).toHaveAttribute(
        'aria-label',
        'Save for later'
      );
    });

    it('should have proper aria-label when saved', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SaveForLaterButton item={mockCartItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('save-for-later-button')).toHaveAttribute(
        'aria-label',
        'Already saved for later'
      );
    });

    it('should have aria-live on toast', () => {
      render(
        <SaveForLaterProvider>
          <SavedToast item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-toast')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label on remove button', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemCard item={mockSavedItem} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`remove-saved-${mockSavedItem.id}`)).toHaveAttribute(
        'aria-label',
        'Remove from saved items'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle item without image', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem2]}>
          <SavedItemCard item={mockSavedItem2} />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId(`saved-item-${mockSavedItem2.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`saved-item-image-${mockSavedItem2.id}`)).not.toBeInTheDocument();
    });

    it('should handle item without original price', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem2]}>
          <SavedItemCard item={mockSavedItem2} />
        </SaveForLaterProvider>
      );

      // No discount badge should be shown
      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });

    it('should handle single item pluralization', () => {
      render(
        <SaveForLaterProvider initialItems={[mockSavedItem]}>
          <SavedItemsList />
        </SaveForLaterProvider>
      );

      expect(screen.getByTestId('saved-items-count')).toHaveTextContent('(1 item)');
    });
  });
});
