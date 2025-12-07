import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecentlyViewed, useRecordProductView } from './useRecentlyViewed';
import * as recentlyViewedApi from '@/lib/api/recentlyViewed';
import * as userStore from '@/store/userStore';
import type { Product } from '@/lib/api/types';

// Mock the API module
vi.mock('@/lib/api/recentlyViewed', () => ({
  recentlyViewedApi: {
    recordView: vi.fn(),
    getProducts: vi.fn(),
    getProductIds: vi.fn(),
    getCount: vi.fn(),
    isViewed: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    merge: vi.fn(),
  },
}));

// Mock the user store
vi.mock('@/store/userStore', () => ({
  useUserStore: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock product data
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    name: 'Test Product 1',
    description: 'Description 1',
    sku: 'SKU-1',
    price: 99.99,
    category: 'Electronics',
    tags: [],
    images: [],
    attributes: {},
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    tenantId: 'tenant-1',
    name: 'Test Product 2',
    description: 'Description 2',
    sku: 'SKU-2',
    price: 149.99,
    category: 'Electronics',
    tags: [],
    images: [],
    attributes: {},
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(userStore.useUserStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: vi.fn(),
      setToken: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    vi.mocked(recentlyViewedApi.recentlyViewedApi.getProducts).mockResolvedValue(mockProducts);
    vi.mocked(recentlyViewedApi.recentlyViewedApi.getCount).mockResolvedValue(2);
    vi.mocked(recentlyViewedApi.recentlyViewedApi.recordView).mockResolvedValue(undefined);
    vi.mocked(recentlyViewedApi.recentlyViewedApi.remove).mockResolvedValue(undefined);
    vi.mocked(recentlyViewedApi.recentlyViewedApi.clear).mockResolvedValue(undefined);
    vi.mocked(recentlyViewedApi.recentlyViewedApi.merge).mockResolvedValue(undefined);

    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty products when autoFetch is false', () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));

      expect(result.current.products).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.count).toBe(0);
    });

    it('should auto-fetch products on mount by default', async () => {
      const { result } = renderHook(() => useRecentlyViewed());

      await waitFor(() => {
        expect(result.current.products).toEqual(mockProducts);
      });

      expect(recentlyViewedApi.recentlyViewedApi.getProducts).toHaveBeenCalled();
    });

    it('should not auto-fetch when autoFetch is false', () => {
      renderHook(() => useRecentlyViewed({ autoFetch: false }));

      expect(recentlyViewedApi.recentlyViewedApi.getProducts).not.toHaveBeenCalled();
    });
  });

  describe('Guest User Handling', () => {
    it('should generate a guest ID for anonymous users', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderHook(() => useRecentlyViewed());

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'guest_session_id',
          expect.stringMatching(/^guest-\d+-[a-z0-9]+$/)
        );
      });
    });

    it('should reuse existing guest ID', async () => {
      localStorageMock.getItem.mockReturnValue('guest-123-abc');

      renderHook(() => useRecentlyViewed());

      await waitFor(() => {
        expect(recentlyViewedApi.recentlyViewedApi.getProducts).toHaveBeenCalledWith(
          'guest-123-abc',
          10
        );
      });
    });
  });

  describe('Authenticated User', () => {
    it('should use authenticated user ID', async () => {
      vi.mocked(userStore.useUserStore).mockReturnValue({
        user: { id: 'user-123', email: 'test@test.com' } as Product & { id: string; email: string },
        token: 'token',
        isAuthenticated: true,
        setUser: vi.fn(),
        setToken: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderHook(() => useRecentlyViewed());

      await waitFor(() => {
        expect(recentlyViewedApi.recentlyViewedApi.getProducts).toHaveBeenCalledWith(
          'user-123',
          10
        );
      });
    });
  });

  describe('recordView', () => {
    it('should record a product view', async () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));

      await act(async () => {
        await result.current.recordView('prod-new');
      });

      expect(recentlyViewedApi.recentlyViewedApi.recordView).toHaveBeenCalledWith(
        expect.any(String),
        'prod-new'
      );
    });
  });

  describe('Limit Option', () => {
    it('should pass limit to API call', async () => {
      renderHook(() => useRecentlyViewed({ limit: 5 }));

      await waitFor(() => {
        expect(recentlyViewedApi.recentlyViewedApi.getProducts).toHaveBeenCalledWith(
          expect.any(String),
          5
        );
      });
    });
  });

  describe('Hook Functions', () => {
    it('should provide remove function', () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));
      expect(typeof result.current.remove).toBe('function');
    });

    it('should provide clear function', () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));
      expect(typeof result.current.clear).toBe('function');
    });

    it('should provide refresh function', () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should provide isViewed function', () => {
      const { result } = renderHook(() => useRecentlyViewed({ autoFetch: false }));
      expect(typeof result.current.isViewed).toBe('function');
    });
  });
});

describe('useRecordProductView', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(userStore.useUserStore).mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: vi.fn(),
      setToken: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    vi.mocked(recentlyViewedApi.recentlyViewedApi.recordView).mockResolvedValue(undefined);
    localStorageMock.getItem.mockReturnValue('guest-123');
  });

  it('should record product view on mount', async () => {
    renderHook(() => useRecordProductView('prod-123'));

    await waitFor(() => {
      expect(recentlyViewedApi.recentlyViewedApi.recordView).toHaveBeenCalledWith(
        'guest-123',
        'prod-123'
      );
    });
  });

  it('should not record view if productId is undefined', () => {
    renderHook(() => useRecordProductView(undefined));

    expect(recentlyViewedApi.recentlyViewedApi.recordView).not.toHaveBeenCalled();
  });

  it('should only record view once per mount', async () => {
    const { rerender } = renderHook(() => useRecordProductView('prod-123'));

    await waitFor(() => {
      expect(recentlyViewedApi.recentlyViewedApi.recordView).toHaveBeenCalledTimes(1);
    });

    // Rerender shouldn't trigger another record
    rerender();

    expect(recentlyViewedApi.recentlyViewedApi.recordView).toHaveBeenCalledTimes(1);
  });
});
