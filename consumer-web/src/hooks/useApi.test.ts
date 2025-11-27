import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApi, useApiOnMount } from './useApi';
import type { AxiosError } from 'axios';

describe('useApi', () => {
  it('should initialize with null data, no loading, and no error', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApi(mockApiFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should provide execute function', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApi(mockApiFunction));

    expect(typeof result.current.execute).toBe('function');
  });

  it('should provide reset function', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApi(mockApiFunction));

    expect(typeof result.current.reset).toBe('function');
  });
});

describe('useApi - execute', () => {
  it('should set loading to true when executing', async () => {
    const mockApiFunction = vi.fn(() => new Promise(() => {}));
    const { result } = renderHook(() => useApi(mockApiFunction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);
  });

  it('should call API function with provided arguments', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute('arg1', 'arg2', 123);
    });

    expect(mockApiFunction).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should set data when API call succeeds', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return data when API call succeeds', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(mockApiFunction));

    let returnedData;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(returnedData).toEqual(mockData);
  });

  it('should set error when API call fails', async () => {
    const mockError = {
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    };
    const axiosError = {
      response: {
        data: mockError,
      },
    } as AxiosError;

    const mockApiFunction = vi.fn().mockRejectedValue(axiosError);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });

  it('should throw error when API call fails', async () => {
    const mockError = {
      error: 'Server Error',
      message: 'Internal server error',
      statusCode: 500,
    };
    const axiosError = {
      response: {
        data: mockError,
      },
    } as AxiosError;

    const mockApiFunction = vi.fn().mockRejectedValue(axiosError);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await expect(result.current.execute()).rejects.toEqual(mockError);
    });
  });

  it('should handle unknown errors', async () => {
    const mockApiFunction = vi.fn().mockRejectedValue(new Error('Unknown error'));
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.error).toEqual({
      error: 'Unknown Error',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  });

  it('should clear previous data when executing again', async () => {
    const mockApiFunction = vi
      .fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });

    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ id: 1 });

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ id: 2 });
  });

  it('should clear previous error when executing again', async () => {
    const mockError = {
      error: 'Error',
      message: 'An error',
      statusCode: 400,
    };
    const axiosError = {
      response: {
        data: mockError,
      },
    } as AxiosError;

    const mockApiFunction = vi
      .fn()
      .mockRejectedValueOnce(axiosError)
      .mockResolvedValueOnce({ id: 1 });

    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.error).toEqual(mockError);

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ id: 1 });
  });
});

describe('useApi - reset', () => {
  it('should reset state to initial values', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toEqual({ id: 1, name: 'Test' });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should clear error state', async () => {
    const mockError = {
      error: 'Error',
      message: 'An error',
      statusCode: 400,
    };
    const axiosError = {
      response: {
        data: mockError,
      },
    } as AxiosError;

    const mockApiFunction = vi.fn().mockRejectedValue(axiosError);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (err) {
        // Expected to throw
      }
    });

    expect(result.current.error).toEqual(mockError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
  });
});

describe('useApiOnMount', () => {
  it('should initialize with null data and loading true', () => {
    const mockApiFunction = vi.fn(() => new Promise(() => {}));
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should call API function on mount', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ id: 1 });
    renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalledTimes(1);
    });
  });

  it('should set data when API call succeeds', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error when API call fails', async () => {
    const mockError = {
      error: 'Not Found',
      message: 'Resource not found',
      statusCode: 404,
    };
    const axiosError = {
      response: {
        data: mockError,
      },
    } as AxiosError;

    const mockApiFunction = vi.fn().mockRejectedValue(axiosError);
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(result.current.error).toEqual(mockError);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle unknown errors', async () => {
    const mockApiFunction = vi.fn().mockRejectedValue(new Error('Unknown error'));
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(result.current.error).toEqual({
        error: 'Unknown Error',
        message: 'An unexpected error occurred',
        statusCode: 500,
      });
    });
  });

  it('should provide refetch function', () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('should refetch data when refetch is called', async () => {
    const mockApiFunction = vi
      .fn()
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2 });

    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 2 });
    });

    expect(mockApiFunction).toHaveBeenCalledTimes(2);
  });

  it('should set loading to true when refetching', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useApiOnMount(mockApiFunction));

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
    });

    act(() => {
      result.current.refetch();
    });

    expect(result.current.loading).toBe(true);
  });
});

describe('useApi - Type Safety', () => {
  it('should work with typed data', async () => {
    interface User {
      id: number;
      email: string;
      name: string;
    }

    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockApiFunction = vi.fn().mockResolvedValue(mockUser);
    const { result } = renderHook(() => useApi<User>(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.email).toBe('test@example.com');
    expect(result.current.data?.name).toBe('Test User');
  });

  it('should work with typed arguments', async () => {
    interface SearchParams {
      query: string;
      limit: number;
    }

    const mockApiFunction = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() =>
      useApi<unknown[], [SearchParams]>(mockApiFunction)
    );

    await act(async () => {
      await result.current.execute({ query: 'test', limit: 10 });
    });

    expect(mockApiFunction).toHaveBeenCalledWith({ query: 'test', limit: 10 });
  });
});
