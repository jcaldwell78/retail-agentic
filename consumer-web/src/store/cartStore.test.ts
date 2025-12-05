import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCartStore } from './cartStore';
import type { Cart, CartItem } from '@/lib/api';

const mockCart: Cart = {
  id: '1',
  tenantId: 'tenant-1',
  userId: 'user-1',
  items: [
    {
      productId: 'product-1',
      productName: 'Test Product 1',
      productImage: '/test1.jpg',
      quantity: 2,
      price: 10.99,
      subtotal: 21.98,
    },
    {
      productId: 'product-2',
      productName: 'Test Product 2',
      productImage: '/test2.jpg',
      quantity: 1,
      price: 20.99,
      subtotal: 20.99,
    },
  ],
  subtotal: 42.97,
  tax: 0,
  total: 42.97,
  expiresAt: '2024-01-02T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockItem: CartItem = {
  productId: 'product-3',
  productName: 'New Product',
  productImage: '/new.jpg',
  quantity: 1,
  price: 15.99,
  subtotal: 15.99,
};

describe('useCartStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
      result.current.setLoading(false);
      result.current.setError(null);
    });
  });

  it('should initialize with null cart', () => {
    const { result } = renderHook(() => useCartStore());

    expect(result.current.cart).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should provide all required actions', () => {
    const { result } = renderHook(() => useCartStore());

    expect(typeof result.current.setCart).toBe('function');
    expect(typeof result.current.addItem).toBe('function');
    expect(typeof result.current.updateItemQuantity).toBe('function');
    expect(typeof result.current.removeItem).toBe('function');
    expect(typeof result.current.clearCart).toBe('function');
    expect(typeof result.current.setLoading).toBe('function');
    expect(typeof result.current.setError).toBe('function');
  });
});

describe('useCartStore - setCart', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should set cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setCart(mockCart);
    });

    expect(result.current.cart).toEqual(mockCart);
  });

  it('should clear error when setting cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.setCart(mockCart);
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useCartStore - addItem', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.setCart(mockCart);
    });
  });

  it('should add new item to cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem(mockItem);
    });

    expect(result.current.cart?.items).toHaveLength(3);
    expect(result.current.cart?.items[2]).toEqual(mockItem);
  });

  it('should increment quantity for existing item', () => {
    const { result } = renderHook(() => useCartStore());

    const existingItem: CartItem = {
      productId: 'product-1',
      productName: 'Test Product 1',
      productImage: '/test1.jpg',
      quantity: 1,
      price: 10.99,
      subtotal: 10.99,
    };

    act(() => {
      result.current.addItem(existingItem);
    });

    expect(result.current.cart?.items).toHaveLength(2);
    expect(result.current.cart?.items[0].quantity).toBe(3);
  });

  it('should not add item when cart is null', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.clearCart();
      result.current.addItem(mockItem);
    });

    expect(result.current.cart).toBeNull();
  });
});

describe('useCartStore - updateItemQuantity', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.setCart(mockCart);
    });
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.updateItemQuantity('product-1', 5);
    });

    const updatedItem = result.current.cart?.items.find(
      (item) => item.productId === 'product-1'
    );
    expect(updatedItem?.quantity).toBe(5);
  });

  it('should not update quantity for non-existent item', () => {
    const { result } = renderHook(() => useCartStore());

    const initialItems = result.current.cart?.items;

    act(() => {
      result.current.updateItemQuantity('non-existent', 10);
    });

    expect(result.current.cart?.items).toEqual(initialItems);
  });

  it('should not update when cart is null', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.clearCart();
      result.current.updateItemQuantity('product-1', 5);
    });

    expect(result.current.cart).toBeNull();
  });
});

describe('useCartStore - removeItem', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.setCart(mockCart);
    });
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.removeItem('product-1');
    });

    expect(result.current.cart?.items).toHaveLength(1);
    expect(result.current.cart?.items[0].productId).toBe('product-2');
  });

  it('should not remove non-existent item', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.removeItem('non-existent');
    });

    expect(result.current.cart?.items).toHaveLength(2);
  });

  it('should not remove when cart is null', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.clearCart();
      result.current.removeItem('product-1');
    });

    expect(result.current.cart).toBeNull();
  });

  it('should remove all items if called for each item', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.removeItem('product-1');
      result.current.removeItem('product-2');
    });

    expect(result.current.cart?.items).toHaveLength(0);
  });
});

describe('useCartStore - clearCart', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.setCart(mockCart);
      result.current.setError('Test error');
    });
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.cart).toBeNull();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useCartStore - setLoading', () => {
  it('should set loading to true', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);
  });

  it('should set loading to false', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setLoading(true);
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });
});

describe('useCartStore - setError', () => {
  it('should set error message', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setError('Test error');
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useCartStore - Complex Scenarios', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useCartStore());
    act(() => {
      result.current.clearCart();
    });
  });

  it('should handle multiple operations in sequence', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.setCart(mockCart);
      result.current.addItem(mockItem);
      result.current.updateItemQuantity('product-1', 10);
      result.current.removeItem('product-2');
    });

    expect(result.current.cart?.items).toHaveLength(2);
    expect(result.current.cart?.items[0].quantity).toBe(10);
    expect(result.current.cart?.items[1]).toEqual(mockItem);
  });

  it('should maintain cart state across multiple hook calls', () => {
    const { result: result1 } = renderHook(() => useCartStore());

    act(() => {
      result1.current.setCart(mockCart);
    });

    const { result: result2 } = renderHook(() => useCartStore());

    expect(result2.current.cart).toEqual(mockCart);
  });
});
